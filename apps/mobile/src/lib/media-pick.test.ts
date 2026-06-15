import { describe, expect, it } from "vitest";
import { buildMediaSendArgs, validatePickedAsset } from "./media-pick";

describe("buildMediaSendArgs", () => {
    it("maps image asset with mime + filename to IMAGE send args", () => {
        const args = buildMediaSendArgs({
            kind: "image",
            uri: "file:///cache/IMG_0001.HEIC",
            mimeType: "image/heic",
            fileName: "IMG_0001.HEIC",
            fileSize: 2_400_000,
        });
        expect(args).toEqual({
            type: "IMAGE",
            mediaType: "image/heic",
            fileName: "IMG_0001.HEIC",
            fileSize: 2_400_000,
        });
    });

    it("falls back to default mime + synthesized name when picker omits both", () => {
        const args = buildMediaSendArgs(
            { kind: "video", uri: "file:///cache/anon", mimeType: null, fileName: null },
            1_700_000_000_000,
        );
        expect(args.type).toBe("VIDEO");
        expect(args.mediaType).toBe("video/mp4");
        expect(args.fileName).toBe("video-1700000000000.mp4");
        expect(args.fileSize).toBeUndefined();
    });

    it("maps document asset to DOCUMENT type with provided mime preserved", () => {
        const args = buildMediaSendArgs({
            kind: "document",
            uri: "file:///cache/contract.pdf",
            mimeType: "application/pdf",
            fileName: "contract.pdf",
            fileSize: 500_000,
        });
        expect(args).toEqual({
            type: "DOCUMENT",
            mediaType: "application/pdf",
            fileName: "contract.pdf",
            fileSize: 500_000,
        });
    });

    it("derives extension from mime when filename absent", () => {
        const args = buildMediaSendArgs(
            { kind: "image", uri: "file:///x", mimeType: "image/png", fileName: null },
            42,
        );
        expect(args.fileName).toBe("image-42.png");
    });
});

describe("validatePickedAsset", () => {
    it("accepts a normal image", () => {
        const v = validatePickedAsset({
            kind: "image",
            uri: "file:///x.jpg",
            mimeType: "image/jpeg",
            fileSize: 1_000_000,
        });
        expect(v).toEqual({ ok: true });
    });

    it("rejects missing uri", () => {
        const v = validatePickedAsset({ kind: "image", uri: "", mimeType: null });
        expect(v).toEqual({ ok: false, reason: "missing_uri" });
    });

    it("rejects oversize document (>50MB)", () => {
        const v = validatePickedAsset({
            kind: "document",
            uri: "file:///big.zip",
            fileSize: 60 * 1024 * 1024,
        });
        expect(v).toEqual({ ok: false, reason: "too_large" });
    });

    it("rejects oversize image (>16MB)", () => {
        const v = validatePickedAsset({
            kind: "image",
            uri: "file:///big.tiff",
            fileSize: 20 * 1024 * 1024,
        });
        expect(v).toEqual({ ok: false, reason: "too_large" });
    });

    it("accepts asset with no size reported (some Android providers)", () => {
        const v = validatePickedAsset({
            kind: "video",
            uri: "content://media/external/video/123",
        });
        expect(v).toEqual({ ok: true });
    });
});
