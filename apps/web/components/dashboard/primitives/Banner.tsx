"use client"

import Link from "next/link"
import { cn } from "@/lib/utils"

// ── Tones ──────────────────────────────────────────────────────────────────

export type BannerTone =
    | "neutral"
    | "reminder"
    | "urgent"
    | "expired"
    | "warn"
    | "good"
export type BannerCtaTone = "primary" | "ink" | "danger" | "ghost"

/** Per-tone background / foreground / border. From the design's banner kit. */
const TONE: Record<BannerTone, { bg: string; fg: string; border: string }> = {
    neutral: { bg: "rgba(105,56,239,0.05)", fg: "#4F1FCF", border: "rgba(105,56,239,0.26)" },
    reminder: { bg: "rgba(105,56,239,0.08)", fg: "#4F1FCF", border: "rgba(105,56,239,0.26)" },
    urgent: { bg: "rgba(220,56,56,0.05)", fg: "#B82828", border: "rgba(220,56,56,0.30)" },
    expired: { bg: "rgba(220,56,56,0.08)", fg: "#B82828", border: "rgba(220,56,56,0.32)" },
    warn: { bg: "rgba(184,134,11,0.07)", fg: "#8E670B", border: "rgba(184,134,11,0.28)" },
    good: { bg: "rgba(19,138,78,0.07)", fg: "#138A4E", border: "rgba(19,138,78,0.26)" },
}

// ── CTA button ───────────────────────────────────────────────────────────────

export function BannerCta({
    tone,
    href,
    onClick,
    fg,
    border,
    className,
    children,
}: {
    tone: BannerCtaTone
    href?: string
    onClick?: () => void
    fg: string
    border: string
    className?: string
    children: React.ReactNode
}) {
    const base =
        "inline-flex h-9 items-center justify-center gap-2 px-4 text-[13px] font-medium tracking-tight whitespace-nowrap transition-colors"
    const byTone: Record<BannerCtaTone, string> = {
        primary: "bg-[var(--accent)] text-white hover:bg-[var(--accent-hover)]",
        ink: "bg-[var(--ink-900)] text-white hover:brightness-110",
        danger: "bg-[#DC3838] text-white shadow-[0_1px_2px_rgba(180,32,32,0.30),0_6px_18px_-6px_rgba(220,56,56,0.45)] hover:bg-[#c62f2f]",
        ghost: "border bg-transparent hover:bg-black/[0.03]",
    }
    const style = tone === "ghost" ? { color: fg, borderColor: border } : undefined
    const cls = cn(base, byTone[tone], className)
    return href ? (
        <Link href={href} className={cls} style={style}>
            {children}
        </Link>
    ) : (
        <button type="button" onClick={onClick} className={cls} style={style}>
            {children}
        </button>
    )
}

// ── Banner ───────────────────────────────────────────────────────────────────

export interface BannerProps {
    tone: BannerTone
    variant?: "page" | "sidebar"
    eyebrow: string
    /** Right-side text in the eyebrow row, e.g. "13 jours restants". */
    left?: string
    /** Elapsed fraction 0–1 for the slim progress bar. */
    progress?: number
    title: string
    body?: string
    cta?: string
    ctaTone?: BannerCtaTone
    ctaHref?: string
    onCtaClick?: () => void
    /** Optional secondary action (e.g. "Demander à l'admin"). */
    secondaryCta?: string
    secondaryHref?: string
    onSecondaryClick?: () => void
    /** Shows a "Plus tard" dismiss button when no secondary action. */
    dismissible?: boolean
    onDismiss?: () => void
    className?: string
    "data-state"?: string
}

/**
 * Banner — typography-led, icon-free strip. Left accent bar, mono eyebrow +
 * slim progress + right text, editorial title with an inline body, and the
 * action(s) on the right. The shared primitive behind the trial banner and the
 * error / system banners. Recreates the design's `trial`/`StripBanner`.
 */
export function Banner({
    tone,
    variant = "page",
    eyebrow,
    left,
    progress,
    title,
    body,
    cta,
    ctaTone = "primary",
    ctaHref,
    onCtaClick,
    secondaryCta,
    secondaryHref,
    onSecondaryClick,
    dismissible,
    onDismiss,
    className,
    ...rest
}: BannerProps) {
    const t = TONE[tone]
    const stateAttr = rest["data-state"] ?? tone

    if (variant === "sidebar") {
        return (
            <div
                data-testid="banner"
                data-state={stateAttr}
                className={cn("relative border px-3 py-2.5", className)}
                style={{ background: t.bg, borderColor: t.border }}
            >
                <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.fg }} />
                <div
                    className="font-mono text-[9px] font-medium uppercase tracking-[0.1em]"
                    style={{ color: t.fg }}
                >
                    {eyebrow}
                    {left ? <span className="text-[var(--ink-soft)]"> · {left}</span> : null}
                </div>
                <div className="mt-1 font-editorial text-[14px] leading-tight tracking-tight text-[var(--ink-900)]">
                    {title}
                </div>
                {cta ? (
                    <BannerCta
                        tone={ctaTone}
                        href={ctaHref}
                        onClick={onCtaClick}
                        fg={t.fg}
                        border={t.border}
                        className="mt-2 h-8 w-full"
                    >
                        {cta}
                    </BannerCta>
                ) : null}
            </div>
        )
    }

    return (
        <div
            data-testid="banner"
            data-state={stateAttr}
            className={cn(
                "relative flex flex-col gap-3 border py-3.5 pl-7 pr-4 sm:flex-row sm:items-center sm:gap-7",
                className,
            )}
            style={{ background: t.bg, borderColor: t.border }}
        >
            <span aria-hidden className="absolute inset-y-0 left-0 w-[3px]" style={{ background: t.fg }} />

            <div className="min-w-0 flex-1">
                <div className="flex flex-wrap items-center gap-x-3.5 gap-y-1">
                    <span
                        className="font-mono text-[10.5px] font-medium uppercase tracking-[0.12em]"
                        style={{ color: t.fg }}
                    >
                        {eyebrow}
                    </span>
                    {progress != null ? (
                        <span
                            className="hidden h-[3px] w-[100px] overflow-hidden sm:block"
                            style={{ background: "rgba(10,10,10,0.08)" }}
                        >
                            <span
                                className="block h-full"
                                style={{ width: `${Math.min(100, Math.max(0, progress * 100))}%`, background: t.fg }}
                            />
                        </span>
                    ) : null}
                    {left ? (
                        <span className="text-[11px] tracking-[0.04em] text-[var(--ink-soft)]">{left}</span>
                    ) : null}
                </div>

                <div className="mt-1.5 flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:gap-3.5">
                    <span className="font-editorial text-[20px] leading-tight tracking-tight text-[var(--ink-900)] sm:shrink-0 sm:text-[22px]">
                        {title}
                    </span>
                    {body ? <span className="truncate text-[13px] text-[var(--ink-soft)]">{body}</span> : null}
                </div>
            </div>

            <div className="flex shrink-0 items-center gap-2">
                {cta ? (
                    <BannerCta tone={ctaTone} href={ctaHref} onClick={onCtaClick} fg={t.fg} border={t.border}>
                        {cta}
                    </BannerCta>
                ) : null}
                {secondaryCta ? (
                    <BannerCta
                        tone="ghost"
                        href={secondaryHref}
                        onClick={onSecondaryClick}
                        fg={t.fg}
                        border={t.border}
                    >
                        {secondaryCta}
                    </BannerCta>
                ) : dismissible ? (
                    <button
                        type="button"
                        onClick={onDismiss}
                        className="h-9 px-2.5 text-[12.5px] tracking-tight text-[var(--ink-soft)] transition-colors hover:text-[var(--ink-700)]"
                    >
                        Plus tard
                    </button>
                ) : null}
            </div>
        </div>
    )
}
