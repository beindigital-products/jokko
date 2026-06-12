/**
 * Pure helpers behind the v2 kit components — extracted so they're unit-testable
 * without a React Native render environment.
 */

/** Deterministic avatar background palette (matches the design's `tones`). */
export const AVATAR_TONES = [
  "#6938EF",
  "#252525",
  "#A082FF",
  "#138A4E",
  "#B8860B",
  "#DC3838",
  "#A8174C",
  "#0B7285",
] as const;

/** `#rrggbb` → `rgba(r, g, b, a)`. Non-6-digit-hex inputs pass through unchanged. */
export function tint(hex: string, alpha: number): string {
  const h = hex.replace("#", "");
  if (h.length !== 6) return hex;
  const r = parseInt(h.slice(0, 2), 16);
  const g = parseInt(h.slice(2, 4), 16);
  const b = parseInt(h.slice(4, 6), 16);
  if (Number.isNaN(r) || Number.isNaN(g) || Number.isNaN(b)) return hex;
  return `rgba(${r}, ${g}, ${b}, ${alpha})`;
}

/** First letters of up to the first two words, uppercased. */
export function avatarInitials(name: string): string {
  return name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((w) => w[0])
    .join("")
    .toUpperCase();
}

/** Stable background tone for a name (sum of char codes modulo palette length). */
export function avatarTone(name: string): string {
  const hash = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  return AVATAR_TONES[hash % AVATAR_TONES.length];
}
