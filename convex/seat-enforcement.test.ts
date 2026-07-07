import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Seat enforcement on plan change (convex/lib/planEnforcement.ts:enforceSeatLimit,
 * run from every enforceChannelDowngrade call site incl. updateOrgPlan + Stripe
 * webhooks). A downgrade below the seat count suspends the NEWEST agents (never
 * owner/admins); an upgrade restores seats suspended by a prior downgrade; a
 * suspended member has no access (requireMembership).
 *
 * Seat semantics match countActiveAgents: total active members (incl. owner)
 * must be <= maxAgents (FREE/STARTER=1, BUSINESS=5, PRO=20).
 */
describe("seat enforcement on downgrade", () => {
    let t: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        await t.mutation(internal.plans.seedPlans, {});
    });

    /** Owner on PRO + N agents, with the owner's session pointing at the org. */
    async function seedOrg(agentCount: number, adminCount = 0) {
        return t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "owner@t.com", name: "Owner" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "PRO", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const mk = (userId: any, role: string, joinedAt: number) =>
                ctx.db.insert("memberships", {
                    userId, organizationId: org, role, status: "ONLINE",
                    maxConversations: 10, activeConversations: 0, lastSeenAt: Date.now(), joinedAt,
                });
            await mk(owner, "OWNER", 0);
            await ctx.db.insert("userSessions", { userId: owner, currentOrganizationId: org, lastActivityAt: Date.now() });
            const admins: any[] = [];
            for (let i = 0; i < adminCount; i++) {
                const u = await ctx.db.insert("users", { email: `admin${i}@t.com`, name: `Admin${i}` });
                await mk(u, "ADMIN", 100 + i);
                admins.push(u);
            }
            const agents: any[] = [];
            for (let i = 0; i < agentCount; i++) {
                const u = await ctx.db.insert("users", { email: `agent${i}@t.com`, name: `Agent${i}` });
                await mk(u, "AGENT", 1000 + i); // increasing joinedAt → agent0 oldest
                agents.push(u);
            }
            return { owner, org, admins, agents };
        });
    }

    const suspendedUserIds = (orgId: any) =>
        t.run(async (ctx: any) =>
            (await ctx.db.query("memberships").withIndex("by_organization", (q: any) => q.eq("organizationId", orgId)).collect())
                .filter((m: any) => m.suspended)
                .map((m: any) => m.userId));

    it("suspends the newest agents beyond the limit, keeping the oldest + owner", async () => {
        const { owner, org, agents } = await seedOrg(6); // owner + 6 agents = 7 active
        const asOwner = t.withIdentity({ subject: owner, issuer: "test" });
        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "BUSINESS" }); // maxAgents 5

        const suspended = await suspendedUserIds(org);
        expect(suspended.length).toBe(2); // 7 - 5 = 2 newest agents
        expect(suspended.sort()).toEqual([agents[4], agents[5]].sort()); // two newest
        expect(suspended).not.toContain(owner);
    });

    it("never suspends owners or admins", async () => {
        const { owner, org, admins, agents } = await seedOrg(3, 2); // owner + 2 admins + 3 agents = 6
        const asOwner = t.withIdentity({ subject: owner, issuer: "test" });
        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "STARTER" }); // maxAgents 1

        const suspended = await suspendedUserIds(org);
        // Only agents can be suspended; owner + admins are protected.
        expect(suspended).not.toContain(owner);
        for (const a of admins) expect(suspended).not.toContain(a);
        expect(suspended.sort()).toEqual([...agents].sort()); // all 3 agents suspended
    });

    it("auto-reactivates suspended seats on upgrade", async () => {
        const { owner, org } = await seedOrg(6);
        const asOwner = t.withIdentity({ subject: owner, issuer: "test" });
        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "BUSINESS" });
        expect((await suspendedUserIds(org)).length).toBe(2);

        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "PRO" }); // maxAgents 20
        expect((await suspendedUserIds(org)).length).toBe(0); // restored
    });

    it("reactivateMember refuses when no seat is free, succeeds after freeing one", async () => {
        const { owner, org, agents } = await seedOrg(6);
        const asOwner = t.withIdentity({ subject: owner, issuer: "test" });
        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "BUSINESS" }); // 2 suspended, 5/5 used

        const suspendedMembership = await t.run(async (ctx: any) =>
            (await ctx.db.query("memberships").withIndex("by_organization", (q: any) => q.eq("organizationId", org)).collect())
                .find((m: any) => m.suspended));

        await expect(
            asOwner.mutation(api.team.reactivateMember, { membershipId: suspendedMembership._id }),
        ).rejects.toThrow(/Plus de sièges disponibles/i);

        // Free a seat by removing an active agent, then reactivation succeeds.
        const activeAgent = await t.run(async (ctx: any) =>
            (await ctx.db.query("memberships").withIndex("by_organization", (q: any) => q.eq("organizationId", org)).collect())
                .find((m: any) => !m.suspended && m.role === "AGENT"));
        await asOwner.mutation(api.team.removeMember, { membershipId: activeAgent._id });
        await asOwner.mutation(api.team.reactivateMember, { membershipId: suspendedMembership._id });

        const stillSuspended = await t.run(async (ctx: any) => (await ctx.db.get(suspendedMembership._id)).suspended);
        expect(stillSuspended).toBeFalsy();
    });

    it("blocks a suspended member from acting (requireMembership)", async () => {
        const { owner, org, agents } = await seedOrg(1); // owner + 1 agent
        const asOwner = t.withIdentity({ subject: owner, issuer: "test" });

        // A conversation the agent could otherwise send to.
        const conversationId = await t.run(async (ctx: any) => {
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, name: "C", phone: "", searchName: "C", tags: [],
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            return ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, channel: "WHATSAPP", status: "OPEN",
                lastMessageAt: Date.now(), unreadCount: 0, tags: [], createdAt: Date.now(), updatedAt: Date.now(),
            });
        });

        await asOwner.mutation(api.organizations.updateOrgPlan, { plan: "STARTER" }); // suspends the agent

        const asAgent = t.withIdentity({ subject: agents[0], issuer: "test" });
        await expect(
            asAgent.mutation(api.messages.send, { conversationId, content: "Hi", type: "TEXT" }),
        ).rejects.toThrow(/suspendu/i);
    });
});
