import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "../_generated/api";
import schema from "../schema";
import { modules } from "../test.modules";

describe("templates.sendToConversation", () => {
    let t: any;
    let userId: string;
    let orgId: string;
    let asUser: any;

    async function setupTemplate(
        status: string,
        opts?: { body?: string; metaName?: string; organizationOverride?: string },
    ): Promise<string> {
        return await t.run(async (ctx: any) => {
            return await ctx.db.insert("templates", {
                organizationId: opts?.organizationOverride ?? orgId,
                name: "Welcome",
                slug: "welcome",
                type: "MARKETING",
                category: "MARKETING",
                language: "fr",
                status,
                body: opts?.body ?? "Hello",
                metaTemplateName: opts?.metaName,
                sentCount: 0,
                deliveredCount: 0,
                readCount: 0,
                repliedCount: 0,
                clickedCount: 0,
                convertedCount: 0,
                failedCount: 0,
                blockedCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
    }

    async function setupConversation(): Promise<string> {
        return await t.run(async (ctx: any) => {
            // Empty phone short-circuits the WhatsApp scheduler in
            // sendToConversation (the mutation guards on `contact?.phone`).
            // Necessary because convex-test cannot complete the deferred
            // action transaction once the parent mutation has returned.
            const contactId = await ctx.db.insert("contacts", {
                organizationId: orgId,
                name: "Test Contact",
                phone: "",
                searchName: "Test Contact",
                tags: [],
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return await ctx.db.insert("conversations", {
                organizationId: orgId,
                contactId,
                channel: "WHATSAPP",
                status: "OPEN",
                lastMessageAt: Date.now(),
                lastMessageDirection: "INBOUND",
                unreadCount: 0,
                createdAt: Date.now(),
                updatedAt: Date.now(),
                tags: [],
            });
        });
    }

    beforeEach(async () => {
        t = convexTest(schema, modules);

        userId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
        });

        orgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "Test Org",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });

        await t.run(async (ctx: any) => {
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
            await ctx.db.insert("userSessions", {
                userId,
                currentOrganizationId: orgId,
                lastActivityAt: Date.now(),
            });
        });

        asUser = t.withIdentity({ subject: userId, issuer: "test" });
    });

    it("inserts a TEMPLATE message and updates the conversation preview", async () => {
        const conversationId = await setupConversation();
        const templateId = await setupTemplate("APPROVED", { body: "Bonjour, comment ça va ?" });

        const messageId = await asUser.mutation(api.templates.mutations.sendToConversation, {
            conversationId,
            templateId,
        });
        await t.finishInProgressScheduledFunctions();

        const message = await t.run(async (ctx: any) => ctx.db.get(messageId));
        expect(message.type).toBe("TEMPLATE");
        expect(message.direction).toBe("OUTBOUND");
        expect(message.content).toBe("Bonjour, comment ça va ?");
        expect(message.conversationId).toBe(conversationId);

        const conversation = await t.run(async (ctx: any) => ctx.db.get(conversationId));
        expect(conversation.preview).toBe("📤 Welcome");
        expect(conversation.lastMessageDirection).toBe("OUTBOUND");
    });

    it("falls back to template name when body is empty", async () => {
        const conversationId = await setupConversation();
        const templateId = await setupTemplate("APPROVED", { body: "" });

        const messageId = await asUser.mutation(api.templates.mutations.sendToConversation, {
            conversationId,
            templateId,
        });
        const message = await t.run(async (ctx: any) => ctx.db.get(messageId));
        expect(message.content).toBe("Template: Welcome");
    });

    it("rejects sending a non-APPROVED template", async () => {
        const conversationId = await setupConversation();
        const templateId = await setupTemplate("PENDING");

        await expect(
            asUser.mutation(api.templates.mutations.sendToConversation, {
                conversationId,
                templateId,
            }),
        ).rejects.toThrow(/APPROVED/);
    });

    it("rejects a template from a different organization", async () => {
        const conversationId = await setupConversation();

        const foreignOrgId = await t.run(async (ctx: any) => {
            return await ctx.db.insert("organizations", {
                name: "Foreign",
                ownerId: userId,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
        const templateId = await setupTemplate("APPROVED", {
            organizationOverride: foreignOrgId,
        });

        await expect(
            asUser.mutation(api.templates.mutations.sendToConversation, {
                conversationId,
                templateId,
            }),
        ).rejects.toThrow(/organization/);
    });

    it("local_only demo mode marks the message SENT without scheduling Meta call", async () => {
        await t.run(async (ctx: any) => {
            await ctx.db.patch(orgId, {
                demo: {
                    kind: "APP_REVIEW",
                    seedVersion: "v1",
                    seededAt: Date.now(),
                    outboundMode: "local_only",
                },
            });
        });

        const conversationId = await setupConversation();
        const templateId = await setupTemplate("APPROVED");

        const messageId = await asUser.mutation(api.templates.mutations.sendToConversation, {
            conversationId,
            templateId,
        });
        await t.finishInProgressScheduledFunctions();

        const message = await t.run(async (ctx: any) => ctx.db.get(messageId));
        expect(message.status).toBe("SENT");
        expect(message.externalId).toMatch(/^demo:template:/);
    });

    // Soft-deleted templates (status DELETED) must never resurface in the
    // /dashboard/modeles list, otherwise they reappear labelled "Brouillon".
    it("excludes DELETED templates from the list query", async () => {
        const draftId = await setupTemplate("DRAFT");
        await setupTemplate("DELETED");

        const result = await asUser.query(api.templates.queries.list, {
            paginationOpts: { numItems: 50, cursor: null },
        });

        const ids = result.page.map((t: any) => t._id);
        expect(ids).toContain(draftId);
        expect(result.page.every((t: any) => t.status !== "DELETED")).toBe(true);
    });
});
