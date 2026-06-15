import { test, expect } from "@playwright/test"

/**
 * Contacts v3 — the production page redesigned to Cobalt × paper × ink:
 * the ContactsView body (toolbar + table/cards + selection), the contact
 * detail drawer, and the v3 modals (create/edit, CSV import, duplicates).
 * Verifies the page renders with NO runtime errors and that each surface
 * opens. Owner auth via the shared storageState (auth.setup.ts). We open the
 * modals but never submit — no writes to the shared dev data.
 */
test.describe("Contacts v3", () => {
    test("renders the v3 list with no runtime errors", async ({ page }) => {
        const errors: string[] = []
        page.on("pageerror", (e) => errors.push(String(e)))

        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")
        await expect(main.getByRole("heading", { name: "Contacts" })).toBeVisible()
        await expect(main.getByRole("button", { name: /Nouveau/ })).toBeVisible()
        await expect(main.getByRole("button", { name: /Importer/ })).toBeVisible()

        // Either the v3 table has rows or the empty state shows. The v3
        // ContactsTable is a CSS-grid (div role="button" rows, not a <table>),
        // so detect rows via the per-row select checkbox. `networkidle` fires
        // before the Convex websocket query resolves, so poll until the list
        // settles into one of the two states (avoids the loading-skeleton race).
        const rows = main.locator('input[type="checkbox"][aria-label^="Sélectionner"]')
        const empty = main.getByText(/annuaire est vide|Aucun contact/)
        await expect
            .poll(
                async () =>
                    (await rows.count()) > 0 ||
                    (await empty.isVisible().catch(() => false)),
                { timeout: 10000 },
            )
            .toBe(true)

        expect(errors, `runtime errors on /dashboard/contacts: ${errors.join(" | ")}`).toEqual([])
    })

    test("the sidebar Contacts item is active", async ({ page }) => {
        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")
        const link = page.getByTestId("app-sidebar").getByRole("link", { name: "Contacts" })
        await expect(link).toHaveAttribute("href", "/dashboard/contacts")
        await expect(link).toHaveAttribute("data-active", "true")
    })

    test("the search box filters down to the empty state", async ({ page }) => {
        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")
        const main = page.locator("#main-content")
        await main.getByPlaceholder(/Rechercher par nom/).fill("zzz-improbable-xyz-000")
        await expect(main.getByText(/ne correspond à vos critères/)).toBeVisible()
    })

    test("the Nouveau button opens the v3 create modal", async ({ page }) => {
        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")
        await page.locator("#main-content").getByRole("button", { name: /Nouveau/ }).click()
        const dialog = page.getByRole("dialog")
        await expect(dialog.getByRole("heading", { name: "Nouveau contact" })).toBeVisible()
    })

    test("the Importer button opens the v3 import wizard", async ({ page }) => {
        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")
        await page.locator("#main-content").getByRole("button", { name: /Importer/ }).click()
        const dialog = page.getByRole("dialog")
        await expect(dialog.getByText("Importer des contacts")).toBeVisible()
    })

    test("clicking a contact opens the v3 detail drawer", async ({ page }) => {
        await page.goto("/dashboard/contacts")
        await page.waitForLoadState("networkidle")
        // v3 rows are CSS-grid divs (role="button"); target them via the
        // per-row select checkbox, then click the row it belongs to.
        const rowCheckboxes = page.locator(
            '#main-content input[type="checkbox"][aria-label^="Sélectionner"]',
        )
        test.skip((await rowCheckboxes.count()) === 0, "Compte de test sans contact")
        await rowCheckboxes.first().locator("xpath=ancestor::*[@role='button'][1]").click()
        const drawer = page.getByRole("dialog")
        await expect(drawer.getByText("Informations")).toBeVisible()
    })
})
