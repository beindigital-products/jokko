/**
 * @jokko/tokens/v2 — React Native palette + type ramp for the Jokko v2 mobile app.
 *
 * Mirrors the design bundle's `v2/tokens.css` EXACTLY (light + dark). The web uses
 * CSS custom properties with a cascade; React Native has no cascade, so these are
 * plain JS values consumed through the `useTheme()` hook in `@jokko/ui-mobile`.
 *
 * Design language: "Cobalt × paper × ink" — JetBrains Mono display, Geist body,
 * violet accent (#6938EF). Editorial Instrument Serif italic kept for large titles.
 */

export type V2Palette = {
  paper: string;
  paper2: string;
  card: string;
  cardWarm: string;
  ink: string;
  ink2: string;
  ink3: string;
  mute: string;
  mute2: string;
  rule: string;
  rule2: string;
  accent: string;
  accent2: string;
  accentSoft: string;
  accentInk: string;
  hot: string;
  good: string;
  waGreen: string;
  warn: string;
  highlight: string;
  bubbleIn: string;
  bubbleOut: string;
  bubbleOutInk: string;
};

/** Light — clean white surface, violet accent. */
export const v2Light: V2Palette = {
  paper: "#FFFFFF",
  paper2: "#FAFAFA",
  card: "#FFFFFF",
  cardWarm: "#FAFAFA",
  ink: "#252525",
  ink2: "#3A3A3A",
  ink3: "#5A5A5A",
  mute: "#8A8A8A",
  mute2: "#B5B5B5",
  rule: "#EBEBEB",
  rule2: "#F2F2F2",
  accent: "#6938EF",
  accent2: "#5A26D9",
  accentSoft: "#EFEAFE",
  accentInk: "#4F1FCF",
  hot: "#DC3838",
  good: "#138A4E",
  waGreen: "#25D366",
  warn: "#B8860B",
  highlight: "#DBFF3A",
  bubbleIn: "#FFFFFF",
  bubbleOut: "#252525",
  bubbleOutInk: "#FAFAFA",
};

/** Dark — surface #1E1F26, soft white ink. */
export const v2Dark: V2Palette = {
  paper: "#1E1F26",
  paper2: "#15161B",
  card: "#25262E",
  cardWarm: "#2A2B33",
  ink: "#FAFAFA",
  ink2: "#E5E5E5",
  ink3: "#BFBFBF",
  mute: "#8A8A8A",
  mute2: "#5C5D62",
  rule: "rgba(255,255,255,0.08)",
  rule2: "rgba(255,255,255,0.05)",
  accent: "#8B5FFB",
  accent2: "#A082FF",
  accentSoft: "rgba(105,56,239,0.18)",
  accentInk: "#C7B2FF",
  hot: "#FF5B5B",
  good: "#25D08A",
  waGreen: "#25D366",
  warn: "#E5B23D",
  highlight: "#DBFF3A",
  bubbleIn: "#25262E",
  bubbleOut: "#FAFAFA",
  bubbleOutInk: "#1E1F26",
};

/** Corner radii (px). */
export const v2Radius = {
  xs: 4,
  sm: 8,
  md: 12,
  lg: 18,
  xl: 28,
  pill: 999,
} as const;

/**
 * expo-google-fonts family names. MUST be loaded via `useFonts` (see the app root)
 * before any text using them renders. `display` = JetBrains Mono "tech" preset;
 * `serifItalic` = Instrument Serif for editorial large titles (`.display-i`).
 */
export const fontFamily = {
  display: "JetBrainsMono_500Medium",
  displayItalic: "JetBrainsMono_500Medium_Italic",
  sansLight: "Geist_300Light",
  sans: "Geist_400Regular",
  sansMedium: "Geist_500Medium",
  sansSemibold: "Geist_600SemiBold",
  sansBold: "Geist_700Bold",
  mono: "GeistMono_400Regular",
  monoMedium: "GeistMono_500Medium",
  serif: "InstrumentSerif_400Regular",
  serifItalic: "InstrumentSerif_400Regular_Italic",
} as const;

export type FontFamily = typeof fontFamily;
export type V2Radius = typeof v2Radius;
