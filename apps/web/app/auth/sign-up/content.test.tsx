import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// --- Mocks ---
const signInMock = vi.fn()

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: signInMock }),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({ get: () => null }),
}))

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}))

const assignMock = vi.fn()
beforeEach(() => {
  signInMock.mockReset()
  assignMock.mockReset()
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, assign: assignMock },
  })
})

async function renderSignUp() {
  const { default: SignUpContent } = await import("./content")
  return render(<SignUpContent />)
}

const STRONG_PASSWORD = "AbcdefghI1"

function fillValidForm() {
  fireEvent.change(screen.getByLabelText("Votre nom complet"), {
    target: { value: "Ada Lovelace" },
  })
  fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
    target: { value: "ada@jokko.test" },
  })
  fireEvent.change(screen.getByLabelText("Mot de passe"), {
    target: { value: STRONG_PASSWORD },
  })
  fireEvent.change(screen.getByLabelText("Confirmation"), {
    target: { value: STRONG_PASSWORD },
  })
  fireEvent.click(
    screen.getByRole("checkbox", { name: /CGU/ })
  )
}

describe("SignUpContent — Slice 2", () => {
  it("renders headline, fields and trust footer", async () => {
    await renderSignUp()
    expect(screen.getByText("Votre inbox équipe.")).toBeInTheDocument()
    // "14 jours" appears in both the eyebrow ("Nouvel espace · 14 jours offerts")
    // and the trust footer ("14 jours offerts") — assert at least one.
    expect(screen.getAllByText(/14 jours/).length).toBeGreaterThanOrEqual(1)
    expect(screen.getByLabelText("Votre nom complet")).toBeInTheDocument()
    expect(screen.getByLabelText("E-mail professionnel")).toBeInTheDocument()
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument()
    expect(screen.getByLabelText("Confirmation")).toBeInTheDocument()
    expect(screen.getByText("Sans CB")).toBeInTheDocument()
  })

  it("submit button is disabled until policy + terms + match all pass", async () => {
    await renderSignUp()
    const submit = screen.getByTestId("sign-up-submit") as HTMLButtonElement
    expect(submit).toBeDisabled() // empty form

    // password weak only
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "abc" },
    })
    expect(submit).toBeDisabled()

    // strong password, no confirm yet
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: STRONG_PASSWORD },
    })
    expect(submit).toBeDisabled()

    // confirm matches, terms not accepted yet
    fireEvent.change(screen.getByLabelText("Confirmation"), {
      target: { value: STRONG_PASSWORD },
    })
    expect(submit).toBeDisabled()

    // accept terms
    fireEvent.click(screen.getByRole("checkbox", { name: /CGU/ }))
    expect(submit).not.toBeDisabled()
  })

  it("submits form and redirects to /onboarding (not /dashboard)", async () => {
    signInMock.mockResolvedValueOnce(undefined)
    await renderSignUp()
    fillValidForm()
    fireEvent.click(screen.getByTestId("sign-up-submit"))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledTimes(1)
      const [provider, payload] = signInMock.mock.calls[0]
      expect(provider).toBe("password")
      expect(payload).toBeInstanceOf(FormData)
      const fd = payload as FormData
      expect(fd.get("flow")).toBe("signUp")
      // confirmPassword must be stripped before submission
      expect(fd.get("confirmPassword")).toBeNull()
      // acceptedTermsAt timestamp must be present (RGPD)
      const terms = fd.get("acceptedTermsAt")
      expect(terms).toBeTruthy()
      expect(Number(terms)).toBeGreaterThan(0)
      // honeypot must be stripped
      expect(fd.get("company_url")).toBeNull()
    })
    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/onboarding")
    })
  })

  it("shows duplicate-email error with sign-in link", async () => {
    signInMock.mockRejectedValueOnce(new Error("account already exists"))
    await renderSignUp()
    fillValidForm()
    fireEvent.click(screen.getByTestId("sign-up-submit"))

    await waitFor(() => {
      expect(
        screen.getByText(/Un espace existe déjà avec cet e-mail/)
      ).toBeInTheDocument()
      expect(
        screen.getByRole("link", { name: /Connectez-vous/ })
      ).toHaveAttribute("href", "/auth/sign-in")
    })
  })

  it("shows backend password message when policy violation comes from server", async () => {
    signInMock.mockRejectedValueOnce(
      new Error("Le mot de passe doit contenir au moins 10 caractères.")
    )
    await renderSignUp()
    fillValidForm()
    fireEvent.click(screen.getByTestId("sign-up-submit"))

    await waitFor(() => {
      expect(
        screen.getByText(/Le mot de passe doit contenir au moins 10/)
      ).toBeInTheDocument()
    })
  })

  it("shows generic fallback for unknown errors", async () => {
    signInMock.mockRejectedValueOnce(new Error("ETIMEDOUT or anything else"))
    await renderSignUp()
    fillValidForm()
    fireEvent.click(screen.getByTestId("sign-up-submit"))

    await waitFor(() => {
      expect(
        screen.getByText(
          /Inscription impossible. Vérifiez vos informations/
        )
      ).toBeInTheDocument()
    })
  })

  it("honeypot field aborts silently without calling signIn", async () => {
    await renderSignUp()
    // Fill the valid form first so all gating passes
    fillValidForm()
    // Then fill the honeypot via getByLabelText
    fireEvent.change(screen.getByLabelText(/Site web/), {
      target: { value: "https://spam.example" },
    })
    fireEvent.click(screen.getByTestId("sign-up-submit"))

    // Wait a tick then assert signIn was NOT called
    await new Promise((r) => setTimeout(r, 50))
    expect(signInMock).not.toHaveBeenCalled()
  })

  it("does NOT render an OAuth Google button (deferred Slice 1b)", async () => {
    await renderSignUp()
    expect(screen.queryByText(/Continuer avec Google/)).not.toBeInTheDocument()
  })

  it("strength meter is shown only when password is non-empty", async () => {
    await renderSignUp()
    expect(
      screen.queryByLabelText(/Force du mot de passe/)
    ).not.toBeInTheDocument()
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "abc" },
    })
    expect(
      screen.getByLabelText(/Force du mot de passe/)
    ).toBeInTheDocument()
  })
})
