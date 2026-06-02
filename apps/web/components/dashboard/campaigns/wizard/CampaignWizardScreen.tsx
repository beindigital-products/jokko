"use client"

import { useState } from "react"
import { ChevronLeft, ChevronRight, Send } from "lucide-react"

import { Button } from "@/components/ui/button"
import { PageHeader } from "../../shell/PageHeader"
import { WizardStepper } from "./WizardStepper"
import { StepName } from "./StepName"
import { StepTemplate } from "./StepTemplate"
import { StepAudience } from "./StepAudience"
import { StepVariables } from "./StepVariables"
import { StepSend } from "./StepSend"
import { StepReview } from "./StepReview"
import { CAMPAIGN_STEPS, type CampaignWizardData, type WizardStepId } from "./types"

interface CampaignWizardScreenProps {
    data: CampaignWizardData
    /** Start the wizard on a given step (Storybook / deep-link). */
    initialStep?: WizardStepId
}

/**
 * CampaignWizardScreen — v3 full-page campaign-creation flow:
 * Nom → Modèle → Audience → Variables → Envoi → Récap. Composes the stepper,
 * the active step panel and a sticky action footer. Recreates the design's
 * `CampaignWizard` as a page. Presentational shell (step navigation only).
 */
export function CampaignWizardScreen({ data, initialStep = 1 }: CampaignWizardScreenProps) {
    const [step, setStep] = useState<WizardStepId>(initialStep)

    const go = (n: number) => {
        const clamped = Math.min(6, Math.max(1, n)) as WizardStepId
        setStep(clamped)
    }

    const isLast = step === 6
    const stepLabel = CAMPAIGN_STEPS.find((s) => s.id === step)?.label

    return (
        <div className="flex h-full w-full flex-col overflow-hidden bg-[var(--paper-white)]">
            <PageHeader
                eyebrow="Campagnes · nouvelle diffusion"
                title="Nouvelle campagne"
                description="Composez votre diffusion étape par étape : modèle, audience, variables, planification."
                actions={
                    <span className="font-mono text-[11px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        Étape {step} / 6 · {stepLabel}
                    </span>
                }
            />

            <WizardStepper current={step} onStepClick={(id) => setStep(id)} />

            <div className="flex-1 overflow-y-auto bg-[var(--paper-warm)]/30">
                {step === 1 ? <StepName data={data} /> : null}
                {step === 2 ? <StepTemplate data={data} /> : null}
                {step === 3 ? <StepAudience data={data} /> : null}
                {step === 4 ? <StepVariables data={data} /> : null}
                {step === 5 ? <StepSend data={data} /> : null}
                {step === 6 ? <StepReview data={data} /> : null}
            </div>

            {/* Footer */}
            <div className="flex shrink-0 items-center justify-between gap-3 border-t border-[var(--ink-200)] bg-[var(--paper-warm)] px-8 py-3.5">
                <Button variant="ghost">Sauvegarder en brouillon</Button>
                <div className="flex items-center gap-2">
                    {step > 1 ? (
                        <Button variant="outline" onClick={() => go(step - 1)}>
                            <ChevronLeft className="h-4 w-4" />
                            Précédent
                        </Button>
                    ) : null}
                    {isLast ? (
                        <Button>
                            <Send className="h-4 w-4" />
                            {data.draft.schedule === "now"
                                ? "Envoyer maintenant"
                                : `Planifier · ${data.draft.scheduleLabel}`}
                        </Button>
                    ) : (
                        <Button onClick={() => go(step + 1)}>
                            Suivant
                            <ChevronRight className="h-4 w-4" />
                        </Button>
                    )}
                </div>
            </div>
        </div>
    )
}
