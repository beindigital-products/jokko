import { test, expect } from "@playwright/test"

/**
 * Inbox v3 — messages flow e2e.
 *
 * Covers the chat surface wired to Convex : the v3 conversation list,
 * server-side search (regression for the no-op search bug), opening a
 * thread, and the internal-note + @mention flow. Uses the shared auth
 * state (e2e/auth.setup.ts). Sending real WhatsApp messages is out of
 * scope (trial / 24h-window gated) — note mode is team-internal so it
 * works regardless.
 */
test.describe("Inbox v3 — messages", () => {
    test.beforeEach(async ({ page }) => {
        await page.goto("/dashboard/conversations")
        await page.waitForLoadState("networkidle")
    })

    test("renders the v3 conversation list (eyebrow + filters)", async ({ page }) => {
        await expect(page.getByText("Boîte de réception")).toBeVisible()
        for (const label of ["Tout", "Non lu", "Non assigné", "Moi", "Archivés"]) {
            await expect(page.getByRole("button", { name: label, exact: true })).toBeVisible()
        }
    })

    test("search filters the conversation list (server-side)", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        const initial = await items.count()
        test.skip(initial === 0, "Compte de test sans conversation")

        const search = page.locator('input[type="search"]')
        await search.fill("zzz-aucun-match-xyz")
        // Server query re-runs; list should empty out.
        await expect(items).toHaveCount(0, { timeout: 8000 })

        await search.fill("")
        await expect(items.first()).toBeVisible({ timeout: 8000 })
    })

    test("opens a conversation → thread + composer with mode toggle", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) === 0, "Compte de test sans conversation")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)

        // v3 composer mode toggle.
        await expect(page.getByRole("button", { name: "Réponse", exact: true })).toBeVisible()
        await expect(page.getByRole("button", { name: "Note interne", exact: true })).toBeVisible()
        await expect(page.locator("textarea")).toBeVisible()
    })

    test("internal note + @mention posts and renders as a note card", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) === 0, "Compte de test sans conversation")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)

        // Switch to internal note mode.
        await page.getByRole("button", { name: "Note interne", exact: true }).click()

        const textarea = page.locator("textarea")
        await textarea.click()
        await textarea.type("@")

        // Mention picker opens (role=listbox aria-label "Mentionner").
        const picker = page.getByRole("listbox", { name: /mentionner/i })
        await expect(picker).toBeVisible({ timeout: 5000 })

        // Pick the first teammate, then append note text.
        await picker.getByRole("option").first().click()
        await textarea.type("merci de vérifier (e2e)")

        const before = await page.getByTestId("internal-note").count()
        await textarea.press("Enter")

        // A new internal-note card appears in the thread.
        await expect(page.getByTestId("internal-note")).toHaveCount(before + 1, {
            timeout: 8000,
        })
        await expect(page.getByTestId("internal-note").last()).toContainText("e2e")
    })
})
