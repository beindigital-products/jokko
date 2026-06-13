import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
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
