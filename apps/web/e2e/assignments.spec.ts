import { test, expect } from "@playwright/test"

/**
 * Assignations v3 — the hybrid production page: the functional auto-assignment
 * master toggle + the operational assignment queue (search / tabs / manual +
 * bulk assign) + real-time agent load + a read-only routing preview. Verifies
 * the page renders with NO runtime errors and that each section + the core
 * interactions work. Owner auth via the shared storageState (auth.setup.ts).
 *
 * We do NOT flip the master switch here — it mutates shared org settings (and
 * re-syncs every membership's capacity); that round-trip is exercised manually.
 */
test.describe("Assignations v3", () => {
    test("renders the hybrid page with no runtime errors", async ({ page }) => {
        const errors: string[] = []
        page.on("pageerror", (e) => errors.push(String(e)))

        await page.goto("/dashboard/assignments")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")

        await expect(main.getByRole("heading", { name: "Assignations" })).toBeVisible()
        // 1 · Functional master toggle.
        await expect(main.getByRole("switch", { name: "Auto-assignation" })).toBeVisible()
        // 2 · Operational queue + tabs.
        await expect(main.getByText("File d'attribution", { exact: true })).toBeVisible()
        await expect(main.getByRole("button", { name: /Non assignées/ })).toBeVisible()
        await expect(main.getByRole("button", { name: /Assignées/ })).toBeVisible()
        // 3 · Agent load.
        await expect(main.getByText("Charge actuelle par agent")).toBeVisible()
        // 4 · Read-only routing preview.
        await expect(main.getByText("Routage automatique · aperçu")).toBeVisible()
        await expect(main.getByText("Lecture seule")).toBeVisible()

        expect(errors, `runtime errors on /dashboard/assignments: ${errors.join(" | ")}`).toEqual([])
    })

    test("the sidebar Assignations item is active on /dashboard/assignments", async ({ page }) => {
        await page.goto("/dashboard/assignments")
        await page.waitForLoadState("networkidle")

        const link = page.getByTestId("app-sidebar").getByRole("link", { name: "Assignations" })
        await expect(link).toHaveAttribute("href", "/dashboard/assignments")
        await expect(link).toHaveAttribute("data-active", "true")
    })

    test("the search box filters the queue down to the empty state", async ({ page }) => {
        await page.goto("/dashboard/assignments")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")
        const search = main.getByPlaceholder(/Rechercher par nom/)
        await expect(search).toBeVisible()
        await search.fill("zzz-improbable-query-xyz")
        await expect(main.getByText("File vide")).toBeVisible()
    })

    test("toggling bulk mode reveals row checkboxes when the queue has items", async ({ page }) => {
        await page.goto("/dashboard/assignments")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")
        const hasItems = (await main.getByRole("button", { name: /^(Assigner|Réassigner)$/ }).count()) > 0
        test.skip(!hasItems, "File d'attribution vide sur le compte de test")

        await main.getByRole("button", { name: "Attribution en lot" }).click()
        await expect(
            main.getByRole("button", { name: /Sélectionner|Désélectionner/ }).first(),
        ).toBeVisible()
    })

    test("the Réglages button opens the settings dialog", async ({ page }) => {
        await page.goto("/dashboard/assignments")
        await page.waitForLoadState("networkidle")

        await page.locator("#main-content").getByRole("button", { name: "Réglages" }).click()
        const dialog = page.getByRole("dialog")
        await expect(dialog).toBeVisible()
        await expect(dialog.getByText("Attribution automatique")).toBeVisible()
    })
})
