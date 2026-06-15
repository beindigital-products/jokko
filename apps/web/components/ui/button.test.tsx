import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Button, buttonVariants } from "./button"

describe("Button — v2 variants", () => {
  it("renders default variant (legacy back-compat)", () => {
    render(<Button>Save</Button>)
    const btn = screen.getByRole("button", { name: "Save" })
    expect(btn).toBeInTheDocument()
    expect(btn.className).toMatch(/bg-primary/)
  })

  it("renders accent variant with violet styling", () => {
    render(<Button variant="accent">Accent</Button>)
    const btn = screen.getByRole("button", { name: "Accent" })
    expect(btn.className).toMatch(/bg-\[var\(--accent\)\]/)
    expect(btn.className).toMatch(/hover:bg-\[var\(--accent-hover\)\]/)
  })

  it("renders mono-link variant with uppercase mono styling", () => {
    render(<Button variant="mono-link">Forgot password</Button>)
    const btn = screen.getByRole("button", { name: "Forgot password" })
    expect(btn.className).toMatch(/font-mono/)
    expect(btn.className).toMatch(/uppercase/)
    expect(btn.className).toMatch(/tracking-\[0\.15em\]/)
  })

  it("supports size xl for tall CTAs", () => {
    render(<Button size="xl">Tall</Button>)
    const btn = screen.getByRole("button", { name: "Tall" })
    expect(btn.className).toMatch(/h-12/)
  })

  it("preserves legacy variants (destructive, outline, secondary, ghost, link)", () => {
    const variants = ["destructive", "outline", "secondary", "ghost", "link"] as const
    for (const v of variants) {
      const classes = buttonVariants({ variant: v })
      expect(classes).toBeTruthy()
    }
  })

  it("buttonVariants() returns a non-empty string for all v2 variants", () => {
    const v2 = ["accent", "mono-link"] as const
    for (const v of v2) {
      const classes = buttonVariants({ variant: v })
      expect(classes.length).toBeGreaterThan(0)
    }
  })

  it("composes additional className with cn()", () => {
    render(<Button className="custom-extra">X</Button>)
    const btn = screen.getByRole("button")
    expect(btn.className).toMatch(/custom-extra/)
  })
})
