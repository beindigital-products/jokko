/**
 * Plan enforcement — cascade de downgrade partagée entre Stripe webhooks
 * et mutations applicatives (updateOrgPlan, backfill, etc.).
 *
 * Désactive les canaux WhatsApp excédentaires, met en pause les broadcasts
 * SCHEDULED concernés, notifie OWNER/ADMIN.
 */

import type { MutationCtx } from "../_generated/server";
import type { Doc, Id } from "../_generated/dataModel";
import { getMaxChannels, getMaxAgents, isUnlimited } from "./planHelpers";
import { createNotification } from "../notifications";

export async function enforceChannelDowngrade(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    newPlan: string,
): Promise<number> {
    // Seat reconciliation runs regardless of channel state (a plan change can
    // affect seats without affecting channels), so it lives before the channel
    // early-returns below.
    await enforceSeatLimit(ctx, organizationId, newPlan, Date.now());

    const maxChannels = await getMaxChannels(ctx, newPlan);
    if (isUnlimited(maxChannels)) return 0;

    const channels = await ctx.db
        .query("whatsappChannels")
        .withIndex("by_org", (q) => q.eq("organizationId", organizationId))
        .collect();

    const activeChannels = channels.filter(
        (c) => c.status !== "disabled" && c.status !== "banned",
    );
    if (activeChannels.length <= maxChannels) return 0;

    const sorted = [...activeChannels].sort((a, b) => {
        if (a.isOrgDefault && !b.isOrgDefault) return -1;
        if (!a.isOrgDefault && b.isOrgDefault) return 1;
        return a.createdAt - b.createdAt;
    });

    const toKeep = sorted.slice(0, maxChannels);
    const toDisable = sorted.slice(maxChannels);
    const now = Date.now();
    const disabledIds: Id<"whatsappChannels">[] = [];

    for (const ch of toDisable) {
        await ctx.db.patch(ch._id, {
            status: "disabled",
            disabledReason: "plan_downgrade",
            disabledAt: now,
            isOrgDefault: false,
            updatedAt: now,
        });
        disabledIds.push(ch._id);
    }

    const hasDefault = toKeep.some((c) => c.isOrgDefault);
    if (!hasDefault && toKeep.length > 0) {
        await ctx.db.patch(toKeep[0]._id, { isOrgDefault: true, updatedAt: now });
    }

    if (disabledIds.length > 0) {
        const scheduled = await ctx.db
            .query("broadcasts")
            .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
            .filter((q) => q.eq(q.field("status"), "SCHEDULED"))
            .collect();
        for (const b of scheduled) {
            if (b.whatsappChannelId && disabledIds.includes(b.whatsappChannelId)) {
                await ctx.db.patch(b._id, { status: "DRAFT", updatedAt: now });
                await ctx.db.insert("broadcastActivities", {
                    broadcastId: b._id,
                    type: "paused",
                    message: `Campagne dépubliée : canal désactivé après passage au plan ${newPlan}`,
                    createdAt: now,
                });
            }
        }
    }

    const memberships = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    for (const m of memberships) {
        if (m.role !== "OWNER" && m.role !== "ADMIN") continue;
        await createNotification(ctx, {
            organizationId,
            userId: m.userId,
            type: "PLAN_DOWNGRADE",
            title: "Canaux désactivés après changement de plan",
            message: `Votre plan ${newPlan} autorise ${maxChannels} canal${maxChannels > 1 ? "aux" : ""}. ${disabledIds.length} canal${disabledIds.length > 1 ? "aux ont été désactivés" : " a été désactivé"}.`,
            link: "/dashboard/channels",
            metadata: {
                disabledChannelIds: disabledIds.map((id) => id.toString()),
                newPlan,
                maxChannels,
            },
            createdAt: now,
        });
    }

    return disabledIds.length;
}

/**
 * Reconcile seat usage against the plan's agent limit after a plan change.
 * - Over the limit → suspend the NEWEST agent seats (OWNER/ADMIN are never
 *   suspended; oldest agents keep their seat). Notifies owners/admins.
 * - Room available / upgrade → auto-reactivate seats previously suspended by a
 *   downgrade, oldest first, up to the new limit.
 * Suspended members lose access (enforced in requireMembership) but keep their
 * row + history so an owner can reassign seats from the team screen.
 */
async function enforceSeatLimit(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    newPlan: string,
    now: number,
): Promise<void> {
    const maxAgents = await getMaxAgents(ctx, newPlan);
    const members = await ctx.db
        .query("memberships")
        .withIndex("by_organization", (q) => q.eq("organizationId", organizationId))
        .collect();
    const active = members.filter((m) => !m.suspended);

    if (!isUnlimited(maxAgents) && active.length > maxAgents) {
        const roleRank = (r: string) => (r === "OWNER" ? 0 : r === "ADMIN" ? 1 : 2);
        const ranked = [...active].sort((a, b) =>
            roleRank(a.role) !== roleRank(b.role)
                ? roleRank(a.role) - roleRank(b.role)
                : a.joinedAt - b.joinedAt,
        );
        // Keep the first `maxAgents` (owner/admins + oldest agents); suspend the
        // agents beyond it. Owners/admins are never auto-suspended.
        const toSuspend = ranked.slice(maxAgents).filter((m) => m.role === "AGENT");
        for (const m of toSuspend) {
            await ctx.db.patch(m._id, { suspended: true, suspendedReason: "plan_downgrade" });
        }
        if (toSuspend.length > 0) {
            await notifySeatDowngrade(ctx, organizationId, members, newPlan, maxAgents, toSuspend.length, now);
        }
        return;
    }

    // Room available (or unlimited plan): restore seats suspended by a prior
    // downgrade, oldest first, up to the limit.
    const reactivatable = members
        .filter((m) => m.suspended && m.suspendedReason === "plan_downgrade")
        .sort((a, b) => a.joinedAt - b.joinedAt);
    let slots = isUnlimited(maxAgents) ? Number.POSITIVE_INFINITY : maxAgents - active.length;
    for (const m of reactivatable) {
        if (slots <= 0) break;
        await ctx.db.patch(m._id, { suspended: undefined, suspendedReason: undefined });
        slots -= 1;
    }
}

async function notifySeatDowngrade(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    members: Doc<"memberships">[],
    newPlan: string,
    maxAgents: number,
    suspendedCount: number,
    now: number,
): Promise<void> {
    for (const m of members) {
        if (m.role !== "OWNER" && m.role !== "ADMIN") continue;
        if (m.suspended) continue;
        await createNotification(ctx, {
            organizationId,
            userId: m.userId,
            type: "PLAN_DOWNGRADE",
            title: "Sièges désactivés après changement de plan",
            message: `Votre plan ${newPlan} autorise ${maxAgents} agent${maxAgents > 1 ? "s" : ""}. ${suspendedCount} siège${suspendedCount > 1 ? "s ont été désactivés" : " a été désactivé"}. Réactivez les membres souhaités depuis l'équipe.`,
            link: "/dashboard/team",
            metadata: { newPlan, maxAgents, suspendedCount },
            createdAt: now,
        });
    }
}
