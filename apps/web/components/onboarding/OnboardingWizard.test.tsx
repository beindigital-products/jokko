import { describe, expect, it, vi, beforeEach } from "vitest"
import { render, screen, waitFor } from "@testing-library/react"

// --- Mocks ---
const mockSessionData = vi.fn()

vi.mock("convex/react", async () => ({
  useQuery: () => mockSessionData(),
  useMutation: () => vi.fn(),
}))

vi.mock("@convex-dev/auth/react", () => ({
  useAuthActions: () => ({ signIn: vi.fn(), signOut: vi.fn() }),
}))

// Stub step components — we only test the wizard's routing logic here.
vi.mock("./steps/BusinessInfoStep", () => ({
  BusinessInfoStep: () => <div data-testid="step-business-info">BusinessInfo</div>,
}))
vi.mock("./steps/PlanSelectStep", () => ({
  PlanSelectStep: () => <div data-testid="step-plan-select">PlanSelect</div>,
}))
vi.mock("./steps/WhatsAppConnectStep", () => ({
  WhatsAppConnectStep: () => <div data-testid="step-whatsapp">WhatsApp</div>,
}))
vi.mock("./steps/CompletionStep", () => ({
  CompletionStep: () => <div data-testid="step-completion">Completion</div>,
}))

beforeEach(() => {
  mockSessionData.mockReset()
})

async function renderWizard() {
  const { OnboardingWizard } = await import("./OnboardingWizard")
  return render(<OnboardingWizard />)
}

describe("OnboardingWizard — v2 resume logic", () => {
  it("starts at BUSINESS_INFO when session has no organization yet", async () => {
    mockSessionData.mockReturnValue({ organization: null })
    await renderWizard()
    expect(screen.getByTestId("step-business-info")).toBeInTheDocument()
  })

  it("starts at BUSINESS_INFO when session is still loading (undefined)", async () => {
    mockSessionData.mockReturnValue(undefined)
    await renderWizard()
    expect(screen.getByTestId("step-business-info")).toBeInTheDocument()
  })

  it("resumes at PLAN_SELECT when org.onboardingStep=PLAN_SELECT", async () => {
    mockSessionData.mockReturnValue({
      organization: { _id: "org_1", onboardingStep: "PLAN_SELECT" },
    })
    await renderWizard()
    await waitFor(() => {
      expect(screen.getByTestId("step-plan-select")).toBeInTheDocument()
    })
  })

  it("resumes at WHATSAPP_CONNECT when org.onboardingStep=WHATSAPP_CONNECT", async () => {
    mockSessionData.mockReturnValue({
      organization: { _id: "org_1", onboardingStep: "WHATSAPP_CONNECT" },
    })
    await renderWizard()
    await waitFor(() => {
      expect(screen.getByTestId("step-whatsapp")).toBeInTheDocument()
    })
  })

  it("does NOT resume at COMPLETED (terminal step — would be a bug)", async () => {
    mockSessionData.mockReturnValue({
      organization: { _id: "org_1", onboardingStep: "COMPLETED" },
    })
    await renderWizard()
    // Falls back to BUSINESS_INFO (the (onboarding)/layout.tsx separately
    // redirects to /dashboard if the user is truly completed)
    expect(screen.getByTestId("step-business-info")).toBeInTheDocument()
  })

  it("ignores unknown onboardingStep values gracefully", async () => {
    mockSessionData.mockReturnValue({
      organization: { _id: "org_1", onboardingStep: "MIGRATED_LEGACY" },
    })
    await renderWizard()
    expect(screen.getByTestId("step-business-info")).toBeInTheDocument()
  })

  it("renders the OnboardingProgress stepper", async () => {
    mockSessionData.mockReturnValue({ organization: null })
    await renderWizard()
    // 4 buttons = 4 steps
    const buttons = screen.getAllByRole("button")
    expect(buttons.length).toBeGreaterThanOrEqual(4)
  })

  it("renders the current step's title + description", async () => {
    mockSessionData.mockReturnValue({ organization: null })
    await renderWizard()
    // "Informations Business" appears twice (in stepper label + in h1) — assert ≥ 1
    expect(screen.getAllByText("Informations Business").length).toBeGreaterThanOrEqual(1)
    expect(screen.getByText("Configurez votre profil entreprise")).toBeInTheDocument()
  })
})
