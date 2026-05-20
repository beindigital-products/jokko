/**
 * Upload a local file URI (e.g. recorder output) to a Convex storage URL.
 * Returns the storageId returned by the Convex storage endpoint.
 */
export async function uploadFileToConvex(
    uploadUrl: string,
    uri: string,
    mimeType: string,
): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();

    const upload = await fetch(uploadUrl, {
        method: "POST",
        headers: { "Content-Type": mimeType },
        body: blob,
    });

    if (!upload.ok) {
        throw new Error(`Upload failed: ${upload.status} ${upload.statusText}`);
    }

    const { storageId } = (await upload.json()) as { storageId: string };
    if (!storageId) throw new Error("Upload response missing storageId");
    return storageId;
}
