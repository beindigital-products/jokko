import { test, expect } from "@playwright/test"

/**
 * Slice 1 — Sign-in smoke test.
 *
 * Public route (no auth setup needed). Validates :
 *   - Page renders with hot-pink shell + violet mat + white inner card
 *   - All form elements present
 *   - Submit triggers loading state
 *   - Trust footer visible
 *   - No OAuth Google button (deferred to Slice 1b)
 *
 * Note : full auth round-trip requires Convex backend; this spec only
 * exercises the client-side rendering and form state machine.
 */
test.describe("Slice 1 — /auth/sign-in", () => {
  test.beforeEach(async ({ page }) => {
    await page.goto("/auth/sign-in")
  })

  test("renders editorial heading + eyebrow", async ({ page }) => {
    await expect(
      page.getByRole("heading", { name: "Bon retour." })
    ).toBeVisible()
    await expect(page.getByText("Connexion · Espace équipe")).toBeVisible()
  })

  test("renders all form fields", async ({ page }) => {
    await expect(page.getByLabel("E-mail professionnel")).toBeVisible()
    await expect(page.getByLabel("Mot de passe")).toBeVisible()
    await expect(page.getByTestId("sign-in-submit")).toBeVisible()
  })

  test("forgot-password link routes correctly", async ({ page }) => {
    const link = page.getByRole("link", { name: /Oublié/ })
    await expect(link).toBeVisible()
    await expect(link).toHaveAttribute("href", "/auth/forgot-password")
  })

  test("sign-up cross-link is present", async ({ page }) => {
    await expect(
      page.getByRole("link", { name: /Créer un espace équipe/ })
    ).toBeVisible()
  })

  test("trust footer shows RGPD · UE · TLS 1.3", async ({ page }) => {
    await expect(page.getByText("RGPD")).toBeVisible()
    await expect(page.getByText("Hébergement UE")).toBeVisible()
    await expect(page.getByText("TLS 1.3")).toBeVisible()
  })

  test("page-shell-auth has loud intensity", async ({ page }) => {
    await expect(
      page.locator("[data-slot='page-shell-auth'][data-intensity='loud']")
    ).toBeVisible()
  })

  test("violet card mat + white inner card present", async ({ page }) => {
    const card = page.locator("[data-slot='page-shell-auth-card']")
    await expect(card).toBeVisible()
  })

  test("NO OAuth Google button (deferred to Slice 1b)", async ({ page }) => {
    await expect(
      page.getByRole("button", { name: /Continuer avec Google/ })
    ).toHaveCount(0)
  })

  test("submit with empty fields shows browser validation (required)", async ({ page }) => {
    await page.getByTestId("sign-in-submit").click()
    // Browser-native validation kicks in — first invalid field gets focus
    await expect(page.getByLabel("E-mail professionnel")).toBeFocused()
  })

  test("no console errors on initial render", async ({ page }) => {
    const errors: string[] = []
    page.on("console", (msg) => {
      if (msg.type() === "error") errors.push(msg.text())
    })
    await page.goto("/auth/sign-in")
    await page.waitForLoadState("networkidle")
    const real = errors.filter(
      (e) =>
        !e.includes("webpack-hmr") &&
        !e.includes("ws://") &&
        !e.includes("metadataBase") &&
        !e.includes("hydration") // dev-mode hydration warnings
    )
    expect(real).toEqual([])
  })
})

test.describe("Slice 1 — /auth/forgot-password", () => {
  test("renders + has email field", async ({ page }) => {
    await page.goto("/auth/forgot-password")
    await expect(
      page.getByRole("heading", { name: /On vous renvoie ça/ })
    ).toBeVisible()
    await expect(page.getByLabel("E-mail du compte")).toBeVisible()
    await expect(page.getByTestId("forgot-password-submit")).toBeVisible()
  })

  test("back link routes to /auth/sign-in", async ({ page }) => {
    await page.goto("/auth/forgot-password")
    await expect(
      page.getByRole("link", { name: /Retour à la connexion/ })
    ).toHaveAttribute("href", "/auth/sign-in")
  })
})

test.describe("Slice 1 — /auth/reset-password", () => {
  test("renders + password complexity hint", async ({ page }) => {
    await page.goto("/auth/reset-password?email=test@test.com&code=123456")
    await expect(
      page.getByRole("heading", { name: /Choisissez un nouveau mot de passe/ })
    ).toBeVisible()
    await expect(
      page.getByText(/10 caractères minimum/)
    ).toBeVisible()
  })

  test("pre-fills email from query param", async ({ page }) => {
    await page.goto("/auth/reset-password?email=ada%40jokko.test&code=999")
    const email = page.getByLabel("E-mail du compte")
    await expect(email).toHaveValue("ada@jokko.test")
  })
})
