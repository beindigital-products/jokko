import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Label, labelVariants } from "./label"

describe("Label — v2 eyebrow variant", () => {
  it("renders default variant (legacy back-compat)", () => {
    render(<Label>Email address</Label>)
    const label = screen.getByText("Email address")
    expect(label).toBeInTheDocument()
    expect(label.className).toMatch(/text-sm/)
    expect(label.className).toMatch(/font-medium/)
    expect(label.getAttribute("data-variant")).toBe("default")
  })

  it("renders eyebrow variant with mono + tracked uppercase", () => {
    render(<Label variant="eyebrow">Connexion</Label>)
    const label = screen.getByText("Connexion")
    expect(label.className).toMatch(/font-mono/)
    expect(label.className).toMatch(/uppercase/)
    expect(label.className).toMatch(/tracking-\[0\.15em\]/)
    expect(label.className).toMatch(/text-\[var\(--ink-soft\)\]/)
    expect(label.getAttribute("data-variant")).toBe("eyebrow")
  })

  it("preserves source text casing (a11y: CSS handles display uppercase)", () => {
    // The component MUST receive natural-case strings; screen readers benefit.
    render(<Label variant="eyebrow">Connexion · Espace équipe</Label>)
    expect(screen.getByText("Connexion · Espace équipe")).toBeInTheDocument()
  })

  it("supports className composition", () => {
    render(<Label variant="eyebrow" className="mb-1.5">x</Label>)
    expect(screen.getByText("x").className).toMatch(/mb-1\.5/)
  })

  it("labelVariants() returns class strings for both variants", () => {
    expect(labelVariants({ variant: "default" })).toBeTruthy()
    expect(labelVariants({ variant: "eyebrow" })).toBeTruthy()
  })
})
