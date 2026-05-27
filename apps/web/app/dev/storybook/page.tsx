/**
 * /dev/storybook — Catalog index of all v2 components, screens & marketing
 * pages, accessible without auth for visual QA.
 *
 * Dev-only entry point. Not linked from any nav. Production guard via
 * NODE_ENV (returns notFound in production builds).
 *
 * Sections :
 *   A. Tokens (palette + typography quick reference)
 *   B. v2 Primitives (Button / Input / Label / Alert / OAuth / PageShell /
 *      PasswordInput / PasswordStrength) — inline render
 *   C. Onboarding stepper (4 states) — inline render
 *   D. Auth pages — iframes (public routes, no auth needed)
 *   E. Marketing pages — iframes grouped by category
 *   F. App-gated surfaces — notes + outbound links (require auth)
 */

"use client"

import { notFound } from "next/navigation"
import Link from "next/link"
import { useState } from "react"
import {
  AlertCircle,
  CheckCircle2,
  ExternalLink,
  Info,
  TriangleAlert,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OAuthButton } from "@/components/ui/oauth-button"
import { PageShellAuth } from "@/components/ui/page-shell-auth"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { OnboardingProgress } from "@/components/onboarding/OnboardingProgress"
import { ONBOARDING_STEPS, type OnboardingStepKey } from "@/lib/onboarding/steps"

// ============================================================================
// Catalog data
// ============================================================================

const AUTH_ROUTES = [
  { path: "/auth/sign-in", label: "Sign-in" },
  { path: "/auth/sign-up", label: "Sign-up" },
  { path: "/auth/forgot-password", label: "Forgot password" },
  { path: "/auth/reset-password?email=demo%40jokko.test&code=000000", label: "Reset password" },
] as const

const MARKETING_GROUPS: { label: string; routes: { path: string; label: string }[] }[] = [
  {
    label: "Core",
    routes: [
      { path: "/", label: "Landing" },
      { path: "/tarifs", label: "Tarifs" },
      { path: "/fonctionnalites", label: "Fonctionnalités" },
      { path: "/contact", label: "Contact" },
    ],
  },
  {
    label: "Company",
    routes: [
      { path: "/about", label: "About" },
      { path: "/careers", label: "Careers" },
      { path: "/press", label: "Press" },
      { path: "/roadmap", label: "Roadmap" },
      { path: "/changelog", label: "Changelog" },
    ],
  },
  {
    label: "Resources",
    routes: [
      { path: "/blog", label: "Blog" },
      { path: "/guides", label: "Guides" },
      { path: "/docs", label: "Docs" },
      { path: "/docs/api", label: "Docs · API" },
    ],
  },
  {
    label: "Legal",
    routes: [
      { path: "/legal", label: "Legal" },
      { path: "/privacy", label: "Privacy" },
      { path: "/terms", label: "Terms" },
      { path: "/dpa", label: "DPA" },
    ],
  },
]

const APP_GATED = [
  {
    path: "/dashboard",
    label: "Dashboard",
    note: "Requires authenticated session + completed onboarding.",
  },
  {
    path: "/onboarding",
    label: "Onboarding wizard",
    note: "Requires authenticated session. Stepper component is previewable inline in this page.",
  },
]

const TOKENS = [
  { name: "paper-white", cssVar: "--paper-white", hint: "#FFFFFF", invert: false },
  { name: "paper-warm", cssVar: "--paper-warm", hint: "≈ #FBF9F5", invert: false },
  { name: "ink-900", cssVar: "--ink-900", hint: "≈ #161614", invert: true },
  { name: "ink-soft", cssVar: "--ink-soft", hint: "≈ #6E6E6E", invert: true },
  { name: "ink-200", cssVar: "--ink-200", hint: "border", invert: false },
  { name: "accent", cssVar: "--accent", hint: "#693BEF", invert: true },
  { name: "accent-hover", cssVar: "--accent-hover", hint: "darker", invert: true },
  { name: "accent-soft", cssVar: "--accent-soft", hint: "lilac", invert: false },
  { name: "accent-hot-pink", cssVar: "--accent-hot-pink", hint: "≈ #FF60B4", invert: true },
  { name: "status-good", cssVar: "--status-good", hint: "≈ #138A4E", invert: true },
  { name: "status-warn", cssVar: "--status-warn", hint: "≈ #E0A100", invert: true },
  { name: "status-danger", cssVar: "--status-danger", hint: "≈ #D93025", invert: true },
] as const

const TOC = [
  { id: "tokens", label: "Tokens" },
  { id: "typography", label: "Typography" },
  { id: "primitives", label: "v2 Primitives" },
  { id: "onboarding", label: "Onboarding" },
  { id: "auth", label: "Auth pages" },
  { id: "marketing", label: "Marketing pages" },
  { id: "app-gated", label: "App-gated surfaces" },
]

// ============================================================================
// Component
// ============================================================================

export default function StorybookPage() {
  if (process.env.NODE_ENV === "production") notFound()

  const onboardingSteps: OnboardingStepKey[] = [
    "BUSINESS_INFO",
    "PLAN_SELECT",
    "WHATSAPP_CONNECT",
    "COMPLETED",
  ]

  return (
    <main className="min-h-screen bg-[var(--paper-warm)] text-[var(--ink-900)]">
      <div className="mx-auto grid max-w-[1280px] grid-cols-1 gap-10 px-6 py-12 lg:grid-cols-[200px_1fr] lg:gap-12">
        {/* Sticky TOC sidebar (lg+) */}
        <nav className="hidden lg:block">
          <div className="sticky top-12 space-y-2">
            <p className="font-eyebrow">Dev · Storybook</p>
            <h2 className="font-display text-lg font-semibold tracking-tight">
              Sections
            </h2>
            <ul className="mt-4 space-y-1.5 text-sm">
              {TOC.map((s) => (
                <li key={s.id}>
                  <a
                    href={`#${s.id}`}
                    className="text-[var(--ink-soft)] underline-offset-4 hover:text-[var(--accent)] hover:underline"
                  >
                    {s.label}
                  </a>
                </li>
              ))}
            </ul>
            <div className="mt-6 space-y-1.5 border-t border-[var(--ink-200)] pt-4 text-xs">
              <p className="font-eyebrow">Quick links</p>
              <ul className="mt-2 space-y-1">
                <li>
                  <Link
                    href="/dev/components"
                    className="text-[var(--ink-soft)] hover:text-[var(--accent)]"
                  >
                    /dev/components
                  </Link>
                </li>
                <li>
                  <Link
                    href="/dev/onboarding"
                    className="text-[var(--ink-soft)] hover:text-[var(--accent)]"
                  >
                    /dev/onboarding
                  </Link>
                </li>
              </ul>
            </div>
          </div>
        </nav>

        {/* Content */}
        <div className="space-y-20">
          <header className="space-y-2">
            <p className="font-eyebrow">Dev · Storybook</p>
            <h1 className="font-display text-4xl font-bold tracking-tight">
              Jokko UI catalog
            </h1>
            <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
              Index visuel des composants v2, écrans d'auth et pages marketing.
              Dev-only ({" "}
              <code className="font-mono text-[11px]">notFound()</code> en
              production). Pages embarquées via iframes ; les surfaces app-gated
              demandent un login.
            </p>
          </header>

          {/* A — Tokens */}
          <Section id="tokens" eyebrow="A · palette" title="Tokens">
            <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
              {TOKENS.map((t) => (
                <Swatch key={t.name} {...t} />
              ))}
            </div>
          </Section>

          {/* B — Typography */}
          <Section id="typography" eyebrow="B · text" title="Typography">
            <div className="space-y-3 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6">
              <p className="font-eyebrow">.font-eyebrow · mono uppercase</p>
              <h3 className="font-display text-2xl font-bold tracking-tight">
                .font-display · Geist Sans bold
              </h3>
              <p className="font-editorial text-xl">
                .font-editorial · Geist Sans italic
              </p>
              <p className="text-sm leading-relaxed">
                Body · Geist Sans regular — Le quotidien de l'inbox.
              </p>
              <p className="font-mono text-xs text-[var(--ink-soft)]">
                Geist Mono · code · `⌘K` · 03 / 17
              </p>
            </div>
          </Section>

          {/* C — Primitives */}
          <Section id="primitives" eyebrow="C · components" title="v2 Primitives">
            <div className="space-y-8">
              <Subsection title="Button variants">
                <div className="flex flex-wrap items-center gap-3">
                  <Button variant="default">Default (legacy)</Button>
                  <Button variant="accent">Accent</Button>
                  <Button variant="accent" size="xl">
                    Accent · xl
                  </Button>
                  <Button variant="destructive">Destructive</Button>
                  <Button variant="outline">Outline</Button>
                  <Button variant="secondary">Secondary</Button>
                  <Button variant="ghost">Ghost</Button>
                  <Button variant="link">Link</Button>
                  <Button variant="mono-link">Mot de passe oublié ?</Button>
                </div>
              </Subsection>

              <Subsection title="Input + Label (default & eyebrow)">
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <Label htmlFor="sb-email">E-mail professionnel</Label>
                    <Input
                      id="sb-email"
                      type="email"
                      placeholder="vous@entreprise.com"
                      className="mt-1.5"
                    />
                  </div>
                  <div>
                    <Label variant="eyebrow" htmlFor="sb-mp">
                      Connexion · Espace équipe
                    </Label>
                    <Input
                      id="sb-mp"
                      type="email"
                      placeholder="vous@entreprise.com"
                      className="mt-1.5"
                    />
                  </div>
                </div>
              </Subsection>

              <Subsection title="PasswordInput + PasswordStrength">
                <PasswordStrengthDemo />
              </Subsection>

              <Subsection title="Alert cream enum">
                <div className="grid gap-3 sm:grid-cols-2">
                  <Alert variant="error-cream">
                    <AlertCircle />
                    <AlertTitle>Email ou mot de passe incorrect</AlertTitle>
                    <AlertDescription>
                      Vérifiez vos identifiants ou réinitialisez votre mot de
                      passe.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="success-cream">
                    <CheckCircle2 />
                    <AlertTitle>Modèle approuvé</AlertTitle>
                    <AlertDescription>
                      Votre modèle WhatsApp peut maintenant être envoyé.
                    </AlertDescription>
                  </Alert>
                  <Alert variant="warn-cream">
                    <TriangleAlert />
                    <AlertTitle>Connexion lente</AlertTitle>
                    <AlertDescription>Mode allégé activé.</AlertDescription>
                  </Alert>
                  <Alert variant="info-cream">
                    <Info />
                    <AlertTitle>Astuce</AlertTitle>
                    <AlertDescription>
                      Tapez « / » dans le composer pour ouvrir les raccourcis.
                    </AlertDescription>
                  </Alert>
                </div>
              </Subsection>

              <Subsection title="OAuthButton (Google only)">
                <div className="max-w-md space-y-3">
                  <OAuthButton provider="google" />
                  <OAuthButton provider="google" loading />
                  <OAuthButton provider="google" disabled />
                </div>
              </Subsection>

              <Subsection title="PageShellAuth (loud + soft)">
                <div className="grid gap-6 lg:grid-cols-2">
                  <FrameShell label="intensity=loud (auth default)">
                    <PageShellAuth>
                      <PageShellAuth.Card width="sm">
                        <p className="font-eyebrow">Connexion</p>
                        <h4 className="mt-2 font-display text-xl font-bold">
                          Ravi de vous revoir.
                        </h4>
                        <Button
                          variant="accent"
                          size="lg"
                          className="mt-4 w-full"
                        >
                          Accéder à mon espace
                        </Button>
                      </PageShellAuth.Card>
                    </PageShellAuth>
                  </FrameShell>
                  <FrameShell label="intensity=soft (auxiliary)">
                    <PageShellAuth intensity="soft">
                      <PageShellAuth.Card width="sm">
                        <p className="font-eyebrow">Récupération</p>
                        <h4 className="mt-2 font-display text-xl font-bold">
                          On vous renvoie ça.
                        </h4>
                        <Button
                          variant="accent"
                          size="lg"
                          className="mt-4 w-full"
                        >
                          Envoyer le lien
                        </Button>
                      </PageShellAuth.Card>
                    </PageShellAuth>
                  </FrameShell>
                </div>
              </Subsection>
            </div>
          </Section>

          {/* D — Onboarding */}
          <Section id="onboarding" eyebrow="D · onboarding" title="Stepper (4 states)">
            <div className="space-y-6">
              {onboardingSteps.map((current) => (
                <div
                  key={current}
                  className="space-y-3 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6"
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
            <p className="mt-4 text-xs text-[var(--ink-soft)]">
              Le wizard complet `/onboarding` demande un user authentifié et
              redirige vers /auth/sign-in en mode public — voir la section
              app-gated.
            </p>
          </Section>

          {/* E — Auth pages */}
          <Section
            id="auth"
            eyebrow="E · auth pages"
            title="Auth pages (routes publiques)"
          >
            <div className="grid gap-6 lg:grid-cols-2">
              {AUTH_ROUTES.map((r) => (
                <PageFrame key={r.path} {...r} />
              ))}
            </div>
          </Section>

          {/* F — Marketing pages */}
          <Section
            id="marketing"
            eyebrow="F · marketing pages"
            title="Marketing pages"
          >
            <div className="space-y-8">
              {MARKETING_GROUPS.map((group) => (
                <div key={group.label} className="space-y-3">
                  <p className="font-eyebrow">{group.label}</p>
                  <div className="grid gap-6 lg:grid-cols-2">
                    {group.routes.map((r) => (
                      <PageFrame key={r.path} {...r} />
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          {/* G — App-gated surfaces */}
          <Section
            id="app-gated"
            eyebrow="G · app-gated"
            title="App-gated surfaces"
          >
            <div className="grid gap-3 sm:grid-cols-2">
              {APP_GATED.map((r) => (
                <div
                  key={r.path}
                  className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5"
                >
                  <div className="flex items-center justify-between">
                    <p className="font-display font-semibold">{r.label}</p>
                    <Link
                      href={r.path}
                      className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline"
                    >
                      Open <ExternalLink className="h-3 w-3" aria-hidden />
                    </Link>
                  </div>
                  <p className="mt-1 text-xs text-[var(--ink-soft)]">
                    {r.note}
                  </p>
                  <code className="mt-2 block font-mono text-[10px] text-[var(--ink-500)]">
                    {r.path}
                  </code>
                </div>
              ))}
            </div>
          </Section>

          <footer className="border-t border-[var(--ink-200)] pt-6">
            <p className="font-eyebrow">
              feat/redesign-web · {new Date().toISOString().slice(0, 10)}
            </p>
            <p className="mt-2 text-xs text-[var(--ink-soft)]">
              Spec : .context/design-extraction-{"{"}web,mobile{"}"}.md
            </p>
          </footer>
        </div>
      </div>
    </main>
  )
}

// ============================================================================
// Building blocks
// ============================================================================

function Section({
  id,
  eyebrow,
  title,
  children,
}: {
  id: string
  eyebrow: string
  title: string
  children: React.ReactNode
}) {
  return (
    <section id={id} className="scroll-mt-12 space-y-4">
      <div>
        <p className="font-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-2xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Subsection({
  title,
  children,
}: {
  title: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-3 rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6">
      <p className="font-eyebrow">{title}</p>
      {children}
    </div>
  )
}

function Swatch({
  name,
  cssVar,
  hint,
  invert,
}: {
  name: string
  cssVar: string
  hint: string
  invert: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-16 w-full rounded-lg border border-[var(--ink-200)] ${invert ? "text-white" : "text-[var(--ink-900)]"}`}
        style={{ background: `var(${cssVar})` }}
      />
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
        {name}
      </p>
      <p className="font-mono text-[10px] text-[var(--ink-soft)]">{hint}</p>
    </div>
  )
}

function FrameShell({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="space-y-2">
      <p className="font-eyebrow">{label}</p>
      <div className="relative h-[360px] overflow-hidden rounded-xl border border-[var(--ink-200)]">
        <div className="absolute inset-0">{children}</div>
      </div>
    </div>
  )
}

function PageFrame({ path, label }: { path: string; label: string }) {
  return (
    <details
      className="group rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)]"
      open
    >
      <summary className="flex cursor-pointer items-center justify-between gap-2 p-4">
        <div className="flex items-center gap-2.5">
          <span className="font-display font-semibold text-[var(--ink-900)]">
            {label}
          </span>
          <code className="font-mono text-[10px] text-[var(--ink-soft)]">
            {path}
          </code>
        </div>
        <Link
          href={path}
          target="_blank"
          rel="noopener"
          className="inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-wider text-[var(--accent)] hover:underline"
          onClick={(e) => e.stopPropagation()}
        >
          Open <ExternalLink className="h-3 w-3" aria-hidden />
        </Link>
      </summary>
      <div className="border-t border-[var(--ink-200)] bg-[var(--paper-warm)] p-2">
        <iframe
          src={path}
          title={`Preview · ${label}`}
          loading="lazy"
          className="h-[520px] w-full rounded-lg border border-[var(--ink-200)] bg-white"
        />
      </div>
    </details>
  )
}

function PasswordStrengthDemo() {
  const [pw, setPw] = useState("")
  return (
    <div className="space-y-3">
      <PasswordInput
        placeholder="Tapez un mot de passe"
        value={pw}
        onChange={(e) => setPw(e.target.value)}
      />
      <PasswordStrength password={pw} />
      {pw.length === 0 ? (
        <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
          Try : abc — Abc123 — Abcdefghij1
        </p>
      ) : null}
    </div>
  )
}
