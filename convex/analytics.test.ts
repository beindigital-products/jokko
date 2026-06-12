import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";
import { PLAN_ORDER, type PlanKey } from "@jokko/core/planFeatures";

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

/** Seed a minimal BUSINESS org (analytics_advanced requires BUSINESS+). */
async function seedOrg(t: any) {
    return await t.run(async (ctx: any) => {
        // Insert the plans table rows — required by requirePlanFeature.
        const existing = await ctx.db.query("plans").collect();
        if (existing.length === 0) {
            for (const key of PLAN_ORDER) {
                await ctx.db.insert("plans", {
                    key,
                    name: key,
                    description: key,
                    maxAgents: 10,
                    maxWhatsappChannels: 3,
                    maxConversationsPerMonth: 100000,
                    maxTemplates: 100,
                    historyDays: -1,
                    monthlyPriceFCFA: 0,
                    yearlyPriceFCFA: 0,
                    yearlyMonthlyPriceFCFA: 0,
                    features: [],
                    supportLevel: "Communauté",
                    sortOrder: PLAN_ORDER.indexOf(key as PlanKey),
                    isActive: true,
                });
            }
        }

        const uid = await ctx.db.insert("users", {
            email: "analytics-test@example.com",
            name: "Analytics Test",
        });
        const oid = await ctx.db.insert("organizations", {
            name: "Analytics Org",
            ownerId: uid,
            plan: "BUSINESS" as PlanKey,
            // Trial expired + plan selected → gating is purely by plan key.
            trialEndsAt: Date.now() - 1000,
            hasSelectedPlan: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        await ctx.db.insert("memberships", {
            userId: uid,
            organizationId: oid,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 10,
            activeConversations: 0,
            lastSeenAt: Date.now(),
            joinedAt: Date.now(),
        });
        await ctx.db.insert("userSessions", {
            userId: uid,
            currentOrganizationId: oid,
            lastActivityAt: Date.now(),
        });

        return { uid, oid };
    });
}

/** Insert a message in the db. */
async function insertMessage(
    t: any,
    orgId: string,
    convId: string,
    createdAt: number,
    direction: "INBOUND" | "OUTBOUND",
) {
    return t.run(async (ctx: any) => {
        return ctx.db.insert("messages", {
            organizationId: orgId,
            conversationId: convId,
            direction,
            type: "TEXT",
            content: "test",
            status: "DELIVERED",
            createdAt,
            updatedAt: createdAt,
        });
    });
}

/** Insert a bare conversation. */
async function insertConversation(
    t: any,
    orgId: string,
    createdAt: number,
    status: "OPEN" | "CLOSED" = "OPEN",
) {
    return t.run(async (ctx: any) => {
        return ctx.db.insert("conversations", {
            organizationId: orgId,
            channel: "WHATSAPP",
            status,
            lastMessageAt: createdAt,
            unreadCount: 0,
            createdAt,
            updatedAt: createdAt,
        });
    });
}

// ─────────────────────────────────────────────────────────────────────────────
// Tests
// ─────────────────────────────────────────────────────────────────────────────

describe("analytics.getDashboardStats", () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    // ── Bug 1: trend messages ─────────────────────────────────────────────────

    it("trend.messages reflects real previous-period count (not always +100%)", async () => {
        const { uid, oid } = await seedOrg(t);

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        // Period: last 7 days.
        const start = now - 7 * DAY;
        const end = now;
        // Previous period: [now - 14d, now - 7d).
        const prevStart = now - 14 * DAY;

        // Create a conversation to attach messages to.
        const convId = await insertConversation(t, oid, prevStart + DAY);

        // 5 messages in the PREVIOUS period.
        for (let i = 0; i < 5; i++) {
            await insertMessage(t, oid, convId, prevStart + (i + 1) * (DAY / 6), "INBOUND");
        }
        // 3 messages in the CURRENT period.
        for (let i = 0; i < 3; i++) {
            await insertMessage(t, oid, convId, start + (i + 1) * (DAY / 4), "OUTBOUND");
        }

        const result = await t.withIdentity({ subject: uid }).query(api.analytics.getDashboardStats, {
            startDate: start,
            endDate: end,
        });

        // Current = 3, prev = 5 → trend should be ~-40% (down), not +100%.
        expect(result.trends.messages.trend).toBe("down");
        // Value should show a negative percentage, not "+3" or "+100%".
        expect(result.trends.messages.value).toMatch(/^-/);
    });

    it("trend.messages is 0% when previous and current counts are equal", async () => {
        const { uid, oid } = await seedOrg(t);

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const start = now - 7 * DAY;
        const end = now;
        const prevStart = now - 14 * DAY;

        const convId = await insertConversation(t, oid, prevStart + DAY);

        // 4 messages in each period.
        for (let i = 0; i < 4; i++) {
            await insertMessage(t, oid, convId, prevStart + (i + 1) * (DAY / 5), "INBOUND");
        }
        for (let i = 0; i < 4; i++) {
            await insertMessage(t, oid, convId, start + (i + 1) * (DAY / 5), "INBOUND");
        }

        const result = await t.withIdentity({ subject: uid }).query(api.analytics.getDashboardStats, {
            startDate: start,
            endDate: end,
        });

        // formatTrend(4, 4): percent=0, percent>0 is false → no leading "+"
        expect(result.trends.messages.value).toBe("0%");
    });

    // ── Bug 2: conversations scoped to the period ─────────────────────────────

    it("totalConversations counts only conversations created within the period", async () => {
        const { uid, oid } = await seedOrg(t);

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const start = now - 7 * DAY;
        const end = now;

        // 2 conversations created BEFORE the period (all-time, should be excluded).
        await insertConversation(t, oid, start - 3 * DAY, "OPEN");
        await insertConversation(t, oid, start - 1 * DAY, "CLOSED");

        // 3 conversations created WITHIN the period.
        await insertConversation(t, oid, start + 1 * DAY, "OPEN");
        await insertConversation(t, oid, start + 2 * DAY, "CLOSED");
        await insertConversation(t, oid, start + 3 * DAY, "OPEN");

        const result = await t.withIdentity({ subject: uid }).query(api.analytics.getDashboardStats, {
            startDate: start,
            endDate: end,
        });

        expect(result.global.totalConversations).toBe(3);
        expect(result.global.openConversations).toBe(2);
        expect(result.global.closedConversations).toBe(1);
    });

    it("totalConversations is 0 when no conversations were created in the period", async () => {
        const { uid, oid } = await seedOrg(t);

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const start = now - 7 * DAY;
        const end = now;

        // All conversations are outside the period.
        await insertConversation(t, oid, start - 5 * DAY, "OPEN");
        await insertConversation(t, oid, start - 2 * DAY, "CLOSED");

        const result = await t.withIdentity({ subject: uid }).query(api.analytics.getDashboardStats, {
            startDate: start,
            endDate: end,
        });

        expect(result.global.totalConversations).toBe(0);
        expect(result.global.openConversations).toBe(0);
        expect(result.global.closedConversations).toBe(0);
    });

    // ── Trend + scoping combined ──────────────────────────────────────────────

    it("trend.conversations reflects period-vs-previous-period new conversations", async () => {
        const { uid, oid } = await seedOrg(t);

        const now = Date.now();
        const DAY = 24 * 60 * 60 * 1000;
        const start = now - 7 * DAY;
        const end = now;
        const prevStart = now - 14 * DAY;

        // 1 conversation in previous period.
        await insertConversation(t, oid, prevStart + DAY);
        // 3 conversations in current period.
        await insertConversation(t, oid, start + DAY);
        await insertConversation(t, oid, start + 2 * DAY);
        await insertConversation(t, oid, start + 3 * DAY);

        const result = await t.withIdentity({ subject: uid }).query(api.analytics.getDashboardStats, {
            startDate: start,
            endDate: end,
        });

        // 3 current vs 1 previous → up trend.
        expect(result.trends.conversations.trend).toBe("up");
        expect(result.trends.conversations.value).toMatch(/^\+/);
    });
});
