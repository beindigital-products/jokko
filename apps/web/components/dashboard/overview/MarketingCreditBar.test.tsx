import type { ReactNode } from "react"
import { cleanup, fireEvent, render, screen } from "@testing-library/react"
import { afterEach, describe, expect, it, vi } from "vitest"

import { MarketingCreditBar } from "./MarketingCreditBar"
import type { MarketingCredit } from "./types"

// Render next/link as a plain <a> so the CTA href is assertable.
vi.mock("next/link", () => ({
    default: ({ href, children, ...rest }: { href: string; children: ReactNode } & Record<string, unknown>) => (
        <a href={href} {...rest}>
            {children}
        </a>
    ),
}))

afterEach(cleanup)

const BASE: MarketingCredit = {
    balance: "€128.40",
    conversations: "2 040",
    spent: "€148.72",
    budget: "€820",
    pct: 18,
    runwayLabel: "Tient ≈ 9 jours au rythme actuel",
    autoTopupLabel: "Recharge auto · €100",
}

describe("MarketingCreditBar", () => {
    it("renders balance, conversations, spend and runway", () => {
        render(<MarketingCreditBar credit={BASE} />)
        expect(screen.getByText("€128.40")).toBeInTheDocument()
        expect(screen.getByText(/2 040 conversations marketing/)).toBeInTheDocument()
        expect(screen.getByText("€148.72 / €820")).toBeInTheDocument()
        expect(screen.getByText("Tient ≈ 9 jours au rythme actuel")).toBeInTheDocument()
        expect(screen.getByText("Recharge auto · €100")).toBeInTheDocument()
    })

    it("links to billing by default", () => {
        render(<MarketingCreditBar credit={BASE} rechargeHref="/dashboard/billing" />)
        expect(screen.getByText("Ajouter des crédits").closest("a")).toHaveAttribute("href", "/dashboard/billing")
    })

    it("calls onRecharge (and renders a button, not a link) when provided", () => {
        const onRecharge = vi.fn()
        render(<MarketingCreditBar credit={BASE} onRecharge={onRecharge} />)
        fireEvent.click(screen.getByRole("button", { name: /Ajouter des crédits/ }))
        expect(onRecharge).toHaveBeenCalledTimes(1)
    })

    it("shows the low-balance message when low", () => {
        render(<MarketingCreditBar credit={{ ...BASE, low: true, lowLabel: "Solde bas — rechargez" }} />)
        expect(screen.getByText("Solde bas — rechargez")).toBeInTheDocument()
    })
})
