import { createAccount, modifyAccountCredentials } from "@convex-dev/auth/server";
import { v } from "convex/values";
import { action, internalMutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";
import { createNotification, schedulePushForNotification } from "./notifications";

const DEMO_SEED_VERSION = "s4-app-review-demo-v1";
const DEMO_ORG_SLUG = "jokko-app-review-demo";
const DEFAULT_REVIEW_EMAIL = "app-review@jokko.example";
const DEFAULT_DISPLAY_PHONE = "+1 555 010 4242";

type OutboundMode = "local_only" | "whatsapp_api";
type DemoSeedSummary = {
    organizationId: Id<"organizations">;
    whatsappChannelId: Id<"whatsappChannels">;
    conversationCount: number;
    templateCount: number;
    seedVersion: string;
    outboundMode: OutboundMode;
};

function requiredEnv(name: string): string {
    const value = process.env[name];
    if (!value) throw new Error(`Missing required env var ${name}`);
    return value;
}

function optionalEnv(name: string): string | undefined {
    return process.env[name] || undefined;
}

function assertReviewPassword(password: string) {
    if (password.length < 16) {
        throw new Error("DEMO_REVIEW_PASSWORD must be at least 16 characters");
    }
    if (!/[A-Z]/.test(password) || !/[a-z]/.test(password) || !/[0-9]/.test(password)) {
        throw new Error("DEMO_REVIEW_PASSWORD must include uppercase, lowercase, and a digit");
    }
}

export const seedAppReviewDemo = action({
    args: {
        seedToken: v.string(),
        email: v.optional(v.string()),
        password: v.optional(v.string()),
        displayPhoneNumber: v.optional(v.string()),
        outboundMode: v.optional(v.union(v.literal("local_only"), v.literal("whatsapp_api"))),
    },
    handler: async (ctx, args): Promise<DemoSeedSummary & {
        reviewEmail: string;
        passwordSource: string;
        appStoreConnectNote: string;
    }> => {
        const expectedSeedToken = requiredEnv("DEMO_SEED_TOKEN");
        if (args.seedToken !== expectedSeedToken) {
            throw new Error("Invalid demo seed token");
        }

        const email = (args.email || optionalEnv("DEMO_REVIEW_EMAIL") || DEFAULT_REVIEW_EMAIL).toLowerCase();
        const password = args.password || requiredEnv("DEMO_REVIEW_PASSWORD");
        assertReviewPassword(password);

        const now = Date.now();
        const accountArgs = {
            provider: "password",
            account: {
                id: email,
                secret: password,
            },
            profile: {
                email,
                name: "Jokko App Review",
                emailVerificationTime: now,
                onboardingCompleted: true,
                locale: "fr-FR",
                timezone: "Europe/Paris",
                createdAt: now,
                updatedAt: now,
            },
            shouldLinkViaEmail: true,
        };

        let accountResult: Awaited<ReturnType<typeof createAccount>>;
        try {
            accountResult = await createAccount(ctx, accountArgs);
        } catch (error) {
            if (!(error instanceof Error) || !error.message.includes("already exists")) {
                throw error;
            }
            await modifyAccountCredentials(ctx, {
                provider: "password",
                account: {
                    id: email,
                    secret: password,
                },
            });
            accountResult = await createAccount(ctx, accountArgs);
        }

        const summary = await ctx.runMutation("demo:seedAppReviewWorkspace" as any, {
            reviewUserId: accountResult.user._id as Id<"users">,
            reviewEmail: email,
            displayPhoneNumber: args.displayPhoneNumber || optionalEnv("DEMO_WA_DISPLAY_PHONE") || DEFAULT_DISPLAY_PHONE,
            phoneNumberId: optionalEnv("DEMO_WA_PHONE_NUMBER_ID") || "demo_phone_number_id",
            businessAccountId: optionalEnv("DEMO_WA_BUSINESS_ACCOUNT_ID") || "demo_waba_id",
            outboundMode: args.outboundMode || (optionalEnv("DEMO_OUTBOUND_MODE") as OutboundMode | undefined) || "local_only",
        }) as DemoSeedSummary;

        return {
            ...summary,
            reviewEmail: email,
            passwordSource: args.password ? "argument" : "DEMO_REVIEW_PASSWORD",
            appStoreConnectNote:
                "Use the seeded credentials to sign in. The demo workspace is preconfigured with fake WhatsApp conversations and local-only outbound messages unless DEMO_OUTBOUND_MODE=whatsapp_api.",
        };
    },
});

export const seedAppReviewWorkspace = internalMutation({
    args: {
        reviewUserId: v.id("users"),
        reviewEmail: v.string(),
        displayPhoneNumber: v.string(),
        phoneNumberId: v.string(),
        businessAccountId: v.string(),
        outboundMode: v.union(v.literal("local_only"), v.literal("whatsapp_api")),
    },
    handler: async (ctx, args) => {
        const now = Date.now();

        await ctx.db.patch(args.reviewUserId, {
            name: "Jokko App Review",
            email: args.reviewEmail,
            emailVerificationTime: now,
            onboardingCompleted: true,
            locale: "fr-FR",
            timezone: "Europe/Paris",
            updatedAt: now,
        });

        let org = await ctx.db
            .query("organizations")
            .withIndex("by_slug", (q) => q.eq("slug", DEMO_ORG_SLUG))
            .first();

        let orgId: Id<"organizations">;
        if (org) {
            orgId = org._id;
            await ctx.db.patch(orgId, {
                name: "Jokko Demo Review",
                ownerId: args.reviewUserId,
                onboardingStep: "COMPLETED",
                businessSector: "Customer support",
                timezone: "Europe/Paris",
                locale: "fr-FR",
                plan: "BUSINESS",
                hasSelectedPlan: true,
                whatsapp: {
                    phoneNumberId: args.phoneNumberId,
                    businessAccountId: args.businessAccountId,
                    accessToken: "demo_local_only_access_token",
                    webhookVerifyToken: "demo_local_only_verify_token",
                    displayPhoneNumber: args.displayPhoneNumber,
                    verifiedName: "Jokko Demo",
                },
                demo: {
                    kind: "APP_REVIEW",
                    seedVersion: DEMO_SEED_VERSION,
                    seededAt: now,
                    outboundMode: args.outboundMode,
                    notes: "Seeded by S4 for App Store and Meta WABA review. Fake data only.",
                },
                updatedAt: now,
            });
        } else {
            orgId = await ctx.db.insert("organizations", {
                name: "Jokko Demo Review",
                slug: DEMO_ORG_SLUG,
                businessSector: "Customer support",
                website: "https://jokko.app",
                phone: args.displayPhoneNumber,
                timezone: "Europe/Paris",
                locale: "fr-FR",
                onboardingStep: "COMPLETED",
                ownerId: args.reviewUserId,
                whatsapp: {
                    phoneNumberId: args.phoneNumberId,
                    businessAccountId: args.businessAccountId,
                    accessToken: "demo_local_only_access_token",
                    webhookVerifyToken: "demo_local_only_verify_token",
                    displayPhoneNumber: args.displayPhoneNumber,
                    verifiedName: "Jokko Demo",
                },
                settings: {
                    autoReplyEnabled: true,
                    autoReplyMessage: "Merci pour votre message. L'equipe Jokko Demo vous repond rapidement.",
                    defaultLanguage: "fr-FR",
                    assignment: {
                        autoAssignEnabled: true,
                        maxConcurrentChats: 5,
                        excludeOfflineAgents: false,
                    },
                },
                plan: "BUSINESS",
                creditBalance: 25000,
                trialStartedAt: now,
                trialEndsAt: now + 14 * 24 * 60 * 60 * 1000,
                hasSelectedPlan: true,
                demo: {
                    kind: "APP_REVIEW",
                    seedVersion: DEMO_SEED_VERSION,
                    seededAt: now,
                    outboundMode: args.outboundMode,
                    notes: "Seeded by S4 for App Store and Meta WABA review. Fake data only.",
                },
                createdAt: now,
                updatedAt: now,
            });
        }

        await ensureMembership(ctx, {
            userId: args.reviewUserId,
            organizationId: orgId,
            role: "OWNER",
            status: "ONLINE",
            maxConversations: 100,
            activeConversations: 3,
        });
        await ensureSession(ctx, args.reviewUserId, orgId);

        const supportUserId = await ensureUser(ctx, {
            email: "support.agent@jokko.example",
            name: "Awa Support",
            locale: "fr-FR",
            timezone: "Europe/Paris",
        });
        const salesUserId = await ensureUser(ctx, {
            email: "sales.agent@jokko.example",
            name: "Moussa Sales",
            locale: "fr-FR",
            timezone: "Europe/Paris",
        });

        const supportPoleId = await ensurePole(ctx, orgId, {
            name: "Support",
            description: "Questions clients et suivi de commandes",
            color: "#4A6CF7",
            icon: "Headphones",
        });
        const salesPoleId = await ensurePole(ctx, orgId, {
            name: "Ventes",
            description: "Demandes commerciales entrantes",
            color: "#10B981",
            icon: "BadgeEuro",
        });

        const supportTeamId = await ensureTeam(ctx, orgId, args.reviewUserId, {
            name: "Support",
            description: "Equipe support Jokko Demo",
            color: "#4A6CF7",
        });
        const salesTeamId = await ensureTeam(ctx, orgId, args.reviewUserId, {
            name: "Ventes",
            description: "Equipe commerciale Jokko Demo",
            color: "#10B981",
        });

        await ensureMembership(ctx, {
            userId: supportUserId,
            organizationId: orgId,
            role: "AGENT",
            poleId: supportPoleId,
            status: "ONLINE",
            maxConversations: 10,
            activeConversations: 2,
        });
        await ensureMembership(ctx, {
            userId: salesUserId,
            organizationId: orgId,
            role: "AGENT",
            poleId: salesPoleId,
            status: "AWAY",
            maxConversations: 10,
            activeConversations: 1,
        });
        await ensureTeamMember(ctx, supportTeamId, supportUserId, "agent");
        await ensureTeamMember(ctx, salesTeamId, salesUserId, "agent");

        const wabaId = await ensureWaba(ctx, orgId, args.reviewUserId, args.businessAccountId);
        const channelId = await ensureWhatsappChannel(ctx, {
            organizationId: orgId,
            wabaId,
            createdBy: args.reviewUserId,
            primaryTeamId: supportTeamId,
            poleId: supportPoleId,
            phoneNumberId: args.phoneNumberId,
            displayPhoneNumber: args.displayPhoneNumber,
        });

        const vipTagId = await ensureTag(ctx, orgId, "VIP", "#F59E0B");
        const orderTagId = await ensureTag(ctx, orgId, "Commande", "#4A6CF7");
        const supportTagId = await ensureTag(ctx, orgId, "Support", "#10B981");

        const conversations = await seedConversations(ctx, {
            orgId,
            channelId,
            reviewUserId: args.reviewUserId,
            supportUserId,
            salesUserId,
            supportTeamId,
            salesTeamId,
            supportPoleId,
            salesPoleId,
            vipTagId,
            orderTagId,
            supportTagId,
            now,
        });

        const templateIds = await seedTemplates(ctx, orgId);
        await seedNotifications(ctx, orgId, args.reviewUserId, conversations[0]?.conversationId);

        return {
            organizationId: orgId,
            whatsappChannelId: channelId,
            conversationCount: conversations.length,
            templateCount: templateIds.length,
            seedVersion: DEMO_SEED_VERSION,
            outboundMode: args.outboundMode,
        };
    },
});

async function ensureUser(
    ctx: any,
    user: {
        email: string;
        name: string;
        locale: string;
        timezone: string;
    },
): Promise<Id<"users">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("users")
        .withIndex("email", (q: any) => q.eq("email", user.email))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            name: user.name,
            locale: user.locale,
            timezone: user.timezone,
            updatedAt: now,
        });
        return existing._id;
    }

    return await ctx.db.insert("users", {
        email: user.email,
        name: user.name,
        locale: user.locale,
        timezone: user.timezone,
        onboardingCompleted: true,
        createdAt: now,
        updatedAt: now,
    });
}

async function ensureMembership(
    ctx: any,
    membership: {
        userId: Id<"users">;
        organizationId: Id<"organizations">;
        role: "OWNER" | "ADMIN" | "AGENT";
        poleId?: Id<"poles">;
        status: "ONLINE" | "BUSY" | "AWAY" | "OFFLINE";
        maxConversations: number;
        activeConversations: number;
    },
) {
    const now = Date.now();
    const existing = await ctx.db
        .query("memberships")
        .withIndex("by_user_org", (q: any) =>
            q.eq("userId", membership.userId).eq("organizationId", membership.organizationId),
        )
        .first();

    const payload = {
        role: membership.role,
        poleId: membership.poleId,
        status: membership.status,
        maxConversations: membership.maxConversations,
        activeConversations: membership.activeConversations,
        lastSeenAt: now,
        lastAssignedAt: now - 30 * 60 * 1000,
    };

    if (existing) {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
    }

    return await ctx.db.insert("memberships", {
        userId: membership.userId,
        organizationId: membership.organizationId,
        ...payload,
        joinedAt: now,
    });
}

async function ensureSession(ctx: any, userId: Id<"users">, orgId: Id<"organizations">) {
    const now = Date.now();
    const session = await ctx.db.query("userSessions").withIndex("by_user", (q: any) => q.eq("userId", userId)).first();
    if (session) {
        await ctx.db.patch(session._id, {
            currentOrganizationId: orgId,
            lastActivityAt: now,
        });
        return session._id;
    }
    return await ctx.db.insert("userSessions", {
        userId,
        currentOrganizationId: orgId,
        lastActivityAt: now,
    });
}

async function ensurePole(
    ctx: any,
    organizationId: Id<"organizations">,
    pole: { name: string; description: string; color: string; icon: string },
): Promise<Id<"poles">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("poles")
        .withIndex("by_organization", (q: any) => q.eq("organizationId", organizationId))
        .filter((q: any) => q.eq(q.field("name"), pole.name))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, { ...pole, updatedAt: now });
        return existing._id;
    }

    return await ctx.db.insert("poles", {
        organizationId,
        ...pole,
        createdAt: now,
        updatedAt: now,
    });
}

async function ensureTeam(
    ctx: any,
    organizationId: Id<"organizations">,
    createdBy: Id<"users">,
    team: { name: string; description: string; color: string },
): Promise<Id<"teams">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("teams")
        .withIndex("by_org", (q: any) => q.eq("organizationId", organizationId))
        .filter((q: any) => q.eq(q.field("name"), team.name))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            description: team.description,
            color: team.color,
            isArchived: false,
            updatedAt: now,
        });
        return existing._id;
    }

    return await ctx.db.insert("teams", {
        organizationId,
        ...team,
        isArchived: false,
        createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

async function ensureTeamMember(ctx: any, teamId: Id<"teams">, userId: Id<"users">, role: string) {
    const existing = await ctx.db
        .query("teamMembers")
        .withIndex("by_team_user", (q: any) => q.eq("teamId", teamId).eq("userId", userId))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            role,
            isActive: true,
            updatedAt: Date.now(),
        });
        return existing._id;
    }

    return await ctx.db.insert("teamMembers", {
        teamId,
        userId,
        role,
        isActive: true,
        joinedAt: Date.now(),
        createdAt: Date.now(),
        updatedAt: Date.now(),
    });
}

async function ensureWaba(
    ctx: any,
    organizationId: Id<"organizations">,
    createdBy: Id<"users">,
    businessAccountId: string,
): Promise<Id<"wabas">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("wabas")
        .withIndex("by_meta_waba_id", (q: any) => q.eq("metaBusinessAccountId", businessAccountId))
        .first();

    if (existing) {
        await ctx.db.patch(existing._id, {
            organizationId,
            label: "Jokko Demo WABA",
            accessTokenRef: "demo_local_only_token_ref",
            updatedAt: now,
        });
        return existing._id;
    }

    return await ctx.db.insert("wabas", {
        organizationId,
        metaBusinessAccountId: businessAccountId,
        accessTokenRef: "demo_local_only_token_ref",
        label: "Jokko Demo WABA",
        createdBy,
        createdAt: now,
        updatedAt: now,
    });
}

async function ensureWhatsappChannel(
    ctx: any,
    channel: {
        organizationId: Id<"organizations">;
        wabaId: Id<"wabas">;
        createdBy: Id<"users">;
        primaryTeamId: Id<"teams">;
        poleId: Id<"poles">;
        phoneNumberId: string;
        displayPhoneNumber: string;
    },
): Promise<Id<"whatsappChannels">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("whatsappChannels")
        .withIndex("by_phone_id", (q: any) => q.eq("phoneNumberId", channel.phoneNumberId))
        .first();

    const payload = {
        organizationId: channel.organizationId,
        wabaId: channel.wabaId,
        primaryTeamId: channel.primaryTeamId,
        poleId: channel.poleId,
        label: "Jokko Demo WhatsApp",
        displayPhoneNumber: channel.displayPhoneNumber,
        verifiedName: "Jokko Demo",
        webhookVerifyTokenRef: "demo_local_only_verify_ref",
        isOrgDefault: true,
        status: "active" as const,
        callingEnabled: false,
        lastConnectedAt: now,
        updatedAt: now,
    };

    if (existing) {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
    }

    return await ctx.db.insert("whatsappChannels", {
        ...payload,
        phoneNumberId: channel.phoneNumberId,
        createdBy: channel.createdBy,
        createdAt: now,
    });
}

async function ensureTag(ctx: any, organizationId: Id<"organizations">, name: string, color: string): Promise<Id<"tags">> {
    const existing = await ctx.db
        .query("tags")
        .withIndex("by_org_name", (q: any) => q.eq("organizationId", organizationId).eq("name", name))
        .first();
    if (existing) {
        await ctx.db.patch(existing._id, { color });
        return existing._id;
    }
    return await ctx.db.insert("tags", {
        organizationId,
        name,
        color,
        createdAt: Date.now(),
    });
}

async function seedConversations(
    ctx: any,
    args: {
        orgId: Id<"organizations">;
        channelId: Id<"whatsappChannels">;
        reviewUserId: Id<"users">;
        supportUserId: Id<"users">;
        salesUserId: Id<"users">;
        supportTeamId: Id<"teams">;
        salesTeamId: Id<"teams">;
        supportPoleId: Id<"poles">;
        salesPoleId: Id<"poles">;
        vipTagId: Id<"tags">;
        orderTagId: Id<"tags">;
        supportTagId: Id<"tags">;
        now: number;
    },
) {
    const contactSpecs = [
        {
            key: "sophie-order",
            phone: "+15550101001",
            name: "Sophie Martin",
            firstName: "Sophie",
            lastName: "Martin",
            company: "Maison Botanique",
            tags: [args.vipTagId, args.orderTagId],
            assignee: args.reviewUserId,
            teamId: args.supportTeamId,
            poleId: args.supportPoleId,
            unreadCount: 2,
            priority: "high",
            status: "OPEN",
            minutesAgo: 6,
            messages: [
                { direction: "INBOUND", type: "TEXT", content: "Bonjour, ma commande indique livree mais je n'ai rien recu.", minutesAgo: 28, status: "READ" },
                { direction: "OUTBOUND", type: "TEXT", content: "Bonjour Sophie, je regarde le suivi et je reviens vers vous tout de suite.", minutesAgo: 24, status: "DELIVERED" },
                { direction: "INBOUND", type: "TEXT", content: "Merci. Le transporteur est peut-etre passe a l'ancienne adresse.", minutesAgo: 6, status: "DELIVERED" },
            ],
        },
        {
            key: "amadou-quote",
            phone: "+15550101002",
            name: "Amadou Diop",
            firstName: "Amadou",
            lastName: "Diop",
            company: "Diop Distribution",
            tags: [args.vipTagId],
            assignee: args.salesUserId,
            teamId: args.salesTeamId,
            poleId: args.salesPoleId,
            unreadCount: 1,
            priority: "urgent",
            status: "OPEN",
            minutesAgo: 14,
            messages: [
                { direction: "INBOUND", type: "TEXT", content: "Bonjour, pouvez-vous m'envoyer un devis pour 25 licences ?", minutesAgo: 90, status: "READ" },
                { direction: "OUTBOUND", type: "DOCUMENT", content: "Voici une proposition indicative.", fileName: "devis-demo.pdf", fileSize: 184320, mediaUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", mediaType: "application/pdf", minutesAgo: 60, status: "READ" },
                { direction: "INBOUND", type: "TEXT", content: "Parfait, j'aimerais planifier un appel cet apres-midi.", minutesAgo: 14, status: "DELIVERED" },
            ],
        },
        {
            key: "nina-product",
            phone: "+15550101003",
            name: "Nina Keller",
            firstName: "Nina",
            lastName: "Keller",
            company: "Atelier Keller",
            tags: [args.supportTagId],
            assignee: args.supportUserId,
            teamId: args.supportTeamId,
            poleId: args.supportPoleId,
            unreadCount: 0,
            priority: "normal",
            status: "OPEN",
            minutesAgo: 42,
            messages: [
                { direction: "INBOUND", type: "IMAGE", content: "Voici la capture de l'erreur affichee.", mediaUrl: "https://placehold.co/900x600/png?text=Jokko+Demo", mediaType: "image/png", minutesAgo: 80, status: "READ" },
                { direction: "OUTBOUND", type: "TEXT", content: "Merci Nina, la capture est claire. On corrige la configuration du canal.", minutesAgo: 42, status: "READ" },
            ],
        },
        {
            key: "lucas-location",
            phone: "+15550101004",
            name: "Lucas Bernard",
            firstName: "Lucas",
            lastName: "Bernard",
            company: "Bernard Retail",
            tags: [args.orderTagId],
            assignee: undefined,
            teamId: args.supportTeamId,
            poleId: args.supportPoleId,
            unreadCount: 3,
            priority: "normal",
            status: "OPEN",
            minutesAgo: 3,
            messages: [
                { direction: "INBOUND", type: "TEXT", content: "Bonjour, est-ce possible de livrer a cette adresse ?", minutesAgo: 18, status: "DELIVERED" },
                { direction: "INBOUND", type: "LOCATION", content: "Adresse de livraison", latitude: 48.8566, longitude: 2.3522, locationName: "Jokko Demo Paris", locationAddress: "Paris, France", minutesAgo: 17, status: "DELIVERED" },
                { direction: "INBOUND", type: "TEXT", content: "Je suis disponible pour confirmer dans les 10 prochaines minutes.", minutesAgo: 3, status: "DELIVERED" },
            ],
        },
    ];

    const result: Array<{ contactId: Id<"contacts">; conversationId: Id<"conversations"> }> = [];

    for (const spec of contactSpecs) {
        const contactId = await ensureContact(ctx, args.orgId, {
            phone: spec.phone,
            name: spec.name,
            firstName: spec.firstName,
            lastName: spec.lastName,
            company: spec.company,
            tags: spec.tags,
        });

        const lastMessageAt = args.now - spec.minutesAgo * 60 * 1000;
        const conversationId = await ensureConversation(ctx, {
            organizationId: args.orgId,
            contactId,
            whatsappChannelId: args.channelId,
            externalChannelId: `demo:${spec.key}`,
            assignedTo: spec.assignee,
            assignedTeamId: spec.teamId,
            poleId: spec.poleId,
            status: spec.status,
            unreadCount: spec.unreadCount,
            priority: spec.priority,
            lastMessageAt,
            windowExpiresAt: args.now + 21 * 60 * 60 * 1000,
            tags: spec.tags.map(String),
        });

        let preview = "";
        let lastDirection = "INBOUND";
        for (const [index, message] of spec.messages.entries()) {
            const messageId = await ensureMessage(ctx, {
                organizationId: args.orgId,
                conversationId,
                contactId,
                senderId: message.direction === "OUTBOUND" ? (spec.assignee || args.reviewUserId) : undefined,
                externalId: `demo:${spec.key}:${index}`,
                createdAt: args.now - message.minutesAgo * 60 * 1000,
                ...message,
            });
            preview = message.content || `[${message.type}]`;
            lastDirection = message.direction;
            void messageId;
        }

        await ctx.db.patch(conversationId, {
            preview,
            lastMessageDirection: lastDirection,
            lastMessageAt,
            updatedAt: args.now,
        });

        result.push({ contactId, conversationId });
    }

    return result;
}

async function ensureContact(
    ctx: any,
    organizationId: Id<"organizations">,
    contact: {
        phone: string;
        name: string;
        firstName: string;
        lastName: string;
        company: string;
        tags: Id<"tags">[];
    },
): Promise<Id<"contacts">> {
    const now = Date.now();
    const existing = await ctx.db
        .query("contacts")
        .withIndex("by_org_phone", (q: any) => q.eq("organizationId", organizationId).eq("phone", contact.phone))
        .first();

    const payload = {
        name: contact.name,
        firstName: contact.firstName,
        lastName: contact.lastName,
        company: contact.company,
        tags: contact.tags,
        isWhatsApp: true,
        isBlocked: false,
        phoneE164: contact.phone,
        phoneCountryCode: "+1",
        whatsappOptIn: {
            status: "granted" as const,
            source: "inbound_reply" as const,
            at: now - 7 * 24 * 60 * 60 * 1000,
            proofRef: "demo-inbound",
            textVersion: "demo-v1",
        },
        searchName: `${contact.name} ${contact.phone} ${contact.company}`.toLowerCase(),
        updatedAt: now,
    };

    if (existing) {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
    }

    return await ctx.db.insert("contacts", {
        organizationId,
        phone: contact.phone,
        ...payload,
        createdAt: now,
    });
}

async function ensureConversation(
    ctx: any,
    conversation: {
        organizationId: Id<"organizations">;
        contactId: Id<"contacts">;
        whatsappChannelId: Id<"whatsappChannels">;
        externalChannelId: string;
        assignedTo?: Id<"users">;
        assignedTeamId: Id<"teams">;
        poleId: Id<"poles">;
        status: string;
        unreadCount: number;
        priority: string;
        lastMessageAt: number;
        windowExpiresAt: number;
        tags: string[];
    },
): Promise<Id<"conversations">> {
    const existing = await ctx.db
        .query("conversations")
        .withIndex("by_org_contact", (q: any) =>
            q.eq("organizationId", conversation.organizationId).eq("contactId", conversation.contactId).eq("status", conversation.status),
        )
        .first();

    const payload = {
        channel: "WHATSAPP",
        externalChannelId: conversation.externalChannelId,
        whatsappChannelId: conversation.whatsappChannelId,
        assignedTo: conversation.assignedTo,
        assignedUserId: conversation.assignedTo,
        assignedAt: conversation.assignedTo ? conversation.lastMessageAt - 15 * 60 * 1000 : undefined,
        assignedTeamId: conversation.assignedTeamId,
        poleId: conversation.poleId,
        status: conversation.status,
        unreadCount: conversation.unreadCount,
        priority: conversation.priority,
        windowExpiresAt: conversation.windowExpiresAt,
        lastMessageAt: conversation.lastMessageAt,
        tags: conversation.tags,
        updatedAt: Date.now(),
    };

    if (existing) {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
    }

    return await ctx.db.insert("conversations", {
        organizationId: conversation.organizationId,
        contactId: conversation.contactId,
        preview: "",
        lastMessageDirection: "INBOUND",
        ...payload,
        createdAt: conversation.lastMessageAt - 2 * 60 * 60 * 1000,
    });
}

async function ensureMessage(
    ctx: any,
    message: {
        organizationId: Id<"organizations">;
        conversationId: Id<"conversations">;
        contactId: Id<"contacts">;
        senderId?: Id<"users">;
        externalId: string;
        direction: string;
        type: string;
        content?: string;
        mediaUrl?: string;
        mediaType?: string;
        fileName?: string;
        fileSize?: number;
        latitude?: number;
        longitude?: number;
        locationName?: string;
        locationAddress?: string;
        status: string;
        createdAt: number;
    },
): Promise<Id<"messages">> {
    const existing = await ctx.db
        .query("messages")
        .withIndex("by_external_id", (q: any) => q.eq("externalId", message.externalId))
        .first();

    const payload = {
        organizationId: message.organizationId,
        conversationId: message.conversationId,
        senderId: message.senderId,
        contactId: message.direction === "INBOUND" ? message.contactId : undefined,
        type: message.type,
        content: message.content,
        mediaUrl: message.mediaUrl,
        mediaType: message.mediaType,
        fileName: message.fileName,
        fileSize: message.fileSize,
        latitude: message.latitude,
        longitude: message.longitude,
        locationName: message.locationName,
        locationAddress: message.locationAddress,
        direction: message.direction,
        status: message.status,
        externalId: message.externalId,
        createdAt: message.createdAt,
        updatedAt: Date.now(),
    };

    if (existing) {
        await ctx.db.patch(existing._id, payload);
        return existing._id;
    }

    return await ctx.db.insert("messages", payload);
}

async function seedTemplates(ctx: any, organizationId: Id<"organizations">): Promise<Array<Id<"templates">>> {
    const specs = [
        {
            name: "Relance apres 24h",
            slug: "relance-apres-24h",
            body: "Bonjour {{1}}, nous revenons vers vous concernant votre demande. Souhaitez-vous continuer l'echange ?",
            category: "UTILITY",
        },
        {
            name: "Confirmation de commande",
            slug: "confirmation-commande",
            body: "Bonjour {{1}}, votre commande {{2}} est confirmee. Nous vous envoyons le suivi des qu'il est disponible.",
            category: "UTILITY",
        },
    ];

    const ids: Array<Id<"templates">> = [];
    for (const spec of specs) {
        const existing = await ctx.db
            .query("templates")
            .withIndex("by_org_slug_lang", (q: any) =>
                q.eq("organizationId", organizationId).eq("slug", spec.slug).eq("language", "fr"),
            )
            .first();

        const payload = {
            name: spec.name,
            slug: spec.slug,
            description: "Modele de demo pour App Review",
            type: "TEXT",
            category: spec.category,
            language: "fr",
            body: spec.body,
            bodyExamples: ["Sophie", "CMD-2048"],
            status: "APPROVED",
            sentCount: 12,
            deliveredCount: 11,
            readCount: 9,
            repliedCount: 4,
            clickedCount: 0,
            convertedCount: 0,
            failedCount: 1,
            blockedCount: 0,
            updatedAt: Date.now(),
        };

        if (existing) {
            await ctx.db.patch(existing._id, payload);
            ids.push(existing._id);
        } else {
            ids.push(await ctx.db.insert("templates", {
                organizationId,
                ...payload,
                createdAt: Date.now(),
            }));
        }
    }
    return ids;
}

async function seedNotifications(
    ctx: any,
    organizationId: Id<"organizations">,
    userId: Id<"users">,
    conversationId?: Id<"conversations">,
) {
    const existing = await ctx.db
        .query("notifications")
        .withIndex("by_user", (q: any) => q.eq("userId", userId))
        .filter((q: any) => q.eq(q.field("type"), "DEMO_REVIEW_READY"))
        .first();

    const notificationInput = {
        organizationId,
        userId,
        type: "DEMO_REVIEW_READY",
        title: "Espace demo pret",
        message: "Les conversations, modeles et le canal WhatsApp de test sont preconfigures.",
        link: conversationId ? `/dashboard/conversations/${conversationId}` : "/dashboard/conversations",
        isRead: false,
        metadata: {
            seedVersion: DEMO_SEED_VERSION,
            conversationId,
        },
        createdAt: Date.now(),
    };

    if (existing) {
        await ctx.db.patch(existing._id, {
            ...notificationInput,
            isRead: false,
        });
        await schedulePushForNotification(ctx, existing._id);
        return existing._id;
    }

    return await createNotification(ctx, notificationInput);
}
