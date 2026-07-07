import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Media storage accounting: recompute rebuilds the counter from the truth
 * (_storage sizes referenced by the org's messages); getUsage exposes it + the
 * plan cap.
 */
describe("storage usage", () => {
    it("recompute sums referenced media sizes into the counter", async () => {
        const t = convexTest(schema, modules);
        const org = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@t.com", name: "O" });
            const o = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS",
                storageBytesUsed: 999_999, // deliberately wrong → recompute fixes it
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const contact = await ctx.db.insert("contacts", {
                organizationId: o, name: "C", phone: "1", searchName: "C",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: o, contactId: contact, status: "OPEN", unreadCount: 0,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const storageId = await ctx.storage.store(new Blob(["x".repeat(1234)]));
            await ctx.db.insert("messages", {
                organizationId: o, conversationId: conv, contactId: contact, type: "IMAGE",
                content: "", direction: "INBOUND", status: "DELIVERED", mediaStorageId: storageId,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            return o;
        });

        await t.mutation(internal.storage_usage.recompute, { organizationId: org });
        const used = await t.run(async (ctx: any) => (await ctx.db.get(org)).storageBytesUsed);
        expect(used).toBe(1234);
    });

    it("getUsage reports usage and the plan cap", async () => {
        const t = convexTest(schema, modules);
        await t.mutation(internal.plans.seedPlans, {});
        const userId = await t.run(async (ctx: any) => {
            const u = await ctx.db.insert("users", { email: "o@t.com", name: "O" });
            const o = await ctx.db.insert("organizations", {
                name: "Org", ownerId: u, plan: "FREE", storageBytesUsed: 1024,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", { userId: u, currentOrganizationId: o, lastActivityAt: Date.now() });
            return u;
        });

        const res = await t.withIdentity({ subject: userId, issuer: "test" }).query(api.storage_usage.getUsage, {});
        expect(res?.usedBytes).toBe(1024);
        expect(res?.maxMB).toBe(500);
        expect(res?.unlimited).toBe(false);
    });
});
