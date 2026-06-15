'use client'

import React, { useState, useEffect, useMemo } from "react"
import { useQuery, useMutation, useConvexAuth } from "convex/react"
import { api } from "@/convex/_generated/api"
import { useParams, useRouter } from "next/navigation"
import { useAuthActions } from "@convex-dev/auth/react"
import {
    Loader2,
    CheckCircle2,
    AlertTriangle,
    ArrowRight,
    Eye,
    EyeOff,
    Lock,
    UserRound,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Logo } from "@/components/ui/logo"
import { cn } from "@/lib/utils"

/**
 * /invite/[token] — v3 redesign per `.context/design-extraction-onboarding-v3.md`.
 *
 * Visual states (PDF section 06) :
 *   - Valid     : org avatar + role chip + role explainer + Accept / Refuse
 *   - Expired   : lock + X badge + request-new CTA
 *   - Invalid   : same shell as Expired with simpler copy
 *   - Success   : check halo + redirect to /dashboard
 *
 * Bugfix (Skeptic review) : `isSubmitting` guards against double-click on
 * "Accepter", which previously triggered `acceptLink` twice and threw an
 * "Invitation invalid" error on the second call because the first one
 * already flipped the invite status to ACCEPTED.
 */
export default function AcceptInvitationPage() {
    const params = useParams()
    const router = useRouter()
    const { signIn, signOut } = useAuthActions()

    const token = typeof params.token === 'string' ? params.token : ""

    const invitationData = useQuery(api.invitations.getByToken, { token })
    const acceptLinkMutation = useMutation(api.invitations.acceptLink)

    const { isAuthenticated } = useConvexAuth()

    const [password, setPassword] = useState("")
    const [confirmPassword, setConfirmPassword] = useState("")
    const [showPassword, setShowPassword] = useState(false)
    const [isSubmitting, setIsSubmitting] = useState(false)
    const [error, setError] = useState<string | null>(null)
    const [success, setSuccess] = useState(false)
    const [pendingAcceptance, setPendingAcceptance] = useState(false)
    const [showDeclineConfirm, setShowDeclineConfirm] = useState(false)

    const isLoading = invitationData === undefined
    const isInvalid = invitationData === null
    const isExpired = invitationData?.status === "EXPIRED"
    const isValid = invitationData?.status === "VALID" && invitationData.invitation
    const isAccepted = invitationData?.status === "ACCEPTED"

    // Auto-link once the new account is authenticated. Guarded by
    // `pendingAcceptance` so we don't fire on initial render for an
    // already-logged-in user.
    useEffect(() => {
        if (!(isAuthenticated && pendingAcceptance)) return
        let cancelled = false
        ;(async () => {
            try {
                await acceptLinkMutation({ token })
                if (cancelled) return
                setSuccess(true)
                setPendingAcceptance(false)
                setTimeout(() => router.push("/dashboard"), 900)
            } catch (err) {
                if (cancelled) return
                console.error("Failed to accept invitation:", err)
                setError(err instanceof Error ? err.message : "Erreur lors de l'acceptation.")
                setIsSubmitting(false)
                setPendingAcceptance(false)
            }
        })()
        return () => {
            cancelled = true
        }
    }, [isAuthenticated, pendingAcceptance, acceptLinkMutation, token, router])

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        if (!isValid || isSubmitting) return
        if (password !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.")
            return
        }

        setIsSubmitting(true)
        setError(null)

        try {
            await signOut()
            await signIn("password", {
                email: invitationData?.invitation?.email || "",
                password,
                name: invitationData.invitation.name || "",
                flow: "signUp",
            })
            setPendingAcceptance(true)
        } catch (err) {
            console.error(err)
            setError(err instanceof Error ? err.message : "Une erreur est survenue lors de l'inscription.")
            setIsSubmitting(false)
        }
    }

    // Org initials for the avatar squircle (e.g. "Mission Impastabowl" → "MI")
    const orgInitials = useMemo(() => {
        const name = invitationData?.invitation?.orgName || ""
        return name
            .split(/\s+/)
            .filter(Boolean)
            .slice(0, 2)
            .map((w) => w[0]?.toUpperCase() ?? "")
            .join("") || "?"
    }, [invitationData])

    // ── Render branches ────────────────────────────────────────────────────

    if (isLoading) {
        return (
            <PageShell>
                <div className="flex flex-col items-center gap-3 py-12">
                    <Loader2 className="h-6 w-6 animate-spin text-[var(--accent)]" />
                    <p className="text-xs font-mono uppercase tracking-wider text-[var(--ink-soft)]">
                        Vérification de l&apos;invitation…
                    </p>
                </div>
            </PageShell>
        )
    }

    if (success || isAccepted) {
        const orgName = invitationData?.invitation?.orgName || "l'organisation"
        // Auto-redirect for the "already accepted" branch
        if (isAccepted && !success) {
            setTimeout(() => router.push("/dashboard"), 900)
        }
        return (
            <PageShell>
                <Card>
                    <div className="text-center space-y-4 p-8 sm:p-10">
                        <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                            <span className="absolute inset-0 rounded-full bg-[var(--accent-muted)]" aria-hidden />
                            <span className="absolute inset-2 rounded-full bg-[var(--paper-white)]" aria-hidden />
                            <CheckCircle2 className="relative h-7 w-7 text-[var(--accent)]" strokeWidth={2} />
                        </div>
                        <h2 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">
                            {isAccepted && !success ? "Invitation déjà acceptée" : "Compte créé !"}
                        </h2>
                        <p className="text-sm text-[var(--ink-500)]">
                            Bienvenue dans <strong className="text-[var(--ink-900)]">{orgName}</strong>.
                            <br />
                            Redirection vers le tableau de bord…
                        </p>
                        <Loader2 className="h-5 w-5 animate-spin mx-auto text-[var(--accent)] mt-4" />
                    </div>
                </Card>
            </PageShell>
        )
    }

    if (isInvalid) {
        return (
            <PageShell>
                <Card>
                    <ExpiredOrInvalidView
                        title="Invitation invalide"
                        description="Ce lien n'existe pas ou a été révoqué. Demandez à votre administrateur de vous renvoyer une invitation."
                        kind="invalid"
                        onBack={() => router.push("/")}
                    />
                </Card>
            </PageShell>
        )
    }

    if (isExpired) {
        return (
            <PageShell>
                <Card>
                    <ExpiredOrInvalidView
                        title="Cette invitation a expiré"
                        description="Le lien d'invitation n'est plus valide. Les invitations expirent au bout de 7 jours pour des raisons de sécurité."
                        kind="expired"
                        onBack={() => router.push("/")}
                    />
                </Card>
            </PageShell>
        )
    }

    if (!invitationData?.invitation) return null
    const { invitation } = invitationData

    return (
        <PageShell>
            <Card>
                <div className="p-8 sm:p-10 space-y-6">
                    {/* Avatar org */}
                    <div className="flex flex-col items-center text-center space-y-3">
                        <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-[var(--accent)] font-display text-2xl font-bold text-white shadow-[0_8px_20px_-8px_var(--accent-glow)]">
                            {orgInitials}
                        </div>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-[var(--ink-900)] sm:text-2xl">
                                Rejoindre {invitation.orgName}
                            </h1>
                            <p className="mt-1.5 text-sm text-[var(--ink-500)]">
                                <strong className="text-[var(--ink-700)]">{invitation.inviterName}</strong> vous invite à rejoindre l&apos;équipe sur Jokko.
                            </p>
                        </div>
                        <span className="inline-flex items-center gap-1.5 rounded-full bg-[var(--accent-muted)] px-3 py-1 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--accent)]">
                            <UserRound className="h-3 w-3" />
                            Rôle · {(invitation.role || 'AGENT').toString().toUpperCase()}
                        </span>
                        <p className="text-xs text-[var(--ink-500)] max-w-sm leading-relaxed">
                            En tant qu&apos;<strong>{(invitation.role || 'agent').toString().toLowerCase()}</strong>, vous pourrez répondre aux conversations qui vous sont assignées, gérer vos contacts et utiliser les modèles de l&apos;équipe.
                        </p>
                    </div>

                    {/* Sign-up form (créer mot de passe pour le nouveau compte) */}
                    <form onSubmit={handleSubmit} className="space-y-4">
                        {error ? (
                            <Alert variant="destructive" className="border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)]">
                                <AlertTriangle className="h-4 w-4 text-[var(--status-danger)]" />
                                <AlertTitle className="text-[var(--status-danger)]">Erreur</AlertTitle>
                                <AlertDescription className="text-[var(--ink-700)]">{error}</AlertDescription>
                            </Alert>
                        ) : null}

                        <div className="space-y-1.5">
                            <Label htmlFor="email" className="text-sm font-medium text-[var(--ink-700)]">Email</Label>
                            <Input
                                id="email"
                                type="email"
                                value={invitation.email}
                                disabled
                                className="h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] font-medium text-[var(--ink-900)]"
                            />
                            <p className="text-[11px] text-[var(--ink-500)]">
                                Lié à l&apos;invitation.
                            </p>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="password" className="text-sm font-medium text-[var(--ink-700)]">Créer un mot de passe</Label>
                            <div className="relative">
                                <Input
                                    id="password"
                                    type={showPassword ? "text" : "password"}
                                    placeholder="••••••••"
                                    value={password}
                                    onChange={(e) => setPassword(e.target.value)}
                                    required
                                    minLength={8}
                                    autoComplete="new-password"
                                    className="h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] pr-10 focus-visible:bg-white focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)] transition-colors"
                                />
                                <button
                                    type="button"
                                    onClick={() => setShowPassword(!showPassword)}
                                    aria-label={showPassword ? "Masquer le mot de passe" : "Afficher le mot de passe"}
                                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--ink-400)] hover:text-[var(--ink-700)]"
                                >
                                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                                </button>
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <Label htmlFor="confirmPassword" className="text-sm font-medium text-[var(--ink-700)]">Confirmer</Label>
                            <Input
                                id="confirmPassword"
                                type={showPassword ? "text" : "password"}
                                placeholder="••••••••"
                                value={confirmPassword}
                                onChange={(e) => setConfirmPassword(e.target.value)}
                                required
                                minLength={8}
                                autoComplete="new-password"
                                className="h-11 rounded-xl border-[var(--ink-200)] bg-[var(--paper-warm)] focus-visible:bg-white focus-visible:border-[var(--accent)] focus-visible:ring-[var(--accent-ring)] transition-colors"
                            />
                        </div>

                        <Button
                            type="submit"
                            variant="accent"
                            disabled={isSubmitting}
                            className="group h-12 w-full text-base"
                        >
                            {isSubmitting ? (
                                <>
                                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                    Création du compte…
                                </>
                            ) : (
                                <>
                                    Accepter l&apos;invitation
                                    <ArrowRight className="ml-2 h-4 w-4 group-hover:translate-x-0.5 transition-transform" />
                                </>
                            )}
                        </Button>

                        <button
                            type="button"
                            onClick={() => setShowDeclineConfirm(true)}
                            disabled={isSubmitting}
                            className="w-full text-center text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors py-1"
                        >
                            Refuser
                        </button>
                    </form>
                </div>
            </Card>

            <p className="text-center text-xs text-[var(--ink-500)]">
                <Lock className="inline h-3 w-3 align-middle mr-1" />
                Cette invitation expire dans 6 jours.
            </p>

            {/* Confirmation modal pour Refuser (UA review point) */}
            {showDeclineConfirm ? (
                <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm p-4">
                    <div className="w-full max-w-sm rounded-2xl bg-[var(--paper-white)] border border-[var(--ink-200)] p-6 shadow-2xl space-y-4">
                        <h2 className="text-lg font-semibold text-[var(--ink-900)]">Refuser l&apos;invitation ?</h2>
                        <p className="text-sm text-[var(--ink-600)]">
                            Vous ne pourrez plus rejoindre {invitation.orgName} avec ce lien. {invitation.inviterName} devra vous renvoyer une nouvelle invitation.
                        </p>
                        <div className="flex gap-2 justify-end pt-2">
                            <Button variant="ghost" onClick={() => setShowDeclineConfirm(false)}>
                                Annuler
                            </Button>
                            <Button
                                variant="destructive"
                                onClick={() => router.push("/")}
                            >
                                Refuser
                            </Button>
                        </div>
                    </div>
                </div>
            ) : null}
        </PageShell>
    )
}

// ── Sub-components ────────────────────────────────────────────────────────

function PageShell({ children }: { children: React.ReactNode }) {
    return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-[var(--paper-warm)] px-4 py-12">
            <div className="w-full max-w-md space-y-6">
                <div className="flex justify-center">
                    <Logo width={104} height={32} priority />
                </div>
                {children}
            </div>
        </div>
    )
}

function Card({ children }: { children: React.ReactNode }) {
    return (
        <div className="rounded-3xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-sm">
            {children}
        </div>
    )
}

function ExpiredOrInvalidView({
    title,
    description,
    kind,
    onBack,
}: {
    title: string
    description: string
    kind: "expired" | "invalid"
    onBack: () => void
}) {
    return (
        <div className="p-8 sm:p-10 text-center space-y-5">
            <div className="relative mx-auto flex h-16 w-16 items-center justify-center">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-[var(--paper-warm)] border border-[var(--ink-200)]">
                    <Lock className="h-6 w-6 text-[var(--ink-500)]" strokeWidth={1.75} />
                </div>
                <span
                    className={cn(
                        "absolute -bottom-1 -right-1 flex h-6 w-6 items-center justify-center rounded-full text-white shadow-sm",
                        kind === "expired" ? "bg-[var(--status-danger)]" : "bg-[var(--ink-500)]",
                    )}
                >
                    <span className="text-xs font-bold">×</span>
                </span>
            </div>
            <div>
                <h2 className="text-xl font-bold tracking-tight text-[var(--ink-900)]">{title}</h2>
                <p className="mt-2 text-sm text-[var(--ink-500)] max-w-sm mx-auto">{description}</p>
            </div>
            <Button variant="outline" onClick={onBack} className="w-full">
                Retour à l&apos;accueil
            </Button>
        </div>
    )
}
