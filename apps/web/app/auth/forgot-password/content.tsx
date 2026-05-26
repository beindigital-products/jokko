"use client"

import * as React from "react"
import Link from "next/link"
import { useAuthActions } from "@convex-dev/auth/react"
import * as Sentry from "@sentry/nextjs"
import { ArrowLeft, ArrowRight, CheckCircle2, Loader2, Mail } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageShellAuth } from "@/components/ui/page-shell-auth"

/**
 * Forgot-password — Slice 1.
 *
 * Single-field flow : user enters their email, we trigger the Convex auth
 * Password reset Email provider. Email contains a deep link to
 * `/auth/reset-password?code=...`.
 *
 * Generic success message regardless of whether the email exists
 * (user-enumeration defense — same principle as sign-in).
 */
export default function ForgotPasswordContent() {
  const { signIn } = useAuthActions()
  const [loading, setLoading] = React.useState(false)
  const [sent, setSent] = React.useState(false)
  const [error, setError] = React.useState<string | null>(null)

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    const rawEmail = (formData.get("email") as string | null) ?? ""
    const email = rawEmail.trim().toLowerCase()

    if (!email || !email.includes("@")) {
      setError("Renseignez une adresse e-mail valide.")
      setLoading(false)
      return
    }

    Sentry.addBreadcrumb({
      category: "auth",
      type: "user",
      level: "info",
      message: "password-reset request",
    })

    try {
      const payload = new FormData()
      payload.set("email", email)
      payload.set("flow", "reset")
      payload.set("redirectTo", `/auth/reset-password?email=${encodeURIComponent(email)}`)
      await signIn("password", payload)
      setSent(true)
    } catch (err) {
      // Convex auth may throw if the email doesn't exist — we still show
      // the success state to avoid leaking account presence.
      setSent(true)
      Sentry.captureMessage("password-reset request failed", {
        level: "warning",
        tags: { feature: "auth", flow: "reset" },
      })
      if (process.env.NODE_ENV !== "production") {
        console.error("Password reset request error:", err)
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
              <p>Mot de passe · Récupération</p>
            </Label>
            <h1 className="mt-3 font-editorial text-4xl tracking-tight text-[var(--ink-900)] sm:text-5xl">
              {sent ? "Vérifiez vos mails." : "On vous renvoie ça."}
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
              {sent
                ? "Si un compte existe pour cette adresse, vous recevrez un e-mail avec un lien de réinitialisation dans les prochaines minutes."
                : "Saisissez l'e-mail de votre compte. Nous envoyons un lien sécurisé valide 30 minutes."}
            </p>
          </div>

          {sent ? (
            <Alert variant="success-cream" role="status">
              <CheckCircle2 />
              <AlertTitle>E-mail envoyé</AlertTitle>
              <AlertDescription>
                Pensez à vérifier vos spams si rien n'arrive sous 5 minutes.
              </AlertDescription>
            </Alert>
          ) : null}

          {error ? (
            <Alert variant="error-cream" role="alert">
              <AlertTitle>Adresse invalide</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {!sent ? (
            <form onSubmit={handleSubmit} className="space-y-4" noValidate>
              <div>
                <Label variant="eyebrow" htmlFor="email">
                  E-mail du compte
                </Label>
                <Input
                  id="email"
                  name="email"
                  type="email"
                  autoComplete="email"
                  placeholder="vous@entreprise.com"
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
                className="w-full"
                data-testid="forgot-password-submit"
              >
                {loading ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                    Envoi…
                  </>
                ) : (
                  <>
                    <Mail className="h-4 w-4" aria-hidden />
                    Envoyer le lien
                    <ArrowRight className="h-4 w-4" aria-hidden />
                  </>
                )}
              </Button>
            </form>
          ) : null}

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
