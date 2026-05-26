import { test, expect } from "@playwright/test"

/**
 * Slice 2 — Sign-up smoke + policy + RGPD test.
 *
 * Public route per proxy.ts. Validates :
 *   - PageShellAuth loud shell + violet mat + white card
 *   - All 4 form fields + RGPD checkbox + honeypot present
 *   - Submit gated until policy + terms + match
 *   - Password strength meter appears on typing
 *   - No OAuth Google button (deferred)
 */
test.describe("Slice 2 — /auth/sign-up", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-up")
  })

  test("renders editorial heading + eyebrow", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Votre inbox équipe." })
    ).toBeVisible()
    await expect(page.getByText("Nouvel espace · 14 jours offerts")).toBeVisible()
  })

  test("renders 4 form fields", async ({ page }) => {
    await expect(page.getByLabel("Votre nom complet")).toBeVisible()
    await expect(page.getByLabel("E-mail professionnel")).toBeVisible()
    await expect(page.getByLabel("Mot de passe")).toBeVisible()
    await expect(page.getByLabel("Confirmation")).toBeVisible()
  })

  test("renders RGPD consent checkbox (required for submit)", async ({ page }) => {
    const checkbox = page.getByRole("checkbox", { name: /CGU/ })
    await expect(checkbox).toBeVisible()
    await expect(checkbox).not.toBeChecked()
  })

  test("submit button is disabled by default", async ({ page }) => {
    await expect(page.getByTestId("sign-up-submit")).toBeDisabled()
  })

  test("submit enables only when all gates pass", async ({ page }) => {
    await page.getByLabel("Votre nom complet").fill("Ada Lovelace")
    await page.getByLabel("E-mail professionnel").fill("ada@jokko.test")
    await page.getByLabel("Mot de passe").fill("AbcdefghI1")
    await page.getByLabel("Confirmation").fill("AbcdefghI1")
    // Not yet — terms unchecked
    await expect(page.getByTestId("sign-up-submit")).toBeDisabled()
    await page.getByRole("checkbox", { name: /CGU/ }).check()
    await expect(page.getByTestId("sign-up-submit")).toBeEnabled()
  })

  test("password strength meter appears on typing and shows FORT only at full pass", async ({ page }) => {
    await page.getByLabel("Mot de passe").fill("abc")
    await expect(page.getByText("Faible", { exact: true })).toBeVisible()
    await page.getByLabel("Mot de passe").fill("Abc123")
    await expect(page.getByText("Moyen", { exact: true })).toBeVisible()
    await page.getByLabel("Mot de passe").fill("AbcdefghI1")
    await expect(page.getByText("Fort", { exact: true })).toBeVisible()
  })

  test("password criteria checklist shows 4 entries (no special char)", async ({ page }) => {
    await page.getByLabel("Mot de passe").fill("abc")
    await expect(page.getByText("Au moins 10 caractères")).toBeVisible()
    await expect(page.getByText("Une lettre minuscule")).toBeVisible()
    await expect(page.getByText("Une lettre majuscule")).toBeVisible()
    await expect(page.getByText("Un chiffre")).toBeVisible()
    await expect(page.locator("text=/spécial/i")).toHaveCount(0)
  })

  test("page-shell-auth is in loud intensity", async ({ page }) => {
    await expect(
      page.locator("[data-slot='page-shell-auth'][data-intensity='loud']")
    ).toBeVisible()
  })

  test("NO OAuth Google button (deferred to Slice 1b)", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/ })
    ).toHaveCount(0)
  })

  test("trust footer shows 14j · Sans CB · RGPD", async ({ page }) => {
    await expect(page.getByText("14 jours offerts")).toBeVisible()
    await expect(page.getByText("Sans CB")).toBeVisible()
    await expect(page.locator("footer, div").filter({ hasText: "RGPD" })).toBeVisible()
  })

  test("cross-link to /auth/sign-in", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Se connecter/ })
    ).toHaveAttribute("href", "/auth/sign-in")
  })
})
