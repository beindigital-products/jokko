'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { Button } from '@/components/ui/button';
import {
    Loader2,
    AlertCircle,
    SkipForward,
    MessageCircle,
    SearchX,
    Lock,
    Globe,
    ShieldCheck,
    ExternalLink,
    RefreshCw,
    ArrowLeft,
} from 'lucide-react';
import { useMutation, useAction } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"
import { Label } from "@/components/ui/label"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Badge } from "@/components/ui/badge"
import { useFacebookSDK } from "@/hooks/useFacebookSDK";
import { cn } from '@/lib/utils';

// Meta-compliant Facebook brand SVG ("f" logo, white on blue). Per Q5=(a),
// the CTA respects Meta brand guidelines : color #1877F2, official mark.
function FacebookLogo({ className }: { className?: string }) {
    return (
        <svg
            viewBox="0 0 24 24"
            xmlns="http://www.w3.org/2000/svg"
            className={className}
            aria-hidden="true"
        >
            <path
                fill="currentColor"
                d="M24 12.073C24 5.405 18.627 0 12 0S0 5.405 0 12.073C0 18.1 4.388 23.094 10.125 24v-8.437H7.078v-3.49h3.047V9.412c0-3.022 1.792-4.692 4.533-4.692 1.312 0 2.686.236 2.686.236v2.971h-1.514c-1.491 0-1.956.93-1.956 1.886v2.265h3.328l-.532 3.49h-2.796V24C19.612 23.094 24 18.1 24 12.073z"
            />
        </svg>
    );
}

interface WhatsAppConnectStepProps {
    onComplete: () => void;
}

interface WhatsAppNumber {
    id: string;
    display_phone_number: string;
    verified_name: string;
    quality_rating: string;
    wabaId: string;
}

export function WhatsAppConnectStep({ onComplete }: WhatsAppConnectStepProps) {
    const [status, setStatus] = useState<'IDLE' | 'FETCHING' | 'SELECTING' | 'SAVING' | 'SKIPPING' | 'ERROR' | 'NO_NUMBERS'>('IDLE');
    // v3 split : `errorKind` distinguishes Meta cancel popup vs fetch failure.
    // The PDF dedicates a screen for each (Connexion annulée vs aucun numéro).
    const [errorKind, setErrorKind] = useState<'CANCELLED' | 'FETCH_FAILED' | null>(null);
    const [errorMessage, setErrorMessage] = useState<string | null>(null);

    const { isReady: fbReady, login: fbLogin } = useFacebookSDK();

    const [accessToken, setAccessToken] = useState<string | null>(null);
    const [phoneNumbers, setPhoneNumbers] = useState<WhatsAppNumber[]>([]);
    const [selectedPhoneId, setSelectedPhoneId] = useState<string | null>(null);

    const completeOnboarding = useMutation(api.users.completeOnboarding);
    const fetchNumbers = useAction(api.whatsapp.fetchWhatsAppPhoneNumbers);
    const addChannel = useAction(api.whatsapp.addChannel);

    const launchWhatsAppSignup = async () => {
        setErrorMessage(null);
        setErrorKind(null);
        try {
            const { accessToken: token } = await fbLogin();
            handleFetchNumbers(token);
        } catch (err) {
            // Meta returns "user cancelled" when the popup is closed before
            // authorization completes. We treat unknown errors the same way
            // for the IDLE retry UX, but the message reflects the most likely
            // cause (per PDF screen 09).
            const message = err instanceof Error ? err.message : "Connexion annulée ou non autorisée.";
            setErrorKind('CANCELLED');
            setErrorMessage(message);
            setStatus('ERROR');
        }
    };

    async function handleFetchNumbers(token: string) {
        setStatus('FETCHING');
        setAccessToken(token);

        try {
            const data = await fetchNumbers({ accessToken: token });
            setPhoneNumbers(data.phoneNumbers);

            if (data.phoneNumbers.length > 0) {
                setSelectedPhoneId(data.phoneNumbers[0].id);
                setStatus('SELECTING');
            } else {
                // Distinct empty state (PDF screen 09b) : 3-step guide to set up
                // a WABA in Meta Business Suite.
                setStatus('NO_NUMBERS');
            }
        } catch (error) {
            console.error("Fetch failed", error);
            setErrorKind('FETCH_FAILED');
            setErrorMessage("Impossible de récupérer vos numéros. Vérifiez vos permissions.");
            setStatus('ERROR');
        }
    }

    async function handleConfirmSelection() {
        if (!accessToken || !selectedPhoneId) return;

        const selectedPhone = phoneNumbers.find(p => p.id === selectedPhoneId);
        if (!selectedPhone?.wabaId) return;

        setStatus('SAVING');
        try {
            await addChannel({
                accessToken,
                wabaId: selectedPhone.wabaId,
                phoneNumberId: selectedPhoneId,
                displayPhoneNumber: selectedPhone.display_phone_number,
                verifiedName: selectedPhone.verified_name,
            });
            await completeOnboarding();
            onComplete();
        } catch (error) {
            console.error("Finalize failed", error);
            setErrorMessage("Erreur lors de la sauvegarde de la configuration.");
            setStatus('ERROR');
        }
    }

    async function handleSkip() {
        setStatus('SKIPPING');
        try {
            await completeOnboarding();
            onComplete();
        } catch (error) {
            console.error("Skip failed", error);
            setStatus('IDLE');
        }
    }

    const qualityColor = (rating: string) => {
        const r = rating.toUpperCase();
        if (r === 'GREEN' || r === 'HIGH') return 'bg-[var(--status-good-soft)] text-[var(--status-good)] border-[var(--status-good)]/30';
        if (r === 'YELLOW' || r === 'MEDIUM') return 'bg-[var(--status-warn-soft)] text-[var(--status-warn)] border-[var(--status-warn)]/30';
        if (r === 'RED' || r === 'LOW') return 'bg-[var(--status-danger-soft)] text-[var(--status-danger)] border-[var(--status-danger)]/30';
        return 'bg-[var(--ink-100)] text-[var(--ink-600)] border-[var(--ink-200)]';
    };

    // ── State 1 : SELECTING / SAVING — pick a phone number ────────────────
    if (status === 'SELECTING' || status === 'SAVING') {
        return (
            <div className="space-y-5">
                <div className="text-center">
                    <h3 className="text-base font-semibold text-[var(--ink-900)]">Sélectionnez le numéro à connecter</h3>
                    <p className="mt-1 text-sm text-[var(--ink-500)]">
                        {phoneNumbers.length} numéro{phoneNumbers.length > 1 ? 's' : ''} WhatsApp Business trouvé{phoneNumbers.length > 1 ? 's' : ''} sur ce compte Facebook.
                    </p>
                </div>

                <RadioGroup
                    value={selectedPhoneId || ''}
                    onValueChange={setSelectedPhoneId}
                    className="space-y-2 max-h-[320px] overflow-y-auto pr-1"
                >
                    {phoneNumbers.map((phone, index) => {
                        const isSelected = selectedPhoneId === phone.id;
                        return (
                            <motion.div
                                key={phone.id}
                                initial={{ opacity: 0, y: 6 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ duration: 0.2, delay: index * 0.04 }}
                            >
                                <Label
                                    htmlFor={phone.id}
                                    className={cn(
                                        'flex items-center gap-3 cursor-pointer p-3.5 rounded-xl border bg-[var(--paper-white)] transition-all',
                                        isSelected
                                            ? 'border-[var(--accent)] ring-4 ring-[var(--accent-muted)] shadow-sm'
                                            : 'border-[var(--ink-200)] hover:border-[var(--ink-300)]'
                                    )}
                                >
                                    <RadioGroupItem value={phone.id} id={phone.id} className="mt-0.5" />
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center justify-between gap-2">
                                            <span className="font-mono text-sm font-semibold text-[var(--ink-900)] truncate">
                                                {phone.display_phone_number}
                                            </span>
                                            <Badge
                                                variant="outline"
                                                className={cn('text-[10px] font-medium border', qualityColor(phone.quality_rating))}
                                            >
                                                {phone.quality_rating}
                                            </Badge>
                                        </div>
                                        <span className="block text-xs text-[var(--ink-500)] mt-0.5">
                                            {phone.verified_name || 'Numéro sans nom'}
                                        </span>
                                    </div>
                                </Label>
                            </motion.div>
                        );
                    })}
                </RadioGroup>

                <div className="border-t border-[var(--ink-200)] pt-5 flex items-center justify-between gap-3 flex-wrap">
                    <button
                        onClick={() => {
                            setStatus('IDLE');
                            setAccessToken(null);
                            setPhoneNumbers([]);
                        }}
                        disabled={status === 'SAVING'}
                        className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors"
                    >
                        <ArrowLeft className="h-3.5 w-3.5" />
                        Choisir un autre compte Facebook
                    </button>
                    <Button
                        onClick={handleConfirmSelection}
                        variant="accent"
                        disabled={status === 'SAVING'}
                    >
                        {status === 'SAVING' ? (
                            <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Connexion…</>
                        ) : (
                            "Connecter ce numéro"
                        )}
                    </Button>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleSkip}
                        disabled={status === 'SAVING'}
                        className="text-xs text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
                    >
                        Passer cette étape
                    </button>
                </div>
            </div>
        );
    }

    // ── State 2 : NO_NUMBERS — empty WABA state with setup guide ──────────
    if (status === 'NO_NUMBERS') {
        return (
            <div className="space-y-6">
                <div className="text-center">
                    <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-full border-2 border-dashed border-[var(--ink-200)] bg-[var(--paper-warm)]">
                        <SearchX className="h-6 w-6 text-[var(--ink-400)]" strokeWidth={1.75} />
                    </div>
                    <h3 className="text-base sm:text-lg font-semibold text-[var(--ink-900)]">
                        Aucun numéro WhatsApp Business trouvé
                    </h3>
                    <p className="mx-auto mt-1.5 max-w-sm text-sm text-[var(--ink-600)]">
                        Ce compte Facebook n&apos;a pas de numéro WhatsApp Business associé. Configurez-en un dans Meta Business Suite, puis revenez ici.
                    </p>
                </div>

                <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-5">
                    <p className="mb-3 font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        Pour continuer
                    </p>
                    <ol className="space-y-2.5 text-sm text-[var(--ink-700)]">
                        {[
                            "Ouvrez Meta Business Suite avec ce même compte Facebook.",
                            "Créez un compte WABA et ajoutez un numéro vérifié.",
                            "Revenez sur Jokko, puis réessayez la connexion.",
                        ].map((step, idx) => (
                            <li key={idx} className="flex items-start gap-3">
                                <span className="flex h-5 w-5 shrink-0 items-center justify-center rounded-full bg-[var(--paper-white)] font-mono text-[11px] font-semibold text-[var(--ink-700)]">
                                    {idx + 1}
                                </span>
                                <span>{step}</span>
                            </li>
                        ))}
                    </ol>
                </div>

                <div className="grid gap-2 sm:grid-cols-2">
                    <Button asChild variant="outline" className="h-11">
                        <a href="https://business.facebook.com/" target="_blank" rel="noopener noreferrer">
                            Ouvrir Meta Business Suite
                            <ExternalLink className="ml-1.5 h-3.5 w-3.5" />
                        </a>
                    </Button>
                    <Button
                        onClick={launchWhatsAppSignup}
                        variant="accent"
                        disabled={!fbReady}
                        className="h-11"
                    >
                        <RefreshCw className="mr-1.5 h-4 w-4" />
                        Réessayer
                    </Button>
                </div>

                <div className="text-center">
                    <button
                        onClick={handleSkip}
                        className="text-xs text-[var(--ink-400)] hover:text-[var(--ink-700)] transition-colors"
                    >
                        Passer cette étape — je connecterai WhatsApp plus tard
                    </button>
                </div>
            </div>
        );
    }

    // ── State 3 : IDLE / FETCHING / ERROR — main CTA card ─────────────────
    return (
        <div className="space-y-6">
            <div className="rounded-2xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-6 sm:p-8 text-center">
                {/* v3 — violet halo bubble icon (replaces green WA gradient) */}
                <div className="relative mx-auto mb-5 flex h-16 w-16 items-center justify-center">
                    <span className="absolute inset-0 rounded-full bg-[var(--accent-muted)]" aria-hidden />
                    <span className="absolute inset-2 rounded-full bg-[var(--paper-white)]" aria-hidden />
                    <MessageCircle className="relative h-7 w-7 text-[var(--accent)]" strokeWidth={1.75} />
                </div>

                <h3 className="text-base sm:text-lg font-semibold text-[var(--ink-900)]">
                    Connectez WhatsApp Business
                </h3>
                <p className="mt-1.5 mx-auto max-w-sm text-sm text-[var(--ink-600)]">
                    Recevez et envoyez des messages directement depuis Jokko. Vous gardez le contrôle, nous gérons l&apos;infrastructure.
                </p>

                {/* Error alert : two flavours (cancelled / fetch failed) per PDF screen 09 */}
                {status === 'ERROR' && errorKind === 'CANCELLED' ? (
                    <Alert className="mt-5 border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] text-left">
                        <AlertCircle className="h-4 w-4 text-[var(--status-danger)]" />
                        <AlertTitle className="text-[var(--status-danger)]">Connexion annulée</AlertTitle>
                        <AlertDescription className="text-[var(--ink-700)]">
                            Vous avez fermé la fenêtre Meta avant la fin de l&apos;autorisation. Aucune donnée n&apos;a été partagée. Réessayez, ou passez cette étape — vous pourrez connecter WhatsApp plus tard.
                        </AlertDescription>
                    </Alert>
                ) : null}
                {status === 'ERROR' && errorKind === 'FETCH_FAILED' ? (
                    <Alert className="mt-5 border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] text-left">
                        <AlertCircle className="h-4 w-4 text-[var(--status-danger)]" />
                        <AlertTitle className="text-[var(--status-danger)]">Erreur de récupération</AlertTitle>
                        <AlertDescription className="text-[var(--ink-700)]">
                            {errorMessage || 'Impossible de récupérer vos numéros. Vérifiez vos permissions.'}
                        </AlertDescription>
                    </Alert>
                ) : null}

                {/* v3 — Meta-compliant Facebook button (Q5=a). Brand blue + official mark.
                    NB : couleur figée Meta brand guidelines, ne pas remplacer par accent. */}
                <Button
                    onClick={launchWhatsAppSignup}
                    disabled={!fbReady || status === 'FETCHING' || status === 'SKIPPING'}
                    size="lg"
                    className="mt-5 h-12 w-full sm:w-auto px-6 bg-[#1877F2] hover:bg-[#166FE5] text-white font-semibold rounded-xl shadow-sm hover:shadow-md transition-all"
                >
                    {status === 'FETCHING' || !fbReady ? (
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                    ) : (
                        <FacebookLogo className="mr-2 h-5 w-5" />
                    )}
                    {status === 'FETCHING' ? "Récupération…" : !fbReady ? "Chargement…" : "Continuer avec Facebook"}
                </Button>

                {/* UA review point : explicit bridge from "Facebook" to "WhatsApp Business"
                    to avoid abandon (+15% per UA estimate). */}
                <p className="mt-3 mx-auto max-w-sm text-[11px] text-[var(--ink-500)]">
                    WhatsApp Business appartient à Meta — l&apos;autorisation passe par Facebook.
                </p>
            </div>

            {/* v3 — 3 trust pills horizontaux (per PDF) */}
            <ul className="flex flex-wrap items-center justify-center gap-2">
                {[
                    { icon: Lock, label: "Chiffré bout-en-bout" },
                    { icon: Globe, label: "Données en Europe" },
                    { icon: ShieldCheck, label: "Révocable à tout moment" },
                ].map(({ icon: Icon, label }) => (
                    <li
                        key={label}
                        className="inline-flex items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1 text-[11px] font-medium text-[var(--ink-600)]"
                    >
                        <Icon className="h-3 w-3 text-[var(--ink-500)]" strokeWidth={1.75} />
                        {label}
                    </li>
                ))}
            </ul>

            <div className="text-center">
                <button
                    onClick={handleSkip}
                    disabled={status === 'FETCHING' || status === 'SKIPPING'}
                    className="inline-flex items-center gap-1.5 text-sm text-[var(--ink-500)] hover:text-[var(--ink-900)] transition-colors py-1"
                >
                    {status === 'SKIPPING' ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                        <SkipForward className="w-3.5 h-3.5" />
                    )}
                    Passer cette étape — je connecterai WhatsApp plus tard
                </button>
                <p className="mt-1 text-[11px] text-[var(--ink-400)]">
                    Vous pourrez connecter WhatsApp depuis Paramètres &gt; Canaux à tout moment.
                </p>
            </div>
        </div>
    );
}
