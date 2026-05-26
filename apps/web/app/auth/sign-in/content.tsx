"use client"

import * as React from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import * as Sentry from "@sentry/nextjs"
import { AlertCircle, ArrowRight, Loader2, Lock, ShieldCheck } from "lucide-react"

import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { PageShellAuth } from "@/components/ui/page-shell-auth"
import { PasswordInput } from "@/components/ui/password-input"
import { safeRedirect } from "@/lib/safe-redirect"

/**
 * Sign-in — Slice 1 of feat/redesign-web.
 *
 * Visual : PageShellAuth (loud hot-pink) + violet mat + white inner card.
 * Locked microcopy ("Bon retour." / generic error string).
 *
 * Security :
 *   - `safeRedirect()` sanitizes the `?redirect=` query param (open-redirect
 *     defense — proxy.ts writes the param blindly).
 *   - Generic error message regardless of underlying auth failure
 *     (no user enumeration leak).
 *   - `window.location.assign` instead of `router.push` to force a fresh
 *     request that re-reads the auth presence cookie (eliminates the proxy
 *     race condition).
 *
 * TODO (security-hardening slice) : add rate limiting (per-IP + per-email)
 * via a Convex mutation hook. Currently no client-side throttle and no
 * brute-force protection. Sentry breadcrumb tracks failed-attempt rate so
 * an unexpected spike is observable.
 *
 * OAuth (Google / Apple) is intentionally deferred to Slice 1b pending
 * investigation of @convex-dev/auth account-linking semantics with verified
 * email — shipping it now risks creating duplicate accounts for users who
 * already have a password-based account.
 */
export default function SignInContent() {
  const searchParams = useSearchParams()
  const redirectTarget = safeRedirect(searchParams.get("redirect"))
  const oauthError = searchParams.get("error")

  const [loading, setLoading] = React.useState(false)
  const [error, setError] = React.useState<string | null>(
    oauthError ? "Connexion échouée. Veuillez réessayer." : null
  )
  const { signIn } = useAuthActions()

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    if (loading) return
    setLoading(true)
    setError(null)

    const formData = new FormData(e.currentTarget)
    formData.set("flow", "signIn")

    Sentry.addBreadcrumb({
      category: "auth",
      type: "user",
      level: "info",
      message: "sign-in attempt",
    })

    try {
      await signIn("password", formData)
      // Force fresh request — re-reads auth cookies, lets proxy authorize
      // the redirect target without a router.push race.
      window.location.assign(redirectTarget)
    } catch (err) {
      // Generic message — never leak whether email exists or password
      // is wrong (user enumeration defense).
      setError("Email ou mot de passe incorrect.")
      setLoading(false)
      Sentry.captureMessage("sign-in failed", {
        level: "warning",
        tags: { feature: "auth", flow: "sign-in" },
      })
      // TODO(rate-limit): tag with hashed email + IP once a Convex
      // throttle is wired so we can alert on credential-stuffing spikes.
      if (process.env.NODE_ENV !== "production") {
        console.error("Sign in error:", err)
      }
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
              <p>Connexion · Espace équipe</p>
            </Label>
            <h1 className="mt-3 font-editorial text-4xl tracking-tight text-[var(--ink-900)] sm:text-5xl">
              Bon retour.
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-[var(--ink-500)]">
              Reprenez votre espace équipe.
            </p>
          </div>

          {/* Error */}
          {error ? (
            <Alert variant="error-cream" role="alert">
              <AlertCircle />
              <AlertTitle>Connexion impossible</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          {/* Form */}
          <form onSubmit={handleSubmit} className="space-y-4" noValidate>
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
                aria-invalid={error ? true : undefined}
              />
            </div>

            <div>
              <div className="mb-1.5 flex items-center justify-between">
                <Label variant="eyebrow" htmlFor="password">
                  Mot de passe
                </Label>
                <Link
                  href="/auth/forgot-password"
                  className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-500)] underline-offset-4 transition-colors hover:text-[var(--accent)] hover:underline"
                >
                  Oublié ?
                </Link>
              </div>
              <PasswordInput
                id="password"
                name="password"
                autoComplete="current-password"
                placeholder="••••••••"
                required
                aria-invalid={error ? true : undefined}
              />
            </div>

            <Button
              type="submit"
              variant="accent"
              size="xl"
              disabled={loading}
              className="mt-2 w-full"
              data-testid="sign-in-submit"
            >
              {loading ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
                  Connexion…
                </>
              ) : (
                <>
                  Accéder à mon espace
                  <ArrowRight className="h-4 w-4" aria-hidden />
                </>
              )}
            </Button>
          </form>

          {/* Cross-link to sign-up */}
          <p className="text-center text-sm text-[var(--ink-500)]">
            Pas encore de compte ?{" "}
            <Link
              href="/auth/sign-up"
              className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
            >
              Créer un espace équipe →
            </Link>
          </p>

          {/* Trust footer */}
          <div className="flex items-center justify-center gap-2.5 border-t border-[var(--ink-200)] pt-5 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-500)]">
            <span className="flex items-center gap-1.5">
              <ShieldCheck className="h-3 w-3" aria-hidden />
              RGPD
            </span>
            <span aria-hidden className="size-1 rounded-full bg-[var(--ink-300)]" />
            <span>Hébergement UE</span>
            <span aria-hidden className="size-1 rounded-full bg-[var(--ink-300)]" />
            <span className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" aria-hidden />
              TLS 1.3
            </span>
          </div>
        </div>
      </PageShellAuth.Card>
    </PageShellAuth>
  )
}
