
import { v } from "convex/values";
import { internalMutation, MutationCtx } from "./_generated/server";
import { internal, api } from "./_generated/api";
import { Id, Doc } from "./_generated/dataModel";
import { createNotification } from "./notifications";

type Node = {
    id: string;
    type: string;
    data: {
        label?: string;
        content?: string;
        // action nodes
        actionType?: string; // "assign" | "tag" | "close" | "resolve"
        details?: string; // assignee label (pole/agent) or tag name
        // interactive nodes
        interactiveType?: string;
        options?: { id?: string; title?: string; label?: string; description?: string }[];
    };
};

type Edge = {
    id: string;
    source: string;
    target: string;
};

// ...

export const processMessage = internalMutation({
    args: {
        organizationId: v.id("organizations"),
        conversationId: v.id("conversations"),
        contactId: v.id("contacts"),
        messageText: v.string(),
        isFirstMessage: v.boolean(),
    },
    handler: async (ctx, args) => {
        console.log(`[ENGINE] Processing message: ${args.messageText} (First: ${args.isFirstMessage})`);

        // Get conversation to know the channel
        const conversation = await ctx.db.get(args.conversationId);
        const channelId = conversation?.whatsappChannelId;

        // 1. Fetch active flows
        const allFlows = await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) => q.eq("organizationId", args.organizationId))
            .filter((q) => q.eq(q.field("isActive"), true))
            .collect();

        // Filter: channel-specific flows first, then global flows (no channelId)
        const flows = channelId
            ? [
                ...allFlows.filter((f) => f.whatsappChannelId === channelId),
                ...allFlows.filter((f) => !f.whatsappChannelId),
              ]
            : allFlows;

        let flowExecuted = false;

        // 2. Match Flows
        if (flows.length > 0) {
            for (const flow of flows) {
                let shouldRun = false;

                if (flow.triggerType === "NEW_CONVERSATION" && args.isFirstMessage) {
                    shouldRun = true;
                } else if (flow.triggerType === "KEYWORD" && flow.triggerConfig) {
                    try {
                        const config = JSON.parse(flow.triggerConfig);
                        if (config.keywords && Array.isArray(config.keywords)) {
                            const lowerText = args.messageText.toLowerCase();
                            if (config.keywords.some((k: string) => lowerText.includes(k.toLowerCase()))) {
                                shouldRun = true;
                            }
                        }
                    } catch (e) {
                        console.error("Failed to parse trigger config", e);
                    }
                } else if (flow.triggerType === "AI_GENERATED" && args.isFirstMessage) {
                    shouldRun = true;
                }

                if (shouldRun) {
                    console.log(`[ENGINE] Executing Flow: ${flow.name} (${flow._id})`);
                    await executeFlow(ctx, flow, { ...args, whatsappChannelId: channelId });
                    flowExecuted = true;
                    break;
                }
            }
        }

        // 3. Auto-Assignment / Routing (if no flow handled it)
        if (!flowExecuted) {
            console.log("[ENGINE] No flow matched. Triggering Auto-Assignment/Routing.");
            await ctx.scheduler.runAfter(0, api.assignments.analyzeAndRoute, {
                conversationId: args.conversationId,
                organizationId: args.organizationId,
                messageText: args.messageText,
                channelPoleId: conversation?.poleId,
            });
        }
    },
});

async function executeFlow(ctx: MutationCtx, flow: Doc<"flows">, input: { conversationId: Id<"conversations">; organizationId: Id<"organizations">; contactId: Id<"contacts">; whatsappChannelId?: Id<"whatsappChannels"> }) {
    let nodes: Node[] = [];
    let edges: Edge[] = [];

    try {
        nodes = JSON.parse(flow.nodes);
        edges = JSON.parse(flow.edges);
    } catch (e) {
        console.error("Invalid JSON in flow nodes/edges", e);
        return;
    }

    if (!nodes.length) return;

    // 1. Find Start Node
    let currentNode = nodes.find(n => n.type === 'start');

    // Fallback: If no start node, find a node with no incoming edges (root)
    if (!currentNode) {
        const targetIds = new Set(edges.map(e => e.target));
        currentNode = nodes.find(n => !targetIds.has(n.id));
    }

    if (!currentNode) {
        // Fallback 2: Previous logic (find first message)
        currentNode = nodes.find(n => n.type === 'message');
    }

    if (!currentNode) {
        console.log("No valid start node found.");
        return;
    }

    console.log(`[ENGINE] Starting flow execution at node: ${currentNode.id} (${currentNode.type})`);

    // Contact verification once
    const contact = await ctx.db.get(input.contactId);
    if (!contact) {
        console.error("Contact not found for automation reply");
        return;
    }

    // 2. Traversal Loop
    const MAX_STEPS = 20;
    let step = 0;

    while (currentNode && step < MAX_STEPS) {
        step++;
        console.log(`[ENGINE] Step ${step}: Processing node ${currentNode.id} (${currentNode.type})`);

        // EXECUTE NODE LOGIC based on type
        if (currentNode.type === 'message') {
            const content = currentNode.data.content;
            if (content) {
                const messageId = await ctx.db.insert("messages", {
                    organizationId: input.organizationId,
                    conversationId: input.conversationId,
                    contactId: input.contactId,
                    type: "TEXT",
                    content: content,
                    direction: "OUTBOUND",
                    status: "PENDING",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                await ctx.db.patch(input.conversationId, {
                    lastMessageAt: Date.now(),
                    preview: `You: ${content}`,
                    updatedAt: Date.now(),
                });

                // Schedule send with slight delay to preserve order if multiple
                await ctx.scheduler.runAfter(step * 1000, internal.whatsapp_actions.sendMessage, {
                    messageId: messageId,
                    organizationId: input.organizationId,
                    whatsappChannelId: input.whatsappChannelId,
                    to: contact.phone,
                    text: content,
                    type: "text",
                });
            }
        } else if (currentNode.type === 'interactive') {
            const data = currentNode.data as any;
            const content = data.content || "Faites un choix";
            const interactiveType = data.interactiveType || "button"; // 'list' or 'button'
            const options = data.options || [];

            let interactivePayload: any = null;

            if (interactiveType === 'button') {
                interactivePayload = {
                    type: "button",
                    body: { text: content },
                    action: {
                        buttons: options.map((opt: any) => ({
                            type: "reply",
                            reply: {
                                id: opt.id || opt.title,
                                title: opt.title || opt.label || "Option"
                            }
                        }))
                    }
                };
            } else if (interactiveType === 'list') {
                interactivePayload = {
                    type: "list",
                    body: { text: content },
                    action: {
                        button: "Menu",
                        sections: [
                            {
                                title: "Options",
                                rows: options.map((opt: any) => ({
                                    id: opt.id || opt.title,
                                    title: opt.title || opt.label || "Option",
                                    description: opt.description || ""
                                }))
                            }
                        ]
                    }
                };
            }

            if (interactivePayload) {
                const messageId = await ctx.db.insert("messages", {
                    organizationId: input.organizationId,
                    conversationId: input.conversationId,
                    contactId: input.contactId,
                    type: "INTERACTIVE",
                    content: `[${interactiveType.toUpperCase()}] ${content}`,
                    interactive: interactivePayload,
                    direction: "OUTBOUND",
                    status: "PENDING",
                    createdAt: Date.now(),
                    updatedAt: Date.now(),
                });

                await ctx.db.patch(input.conversationId, {
                    lastMessageAt: Date.now(),
                    preview: `[Interactive]`,
                    updatedAt: Date.now(),
                });

                await ctx.scheduler.runAfter(step * 1000, internal.whatsapp_actions.sendMessage, {
                    messageId: messageId,
                    organizationId: input.organizationId,
                    whatsappChannelId: input.whatsappChannelId,
                    to: contact.phone,
                    type: "interactive",
                    interactive: interactivePayload
                });
            }
        } else if (currentNode.type === 'action') {
            await executeActionNode(ctx, currentNode, input);
        }

        // FIND NEXT NODE
        const outboundEdges = edges.filter(e => e.source === currentNode?.id);
        if (outboundEdges.length === 0) {
            break;
        }

        // For now, take the first edge (linear flow)
        const nextEdge = outboundEdges[0];
        currentNode = nodes.find(n => n.id === nextEdge.target);
    }
}

/**
 * Executes an `action` flow node against the conversation/contact.
 * Supported actionTypes (set by the visual editor's action inspector):
 *   - "assign"          → assigne la conversation au meilleur agent dispo
 *                          (filtre par pôle si `details` matche le nom d'un pôle)
 *   - "tag"             → ajoute un tag à la conversation (string) et au contact (tags table)
 *   - "close"/"resolve" → passe la conversation en "RESOLVED" (décrémente la charge de l'assigné)
 * Tout autre type est loggé explicitement et ignoré (pas d'échec silencieux).
 */
async function executeActionNode(
    ctx: MutationCtx,
    node: Node,
    input: { conversationId: Id<"conversations">; organizationId: Id<"organizations">; contactId: Id<"contacts"> }
) {
    const actionType = (node.data.actionType || "").toLowerCase();
    const details = (node.data.details || "").trim();

    if (actionType === "assign") {
        // Mirrors assignments.assignToBestAvailable (round-robin, capacity, notify,
        // history). We inline the DB writes here because a mutation cannot call
        // ctx.runMutation — only actions can. Keep the two in sync.
        const conversation = await ctx.db.get(input.conversationId);
        if (!conversation) {
            console.log("[ENGINE] action assign skipped: conversation not found");
            return;
        }
        if (conversation.assignedTo) {
            console.log("[ENGINE] action assign skipped: already assigned");
            return;
        }

        // Resolve an optional pole from the `details` label (e.g. "Pôle Ventes (round-robin)").
        // Best-effort substring match on pole name; falls back to org-wide round-robin.
        let poleId: Id<"poles"> | undefined;
        if (details) {
            const poles = await ctx.db
                .query("poles")
                .withIndex("by_organization", (q) => q.eq("organizationId", input.organizationId))
                .collect();
            const lowerDetails = details.toLowerCase();
            const match = poles.find((p) => lowerDetails.includes(p.name.toLowerCase()));
            if (match) poleId = match._id;
        }

        // Candidate members: online (or recently active), filtered by pole, with capacity.
        let members = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", input.organizationId))
            .collect();
        if (poleId) members = members.filter((m) => m.poleId === poleId);
        members = members.filter((m) => {
            const isActive = Date.now() - (m.lastSeenAt || 0) < 5 * 60 * 1000;
            return m.status === "ONLINE" || isActive;
        });
        const available = members.filter((m) => (m.activeConversations || 0) < (m.maxConversations || 5));

        if (available.length === 0) {
            console.log("[ENGINE] action assign → no available agent (no online/capacity)");
            return;
        }

        // Round-robin: least-recently assigned first.
        available.sort((a, b) => (a.lastAssignedAt || 0) - (b.lastAssignedAt || 0));
        const selected = available[0];

        await ctx.db.patch(input.conversationId, {
            assignedTo: selected.userId,
            departmentId: selected.poleId ? String(selected.poleId) : undefined,
            assignedAt: Date.now(),
            updatedAt: Date.now(),
        });
        await ctx.db.patch(selected._id, {
            activeConversations: (selected.activeConversations || 0) + 1,
            lastAssignedAt: Date.now(),
        });
        await ctx.db.insert("assignments", {
            organizationId: input.organizationId,
            conversationId: input.conversationId,
            departmentId: selected.poleId ? String(selected.poleId) : undefined,
            assignedBy: "SYSTEM",
            status: "ACTIVE",
            assignedAt: Date.now(),
            createdAt: Date.now(),
            updatedAt: Date.now(),
            slaBreached: false,
            history: [],
            internalNotes: "Auto-assigned by automation flow",
        });
        await createNotification(ctx, {
            organizationId: input.organizationId,
            userId: selected.userId,
            type: "ASSIGNMENT",
            title: "Nouvelle conversation",
            message: "Une nouvelle conversation vous a été assignée par une automatisation.",
            link: `/dashboard/conversations/${input.conversationId}`,
            metadata: { conversationId: input.conversationId },
        });
        console.log(`[ENGINE] action assign → conversation ${input.conversationId} → ${selected.userId}`);
    } else if (actionType === "tag") {
        if (!details) {
            console.log("[ENGINE] action tag skipped: no tag name provided");
            return;
        }

        // 1. Conversation tags are free strings — add (dedup).
        const conversation = await ctx.db.get(input.conversationId);
        if (conversation) {
            const existing = conversation.tags || [];
            if (!existing.some((t) => t.toLowerCase() === details.toLowerCase())) {
                await ctx.db.patch(input.conversationId, {
                    tags: [...existing, details],
                    updatedAt: Date.now(),
                });
            }
        }

        // 2. Contact tags reference the `tags` table — resolve or create (same pattern as contacts.ts).
        const contact = await ctx.db.get(input.contactId);
        if (contact) {
            let tag = await ctx.db
                .query("tags")
                .withIndex("by_org_name", (q) => q.eq("organizationId", input.organizationId).eq("name", details))
                .first();
            if (!tag) {
                const tagId = await ctx.db.insert("tags", {
                    organizationId: input.organizationId,
                    name: details,
                    createdAt: Date.now(),
                });
                tag = await ctx.db.get(tagId);
            }
            if (tag) {
                const contactTags = contact.tags || [];
                if (!contactTags.some((id) => id === tag!._id)) {
                    await ctx.db.patch(input.contactId, {
                        tags: [...contactTags, tag._id],
                        updatedAt: Date.now(),
                    });
                }
            }
        }
        console.log(`[ENGINE] action tag → "${details}" added to conversation + contact`);
    } else if (actionType === "close" || actionType === "resolve") {
        const conversation = await ctx.db.get(input.conversationId);
        if (!conversation) return;

        // Mirror conversations.resolve: decrement the assignee's active load when closing an OPEN convo.
        if (conversation.assignedTo && conversation.status === "OPEN") {
            const membership = await ctx.db
                .query("memberships")
                .withIndex("by_user_org", (q) =>
                    q.eq("userId", conversation.assignedTo!).eq("organizationId", input.organizationId)
                )
                .first();
            if (membership && (membership.activeConversations || 0) > 0) {
                await ctx.db.patch(membership._id, {
                    activeConversations: (membership.activeConversations || 0) - 1,
                });
            }
        }

        await ctx.db.patch(input.conversationId, {
            status: "RESOLVED",
            updatedAt: Date.now(),
        });
        console.log(`[ENGINE] action close → conversation ${input.conversationId} marked RESOLVED`);
    } else {
        console.log(`[ENGINE] action ${actionType || "(empty)"} not supported`);
    }
}
