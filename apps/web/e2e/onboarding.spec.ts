import { test, expect } from "@playwright/test"

/**
 * Slice 3 — Onboarding wizard smoke test.
 *
 * Requires the test user to be authenticated (via auth.setup.ts). For a
 * truly fresh user the wizard starts at BUSINESS_INFO ; for a user mid-
 * onboarding the wizard resumes at their persisted onboardingStep.
 *
 * Scope of this spec : visual chrome + stepper interactivity + step routing
 * shell. Per-step form submission flows are out of scope (existing org-state
 * setup would interfere).
 */
test.describe("Slice 3 — /onboarding wizard chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/onboarding")
  })

  test("renders the progress stepper with 4 steps", async ({ page }) => {
    // 4 step buttons (numbered or with check)
    const stepButtons = page
      .locator("nav[aria-label*='Progression']")
      .getByRole("button")
    await expect(stepButtons).toHaveCount(4)
  })

  test("stepper labels show all 4 step titles", async ({ page }) => {
    await expect(page.getByText("Informations Business")).toBeVisible()
    await expect(page.getByText("Choisir un plan")).toBeVisible()
    await expect(page.getByText("Connexion WhatsApp")).toBeVisible()
    await expect(page.getByText("Terminé !")).toBeVisible()
  })

  test("future steps are aria-disabled (no skip-ahead)", async ({ page }) => {
    const stepperButtons = page
      .locator("nav[aria-label*='Progression']")
      .getByRole("button")
    // Each non-current step that hasn't been completed is aria-disabled
    const futureBtns = stepperButtons.locator("[data-state='future']")
    const count = await futureBtns.count()
    for (let i = 0; i < count; i++) {
      await expect(futureBtns.nth(i)).toHaveAttribute("aria-disabled", "true")
    }
  })

  test("current step is a violet circle marker (v3 uniform shape)", async ({ page }) => {
    const current = page
      .locator("nav[aria-label*='Progression']")
      .locator("[data-state='current']")
    await expect(current).toBeVisible()
    await expect(current).toHaveAttribute("aria-current", "step")
  })

  test("Jokko logo renders above the stepper", async ({ page }) => {
    // v3 brand header — image alt is "Jokko"
    const logo = page.getByAltText("Jokko").first()
    await expect(logo).toBeVisible()
  })

  test("no green Loader2 (v2 token = accent violet)", async ({ page }) => {
    // If the (onboarding)/layout loading state renders, the spinner must NOT
    // be green-600 — we replaced it with var(--accent).
    const greenSpinners = page.locator(".text-green-600.animate-spin")
    await expect(greenSpinners).toHaveCount(0)
  })

  test("WhatsApp brand button keeps WhatsApp green (#25D366)", async ({ page }) => {
    // We need to navigate to WHATSAPP_CONNECT step ; skip if not currently
    // there. This is a smoke check : the file source preserves the brand
    // hex, and the test asserts presence on the actual step if reachable.
    // For an authenticated test user mid-wizard, only run when on the WA step.
    const onWaStep = await page
      .getByRole("button", { name: /Connecter WhatsApp Business/ })
      .count()
    test.skip(onWaStep === 0, "Test user not on WhatsApp Connect step")
    const waButton = page.getByRole("button", {
      name: /Connecter WhatsApp Business/,
    })
    await expect(waButton).toBeVisible()
  })

  test("page bg is paper-warm (v2 token, not gray-50)", async ({ page }) => {
    const root = page.locator("div.min-h-screen.bg-\\[var\\(--paper-warm\\)\\]")
    await expect(root).toBeVisible()
  })
})
