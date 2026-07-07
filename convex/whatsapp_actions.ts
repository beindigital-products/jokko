"use node";

import { v } from "convex/values";
import { internalAction } from "./_generated/server";
import { internal } from "./_generated/api";
import { decrypt } from "./lib/encryption";
import * as fs from "fs";
import * as path from "path";
import * as os from "os";
import { execFile } from "child_process";
import { promisify } from "util";
// @ts-ignore
import ffmpegPath from "ffmpeg-static";

const execFileAsync = promisify(execFile);

/**
 * POST to the WhatsApp Graph API with a bounded retry on TRANSIENT failures
 * (HTTP 408/429/5xx or a network error). Non-transient responses — 400 invalid
 * recipient, 401/190 bad token, etc. — return immediately so the caller's
 * existing error handling still runs. Without this, a momentary Meta blip during
 * a broadcast turned dozens of messages into permanent FAILED. Backoff: 0.5s, 1s.
 */
const TRANSIENT_HTTP = new Set([408, 429, 500, 502, 503, 504]);

async function metaFetchWithRetry(
    url: string,
    init: Parameters<typeof fetch>[1],
    maxAttempts = 3,
): Promise<Response> {
    let lastError: unknown;
    for (let attempt = 1; attempt <= maxAttempts; attempt++) {
        try {
            const res = await fetch(url, init);
            if (res.ok || !TRANSIENT_HTTP.has(res.status) || attempt === maxAttempts) {
                return res;
            }
        } catch (err) {
            lastError = err;
            if (attempt === maxAttempts) throw err;
        }
        await new Promise((r) => setTimeout(r, 500 * 2 ** (attempt - 1)));
    }
    throw lastError ?? new Error("metaFetchWithRetry: retries exhausted");
}

/**
 * SSRF guard: server-side media fetches must only target Convex Storage.
 *
 * `messages.send` accepts a client-supplied `mediaUrl` that is relayed here and
 * fetched server-side. Without this allow-list, an authenticated AGENT could
 * point `mediaUrl` at internal/metadata endpoints (e.g. http://169.254.169.254,
 * http://localhost, ...) and have the backend fetch them. The safe path
 * (`mediaStorageId` → ctx.storage.getUrl) stays preferred; arbitrary hosts are
 * rejected here.
 *
 * Allowed: https URLs whose host is the deployment's Convex Storage host
 * (CONVEX_CLOUD_URL / CONVEX_SITE_URL) or any *.convex.cloud host.
 */
function assertConvexStorageUrl(rawUrl: string): void {
    let url: URL;
    try {
        url = new URL(rawUrl);
    } catch {
        throw new Error(`[OUTBOUND] mediaUrl invalide (URL malformée)`);
    }

    if (url.protocol !== "https:") {
        throw new Error(`[OUTBOUND] mediaUrl refusée: protocole ${url.protocol} non autorisé`);
    }

    const host = url.hostname.toLowerCase();

    const allowedHosts = new Set<string>();
    for (const envUrl of [process.env.CONVEX_CLOUD_URL, process.env.CONVEX_SITE_URL]) {
        if (!envUrl) continue;
        try {
            allowedHosts.add(new URL(envUrl).hostname.toLowerCase());
        } catch {
            // ignore malformed env value
        }
    }

    const isConvexCloud = host === "convex.cloud" || host.endsWith(".convex.cloud");
    if (!isConvexCloud && !allowedHosts.has(host)) {
        throw new Error(
            `[OUTBOUND] mediaUrl refusée: l'hôte "${host}" n'appartient pas au stockage Convex`,
        );
    }
}

/**
 * Download media from WhatsApp Cloud API and store in Convex Storage.
 * WhatsApp only sends a media ID in webhooks — the actual file must be fetched
 * via two API calls:
 *   1. GET /v20.0/{media_id} → { url }
 *   2. GET {url} → binary file
 */
export const downloadMedia = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        whatsappMediaId: v.string(),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
    },
    handler: async (ctx, args) => {
        // Resolve credentials: channel-specific → legacy org → env fallback
        let accessToken: string | undefined;

        if (args.whatsappChannelId) {
            try {
                const channelData = await ctx.runQuery(internal.channels.getChannelWithWaba, {
                    channelId: args.whatsappChannelId,
                });
                const rawToken = channelData.waba?.accessTokenRef || channelData.orgWhatsapp?.accessToken;
                if (rawToken) accessToken = await decrypt(rawToken);
            } catch (e) {
                console.warn(`[MEDIA DL] Failed to resolve channel ${args.whatsappChannelId}, falling back`, e);
            }
        }

        if (!accessToken) {
            const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });
            const rawToken = org?.whatsapp?.accessToken;
            accessToken = rawToken ? await decrypt(rawToken) : (process.env.WHATSAPP_ACCESS_TOKEN || undefined);
        }
        if (!accessToken) {
            console.error(`[MEDIA DL] No access token for org ${args.organizationId}`);
            return;
        }

        try {
            // Step 1: Get media download URL from WhatsApp
            const metaRes = await fetch(
                `https://graph.facebook.com/v20.0/${args.whatsappMediaId}`,
                { headers: { Authorization: `Bearer ${accessToken}` } }
            );

            if (!metaRes.ok) {
                console.error(`[MEDIA DL] Failed to get media URL: ${metaRes.status} ${await metaRes.text()}`);
                return;
            }

            const metaData = await metaRes.json();
            const downloadUrl = metaData.url;
            if (!downloadUrl) {
                console.error("[MEDIA DL] No URL in media response:", JSON.stringify(metaData));
                return;
            }

            // Step 2: Download the actual file
            const fileRes = await fetch(downloadUrl, {
                headers: { Authorization: `Bearer ${accessToken}` },
            });

            if (!fileRes.ok) {
                console.error(`[MEDIA DL] Failed to download file: ${fileRes.status}`);
                return;
            }

            const blob = await fileRes.blob();

            // Step 3: Store in Convex Storage
            const storageId = await ctx.storage.store(blob);

            // Step 4: Update message with storageId
            await ctx.runMutation(internal.utils.patchMessageMedia, {
                messageId: args.messageId,
                mediaStorageId: storageId,
            });

            console.log(`[MEDIA DL] Stored media for message ${args.messageId} → ${storageId}`);
        } catch (error) {
            console.error(`[MEDIA DL] Error downloading media:`, String(error));
        }
    },
});

export const sendMessage = internalAction({
    args: {
        messageId: v.id("messages"),
        organizationId: v.id("organizations"),
        whatsappChannelId: v.optional(v.id("whatsappChannels")),
        to: v.string(),
        text: v.optional(v.string()),
        type: v.optional(v.string()), // "text", "image", "video", "audio", "document", "interactive"
        interactive: v.optional(v.record(v.string(), v.any())), // JSON payload for interactive messages
        mediaUrl: v.optional(v.string()),
        caption: v.optional(v.string()),
        mimeType: v.optional(v.string()),
        fileName: v.optional(v.string()),
        replyToWhatsAppId: v.optional(v.string()),
        template: v.optional(v.record(v.string(), v.any())), // JSON payload for template messages
    },
    handler: async (ctx, args) => {
        // 1. Resolve credentials: channel-specific → legacy org → env fallback
        let phoneNumberId: string | undefined;
        let accessToken: string | undefined;

        if (args.whatsappChannelId) {
            try {
                const channelData = await ctx.runQuery(internal.channels.getChannelWithWaba, {
                    channelId: args.whatsappChannelId,
                });
                phoneNumberId = channelData.phoneNumberId;
                const rawToken = channelData.waba?.accessTokenRef || channelData.orgWhatsapp?.accessToken;
                if (rawToken) accessToken = await decrypt(rawToken);
            } catch (e) {
                console.warn(`[OUTBOUND] Failed to resolve channel ${args.whatsappChannelId}, falling back to org`, e);
            }
        }

        if (!phoneNumberId || !accessToken) {
            const org = await ctx.runQuery(internal.utils.getOrganization, { id: args.organizationId });
            phoneNumberId = phoneNumberId || org?.whatsapp?.phoneNumberId || process.env.WHATSAPP_PHONE_NUMBER_ID;
            if (!accessToken) {
                const rawToken = org?.whatsapp?.accessToken;
                accessToken = rawToken ? await decrypt(rawToken) : (process.env.WHATSAPP_ACCESS_TOKEN || undefined);
            }
        }

        if (!phoneNumberId || !accessToken) {
            console.error(`[OUTBOUND] Missing WhatsApp credentials for Org ${args.organizationId} (channel: ${args.whatsappChannelId || "none"})`);
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
            return;
        }

        const recipientPhone = args.to.replace(/\D/g, '');

        console.log(`[OUTBOUND] Sending message to ${recipientPhone} (ID: ${phoneNumberId})`);

        // Construct Payload
        let type = (args.type || "text").toLowerCase(); // Ensure lowercase for WhatsApp API

        // SSRF guard (H4): the client-supplied mediaUrl is fetched server-side
        // below (and, on upload failure, relayed to Meta as a `link`). Validate it
        // ONCE here — outside the swallowing try/catch blocks — so a non-Convex
        // host fails the message cleanly instead of being fetched or forwarded.
        if (args.mediaUrl) {
            try {
                assertConvexStorageUrl(args.mediaUrl);
            } catch (err) {
                console.error(`[OUTBOUND] Rejected media send:`, String(err));
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED",
                });
                return;
            }
        }

        // Handle Media Conversion (specifically for WebM audio -> OGG Opus/MP4 AAC)
        let mediaId: string | null = null;
        if (type === 'audio' && (args.mimeType?.includes('webm') || args.mediaUrl?.endsWith('.webm'))) {
            try {
                // console.log('[OUTBOUND] Converting WebM Audio to MP4 (AAC)...');
                const response = await fetch(args.mediaUrl!);
                const arrayBuffer = await response.arrayBuffer();
                const tempDir = os.tmpdir();
                const inputPath = path.join(tempDir, `input_${args.messageId}.webm`);
                const outputPath = path.join(tempDir, `output_${args.messageId}.mp4`);

                fs.writeFileSync(inputPath, Buffer.from(arrayBuffer));

                if (!ffmpegPath) throw new Error("FFmpeg binary not found");
                try { fs.chmodSync(ffmpegPath, 0o755); } catch { }

                await execFileAsync(ffmpegPath, [
                    '-i', inputPath,
                    '-vn', // No video
                    '-c:a', 'aac',
                    '-y',
                    outputPath
                ]);

                // Upload to WhatsApp
                const fileBuffer = fs.readFileSync(outputPath);
                const formData = new FormData();
                // @ts-ignore
                formData.append('file', new Blob([fileBuffer], { type: 'audio/mp4' }), 'audio.mp4');
                formData.append('messaging_product', 'whatsapp');

                const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${accessToken}` },
                    body: formData
                });

                const uploadData = await uploadRes.json();
                if (uploadData.id) {
                    mediaId = uploadData.id;
                    console.log(`[OUTBOUND] Converted and uploaded audio. Media ID: ${mediaId}`);
                } else {
                    console.error('[OUTBOUND] Upload failed:', uploadData);
                    type = 'document'; // Fallback if upload fails
                }

                // Cleanup
                try { fs.unlinkSync(inputPath); fs.unlinkSync(outputPath); } catch { }
            } catch (err) {
                console.error('[OUTBOUND] Audio conversion error:', err);
                type = 'document'; // Fallback
            }
        }

        // ---------------------------------------------------------
        // UNIVERSAL MEDIA UPLOAD STRATEGY
        // ---------------------------------------------------------
        // We prioritize uploading the binary to WhatsApp (fetching from Convex first).
        // For Videos (MOV/AVI), we use a "Container Swap" strategy:
        // We upload them as 'video/mp4' with '.mp4' extension. 
        // WhatsApp's servers often handle H.264 content inside MOVs correctly if labeled as MP4.
        if (["image", "video", "audio", "document"].includes(type) && !mediaId && args.mediaUrl) {
            try {
                // mediaUrl already SSRF-validated above (assertConvexStorageUrl).
                console.log(`[OUTBOUND] Fetching media for direct upload...`);
                const mediaRes = await fetch(args.mediaUrl);

                if (mediaRes.ok) {
                    const mediaBuffer = await mediaRes.arrayBuffer();
                    const mimeRaw = args.mimeType || mediaRes.headers.get('content-type') || 'application/octet-stream';

                    // Force MP4 mime for ALL videos to bypass WhatsApp "Format not supported" errors
                    // effectively tricking it to attempt processing the stream
                    let mime = type === 'video' ? 'video/mp4' : mimeRaw;

                    console.log(`[OUTBOUND] Downloaded ${mediaBuffer.byteLength} bytes. Raw Mime: ${mimeRaw} -> Sending as: ${mime}`);

                    // Determine filename
                    let filename = args.fileName || 'file.bin';

                    // Force .mp4 extension for videos
                    if (type === 'video') {
                        const base = filename.includes('.') ? filename.substring(0, filename.lastIndexOf('.')) : filename;
                        filename = `${base}.mp4`;
                    } else if (!args.fileName) {
                        const ext = mime.split('/')[1]?.split(';')[0]?.split('+')[0] || 'bin';
                        filename = `media.${ext}`;
                    }

                    const formData = new FormData();
                    // @ts-ignore
                    // Create Blob with FORCED mime type
                    formData.append('file', new Blob([mediaBuffer], { type: mime }), filename);
                    formData.append('messaging_product', 'whatsapp');

                    console.log(`[OUTBOUND] Uploading ${filename} to WhatsApp Media API...`);
                    const uploadRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/media`, {
                        method: 'POST',
                        headers: { 'Authorization': `Bearer ${accessToken}` },
                        body: formData
                    });

                    const uploadData = await uploadRes.json();
                    if (uploadData.id) {
                        mediaId = uploadData.id;
                        console.log(`[OUTBOUND] Media uploaded successfully. ID: ${mediaId}`);
                    } else {
                        console.error('[OUTBOUND] Media upload failed:', uploadData);
                    }
                } else {
                    console.error(`[OUTBOUND] Failed to fetch media from Convex: ${mediaRes.statusText}`);
                }
            } catch (e) {
                console.error('[OUTBOUND] Pre-upload error:', e);
            }
        }

        let messageBody: any = {
            messaging_product: "whatsapp",
            recipient_type: "individual",
            to: recipientPhone,
            type: type
        };

        if (args.replyToWhatsAppId) {
            messageBody.context = { message_id: args.replyToWhatsAppId };
        }

        if (type === "text") {
            messageBody.text = { preview_url: false, body: args.text };
        } else if (type === "interactive" && args.interactive) {
            messageBody.interactive = args.interactive;
        } else if (type === "template" && args.template) {
            messageBody.template = args.template;
        } else if (["image", "video", "audio", "document"].includes(type)) {
            // If upload failed, we still try link as fallback if available
            if (!args.mediaUrl && !mediaId) {
                console.error(`[OUTBOUND] Missing mediaUrl for type ${type}`);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED"
                });
                return;
            }

            const mediaObj: any = mediaId ? { id: mediaId } : { link: args.mediaUrl };

            if (args.caption && type !== "audio") {
                mediaObj.caption = args.caption;
            }

            if (args.fileName && type === 'document') {
                mediaObj.filename = args.fileName;
            }

            messageBody[type] = mediaObj;
            // PII: do not dump the media object/URL.
        } else {
            console.error(`[OUTBOUND] Unsupported properties or type: ${type}`);
            return;
        }

        // PII: do not log the full WhatsApp payload (message body / caption / link).

        try {
            const response = await metaFetchWithRetry(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                method: "POST",
                headers: {
                    "Authorization": `Bearer ${accessToken}`,
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(messageBody),
            });

            const data = await response.json();

            if (!response.ok) {
                console.error(`[OUTBOUND] WhatsApp API Error:`, data);

                // Detect expired/invalid token → mark channel as error
                const errorCode = data?.error?.code;
                const errorSubcode = data?.error?.error_subcode;
                const isTokenError = errorCode === 190 || errorSubcode === 463 || errorSubcode === 460;
                if (isTokenError && args.whatsappChannelId) {
                    console.warn(`[OUTBOUND] Token expired for channel ${args.whatsappChannelId}, marking as error`);
                    await ctx.runMutation(internal.channels.markChannelError, {
                        channelId: args.whatsappChannelId,
                        status: "error",
                    });
                }

                // If video failed (e.g. invalid format despite upload), try document fallback
                if (type === 'video' && mediaId) {
                    console.warn(`[OUTBOUND] Video send failed with simple video type. Retrying as document...`);
                    const docBody = JSON.parse(JSON.stringify(messageBody));
                    delete docBody.video;
                    docBody.type = 'document';
                    docBody.document = {
                        id: mediaId,
                        filename: args.fileName || 'video.mp4',
                        caption: args.caption
                    };

                    const retryRes = await fetch(`https://graph.facebook.com/v20.0/${phoneNumberId}/messages`, {
                        method: "POST",
                        headers: {
                            "Authorization": `Bearer ${accessToken}`,
                            "Content-Type": "application/json",
                        },
                        body: JSON.stringify(docBody),
                    });
                    const retryData = await retryRes.json();
                    if (retryRes.ok) {
                        console.log(`[OUTBOUND] Retry as document successful. ID: ${retryData.messages?.[0]?.id}`);
                        await ctx.runMutation(internal.utils.updateMessageStatus, {
                            messageId: args.messageId,
                            status: "SENT",
                            externalId: retryData.messages?.[0]?.id
                        });
                        return;
                    }
                }

                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "FAILED"
                });
            } else {
                console.log(`[OUTBOUND] Message sent. WhatsApp ID: ${data.messages?.[0]?.id}`);
                await ctx.runMutation(internal.utils.updateMessageStatus, {
                    messageId: args.messageId,
                    status: "SENT",
                    externalId: data.messages?.[0]?.id
                });
            }
        } catch (error) {
            console.error(`[OUTBOUND] Network Error:`, error);
            await ctx.runMutation(internal.utils.updateMessageStatus, {
                messageId: args.messageId,
                status: "FAILED"
            });
        }
    },
});
