import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api, internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

describe("S4 App Review demo seed", () => {
    let t: any;

    beforeEach(() => {
        t = convexTest(schema, modules);
    });

    async function createReviewUser() {
        return await t.run(async (ctx: any) => {
            return await ctx.db.insert("users", {
                email: "app-review@jokko.example",
                name: "Jokko App Review",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
        });
    }

    async function seed(reviewUserId: string) {
        return await t.mutation(internal.demo.seedAppReviewWorkspace, {
            reviewUserId,
            reviewEmail: "app-review@jokko.example",
            displayPhoneNumber: "+1 555 010 4242",
            phoneNumberId: "demo_phone_number_id",
            businessAccountId: "demo_waba_id",
            outboundMode: "local_only",
        });
    }

    it("seeds an idempotent review org with channel, conversations, templates, and notification", async () => {
        const reviewUserId = await createReviewUser();

        const first = await seed(reviewUserId);
        const second = await seed(reviewUserId);

        expect(second.organizationId).toBe(first.organizationId);
        expect(second.whatsappChannelId).toBe(first.whatsappChannelId);
        expect(second.conversationCount).toBe(4);
        expect(second.templateCount).toBe(2);
        expect(second.outboundMode).toBe("local_only");

        const snapshot = await t.run(async (ctx: any) => {
            const org = await ctx.db.get(first.organizationId);
            const channels = await ctx.db
                .query("whatsappChannels")
                .withIndex("by_org", (q: any) => q.eq("organizationId", first.organizationId))
                .collect();
            const contacts = await ctx.db
                .query("contacts")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", first.organizationId))
                .collect();
            const conversations = await ctx.db
                .query("conversations")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", first.organizationId))
                .collect();
            const messages = await ctx.db
                .query("messages")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", first.organizationId))
                .collect();
            const templates = await ctx.db
                .query("templates")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", first.organizationId))
                .collect();
            const notifications = await ctx.db
                .query("notifications")
                .withIndex("by_user", (q: any) => q.eq("userId", reviewUserId))
                .collect();

            return { org, channels, contacts, conversations, messages, templates, notifications };
        });

        expect(snapshot.org.slug).toBe("jokko-app-review-demo");
        expect(snapshot.org.demo.outboundMode).toBe("local_only");
        expect(snapshot.channels).toHaveLength(1);
        expect(snapshot.contacts).toHaveLength(4);
        expect(snapshot.conversations).toHaveLength(4);
        expect(snapshot.messages).toHaveLength(11);
        expect(snapshot.templates).toHaveLength(2);
        expect(snapshot.notifications.filter((n: any) => n.type === "DEMO_REVIEW_READY")).toHaveLength(1);
    });

    it("creates the reviewer Password account through the guarded public action", async () => {
        const previousToken = process.env.DEMO_SEED_TOKEN;
        const previousPassword = process.env.DEMO_REVIEW_PASSWORD;
        process.env.DEMO_SEED_TOKEN = "test-seed-token";
        process.env.DEMO_REVIEW_PASSWORD = "StrongPassword123";

        try {
            const result = await t.action(api.demo.seedAppReviewDemo, {
                seedToken: "test-seed-token",
                email: "review-action@jokko.example",
            });

            expect(result.reviewEmail).toBe("review-action@jokko.example");
            expect(result.conversationCount).toBe(4);

            const authAccount = await t.run(async (ctx: any) => {
                return await ctx.db
                    .query("authAccounts")
                    .withIndex("providerAndAccountId", (q: any) =>
                        q.eq("provider", "password").eq("providerAccountId", "review-action@jokko.example"),
                    )
                    .first();
            });

            expect(authAccount).toBeTruthy();
            expect(authAccount.secret).toBeTruthy();

            const rotated = await t.action(api.demo.seedAppReviewDemo, {
                seedToken: "test-seed-token",
                email: "review-action@jokko.example",
                password: "AnotherStrong123",
            });

            expect(rotated.organizationId).toBe(result.organizationId);
        } finally {
            if (previousToken === undefined) {
                delete process.env.DEMO_SEED_TOKEN;
            } else {
                process.env.DEMO_SEED_TOKEN = previousToken;
            }

            if (previousPassword === undefined) {
                delete process.env.DEMO_REVIEW_PASSWORD;
            } else {
                process.env.DEMO_REVIEW_PASSWORD = previousPassword;
            }
        }
    });

    it("marks outbound messages as SENT locally for demo orgs without requiring WhatsApp credentials", async () => {
        const reviewUserId = await createReviewUser();
        const seeded = await seed(reviewUserId);

        const conversationId = await t.run(async (ctx: any) => {
            const conversation = await ctx.db
                .query("conversations")
                .withIndex("by_organization", (q: any) => q.eq("organizationId", seeded.organizationId))
                .first();
            return conversation._id;
        });

        const messageId = await t.withIdentity({ subject: reviewUserId }).mutation(api.messages.send, {
            conversationId,
            type: "TEXT",
            content: "Message de test App Review",
        });

        const message = await t.run(async (ctx: any) => await ctx.db.get(messageId));

        expect(message.status).toBe("SENT");
        expect(message.externalId).toBe(`demo:local:${messageId}`);
    });
});
