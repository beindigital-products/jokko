import { test, expect } from "@playwright/test"

/**
 * Tableau de bord (overview) v3 — the production cockpit wired to real Convex
 * data. Verifies the page renders with NO runtime errors and shows the KPI row,
 * the WhatsApp marketing-credit bar (FCFA), the attention + team panels and the
 * onboarding checklist. Auth comes from the shared storageState (auth.setup.ts).
 */
test.describe("Tableau de bord v3", () => {
    test("renders the cockpit with real data and no runtime errors", async ({ page }) => {
        const errors: string[] = []
        page.on("pageerror", (e) => errors.push(String(e)))

        await page.goto("/dashboard")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")

        // Page header title (the h1, scoped to main).
        await expect(main.getByRole("heading", { name: "Tableau de bord" })).toBeVisible()

        // The 5 KPI labels.
        for (const kpi of [
            "Conversations reçues",
            "Réponses envoyées",
            "Taux de réponse",
            "Agents en ligne",
            "Non résolues",
        ]) {
            await expect(main.getByText(kpi, { exact: true })).toBeVisible()
        }

        // WhatsApp marketing-credit bar.
        await expect(main.getByText("Crédit marketing WhatsApp")).toBeVisible()
        await expect(main.getByText(/FCFA/).first()).toBeVisible()
        await expect(main.getByRole("link", { name: /Ajouter des crédits/ })).toBeVisible()

        // Attention + team panels and the onboarding checklist.
        await expect(main.getByText("Qui prend la main")).toBeVisible()
        await expect(main.getByText("Connecter un CRM")).toBeVisible()

        expect(errors, `runtime errors on /dashboard: ${errors.join(" | ")}`).toEqual([])
    })

    test("the marketing-credit CTA links to billing", async ({ page }) => {
        await page.goto("/dashboard")
        await page.waitForLoadState("networkidle")
        const cta = page
            .locator("#main-content")
            .getByRole("link", { name: /Ajouter des crédits/ })
        await expect(cta).toHaveAttribute("href", /\/dashboard\/billing/)
    })

    test("the header action buttons link to the right pages", async ({ page }) => {
        await page.goto("/dashboard")
        await page.waitForLoadState("networkidle")
        const main = page.locator("#main-content")
        await expect(main.getByRole("link", { name: /Nouvelle campagne/ })).toHaveAttribute(
            "href",
            "/dashboard/campagnes/new",
        )
        await expect(main.getByRole("link", { name: /Nouveau modèle/ })).toHaveAttribute(
            "href",
            "/dashboard/modeles",
        )
        await expect(main.getByRole("link", { name: /Inviter un coéquipier/ })).toHaveAttribute(
            "href",
            "/dashboard/team",
        )
    })
})
