/**
 * Slice 3 — Onboarding stepper dev preview.
 *
 * Renders `OnboardingProgress` at each of the 4 step states (current set
 * to BUSINESS_INFO / PLAN_SELECT / WHATSAPP_CONNECT / COMPLETED) so the
 * v2 stepper visual (numbered squircle / completed circles / outlined
 * future) can be QA'd in the browser without needing an authenticated
 * onboarding session.
 *
 * Not linked from any nav. Production guard via NODE_ENV.
 */

"use client"

import { notFound } from "next/navigation"
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress"
import { ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/onboarding/steps"

export default function DevOnboardingPreviewPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const stepKeys: OnboardingStepKey[] = [
    "BUSINESS_INFO",
    "PLAN_SELECT",
    "WHATSAPP_CONNECT",
    "COMPLETED",
  ]

  return (
    <main className="min-h-screen bg-[var(--paper-warm)] py-12">
      <div className="mx-auto max-w-5xl space-y-12 px-6">
        <header className="space-y-2">
          <p className="font-eyebrow">Dev · Slice 3 onboarding</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink-900)]">
            Onboarding stepper — preview
          </h1>
          <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
            Le composant `OnboardingProgress` rendu à chacun des 4 états
            courants — visuellement vérifié sans avoir besoin d'une session
            authentifiée.
          </p>
        </header>

        {stepKeys.map((current) => (
          <section
            key={current}
            className="space-y-4 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6 sm:p-8"
          >
            <p className="font-eyebrow">current = {current.replace(/_/g, " ").toLowerCase()}</p>
            <OnboardingProgress
              steps={ONBOARDING_STEPS}
              currentStepKey={current}
              onStepClick={() => {}}
            />
          </section>
        ))}
      </div>
    </main>
  )
}
