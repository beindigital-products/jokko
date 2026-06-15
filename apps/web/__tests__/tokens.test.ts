import { describe, expect, it } from "vitest"
import { theme, type Theme } from "@jokko/tokens"

describe("@jokko/tokens — V2 design system shape", () => {
  describe("v2 palette (new keys)", () => {
    it("exposes paper.white and paper.warm", () => {
      expect(theme.paper.white).toBe("#FFFFFF")
      expect(theme.paper.warm).toBe("#FBF9F5")
    })

    it("exposes a full 10-step ink scale", () => {
      const steps = [50, 100, 200, 300, 400, 500, 600, 700, 800, 900] as const
      for (const step of steps) {
        expect(theme.ink[step]).toMatch(/^#[0-9A-F]{6}$/)
      }
    })

    it("exposes accent.violet matching Decision #10 (#693BEF)", () => {
      expect(theme.accent.violet).toBe("#693BEF")
      expect(theme.accent.violetSoft).toBe("#EFE8FB")
    })

    it("exposes accent.hotPink + hotPinkSoft (Decision #12)", () => {
      expect(theme.accent.hotPink).toBe("#FF60B4")
      expect(theme.accent.hotPinkSoft).toBe("#FFE2F0")
    })

    it("exposes status colors {good, warn, danger, moment}", () => {
      expect(theme.status.good).toBe("#138A4E")
      expect(theme.status.warn).toBe("#E0A100")
      expect(theme.status.danger).toBe("#D93025")
      expect(theme.status.moment).toBe("#D6E04A")
    })
  })

  describe("legacy aliases (mobile compat — DO NOT REMOVE until mobile migration)", () => {
    it("keeps accent.primary as alias for accent.violet", () => {
      expect(theme.accent.primary).toBe(theme.accent.violet)
      expect(theme.accent.primary).toBe("#693BEF")
    })

    it("preserves surface.{default, raised, sunken} for mobile", () => {
      expect(theme.surface.default).toBe("#FAF9F7")
      expect(theme.surface.raised).toBe("#FFFFFF")
      expect(theme.surface.sunken).toBe("#EFEDE8")
    })

    it("preserves semantic.{success, warning, danger} hex values for mobile", () => {
      expect(theme.semantic.success).toBe("#4A8F6A")
      expect(theme.semantic.warning).toBe("#C9883C")
      expect(theme.semantic.danger).toBe("#C25450")
    })

    it("preserves ink.{100, 300, 500, 700, 900} legacy values for mobile", () => {
      expect(theme.ink[100]).toBe("#F5F4F1")
      expect(theme.ink[300]).toBe("#D7D3CC")
      expect(theme.ink[500]).toBe("#8A847C")
      expect(theme.ink[700]).toBe("#3F3B35")
      expect(theme.ink[900]).toBe("#1A1814")
    })

    it("preserves radius scale {sm, md, lg, xl, pill}", () => {
      expect(theme.radius.sm).toBe(8)
      expect(theme.radius.md).toBe(12)
      expect(theme.radius.lg).toBe(16)
      expect(theme.radius.xl).toBe(20)
      expect(theme.radius.pill).toBe(999)
    })

    it("preserves spacing scale {xs, sm, md, lg, xl, xxl}", () => {
      expect(theme.spacing.xs).toBe(4)
      expect(theme.spacing.sm).toBe(8)
      expect(theme.spacing.md).toBe(12)
      expect(theme.spacing.lg).toBe(16)
      expect(theme.spacing.xl).toBe(24)
      expect(theme.spacing.xxl).toBe(32)
    })
  })

  describe("typography (v2)", () => {
    it("exposes fontFamily.sans and fontFamily.mono", () => {
      expect(theme.typography.fontFamily.sans).toContain("Geist")
      expect(theme.typography.fontFamily.mono).toContain("Geist Mono")
    })

    it("exposes a complete fontSize scale", () => {
      const sizes = ["eyebrow", "caption", "body", "h3", "h2", "h1", "display"] as const
      for (const size of sizes) {
        expect(theme.typography.fontSize[size]).toBeTypeOf("number")
      }
    })

    it("exposes letterSpacing.tracker for mono eyebrows", () => {
      expect(theme.typography.letterSpacing.tracker).toBe("0.15em")
    })
  })

  describe("type", () => {
    it("Theme type matches runtime shape", () => {
      const t: Theme = theme
      expect(t).toBe(theme)
    })
  })
})
