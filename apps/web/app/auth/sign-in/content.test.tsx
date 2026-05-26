import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, fireEvent, waitFor } from "@testing-library/react"

// --- Mocks ---
const signInMock = vi.fn()
const mockSearchParams = new URLSearchParams()

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: signInMock }),
}))

vi.mock("next/navigation", () => ({
  useSearchParams: () => ({
    get: (key: string) => mockSearchParams.get(key),
  }),
}))

vi.mock("@sentry/nextjs", () => ({
  addBreadcrumb: vi.fn(),
  captureMessage: vi.fn(),
  captureException: vi.fn(),
}))

// Stub window.location.assign for jsdom
const assignMock = vi.fn()
beforeEach(() => {
  signInMock.mockReset()
  assignMock.mockReset()
  mockSearchParams.delete("redirect")
  mockSearchParams.delete("error")
  Object.defineProperty(window, "location", {
    configurable: true,
    value: { ...window.location, assign: assignMock },
  })
})

// Dynamic import after mocks
async function renderSignIn() {
  const { default: SignInContent } = await import("./content")
  return render(<SignInContent />)
}

describe("SignInContent — Slice 1", () => {
  it("renders the editorial heading and eyebrow", async () => {
    await renderSignIn()
    expect(screen.getByText("Bon retour.")).toBeInTheDocument()
    expect(screen.getByText("Connexion · Espace équipe")).toBeInTheDocument()
  })

  it("renders email + password fields + submit + forgot link", async () => {
    await renderSignIn()
    expect(screen.getByLabelText("E-mail professionnel")).toBeInTheDocument()
    expect(screen.getByLabelText("Mot de passe")).toBeInTheDocument()
    expect(screen.getByTestId("sign-in-submit")).toHaveTextContent(
      "Accéder à mon espace"
    )
    expect(screen.getByRole("link", { name: /Oublié/ })).toHaveAttribute(
      "href",
      "/auth/forgot-password"
    )
  })

  it("renders the trust footer (RGPD · UE · TLS 1.3)", async () => {
    await renderSignIn()
    expect(screen.getByText("RGPD")).toBeInTheDocument()
    expect(screen.getByText("Hébergement UE")).toBeInTheDocument()
    expect(screen.getByText("TLS 1.3")).toBeInTheDocument()
  })

  it("submits the form and redirects to /dashboard on success", async () => {
    signInMock.mockResolvedValueOnce(undefined)
    await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "ada@jokko.test" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "Hunter2Hunter2!" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      expect(signInMock).toHaveBeenCalledTimes(1)
      expect(signInMock).toHaveBeenCalledWith("password", expect.any(FormData))
    })
    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/dashboard")
    })
  })

  it("honors ?redirect= via safeRedirect (safe path)", async () => {
    mockSearchParams.set("redirect", "/dashboard/conversations/abc")
    signInMock.mockResolvedValueOnce(undefined)
    await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "x@x.com" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "Hunter2Hunter2!" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/dashboard/conversations/abc")
    })
  })

  it("rejects open-redirect attempts via safeRedirect", async () => {
    mockSearchParams.set("redirect", "//evil.com/steal")
    signInMock.mockResolvedValueOnce(undefined)
    await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "x@x.com" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "Hunter2Hunter2!" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      expect(assignMock).toHaveBeenCalledWith("/dashboard") // fallback
    })
  })

  it("locks the generic error message — both InvalidAccountId and InvalidPassword show identical copy", async () => {
    // First failure : InvalidPassword shape
    signInMock.mockRejectedValueOnce(new Error("InvalidPassword"))
    const { unmount } = await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "exists@x.com" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "wrong" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      expect(
        screen.getByText("Email ou mot de passe incorrect.")
      ).toBeInTheDocument()
    })
    unmount()

    // Second failure : InvalidAccountId shape — same copy
    signInMock.mockRejectedValueOnce(new Error("InvalidAccountId"))
    await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "nobody@x.com" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "anything" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      expect(
        screen.getByText("Email ou mot de passe incorrect.")
      ).toBeInTheDocument()
    })
  })

  it("shows OAuth error from ?error= param", async () => {
    mockSearchParams.set("error", "oauth_failed")
    await renderSignIn()
    expect(
      screen.getByText("Connexion échouée. Veuillez réessayer.")
    ).toBeInTheDocument()
  })

  it("disables submit + shows spinner during loading", async () => {
    signInMock.mockImplementation(
      () => new Promise(() => {}) // never resolves
    )
    await renderSignIn()

    fireEvent.change(screen.getByLabelText("E-mail professionnel"), {
      target: { value: "x@x.com" },
    })
    fireEvent.change(screen.getByLabelText("Mot de passe"), {
      target: { value: "Hunter2Hunter2!" },
    })
    fireEvent.click(screen.getByTestId("sign-in-submit"))

    await waitFor(() => {
      const btn = screen.getByTestId("sign-in-submit") as HTMLButtonElement
      expect(btn).toBeDisabled()
      expect(btn).toHaveTextContent("Connexion…")
    })
  })

  it("does NOT render an OAuth Google button (deferred to Slice 1b)", async () => {
    await renderSignIn()
    expect(screen.queryByText(/Continuer avec Google/)).not.toBeInTheDocument()
  })
})
