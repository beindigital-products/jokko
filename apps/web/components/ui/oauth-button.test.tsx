import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { OAuthButton } from "./oauth-button"

describe("OAuthButton — v2 Google-only", () => {
  it("renders Google provider with default French label", () => {
    render(<OAuthButton provider="google" />)
    const btn = screen.getByRole("button", { name: /Continuer avec Google/ })
    expect(btn).toBeInTheDocument()
    expect(btn.getAttribute("data-provider")).toBe("google")
  })

  it("accepts an explicit label override", () => {
    render(<OAuthButton provider="google" label="Connexion avec Google" />)
    expect(screen.getByRole("button", { name: "Connexion avec Google" })).toBeInTheDocument()
  })

  it("shows spinner and aria-busy when loading", () => {
    render(<OAuthButton provider="google" loading />)
    const btn = screen.getByRole("button")
    expect(btn.getAttribute("aria-busy")).toBe("true")
    expect(btn).toBeDisabled()
    // Spinner SVG has lucide animate-spin class
    expect(btn.querySelector(".animate-spin")).toBeInTheDocument()
  })

  it("disables when explicitly disabled or loading", () => {
    const { rerender } = render(<OAuthButton provider="google" disabled />)
    expect(screen.getByRole("button")).toBeDisabled()
    rerender(<OAuthButton provider="google" loading />)
    expect(screen.getByRole("button")).toBeDisabled()
  })

  it("renders multicolor Google G icon when not loading", () => {
    const { container } = render(<OAuthButton provider="google" />)
    const svg = container.querySelector("svg[aria-hidden]")
    expect(svg).toBeTruthy()
    // Google's 4-color path set
    const paths = container.querySelectorAll("svg path")
    expect(paths.length).toBe(4)
  })

  it("forwards arbitrary button attributes (onClick, type, etc.)", () => {
    render(
      <OAuthButton provider="google" type="submit" data-testid="oauth-submit" />
    )
    const btn = screen.getByTestId("oauth-submit")
    expect(btn.getAttribute("type")).toBe("submit")
  })
})
