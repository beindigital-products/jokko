import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";
import { notifyTeamOfInboundMessage } from "./webhook";

/**
 * The inbound WhatsApp webhook must create a NEW_MESSAGE notification (which
 * drives the push) when a customer message arrives — otherwise the team is never
 * told a customer replied. We test the recipient logic directly via the helper
 * the handler calls (schedulePushForNotification no-ops under vitest, so we
 * assert the notification ROWS).
 */
describe("notifyTeamOfInboundMessage — NEW_MESSAGE notifications", () => {
    let t: any;
    let orgId: any;
    let ownerId: any;
    let agentId: any;
    let convId: any;

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const s = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "owner@test.com", name: "Owner" });
            const org = await ctx.db.insert("organizations", {
                name: "Org",
                ownerId: owner,
                plan: "BUSINESS",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const mkMember = (userId: any, role: string) =>
                ctx.db.insert("memberships", {
                    userId,
                    organizationId: org,
                    role,
                    status: "ONLINE",
                    maxConversations: 10,
                    activeConversations: 0,
                    lastSeenAt: Date.now(),
                    joinedAt: Date.now(),
                });
            await mkMember(owner, "OWNER");
            const agent = await ctx.db.insert("users", { email: "agent@test.com", name: "Agent" });
            await mkMember(agent, "AGENT");
            const contact = await ctx.db.insert("contacts", {
                organizationId: org,
                phone: "221770000099",
                name: "Client Test",
                searchName: "Client Test",
                isWhatsApp: true,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org,
                contactId: contact,
                status: "OPEN",
                unreadCount: 0,
                lastMessageAt: Date.now(),
                channel: "WHATSAPP",
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            return { org, owner, agent, conv };
        });
        orgId = s.org;
        ownerId = s.owner;
        agentId = s.agent;
        convId = s.conv;
    });

    const newMessageNotifs = () =>
        t.run(async (ctx: any) =>
            ctx.db
                .query("notifications")
                .filter((q: any) => q.eq(q.field("type"), "NEW_MESSAGE"))
                .collect(),
        );

    it("pings every org member when unassigned and first unread", async () => {
        await t.run(async (ctx: any) =>
            notifyTeamOfInboundMessage(ctx, {
                organizationId: orgId,
                conversationId: convId,
                assignedTo: null,
                wasUnread: false,
                title: "Client Test",
                preview: "Bonjour",
                whatsappChannelId: null,
            }),
        );
        const notifs = await newMessageNotifs();
        expect(notifs.length).toBe(2);
        expect(notifs.map((n: any) => n.userId).sort()).toEqual([ownerId, agentId].sort());
        expect(notifs[0].metadata.conversationId).toBe(String(convId));
        expect(notifs[0].title).toBe("Client Test");
    });

    it("notifies only the assigned agent", async () => {
        await t.run(async (ctx: any) =>
            notifyTeamOfInboundMessage(ctx, {
                organizationId: orgId,
                conversationId: convId,
                assignedTo: agentId,
                wasUnread: false,
                title: "Client Test",
                preview: "Suivi",
                whatsappChannelId: null,
            }),
        );
        const notifs = await newMessageNotifs();
        expect(notifs.length).toBe(1);
        expect(notifs[0].userId).toBe(agentId);
    });

    it("does not re-ping the org when the thread is already unread", async () => {
        await t.run(async (ctx: any) =>
            notifyTeamOfInboundMessage(ctx, {
                organizationId: orgId,
                conversationId: convId,
                assignedTo: null,
                wasUnread: true,
                title: "Client Test",
                preview: "Deuxième",
                whatsappChannelId: null,
            }),
        );
        const notifs = await newMessageNotifs();
        expect(notifs.length).toBe(0);
    });
});

/**
 * Meta delivers webhooks at-least-once and replays an event when our ack times
 * out. handleIncomingMessage must be idempotent on the message wamid, or a
 * replay duplicates the thread message, double-counts unread, re-pings the team
 * and re-triggers the automation engine (double outbound = double cost).
 */
describe("handleIncomingMessage — idempotence (webhook replay)", () => {
    let t: any;
    let convId: any;
    const phoneNumberId = "phone-inbound-1";

    beforeEach(async () => {
        t = convexTest(schema, modules);
        const s = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@test.com", name: "O" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS",
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const wabaId = await ctx.db.insert("wabas", {
                organizationId: org, metaBusinessAccountId: "meta", accessTokenRef: "tok",
                label: "W", createdBy: owner, createdAt: Date.now(), updatedAt: Date.now(),
            });
            await ctx.db.insert("whatsappChannels", {
                organizationId: org, wabaId, label: "C", phoneNumberId,
                displayPhoneNumber: "+221770000000", webhookVerifyTokenRef: "vtok",
                isOrgDefault: true, status: "active", createdBy: owner,
                createdAt: Date.now(), updatedAt: Date.now(),
            });
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, phone: "221770000123", name: "Client", searchName: "Client",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, status: "OPEN", unreadCount: 1,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            // Pre-seed the wamid as already processed (a prior delivery of the
            // same event). A replay must be recognised and dropped.
            await ctx.db.insert("messages", {
                organizationId: org, conversationId: conv, contactId: contact,
                type: "TEXT", content: "Bonjour", direction: "INBOUND", status: "DELIVERED",
                externalId: "wamid.DUP1", createdAt: Date.now(), updatedAt: Date.now(),
            });
            return { conv };
        });
        convId = s.conv;
    });

    it("drops an exact replay: no new row, no double unread (returns before the engine trigger)", async () => {
        await t.mutation(internal.webhook.handleIncomingMessage, {
            message: {
                id: "wamid.DUP1", from: "221770000123", type: "text",
                text: { body: "Bonjour" }, timestamp: "1700000000",
            },
            phoneNumberId,
        });

        const state = await t.run(async (ctx: any) => ({
            messages: await ctx.db.query("messages")
                .withIndex("by_external_id", (q: any) => q.eq("externalId", "wamid.DUP1")).collect(),
            conv: await ctx.db.get(convId),
        }));
        expect(state.messages.length).toBe(1);       // still just the pre-seeded row
        expect(state.conv.unreadCount).toBe(1);       // not incremented by the replay
    });
});

/**
 * Meta status webhooks (sent → delivered → read) can arrive out of order. The
 * displayed status must only ever move forward; a delayed "delivered" after a
 * "read" must not regress it. FAILED is terminal.
 */
describe("handleStatusUpdate — ordering guard", () => {
    let t: any;
    let messageId: any;

    const setStatus = (status: string) =>
        t.mutation(internal.webhook.handleStatusUpdate, {
            waMessageId: "wamid.OUT1", status, timestamp: String(Math.floor(Date.now() / 1000)),
        });
    const currentStatus = () => t.run(async (ctx: any) => (await ctx.db.get(messageId)).status);

    beforeEach(async () => {
        t = convexTest(schema, modules);
        messageId = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@test.com", name: "O" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, phone: "221770000123", name: "C", searchName: "C",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, status: "OPEN", unreadCount: 0,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            return await ctx.db.insert("messages", {
                organizationId: org, conversationId: conv, contactId: contact,
                type: "TEXT", content: "Hi", direction: "OUTBOUND", status: "SENT",
                externalId: "wamid.OUT1", createdAt: Date.now(), updatedAt: Date.now(),
            });
        });
    });

    it("does not regress READ back to DELIVERED on an out-of-order webhook", async () => {
        await setStatus("read");
        expect(await currentStatus()).toBe("READ");
        await setStatus("delivered"); // late, out-of-order
        expect(await currentStatus()).toBe("READ"); // unchanged
    });

    it("advances forward sent → delivered → read", async () => {
        await setStatus("delivered");
        expect(await currentStatus()).toBe("DELIVERED");
        await setStatus("read");
        expect(await currentStatus()).toBe("READ");
    });
});
