import { Loader2 } from "lucide-react"

import type { BillingData } from "./types"

interface PlanAction {
    label: string
    onClick: () => void
    loading?: boolean
}

interface PlanCardProps {
    plan: BillingData["plan"]
    /** Filled white button (e.g. "Gérer l'abonnement" / "Passer à Business"). */
    primary?: PlanAction
    /** Outlined glass button (e.g. "Changer de plan"). */
    secondary?: PlanAction
}

/**
 * PlanCard — hero accent-gradient card showing plan name, price, tagline
 * and action buttons. Matches the `ScreenBilling` violet hero card design.
 * Buttons are driven by `primary`/`secondary` props (hidden when absent).
 */
export function PlanCard({ plan, primary, secondary }: PlanCardProps) {
    return (
        <div
            className="relative overflow-hidden rounded-xl"
            style={{
                background: "linear-gradient(135deg, var(--accent) 0%, #2B0F8F 100%)",
                color: "#fff",
                padding: "24px 28px",
                display: "flex",
                alignItems: "center",
                gap: 24,
            }}
        >
            {/* Radial glow decoration */}
            <div
                aria-hidden
                style={{
                    position: "absolute",
                    top: -40,
                    right: -40,
                    width: 240,
                    height: 240,
                    borderRadius: "50%",
                    background:
                        "radial-gradient(circle, rgba(255,255,255,0.18), transparent 70%)",
                    pointerEvents: "none",
                }}
            />

            {/* Left: plan name + tagline + renewal note */}
            <div style={{ flex: 1, minWidth: 0 }}>
                <p
                    className="font-mono uppercase"
                    style={{
                        fontSize: 10.5,
                        letterSpacing: "0.1em",
                        opacity: 0.7,
                        margin: 0,
                    }}
                >
                    Plan actuel
                </p>
                <div
                    className="mt-1.5 flex items-baseline gap-3.5"
                >
                    <span
                        className="font-display font-bold"
                        style={{
                            fontSize: 44,
                            lineHeight: 1,
                            letterSpacing: "-0.015em",
                        }}
                    >
                        {plan.name}
                    </span>
                    <span style={{ fontSize: 14, opacity: 0.8 }}>{plan.tagline}</span>
                </div>
                <p
                    style={{
                        marginTop: 16,
                        fontSize: 13,
                        opacity: 0.85,
                        letterSpacing: "-0.005em",
                        lineHeight: 1.5,
                    }}
                >
                    {plan.renewalNote}
                </p>
            </div>

            {/* Right: big price + action buttons */}
            <div style={{ textAlign: "right", flexShrink: 0 }}>
                <div
                    className="font-display font-bold tabular-nums"
                    style={{
                        fontSize: 52,
                        lineHeight: 1,
                        letterSpacing: "-0.015em",
                    }}
                >
                    {plan.price}
                </div>
                <div style={{ fontSize: 12, opacity: 0.8, marginTop: 4 }}>
                    {plan.priceUnit}
                </div>
                {primary || secondary ? (
                    <div className="mt-4 flex items-center justify-end gap-2">
                        {secondary ? (
                            <button
                                type="button"
                                onClick={secondary.onClick}
                                disabled={secondary.loading}
                                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60"
                                style={{
                                    background: "rgba(255,255,255,0.15)",
                                    color: "#fff",
                                    border: "1px solid rgba(255,255,255,0.25)",
                                }}
                            >
                                {secondary.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {secondary.label}
                            </button>
                        ) : null}
                        {primary ? (
                            <button
                                type="button"
                                onClick={primary.onClick}
                                disabled={primary.loading}
                                className="inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors disabled:opacity-60"
                                style={{ background: "#fff", color: "var(--accent)" }}
                            >
                                {primary.loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                                {primary.label}
                            </button>
                        ) : null}
                    </div>
                ) : null}
            </div>
        </div>
    )
}
