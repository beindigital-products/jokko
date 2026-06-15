import { describe, expect, it } from "vitest"
import { render, screen } from "@testing-library/react"
import { PasswordStrength } from "./password-strength"

describe("PasswordStrength — v2", () => {
  it("renders nothing on empty input", () => {
    const { container } = render(<PasswordStrength password="" />)
    expect(container.firstChild).toBeNull()
  })

  it("renders bar + label for weak password (1–2 criteria)", () => {
    render(<PasswordStrength password="abc" />)
    expect(screen.getByText("Faible")).toBeInTheDocument()
  })

  it("renders MEDIUM for 3 criteria passed", () => {
    render(<PasswordStrength password="Abc123" />)
    expect(screen.getByText("Moyen")).toBeInTheDocument()
  })

  it("renders FORT only for all 4 criteria passed", () => {
    render(<PasswordStrength password="Abcdefghij1" />)
    expect(screen.getByText("Fort")).toBeInTheDocument()
  })

  it("shows criteria checklist by default with check/x icons", () => {
    render(<PasswordStrength password="Abc123" />)
    expect(screen.getByText("Au moins 10 caractères")).toBeInTheDocument()
    expect(screen.getByText("Une lettre minuscule")).toBeInTheDocument()
    expect(screen.getByText("Une lettre majuscule")).toBeInTheDocument()
    expect(screen.getByText("Un chiffre")).toBeInTheDocument()
  })

  it("hides criteria when showCriteria=false", () => {
    render(<PasswordStrength password="Abc123" showCriteria={false} />)
    expect(screen.queryByText("Au moins 10 caractères")).not.toBeInTheDocument()
  })

  it("does NOT include 'caractère spécial' criterion (matches backend)", () => {
    render(<PasswordStrength password="Abc123" />)
    expect(screen.queryByText(/spécial/i)).not.toBeInTheDocument()
    expect(screen.queryByText(/!@#/)).not.toBeInTheDocument()
  })

  it("shows NIST helper line until strong", () => {
    render(<PasswordStrength password="Abc123" />)
    expect(
      screen.getByText(/long est plus sûr qu'un mot de passe complexe/)
    ).toBeInTheDocument()
  })

  it("hides NIST helper line at strong", () => {
    render(<PasswordStrength password="Abcdefghij1" />)
    expect(
      screen.queryByText(/long est plus sûr qu'un mot de passe complexe/)
    ).not.toBeInTheDocument()
  })

  it("renders 4 bar segments", () => {
    const { container } = render(<PasswordStrength password="abc" />)
    const segments = container.querySelectorAll("[aria-label^='Force'] > div")
    expect(segments).toHaveLength(4)
  })

  it("aria-label announces the strength level", () => {
    render(<PasswordStrength password="Abcdefghij1" />)
    expect(
      screen.getByLabelText(/Force du mot de passe : Fort/)
    ).toBeInTheDocument()
  })
})
