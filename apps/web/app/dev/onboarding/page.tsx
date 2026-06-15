/**
 * Slice 3 — Onboarding dev preview.
 *
 * Two surfaces :
 *   1. `OnboardingProgress` stepper rendu à chacun des 4 états — visuel
 *      pur, pas besoin d'auth.
 *   2. Le vrai `<OnboardingWizard />` monté tel quel — la chrome + le
 *      premier step (BUSINESS_INFO par défaut) s'affichent. Les
 *      submissions backend échouent sans auth, mais le visuel est
 *      vérifiable.
 *
 * Not linked from any nav. Production guard via NODE_ENV (notFound).
 */

"use client"

import { notFound } from "next/navigation"
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress"
import { OnboardingWizard } from "@/components/onboarding/OnboardingWizard"
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
      <div className="mx-auto max-w-5xl space-y-16 px-6">
        {/* HEADER */}
        <header className="space-y-2">
          <p className="font-eyebrow">Dev · Slice 3 onboarding</p>
          <h1 className="font-display text-3xl font-bold tracking-tight text-[var(--ink-900)]">
            Onboarding — preview
          </h1>
          <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
            Le wizard complet rendu sans auth (les submissions backend
            n'aboutissent pas) + le stepper aux 4 états.
          </p>
        </header>

        {/* SECTION A — Full wizard rendered live */}
        <section className="space-y-4">
          <div>
            <p className="font-eyebrow">A · Wizard complet (live)</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              `&lt;OnboardingWizard /&gt;`
            </h2>
            <p className="mt-1 text-xs text-[var(--ink-soft)]">
              Sans session active : démarre toujours sur BUSINESS_INFO. Les
              boutons « Continuer » nécessitent un user authentifié — ils
              échouent silencieusement ici, mais les form fields rendent
              correctement.
            </p>
          </div>
          <div className="overflow-hidden rounded-2xl border border-dashed border-[var(--ink-300)] bg-[var(--paper-warm)]">
            <OnboardingWizard />
          </div>
        </section>

        {/* SECTION B — Stepper at 4 states */}
        <section className="space-y-4">
          <div>
            <p className="font-eyebrow">B · Stepper aux 4 états</p>
            <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
              `OnboardingProgress`
            </h2>
          </div>
          <div className="space-y-6">
            {stepKeys.map((current) => (
              <div
                key={current}
                className="space-y-4 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6 sm:p-8"
              >
                <p className="font-eyebrow">
                  current = {current.replace(/_/g, " ").toLowerCase()}
                </p>
                <OnboardingProgress
                  steps={ONBOARDING_STEPS}
                  currentStepKey={current}
                  onStepClick={() => {}}
                />
              </div>
            ))}
          </div>
        </section>

        {/* FOOTER */}
        <footer className="border-t border-[var(--ink-200)] pt-6">
          <p className="font-eyebrow">
            Slice 3 · feat/redesign-web · {new Date().toISOString().slice(0, 10)}
          </p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Spec : .context/design-extraction-web.md §5 stepper, §7 onboarding flow
          </p>
        </footer>
      </div>
    </main>
  )
}
