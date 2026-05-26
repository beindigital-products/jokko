import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PageShellAuth } from "./page-shell-auth"

describe("PageShellAuth — v2 loud auth shell", () => {
  it("renders root + card slot composition", () => {
    render(
      <PageShellAuth>
        <PageShellAuth.Card>
          <h1>Sign in</h1>
        </PageShellAuth.Card>
      </PageShellAuth>
    )
    expect(screen.getByText("Sign in")).toBeInTheDocument()
  })

  it("defaults to loud intensity with hot-pink background", () => {
    const { container } = render(
      <PageShellAuth>
        <PageShellAuth.Card>x</PageShellAuth.Card>
      </PageShellAuth>
    )
    const root = container.querySelector("[data-slot='page-shell-auth']")
    expect(root).toBeTruthy()
    expect(root?.getAttribute("data-intensity")).toBe("loud")
    expect(root?.className).toMatch(/bg-\[var\(--accent-hot-pink\)\]/)
  })

  it("soft intensity uses paper-warm background", () => {
    const { container } = render(
      <PageShellAuth intensity="soft">
        <PageShellAuth.Card>x</PageShellAuth.Card>
      </PageShellAuth>
    )
    const root = container.querySelector("[data-slot='page-shell-auth']")
    expect(root?.getAttribute("data-intensity")).toBe("soft")
    expect(root?.className).toMatch(/bg-\[var\(--paper-warm\)\]/)
  })

  it("Card renders violet mat + white inner surface", () => {
    const { container } = render(
      <PageShellAuth>
        <PageShellAuth.Card>x</PageShellAuth.Card>
      </PageShellAuth>
    )
    const card = container.querySelector("[data-slot='page-shell-auth-card']")
    expect(card).toBeTruthy()
    expect(card?.className).toMatch(/bg-\[var\(--accent\)\]/)
    // inner card child
    const inner = card?.firstElementChild
    expect(inner?.className).toMatch(/bg-\[var\(--paper-white\)\]/)
  })

  it("Card supports width sm | md | lg", () => {
    const widths = ["sm", "md", "lg"] as const
    for (const w of widths) {
      const { container, unmount } = render(
        <PageShellAuth>
          <PageShellAuth.Card width={w}>x</PageShellAuth.Card>
        </PageShellAuth>
      )
      const card = container.querySelector("[data-slot='page-shell-auth-card']")
      expect(card?.className).toMatch(new RegExp(`max-w-${w}`))
      unmount()
    }
  })
})
