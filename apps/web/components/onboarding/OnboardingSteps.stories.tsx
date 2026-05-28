import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
  ArrowRight,
  Building2,
  Check,
  CheckIcon,
  ChevronDown,
  CreditCard,
  FileText,
  Globe,
  MessageCircle,
  SkipForward,
  Sparkles,
  Store,
  UtensilsCrossed,
  Users,
  Zap,
} from "lucide-react"

import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OnboardingProgress } from "./OnboardingProgress"
import {
  ONBOARDING_STEPS,
  type OnboardingStepKey,
} from "@/lib/onboarding/steps"
import { cn } from "@/lib/utils"

/**
 * Onboarding/Steps — visual catalog of each phase content.
 *
 * The real *Step.tsx components depend on Convex (useQuery/useMutation),
 * the Facebook SDK hook, and Stripe actions — none of which run inside
 * Storybook without heavy mocking. These stories reproduce the pixel
 * layout statically so designers + product can browse what each phase
 * looks like end-to-end. Real interactivity stays in /dev/onboarding.
 */

const inputClass =
  "h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] focus-visible:bg-white focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)] transition-colors"

const selectFakeTriggerClass =
  "flex h-11 w-full items-center justify-between rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-sm text-[var(--ink-900)]"

function StepShell({
  currentStepKey,
  title,
  description,
  maxWidth = "max-w-3xl",
  children,
}: {
  currentStepKey: OnboardingStepKey
  title: string
  description: string
  maxWidth?: string
  children: React.ReactNode
}) {
  return (
    <div className="w-full bg-[var(--paper-warm)] py-10 sm:py-12">
      <div className="mx-auto w-full max-w-5xl px-3 sm:px-6">
        <OnboardingProgress
          steps={ONBOARDING_STEPS}
          currentStepKey={currentStepKey}
          onStepClick={() => {}}
        />
        <div className="mb-6 text-center sm:mb-8">
          <h1 className="font-display text-xl font-semibold tracking-tight text-[var(--ink-900)] sm:text-2xl">
            {title}
          </h1>
          <p className="mt-1.5 text-sm text-[var(--ink-500)]">{description}</p>
        </div>
      </div>
      <div className={cn("mx-auto w-full px-3 sm:px-6", maxWidth)}>
        <div className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5 sm:p-7 lg:p-9">
          {children}
        </div>
      </div>
    </div>
  )
}

// ── 1. Business info ────────────────────────────────────────────────────

function BusinessInfoPreview() {
  return (
    <div className="space-y-5">
      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[var(--ink-700)]">
          Nom de l&apos;entreprise <span className="text-[var(--accent)]">*</span>
        </Label>
        <Input
          className={inputClass}
          placeholder="Ma Super Entreprise"
          defaultValue="Ma Super Entreprise"
        />
        <p className="text-xs text-[var(--ink-500)]">
          Le nom qui sera affiché dans vos messages WhatsApp
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[var(--ink-700)]">
          Identifiant unique (slug) <span className="text-[var(--accent)]">*</span>
        </Label>
        <div className="relative">
          <Input
            className={cn(inputClass, "pr-10")}
            defaultValue="ma-super-entreprise"
          />
          <Globe className="absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-[var(--ink-400)]" />
        </div>
        <div className="mt-2 flex items-center gap-2 rounded-lg border border-[var(--status-good)]/30 bg-[var(--status-good-soft)] px-3 py-2 text-xs text-[var(--status-good)]">
          <CheckIcon className="h-3.5 w-3.5" strokeWidth={2.5} />
          <span className="font-medium">ma-super-entreprise.jokko.com</span>
          <span className="ml-auto font-medium">Disponible</span>
        </div>
        <p className="text-xs text-[var(--ink-500)]">
          Votre URL d&apos;accès au dashboard.
        </p>
      </div>

      <div className="space-y-1.5">
        <Label className="text-sm font-medium text-[var(--ink-700)]">
          Secteur d&apos;activité <span className="text-[var(--accent)]">*</span>
        </Label>
        <div className={selectFakeTriggerClass}>
          <span className="flex items-center gap-2">
            <UtensilsCrossed className="h-4 w-4 text-[var(--ink-500)]" />
            Restaurant / Food Service
          </span>
          <ChevronDown className="h-4 w-4 text-[var(--ink-400)]" />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[var(--ink-700)]">
            Site web
          </Label>
          <Input
            type="url"
            className={inputClass}
            defaultValue="https://www.masuperentreprise.com"
          />
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[var(--ink-700)]">
            Téléphone
          </Label>
          <Input
            type="tel"
            className={inputClass}
            defaultValue="+221 77 123 45 67"
          />
        </div>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[var(--ink-700)]">
            Fuseau horaire
          </Label>
          <div className={selectFakeTriggerClass}>
            <span>(GMT+0) Dakar</span>
            <ChevronDown className="h-4 w-4 text-[var(--ink-400)]" />
          </div>
        </div>
        <div className="space-y-1.5">
          <Label className="text-sm font-medium text-[var(--ink-700)]">
            Langue
          </Label>
          <div className={selectFakeTriggerClass}>
            <span>Français</span>
            <ChevronDown className="h-4 w-4 text-[var(--ink-400)]" />
          </div>
        </div>
      </div>

      <Button
        size="lg"
        className="group h-12 w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] font-semibold text-white shadow-sm transition-all hover:shadow-md"
      >
        Continuer
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </div>
  )
}

// ── 2. Plan select ──────────────────────────────────────────────────────

const MOCK_PLANS = [
  {
    key: "STARTER",
    name: "Starter",
    description: "Pour démarrer",
    priceMonthly: 9900,
    popular: false,
    features: [
      "1 agent",
      "1 canal WhatsApp",
      "500 conversations/mois",
      "Templates illimités",
      "Support email",
    ],
    icon: Zap,
  },
  {
    key: "BUSINESS",
    name: "Business",
    description: "Pour grandir",
    priceMonthly: 29900,
    popular: true,
    features: [
      "5 agents",
      "3 canaux WhatsApp",
      "5 000 conversations/mois",
      "Flows automatisés",
      "Support prioritaire",
    ],
    icon: Store,
  },
  {
    key: "PRO",
    name: "Pro",
    description: "Pour scaler",
    priceMonthly: 79900,
    popular: false,
    features: [
      "Agents illimités",
      "Canaux illimités",
      "Conversations illimitées",
      "API + Webhooks",
      "Account manager dédié",
    ],
    icon: Building2,
  },
] as const

function PlanSelectPreview() {
  const selectedKey = "BUSINESS"
  return (
    <div className="space-y-6">
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-1 rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] p-1">
          <span className="rounded-full bg-white px-4 py-1.5 text-sm font-medium text-[var(--ink-900)] shadow-sm">
            Mensuel
          </span>
          <span className="rounded-full px-4 py-1.5 text-sm font-medium text-[var(--ink-500)]">
            Annuel
            <span className="ml-1.5 text-[10px] font-bold text-[var(--status-good)]">
              -20%
            </span>
          </span>
        </div>
      </div>

      <div className="grid gap-5 md:grid-cols-3 lg:gap-6">
        {MOCK_PLANS.map((plan) => {
          const Icon = plan.icon
          const isSelected = selectedKey === plan.key
          return (
            <div
              key={plan.key}
              className={cn(
                "relative flex flex-col rounded-2xl border bg-white p-6 text-left lg:p-7",
                isSelected
                  ? "border-[var(--accent)] shadow-sm ring-4 ring-[var(--accent-muted)]"
                  : "border-[var(--ink-200)]"
              )}
            >
              {plan.popular ? (
                /* v3 — minimal pill : near-black bg, violet dot, mono caps */
                <span className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1.5 rounded-full bg-[var(--ink-900)] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-white">
                  <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
                  Recommandé
                </span>
              ) : null}

              <div className="mb-5 flex items-center gap-3">
                {/* v3 — ghost icon. Gris par défaut, violet uniquement pour le
                    plan recommandé (Business). */}
                <div
                  className={cn(
                    "flex h-11 w-11 items-center justify-center rounded-xl",
                    plan.popular
                      ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                      : "bg-[var(--paper-warm)] text-[var(--ink-500)]"
                  )}
                >
                  <Icon className="h-5 w-5" strokeWidth={1.75} />
                </div>
                <div className="min-w-0">
                  <h3 className="text-base font-semibold text-[var(--ink-900)]">
                    {plan.name}
                  </h3>
                  <p className="truncate text-xs text-[var(--ink-500)]">
                    {plan.description}
                  </p>
                </div>
              </div>

              <div className="mb-5">
                <span className="text-3xl font-bold tracking-tight text-[var(--ink-900)]">
                  {new Intl.NumberFormat("fr-FR").format(plan.priceMonthly)}
                </span>
                <span className="ml-1 text-sm text-[var(--ink-500)]">
                  F CFA
                </span>
                <div className="mt-0.5 text-xs text-[var(--ink-500)]">
                  par mois
                </div>
              </div>

              <ul className="flex-1 space-y-2.5">
                {plan.features.map((feature) => (
                  <li
                    key={feature}
                    className="flex items-start gap-2 text-sm text-[var(--ink-600)]"
                  >
                    <Check
                      className="mt-0.5 h-4 w-4 shrink-0 text-[var(--accent)]"
                      strokeWidth={2.5}
                    />
                    <span>{feature}</span>
                  </li>
                ))}
              </ul>

              {/* v3 — per-card CTA inside the card (outline / filled selon état) */}
              <div
                className={cn(
                  "mt-6 flex items-center justify-center gap-1.5 rounded-xl py-2.5 text-sm font-semibold",
                  isSelected
                    ? "bg-[var(--accent)] text-white"
                    : "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)]"
                )}
              >
                {isSelected ? (
                  <>
                    <Check className="h-4 w-4" strokeWidth={2.5} />
                    Sélectionné
                  </>
                ) : (
                  `Choisir ${plan.name}`
                )}
              </div>
            </div>
          )
        })}
      </div>

      {/* v3 — CTA seule, pas de plan gratuit */}
      <div className="border-t border-[var(--ink-200)] pt-5 flex justify-end">
        <Button variant="accent" className="group">
          Continuer avec Business
          <ArrowRight className="ml-1.5 h-4 w-4 transition-transform group-hover:translate-x-0.5" />
        </Button>
      </div>
    </div>
  )
}

// ── 3a. WhatsApp connect (initial CTA) ──────────────────────────────────

function WhatsAppInitialPreview() {
  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-[var(--accent-muted)] bg-[var(--accent-muted)]/50 p-6 text-center sm:p-8">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-gradient-to-br from-[#25D366] to-[#128C7E] shadow-sm shadow-[var(--accent-glow)]">
          <MessageCircle className="h-7 w-7 text-white" />
        </div>
        <h3 className="text-base font-semibold text-[var(--ink-900)] sm:text-lg">
          Connexion WhatsApp Business
        </h3>
        <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--ink-600)]">
          Utilisez votre compte Facebook pour connecter votre numéro WhatsApp
          Business en quelques clics.
        </p>
        <Button
          size="lg"
          className="mt-5 h-12 w-full rounded-xl bg-gradient-to-r from-[#25D366] to-[#128C7E] px-6 font-semibold text-white shadow-sm transition-all hover:shadow-md sm:w-auto"
        >
          <svg
            className="mr-2 h-5 w-5 fill-current"
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
          </svg>
          Connecter WhatsApp Business
        </Button>
        <p className="mt-3 text-[11px] text-[var(--ink-500)]">
          Une fenêtre popup va s&apos;ouvrir. Assurez-vous de désactiver votre
          bloqueur de popups.
        </p>
      </div>

      <div className="text-center">
        <button className="inline-flex items-center gap-1.5 py-1 text-sm text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)]">
          <SkipForward className="h-3.5 w-3.5" />
          Passer cette étape — je connecterai WhatsApp plus tard
        </button>
        <p className="mt-1 text-[11px] text-[var(--ink-400)]">
          Vous pourrez connecter WhatsApp depuis Paramètres &gt; Canaux à tout
          moment.
        </p>
      </div>
    </div>
  )
}

// ── 3b. WhatsApp connect (selecting a number) ───────────────────────────

const MOCK_PHONES = [
  {
    id: "p1",
    verified_name: "Ma Super Entreprise",
    display_phone_number: "+221 77 123 45 67",
    quality_rating: "GREEN",
  },
  {
    id: "p2",
    verified_name: "Support Client",
    display_phone_number: "+221 78 987 65 43",
    quality_rating: "YELLOW",
  },
  {
    id: "p3",
    verified_name: "Équipe Ventes",
    display_phone_number: "+33 6 12 34 56 78",
    quality_rating: "GREEN",
  },
]

function qualityColor(rating: string) {
  if (rating === "GREEN")
    return "bg-[var(--status-good-soft)] text-[var(--status-good)] border-[var(--status-good)]/30"
  if (rating === "YELLOW")
    return "bg-[var(--status-warn-soft)] text-[var(--status-warn)] border-[var(--status-warn)]/30"
  if (rating === "RED")
    return "bg-[var(--status-danger-soft)] text-[var(--status-danger)] border-[var(--status-danger)]/30"
  return "bg-[var(--ink-100)] text-[var(--ink-600)] border-[var(--ink-200)]"
}

function WhatsAppSelectingPreview() {
  const selectedId = "p1"
  return (
    <div className="space-y-5">
      <div className="text-center">
        <h3 className="text-base font-semibold text-[var(--ink-900)]">
          Choisissez votre numéro
        </h3>
        <p className="mt-1 text-sm text-[var(--ink-500)]">
          Sélectionnez le numéro WhatsApp Business à connecter à Jokko.
        </p>
      </div>

      <div className="space-y-2">
        {MOCK_PHONES.map((phone) => {
          const isSelected = selectedId === phone.id
          return (
            <div
              key={phone.id}
              className={cn(
                "flex items-center gap-3 rounded-xl border bg-white p-3.5",
                isSelected
                  ? "border-[var(--accent)] shadow-sm ring-4 ring-[var(--accent-muted)]"
                  : "border-[var(--ink-200)]"
              )}
            >
              <div
                className={cn(
                  "flex h-4 w-4 items-center justify-center rounded-full border",
                  isSelected
                    ? "border-[var(--accent)]"
                    : "border-[var(--ink-300)]"
                )}
              >
                {isSelected ? (
                  <span className="h-2 w-2 rounded-full bg-[var(--accent)]" />
                ) : null}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="truncate text-sm font-semibold text-[var(--ink-900)]">
                    {phone.verified_name}
                  </span>
                  <Badge
                    variant="outline"
                    className={cn(
                      "border text-[10px] font-medium",
                      qualityColor(phone.quality_rating)
                    )}
                  >
                    {phone.quality_rating}
                  </Badge>
                </div>
                <span className="mt-0.5 block font-mono text-xs text-[var(--ink-500)]">
                  {phone.display_phone_number}
                </span>
              </div>
            </div>
          )
        })}
      </div>

      <Button
        size="lg"
        className="h-12 w-full rounded-xl bg-gradient-to-r from-[var(--accent)] to-[var(--accent-hover)] font-semibold text-white shadow-sm transition-all hover:shadow-md"
      >
        Confirmer ce numéro
      </Button>

      <button className="w-full py-1 text-center text-sm text-[var(--ink-500)] transition-colors hover:text-[var(--ink-900)]">
        Passer cette étape
      </button>
    </div>
  )
}

// ── 4. Completion ───────────────────────────────────────────────────────

// v3 — secondary actions par PDF (action rows inline, plus de quick cards).
// Landing brand-aligned : icônes lucide sobres, accent violet uniquement.
const SECONDARY_ACTIONS = [
  { title: "Inviter votre équipe", icon: Users, cta: "Inviter" },
  { title: "Créer votre premier modèle", icon: FileText, cta: "Créer" },
] as const

function CompletionPreview() {
  return (
    <div className="space-y-7">
      {/* Eyebrow mono uppercase, signature landing (For teams · 2026 style) */}
      <div className="flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-1 font-mono text-[10px] uppercase tracking-[0.18em] text-[var(--ink-soft)]">
          <span className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
          Espace prêt · onboarding terminé
        </div>
      </div>

      {/* Violet halo check (mirror of production CompletionStep) */}
      <div className="space-y-3 text-center">
        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
          <span className="absolute inset-0 rounded-full bg-[var(--accent-muted)]" aria-hidden />
          <span className="absolute inset-2 rounded-full bg-[var(--paper-white)]" aria-hidden />
          <Check className="relative h-7 w-7 text-[var(--accent)]" strokeWidth={2.5} />
        </div>
        <div>
          <h2 className="font-display text-xl font-bold tracking-tight text-[var(--ink-900)] sm:text-2xl">
            Votre espace est prêt
          </h2>
          <p className="mx-auto mt-1.5 max-w-md text-sm text-[var(--ink-500)]">
            Bienvenue dans Jokko. Vous avez 14 jours d&apos;essai sur le plan
            Business — sans carte bancaire.
          </p>
        </div>
      </div>

      {/* Checklist : icônes check violet, pas de vert. Mono pour les
          identifiants techniques (slug, numéro). */}
      <ul className="space-y-3.5">
        <ChecklistRow title="Compte créé" />
        <ChecklistRow
          title="Organisation configurée"
          subtitle="Mission Impastabowl · mission-impastabowl.jokko.com"
        />
        <ChecklistRow
          title="Plan Business"
          subtitle="Essai gratuit · 14 jours restants"
        />
        <ChecklistRow
          title="Numéro WhatsApp connecté"
          subtitle="+33 1 23 45 67 89 · Support"
        />
      </ul>

      {/* Activation Stripe — landing-style violet gradient block */}
      <div className="space-y-3 rounded-2xl border border-[var(--accent-muted)] bg-gradient-to-br from-[var(--accent-muted)] to-[var(--paper-white)] p-5 text-center">
        <div className="inline-flex items-center gap-2 text-xs font-medium text-[var(--accent)]">
          <Sparkles className="h-3.5 w-3.5" />
          Plan Business
          <span className="text-[var(--ink-500)]">· 29 900 F CFA/mois</span>
        </div>
        <p className="text-sm text-[var(--ink-900)]">
          Activez votre abonnement pour débloquer toutes les fonctionnalités du
          plan <strong>Business</strong>.
        </p>
        <Button variant="accent">
          <CreditCard className="mr-2 h-4 w-4" />
          Activer l&apos;abonnement
        </Button>
        <p className="text-[11px] text-[var(--ink-500)]">
          Vous pouvez aussi activer plus tard depuis Facturation.
        </p>
      </div>

      {/* Secondary actions : inline rows dashed (pas de cartes carrées
          gradients verts) */}
      <ul className="space-y-2">
        {SECONDARY_ACTIONS.map((action) => {
          const Icon = action.icon
          return (
            <li key={action.title} className="flex items-start gap-3">
              <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 border-dashed border-[var(--ink-300)] bg-[var(--paper-white)]">
                <Icon className="h-3 w-3 text-[var(--ink-400)]" strokeWidth={1.75} />
              </span>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-sm font-semibold text-[var(--ink-900)]">
                    {action.title}
                  </span>
                  <span className="inline-flex shrink-0 items-center gap-1 text-sm font-medium text-[var(--accent)]">
                    {action.cta}
                    <ArrowRight className="h-3.5 w-3.5" />
                  </span>
                </div>
              </div>
            </li>
          )
        })}
      </ul>

      {/* Primary CTA "Ouvrir mes conversations" (mirror prod, pas "Inbox") */}
      <Button
        size="lg"
        variant="accent"
        className="group h-12 w-full text-base"
      >
        Ouvrir mes conversations
        <ArrowRight className="ml-2 h-5 w-5 transition-transform group-hover:translate-x-0.5" />
      </Button>
    </div>
  )
}

function ChecklistRow({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <li className="flex items-start gap-3">
      <span className="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--accent)]">
        <Check className="h-3 w-3 text-white" strokeWidth={2.75} />
      </span>
      <div className="min-w-0 flex-1">
        <div className="text-sm font-semibold text-[var(--ink-900)]">{title}</div>
        {subtitle ? (
          <div className="mt-0.5 font-mono text-xs text-[var(--ink-500)] truncate">
            {subtitle}
          </div>
        ) : null}
      </div>
    </li>
  )
}

// ── Stories ─────────────────────────────────────────────────────────────

const meta = {
  title: "Onboarding/Steps",
  parameters: {
    layout: "fullscreen",
    docs: {
      description: {
        component:
          "Visuel statique de chaque phase de l'onboarding (stepper + contenu). Les vraies *Step.tsx dépendent de Convex/Facebook SDK/Stripe — non-rendables en Storybook sans mocking lourd. Pour tester l'interactivité réelle : /dev/onboarding.",
      },
    },
  },
  tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Phase1BusinessInfo: Story = {
  name: "1 · Informations Business",
  render: () => (
    <StepShell
      currentStepKey="BUSINESS_INFO"
      title="Informations Business"
      description="Configurez votre profil entreprise"
    >
      <BusinessInfoPreview />
    </StepShell>
  ),
}

export const Phase2PlanSelect: Story = {
  name: "2 · Choisir un plan",
  render: () => (
    <StepShell
      currentStepKey="PLAN_SELECT"
      title="Choisir un plan"
      description="Sélectionnez le plan adapté à vos besoins"
      maxWidth="max-w-3xl"
    >
      <PlanSelectPreview />
    </StepShell>
  ),
}

export const Phase3aWhatsAppInitial: Story = {
  name: "3a · WhatsApp — CTA initial",
  render: () => (
    <StepShell
      currentStepKey="WHATSAPP_CONNECT"
      title="Connexion WhatsApp"
      description="Connectez votre numéro WhatsApp Business"
      maxWidth="max-w-3xl"
    >
      <WhatsAppInitialPreview />
    </StepShell>
  ),
}

export const Phase3bWhatsAppSelecting: Story = {
  name: "3b · WhatsApp — Choix numéro",
  render: () => (
    <StepShell
      currentStepKey="WHATSAPP_CONNECT"
      title="Connexion WhatsApp"
      description="Connectez votre numéro WhatsApp Business"
      maxWidth="max-w-3xl"
    >
      <WhatsAppSelectingPreview />
    </StepShell>
  ),
}

export const Phase4Completion: Story = {
  name: "4 · Terminé !",
  render: () => (
    <StepShell
      currentStepKey="COMPLETED"
      title="Terminé !"
      description="Votre espace est prêt"
      maxWidth="max-w-3xl"
    >
      <CompletionPreview />
    </StepShell>
  ),
}

export const AllPhasesStacked: Story = {
  name: "Toutes les phases (stacked)",
  render: () => (
    <div className="space-y-10 bg-[var(--paper-warm)]">
      <StepShell
        currentStepKey="BUSINESS_INFO"
        title="Informations Business"
        description="Configurez votre profil entreprise"
      >
        <BusinessInfoPreview />
      </StepShell>
      <StepShell
        currentStepKey="PLAN_SELECT"
        title="Choisir un plan"
        description="Sélectionnez le plan adapté à vos besoins"
        maxWidth="max-w-3xl"
      >
        <PlanSelectPreview />
      </StepShell>
      <StepShell
        currentStepKey="WHATSAPP_CONNECT"
        title="Connexion WhatsApp — CTA initial"
        description="Étape 3 · état 1/2 (avant connexion Facebook)"
        maxWidth="max-w-3xl"
      >
        <WhatsAppInitialPreview />
      </StepShell>
      <StepShell
        currentStepKey="WHATSAPP_CONNECT"
        title="Connexion WhatsApp — Choix du numéro"
        description="Étape 3 · état 2/2 (numéros récupérés via Facebook)"
        maxWidth="max-w-3xl"
      >
        <WhatsAppSelectingPreview />
      </StepShell>
      <StepShell
        currentStepKey="COMPLETED"
        title="Terminé !"
        description="Votre espace est prêt"
        maxWidth="max-w-3xl"
      >
        <CompletionPreview />
      </StepShell>
    </div>
  ),
}
