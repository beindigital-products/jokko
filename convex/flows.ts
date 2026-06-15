import { v } from "convex/values";
import { mutation, query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireAuth, requirePermission } from "./lib/auth";
import { requirePlanFeature } from "./lib/planFeatures";

/**
 * Derives the canonical `triggerType` (+ `triggerConfig`) the automation engine
 * reads (`convex/engine.ts`) from the visual editor's `start` node.
 *
 * The editor stores the trigger on the start node's `data` (lowercase
 * `triggerType`: "keyword" | "new_conversation" | "no_reply", and keywords as a
 * CSV string in `data.keywords`), while the engine matches on the uppercase
 * document fields `flow.triggerType` + `flow.triggerConfig.keywords` (array).
 * Reconciling at SAVE time keeps the start node the single source of truth and
 * leaves the engine's read path (and existing flows) untouched.
 *
 * Returns `null` when no start node / trigger is present so the caller can keep
 * whatever was explicitly passed (e.g. flows.create with no nodes yet).
 */
function deriveTriggerFromNodes(
    nodesJson: string | undefined
): { triggerType: string; triggerConfig?: string } | null {
    if (!nodesJson) return null;

    let nodes: Array<{ type?: string; data?: { triggerType?: string; keywords?: string } }>;
    try {
        nodes = JSON.parse(nodesJson);
    } catch {
        return null;
    }
    if (!Array.isArray(nodes)) return null;

    const start = nodes.find((n) => n?.type === "start");
    if (!start) return null;

    const raw = (start.data?.triggerType || "").toLowerCase();

    if (raw === "keyword") {
        const keywords = (start.data?.keywords || "")
            .split(",")
            .map((k) => k.trim())
            .filter((k) => k.length > 0);
        return { triggerType: "KEYWORD", triggerConfig: JSON.stringify({ keywords }) };
    }
    if (raw === "no_reply") {
        // Engine ne gère pas encore NO_REPLY (timeout) — on persiste le type pour
        // l'éditeur, sans triggerConfig de mot-clé.
        return { triggerType: "NO_REPLY" };
    }
    if (raw === "new_conversation" || raw === "") {
        return { triggerType: "NEW_CONVERSATION" };
    }
    // Valeur déjà normalisée (NEW_CONVERSATION, KEYWORD, AI_GENERATED…) → telle quelle.
    return { triggerType: start.data?.triggerType || "NEW_CONVERSATION" };
}

// Helper to get current Org ID (uses centralized auth from lib/auth.ts)
async function getCurrentOrgId(ctx: Parameters<typeof requireAuth>[0]) {
    const userId = await requireAuth(ctx);

    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

    if (!session || !session.currentOrganizationId) {
        throw new Error("Unauthorized: No active organization");
    }

    return { userId, organizationId: session.currentOrganizationId };
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:read");

        return await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) =>
                q.eq("organizationId", organizationId)
            )
            .order("desc")
            .collect();
    },
});

export const get = query({
    args: { flowId: v.id("flows") },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:read");

        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        return flow;
    },
});

export const create = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        triggerType: v.string(),
    },
    handler: async (ctx, args) => {
        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:create");
        await requirePlanFeature(ctx, organizationId, "flows");

        const flowId = await ctx.db.insert("flows", {
            organizationId,
            name: args.name,
            description: args.description,
            triggerType: args.triggerType,
            nodes: "[]",
            edges: "[]",
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        return flowId;
    },
});

export const createFromAI = mutation({
    args: {
        name: v.string(),
        description: v.optional(v.string()),
        triggerType: v.string(),
        triggerConfig: v.optional(v.string()),
        nodes: v.string(),
        edges: v.string(),
    },
    handler: async (ctx, args) => {
        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:create");
        // createFromAI = flows + IA : les deux features doivent être dispo
        await requirePlanFeature(ctx, organizationId, "flows");
        await requirePlanFeature(ctx, organizationId, "ai");

        // Aligne le déclencheur sur le nœud `start` généré par l'IA (l'engine lit
        // KEYWORD + triggerConfig.keywords). Les args explicites de l'appelant
        // gardent la priorité.
        const derived = deriveTriggerFromNodes(args.nodes);
        const triggerType = args.triggerType || derived?.triggerType || "NEW_CONVERSATION";
        const triggerConfig = args.triggerConfig ?? derived?.triggerConfig;

        const flowId = await ctx.db.insert("flows", {
            organizationId,
            name: args.name,
            description: args.description,
            triggerType,
            triggerConfig,
            nodes: args.nodes,
            edges: args.edges,
            isActive: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });

        return flowId;
    },
});

export const update = mutation({
    args: {
        flowId: v.id("flows"),
        name: v.optional(v.string()),
        description: v.optional(v.string()),
        triggerType: v.optional(v.string()),
        triggerConfig: v.optional(v.string()),
        nodes: v.optional(v.string()),
        edges: v.optional(v.string()),
        isActive: v.optional(v.boolean()),
    },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:update");

        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        const { flowId, ...updates } = args;

        // Réconcilie le déclencheur depuis le nœud `start` à chaque sauvegarde de
        // `nodes`, pour que l'engine (KEYWORD / triggerConfig.keywords) reste aligné
        // sur l'éditeur visuel. Un triggerType/triggerConfig explicitement fourni
        // par l'appelant a priorité (ne pas écraser un choix volontaire).
        if (updates.nodes !== undefined) {
            const derived = deriveTriggerFromNodes(updates.nodes);
            if (derived) {
                if (updates.triggerType === undefined) {
                    updates.triggerType = derived.triggerType;
                }
                if (updates.triggerConfig === undefined && derived.triggerConfig !== undefined) {
                    updates.triggerConfig = derived.triggerConfig;
                }
            }
        }

        await ctx.db.patch(flowId, {
            ...updates,
            updatedAt: Date.now(),
        });
    },
});

export const deleteFlow = mutation({
    args: { flowId: v.id("flows") },
    handler: async (ctx, args) => {
        const flow = await ctx.db.get(args.flowId);
        if (!flow) {
            throw new Error("Flow not found");
        }

        const { userId, organizationId } = await getCurrentOrgId(ctx);
        await requirePermission(ctx, organizationId, "flows:delete");

        if (flow.organizationId !== organizationId) {
            throw new Error("Unauthorized");
        }

        await ctx.db.delete(args.flowId);
    },
});
