import { convexTest } from "convex-test";
import { describe, it, expect } from "vitest";
import { internal } from "./_generated/api";
import schema from "./schema";
import { modules } from "./test.modules";

/**
 * Deleting a contact must not leave dead conversation/message references.
 * cascadeDeleteContactData drains the contact's conversations + their messages.
 */
describe("contacts.cascadeDeleteContactData", () => {
    it("removes the contact's conversations and their messages", async () => {
        const t = convexTest(schema, modules);
        const ids = await t.run(async (ctx: any) => {
            const owner = await ctx.db.insert("users", { email: "o@t.com", name: "O" });
            const org = await ctx.db.insert("organizations", {
                name: "Org", ownerId: owner, plan: "BUSINESS", createdAt: Date.now(), updatedAt: Date.now(),
            });
            const contact = await ctx.db.insert("contacts", {
                organizationId: org, name: "C", phone: "1", searchName: "C",
                isWhatsApp: true, createdAt: Date.now(), updatedAt: Date.now(),
            });
            const conv = await ctx.db.insert("conversations", {
                organizationId: org, contactId: contact, status: "OPEN", unreadCount: 0,
                lastMessageAt: Date.now(), channel: "WHATSAPP", createdAt: Date.now(), updatedAt: Date.now(),
            });
            for (let i = 0; i < 3; i++) {
                await ctx.db.insert("messages", {
                    organizationId: org, conversationId: conv, contactId: contact, type: "TEXT",
                    content: `m${i}`, direction: "INBOUND", status: "DELIVERED",
                    createdAt: Date.now(), updatedAt: Date.now(),
                });
            }
            return { org, contact };
        });

        await t.mutation(internal.contacts.cascadeDeleteContactData, {
            organizationId: ids.org,
            contactId: ids.contact,
        });

        const remaining = await t.run(async (ctx: any) => ({
            convs: (await ctx.db.query("conversations").collect()).length,
            msgs: (await ctx.db.query("messages").collect()).length,
        }));
        expect(remaining).toEqual({ convs: 0, msgs: 0 });
    });
});
