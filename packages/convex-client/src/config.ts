export type ConvexClientConfig = {
  url?: string | null;
};

export function resolveConvexUrl(url: string | null | undefined): string | null {
  const trimmed = url?.trim();
  if (!trimmed) return null;

  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "https:" && parsed.protocol !== "http:") return null;
    return parsed.toString().replace(/\/$/, "");
  } catch {
    return null;
  }
}

export function requireConvexUrl(url: string | null | undefined): string {
  const resolved = resolveConvexUrl(url);
  if (!resolved) {
    throw new Error("Missing or invalid EXPO_PUBLIC_CONVEX_URL");
  }
  return resolved;
}
