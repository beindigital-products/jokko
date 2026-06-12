import { convexTest } from "convex-test";
import { describe, it, expect, beforeEach } from "vitest";
import { api } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Regression tests for the WhatsApp IDOR / role-guard fixes (H1, M1, M2).
 *
 * sendTestMessageByChannel and getChannelStatus resolve a client-supplied
 * channelId and previously reached Meta's API with that channel's credentials
 * WITHOUT verifying the caller belongs to the channel's org. The guard
 * (assertChannelManager) now throws before any network call, so these tests
 * assert the rejection path only (no fetch is performed when the guard rejects).
 */
describe("WhatsApp channel access control", () => {
    let t: any;
    // Org A owns the channel.
    let ownerA: string;
    let orgA: string;
    let channelA: string;
    // Agent of org A (member, but lacks settings:whatsapp).
    let agentA: string;
    // Outsider: owner of a different org B (not a member of org A).
    let outsiderB: string;

    beforeEach(async () => {
        t = convexTest(schema, modules);

        const setup = await t.run(async (ctx: any) => {
            const mkOrg = async (name: string, ownerEmail: string) => {
                const uid = await ctx.db.insert("users", { email: ownerEmail, name });
                const oid = await ctx.db.insert("organizations", {
                    name,
                    ownerId: uid,
                    plan: "BUSINESS",
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
            };

            const a = await mkOrg("Org A", "ownerA@test.com");
            const b = await mkOrg("Org B", "ownerB@test.com");

            // Agent in org A (no settings:whatsapp permission).
            const agentUid = await ctx.db.insert("users", { email: "agentA@test.com", name: "Agent A" });
            await ctx.db.insert("memberships", {
                userId: agentUid,
                organizationId: a.oid,
                role: "AGENT",
                status: "ONLINE",
                maxConversations: 5,
                activeConversations: 0,
                lastSeenAt: Date.now(),
                joinedAt: Date.now(),
            });
            await ctx.db.insert("userSessions", {
                userId: agentUid,
                currentOrganizationId: a.oid,
                lastActivityAt: Date.now(),
            });

            const wid = await ctx.db.insert("wabas", {
                organizationId: a.oid,
                metaBusinessAccountId: "waba_A",
                accessTokenRef: "enc_token_A",
                label: "WABA A",
                createdBy: a.uid,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });
            const cid = await ctx.db.insert("whatsappChannels", {
                organizationId: a.oid,
                wabaId: wid,
                label: "Channel A",
                phoneNumberId: "phone_A",
                displayPhoneNumber: "+221 77 000 00 01",
                webhookVerifyTokenRef: "vt",
                isOrgDefault: true,
                status: "active",
                createdBy: a.uid,
                createdAt: Date.now(),
                updatedAt: Date.now(),
            });

            return { ownerA: a.uid, orgA: a.oid, channelA: cid, agentA: agentUid, outsiderB: b.uid };
        });

        ownerA = setup.ownerA;
        orgA = setup.orgA;
        channelA = setup.channelA;
        agentA = setup.agentA;
        outsiderB = setup.outsiderB;
    });

    it("H1: rejects sendTestMessageByChannel from a non-member (cross-tenant IDOR)", async () => {
        await expect(
            t.withIdentity({ subject: outsiderB }).action(api.whatsapp.sendTestMessageByChannel, {
                channelId: channelA,
                to: "+221770000099",
            }),
        ).rejects.toThrow(/membre/i);
    });

    it("M1: rejects getChannelStatus from a non-member (cross-tenant IDOR)", async () => {
        await expect(
            t.withIdentity({ subject: outsiderB }).action(api.whatsapp.getChannelStatus, {
                channelId: channelA,
            }),
        ).rejects.toThrow(/membre/i);
    });

    it("rejects an unauthenticated caller", async () => {
        await expect(
            t.action(api.whatsapp.getChannelStatus, { channelId: channelA }),
        ).rejects.toThrow(/authentifié/i);
    });

    it("M2: rejects an AGENT (member without settings:whatsapp) from channel ops", async () => {
        await expect(
            t.withIdentity({ subject: agentA }).action(api.whatsapp.sendTestMessageByChannel, {
                channelId: channelA,
                to: "+221770000099",
            }),
        ).rejects.toThrow(/Permission refusée/i);
    });
});
