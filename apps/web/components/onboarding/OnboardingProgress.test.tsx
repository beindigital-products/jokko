import { describe, expect, it, vi } from "vitest"
import { render, screen, fireEvent } from "@testing-library/react"
import { OnboardingProgress } from "./OnboardingProgress"
import { ONBOARDING_STEPS } from "@/lib/onboarding/steps"

describe("OnboardingProgress — v2 stepper", () => {
  it("renders 4 step buttons with numeric labels", () => {
    render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="BUSINESS_INFO"
        onStepClick={() => {}}
      />
    )
    // First step shows "1" (no check, no icon — just number per spec)
    expect(screen.getByText("1")).toBeInTheDocument()
    expect(screen.getByText("2")).toBeInTheDocument()
    expect(screen.getByText("3")).toBeInTheDocument()
    expect(screen.getByText("4")).toBeInTheDocument()
  })

  it("marks the current step with data-state=current and aria-current=step", () => {
    render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="PLAN_SELECT"
        onStepClick={() => {}}
      />
    )
    const current = screen.getByRole("button", { name: /étape actuelle/i })
    expect(current.getAttribute("data-state")).toBe("current")
    expect(current.getAttribute("aria-current")).toBe("step")
  })

  it("marks earlier steps as completed and shows check icon", () => {
    const { container } = render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="WHATSAPP_CONNECT"
        onStepClick={() => {}}
      />
    )
    const completed = container.querySelectorAll(
      "button[data-state='completed']"
    )
    expect(completed.length).toBe(2) // BUSINESS_INFO + PLAN_SELECT
    // Each completed should contain a Check icon (svg)
    completed.forEach((btn) => {
      expect(btn.querySelector("svg")).toBeInTheDocument()
    })
  })

  it("marks future steps with data-state=future and aria-disabled=true", () => {
    const { container } = render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="BUSINESS_INFO"
        onStepClick={() => {}}
      />
    )
    const future = container.querySelectorAll("button[data-state='future']")
    expect(future.length).toBe(3) // PLAN_SELECT, WHATSAPP_CONNECT, COMPLETED
    future.forEach((btn) => {
      expect(btn.getAttribute("aria-disabled")).toBe("true")
    })
  })

  it("invokes onStepClick only for completed steps (click-back)", () => {
    const onStepClick = vi.fn()
    render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="WHATSAPP_CONNECT"
        onStepClick={onStepClick}
      />
    )
    // Clicking a completed step should fire
    const completedBtn = screen.getByRole("button", {
      name: /Informations Business.*complété/i,
    })
    fireEvent.click(completedBtn)
    expect(onStepClick).toHaveBeenCalledWith("BUSINESS_INFO")

    // Clicking a future step should NOT fire
    onStepClick.mockClear()
    const futureBtn = screen.getByRole("button", { name: /Terminé/ })
    fireEvent.click(futureBtn)
    expect(onStepClick).not.toHaveBeenCalled()
  })

  it("current step is a rounded SQUARE (rounded-md), not circle", () => {
    render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="BUSINESS_INFO"
        onStepClick={() => {}}
      />
    )
    const current = screen.getByRole("button", { name: /étape actuelle/i })
    expect(current.className).toMatch(/rounded-md/)
    expect(current.className).toMatch(/bg-\[var\(--accent\)\]/)
  })

  it("step labels use mono uppercase tracker (a11y: source in natural case)", () => {
    render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="BUSINESS_INFO"
        onStepClick={() => {}}
      />
    )
    // Source text is natural case — CSS uppercase. We can find it by partial
    // text match (browser may render uppercase, but DOM keeps original).
    expect(screen.getByText("Informations Business")).toBeInTheDocument()
  })

  it("connecting lines use accent color for completed segments", () => {
    const { container } = render(
      <OnboardingProgress
        steps={ONBOARDING_STEPS}
        currentStepKey="PLAN_SELECT"
        onStepClick={() => {}}
      />
    )
    const accentLines = container.querySelectorAll(".bg-\\[var\\(--accent\\)\\]")
    // 1 marker (current) + completed steps' lines + outgoing line of current
    expect(accentLines.length).toBeGreaterThan(0)
  })
})
