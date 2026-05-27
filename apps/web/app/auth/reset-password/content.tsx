"use client";

import * as React from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useAuthActions } from "@convex-dev/auth/react";
import * as Sentry from "@sentry/nextjs";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    Check,
    Eye,
    EyeOff,
    KeyRound,
    Loader2,
    Lock,
    ShieldCheck,
    Sparkles,
    Timer,
} from "lucide-react";
import { SplitText } from "@/components/animations/split-text";

export default function ResetPasswordContent() {
    const params = useSearchParams();
    const emailFromUrl = params.get("email") ?? "";
    const codeFromUrl = params.get("code") ?? "";
    const needsManualCode = !codeFromUrl;

    const { signIn } = useAuthActions();
    const [loading, setLoading] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);
    const [showPassword, setShowPassword] = React.useState(false);
    const [showConfirm, setShowConfirm] = React.useState(false);
    const [password, setPassword] = React.useState("");

    const rules = React.useMemo(() => {
        return {
            length: password.length >= 10,
            upper: /[A-Z]/.test(password),
            lower: /[a-z]/.test(password),
            digit: /[0-9]/.test(password),
        };
    }, [password]);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setError(null);

        const formData = new FormData(e.currentTarget);
        const email = ((formData.get("email") as string | null) ?? "")
            .trim()
            .toLowerCase();
        const code = ((formData.get("code") as string | null) ?? "").trim();
        const newPassword =
            (formData.get("newPassword") as string | null) ?? "";
        const confirmPassword =
            (formData.get("confirmPassword") as string | null) ?? "";

        if (!email || !email.includes("@")) {
            setError("Renseignez l'e-mail du compte.");
            return;
        }
        if (code.length < 4) {
            setError("Le code de réinitialisation est incomplet.");
            return;
        }
        if (newPassword.length < 10) {
            setError("Le mot de passe doit contenir au moins 10 caractères.");
            return;
        }
        if (
            !/[A-Z]/.test(newPassword) ||
            !/[a-z]/.test(newPassword) ||
            !/[0-9]/.test(newPassword)
        ) {
            setError(
                "Le mot de passe doit contenir au moins une majuscule, une minuscule et un chiffre.",
            );
            return;
        }
        if (newPassword !== confirmPassword) {
            setError("Les mots de passe ne correspondent pas.");
            return;
        }

        setLoading(true);
        Sentry.addBreadcrumb({
            category: "auth",
            type: "user",
            level: "info",
            message: "password-reset confirm",
        });

        try {
            const payload = new FormData();
            payload.set("email", email);
            payload.set("code", code);
            payload.set("newPassword", newPassword);
            payload.set("flow", "reset-verification");
            await signIn("password", payload);
            window.location.assign("/auth/sign-in?reset=success");
        } catch (err) {
            setError("Lien expiré ou code invalide. Demandez un nouveau lien.");
            Sentry.captureMessage("password-reset verification failed", {
                level: "warning",
                tags: { feature: "auth", flow: "reset-verification" },
            });
            if (process.env.NODE_ENV !== "production") {
                console.error("Password reset confirm error:", err);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
            <SecurityBrandingPanel rules={rules} />

            <main className="relative flex items-center justify-center px-6 py-12 sm:px-10">
                <Link
                    href="/auth/sign-in"
                    className="absolute left-6 top-6 inline-flex items-center gap-1.5 rounded-full border border-border/60 bg-card px-3 py-1.5 font-mono text-[10px] uppercase tracking-wider text-muted-foreground transition-all hover:-translate-x-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)] sm:left-10 sm:top-10"
                >
                    <ArrowLeft className="h-3 w-3" />
                    Retour à la connexion
                </Link>

                <div className="w-full max-w-md">
                    <div className="mb-10 lg:hidden">
                        <MobileLogo />
                    </div>

                    <motion.div
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
                    >
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Mot de passe · Nouveau mot de passe
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            <SplitText>Plus qu&apos;une étape.</SplitText>
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            Choisissez un mot de passe robuste. 10 caractères
                            minimum, avec une majuscule, une minuscule et un
                            chiffre.
                        </p>
                    </motion.div>

                    {error && (
                        <motion.div
                            initial={{ opacity: 0, y: -6 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="mt-6 flex items-start gap-2.5 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] p-3.5 text-sm text-rose-600 dark:text-rose-400"
                            role="alert"
                        >
                            <AlertCircle className="mt-0.5 h-4 w-4 shrink-0" />
                            <p>{error}</p>
                        </motion.div>
                    )}

                    <motion.form
                        onSubmit={handleSubmit}
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.06,
                                    delayChildren: 0.25,
                                },
                            },
                        }}
                        className="mt-8 space-y-4"
                        noValidate
                    >
                        <AuthField
                            id="reset-email"
                            name="email"
                            type="email"
                            label="E-mail du compte"
                            placeholder="vous@entreprise.com"
                            autoComplete="email"
                            defaultValue={emailFromUrl}
                            required
                            aria-invalid={error ? true : undefined}
                        />

                        {needsManualCode ? (
                            <AuthField
                                id="reset-code"
                                name="code"
                                type="text"
                                label="Code reçu par e-mail"
                                placeholder="123456"
                                autoComplete="one-time-code"
                                inputMode="numeric"
                                defaultValue={codeFromUrl}
                                required
                                className="font-mono"
                                aria-invalid={error ? true : undefined}
                            />
                        ) : (
                            <input
                                type="hidden"
                                name="code"
                                value={codeFromUrl}
                            />
                        )}

                        <AuthField
                            id="reset-new-password"
                            name="newPassword"
                            type={showPassword ? "text" : "password"}
                            label="Nouveau mot de passe"
                            placeholder="••••••••••"
                            autoComplete="new-password"
                            required
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            aria-invalid={error ? true : undefined}
                            suffix={
                                <button
                                    type="button"
                                    onClick={() =>
                                        setShowPassword((s) => !s)
                                    }
                                    aria-label={
                                        showPassword ? "Masquer" : "Afficher"
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                                >
                                    {showPassword ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                        />

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 8 },
                                visible: { opacity: 1, y: 0 },
                            }}
                            className="grid grid-cols-2 gap-x-3 gap-y-1.5 rounded-xl border border-border/40 bg-card/50 p-3"
                            aria-live="polite"
                        >
                            <RuleItem ok={rules.length} label="10 caractères" />
                            <RuleItem ok={rules.upper} label="Une majuscule" />
                            <RuleItem ok={rules.lower} label="Une minuscule" />
                            <RuleItem ok={rules.digit} label="Un chiffre" />
                        </motion.div>

                        <AuthField
                            id="reset-confirm-password"
                            name="confirmPassword"
                            type={showConfirm ? "text" : "password"}
                            label="Confirmation"
                            placeholder="••••••••••"
                            autoComplete="new-password"
                            required
                            aria-invalid={error ? true : undefined}
                            suffix={
                                <button
                                    type="button"
                                    onClick={() => setShowConfirm((s) => !s)}
                                    aria-label={
                                        showConfirm ? "Masquer" : "Afficher"
                                    }
                                    className="text-muted-foreground transition-colors hover:text-foreground focus:outline-none"
                                >
                                    {showConfirm ? (
                                        <EyeOff className="h-4 w-4" />
                                    ) : (
                                        <Eye className="h-4 w-4" />
                                    )}
                                </button>
                            }
                        />

                        <motion.div
                            variants={{
                                hidden: { opacity: 0, y: 8 },
                                visible: { opacity: 1, y: 0 },
                            }}
                        >
                            <button
                                type="submit"
                                disabled={loading}
                                data-testid="reset-password-submit"
                                className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_10px_30px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                            >
                                <span
                                    aria-hidden
                                    className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                                />
                                {loading ? (
                                    <>
                                        <Loader2 className="h-4 w-4 animate-spin" />
                                        Validation…
                                    </>
                                ) : (
                                    <>
                                        <Lock className="h-4 w-4" />
                                        Réinitialiser le mot de passe
                                        <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                    </>
                                )}
                            </button>
                        </motion.div>
                    </motion.form>

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-8 text-center text-sm text-muted-foreground"
                    >
                        Lien expiré ?{" "}
                        <Link
                            href="/auth/forgot-password"
                            className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                            Demander un nouveau lien →
                        </Link>
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 1 }}
                        className="mt-10 flex items-center justify-center gap-3 border-t border-border/40 pt-6 font-mono text-[10px] uppercase tracking-wider text-muted-foreground"
                    >
                        <span className="flex items-center gap-1.5">
                            <ShieldCheck className="h-3 w-3" />
                            Chiffrement bcrypt
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5">
                            <Timer className="h-3 w-3" />
                            Sessions actives révoquées
                        </span>
                    </motion.div>
                </div>
            </main>
        </div>
    );
}

function AuthField({
    id,
    name,
    type,
    label,
    placeholder,
    autoComplete,
    required,
    topRight,
    suffix,
    className,
    ...rest
}: {
    id: string;
    name: string;
    type: string;
    label: string;
    placeholder: string;
    autoComplete?: string;
    required?: boolean;
    topRight?: React.ReactNode;
    suffix?: React.ReactNode;
} & React.InputHTMLAttributes<HTMLInputElement>) {
    return (
        <motion.div
            variants={{
                hidden: { opacity: 0, y: 8 },
                visible: { opacity: 1, y: 0 },
            }}
        >
            <div className="mb-1.5 flex items-center justify-between">
                <label
                    htmlFor={id}
                    className="font-mono text-[10px] font-semibold uppercase tracking-wider text-muted-foreground"
                >
                    {label}
                </label>
                {topRight}
            </div>
            <div className="group relative">
                <input
                    id={id}
                    name={name}
                    type={type}
                    placeholder={placeholder}
                    autoComplete={autoComplete}
                    required={required}
                    className={
                        "peer h-12 w-full rounded-xl border border-border/60 bg-card px-4 pr-10 text-sm transition-all placeholder:text-muted-foreground/70 focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-muted)]" +
                        (className ? ` ${className}` : "")
                    }
                    {...rest}
                />
                {suffix && (
                    <div className="absolute right-3 top-1/2 -translate-y-1/2">
                        {suffix}
                    </div>
                )}
            </div>
        </motion.div>
    );
}

function RuleItem({ ok, label }: { ok: boolean; label: string }) {
    return (
        <div
            className={
                "flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider transition-colors " +
                (ok
                    ? "text-emerald-600 dark:text-emerald-400"
                    : "text-muted-foreground")
            }
        >
            <span
                aria-hidden
                className={
                    "flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full transition-colors " +
                    (ok
                        ? "bg-emerald-500/20 text-emerald-600 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground/60")
                }
            >
                <Check className="h-2.5 w-2.5" />
            </span>
            {label}
        </div>
    );
}

function MobileLogo() {
    return (
        <Link href="/" className="inline-flex items-center gap-2.5">
            <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]">
                J
            </span>
            <span className="font-display text-xl font-semibold tracking-tight">
                Jokko
            </span>
        </Link>
    );
}

function SecurityBrandingPanel({
    rules,
}: {
    rules: {
        length: boolean;
        upper: boolean;
        lower: boolean;
        digit: boolean;
    };
}) {
    const validCount = Object.values(rules).filter(Boolean).length;
    const progress = (validCount / 4) * 100;

    const steps = [
        {
            icon: Check,
            index: "01",
            title: "Demande reçue",
            desc: "Lien envoyé sur votre boîte mail.",
            done: true,
        },
        {
            icon: Check,
            index: "02",
            title: "Lien vérifié",
            desc: "Code de récupération validé.",
            done: true,
        },
        {
            icon: KeyRound,
            index: "03",
            title: "Nouveau mot de passe",
            desc: "Vous y êtes presque.",
            done: false,
        },
    ];

    return (
        <aside className="relative hidden overflow-hidden bg-[var(--surface-dark)] text-[var(--surface-dark-foreground)] lg:flex lg:flex-col">
            <div
                aria-hidden
                className="pointer-events-none absolute inset-0 opacity-[0.06]"
                style={{
                    backgroundImage:
                        "radial-gradient(circle at 1px 1px, rgba(255,255,255,0.9) 1px, transparent 0)",
                    backgroundSize: "28px 28px",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -left-40 top-20 h-[600px] w-[800px] opacity-40 blur-[140px]"
                style={{
                    background:
                        "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)",
                }}
            />
            <div
                aria-hidden
                className="pointer-events-none absolute -bottom-40 -right-40 h-[500px] w-[600px] opacity-25 blur-[120px]"
                style={{
                    background:
                        "radial-gradient(circle, rgba(236, 72, 153, 0.6) 0%, transparent 70%)",
                }}
            />

            <div className="relative flex h-full flex-col p-10">
                <Link href="/" className="inline-flex items-center gap-2.5">
                    <span className="relative flex h-9 w-9 items-center justify-center rounded-xl bg-gradient-to-br from-[var(--accent)] to-[var(--accent-hover)] text-sm font-bold text-white shadow-[0_8px_24px_-6px_var(--accent-glow)]">
                        J
                    </span>
                    <span className="font-display text-xl font-semibold tracking-tight text-white">
                        Jokko
                    </span>
                </Link>

                <div className="flex flex-1 flex-col justify-center">
                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <p className="font-mono text-[11px] uppercase tracking-[0.25em] text-[var(--accent)]">
                            Sécurité · Étape 3/3
                        </p>
                        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
                            <SplitText>Un mot de passe</SplitText>
                            <br />
                            <span className="bg-gradient-to-br from-white via-white to-[var(--accent)] bg-clip-text text-transparent">
                                <SplitText delay={0.3}>
                                    digne de votre équipe.
                                </SplitText>
                            </span>
                        </h2>
                        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                            Vos conversations contiennent les échanges de toute
                            l&apos;équipe. Choisissez un mot de passe que vous
                            n&apos;utilisez nulle part ailleurs.
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 16 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.45 }}
                        className="mt-10 max-w-md"
                    >
                        <div className="flex items-center justify-between font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                            <span>Robustesse</span>
                            <span className="text-[var(--accent)]">
                                {validCount}/4 critères
                            </span>
                        </div>
                        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-white/10">
                            <motion.div
                                className="h-full rounded-full bg-gradient-to-r from-[var(--accent)] to-emerald-400"
                                initial={{ width: 0 }}
                                animate={{ width: `${progress}%` }}
                                transition={{
                                    duration: 0.4,
                                    ease: [0.22, 1, 0.36, 1],
                                }}
                            />
                        </div>
                    </motion.div>

                    <motion.ol
                        initial="hidden"
                        animate="visible"
                        variants={{
                            hidden: { opacity: 0 },
                            visible: {
                                opacity: 1,
                                transition: {
                                    staggerChildren: 0.12,
                                    delayChildren: 0.55,
                                },
                            },
                        }}
                        className="relative mt-10 max-w-md space-y-5"
                    >
                        <span
                            aria-hidden
                            className="absolute left-[22px] top-3 bottom-3 w-px bg-gradient-to-b from-white/20 via-white/10 to-transparent"
                        />
                        {steps.map((step) => (
                            <motion.li
                                key={step.index}
                                variants={{
                                    hidden: { opacity: 0, x: -12 },
                                    visible: { opacity: 1, x: 0 },
                                }}
                                className="relative flex items-start gap-4"
                            >
                                <span
                                    className={
                                        "relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border backdrop-blur-sm " +
                                        (step.done
                                            ? "border-emerald-400/30 bg-emerald-400/10"
                                            : "border-[var(--accent)]/40 bg-[var(--accent)]/15")
                                    }
                                >
                                    <step.icon
                                        className={
                                            "h-5 w-5 " +
                                            (step.done
                                                ? "text-emerald-300"
                                                : "text-[var(--accent)]")
                                        }
                                    />
                                </span>
                                <div className="flex-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className={
                                                "font-mono text-[10px] font-semibold uppercase tracking-wider " +
                                                (step.done
                                                    ? "text-emerald-300"
                                                    : "text-[var(--accent)]")
                                            }
                                        >
                                            {step.index}
                                        </span>
                                        <span className="h-px flex-1 bg-white/10" />
                                    </div>
                                    <p
                                        className={
                                            "mt-1.5 font-display text-base font-semibold " +
                                            (step.done
                                                ? "text-white/70 line-through decoration-white/30"
                                                : "text-white")
                                        }
                                    >
                                        {step.title}
                                    </p>
                                    <p className="mt-0.5 text-[13px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                                        {step.desc}
                                    </p>
                                </div>
                            </motion.li>
                        ))}
                    </motion.ol>
                </div>

                <motion.div
                    initial={{ opacity: 0, y: 16 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 1 }}
                    className="mt-10 grid grid-cols-3 gap-4 border-t border-white/10 pt-8"
                >
                    <MiniStat value="bcrypt" label="Hachage" />
                    <MiniStat value="Auto" label="Sessions révoquées" />
                    <MiniStat value="UE" label="Hébergement RGPD" />
                </motion.div>

                <div className="mt-8 flex items-center gap-2 font-mono text-[10px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                    <Sparkles className="h-3 w-3 text-[var(--accent)]" />
                    Paris · Dakar · Remote-first
                </div>
            </div>
        </aside>
    );
}

function MiniStat({ value, label }: { value: string; label: string }) {
    return (
        <div>
            <p className="font-display text-xl font-bold text-white">{value}</p>
            <p className="mt-0.5 font-mono text-[9px] uppercase tracking-wider text-[var(--surface-dark-muted-foreground)]">
                {label}
            </p>
        </div>
    );
}
