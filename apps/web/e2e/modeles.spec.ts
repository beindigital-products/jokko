import { test, expect } from "@playwright/test"

/**
 * Modèles v3 — the WhatsApp templates page redesigned to Cobalt × paper × ink:
 * the TemplatesScreen (header + category pills + table + WhatsApp preview), the
 * Modèles ↔ Réponses rapides toggle, the v3 create modal (type picker →
 * builder), and the advanced-type fallback to the legacy builder. Verifies the
 * page renders with NO runtime errors and that each surface opens. Owner auth
 * via the shared storageState. Modals open but never submit — no writes.
 */
test.describe("Modèles v3", () => {
    test("renders the v3 templates screen with no runtime errors", async ({ page }) => {
        const errors: string[] = []
        page.on("pageerror", (e) => errors.push(String(e)))

        await page.goto("/dashboard/modeles")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")
        await expect(main.getByRole("heading", { name: "Modèles" })).toBeVisible()
        await expect(main.getByRole("button", { name: /Sync Meta/ })).toBeVisible()
        await expect(main.getByRole("button", { name: /Nouveau modèle/ })).toBeVisible()

        expect(errors, `runtime errors on /dashboard/modeles: ${errors.join(" | ")}`).toEqual([])
    })

    test("the sidebar Modèles item is active", async ({ page }) => {
        await page.goto("/dashboard/modeles")
        await page.waitForLoadState("networkidle")
        const link = page.getByTestId("app-sidebar").getByRole("link", { name: "Modèles" })
        await expect(link).toHaveAttribute("href", "/dashboard/modeles")
        await expect(link).toHaveAttribute("data-active", "true")
    })

    test("toggles to the Réponses rapides view and back", async ({ page }) => {
        await page.goto("/dashboard/modeles")
        await page.waitForLoadState("networkidle")
        const main = page.locator("#main-content")
        await main.getByRole("button", { name: "Réponses rapides" }).click()
        await expect(main.getByRole("heading", { name: "Réponses rapides" })).toBeVisible()
        await main.getByRole("button", { name: "Modèles WhatsApp" }).click()
        await expect(main.getByRole("heading", { name: "Modèles" })).toBeVisible()
    })

    test("the Nouveau modèle button opens the v3 type picker", async ({ page }) => {
        await page.goto("/dashboard/modeles")
        await page.waitForLoadState("networkidle")
        await page.locator("#main-content").getByRole("button", { name: /Nouveau modèle/ }).click()
        await expect(page.getByText(/Choisissez le type/)).toBeVisible()
    })

    test("picking an advanced type offers the legacy builder", async ({ page }) => {
        await page.goto("/dashboard/modeles")
        await page.waitForLoadState("networkidle")
        await page.locator("#main-content").getByRole("button", { name: /Nouveau modèle/ }).click()
        await page.getByRole("button", { name: /Catalogue/ }).click()
        await expect(page.getByRole("button", { name: /éditeur avancé/i })).toBeVisible()
    })
})
