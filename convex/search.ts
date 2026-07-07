import { v } from "convex/values";
import { query } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";

const EMPTY = { contacts: [], pages: [], messages: [] };

/**
 * Global ⌘K search — contacts, pages, and message bodies. Strictly scoped to
 * the caller's ACTIVE organization (search indexes are filtered by
 * organizationId), so a user never sees another org's data.
 */
export const searchGlobal = query({
    args: { query: v.string() },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return EMPTY;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        const organizationId = session?.currentOrganizationId;
        if (!organizationId) return EMPTY;

        const queryText = args.query.trim();
        if (!queryText) return EMPTY;

        // 1. Contacts (by name/phone)
        const contacts = await ctx.db
            .query("contacts")
            .withSearchIndex("search_contacts", (q) =>
                q.search("searchName", queryText).eq("organizationId", organizationId)
            )
            .take(5);

        // 2. Messages (by content) → resolved to their conversation + contact so
        //    a hit deep-links to the thread. Over-fetch a little, then keep 5.
        const rawMessages = await ctx.db
            .query("messages")
            .withSearchIndex("search_messages", (q) =>
                q.search("content", queryText).eq("organizationId", organizationId)
            )
            .take(8);
        const messages = (
            await Promise.all(
                rawMessages
                    .filter((m) => m.conversationId && m.content)
                    .map(async (m) => {
                        const contact = m.contactId ? await ctx.db.get(m.contactId) : null;
                        const content = m.content ?? "";
                        const snippet = content.length > 80 ? `${content.slice(0, 80)}…` : content;
                        return {
                            id: m._id,
                            name: contact?.name || contact?.phone || "Conversation",
                            snippet,
                            type: "MESSAGE" as const,
                            link: `/dashboard/conversations/${m.conversationId}`,
                        };
                    })
            )
        ).slice(0, 5);

        // 3. Navigation pages (static list, filtered by name)
        const allPages = [
            { name: "Conversations", href: "/dashboard/conversations", icon: "MessageSquare" },
            { name: "Contacts", href: "/dashboard/contacts", icon: "Users" },
            { name: "Modèles", href: "/dashboard/modeles", icon: "FileText" },
            { name: "Campagnes", href: "/dashboard/campagnes", icon: "Send" },
            { name: "Analytique", href: "/dashboard/analytics", icon: "TrendingUp" },
            { name: "Automatisations", href: "/dashboard/automatisations", icon: "Workflow" },
            { name: "Équipe", href: "/dashboard/team", icon: "Building" },
            { name: "Réglages", href: "/dashboard/settings", icon: "Settings" },
            { name: "Facturation", href: "/dashboard/billing", icon: "CreditCard" },
            { name: "Aide & support", href: "/dashboard/help", icon: "HelpCircle" },
        ];
        const lowerQ = queryText.toLowerCase();
        const pages = allPages.filter((p) => p.name.toLowerCase().includes(lowerQ));

        return {
            contacts: contacts.map((c) => ({
                id: c._id,
                name: c.name || c.phone,
                type: "CONTACT" as const,
                link: `/dashboard/contacts?id=${c._id}`,
            })),
            pages: pages.map((p) => ({
                id: p.href,
                name: p.name,
                type: "PAGE" as const,
                link: p.href,
                icon: p.icon,
            })),
            messages,
        };
    },
});
