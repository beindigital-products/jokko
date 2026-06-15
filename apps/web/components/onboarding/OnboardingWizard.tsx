"use client"

import { useEffect, useRef, useState } from "react"
import { AnimatePresence, motion } from "framer-motion"
import { useQuery } from "convex/react"

import { api } from "@/convex/_generated/api"
import { Logo } from "@/components/ui/logo"
import { OnboardingProgress } from "./OnboardingProgress"
import { BusinessInfoStep } from "./steps/BusinessInfoStep"
import { PlanSelectStep } from "./steps/PlanSelectStep"
import { WhatsAppConnectStep } from "./steps/WhatsAppConnectStep"
import { CompletionStep } from "./steps/CompletionStep"
import {
  type OnboardingStepKey,
  ONBOARDING_STEPS,
  getNextStep,
  getStepByKey,
} from "@/lib/onboarding/steps"

const STEP_COMPONENTS: Record<
  OnboardingStepKey,
  React.ComponentType<{ onComplete: () => void }>
> = {
  BUSINESS_INFO: BusinessInfoStep,
  PLAN_SELECT: PlanSelectStep,
  WHATSAPP_CONNECT: WhatsAppConnectStep,
  COMPLETED: CompletionStep,
}

/** v3 — single, uniform card width across all steps. Avoids the visual
 *  jump between BusinessInfo (was max-w-2xl) → WhatsApp (was max-w-xl) etc.
 *  Plan select still fits 3 cards at this width (~240px each). */
const STEP_CARD_WIDTH = "max-w-3xl" as const

/**
 * OnboardingWizard — v2.
 *
 * Changes from v1 :
 *   - Drop the inner Card wrapper ; step content sits directly on a
 *     paper-warm rounded container (border ink-200) — fewer competing layers.
 *   - Resume logic : reads `sessionData.organization?.onboardingStep` and
 *     initializes the wizard at the user's last step (Constraint #5 review).
 *   - Crossfade-only transition (no slide direction, no x-shift) ; kept
 *     `motion.div layout` to smooth width changes between steps and avoid CLS.
 *   - No "page header" added above the wizard ; per-step h1 carries the
 *     message (UA #6 review).
 *
 * Click-back UX preserved : completed steps reachable via the progress
 * stepper. BUSINESS_INFO re-submit is now idempotent server-side
 * (organizations.create patches existing org via session — Constraint #4 fix).
 */
export function OnboardingWizard() {
  const sessionData = useQuery(api.sessions.current)
  const [currentStepKey, setCurrentStepKey] =
    useState<OnboardingStepKey>("BUSINESS_INFO")
  const initialSyncDone = useRef(false)

  // One-shot resume sync : on first arrival of session data, jump to the
  // user's persisted onboardingStep. Subsequent in-app navigation (handleNext,
  // handleStepClick) is authoritative — we don't re-sync from the server on
  // every re-render to avoid yanking the user backwards.
  useEffect(() => {
    if (initialSyncDone.current) return
    if (sessionData === undefined) return // still loading
    const persistedStep = sessionData?.organization?.onboardingStep as
      | OnboardingStepKey
      | undefined
    if (
      persistedStep &&
      STEP_COMPONENTS[persistedStep] &&
      persistedStep !== "COMPLETED"
    ) {
      setCurrentStepKey(persistedStep)
    }
    initialSyncDone.current = true
  }, [sessionData])

  const currentStep = getStepByKey(currentStepKey)
  const StepComponent = STEP_COMPONENTS[currentStepKey]

  const handleNext = () => {
    const nextStep = getNextStep(currentStepKey)
    if (nextStep) {
      setCurrentStepKey(nextStep.key)
    }
  }

  const handleStepClick = (stepKey: string) => {
    const targetStep = getStepByKey(stepKey as OnboardingStepKey)
    const current = getStepByKey(currentStepKey)
    // Only allow jumping BACK to an earlier completed step. Forward jumps
    // would skip required submissions.
    if (targetStep && current && targetStep.order < current.order) {
      setCurrentStepKey(targetStep.key)
    }
  }

  return (
    <div className="w-full px-3 py-6 sm:px-6 sm:py-8 lg:px-10 lg:py-12">
      <div className="mx-auto w-full max-w-5xl">
        {/* v3 — Jokko brand header above the stepper. Static logo (no link)
            so the user doesn't accidentally exit the wizard. */}
        <div className="mb-6 flex justify-center sm:mb-8">
          <Logo noLink width={104} height={32} priority />
        </div>
        <OnboardingProgress
          steps={ONBOARDING_STEPS}
          currentStepKey={currentStepKey}
          onStepClick={handleStepClick}
        />

        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-2xl">
            {currentStep?.title}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">
            {currentStep?.description}
          </p>
        </div>
      </div>

      {/* motion.div layout : keeps height/width transitions smooth (CLS
          mitigation per Constraint #7). AnimatePresence : crossfade only
          (no slide direction) per UA #1 review. */}
      <motion.div
        layout
        transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto w-full ${STEP_CARD_WIDTH}`}
      >
        <div className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5 sm:p-7 lg:p-9">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStepKey}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.18, ease: "easeOut" }}
            >
              <StepComponent onComplete={handleNext} />
            </motion.div>
          </AnimatePresence>
        </div>
      </motion.div>
    </div>
  )
}
