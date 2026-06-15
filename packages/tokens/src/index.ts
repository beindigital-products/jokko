/**
 * @jokko/tokens — Design system tokens shared between web and mobile.
 *
 * V2 (2026-05) — "Cobalt × paper × ink" redesign.
 *
 * COMPATIBILITY CONTRACT:
 *   - New keys (paper, ink.[50..900 full scale], accent.{violet, violetSoft,
 *     hotPink, hotPinkSoft}, status, typography) are for the v2 design system.
 *   - Legacy keys (surface, semantic, ink.[100,300,500,700,900],
 *     accent.primary, radius, spacing) are PRESERVED for mobile compat.
 *     Do NOT remove them until the "Mobile Migration" slice ships
 *     (planned after the web redesign completes).
 *
 * INTENTIONAL CHANGE:
 *   - `accent.primary` value flipped from #4A6CF7 (blue) to #693BEF (violet)
 *     per Decision #10. Mobile tab bar / accent buttons will recolor on next
 *     mobile build. This is desired and aligned with the design spec.
 */

// ============================================================================
// V2 PALETTE (canonical design system colors)
// ============================================================================

const paper = {
  white: "#FFFFFF",
  warm: "#FBF9F5",
} as const;

const ink = {
  // Preserved values are noted; new intermediate steps fill the scale.
  50: "#FAFAF9",
  100: "#F5F4F1", // preserved
  200: "#E5E2DC",
  300: "#D7D3CC", // preserved
  400: "#B0AAA3",
  500: "#8A847C", // preserved
  600: "#615C55",
  700: "#3F3B35", // preserved
  800: "#2A2722",
  900: "#1A1814", // preserved
} as const;

const accentColors = {
  violet: "#693BEF",          // canonical (Decision #10 — Q-DESIGN-2)
  violetSoft: "#EFE8FB",
  hotPink: "#FF60B4",         // working value (Decision #12 — Q-DESIGN-4 estimate)
  hotPinkSoft: "#FFE2F0",
} as const;

const status = {
  good: "#138A4E",
  warn: "#E0A100",
  danger: "#D93025",
  moment: "#D6E04A",          // "à utiliser rare" per spec
} as const;

// ============================================================================
// THEME EXPORT — combines v2 palette + legacy aliases for mobile compat
// ============================================================================

export const theme = {
  // --- V2 palette ---
  paper,
  ink,
  accent: {
    ...accentColors,
    /** @deprecated Use `accent.violet`. Kept for mobile compat. */
    primary: accentColors.violet,
  },
  status,

  // --- Legacy aliases (mobile compat, preserved values) ---
  /** @deprecated Use `paper` / `ink` directly. Kept for mobile compat. */
  surface: {
    default: "#FAF9F7",
    raised: "#FFFFFF",
    sunken: "#EFEDE8",
  },
  /** @deprecated Use `status.*` directly. Values preserved (not recalibrated). */
  semantic: {
    success: "#4A8F6A",
    warning: "#C9883C",
    danger: "#C25450",
  },

  // --- Numeric scales (PRESERVED — mobile depends on these specific values) ---
  radius: { sm: 8, md: 12, lg: 16, xl: 20, pill: 999 },
  spacing: { xs: 4, sm: 8, md: 12, lg: 16, xl: 24, xxl: 32 },

  // --- Typography (NEW — primarily for web; mobile can adopt selectively) ---
  typography: {
    fontFamily: {
      sans: "Geist, system-ui, sans-serif",
      mono: '"Geist Mono", ui-monospace, monospace',
    },
    fontSize: {
      eyebrow: 11,
      caption: 12,
      body: 14,
      h3: 18,
      h2: 22,
      h1: 28,
      display: 56,
    },
    fontWeight: {
      regular: 400,
      medium: 500,
      semibold: 600,
      bold: 700,
    },
    letterSpacing: {
      tight: "-0.02em",
      normal: "0",
      wide: "0.05em",
      tracker: "0.15em", // mono uppercase eyebrows
    },
  },
} as const;

export type Theme = typeof theme;

// ============================================================================
// V2 mobile palette + type ramp (Jokko App design bundle). Consumed via the
// useTheme() hook in @jokko/ui-mobile. See ./v2.ts.
// ============================================================================
export {
  v2Light,
  v2Dark,
  v2Radius,
  fontFamily,
  type V2Palette,
  type V2Radius,
  type FontFamily,
} from "./v2";
