"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import * as Sentry from "@sentry/nextjs"
import { AlertCircle, ArrowLeft, ArrowRight, Loader2 } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageShellAuth } from "@/components/ui/page-shell-auth"
import { PasswordInput } from "@/components/ui/password-input"

/**
 * Reset-password — Slice 1.
 *
 * Lands here from the password-reset email. URL params expected :
 *   - `email` (set by forgot-password redirectTo)
 *   - `code`  (injected by @convex-dev/auth Email provider)
 *
 * User enters new password + confirm, we POST to `signIn("password", ...)`
 * with `flow: "reset-verification"`. On success we redirect to sign-in.
 *
 * Mirrors password complexity rules enforced in `convex/auth.ts`
 * (10 chars min + upper/lower/digit).
 */
export default function ResetPasswordContent() {
  const params = useSearchParams()
  const emailFromUrl = params.get("email") ?? ""
  const codeFromUrl = params.get("code") ?? ""

  const { signIn } = useAuthActions()
  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)
  const [needsManualCode] = React.useState(!codeFromUrl)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setError(null)

    const formData = new FormData(e.currentTarget)
    const email = ((formData.get("email") as string | null) ?? "").trim().toLowerCase()
    const code = ((formData.get("code") as string | null) ?? "").trim()
    const newPassword = (formData.get("newPassword") as string | null) ?? ""
    const confirmPassword = (formData.get("confirmPassword") as string | null) ?? ""

    if (!email || !email.includes("@")) {
      setError("Renseignez l'e-mail du compte.")
      return
    }
    if (code.length < 4) {
      setError("Le code de réinitialisation est incomplet.")
      return
    }
    if (newPassword.length < 10) {
      setError("Le mot de passe doit contenir au moins 10 caractères.")
      return
    }
    if (!/[A-Z]/.test(newPassword) || !/[a-z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      setError("Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.")
      return
    }
    if (newPassword !== confirmPassword) {
      setError("Les mots de passe ne correspondent pas.")
      return
    }

    setLoading(true)
    Sentry.addBreadcrumb({
      category: "auth",
      type: "user",
      level: "info",
      message: "password-reset confirm",
    })

    try {
      const payload = new FormData()
      payload.set("email", email)
      payload.set("code", code)
      payload.set("newPassword", newPassword)
      payload.set("flow", "reset-verification")
      await signIn("password", payload)
      window.location.assign("/auth/sign-in?reset=success")
    } catch (err) {
      setError("Lien expiré ou code invalide. Demandez un nouveau lien.")
      Sentry.captureMessage("password-reset verification failed", {
        level: "warning",
        tags: { feature: "auth", flow: "reset-verification" },
      })
      if (process.env.NODE_ENV !== "production") {
        console.error("Password reset confirm error:", err)
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
              <p>Mot de passe · Nouveau mot de passe</p>
            </Label>
            <h1 className="mt-3 font-editorial text-4xl tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Choisissez un nouveau mot de passe.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
              10 caractères minimum, avec une majuscule, une minuscule et un chiffre.
            </p>
          </div>

          {error ? (
            <Alert variant="error-cream" role="alert">
              <AlertCircle />
              <AlertTitle>Vérification impossible</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
            <div>
              <Label variant="eyebrow" htmlFor="reset-email">
                E-mail du compte
              </Label>
              <Input
                id="reset-email"
                name="email"
                type="email"
                autoComplete="email"
                placeholder="vous@entreprise.com"
                defaultValue={emailFromUrl}
                required
                className="mt-1.5"
                aria-invalid={error ? true : undefined}
              />
            </div>

            {needsManualCode ? (
              <div>
                <Label variant="eyebrow" htmlFor="reset-code">
                  Code reçu par e-mail
                </Label>
                <Input
                  id="reset-code"
                  name="code"
                  type="text"
                  inputMode="numeric"
                  autoComplete="one-time-code"
                  placeholder="123456"
                  defaultValue={codeFromUrl}
                  required
                  className="mt-1.5 font-mono"
                  aria-invalid={error ? true : undefined}
                />
              </div>
            ) : (
              <input type="hidden" name="code" value={codeFromUrl} />
            )}

            <div>
              <Label variant="eyebrow" htmlFor="reset-new-password">
                Nouveau mot de passe
              </Label>
              <PasswordInput
                id="reset-new-password"
                name="newPassword"
                autoComplete="new-password"
                placeholder="••••••••••"
                required
                className="mt-1.5"
                aria-invalid={error ? true : undefined}
              />
            </div>

            <div>
              <Label variant="eyebrow" htmlFor="reset-confirm-password">
                Confirmation
              </Label>
              <PasswordInput
                id="reset-confirm-password"
                name="confirmPassword"
                autoComplete="new-password"
                placeholder="••••••••••"
                required
                className="mt-1.5"
                aria-invalid={error ? true : undefined}
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="xl"
              disabled={loading}
              className="mt-2 w-full"
              data-testid="reset-password-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Validation…
                </>
              ) : (
                <>
                  Réinitialiser le mot de passe
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          {/* Back link */}
          <p className="text-center text-sm text-[var(--ink-500)]">
            <Link
              href="/auth/sign-in"
              className="inline-flex items-center gap-1.5 font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              <ArrowLeft className="h-3.5 w-3.5" aria-hidden />
              Retour à la connexion
            </Link>
          </p>
        </div>
      </PageShellAuth.Card>
    </PageShellAuth>
  )
}
