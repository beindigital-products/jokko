import type { MutationCtx } from "../_generated/server";
import type { Id } from "../_generated/dataModel";

/**
 * Media storage accounting. The counter (organizations.storageBytesUsed) is
 * maintained inline at the store/delete points; storage_usage.recompute repairs
 * any drift from the truth (_storage sizes referenced by the org's messages).
 * Byte sizes come from the _storage system table via ctx.db.system.get.
 */

/** Add a stored file's bytes to the org's usage counter (best-effort). */
export async function recordStorageAdd(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    storageId: Id<"_storage"> | undefined | null,
): Promise<void> {
    if (!storageId) return;
    const meta = await ctx.db.system.get(storageId);
    const size = meta?.size ?? 0;
    if (size <= 0) return;
    const org = await ctx.db.get(organizationId);
    if (!org) return;
    await ctx.db.patch(organizationId, {
        storageBytesUsed: (org.storageBytesUsed ?? 0) + size,
    });
}

/** Delete a stored blob AND subtract its bytes from the org's usage counter. */
export async function recordStorageDelete(
    ctx: MutationCtx,
    organizationId: Id<"organizations">,
    storageId: Id<"_storage"> | undefined | null,
): Promise<void> {
    if (!storageId) return;
    const meta = await ctx.db.system.get(storageId);
    const size = meta?.size ?? 0;
    await ctx.storage.delete(storageId);
    if (size <= 0) return;
    const org = await ctx.db.get(organizationId);
    if (!org) return;
    await ctx.db.patch(organizationId, {
        storageBytesUsed: Math.max(0, (org.storageBytesUsed ?? 0) - size),
    });
}
