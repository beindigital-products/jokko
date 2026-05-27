"use client";

import { useState } from "react";
import Link from "next/link";
import { useAuthActions } from "@convex-dev/auth/react";
import * as Sentry from "@sentry/nextjs";
import { motion } from "framer-motion";
import {
    AlertCircle,
    ArrowLeft,
    ArrowRight,
    CheckCircle2,
    KeyRound,
    Loader2,
    Mail,
    ShieldCheck,
    Sparkles,
    Timer,
} from "lucide-react";
import { SplitText } from "@/components/animations/split-text";

export default function ForgotPasswordContent() {
    const { signIn } = useAuthActions();
    const [loading, setLoading] = useState(false);
    const [sent, setSent] = useState(false);
    const [sentEmail, setSentEmail] = useState<string>("");
    const [error, setError] = useState<string | null>(null);

    async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault();
        if (loading) return;
        setError(null);

        const formData = new FormData(e.currentTarget);
        const rawEmail = (formData.get("email") as string | null) ?? "";
        const email = rawEmail.trim().toLowerCase();

        if (!email || !email.includes("@")) {
            setError("Renseignez une adresse e-mail valide.");
            return;
        }

        setLoading(true);
        Sentry.addBreadcrumb({
            category: "auth",
            type: "user",
            level: "info",
            message: "password-reset request",
        });

        try {
            const payload = new FormData();
            payload.set("email", email);
            payload.set("flow", "reset");
            payload.set(
                "redirectTo",
                `/auth/reset-password?email=${encodeURIComponent(email)}`,
            );
            await signIn("password", payload);
            setSentEmail(email);
            setSent(true);
        } catch (err) {
            setSentEmail(email);
            setSent(true);
            Sentry.captureMessage("password-reset request failed", {
                level: "warning",
                tags: { feature: "auth", flow: "reset" },
            });
            if (process.env.NODE_ENV !== "production") {
                console.error("Password reset request error:", err);
            }
        } finally {
            setLoading(false);
        }
    }

    return (
        <div className="grid min-h-screen lg:grid-cols-[1.05fr_1fr]">
            <RecoveryBrandingPanel />

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
                            Mot de passe · Récupération
                        </p>
                        <h1 className="mt-3 font-display text-3xl font-bold tracking-tight md:text-4xl">
                            {sent ? (
                                <SplitText>Vérifiez vos mails.</SplitText>
                            ) : (
                                <SplitText>On vous renvoie ça.</SplitText>
                            )}
                        </h1>
                        <p className="mt-3 text-sm leading-relaxed text-muted-foreground">
                            {sent
                                ? "Si un compte existe pour cette adresse, un lien sécurisé valide 30 minutes vient d'être envoyé."
                                : "Saisissez l'e-mail de votre compte. Nous envoyons un lien sécurisé valide 30 minutes."}
                        </p>
                    </motion.div>

                    {error && !sent && (
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

                    {sent ? (
                        <motion.div
                            initial={{ opacity: 0, y: 8 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.5, delay: 0.15 }}
                            className="mt-8 space-y-5"
                            role="status"
                        >
                            <div className="flex items-start gap-3 rounded-xl border border-emerald-500/20 bg-emerald-500/[0.06] p-4 text-sm text-emerald-700 dark:text-emerald-300">
                                <CheckCircle2 className="mt-0.5 h-4 w-4 shrink-0" />
                                <div className="space-y-1">
                                    <p className="font-semibold">
                                        E-mail envoyé
                                        {sentEmail ? (
                                            <>
                                                {" "}
                                                à{" "}
                                                <span className="font-mono text-[12px]">
                                                    {sentEmail}
                                                </span>
                                            </>
                                        ) : null}
                                    </p>
                                    <p className="text-emerald-700/80 dark:text-emerald-300/80">
                                        Pensez à vérifier vos spams si rien
                                        n&apos;arrive sous 5 minutes.
                                    </p>
                                </div>
                            </div>

                            <div className="flex flex-col gap-2 sm:flex-row">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setSent(false);
                                        setError(null);
                                    }}
                                    className="inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl border border-border/60 bg-card px-4 text-sm font-medium text-foreground transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:text-[var(--accent)]"
                                >
                                    Modifier l&apos;e-mail
                                </button>
                                <Link
                                    href="/auth/sign-in"
                                    className="group inline-flex h-11 flex-1 items-center justify-center gap-1.5 rounded-xl bg-[var(--accent)] px-4 text-sm font-semibold text-white shadow-[0_10px_30px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)]"
                                >
                                    Retour à la connexion
                                    <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                </Link>
                            </div>
                        </motion.div>
                    ) : (
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
                                id="email"
                                name="email"
                                type="email"
                                label="E-mail du compte"
                                placeholder="vous@entreprise.com"
                                autoComplete="email"
                                required
                                aria-invalid={error ? true : undefined}
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
                                    data-testid="forgot-password-submit"
                                    className="group relative mt-2 inline-flex h-12 w-full items-center justify-center gap-2 overflow-hidden rounded-xl bg-[var(--accent)] text-sm font-semibold text-white shadow-[0_10px_30px_-8px_var(--accent-glow)] transition-all hover:-translate-y-0.5 hover:bg-[var(--accent-hover)] disabled:cursor-not-allowed disabled:opacity-60"
                                >
                                    <span
                                        aria-hidden
                                        className="absolute inset-0 -translate-x-full bg-gradient-to-r from-transparent via-white/20 to-transparent transition-transform duration-1000 group-hover:translate-x-full"
                                    />
                                    {loading ? (
                                        <>
                                            <Loader2 className="h-4 w-4 animate-spin" />
                                            Envoi…
                                        </>
                                    ) : (
                                        <>
                                            <Mail className="h-4 w-4" />
                                            Envoyer le lien sécurisé
                                            <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
                                        </>
                                    )}
                                </button>
                            </motion.div>
                        </motion.form>
                    )}

                    <motion.p
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.6, delay: 0.8 }}
                        className="mt-8 text-center text-sm text-muted-foreground"
                    >
                        Vous vous souvenez de votre mot de passe ?{" "}
                        <Link
                            href="/auth/sign-in"
                            className="font-semibold text-[var(--accent)] underline-offset-4 hover:underline"
                        >
                            Se connecter →
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
                            Lien à usage unique
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                        <span className="flex items-center gap-1.5">
                            <Timer className="h-3 w-3" />
                            Expire en 30 min
                        </span>
                        <span className="h-0.5 w-0.5 rounded-full bg-border" />
                        <span>TLS 1.3</span>
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
                    className="peer h-12 w-full rounded-xl border border-border/60 bg-card px-4 pr-10 text-sm transition-all placeholder:text-muted-foreground/70 focus:border-[var(--accent)] focus:outline-none focus:ring-4 focus:ring-[var(--accent-muted)]"
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

function RecoveryBrandingPanel() {
    const steps = [
        {
            icon: Mail,
            index: "01",
            title: "Saisissez votre e-mail",
            desc: "Celui associé à votre espace Jokko.",
        },
        {
            icon: KeyRound,
            index: "02",
            title: "Recevez un lien sécurisé",
            desc: "Usage unique, expire après 30 minutes.",
        },
        {
            icon: ShieldCheck,
            index: "03",
            title: "Définissez un nouveau mot de passe",
            desc: "10 caractères, majuscule, minuscule, chiffre.",
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
                            Sécurité · 3 étapes
                        </p>
                        <h2 className="mt-4 font-display text-4xl font-bold leading-[1.1] tracking-tight md:text-5xl">
                            <SplitText>Reprenez la main,</SplitText>
                            <br />
                            <span className="bg-gradient-to-br from-white via-white to-[var(--accent)] bg-clip-text text-transparent">
                                <SplitText delay={0.3}>
                                    en toute sérénité.
                                </SplitText>
                            </span>
                        </h2>
                        <p className="mt-6 max-w-md text-[15px] leading-relaxed text-[var(--surface-dark-muted-foreground)]">
                            Vos conversations vous attendent. Trois étapes
                            suffisent pour retrouver l&apos;accès à votre espace
                            équipe, sans compromettre la sécurité.
                        </p>
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
                        className="relative mt-12 max-w-md space-y-5"
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
                                <span className="relative z-10 flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-white/15 bg-white/[0.04] backdrop-blur-sm">
                                    <step.icon className="h-5 w-5 text-[var(--accent)]" />
                                </span>
                                <div className="flex-1 pt-0.5">
                                    <div className="flex items-center gap-2">
                                        <span className="font-mono text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                                            {step.index}
                                        </span>
                                        <span className="h-px flex-1 bg-white/10" />
                                    </div>
                                    <p className="mt-1.5 font-display text-base font-semibold text-white">
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
                    <MiniStat value="30 min" label="Validité du lien" />
                    <MiniStat value="1 usage" label="Lien à usage unique" />
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
