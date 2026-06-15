import { describe, expect, it } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { PasswordInput } from "./password-input"

describe("PasswordInput — v2", () => {
  it("renders as password type by default", () => {
    render(<PasswordInput data-testid="pw" defaultValue="hunter2" />)
    const input = screen.getByTestId("pw") as HTMLInputElement
    expect(input.type).toBe("password")
  })

  it("toggles to text when eye button is clicked", () => {
    render(<PasswordInput data-testid="pw" />)
    const input = screen.getByTestId("pw") as HTMLInputElement
    const toggle = screen.getByLabelText("Afficher le mot de passe")
    fireEvent.click(toggle)
    expect(input.type).toBe("text")
    expect(screen.getByLabelText("Masquer le mot de passe")).toBeInTheDocument()
  })

  it("uses paper-warm bg + accent ring on focus", () => {
    render(<PasswordInput data-testid="pw" />)
    const input = screen.getByTestId("pw")
    expect(input.className).toMatch(/bg-\[var\(--paper-warm\)\]/)
    expect(input.className).toMatch(/focus:bg-\[var\(--paper-white\)\]/)
    expect(input.className).toMatch(/focus:border-\[var\(--accent\)\]/)
    expect(input.className).toMatch(/focus-visible:ring-\[var\(--accent-ring\)\]/)
  })

  it("shows red border when aria-invalid", () => {
    render(<PasswordInput data-testid="pw" aria-invalid="true" />)
    const input = screen.getByTestId("pw")
    expect(input.className).toMatch(/aria-invalid:border-\[var\(--status-danger\)\]/)
    expect(input.getAttribute("aria-invalid")).toBe("true")
  })

  it("forwards arbitrary props (name, autoComplete, required)", () => {
    render(
      <PasswordInput
        data-testid="pw"
        name="password"
        autoComplete="current-password"
        required
      />
    )
    const input = screen.getByTestId("pw") as HTMLInputElement
    expect(input.name).toBe("password")
    expect(input.autocomplete).toBe("current-password")
    expect(input.required).toBe(true)
  })

  it("eye toggle is tabIndex=-1 (skip tab order)", () => {
    render(<PasswordInput data-testid="pw" />)
    const toggle = screen.getByLabelText("Afficher le mot de passe")
    expect(toggle.getAttribute("tabindex")).toBe("-1")
  })

  it("adds left-padding when leftIcon provided", () => {
    render(
      <PasswordInput data-testid="pw" leftIcon={<span data-testid="icon">i</span>} />
    )
    expect(screen.getByTestId("icon")).toBeInTheDocument()
    expect(screen.getByTestId("pw").className).toMatch(/pl-11/)
  })
})
