import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

// ── Minimal env: user + org + session ────────────────────────────────────────
async function setupOrg(t: any) {
    return await t.run(async (ctx: any) => {
        const userId = await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
        const orgId = await ctx.db.insert("organizations", {
            name: "Test Org",
            ownerId: userId,
            plan: "BUSINESS",
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await ctx.db.insert("memberships", {
            userId,
            organizationId: orgId,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 10,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });
        return { userId, orgId };
    });
}

async function createConversation(t: any, orgId: any, opts?: { assignedTo?: any; status?: string }) {
    return await t.run(async (ctx: any) => {
        const phone = `+22177${Math.floor(Math.random() * 10000000).toString().padStart(7, "0")}`;
        const contactId = await ctx.db.insert("contacts", {
            organizationId: orgId,
            phone,
            name: "Test Contact",
            searchName: `Test Contact ${phone}`,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        const convId = await ctx.db.insert("conversations", {
            organizationId: orgId,
            contactId,
            channel: "WHATSAPP",
            status: opts?.status || "OPEN",
            lastMessageAt: Date.now(),
            unreadCount: 1,
            preview: "Bonjour",
            assignedTo: opts?.assignedTo,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return { convId, contactId };
    });
}

async function createFlow(
    t: any,
    orgId: any,
    flow: { triggerType: string; triggerConfig?: string; nodes: any[]; edges: any[]; isActive?: boolean },
) {
    return await t.run(async (ctx: any) => {
        return await ctx.db.insert("flows", {
            organizationId: orgId,
            name: "Test flow",
            triggerType: flow.triggerType,
            triggerConfig: flow.triggerConfig,
            nodes: JSON.stringify(flow.nodes),
            edges: JSON.stringify(flow.edges),
            isActive: flow.isActive ?? true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
    });
}

describe("engine — action nodes (Défaut 1)", () => {
    let t: any;
    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("executes a 'tag' action node: tags the conversation + creates a tag on the contact", async () => {
        const { orgId } = await setupOrg(t);
        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "NEW_CONVERSATION",
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "new_conversation" } },
                { id: "act-1", type: "action", data: { actionType: "tag", details: "vip" } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "act-1" }],
        });

        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            messageText: "Bonjour",
            isFirstMessage: true,
        });

        const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
        expect(conv.tags).toContain("vip");

        const contact = await t.run(async (ctx: any) => ctx.db.get(contactId));
        expect(contact.tags?.length).toBe(1);
        const tag = await t.run(async (ctx: any) => ctx.db.get(contact.tags[0]));
        expect(tag.name).toBe("vip");
    });

    it("executes a 'close' action node: marks the conversation RESOLVED", async () => {
        const { orgId } = await setupOrg(t);
        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "NEW_CONVERSATION",
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "new_conversation" } },
                { id: "act-1", type: "action", data: { actionType: "close" } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "act-1" }],
        });

        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            messageText: "Bonjour",
            isFirstMessage: true,
        });

        const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
        expect(conv.status).toBe("RESOLVED");
    });

    it("executes an 'assign' action node: assigns the conversation to an available agent", async () => {
        const { orgId } = await setupOrg(t);
        // Create a dedicated online agent with capacity.
        const agentUserId = await t.run(async (ctx: any) => {
            const uid = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
            await ctx.db.insert("memberships", {
                userId: uid,
                organizationId: orgId,
                role: "AGENT",
                status: "ONLINE",
                maxConversations: 5,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            return uid;
        });

        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "NEW_CONVERSATION",
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "new_conversation" } },
                { id: "act-1", type: "action", data: { actionType: "assign" } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "act-1" }],
        });

        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            messageText: "Bonjour",
            isFirstMessage: true,
        });

        const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
        // Assigned to an available org member (owner or the dedicated agent — both
        // are ONLINE with capacity; round-robin picks one).
        expect(conv.assignedTo).toBeDefined();
        const members = await t.run(async (ctx: any) =>
            ctx.db
                .query("memberships")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", orgId))
                .collect(),
        );
        const memberUserIds = members.map((m: any) => m.userId);
        expect(memberUserIds).toContain(conv.assignedTo);
        expect(memberUserIds).toContain(agentUserId);

        // An assignment record was created.
        const assignments = await t.run(async (ctx: any) =>
            ctx.db
                .query("assignments")
                .withIndex("by_conversation", (q: any) => q.eq("conversationId", convId))
                .collect(),
        );
        expect(assignments.length).toBe(1);
        expect(assignments[0].assignedBy).toBe("SYSTEM");
    });

    it("logs and skips an unsupported actionType without throwing", async () => {
        const { orgId } = await setupOrg(t);
        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "NEW_CONVERSATION",
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "new_conversation" } },
                { id: "act-1", type: "action", data: { actionType: "send_email" } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "act-1" }],
        });

        // Should not throw; conversation stays OPEN / unassigned / untagged.
        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            messageText: "Bonjour",
            isFirstMessage: true,
        });

        const conv = await t.run(async (ctx: any) => ctx.db.get(convId));
        expect(conv.status).toBe("OPEN");
        expect(conv.assignedTo).toBeUndefined();
        expect(conv.tags ?? []).toHaveLength(0);
    });
});

describe("engine — KEYWORD trigger (Défaut 2)", () => {
    let t: any;
    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    it("fires a KEYWORD flow when the message contains a keyword (case-insensitive)", async () => {
        const { orgId } = await setupOrg(t);
        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "KEYWORD",
            triggerConfig: JSON.stringify({ keywords: ["devis", "info"] }),
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "keyword", keywords: "devis, info" } },
                { id: "msg-1", type: "message", data: { content: "Voici votre devis." } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "msg-1" }],
        });

        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            // Different casing + surrounding text → must still match.
            messageText: "Bonjour, je voudrais un DEVIS svp",
            isFirstMessage: false,
        });

        // The message node ran → an OUTBOUND message was inserted with that content.
        const messages = await t.run(async (ctx: any) =>
            ctx.db
                .query("messages")
                .withIndex("by_conversation", (q: any) => q.eq("conversationId", convId))
                .collect(),
        );
        const outbound = messages.filter((m: any) => m.direction === "OUTBOUND");
        expect(outbound.length).toBe(1);
        expect(outbound[0].content).toBe("Voici votre devis.");
    });

    it("does NOT fire a KEYWORD flow when no keyword is present", async () => {
        const { orgId } = await setupOrg(t);
        const { convId, contactId } = await createConversation(t, orgId);

        await createFlow(t, orgId, {
            triggerType: "KEYWORD",
            triggerConfig: JSON.stringify({ keywords: ["devis"] }),
            nodes: [
                { id: "start-1", type: "start", data: { triggerType: "keyword", keywords: "devis" } },
                { id: "msg-1", type: "message", data: { content: "Voici votre devis." } },
            ],
            edges: [{ id: "e1", source: "start-1", target: "msg-1" }],
        });

        await t.mutation(internal.engine.processMessage, {
            organizationId: orgId,
            conversationId: convId,
            contactId,
            messageText: "Bonjour, comment allez-vous ?",
            isFirstMessage: false,
        });

        const messages = await t.run(async (ctx: any) =>
            ctx.db
                .query("messages")
                .withIndex("by_conversation", (q: any) => q.eq("conversationId", convId))
                .collect(),
        );
        expect(messages.filter((m: any) => m.direction === "OUTBOUND").length).toBe(0);
    });
});
