import { cleanup, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it } from "vitest"

import { InboxMockup } from "./inbox-mockup"

afterEach(cleanup)

/**
 * Smoke test for the landing-page dashboard preview. The component is a
 * timer-driven animation; we assert the initial (step 0) render only, so no
 * fake timers are needed — `cleanup` unmounts and the effect clears its
 * timers. Guards the v2 "Cobalt × paper × ink" content + structure against
 * regressions (real motion is verified in the browser, not here).
 */
describe("InboxMockup", () => {
    it("renders the v2 inbox preview shell", () => {
        render(<InboxMockup />)

        // Thread list header + live unread pill (2 + 1 across the demo data).
        expect(screen.getByText("Conversations")).toBeInTheDocument()
        expect(screen.getByText(/3 non lus/)).toBeInTheDocument()

        // Browser-chrome URL bar that frames the preview as "the dashboard".
        expect(screen.getByText(/app\.jokko\.co\/conversations/)).toBeInTheDocument()

        // Active contact is echoed across thread row, header and customer panel.
        expect(screen.getAllByText("Aïssatou Diop").length).toBeGreaterThanOrEqual(2)

        // The open conversation shows the incoming message (full, untruncated).
        expect(
            screen.getByText("Bonjour, ma commande #4821 est-elle bien expédiée ?"),
        ).toBeInTheDocument()
    })

    it("renders the customer panel (tags + lifetime value)", () => {
        render(<InboxMockup />)

        expect(screen.getByText("VIP")).toBeInTheDocument()
        expect(screen.getByText("Fidèle")).toBeInTheDocument()
        expect(screen.getByText("284 000 F")).toBeInTheDocument()
    })

    it("renders the composer in its idle state (no IA draft until step 2)", () => {
        render(<InboxMockup />)

        expect(screen.getByText("Écrire un message…")).toBeInTheDocument()
        // The IA-draft Copilot chip only mounts mid-animation, not on first paint.
        expect(screen.queryByText(/Brouillon IA/)).toBeNull()
    })
})
