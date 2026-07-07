'use client'

import { useEffect, useState } from "react";
import { useAction } from "convex/react";
import { api } from "@/convex/_generated/api";
import { toast } from "sonner";
import {
    Loader2,
    CreditCard,
    Smartphone,
    Wallet,
    MessageSquare,
    Sparkles,
    Check,
    Coins,
    ShieldCheck,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
import { CREDIT_PACKS, PAYMENT_PROVIDERS, findPack, type CreditPack, type PaymentProvider } from "@/lib/credit-packs";

interface RechargeDialogProps {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    /** Pre-select this pack (FCFA) and jump straight to the payment step. */
    initialAmount?: number;
}

function getErrorMessage(error: unknown, fallback: string): string {
    return error instanceof Error ? error.message : fallback;
}

const STEP_LABELS = ["Montant", "Paiement", "Confirmation"] as const;

function StepIndicator({ currentStep }: { currentStep: 1 | 2 | 3 }) {
    return (
        <div className="flex items-center justify-center gap-2 pb-1">
            {STEP_LABELS.map((label, i) => {
                const stepNum = i + 1;
                const isActive = stepNum === currentStep;
                const isCompleted = stepNum < currentStep;
                return (
                    <div key={label} className="flex items-center gap-2">
                        {i > 0 && (
                            <div className={cn(
                                "h-px w-6 transition-colors sm:w-8",
                                isCompleted ? "bg-[var(--accent)]" : "bg-[var(--border)]"
                            )} />
                        )}
                        <div className="flex items-center gap-1.5">
                            <div className={cn(
                                "flex h-6 w-6 items-center justify-center rounded-full text-[10px] font-bold transition-all",
                                isActive || isCompleted
                                    ? "bg-[var(--accent)] text-white shadow-sm"
                                    : "bg-[var(--paper-warm)] text-[var(--ink-soft)]"
                            )}>
                                {isCompleted ? <Check className="h-3 w-3" /> : stepNum}
                            </div>
                            <span className={cn(
                                "hidden text-[11px] font-medium sm:inline",
                                isActive ? "text-[var(--ink-900)]" : isCompleted ? "text-[var(--accent)]" : "text-[var(--ink-soft)]"
                            )}>
                                {label}
                            </span>
                        </div>
                    </div>
                );
            })}
        </div>
    );
}

const PROVIDER_ICONS: Record<PaymentProvider, React.ElementType> = {
    WAVE: Wallet,
    ORANGE_MONEY: Smartphone,
    STRIPE: CreditCard,
};

// Wave / Orange Money keep their own brand colours (meaningful to users);
// Stripe ("Carte bancaire") uses the Jokko accent.
const PROVIDER_GRADIENTS: Record<PaymentProvider, string> = {
    WAVE: "from-[#1B98F0] to-[#0D7AD4]",
    ORANGE_MONEY: "from-[#FF6600] to-[#E55C00]",
    STRIPE: "from-[var(--accent)] to-[var(--accent)]",
};

export function RechargeDialog({ open, onOpenChange, initialAmount }: RechargeDialogProps) {
    const [step, setStep] = useState<1 | 2 | 3>(1);
    const [selectedPack, setSelectedPack] = useState<CreditPack | null>(null);
    const [selectedProvider, setSelectedProvider] = useState<PaymentProvider | null>(null);
    const [loading, setLoading] = useState(false);

    const initiateWave = useAction(api.payment_actions.initiateWavePayment);
    const initiateStripe = useAction(api.stripe_actions.createCreditsCheckoutSession);

    // When opened with a pre-selected amount (from the v3 credit card), seed the
    // pack and jump straight to the payment-method step.
    useEffect(() => {
        if (!open) return;
        const pack = initialAmount ? findPack(initialAmount) : undefined;
        if (pack) {
            setSelectedPack(pack);
            setStep(2);
        }
    }, [open, initialAmount]);

    const resetAndClose = () => {
        setStep(1);
        setSelectedPack(null);
        setSelectedProvider(null);
        setLoading(false);
        onOpenChange(false);
    };

    const handlePay = async () => {
        if (!selectedPack || !selectedProvider) return;

        setLoading(true);
        try {
            let result: { url: string };

            switch (selectedProvider) {
                case "WAVE":
                    result = await initiateWave({ amount: selectedPack.amountFCFA });
                    break;
                case "STRIPE":
                    result = await initiateStripe({ amount: selectedPack.amountFCFA });
                    break;
                case "ORANGE_MONEY":
                    toast.error("Orange Money n'est pas encore disponible.");
                    setLoading(false);
                    return;
                default:
                    throw new Error("Provider non supporté");
            }

            window.location.href = result.url;
        } catch (error) {
            toast.error("Erreur", {
                description: getErrorMessage(error, "Impossible de créer la session de paiement."),
            });
            setLoading(false);
        }
    };

    const packRadio = (selected: boolean) =>
        cn(
            "flex h-5 w-5 shrink-0 items-center justify-center rounded-full border-2 transition-all",
            selected ? "border-[var(--accent)] bg-[var(--accent)]" : "border-[var(--border)] group-hover:border-[var(--ink-soft)]",
        );

    return (
        <Dialog open={open} onOpenChange={resetAndClose}>
            <DialogContent className="gap-0 overflow-hidden p-0 sm:max-w-md">
                {/* Header */}
                <div className="space-y-4 px-6 pb-4 pt-6">
                    <DialogHeader className="space-y-1.5">
                        <div className="flex items-center gap-3">
                            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-[var(--accent)] shadow-sm">
                                <Coins className="h-4 w-4 text-white" />
                            </div>
                            <div>
                                <DialogTitle className="text-sm font-semibold text-[var(--ink-900)] sm:text-base">
                                    {step === 1 && "Choisir un montant"}
                                    {step === 2 && "Mode de paiement"}
                                    {step === 3 && "Confirmer le paiement"}
                                </DialogTitle>
                                <DialogDescription className="mt-0 text-[11px] text-[var(--ink-soft)]">
                                    {step === 1 && "Sélectionnez le pack de crédits à acheter."}
                                    {step === 2 && "Comment souhaitez-vous payer ?"}
                                    {step === 3 && "Vérifiez les détails avant de procéder."}
                                </DialogDescription>
                            </div>
                        </div>
                    </DialogHeader>
                    <StepIndicator currentStep={step} />
                </div>

                <Separator className="bg-[var(--border)]" />

                {/* Step Content */}
                <div className="px-6 py-5">
                    {/* Step 1: Choose amount */}
                    {step === 1 && (
                        <div className="grid grid-cols-1 gap-2">
                            {CREDIT_PACKS.map((pack) => {
                                const selected = selectedPack?.id === pack.id;
                                return (
                                    <button
                                        key={pack.id}
                                        onClick={() => setSelectedPack(pack)}
                                        className={cn(
                                            "group relative flex cursor-pointer items-center justify-between rounded-xl border p-3.5 text-left transition-all",
                                            selected
                                                ? "border-[var(--accent)] bg-[var(--accent-muted)] ring-2 ring-[var(--accent)]/15"
                                                : "border-[var(--border)] bg-[var(--paper-white)] hover:border-[var(--ink-soft)]/40 hover:bg-[var(--paper-warm)]/50"
                                        )}
                                    >
                                        <div className="flex items-center gap-3">
                                            <div className={cn(
                                                "flex h-9 w-9 items-center justify-center rounded-full text-xs font-bold transition-all",
                                                selected
                                                    ? "bg-[var(--accent)] text-white shadow-sm"
                                                    : "bg-[var(--paper-warm)] text-[var(--ink-soft)] group-hover:bg-[var(--border)]"
                                            )}>
                                                {new Intl.NumberFormat('fr-FR', { notation: 'compact' }).format(pack.amountFCFA)}
                                            </div>
                                            <div>
                                                <div className="flex items-center gap-2">
                                                    <span className="text-sm font-semibold text-[var(--ink-900)]">{pack.label}</span>
                                                    {pack.popular && (
                                                        <Badge className="gap-0.5 border-[var(--accent)]/30 bg-[var(--accent-muted)] px-1.5 py-0 text-[10px] font-medium text-[var(--accent)]">
                                                            <Sparkles className="h-2.5 w-2.5" />
                                                            Populaire
                                                        </Badge>
                                                    )}
                                                </div>
                                                <div className="mt-0.5 flex items-center gap-1 text-[11px] text-[var(--ink-soft)]">
                                                    <MessageSquare className="h-3 w-3" />
                                                    <span>~ {pack.messagesEstimated} messages</span>
                                                </div>
                                            </div>
                                        </div>
                                        <div className={packRadio(selected)}>
                                            {selected && <Check className="h-3 w-3 text-white" />}
                                        </div>
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 2: Choose provider */}
                    {step === 2 && (
                        <div className="grid grid-cols-1 gap-2">
                            {PAYMENT_PROVIDERS.map((provider) => {
                                const Icon = PROVIDER_ICONS[provider.id];
                                const gradient = PROVIDER_GRADIENTS[provider.id];
                                const selected = selectedProvider === provider.id;
                                return (
                                    <button
                                        key={provider.id}
                                        onClick={() => {
                                            if (provider.available) setSelectedProvider(provider.id);
                                        }}
                                        disabled={!provider.available}
                                        className={cn(
                                            "group relative flex cursor-pointer items-center gap-3 rounded-xl border p-3.5 text-left transition-all",
                                            !provider.available && "cursor-not-allowed opacity-50",
                                            selected
                                                ? "border-[var(--accent)] bg-[var(--accent-muted)] ring-2 ring-[var(--accent)]/15"
                                                : provider.available
                                                    ? "border-[var(--border)] bg-[var(--paper-white)] hover:border-[var(--ink-soft)]/40 hover:bg-[var(--paper-warm)]/50"
                                                    : "border-[var(--border)] bg-[var(--paper-warm)]/40"
                                        )}
                                    >
                                        <div className={cn(
                                            "flex h-10 w-10 items-center justify-center rounded-full shadow-sm transition-all",
                                            selected ? `bg-gradient-to-br ${gradient}` : "bg-[var(--paper-warm)] group-hover:bg-[var(--border)]"
                                        )}>
                                            <Icon className={cn(
                                                "h-[18px] w-[18px] transition-colors",
                                                selected ? "text-white" : "text-[var(--ink-soft)]"
                                            )} />
                                        </div>
                                        <div className="min-w-0 flex-1">
                                            <div className="flex items-center gap-2">
                                                <span className="text-sm font-semibold text-[var(--ink-900)]">{provider.name}</span>
                                                {!provider.available && (
                                                    <Badge variant="secondary" className="bg-[var(--paper-warm)] text-[10px] font-medium text-[var(--ink-soft)]">
                                                        Bientôt
                                                    </Badge>
                                                )}
                                            </div>
                                            <p className="mt-0.5 text-[11px] text-[var(--ink-soft)]">{provider.description}</p>
                                        </div>
                                        {provider.available && (
                                            <div className={packRadio(selected)}>
                                                {selected && <Check className="h-3 w-3 text-white" />}
                                            </div>
                                        )}
                                    </button>
                                );
                            })}
                        </div>
                    )}

                    {/* Step 3: Confirm */}
                    {step === 3 && selectedPack && selectedProvider && (() => {
                        const ProviderIcon = PROVIDER_ICONS[selectedProvider];
                        const providerName = PAYMENT_PROVIDERS.find((p) => p.id === selectedProvider)?.name;
                        return (
                            <div className="space-y-4">
                                <div className="overflow-hidden rounded-xl border border-[var(--border)] bg-[var(--paper-warm)]/40">
                                    <div className="space-y-3 p-4">
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-[var(--ink-soft)]">Montant</span>
                                            <span className="text-sm font-bold text-[var(--ink-900)]">{selectedPack.label}</span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-[var(--ink-soft)]">Crédits</span>
                                            <span className="text-sm font-semibold text-[var(--accent)]">
                                                +{new Intl.NumberFormat("fr-FR").format(selectedPack.credits)} crédits
                                            </span>
                                        </div>
                                        <div className="flex items-center justify-between">
                                            <span className="text-xs font-medium text-[var(--ink-soft)]">Messages estimés</span>
                                            <span className="text-xs text-[var(--ink-700)]">~ {selectedPack.messagesEstimated}</span>
                                        </div>
                                    </div>
                                    <Separator className="bg-[var(--border)]" />
                                    <div className="flex items-center justify-between p-4">
                                        <span className="text-xs font-medium text-[var(--ink-soft)]">Paiement via</span>
                                        <div className="flex items-center gap-2">
                                            <div className={cn(
                                                "flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br",
                                                PROVIDER_GRADIENTS[selectedProvider]
                                            )}>
                                                <ProviderIcon className="h-3 w-3 text-white" />
                                            </div>
                                            <span className="text-sm font-semibold text-[var(--ink-900)]">{providerName}</span>
                                        </div>
                                    </div>
                                </div>

                                <div className="flex items-center justify-center gap-2 text-[11px] text-[var(--ink-soft)]">
                                    <ShieldCheck className="h-3.5 w-3.5" />
                                    <span>Paiement sécurisé et chiffré</span>
                                </div>
                            </div>
                        );
                    })()}
                </div>

                {/* Footer with actions */}
                <div className="px-6 pb-6 pt-0">
                    {step === 1 && (
                        <Button
                            className="h-9 w-full rounded-full bg-[var(--accent)] text-xs font-medium text-white hover:opacity-90"
                            disabled={!selectedPack}
                            onClick={() => setStep(2)}
                        >
                            Continuer
                        </Button>
                    )}

                    {step === 2 && (
                        <div className="flex gap-2">
                            <Button variant="outline" size="sm" className="h-9 flex-1 rounded-full text-xs" onClick={() => setStep(1)}>
                                Retour
                            </Button>
                            <Button
                                size="sm"
                                className="h-9 flex-1 rounded-full bg-[var(--accent)] text-xs font-medium text-white hover:opacity-90"
                                disabled={!selectedProvider}
                                onClick={() => setStep(3)}
                            >
                                Continuer
                            </Button>
                        </div>
                    )}

                    {step === 3 && selectedPack && (
                        <div className="flex gap-2">
                            <Button
                                variant="outline"
                                size="sm"
                                className="h-9 flex-1 rounded-full text-xs"
                                onClick={() => setStep(2)}
                                disabled={loading}
                            >
                                Retour
                            </Button>
                            <Button
                                size="sm"
                                className="h-9 flex-1 rounded-full bg-[var(--accent)] text-xs font-medium text-white hover:opacity-90"
                                onClick={handlePay}
                                disabled={loading}
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="mr-1.5 h-3.5 w-3.5 animate-spin" />
                                        Redirection…
                                    </>
                                ) : (
                                    <>Payer {selectedPack.label}</>
                                )}
                            </Button>
                        </div>
                    )}
                </div>
            </DialogContent>
        </Dialog>
    );
}
