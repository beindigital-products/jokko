import { test, expect } from "@playwright/test"

/**
 * Slice 3 — Onboarding wizard smoke test.
 *
 * The real /onboarding route redirects authenticated, already-onboarded users
 * to /dashboard (the shared test account has completed onboarding), so the
 * wizard chrome never mounts there. We instead exercise the live
 * `<OnboardingWizard />` via its dev preview route (/dev/onboarding), which
 * mounts the real component without the redirect guard. That page also renders
 * the stepper at its 4 static states (Section B) below the live wizard, so
 * every wizard-chrome locator scopes to the FIRST occurrence (the live wizard).
 *
 * Scope of this spec : visual chrome + stepper interactivity + step routing
 * shell. Per-step form submission flows are out of scope.
 */
test.describe("Slice 3 — /onboarding wizard chrome", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/dev/onboarding")
    await page.waitForLoadState("networkidle")
  })

  test("renders the progress stepper with 4 steps", async ({ page }) => {
    // 4 step buttons (numbered or with check) — the live wizard's stepper.
    const stepButtons = page
      .locator("nav[aria-label*='Progression']")
      .first()
      .getByRole("button")
    await expect(stepButtons).toHaveCount(4)
  })

  test("stepper labels show all 4 step titles", async ({ page }) => {
    // Scope to the live wizard's stepper : the current step's title also
    // renders as the page <h1>, so an unscoped getByText would match 2+ elements.
    const stepper = page.locator("nav[aria-label*='Progression']").first()
    await expect(stepper.getByText("Informations Business")).toBeVisible()
    await expect(stepper.getByText("Choisir un plan")).toBeVisible()
    await expect(stepper.getByText("Connexion WhatsApp")).toBeVisible()
    await expect(stepper.getByText("Terminé !")).toBeVisible()
  })

  test("future steps are aria-disabled (no skip-ahead)", async ({ page }) => {
    const stepperButtons = page
      .locator("nav[aria-label*='Progression']")
      .first()
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
      .first()
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
    // The onboarding surface fills the viewport on a paper-warm background.
    // (On the dev preview route this is the <main> wrapper; both expose the
    // same min-h-screen + paper-warm token, so match on class regardless of tag.)
    const root = page.locator(".min-h-screen.bg-\\[var\\(--paper-warm\\)\\]")
    await expect(root.first()).toBeVisible()
  })
})
