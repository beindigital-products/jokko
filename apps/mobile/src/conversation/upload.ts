/**
 * Upload a local file URI (e.g. recorder output) to a Convex storage URL.
 * Returns the storageId returned by the Convex storage endpoint. When an
 * `onProgress` callback is given, it reports upload completion in [0, 1] via
 * XMLHttpRequest (fetch can't surface upload progress in React Native).
 */
export async function uploadFileToConvex(
    uploadUrl: string,
    uri: string,
    mimeType: string,
    onProgress?: (fraction: number) => void,
): Promise<string> {
    const response = await fetch(uri);
    const blob = await response.blob();

    return new Promise<string>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("POST", uploadUrl);
        xhr.setRequestHeader("Content-Type", mimeType);

        if (onProgress) {
            xhr.upload.onprogress = (event) => {
                if (event.lengthComputable) onProgress(event.loaded / event.total);
            };
        }

        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                try {
                    const { storageId } = JSON.parse(xhr.responseText) as { storageId?: string };
                    if (storageId) {
                        onProgress?.(1);
                        resolve(storageId);
                    } else {
                        reject(new Error("Upload response missing storageId"));
                    }
                } catch {
                    reject(new Error("Upload response was not valid JSON"));
                }
            } else {
                reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
            }
        };
        xhr.onerror = () => reject(new Error("Upload failed: network error"));
        xhr.send(blob);
    });
}
