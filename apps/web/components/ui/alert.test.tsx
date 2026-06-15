import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { Alert, AlertDescription, AlertTitle, alertVariants } from "./alert"

describe("Alert — v2 cream variants", () => {
  it("renders default variant (legacy back-compat)", () => {
    render(<Alert>Default</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert.className).toMatch(/bg-card/)
  })

  it("renders error-cream variant with danger color recipe", () => {
    render(
      <Alert variant="error-cream">
        <AlertTitle>Erreur</AlertTitle>
        <AlertDescription>Email ou mot de passe incorrect.</AlertDescription>
      </Alert>
    )
    const alert = screen.getByRole("alert")
    expect(alert.className).toMatch(/text-\[var\(--status-danger\)\]/)
    expect(alert.className).toMatch(/bg-\[var\(--status-danger-soft\)\]/)
    expect(screen.getByText("Erreur")).toBeInTheDocument()
  })

  it("exposes the complete cream enum (error / success / warn / info)", () => {
    const variants = [
      "error-cream",
      "success-cream",
      "warn-cream",
      "info-cream",
    ] as const
    for (const v of variants) {
      const classes = alertVariants({ variant: v })
      expect(classes).toBeTruthy()
      expect(classes.length).toBeGreaterThan(0)
    }
  })

  it("preserves destructive variant for back-compat", () => {
    render(<Alert variant="destructive">Destructive legacy</Alert>)
    const alert = screen.getByRole("alert")
    expect(alert.className).toMatch(/text-destructive/)
  })

  it("AlertTitle and AlertDescription render as grid children", () => {
    render(
      <Alert>
        <AlertTitle>T</AlertTitle>
        <AlertDescription>D</AlertDescription>
      </Alert>
    )
    expect(screen.getByText("T").className).toMatch(/col-start-2/)
    expect(screen.getByText("D").className).toMatch(/col-start-2/)
  })
})
