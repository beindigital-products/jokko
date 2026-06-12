import { test, expect } from "@playwright/test"
import path from "path"

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
        // Let the Convex query populate the list before tests count items
        // (websocket query resolves after networkidle). Best-effort: a truly
        // empty account just falls through to each test's skip guard.
        await page
            .getByTestId("conversation-item")
            .first()
            .waitFor({ state: "attached", timeout: 8000 })
            .catch(() => {})
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

    test("reply to a message quotes the parent in the sent bubble", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) === 0, "Compte de test sans conversation")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)

        // Reply trigger lives on each message bubble (hover-revealed but still
        // actionable — opacity, not visibility). Wait for bubbles to mount
        // before counting, else we race the async thread render.
        const replyButtons = page.getByRole("button", { name: "Répondre" })
        await replyButtons
            .first()
            .waitFor({ state: "attached", timeout: 10000 })
            .catch(() => {})
        test.skip((await replyButtons.count()) === 0, "Conversation sans message")
        await replyButtons.last().click()

        const textarea = page.locator("textarea")
        await expect(textarea).toBeVisible()
        const msg = `reply e2e ${Date.now()}`
        await textarea.click()
        await textarea.type(msg)

        const quotesBefore = await page.getByTestId("message-quote").count()
        await textarea.press("Enter")

        // The sent reply renders with a quote block citing the parent message.
        await expect(page.getByTestId("message-quote")).toHaveCount(quotesBefore + 1, {
            timeout: 8000,
        })
    })

    test("transfert d'un message vers une autre conversation", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) < 2, "Besoin de 2 conversations pour transférer")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)

        // Forward trigger on each message bubble (hover-revealed).
        const forwardButtons = page.getByRole("button", { name: "Transférer" })
        await forwardButtons
            .first()
            .waitFor({ state: "attached", timeout: 10000 })
            .catch(() => {})
        test.skip((await forwardButtons.count()) === 0, "Conversation sans message")
        await forwardButtons.last().click()

        // v3 forward modal opens with at least one target conversation.
        const modal = page.getByTestId("forward-modal")
        await expect(modal).toBeVisible()
        const targets = page.getByTestId("forward-target")
        await expect(targets.first()).toBeVisible({ timeout: 8000 })

        // Pick a target → forward succeeds → modal auto-closes.
        await targets.first().click()
        await expect(modal).toBeHidden({ timeout: 6000 })
    })

    test("envoi d'une image téléversée → bulle image (Convex storage)", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) === 0, "Compte de test sans conversation")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)
        await expect(page.locator("textarea")).toBeVisible()

        // Let the thread's existing Convex media settle before reading the
        // baseline — otherwise we race the async thread render and capture a
        // stale (too-low) count, making the "+1" assertion flaky.
        const convexImages = page.locator('img[src*="convex"]')
        await page.waitForTimeout(2000)
        const imagesBefore = await convexImages.count()

        // Push the file straight to the hidden input (skip the OS picker).
        await page.setInputFiles(
            'input[type="file"]',
            path.join(__dirname, "fixtures", "qa-image.png"),
        )
        // Attachment preview appears before sending.
        await expect(page.locator('img[alt="Preview"]')).toBeVisible({ timeout: 5000 })

        // Attachment makes the composer sendable → Enter sends the media.
        await page.locator("textarea").click()
        await page.locator("textarea").press("Enter")

        // The uploaded image renders from Convex storage as a new bubble. The
        // thread may already hold media from earlier runs (shared dev data), so
        // assert the count strictly grew rather than an exact value.
        await expect
            .poll(() => convexImages.count(), { timeout: 15000 })
            .toBeGreaterThan(imagesBefore)
    })

    test("message vocal : enregistrer puis envoyer → bulle audio", async ({ page }) => {
        const items = page.getByTestId("conversation-item")
        test.skip((await items.count()) === 0, "Compte de test sans conversation")

        await items.first().click()
        await expect(page).toHaveURL(/\/dashboard\/conversations\/[a-z0-9]+/i)
        await expect(page.locator("textarea")).toBeVisible()

        // Settle existing thread audio before the baseline read (avoid racing
        // the async render → stale count → flaky "+1" assertion).
        const audios = page.locator("audio")
        await page.waitForTimeout(2000)
        const audiosBefore = await audios.count()

        // Empty composer → the mic button is shown (record voice message).
        const mic = page.locator("button:has(.lucide-mic)")
        await expect(mic).toBeVisible()
        await mic.click()

        // Recording UI appears (fake mic granted via launch flags).
        await expect(page.getByText(/Enregistrement/i)).toBeVisible({ timeout: 5000 })
        await page.waitForTimeout(1500) // capture ~1.5s

        // Send the recording (Send button inside the recording UI).
        await page.locator("button:has(.lucide-send)").click()

        // A voice message (audio element from Convex storage) lands in the
        // thread. Assert the count strictly grew (shared dev data may already
        // hold voice messages from earlier runs).
        await expect
            .poll(() => audios.count(), { timeout: 20000 })
            .toBeGreaterThan(audiosBefore)
    })
})
