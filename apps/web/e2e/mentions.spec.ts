import { test, expect } from "@playwright/test"

/**
 * Mentions v3 — the dedicated "Mentions" page wired to the real Convex
 * `mentions.feed` query (MENTION + ASSIGNMENT notifications for the current
 * user, scoped to the active org). Verifies the page renders with NO runtime
 * errors and shows the v3 header; the feed is robust to both the empty state
 * (fresh owner) and a populated feed. Auth comes from the shared storageState
 * (auth.setup.ts).
 */
test.describe("Mentions v3", () => {
    test("renders the mentions page with no runtime errors", async ({ page }) => {
        const errors: string[] = []
        page.on("pageerror", (e) => errors.push(String(e)))

        await page.goto("/dashboard/mentions")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")

        // v3 PageHeader.
        await expect(main.getByRole("heading", { name: "Mentions" })).toBeVisible()
        await expect(main.getByText("Inbox · mentions")).toBeVisible()

        // Either the empty state or at least one mention card is shown.
        const empty = main.getByText("Aucune mention")
        const cards = main.getByRole("button", { name: "Répondre" }).or(
            main.getByRole("link", { name: "Répondre" }),
        )
        const hasEmpty = await empty.isVisible().catch(() => false)
        const cardCount = await cards.count()
        expect(hasEmpty || cardCount > 0).toBeTruthy()

        expect(errors, `runtime errors on /dashboard/mentions: ${errors.join(" | ")}`).toEqual([])
    })

    test("the sidebar Mentions item points at /dashboard/mentions and is active", async ({
        page,
    }) => {
        await page.goto("/dashboard/mentions")
        await page.waitForLoadState("networkidle")

        const sidebar = page.getByTestId("app-sidebar")
        const link = sidebar.getByRole("link", { name: "Mentions" })
        await expect(link).toHaveAttribute("href", "/dashboard/mentions")
        // Active row carries data-active=true on the shadcn menu button.
        await expect(link).toHaveAttribute("data-active", "true")
    })

    test("mention cards (when present) deep-link to a conversation", async ({ page }) => {
        await page.goto("/dashboard/mentions")
        await page.waitForLoadState("networkidle")

        const main = page.locator("#main-content")
        const openLinks = main.getByRole("link", { name: "Ouvrir la conversation" })
        const count = await openLinks.count()
        test.skip(count === 0, "Compte de test sans mention/assignation")

        await expect(openLinks.first()).toHaveAttribute(
            "href",
            /\/dashboard\/conversations\//,
        )
    })
})
