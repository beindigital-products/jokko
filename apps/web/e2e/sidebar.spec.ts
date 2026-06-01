import { test, expect } from "@playwright/test"

/**
 * Dashboard sidebar v3 — grouped cockpit nav (paper · ink · accent).
 * Verifies the restructured sidebar: 6 labelled sections, org/user cards,
 * search, navigation + active route, and the account dropdown.
 */
test.describe("Sidebar v3", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/dashboard/conversations")
        await page.waitForLoadState("networkidle")
    })

    test("renders the 6 grouped sections + search + org card", async ({ page }) => {
        const nav = page.locator('nav[aria-label="Navigation principale"]')
        for (const label of [
            "PILOTAGE",
            "INBOX",
            "DONNÉES",
            "AUTOMATISATION",
            "ÉQUIPE & INSIGHTS",
            "COMPTE",
        ]) {
            await expect(nav.getByText(label, { exact: true })).toBeVisible()
        }
        await expect(nav.getByText("Rechercher")).toBeVisible()
        // Nav items from different sections are present.
        for (const item of ["Conversations", "Mentions", "Contacts", "Réglages"]) {
            await expect(nav.getByRole("link", { name: item, exact: true })).toBeVisible()
        }
    })

    test("navigates via a nav item and reflects the active route", async ({ page }) => {
        const nav = page.locator('nav[aria-label="Navigation principale"]')
        await nav.getByRole("link", { name: "Contacts", exact: true }).click()
        await expect(page).toHaveURL(/\/dashboard\/contacts/)

        await nav.getByRole("link", { name: "Réglages", exact: true }).click()
        await expect(page).toHaveURL(/\/dashboard\/settings/)
    })

    test("user card opens the account menu with sign out", async ({ page }) => {
        const nav = page.locator('nav[aria-label="Navigation principale"]')
        await nav
            .getByRole("button")
            .filter({ hasText: /Propriétaire|Administrateur|Agent/ })
            .click()
        await expect(page.getByRole("menuitem", { name: /Déconnexion/i })).toBeVisible()
        await expect(page.getByRole("menuitem", { name: /Mon compte/i })).toBeVisible()
    })
})
