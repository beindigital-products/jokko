/**
 * Pure helpers for the V1.5+ media picker → Convex send flow.
 *
 * Kept free of expo-* / react-native imports so the logic is unit-testable
 * (the picker side-effects live in `conversation/MediaPicker.tsx`).
 */

export type PickedAsset = {
    uri: string;
    mimeType?: string | null;
    fileName?: string | null;
    fileSize?: number | null;
    kind: "image" | "video" | "document";
};

export type MediaSendArgs = {
    type: "IMAGE" | "VIDEO" | "DOCUMENT";
    mediaType: string;
    fileName: string;
    fileSize?: number;
};

const DEFAULT_MIME_BY_KIND: Record<PickedAsset["kind"], string> = {
    image: "image/jpeg",
    video: "video/mp4",
    document: "application/octet-stream",
};

const EXTENSION_BY_KIND: Record<PickedAsset["kind"], string> = {
    image: "jpg",
    video: "mp4",
    document: "bin",
};

function extensionFromMime(mime: string): string | null {
    if (mime === "image/jpeg") return "jpg";
    if (mime === "image/png") return "png";
    if (mime === "image/webp") return "webp";
    if (mime === "image/heic") return "heic";
    if (mime === "video/mp4") return "mp4";
    if (mime === "video/quicktime") return "mov";
    if (mime === "application/pdf") return "pdf";
    return null;
}

/**
 * Map a picker asset to the args expected by `api.messages.send`.
 *
 * Falls back to sensible defaults when the picker omits filename / mime
 * (some Android ContentProviders return neither). Always returns a defined
 * `mediaType` and `fileName` so the WhatsApp Cloud API forward works.
 */
export function buildMediaSendArgs(asset: PickedAsset, now: number = Date.now()): MediaSendArgs {
    const type = ({ image: "IMAGE", video: "VIDEO", document: "DOCUMENT" } as const)[asset.kind];
    const mediaType = asset.mimeType?.trim() || DEFAULT_MIME_BY_KIND[asset.kind];
    const extension =
        extensionFromMime(mediaType) ?? EXTENSION_BY_KIND[asset.kind];
    const fileName =
        asset.fileName?.trim() || `${asset.kind}-${now}.${extension}`;

    return {
        type,
        mediaType,
        fileName,
        fileSize: typeof asset.fileSize === "number" ? asset.fileSize : undefined,
    };
}

/**
 * Reject obviously broken or oversize picks before we open an upload URL.
 * WhatsApp Cloud API has a hard 100 MB limit on documents — we cap lower
 * (50 MB) to keep mobile upload reasonable on cellular.
 */
const MAX_BYTES_BY_KIND: Record<PickedAsset["kind"], number> = {
    image: 16 * 1024 * 1024, // 16 MB matches WA image limit
    video: 50 * 1024 * 1024, // 50 MB matches WA video limit
    document: 50 * 1024 * 1024,
};

export type ValidationResult =
    | { ok: true }
    | { ok: false; reason: "missing_uri" | "too_large" };

export function validatePickedAsset(asset: PickedAsset): ValidationResult {
    if (!asset.uri || asset.uri.trim().length === 0) {
        return { ok: false, reason: "missing_uri" };
    }
    if (
        typeof asset.fileSize === "number" &&
        asset.fileSize > MAX_BYTES_BY_KIND[asset.kind]
    ) {
        return { ok: false, reason: "too_large" };
    }
    return { ok: true };
}
