import { v } from "convex/values";
import { internal } from "./_generated/api";
import { query, mutation, internalAction, internalMutation, internalQuery } from "./_generated/server";
import { getAuthUserId } from "@convex-dev/auth/server";
import type { Doc, Id } from "./_generated/dataModel";
import type { MutationCtx, QueryCtx } from "./_generated/server";

const devicePlatform = v.union(
    v.literal("ios"),
    v.literal("android"),
    v.literal("web"),
    v.literal("unknown")
);

async function requireUserId(ctx: QueryCtx | MutationCtx): Promise<Id<"users">> {
    const userId = await getAuthUserId(ctx);
    if (!userId) throw new Error("Unauthorized");
    return userId;
}

async function getCurrentOrganizationId(
    ctx: QueryCtx | MutationCtx,
    userId: Id<"users">
): Promise<Id<"organizations"> | undefined> {
    const session = await ctx.db
        .query("userSessions")
        .withIndex("by_user", (q) => q.eq("userId", userId))
        .first();

    return session?.currentOrganizationId;
}

type NotificationCreateInput = {
    organizationId: Id<"organizations">;
    userId: Id<"users">;
    type: string;
    title: string;
    message: string;
    link?: string;
    metadata?: unknown;
    createdAt?: number;
};

type PushDeliveryDevice = {
    deviceRecordId: Id<"devices">;
    expoPushToken: string;
};

type PushDeliveryTarget =
    | {
        shouldSend: false;
        reason?: string;
        devices: PushDeliveryDevice[];
    }
    | {
        shouldSend: true;
        notificationId: Id<"notifications">;
        organizationId: Id<"organizations">;
        userId: Id<"users">;
        type: string;
        title: string;
        body: string;
        link?: string;
        devices: PushDeliveryDevice[];
    };

type PushSendResult = {
    sent: number;
    failed: number;
    skipped: string | null;
};

const pushDeliveryResult = v.object({
    deviceRecordId: v.id("devices"),
    status: v.union(v.literal("sent"), v.literal("failed")),
    ticketId: v.optional(v.string()),
    error: v.optional(v.string()),
});

export async function schedulePushForNotification(
    ctx: MutationCtx,
    notificationId: Id<"notifications">
): Promise<void> {
    if (process.env.NODE_ENV === "test" || process.env.VITEST) return;

    await ctx.scheduler.runAfter(0, internal.notifications.sendPushForNotification, {
        notificationId,
    });
}

export async function createNotification(
    ctx: MutationCtx,
    input: NotificationCreateInput
): Promise<Id<"notifications">> {
    const notificationId = await ctx.db.insert("notifications", {
        organizationId: input.organizationId,
        userId: input.userId,
        type: input.type,
        title: input.title,
        message: input.message,
        link: input.link,
        isRead: false,
        metadata: input.metadata,
        createdAt: input.createdAt ?? Date.now(),
    });

    await schedulePushForNotification(ctx, notificationId);
    return notificationId;
}

function getPreferenceCategory(type: string): "newMessages" | "assignments" | "mentions" | "systemAlerts" {
    if (type === "ASSIGNMENT") return "assignments";
    if (type === "MENTION") return "mentions";
    if (type === "MESSAGE" || type === "NEW_MESSAGE") return "newMessages";
    return "systemAlerts";
}

function notificationTypeEnabled(type: string, preferences: Doc<"notificationPreferences">): boolean {
    const category = getPreferenceCategory(type);
    return preferences[category];
}

function metadataString(metadata: unknown, key: string): string | null {
    if (!metadata || typeof metadata !== "object" || Array.isArray(metadata)) return null;
    const value = (metadata as Record<string, unknown>)[key];
    return typeof value === "string" ? value : null;
}

function isMuted(notification: Doc<"notifications">, preferences: Doc<"notificationPreferences">): boolean {
    const conversationId = metadataString(notification.metadata, "conversationId");
    if (conversationId && preferences.mutedConversationIds.some((id) => id.toString() === conversationId)) {
        return true;
    }

    const whatsappChannelId = metadataString(notification.metadata, "whatsappChannelId");
    return Boolean(
        whatsappChannelId &&
        preferences.mutedWhatsappChannelIds.some((id) => id.toString() === whatsappChannelId)
    );
}

function getLocalDndParts(timestamp: number, timezone: string): { hour: number; weekday: string } {
    try {
        const parts = new Intl.DateTimeFormat("en-US", {
            hour: "numeric",
            hourCycle: "h23",
            timeZone: timezone,
            weekday: "short",
        }).formatToParts(new Date(timestamp));

        return {
            hour: Number(parts.find((part) => part.type === "hour")?.value ?? 0),
            weekday: parts.find((part) => part.type === "weekday")?.value ?? "Mon",
        };
    } catch {
        if (timezone === "UTC") {
            const date = new Date(timestamp);
            const weekdays = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
            return { hour: date.getUTCHours(), weekday: weekdays[date.getUTCDay()] ?? "Mon" };
        }

        return getLocalDndParts(timestamp, "UTC");
    }
}

function hourIsInsideWindow(hour: number, startHour: number, endHour: number): boolean {
    if (startHour === endHour) return true;
    if (startHour < endHour) return hour >= startHour && hour < endHour;
    return hour >= startHour || hour < endHour;
}

function isDndActive(preferences: Doc<"notificationPreferences">, timestamp: number): boolean {
    if (!preferences.dndEnabled) return false;

    const { hour, weekday } = getLocalDndParts(timestamp, preferences.dndTimezone);
    if (preferences.dndWeekendsOnly && weekday !== "Sat" && weekday !== "Sun") {
        return false;
    }

    return hourIsInsideWindow(hour, preferences.dndStartHour, preferences.dndEndHour);
}

async function getNotificationPreferences(
    ctx: QueryCtx,
    notification: Doc<"notifications">
): Promise<Doc<"notificationPreferences"> | null> {
    const scoped = await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user_org", (q) =>
            q.eq("userId", notification.userId).eq("organizationId", notification.organizationId)
        )
        .first();
    if (scoped) return scoped;

    return await ctx.db
        .query("notificationPreferences")
        .withIndex("by_user_org", (q) =>
            q.eq("userId", notification.userId).eq("organizationId", undefined)
        )
        .first();
}

async function shouldSendPushForNotification(
    ctx: QueryCtx,
    notification: Doc<"notifications">,
    timestamp: number
): Promise<{ shouldSend: boolean; reason?: string }> {
    const preferences = await getNotificationPreferences(ctx, notification);
    if (!preferences) return { shouldSend: true };
    if (!notificationTypeEnabled(notification.type, preferences)) {
        return { shouldSend: false, reason: "preferences_disabled" };
    }
    if (isMuted(notification, preferences)) {
        return { shouldSend: false, reason: "muted" };
    }
    if (isDndActive(preferences, timestamp)) {
        return { shouldSend: false, reason: "dnd" };
    }

    return { shouldSend: true };
}

function chunkDevices(devices: PushDeliveryDevice[], size: number): PushDeliveryDevice[][] {
    const chunks: PushDeliveryDevice[][] = [];
    for (let index = 0; index < devices.length; index += size) {
        chunks.push(devices.slice(index, index + size));
    }
    return chunks;
}

function expoTicketError(ticket: unknown): string | undefined {
    if (!ticket || typeof ticket !== "object") return undefined;
    const details = (ticket as { details?: unknown }).details;
    if (!details || typeof details !== "object") return undefined;
    const error = (details as { error?: unknown }).error;
    return typeof error === "string" ? error : undefined;
}

function expoTicketId(ticket: unknown): string | undefined {
    if (!ticket || typeof ticket !== "object") return undefined;
    const id = (ticket as { id?: unknown }).id;
    return typeof id === "string" ? id : undefined;
}

function expoTicketStatus(ticket: unknown): "ok" | "error" | null {
    if (!ticket || typeof ticket !== "object") return null;
    const status = (ticket as { status?: unknown }).status;
    if (status === "ok" || status === "error") return status;
    return null;
}

function expoTickets(body: unknown): unknown[] {
    if (!body || typeof body !== "object") return [];
    const data = (body as { data?: unknown }).data;
    return Array.isArray(data) ? data : [];
}

export const list = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .take(20);

        return notifications;
    },
});

export const unreadCount = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return 0;

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
            .collect();

        return unread.length;
    },
});

export const markAsRead = mutation({
    args: { notificationId: v.id("notifications") },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const notification = await ctx.db.get(args.notificationId);
        if (!notification) throw new Error("Notification not found");
        if (notification.userId !== userId) throw new Error("Unauthorized");

        await ctx.db.patch(args.notificationId, { isRead: true });
    },
});

export const markAllAsRead = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const unread = await ctx.db
            .query("notifications")
            .withIndex("by_user_read", (q) => q.eq("userId", userId).eq("isRead", false))
            .collect();

        for (const notif of unread) {
            await ctx.db.patch(notif._id, { isRead: true });
        }
    },
});

export const clearAll = mutation({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) throw new Error("Unauthorized");

        const notifications = await ctx.db
            .query("notifications")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .collect();

        for (const notif of notifications) {
            await ctx.db.delete(notif._id);
        }
    },
});

export const registerPushDevice = mutation({
    args: {
        expoPushToken: v.string(),
        deviceId: v.string(),
        platform: devicePlatform,
        permissionStatus: v.string(),
        appVersion: v.optional(v.string()),
        nativeBuildVersion: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const organizationId = await getCurrentOrganizationId(ctx, userId);
        const now = Date.now();

        const existingForDevice = await ctx.db
            .query("devices")
            .withIndex("by_user_device", (q) => q.eq("userId", userId).eq("deviceId", args.deviceId))
            .first();

        const existingForToken = existingForDevice
            ? null
            : await ctx.db
                .query("devices")
                .withIndex("by_token", (q) => q.eq("expoPushToken", args.expoPushToken))
                .first();

        const existing = existingForDevice ?? existingForToken;
        const payload = {
            userId,
            organizationId,
            expoPushToken: args.expoPushToken,
            deviceId: args.deviceId,
            platform: args.platform,
            appVersion: args.appVersion,
            nativeBuildVersion: args.nativeBuildVersion,
            permissionStatus: args.permissionStatus,
            notificationsEnabled: true,
            lastActiveAt: now,
            updatedAt: now,
        };

        if (existing) {
            await ctx.db.patch(existing._id, payload);
            return { deviceId: existing._id, registered: true };
        }

        const deviceRecordId = await ctx.db.insert("devices", {
            ...payload,
            createdAt: now,
        });

        return { deviceId: deviceRecordId, registered: true };
    },
});

export const disablePushDevice = mutation({
    args: {
        deviceId: v.string(),
        permissionStatus: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const device = await ctx.db
            .query("devices")
            .withIndex("by_user_device", (q) => q.eq("userId", userId).eq("deviceId", args.deviceId))
            .first();

        if (!device) return { disabled: false };

        await ctx.db.patch(device._id, {
            notificationsEnabled: false,
            permissionStatus: args.permissionStatus ?? device.permissionStatus,
            lastActiveAt: Date.now(),
            updatedAt: Date.now(),
        });

        return { disabled: true };
    },
});

export const saveNotificationPreferences = mutation({
    args: {
        notificationsEnabled: v.optional(v.boolean()),
        newMessages: v.optional(v.boolean()),
        assignments: v.optional(v.boolean()),
        mentions: v.optional(v.boolean()),
        systemAlerts: v.optional(v.boolean()),
        dndEnabled: v.optional(v.boolean()),
        dndStartHour: v.optional(v.number()),
        dndEndHour: v.optional(v.number()),
        dndWeekendsOnly: v.optional(v.boolean()),
        dndTimezone: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const userId = await requireUserId(ctx);
        const organizationId = await getCurrentOrganizationId(ctx, userId);
        const now = Date.now();

        const existing = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user_org", (q) => q.eq("userId", userId).eq("organizationId", organizationId))
            .first();

        const masterFallback = args.notificationsEnabled;

        const newMessages =
            args.newMessages ?? masterFallback ?? existing?.newMessages ?? true;
        const assignments =
            args.assignments ?? masterFallback ?? existing?.assignments ?? true;
        const mentions =
            args.mentions ?? masterFallback ?? existing?.mentions ?? true;
        const systemAlerts =
            args.systemAlerts ?? masterFallback ?? existing?.systemAlerts ?? true;

        const payload = {
            userId,
            organizationId,
            newMessages,
            assignments,
            mentions,
            systemAlerts,
            mutedConversationIds: existing?.mutedConversationIds ?? [],
            mutedWhatsappChannelIds: existing?.mutedWhatsappChannelIds ?? [],
            dndEnabled: args.dndEnabled ?? existing?.dndEnabled ?? false,
            dndStartHour: args.dndStartHour ?? existing?.dndStartHour ?? 22,
            dndEndHour: args.dndEndHour ?? existing?.dndEndHour ?? 8,
            dndWeekendsOnly: args.dndWeekendsOnly ?? existing?.dndWeekendsOnly ?? false,
            dndTimezone: args.dndTimezone ?? existing?.dndTimezone ?? "UTC",
            updatedAt: now,
        };

        if (existing) {
            await ctx.db.patch(existing._id, payload);
            return { preferencesId: existing._id, saved: true };
        }

        const preferencesId = await ctx.db.insert("notificationPreferences", {
            ...payload,
            createdAt: now,
        });

        return { preferencesId, saved: true };
    },
});

export const getMyNotificationPreferences = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const session = await ctx.db
            .query("userSessions")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .first();
        const organizationId = session?.currentOrganizationId;

        const scoped = await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", organizationId)
            )
            .first();
        if (scoped) return scoped;

        return await ctx.db
            .query("notificationPreferences")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", undefined)
            )
            .first();
    },
});

export const listMyPushDevices = query({
    args: {},
    handler: async (ctx) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        const devices = await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", userId))
            .order("desc")
            .collect();

        return devices.map((device) => ({
            _id: device._id,
            organizationId: device.organizationId,
            deviceId: device.deviceId,
            platform: device.platform,
            appVersion: device.appVersion,
            nativeBuildVersion: device.nativeBuildVersion,
            permissionStatus: device.permissionStatus,
            notificationsEnabled: device.notificationsEnabled,
            lastActiveAt: device.lastActiveAt,
            createdAt: device.createdAt,
            updatedAt: device.updatedAt,
        }));
    },
});

export const getPushDeliveryTarget = internalQuery({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args): Promise<PushDeliveryTarget> => {
        const notification = await ctx.db.get(args.notificationId);
        if (!notification) {
            return { shouldSend: false, reason: "not_found", devices: [] };
        }

        const routing = await shouldSendPushForNotification(ctx, notification, Date.now());
        if (!routing.shouldSend) {
            return { shouldSend: false, reason: routing.reason, devices: [] };
        }

        const devices = await ctx.db
            .query("devices")
            .withIndex("by_user", (q) => q.eq("userId", notification.userId))
            .collect();

        const eligibleDevices = devices
            .filter((device) => {
                if (!device.notificationsEnabled) return false;
                if (device.organizationId && device.organizationId !== notification.organizationId) return false;
                return device.permissionStatus === "granted" || device.permissionStatus === "unknown";
            })
            .map((device) => ({
                deviceRecordId: device._id,
                expoPushToken: device.expoPushToken,
            }));

        if (eligibleDevices.length === 0) {
            return { shouldSend: false, reason: "no_device", devices: [] };
        }

        return {
            shouldSend: true,
            notificationId: notification._id,
            organizationId: notification.organizationId,
            userId: notification.userId,
            type: notification.type,
            title: notification.title,
            body: notification.message,
            link: notification.link,
            devices: eligibleDevices,
        };
    },
});

export const sendPushForNotification = internalAction({
    args: {
        notificationId: v.id("notifications"),
    },
    handler: async (ctx, args): Promise<PushSendResult> => {
        const target = await ctx.runQuery(internal.notifications.getPushDeliveryTarget, {
            notificationId: args.notificationId,
        }) as PushDeliveryTarget;

        if (!target.shouldSend) {
            return { sent: 0, failed: 0, skipped: target.reason ?? "skipped" };
        }

        const results: Array<{
            deviceRecordId: Id<"devices">;
            status: "sent" | "failed";
            ticketId?: string;
            error?: string;
        }> = [];

        const devices = target.devices as PushDeliveryDevice[];
        const chunks = chunkDevices(devices, 100);

        for (const chunk of chunks) {
            const messages = chunk.map((device) => ({
                to: device.expoPushToken,
                sound: "default",
                title: target.title,
                body: target.body,
                data: {
                    notificationId: args.notificationId,
                    organizationId: target.organizationId,
                    type: target.type,
                    link: target.link ?? "",
                },
            }));

            try {
                const response = await fetch("https://exp.host/--/api/v2/push/send", {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    body: JSON.stringify(messages),
                });

                if (!response.ok) {
                    for (const device of chunk) {
                        results.push({
                            deviceRecordId: device.deviceRecordId,
                            status: "failed",
                            error: `HTTP_${response.status}`,
                        });
                    }
                    continue;
                }

                const body = await response.json().catch(() => null);
                const tickets = expoTickets(body);

                for (let index = 0; index < chunk.length; index += 1) {
                    const device = chunk[index];
                    const ticket = tickets[index];
                    const status = expoTicketStatus(ticket);

                    if (status === "ok") {
                        results.push({
                            deviceRecordId: device.deviceRecordId,
                            status: "sent",
                            ticketId: expoTicketId(ticket),
                        });
                    } else {
                        results.push({
                            deviceRecordId: device.deviceRecordId,
                            status: "failed",
                            error: expoTicketError(ticket) ?? "ExpoTicketError",
                        });
                    }
                }
            } catch {
                for (const device of chunk) {
                    results.push({
                        deviceRecordId: device.deviceRecordId,
                        status: "failed",
                        error: "NetworkError",
                    });
                }
            }
        }

        if (results.length > 0) {
            await ctx.runMutation(internal.notifications.recordPushDeliveryResults, {
                notificationId: args.notificationId,
                results,
            });
        }

        return {
            sent: results.filter((result) => result.status === "sent").length,
            failed: results.filter((result) => result.status === "failed").length,
            skipped: null,
        };
    },
});

export const recordPushDeliveryResults = internalMutation({
    args: {
        notificationId: v.id("notifications"),
        results: v.array(pushDeliveryResult),
    },
    handler: async (ctx, args) => {
        const notification = await ctx.db.get(args.notificationId);
        if (!notification) return { recorded: 0 };

        const now = Date.now();
        let recorded = 0;

        for (const result of args.results) {
            await ctx.db.insert("pushDeliveryAttempts", {
                notificationId: notification._id,
                userId: notification.userId,
                organizationId: notification.organizationId,
                deviceRecordId: result.deviceRecordId,
                status: result.status,
                ticketId: result.ticketId,
                error: result.error,
                createdAt: now,
            });
            recorded += 1;

            if (result.status === "failed" && result.error === "DeviceNotRegistered") {
                const device = await ctx.db.get(result.deviceRecordId);
                if (device?.userId === notification.userId) {
                    await ctx.db.patch(device._id, {
                        notificationsEnabled: false,
                        permissionStatus: "unregistered",
                        updatedAt: now,
                    });
                }
            }
        }

        return { recorded };
    },
});
