/**
 * Slice 0 — Components dev page.
 *
 * Visual smoke surface for the foundations layer. Browse to /dev/components
 * to verify tokens, button/label/alert variants, page shell, and oauth button
 * render correctly. Not linked from any nav — dev-only entry point.
 */

import { notFound } from "next/navigation"
import { AlertCircle, CheckCircle2, Info, TriangleAlert } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { OAuthButton } from "@/components/ui/oauth-button"

export const dynamic = "force-static"

export default function DevComponentsPage() {
  // Hide entirely in production builds (Vercel envs etc.). Keeps the surface
  // available for `pnpm dev` while never shipping to users.
  if (process.env.NODE_ENV === "production") notFound()

  return (
    <main className="min-h-screen bg-[var(--paper-warm)] py-12">
      <div className="mx-auto max-w-5xl space-y-16 px-6">
        <header className="space-y-3">
          <p className="font-eyebrow">Dev · Slice 0 foundations</p>
          <h1 className="font-display text-4xl font-bold tracking-tight text-[var(--ink-900)]">
            Cobalt × paper × ink — v2 primitives
          </h1>
          <p className="max-w-2xl text-sm text-[var(--ink-soft)]">
            Surface visuelle pour valider tokens, variants et nouveaux
            composants. Non liée à la nav, dev-only. Browse-test ce que les
            slices suivants vont consommer.
          </p>
        </header>

        <Section title="Color tokens" eyebrow="A · palette">
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 md:grid-cols-6">
            <Swatch token="paper-white" cssVar="--paper-white" hex="#FFFFFF" />
            <Swatch token="paper-warm" cssVar="--paper-warm" hex="#FBF9F5" />
            <Swatch token="ink-900" cssVar="--ink-900" hex="≈ #161614" textInverse />
            <Swatch token="ink-soft" cssVar="--ink-soft" hex="≈ #6E6E6E" textInverse />
            <Swatch token="accent" cssVar="--accent" hex="#693BEF" textInverse />
            <Swatch token="accent-hover" cssVar="--accent-hover" hex="darker" textInverse />
            <Swatch token="accent-soft" cssVar="--accent-soft" hex="≈ #EFE8FB" />
            <Swatch token="accent-hot-pink" cssVar="--accent-hot-pink" hex="≈ #FF60B4" textInverse />
            <Swatch token="status-good" cssVar="--status-good" hex="≈ #138A4E" textInverse />
            <Swatch token="status-warn" cssVar="--status-warn" hex="≈ #E0A100" textInverse />
            <Swatch token="status-danger" cssVar="--status-danger" hex="≈ #D93025" textInverse />
            <Swatch token="status-moment" cssVar="--status-moment" hex="≈ #D6E04A" />
          </div>
        </Section>

        <Section title="Typography" eyebrow="B · text">
          <div className="space-y-4">
            <div>
              <p className="font-eyebrow">.font-eyebrow · mono uppercase tracker</p>
              <h2 className="font-display text-3xl font-bold tracking-tight">
                .font-display · Geist Sans bold
              </h2>
              <p className="font-editorial text-2xl">
                .font-editorial · Geist Sans italic (rare editorial moments)
              </p>
              <p className="text-sm">
                Body · Geist Sans regular — Vous reprendrez là où vous vous étiez arrêté.
              </p>
              <p className="font-mono text-xs text-[var(--ink-soft)]">
                Geist Mono · code, kbd, page indices "03 / 17", `⌘K`
              </p>
            </div>
          </div>
        </Section>

        <Section title="Button variants" eyebrow="C · button.tsx">
          <div className="flex flex-wrap items-center gap-3">
            <Button variant="default">Default (legacy)</Button>
            <Button variant="accent">Accent (v2 primary)</Button>
            <Button variant="accent" size="xl">Accent · xl</Button>
            <Button variant="destructive">Destructive</Button>
            <Button variant="outline">Outline</Button>
            <Button variant="secondary">Secondary</Button>
            <Button variant="ghost">Ghost</Button>
            <Button variant="link">Link</Button>
            <Button variant="mono-link">Mot de passe oublié ?</Button>
          </div>
        </Section>

        <Section title="Label variants" eyebrow="D · label.tsx">
          <div className="space-y-4">
            <div>
              <Label htmlFor="demo-input-1">Email professionnel</Label>
              <Input id="demo-input-1" className="mt-1.5" placeholder="vous@entreprise.com" type="email" />
            </div>
            <div>
              <Label variant="eyebrow" htmlFor="demo-input-2">
                Connexion · Espace équipe
              </Label>
              <Input id="demo-input-2" className="mt-1.5" placeholder="••••••••" type="password" />
            </div>
          </div>
        </Section>

        <Section title="Alert cream enum" eyebrow="E · alert.tsx">
          <div className="grid gap-3 sm:grid-cols-2">
            <Alert variant="error-cream">
              <AlertCircle />
              <AlertTitle>Email ou mot de passe incorrect</AlertTitle>
              <AlertDescription>
                Vérifiez vos identifiants ou réinitialisez votre mot de passe.
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
              <AlertTitle>Connexion lente détectée</AlertTitle>
              <AlertDescription>
                Mode allégé activé. Forcer la qualité complète ?
              </AlertDescription>
            </Alert>
            <Alert variant="info-cream">
              <Info />
              <AlertTitle>Astuce</AlertTitle>
              <AlertDescription>
                Tapez « / » dans le composer pour ouvrir les raccourcis.
              </AlertDescription>
            </Alert>
          </div>
        </Section>

        <Section title="OAuth button (Google only)" eyebrow="F · oauth-button.tsx">
          <div className="max-w-md space-y-3">
            <OAuthButton provider="google" />
            <OAuthButton provider="google" loading />
            <OAuthButton provider="google" disabled />
          </div>
        </Section>

        <footer className="border-t border-[var(--ink-200)] pt-6">
          <p className="font-eyebrow">
            Slice 0 · feat/redesign-web · {new Date().toISOString().slice(0, 10)}
          </p>
          <p className="mt-2 text-xs text-[var(--ink-soft)]">
            Specs : .context/design-extraction-web.md + design-extraction-mobile.md
          </p>
        </footer>
      </div>
    </main>
  )
}

function Section({
  title,
  eyebrow,
  children,
}: {
  title: string
  eyebrow: string
  children: React.ReactNode
}) {
  return (
    <section className="space-y-4">
      <div>
        <p className="font-eyebrow">{eyebrow}</p>
        <h2 className="mt-1 font-display text-xl font-semibold tracking-tight">
          {title}
        </h2>
      </div>
      {children}
    </section>
  )
}

function Swatch({
  token,
  cssVar,
  hex,
  textInverse,
}: {
  token: string
  cssVar: string
  hex: string
  textInverse?: boolean
}) {
  return (
    <div className="space-y-1.5">
      <div
        className={`h-20 w-full rounded-lg border border-[var(--ink-200)] ${textInverse ? "text-white" : "text-[var(--ink-900)]"}`}
        style={{ background: `var(${cssVar})` }}
      />
      <p className="font-mono text-[10px] uppercase tracking-wider text-[var(--ink-soft)]">
        {token}
      </p>
      <p className="font-mono text-[10px] text-[var(--ink-soft)]">{hex}</p>
    </div>
  )
}

