/**
 *   ____      _ _
 *  / ___|__ _| | |___
 * | |   / _` | | / __|
 * | |__| (_| | | \__ \
 *  \____\__,_|_|_|___/
 *
 * WHATSAPP BUSINESS CALLING API
 *
 * Handles inbound/outbound WhatsApp voice calls.
 * Convex acts as a signaling relay between Meta and the agent's browser (WebRTC peer).
 */

import { internalMutation, mutation, query, MutationCtx } from "./_generated/server";
import { v } from "convex/values";
import { internal } from "./_generated/api";
import { Id } from "./_generated/dataModel";
import { getAuthUserId } from "@convex-dev/auth/server";
import { requireMembership, requirePermission } from "./lib/auth";
import { callCostFcfa } from "./lib/callPricing";

/**
 * Debit the org's credit for a finished OUTBOUND call (inbound is free).
 *
 * Billed exactly once: both terminateCall and handleCallTerminate guard on a
 * terminal status before reaching here, so whichever ends the call first bills
 * it and the other early-returns. Never drives the balance negative; records a
 * USAGE transaction so the spend shows up in the credit history.
 */
async function billOutboundCall(
    ctx: MutationCtx,
    call: { _id: string; direction: string; toPhone: string; organizationId: Id<"organizations">; [key: string]: unknown },
    durationSeconds: number | undefined,
) {
    if (call.direction !== "OUTBOUND") return;
    const cost = callCostFcfa(call.toPhone, durationSeconds);
    if (cost <= 0) return;

    const org = await ctx.db.get(call.organizationId);
    const balance = org?.creditBalance ?? 0;
    const debit = Math.min(cost, balance); // clamp: never go below zero
    if (debit <= 0) return;

    const newBalance = balance - debit;
    await ctx.db.patch(call.organizationId, { creditBalance: newBalance });
    await ctx.db.insert("creditTransactions", {
        organizationId: call.organizationId,
        amount: -debit,
        type: "USAGE" as const,
        description: `Appel sortant ${call.toPhone} (${Math.ceil((durationSeconds ?? 0) / 60)} min)`,
        referenceId: String(call._id),
        balanceAfter: newBalance,
        createdAt: Date.now(),
    });
}

// ============================================
// WEBHOOK HANDLER (called from http.ts)
// ============================================

export const handleCallWebhook = internalMutation({
    args: {
        callId: v.string(),
        from: v.string(),
        to: v.string(),
        event: v.string(),
        direction: v.optional(v.string()),
        sdp: v.optional(v.string()),
        sdpType: v.optional(v.string()),
        phoneNumberId: v.optional(v.string()),
    },
    handler: async (ctx, args) => {
        const { callId, from, to, event, direction, sdp, sdpType, phoneNumberId } = args;

        if (!phoneNumberId) {
            console.error("[CALLS] Missing phoneNumberId in webhook event");
            return;
        }

        // Resolve channel and organization (same pattern as webhook.ts)
        const channel = await ctx.db
            .query("whatsappChannels")
            .withIndex("by_phone_id", (q) => q.eq("phoneNumberId", phoneNumberId))
            .first();

        let organizationId: Id<"organizations">;
        let whatsappChannelId: Id<"whatsappChannels"> | undefined;

        if (channel) {
            if (channel.status !== "active") {
                console.log(`[CALLS] Channel ${phoneNumberId} is ${channel.status}, skipping`);
                return;
            }
            organizationId = channel.organizationId;
            whatsappChannelId = channel._id;
        } else {
            const organization = await ctx.db
                .query("organizations")
                .withIndex("by_whatsapp_phone_id", (q) => q.eq("whatsapp.phoneNumberId", phoneNumberId))
                .first();

            if (!organization) {
                console.error(`[CALLS] No channel or organization found for phoneNumberId: ${phoneNumberId}`);
                return;
            }
            organizationId = organization._id;

            const defaultChannel = await ctx.db
                .query("whatsappChannels")
                .withIndex("by_org_default", (q) => q.eq("organizationId", organizationId).eq("isOrgDefault", true))
                .first();
            whatsappChannelId = defaultChannel?._id;
        }

        // Handle different call events
        if (event === "connect" && direction === "USER_INITIATED" && sdpType === "offer") {
            // Inbound call: user is calling the business
            await handleInboundCall(ctx, {
                callId,
                from,
                to,
                sdp: sdp || "",
                organizationId,
                whatsappChannelId,
            });
        } else if (event === "terminate") {
            // Call terminated (either side hung up)
            await handleCallTerminate(ctx, { callId });
        } else if (event === "connect" && direction === "BUSINESS_INITIATED") {
            // Outbound call: Meta sends SDP answer back
            await handleOutboundCallUpdate(ctx, { callId, sdp, sdpType });
        } else if (event === "permission_request_accepted") {
            // User accepted the call permission request
            await handlePermissionGranted(ctx, { from, to, phoneNumberId });
        } else {
            console.log(`[CALLS] Unhandled call event: ${event}, direction: ${direction}`);
        }
    },
});

async function handleInboundCall(
    ctx: MutationCtx,
    args: {
        callId: string;
        from: string;
        to: string;
        sdp: string;
        organizationId: Id<"organizations">;
        whatsappChannelId?: Id<"whatsappChannels">;
    }
) {
    const { callId, from, to, sdp, organizationId, whatsappChannelId } = args;

    // Check for duplicate (idempotency)
    const existing = await ctx.db
        .query("calls")
        .withIndex("by_external_call_id", (q: any) => q.eq("externalCallId", callId))
        .first();
    if (existing) {
        console.log(`[CALLS] Duplicate call event for ${callId}, skipping`);
        return;
    }

    // Find or create contact
    let contact = await ctx.db
        .query("contacts")
        .withIndex("by_org_phone", (q: any) =>
            q.eq("organizationId", organizationId).eq("phone", from)
        )
        .first();

    if (!contact) {
        const contactId = await ctx.db.insert("contacts", {
            organizationId,
            phone: from,
            name: from,
            searchName: from,
            isWhatsApp: true,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        contact = await ctx.db.get(contactId);
    }

    if (!contact) throw new Error("Failed to get contact");

    // Find open conversation for this contact
    let conversation = await ctx.db
        .query("conversations")
        .withIndex("by_org_contact", (q: any) =>
            q.eq("organizationId", organizationId)
                .eq("contactId", contact!._id)
                .eq("status", "OPEN")
        )
        .first();

    if (!conversation) {
        const conversationId = await ctx.db.insert("conversations", {
            organizationId,
            contactId: contact._id,
            status: "OPEN",
            unreadCount: 0,
            lastMessageAt: Date.now(),
            channel: "WHATSAPP",
            whatsappChannelId,
            createdAt: Date.now(),
            updatedAt: Date.now(),
        });
        conversation = await ctx.db.get(conversationId);
    }

    // Insert the call record
    const now = Date.now();
    await ctx.db.insert("calls", {
        organizationId,
        conversationId: conversation?._id,
        contactId: contact._id,
        whatsappChannelId,
        externalCallId: callId,
        direction: "INBOUND" as const,
        fromPhone: from,
        toPhone: to,
        sdpOffer: sdp,
        status: "RINGING" as const,
        startedAt: now,
        createdAt: now,
        updatedAt: now,
    });

    console.log(`[CALLS] Inbound call ${callId} from ${from} - RINGING`);
}

async function handleCallTerminate(ctx: MutationCtx, args: { callId: string }) {
    const call = await ctx.db
        .query("calls")
        .withIndex("by_external_call_id", (q: any) => q.eq("externalCallId", args.callId))
        .first();

    if (!call) {
        console.log(`[CALLS] Terminate for unknown call ${args.callId}`);
        return;
    }

    if (call.status === "TERMINATED" || call.status === "REJECTED" || call.status === "MISSED") {
        return; // Already ended
    }

    const now = Date.now();
    const durationSeconds = call.answeredAt
        ? Math.round((now - call.answeredAt) / 1000)
        : undefined;

    await ctx.db.patch(call._id, {
        status: "TERMINATED" as const,
        endedAt: now,
        durationSeconds,
        terminationReason: "remote_hangup",
        updatedAt: now,
    });

    // Debit the org's credit for this outbound call.
    await billOutboundCall(ctx, call, durationSeconds);

    // Insert system message into conversation
    if (call.conversationId) {
        const durationStr = durationSeconds
            ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`
            : null;

        const content = call.status === "CONNECTED" || call.answeredAt
            ? `Appel audio - ${durationStr}`
            : "Appel manque";

        await ctx.db.insert("messages", {
            organizationId: call.organizationId,
            conversationId: call.conversationId,
            contactId: call.contactId,
            type: "SYSTEM",
            content,
            direction: "INBOUND",
            status: "DELIVERED",
            createdAt: now,
            updatedAt: now,
        });

        // Update conversation
        await ctx.db.patch(call.conversationId, {
            lastMessageAt: now,
            preview: content,
            updatedAt: now,
        });
    }

    console.log(`[CALLS] Call ${args.callId} terminated (duration: ${durationSeconds}s)`);
}

async function handleOutboundCallUpdate(
    ctx: MutationCtx,
    args: { callId: string; sdp?: string; sdpType?: string }
) {
    const call = await ctx.db
        .query("calls")
        .withIndex("by_external_call_id", (q: any) => q.eq("externalCallId", args.callId))
        .first();

    if (!call) {
        console.log(`[CALLS] Update for unknown outbound call ${args.callId}`);
        return;
    }

    // If Meta sends back an SDP answer, store it for the browser to pick up
    if (args.sdp && args.sdpType === "answer") {
        await ctx.db.patch(call._id, {
            sdpAnswer: args.sdp,
            updatedAt: Date.now(),
        });
    }
}

async function handlePermissionGranted(
    ctx: MutationCtx,
    args: { callId?: string; from: string; to: string; phoneNumberId: string }
) {
    // Find the REQUESTING_PERMISSION call for this contact
    // The "from" is the user (contact), "to" is the business number
    const calls = await ctx.db
        .query("calls")
        .filter((q: any) =>
            q.and(
                q.eq(q.field("toPhone"), args.from),
                q.eq(q.field("direction"), "OUTBOUND"),
                q.eq(q.field("status"), "REQUESTING_PERMISSION"),
            )
        )
        .collect();

    if (calls.length === 0) {
        console.log(`[CALLS] Permission granted but no pending call found for ${args.from}`);
        return;
    }

    // Take the most recent one
    const call = calls[calls.length - 1];

    await ctx.db.patch(call._id, {
        status: "PERMISSION_GRANTED" as const,
        updatedAt: Date.now(),
    });

    console.log(`[CALLS] Permission granted for call ${call._id} to ${args.from}`);
}

// ============================================
// QUERIES (reactive subscriptions for UI)
// ============================================

export const getActiveCall = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        // SECURITY: only members of the org may read its active call (the result
        // embeds contact PII). Return null for non-members so the reactive
        // subscription stays quiet instead of erroring.
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership) return null;

        // Find any ringing call for this org
        const call = await ctx.db
            .query("calls")
            .withIndex("by_org_status", (q) =>
                q.eq("organizationId", args.organizationId).eq("status", "RINGING")
            )
            .first();

        if (!call) return null;

        const contact = call.contactId ? await ctx.db.get(call.contactId) : null;
        return { ...call, contact };
    },
});

export const getMyActiveCall = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        // Find the call this agent is handling
        for (const status of ["PRE_ACCEPTED", "CONNECTED"] as const) {
            const call = await ctx.db
                .query("calls")
                .withIndex("by_org_status", (q) =>
                    q.eq("organizationId", args.organizationId).eq("status", status)
                )
                .first();

            if (call && call.agentId === userId) {
                const contact = call.contactId ? await ctx.db.get(call.contactId) : null;
                return { ...call, contact };
            }
        }

        return null;
    },
});

export const getMyOutboundCall = query({
    args: {
        organizationId: v.id("organizations"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        // Check for outbound calls in progress states
        for (const status of ["REQUESTING_PERMISSION", "PERMISSION_GRANTED", "RINGING"] as const) {
            const call = await ctx.db
                .query("calls")
                .withIndex("by_org_status", (q) =>
                    q.eq("organizationId", args.organizationId).eq("status", status)
                )
                .first();

            if (call && call.agentId === userId && call.direction === "OUTBOUND") {
                const contact = call.contactId ? await ctx.db.get(call.contactId) : null;
                return { ...call, contact };
            }
        }

        return null;
    },
});

/**
 * Returns status + terminationReason for a specific call owned by the agent.
 * Used by the UI to detect async failures (CPR rejected, 24h window, etc.)
 * after the call has moved to a terminal state.
 */
export const getCallStatusForAgent = query({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return null;

        const call = await ctx.db.get(args.callId);
        if (!call) return null;
        if (call.agentId !== userId) return null;

        return {
            _id: call._id,
            status: call.status,
            terminationReason: call.terminationReason,
            direction: call.direction,
        };
    },
});

export const getCallHistory = query({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        // SECURITY: scope the history read to members of the conversation's org.
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) return [];
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", conversation.organizationId),
            )
            .first();
        if (!membership) return [];

        return await ctx.db
            .query("calls")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .order("desc")
            .take(20);
    },
});

/**
 * Returns the set of channels in the current organization that have had a
 * FAILED outbound call within the freshness window whose terminationReason
 * indicates an expired Meta token (code 190 / OAuthException / etc.).
 *
 * Used by the settings page to render a "Token expire" indicator on the
 * affected channel, since Meta's read-only health probe (`getChannelStatus`)
 * can still return OK while calling scopes are missing.
 */
export const getChannelsWithTokenError = query({
    args: {
        organizationId: v.id("organizations"),
        windowMs: v.optional(v.number()),
    },
    handler: async (ctx, args) => {
        const userId = await getAuthUserId(ctx);
        if (!userId) return [];

        // SECURITY: l'appelant doit être membre de l'org ciblée (sinon divulgation
        // cross-tenant des erreurs de token Meta via un simple organizationId).
        const membership = await ctx.db
            .query("memberships")
            .withIndex("by_user_org", (q) =>
                q.eq("userId", userId).eq("organizationId", args.organizationId),
            )
            .first();
        if (!membership) return [];

        const window = args.windowMs ?? 24 * 60 * 60 * 1000;
        const since = Date.now() - window;

        // Fetch FAILED calls for the org within the window; take enough rows
        // to cover bursty failures without unbounded scanning.
        const failed = await ctx.db
            .query("calls")
            .withIndex("by_org_status", (q) =>
                q.eq("organizationId", args.organizationId).eq("status", "FAILED")
            )
            .order("desc")
            .take(100);

        const byChannel = new Map<
            string,
            { channelId: Id<"whatsappChannels">; lastErrorAt: number; reason: string }
        >();

        for (const call of failed) {
            if (!call.whatsappChannelId) continue;
            if (call.updatedAt < since) continue;

            const raw = (call.terminationReason ?? "").toLowerCase();
            const looksLikeToken =
                raw.includes('"code":190') ||
                raw.includes("(#190)") ||
                raw.includes("oauthexception") ||
                raw.includes("access token has expired") ||
                raw.includes("session has been invalidated") ||
                raw.includes("authentication error");
            if (!looksLikeToken) continue;

            const key = call.whatsappChannelId as unknown as string;
            const existing = byChannel.get(key);
            if (!existing || existing.lastErrorAt < call.updatedAt) {
                byChannel.set(key, {
                    channelId: call.whatsappChannelId,
                    lastErrorAt: call.updatedAt,
                    reason: call.terminationReason ?? "",
                });
            }
        }

        return Array.from(byChannel.values());
    },
});

// ============================================
// MUTATIONS (agent actions from the browser)
// ============================================

// --- OUTBOUND CALLS ---

export const requestOutboundCall = mutation({
    args: {
        conversationId: v.id("conversations"),
    },
    handler: async (ctx, args) => {
        const conversation = await ctx.db.get(args.conversationId);
        if (!conversation) throw new Error("Conversation not found");

        // SECURITY: caller must be a member of the conversation's org with
        // permission to place calls (prevents cross-tenant CPR sends).
        const { userId } = await requirePermission(
            ctx,
            conversation.organizationId,
            "calls:initiate",
        );

        const contact = conversation.contactId
            ? await ctx.db.get(conversation.contactId)
            : null;
        if (!contact?.phone) throw new Error("Contact has no phone number");

        // CREDIT GATE: outbound calls are billable per minute. Block the call when
        // the org has no credit so an agent can't start a call that can't be paid
        // for. The frontend maps INSUFFICIENT_CREDIT to a role-aware message
        // (admin/owner → "Recharger le compte"; agent → "prévenez un administrateur").
        const org = await ctx.db.get(conversation.organizationId);
        if ((org?.creditBalance ?? 0) <= 0) {
            throw new Error("INSUFFICIENT_CREDIT: solde insuffisant pour passer un appel");
        }

        // Check for existing active calls
        const existingCalls = await ctx.db
            .query("calls")
            .withIndex("by_conversation", (q) => q.eq("conversationId", args.conversationId))
            .filter((q) =>
                q.or(
                    q.eq(q.field("status"), "REQUESTING_PERMISSION"),
                    q.eq(q.field("status"), "PERMISSION_GRANTED"),
                    q.eq(q.field("status"), "RINGING"),
                    q.eq(q.field("status"), "PRE_ACCEPTED"),
                    q.eq(q.field("status"), "CONNECTED"),
                )
            )
            .collect();

        const now = Date.now();
        const PERMISSION_EXPIRY = 72 * 60 * 60_000; // 72h - Meta allows calling within 72h of permission
        const CPR_WAIT_WINDOW = 24 * 60 * 60_000; // 24h - user may respond to CPR within a day

        for (const call of existingCalls) {
            // If permission already granted and still valid (within 72h) → reuse this call
            if (call.status === "PERMISSION_GRANTED") {
                if (now - call.startedAt < PERMISSION_EXPIRY) {
                    // Reassign to current agent if needed
                    if (call.agentId !== userId) {
                        await ctx.db.patch(call._id, { agentId: userId, updatedAt: now });
                    }
                    return { callId: call._id, permissionAlreadyGranted: true };
                }
                // Expired permission → clean up
                await ctx.db.patch(call._id, {
                    status: "FAILED" as const,
                    terminationReason: "permission_expired",
                    endedAt: now,
                    updatedAt: now,
                });
                continue;
            }

            // REQUESTING_PERMISSION: only clean up after 24h (user may respond late)
            if (call.status === "REQUESTING_PERMISSION" && now - call.startedAt > CPR_WAIT_WINDOW) {
                await ctx.db.patch(call._id, {
                    status: "FAILED" as const,
                    terminationReason: "cpr_expired",
                    endedAt: now,
                    updatedAt: now,
                });
                continue;
            }

            // Active call (RINGING, PRE_ACCEPTED, CONNECTED, or recent REQUESTING_PERMISSION) → block
            throw new Error("An active call already exists for this conversation");
        }

        // No existing usable call → create new CPR request
        const callId = await ctx.db.insert("calls", {
            organizationId: conversation.organizationId,
            conversationId: args.conversationId,
            contactId: conversation.contactId,
            whatsappChannelId: conversation.whatsappChannelId,
            externalCallId: `outbound_${now}`,
            direction: "OUTBOUND" as const,
            fromPhone: "",
            toPhone: contact.phone,
            agentId: userId,
            status: "REQUESTING_PERMISSION" as const,
            startedAt: now,
            createdAt: now,
            updatedAt: now,
        });

        // Schedule CPR send
        await ctx.scheduler.runAfter(0, internal.call_actions.sendCallPermissionRequest, {
            callId,
            organizationId: conversation.organizationId,
            contactPhone: contact.phone,
        });

        return { callId, permissionAlreadyGranted: false };
    },
});

export const startOutboundCall = mutation({
    args: {
        callId: v.id("calls"),
        sdpOffer: v.string(),
    },
    handler: async (ctx, args) => {
        const call = await ctx.db.get(args.callId);
        if (!call) throw new Error("Call not found");

        // SECURITY: enforce org membership + calls:initiate on the call's org.
        await requirePermission(ctx, call.organizationId, "calls:initiate");

        if (call.status !== "PERMISSION_GRANTED") {
            throw new Error(`Cannot start call: status is ${call.status}, expected PERMISSION_GRANTED`);
        }

        const now = Date.now();
        await ctx.db.patch(args.callId, {
            sdpOffer: args.sdpOffer,
            status: "RINGING" as const,
            updatedAt: now,
        });

        // Schedule Meta API call
        await ctx.scheduler.runAfter(0, internal.call_actions.sendOutboundCallOffer, {
            callId: args.callId,
        });

        return { success: true };
    },
});

// --- INBOUND CALLS ---

export const acceptCall = mutation({
    args: {
        callId: v.id("calls"),
        sdpAnswer: v.string(),
    },
    handler: async (ctx, args) => {
        const call = await ctx.db.get(args.callId);
        if (!call) throw new Error("Call not found");

        // SECURITY: only a member of the call's org with calls:answer may pick it up.
        const { userId } = await requirePermission(ctx, call.organizationId, "calls:answer");

        // Optimistic concurrency: only accept if still ringing
        if (call.status !== "RINGING") {
            throw new Error(`Call is no longer ringing (status: ${call.status})`);
        }

        const now = Date.now();
        await ctx.db.patch(args.callId, {
            status: "PRE_ACCEPTED" as const,
            agentId: userId,
            sdpAnswer: args.sdpAnswer,
            answeredAt: now,
            updatedAt: now,
        });

        // Schedule the Meta API call to send pre_accept
        await ctx.scheduler.runAfter(0, internal.call_actions.sendPreAccept, {
            callId: args.callId,
        });

        return { success: true };
    },
});

export const confirmConnected = mutation({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        const call = await ctx.db.get(args.callId);
        if (!call) throw new Error("Call not found");

        // SECURITY: was fully unauthenticated — require org membership.
        await requireMembership(ctx, call.organizationId);

        const now = Date.now();

        // Inbound: the agent pre-accepted and ICE is now connected → mark CONNECTED
        // and send `accept` to Meta to finalize the incoming call.
        if (call.status === "PRE_ACCEPTED") {
            await ctx.db.patch(args.callId, {
                status: "CONNECTED" as const,
                answeredAt: call.answeredAt ?? now,
                updatedAt: now,
            });
            await ctx.scheduler.runAfter(0, internal.call_actions.sendAccept, { callId: args.callId });
            console.log(`[CALLS] confirmConnected: inbound call ${args.callId} -> CONNECTED`);
            return;
        }

        // Outbound: the call was RINGING after we sent the SDP offer; ICE is now
        // connected → mark CONNECTED. No `accept` action — the offer/answer
        // handshake already established the call with Meta. Set answeredAt so the
        // duration + "Appel audio" system message are correct (outbound calls had
        // no answeredAt, so they always rendered as "Appel manqué"). Leaving the
        // call stuck at RINGING also made getActiveCall treat the live call as an
        // incoming one and routed hang-up to reject (Meta "method not allowed").
        if (call.status === "RINGING" && call.direction === "OUTBOUND") {
            await ctx.db.patch(args.callId, {
                status: "CONNECTED" as const,
                answeredAt: call.answeredAt ?? now,
                updatedAt: now,
            });
            console.log(`[CALLS] confirmConnected: outbound call ${args.callId} -> CONNECTED`);
            return;
        }

        console.log(`[CALLS] confirmConnected: call ${args.callId} is ${call.status}/${call.direction}, no transition`);
    },
});

export const rejectCall = mutation({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        const call = await ctx.db.get(args.callId);
        if (!call) throw new Error("Call not found");

        // SECURITY: only a member of the call's org with calls:answer may reject it.
        await requirePermission(ctx, call.organizationId, "calls:answer");

        if (call.status !== "RINGING") {
            throw new Error(`Call is no longer ringing (status: ${call.status})`);
        }

        const now = Date.now();
        await ctx.db.patch(args.callId, {
            status: "REJECTED" as const,
            endedAt: now,
            updatedAt: now,
        });

        // Send reject to Meta
        await ctx.scheduler.runAfter(0, internal.call_actions.sendReject, {
            callId: args.callId,
        });

        // Insert system message
        if (call.conversationId) {
            await ctx.db.insert("messages", {
                organizationId: call.organizationId,
                conversationId: call.conversationId,
                contactId: call.contactId,
                type: "SYSTEM",
                content: "Appel rejete",
                direction: "INBOUND",
                status: "DELIVERED",
                createdAt: now,
                updatedAt: now,
            });

            await ctx.db.patch(call.conversationId, {
                lastMessageAt: now,
                preview: "Appel rejete",
                updatedAt: now,
            });
        }
    },
});

export const terminateCall = mutation({
    args: {
        callId: v.id("calls"),
    },
    handler: async (ctx, args) => {
        const call = await ctx.db.get(args.callId);
        if (!call) throw new Error("Call not found");

        // SECURITY: was fully unauthenticated — require org membership.
        await requireMembership(ctx, call.organizationId);

        if (call.status === "TERMINATED" || call.status === "REJECTED" || call.status === "MISSED") {
            return; // Already ended
        }

        const now = Date.now();
        const durationSeconds = call.answeredAt
            ? Math.round((now - call.answeredAt) / 1000)
            : undefined;

        await ctx.db.patch(args.callId, {
            status: "TERMINATED" as const,
            endedAt: now,
            durationSeconds,
            terminationReason: "agent_hangup",
            updatedAt: now,
        });

        // Debit the org's credit for this outbound call.
        await billOutboundCall(ctx, call, durationSeconds);

        // Send terminate to Meta
        await ctx.scheduler.runAfter(0, internal.call_actions.sendTerminate, {
            callId: args.callId,
        });

        // Insert system message
        if (call.conversationId) {
            const durationStr = durationSeconds
                ? `${Math.floor(durationSeconds / 60)}:${String(durationSeconds % 60).padStart(2, "0")}`
                : "0:00";

            const content = `Appel audio - ${durationStr}`;

            await ctx.db.insert("messages", {
                organizationId: call.organizationId,
                conversationId: call.conversationId,
                contactId: call.contactId,
                type: "SYSTEM",
                content,
                direction: "INBOUND",
                status: "DELIVERED",
                createdAt: now,
                updatedAt: now,
            });

            await ctx.db.patch(call.conversationId, {
                lastMessageAt: now,
                preview: content,
                updatedAt: now,
            });
        }
    },
});

// ============================================
// INTERNAL MUTATIONS (called from call_actions.ts)
// ============================================

export const updateExternalCallId = internalMutation({
    args: {
        callId: v.id("calls"),
        externalCallId: v.string(),
    },
    handler: async (ctx, args) => {
        await ctx.db.patch(args.callId, {
            externalCallId: args.externalCallId,
            updatedAt: Date.now(),
        });
    },
});

// ============================================
// CRON: Expire missed calls
// ============================================

export const expireMissedCalls = internalMutation({
    args: {},
    handler: async (ctx) => {
        const cutoff = Date.now() - 60_000; // 60 seconds timeout

        // Get all organizations that have ringing calls
        const ringingCalls = await ctx.db
            .query("calls")
            .filter((q) =>
                q.and(
                    q.eq(q.field("status"), "RINGING"),
                    q.lt(q.field("startedAt"), cutoff)
                )
            )
            .collect();

        for (const call of ringingCalls) {
            const now = Date.now();
            await ctx.db.patch(call._id, {
                status: "MISSED" as const,
                endedAt: now,
                updatedAt: now,
            });

            // Send terminate to Meta
            await ctx.scheduler.runAfter(0, internal.call_actions.sendTerminate, {
                callId: call._id,
            });

            // Insert system message
            if (call.conversationId) {
                await ctx.db.insert("messages", {
                    organizationId: call.organizationId,
                    conversationId: call.conversationId,
                    contactId: call.contactId,
                    type: "SYSTEM",
                    content: "Appel manque",
                    direction: "INBOUND",
                    status: "DELIVERED",
                    createdAt: now,
                    updatedAt: now,
                });

                await ctx.db.patch(call.conversationId, {
                    lastMessageAt: now,
                    preview: "Appel manque",
                    updatedAt: now,
                });
            }

            console.log(`[CALLS] Call ${call.externalCallId} expired -> MISSED`);
        }
    },
});
