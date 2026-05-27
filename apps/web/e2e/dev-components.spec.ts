import { test, expect } from "@playwright/test"

/**
 * Slice 0 — Foundations smoke test.
 *
 * Validates that the /dev/components demo page renders all primitives
 * (tokens, button variants, alerts, oauth button).
 *
 * Public route (per proxy.ts) — no auth setup needed. The page itself
 * guards with NODE_ENV check and returns notFound() in production.
 */
test.describe("Slice 0 — /dev/components smoke", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/components")
  })

  test("renders the foundations heading", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: /Cobalt × paper × ink — v2 primitives/ })
    ).toBeVisible()
  })

  test("renders all 12 color token swatches", async ({ page }) => {
    const tokens = [
      "paper-white",
      "paper-warm",
      "ink-900",
      "ink-soft",
      "accent",
      "accent-hover",
      "accent-soft",
      "accent-hot-pink",
      "status-good",
      "status-warn",
      "status-danger",
      "status-moment",
    ]
    for (const t of tokens) {
      await expect(page.getByText(t, { exact: true })).toBeVisible()
    }
  })

  test("renders every Button variant", async ({ page }) => {
    const variants = [
      "Default (legacy)",
      "Accent (v2 primary)",
      "Accent · xl",
      "Destructive",
      "Outline",
      "Secondary",
      "Ghost",
      "Link",
      "Mot de passe oublié ?",
    ]
    for (const v of variants) {
      await expect(
        page.getByRole("button", { name: v }).first()
      ).toBeVisible()
    }
  })

  test("Label eyebrow uses mono uppercase tracker", async ({ page }) => {
    const eyebrow = page.getByText("Connexion · Espace équipe").first()
    await expect(eyebrow).toBeVisible()
    await expect(eyebrow).toHaveCSS("text-transform", "uppercase")
    await expect(eyebrow).toHaveCSS("letter-spacing", /0\.15em|.+px/) // tracker
  })

  test("Alert cream enum shows all 4 variants", async ({ page }) => {
    await expect(page.getByText("Email ou mot de passe incorrect")).toBeVisible()
    await expect(page.getByText("Modèle approuvé")).toBeVisible()
    await expect(page.getByText("Connexion lente détectée")).toBeVisible()
    await expect(page.getByText("Astuce")).toBeVisible()
  })

  test("OAuth Google button renders in 3 states", async ({ page }) => {
    const buttons = page.getByRole("button", { name: /Continuer avec Google/ })
    await expect(buttons).toHaveCount(3)
  })

  test("no console errors on initial render", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    await page.goto("/dev/components")
    await page.waitForLoadState("networkidle")
    // Filter known dev-only noise (HMR websocket etc.)
    const realErrors = errors.filter(
      (e) =>
        !e.includes("webpack-hmr") &&
        !e.includes("ws://") &&
        !e.includes("metadataBase")
    )
    expect(realErrors).toEqual([])
  })
})
