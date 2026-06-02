import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { QueryCtx } from "./_generated/server";

/** Resolve the caller's active organization (session first, membership fallback). */
async function getCurrentOrgId(ctx: QueryCtx) {
    const userId = await getAuthUserId(ctx);
    if (!userId) return null;

    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    if (session?.currentOrganizationId) return session.currentOrganizationId;

    const membership = await ctx.db
        .query("memberships")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();
    return membership?.organizationId ?? null;
}

/**
 * getOnboardingChecklist — the cockpit "Mise en route" card data. Derives six
 * booleans from real org state: a connected WhatsApp number, an invited team,
 * a created template, a template submitted to Meta, an active automation, and a
 * connected CRM. Returns keys + done flags (UI labels live in the frontend).
 */
export const getOnboardingChecklist = query({
    args: {},
    handler: async (ctx) => {
        const orgId = await getCurrentOrgId(ctx);
        if (!orgId) return null;

        const org = await ctx.db.get(orgId);
        if (!org) return null;

        // 1. WhatsApp number connected — legacy single-number config OR an active channel.
        const channels = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_org", (q) => q.eq("organizationId", orgId))
            .collect();
        const whatsappConnected =
            !!org.whatsapp?.phoneNumberId || channels.some((c) => c.status === "active");

        // 2. Team invited — more than just the owner.
        const memberships = await ctx.db
            .query("memberships")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        const teamInvited = memberships.length > 1;

        // 3 & 4. Templates created / submitted to Meta.
        const templates = await ctx.db
            .query("templates")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        const templateCreated = templates.length > 0;
        const templateSubmitted = templates.some((t) => !!t.metaTemplateId);

        // 5. At least one active automation.
        const flows = await ctx.db
            .query("flows")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        const automationActive = flows.some((f) => f.isActive);

        // 6. A connected CRM.
        const crm = await ctx.db
            .query("crmConnections")
            .withIndex("by_organization", (q) => q.eq("organizationId", orgId))
            .collect();
        const crmConnected = crm.some((c) => c.status === "active");

        const steps = [
            { key: "whatsapp", done: whatsappConnected },
            { key: "team", done: teamInvited },
            { key: "template", done: templateCreated },
            { key: "templateMeta", done: templateSubmitted },
            { key: "automation", done: automationActive },
            { key: "crm", done: crmConnected },
        ] as const;

        return {
            steps: steps.map((s) => ({ key: s.key, done: s.done })),
            completed: steps.filter((s) => s.done).length,
            total: steps.length,
        };
    },
});
