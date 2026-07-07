'use client'

import { useSearchParams } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";
import { Id } from "@/convex/_generated/dataModel";
import {
    CheckCircle2,
    XCircle,
    Loader2,
    ArrowLeft,
    Clock,
    Wallet,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import Link from "next/link";

/**
 * Payment status screen (after a credit recharge redirect). v3 tokens with
 * semantic status colours: success → --status-good, failure → --status-danger,
 * expiry → --status-warn, brand/loading → --accent.
 */
export function RechargeContent() {
    const searchParams = useSearchParams();
    const sessionId = searchParams.get("session") as Id<"paymentSessions"> | null;
    const urlStatus = searchParams.get("status");

    const paymentStatus = useQuery(
        api.payments.getPaymentStatus,
        sessionId ? { paymentSessionId: sessionId } : "skip"
    );

    const formatCurrency = (amount: number) =>
        new Intl.NumberFormat("fr-SN", { style: "currency", currency: "XOF" }).format(amount);

    const cardCls =
        "w-full max-w-md rounded-2xl border border-[var(--border)] bg-[var(--paper-white)] shadow-sm";
    const iconWrap = (tone: string) =>
        `flex h-14 w-14 items-center justify-center rounded-full text-white shadow-sm ${tone}`;
    const backButton = (
        <Button
            asChild
            variant="outline"
            size="sm"
            className="mt-2 h-8 gap-1.5 rounded-full text-xs"
        >
            <Link href="/dashboard/billing">
                <ArrowLeft className="h-3.5 w-3.5" />
                Retour à la facturation
            </Link>
        </Button>
    );

    // No session ID in URL / not found
    if (!sessionId || paymentStatus === null) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className={cardCls}>
                    <div className="flex flex-col items-center space-y-4 px-8 pb-8 pt-8 text-center">
                        <div className={iconWrap("bg-[var(--status-danger)]")}>
                            <XCircle className="h-7 w-7" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-[var(--ink-900)]">Session introuvable</h2>
                            <p className="text-sm text-[var(--ink-soft)]">
                                {sessionId
                                    ? "Session de paiement introuvable ou non autorisée."
                                    : "La session de paiement est introuvable."}
                            </p>
                        </div>
                        {backButton}
                    </div>
                </div>
            </div>
        );
    }

    // Loading state
    if (paymentStatus === undefined) {
        return (
            <div className="flex min-h-[60vh] items-center justify-center">
                <div className={cardCls}>
                    <div className="flex flex-col items-center space-y-4 px-8 pb-8 pt-8 text-center">
                        <div className={iconWrap("bg-[var(--accent)]")}>
                            <Loader2 className="h-7 w-7 animate-spin" />
                        </div>
                        <div className="space-y-1">
                            <h2 className="text-base font-semibold text-[var(--ink-900)]">Chargement</h2>
                            <p className="text-sm text-[var(--ink-soft)]">Vérification de votre paiement…</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="flex min-h-[60vh] items-center justify-center">
            <div className={`${cardCls} overflow-hidden`}>
                {/* PENDING */}
                {paymentStatus.status === "PENDING" && (
                    <div className="space-y-5 px-8 pb-8 pt-8">
                        <div className="flex flex-col items-center space-y-3 text-center">
                            <div className={iconWrap("bg-[var(--accent)]")}>
                                <Loader2 className="h-7 w-7 animate-spin" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-[var(--ink-900)]">Paiement en cours</h2>
                                <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                                    {urlStatus === "cancel"
                                        ? "Le paiement a été annulé. Si vous avez finalisé le paiement, attendez la confirmation."
                                        : "Votre paiement est en cours de traitement. Cette page se mettra à jour automatiquement."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1 rounded-xl border border-[var(--border)] bg-[var(--paper-warm)]/40 p-4 text-center">
                            <p className="text-xs font-medium text-[var(--ink-soft)]">Montant</p>
                            <p className="text-2xl font-bold tracking-tight text-[var(--ink-900)]">
                                {formatCurrency(paymentStatus.amount)}
                            </p>
                        </div>

                        <p className="text-center text-[11px] text-[var(--ink-soft)]">
                            Réf : {paymentStatus.publicReference}
                        </p>
                    </div>
                )}

                {/* COMPLETED */}
                {paymentStatus.status === "COMPLETED" && (
                    <div className="space-y-5 px-8 pb-8 pt-8">
                        <div className="flex flex-col items-center space-y-3 text-center">
                            <div className={iconWrap("bg-[var(--status-good)]")}>
                                <CheckCircle2 className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-[var(--ink-900)]">Paiement confirmé !</h2>
                                <p className="text-sm text-[var(--ink-soft)]">
                                    Vos crédits ont été ajoutés à votre compte.
                                </p>
                            </div>
                        </div>

                        <div className="overflow-hidden rounded-xl border border-[var(--status-good)]/25 bg-[var(--status-good)]/10">
                            <div className="space-y-3 p-4">
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[var(--ink-soft)]">Montant payé</span>
                                    <span className="text-sm font-bold text-[var(--ink-900)]">
                                        {formatCurrency(paymentStatus.amount)}
                                    </span>
                                </div>
                                <div className="flex items-center justify-between">
                                    <span className="text-xs font-medium text-[var(--ink-soft)]">Crédits ajoutés</span>
                                    <span className="text-sm font-semibold text-[var(--status-good)]">
                                        +{new Intl.NumberFormat("fr-FR").format(paymentStatus.credits)}
                                    </span>
                                </div>
                            </div>
                            <Separator className="bg-[var(--status-good)]/20" />
                            <div className="flex items-center justify-between p-4">
                                <span className="text-xs font-medium text-[var(--ink-soft)]">Via</span>
                                <div className="flex items-center gap-2">
                                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)]">
                                        <Wallet className="h-3 w-3 text-white" />
                                    </div>
                                    <span className="text-sm font-semibold text-[var(--ink-900)]">
                                        {paymentStatus.provider}
                                    </span>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--ink-soft)]">
                                <ShieldCheck className="h-3.5 w-3.5" />
                                <span>Réf : {paymentStatus.publicReference}</span>
                            </div>
                            <Button
                                asChild
                                size="sm"
                                className="h-9 w-full rounded-full bg-[var(--accent)] text-xs font-medium text-white hover:opacity-90"
                            >
                                <Link href="/dashboard/billing">Retour à la facturation</Link>
                            </Button>
                        </div>
                    </div>
                )}

                {/* FAILED */}
                {paymentStatus.status === "FAILED" && (
                    <div className="space-y-5 px-8 pb-8 pt-8">
                        <div className="flex flex-col items-center space-y-3 text-center">
                            <div className={iconWrap("bg-[var(--status-danger)]")}>
                                <XCircle className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-[var(--ink-900)]">Paiement échoué</h2>
                                <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                                    {paymentStatus.failureReason || "Le paiement n'a pas pu être traité."}
                                </p>
                            </div>
                        </div>

                        <div className="space-y-1 rounded-xl border border-[var(--status-danger)]/25 bg-[var(--status-danger)]/10 p-4 text-center">
                            <p className="text-xs font-medium text-[var(--ink-soft)]">Montant</p>
                            <p className="text-2xl font-bold tracking-tight text-[var(--ink-900)]">
                                {formatCurrency(paymentStatus.amount)}
                            </p>
                        </div>

                        <Button asChild variant="outline" size="sm" className="h-9 w-full rounded-full text-xs">
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                Retour et réessayer
                            </Link>
                        </Button>
                    </div>
                )}

                {/* EXPIRED */}
                {paymentStatus.status === "EXPIRED" && (
                    <div className="space-y-5 px-8 pb-8 pt-8">
                        <div className="flex flex-col items-center space-y-3 text-center">
                            <div className={iconWrap("bg-[var(--status-warn)]")}>
                                <Clock className="h-7 w-7" />
                            </div>
                            <div className="space-y-1">
                                <h2 className="text-base font-semibold text-[var(--ink-900)]">Session expirée</h2>
                                <p className="max-w-xs text-sm text-[var(--ink-soft)]">
                                    La session de paiement a expiré (30 minutes). Aucun montant n&apos;a été débité.
                                </p>
                            </div>
                        </div>

                        <Button asChild variant="outline" size="sm" className="h-9 w-full rounded-full text-xs">
                            <Link href="/dashboard/billing">
                                <ArrowLeft className="mr-1.5 h-3.5 w-3.5" />
                                Retour et réessayer
                            </Link>
                        </Button>
                    </div>
                )}
            </div>
        </div>
    );
}
