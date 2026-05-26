"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthActions } from "@convex-dev/auth/react"
import * as Sentry from "@sentry/nextjs"
import {
  AlertCircle,
  ArrowRight,
  CheckCircle2,
  Loader2,
  ShieldCheck,
} from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageShellAuth } from "@/components/ui/page-shell-auth"
import { PasswordInput } from "@/components/ui/password-input"
import { PasswordStrength } from "@/components/ui/password-strength"
import { evaluatePassword } from "@/lib/password-policy"

/**
 * Sign-up — Slice 2 of feat/redesign-web.
 *
 * Differences from Slice 1 sign-in (intentional, per multi-agent review B2) :
 *   - **Granular error messages** (duplicate email vs weak password vs generic).
 *     Sign-up is conversion-critical, AND email enumeration is already
 *     discoverable via the sign-in form — granular errors here add zero net
 *     security risk while materially lifting conversion.
 *   - **Redirect always to `/onboarding`** (not `/dashboard`). Dashboard
 *     layout would bounce a fresh user back to `/onboarding` anyway — direct
 *     redirect kills the flicker.
 *   - **Ignores `?redirect=`** : sign-up is a fresh entry, not a protected
 *     route return.
 *   - **RGPD consent required** : explicit checkbox, `acceptedTermsAt`
 *     timestamp persisted via `convex/auth.ts` Password `profile()` callback.
 *   - **Submit gated client-side** : button disabled until password passes all
 *     4 policy criteria AND terms accepted AND honeypot empty.
 *   - **Honeypot field** : cheap abuse-protection (hidden `company_url` field).
 *
 * TODO (security-hardening slice) : add Convex-side rate limiting per IP
 * + per hashed email. The honeypot blocks naive bots ; sophisticated abuse
 * needs server-side throttling.
 *
 * OAuth Google/Apple intentionally deferred to Slice 1b pending
 * @convex-dev/auth account-linking investigation.
 */
export default function SignUpContent() {
  const { signIn } = useAuthActions()
  const [password, setPassword] = React.useState("")
  const [confirmPassword, setConfirmPassword] = React.useState("")
  const [termsAccepted, setTermsAccepted] = React.useState(false)
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<React.ReactNode | null>(null)

  const passwordEvaluation = React.useMemo(
    () => evaluatePassword(password),
    [password]
  )
  const confirmMatch = confirmPassword.length === 0 || password === confirmPassword
  const canSubmit =
    !loading &&
    passwordEvaluation.isValid &&
    confirmPassword.length > 0 &&
    confirmMatch &&
    termsAccepted

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)

    const formData = new FormData(e.currentTarget)

    // Honeypot — abort silently if filled (naive bots).
    const honeypot = (formData.get("company_url") as string | null) ?? ""
    if (honeypot.length > 0) {
      Sentry.captureMessage("sign-up honeypot triggered", {
        level: "warning",
        tags: { feature: "auth", flow: "sign-up", abuse: "honeypot" },
      })
      // Silent success-shape — don't leak that we detected the bot.
      setLoading(true)
      setTimeout(() => setLoading(false), 1500)
      return
    }
    formData.delete("company_url")

    // Belt-and-suspenders — client-side policy + match before submit.
    if (!passwordEvaluation.isValid) {
      setError(
        "Le mot de passe ne respecte pas les critères de sécurité ci-dessus."
      )
      return
    }
    if (password !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }
    if (!termsAccepted) {
      setError("Veuillez accepter les CGU et la politique de confidentialité.")
      return
    }

    setLoading(true)
    formData.delete("confirmPassword")
    formData.set("flow", "signUp")
    formData.set("acceptedTermsAt", String(Date.now()))

    Sentry.addBreadcrumb({
      category: "auth",
      type: "user",
      level: "info",
      message: "sign-up attempt",
    })

    try {
      await signIn("password", formData)
      // Direct to /onboarding (per multi-agent review B3) — avoids the
      // /dashboard skeleton-flash → bounce-to-/onboarding chain.
      window.location.assign("/onboarding")
    } catch (err) {
      const message = err instanceof Error ? err.message : ""
      // Granular error families (per multi-agent review B2).
      if (
        /already exists|already registered|InvalidAccountId|duplicate/i.test(
          message
        )
      ) {
        setError(
          <>
            Un espace existe déjà avec cet e-mail.{" "}
            <Link
              href="/auth/sign-in"
              className="font-semibold underline-offset-4 hover:underline"
            >
              Connectez-vous
            </Link>
            .
          </>
        )
      } else if (/Le mot de passe doit contenir/i.test(message)) {
        // Pass through the backend message — already user-actionable.
        setError(message)
      } else {
        setError(
          "Inscription impossible. Vérifiez vos informations et réessayez."
        )
      }
      Sentry.captureMessage("sign-up failed", {
        level: "warning",
        tags: { feature: "auth", flow: "sign-up" },
      })
      if (process.env.NODE_ENV !== "production") {
        console.error("Sign up error:", err)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <PageShellAuth>
      <PageShellAuth.Card width="md">
        <div className="flex flex-col items-stretch gap-7">
          {/* Logo */}
          <div className="flex items-center gap-2.5">
            <span
              aria-hidden
              className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-[var(--accent)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]"
            >
              J
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
              Jokko
            </span>
          </div>

          {/* Heading */}
          <div>
            <Label variant="eyebrow" asChild>
              <p>Nouvel espace · 14 jours offerts</p>
            </Label>
            <h1 className="mt-3 font-editorial text-4xl tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Votre inbox équipe.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
              Essai gratuit 14 jours. Aucune carte bancaire.
            </p>
          </div>

          {error ? (
            <Alert variant="error-cream" role="alert">
              <AlertCircle />
              <AlertTitle>Inscription impossible</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            {/* Honeypot — visually hidden, off tab order, decoy "company URL"
                field that real users never fill. */}
            <div
              aria-hidden
              style={{
                position: "absolute",
                left: "-9999px",
                width: "1px",
                height: "1px",
                overflow: "hidden",
              }}
            >
              <Label htmlFor="company_url">Site web (ne pas remplir)</Label>
              <input
                id="company_url"
                name="company_url"
                type="text"
                tabIndex={-1}
                autoComplete="off"
                defaultValue=""
              />
            </div>

            <div>
              <Label variant="eyebrow" htmlFor="name">
                Votre nom complet
              </Label>
              <Input
                id="name"
                name="name"
                type="text"
                autoComplete="name"
                placeholder="Aminata Diouf"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label variant="eyebrow" htmlFor="email">
                E-mail professionnel
              </Label>
              <Input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.com"
                required
                className="mt-1.5"
              />
            </div>

            <div>
              <Label variant="eyebrow" htmlFor="password">
                Mot de passe
              </Label>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="new-password"
                placeholder="10 caractères minimum"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                aria-invalid={password.length > 0 && !passwordEvaluation.isValid ? true : undefined}
                className="mt-1.5"
              />
              {password.length > 0 ? (
                <div className="mt-2.5">
                  <PasswordStrength password={password} />
                </div>
              ) : null}
            </div>

            <div>
              <Label variant="eyebrow" htmlFor="confirmPassword">
                Confirmation
              </Label>
              <PasswordInput
                id="confirmPassword"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••••"
                required
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                aria-invalid={confirmPassword.length > 0 && !confirmMatch ? true : undefined}
                className="mt-1.5"
              />
              {confirmPassword.length > 0 && !confirmMatch ? (
                <p className="mt-1.5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--status-danger)]">
                  Les mots de passe ne correspondent pas
                </p>
              ) : null}
            </div>

            {/* RGPD consent — required per multi-agent review B4 */}
            <label
              htmlFor="acceptedTerms"
              className="flex cursor-pointer items-start gap-2.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-warm)] p-3 text-xs leading-relaxed text-[var(--ink-700)] transition-colors hover:border-[var(--ink-300)]"
            >
              <input
                id="acceptedTerms"
                type="checkbox"
                checked={termsAccepted}
                onChange={(e) => setTermsAccepted(e.target.checked)}
                className="mt-0.5 h-4 w-4 shrink-0 rounded border-[var(--ink-300)] text-[var(--accent)] focus:ring-2 focus:ring-[var(--accent-ring)]"
                required
              />
              <span>
                J'accepte les{" "}
                <Link
                  href="/terms"
                  target="_blank"
                  className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  CGU
                </Link>{" "}
                et la{" "}
                <Link
                  href="/privacy"
                  target="_blank"
                  className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                >
                  politique de confidentialité
                </Link>
                . Je consens au traitement de mes données conformément au RGPD.
              </span>
            </label>

            <Button
              type="submit"
              variant="accent"
              size="xl"
              disabled={!canSubmit}
              className="mt-2 w-full"
              data-testid="sign-up-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Création de l'espace…
                </>
              ) : (
                <>
                  Créer mon espace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          {/* Cross-link to sign-in */}
          <p className="text-center text-sm text-[var(--ink-500)]">
            Vous avez déjà un espace ?{" "}
            <Link
              href="/auth/sign-in"
              className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Se connecter →
            </Link>
          </p>

          {/* Trust footer — mono single line */}
          <div className="flex items-center justify-center gap-2.5 border-t border-[var(--ink-200)] pt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-500)]">
            <span className="flex items-center gap-1.5">
              <CheckCircle2 className="h-3 w-3" aria-hidden />
              14 jours offerts
            </span>
            <span aria-hidden className="size-1 rounded-full bg-[var(--ink-300)]" />
            <span>Sans CB</span>
            <span aria-hidden className="size-1 rounded-full bg-[var(--ink-300)]" />
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              RGPD
            </span>
          </div>
        </div>
      </PageShellAuth.Card>
    </PageShellAuth>
  )
}
