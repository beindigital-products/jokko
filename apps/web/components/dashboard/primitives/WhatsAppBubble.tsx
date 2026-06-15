import { Fragment, type ReactNode } from "react"

import { cn } from "@/lib/utils"
import { Icon, type IconName } from "./Icon"

/**
 * WhatsAppBubble — the canonical "this is how it lands in WhatsApp" render.
 * One shared bubble (media header + body + footer + meta + CTA buttons) used by
 * the campaign wizard preview AND the Templates "Aperçu" panel so the file /
 * media header looks identical everywhere. Media headers (document, image,
 * video, location) recreate WhatsApp's real chrome. Presentational only.
 */

// ── Media ────────────────────────────────────────────────────────────────────

/** A WhatsApp template header attachment. */
export type WaMedia =
    | { kind: "document"; filename: string; ext?: string; pages?: number; size?: string }
    | { kind: "image"; src?: string; alt?: string }
    | { kind: "video"; src?: string; poster?: string; duration?: string }
    | { kind: "location"; name?: string; address?: string; src?: string }

/** A WhatsApp CTA / quick-reply button. */
export interface WaButton {
    label: string
    /** url → external arrow · phone → call · reply → quick reply. */
    kind?: "url" | "phone" | "reply"
}

const WA_READ = "#34B7F1"
const WA_LINK = "#0084FF"

const BTN_ICON: Record<NonNullable<WaButton["kind"]>, IconName> = {
    url: "arrow-up-right",
    phone: "phone",
    reply: "reply",
}

/** Per-extension accent for the document tile (PDF red, sheet green, …). */
const EXT_COLOR: Record<string, string> = {
    pdf: "#DC3838",
    doc: "#2563EB",
    docx: "#2563EB",
    xls: "#0E9F6E",
    xlsx: "#0E9F6E",
    csv: "#0E9F6E",
    ppt: "#D9730D",
    pptx: "#D9730D",
    zip: "#6B7280",
}

function extOf(media: Extract<WaMedia, { kind: "document" }>): string {
    if (media.ext) return media.ext
    const m = media.filename.match(/\.([a-z0-9]+)$/i)
    return m ? m[1] : "file"
}

function extColor(ext: string): string {
    return EXT_COLOR[ext.toLowerCase()] ?? "var(--accent)"
}

/** Mix a hex colour with white at `amount` (0–1) for a soft tinted tile bg. */
function tint(hex: string, amount = 0.12): string {
    if (!hex.startsWith("#")) return `color-mix(in srgb, ${hex} ${amount * 100}%, white)`
    const n = parseInt(hex.slice(1), 16)
    const r = (n >> 16) & 255
    const g = (n >> 8) & 255
    const b = n & 255
    const mix = (c: number) => Math.round(c * amount + 255 * (1 - amount))
    return `rgb(${mix(r)}, ${mix(g)}, ${mix(b)})`
}

// ── Inline placeholder art (no external assets, no id collisions) ─────────────

/** A flat-illustration photo (sky + sun + hills) standing in for a real image. */
function PhotoPlaceholder({ dim }: { dim?: boolean }) {
    return (
        <div className="absolute inset-0" style={{ background: "linear-gradient(#cfe3f2,#eef3ec)" }}>
            <svg viewBox="0 0 400 240" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                <circle cx={312} cy={64} r={30} fill="#f4cd86" />
                <path d="M0 168 Q100 118 210 156 T400 148 V240 H0Z" fill="#a7c990" />
                <path d="M0 200 Q120 150 250 190 T400 180 V240 H0Z" fill="#6f9d63" />
            </svg>
            {dim ? <div className="absolute inset-0" style={{ background: "rgba(10,10,10,0.28)" }} /> : null}
        </div>
    )
}

/** A stylised street map standing in for a real location thumbnail. */
function MapPlaceholder() {
    return (
        <div className="absolute inset-0" style={{ background: "#eceae3" }}>
            <svg viewBox="0 0 400 200" preserveAspectRatio="xMidYMid slice" className="h-full w-full">
                <rect x={18} y={16} width={128} height={78} rx={9} fill="#cfe0bf" />
                <rect x={250} y={108} width={138} height={86} rx={9} fill="#cfe0bf" />
                <path d="M-10 44 C120 86 200 8 420 64" stroke="#bcd6e8" strokeWidth={16} fill="none" />
                <g stroke="#ffffff" strokeWidth={9} strokeLinecap="round">
                    <path d="M0 132 H400" />
                    <path d="M120 0 V200" />
                    <path d="M268 0 V200" />
                </g>
                <g stroke="#e4e1d8" strokeWidth={2}>
                    <path d="M0 132 H400" />
                    <path d="M120 0 V200" />
                    <path d="M268 0 V200" />
                </g>
            </svg>
        </div>
    )
}

// ── Media header ──────────────────────────────────────────────────────────────

/** Renders a template's header attachment as WhatsApp shows it. */
export function WaMediaHeader({ media }: { media: WaMedia }) {
    if (media.kind === "document") {
        const ext = extOf(media)
        const color = extColor(ext)
        const meta = [
            media.pages != null ? `${media.pages} page${media.pages > 1 ? "s" : ""}` : null,
            ext.toUpperCase(),
            media.size,
        ]
            .filter(Boolean)
            .join(" · ")
        return (
            <div className="mb-1.5 flex items-center gap-2.5 rounded-lg bg-[var(--paper-warm)] px-2.5 py-2">
                <div
                    className="grid h-10 w-10 shrink-0 place-items-center rounded-md"
                    style={{ background: tint(color) }}
                >
                    <Icon name="doc" size={18} color={color} />
                </div>
                <div className="min-w-0 flex-1">
                    <div className="truncate text-[12.5px] font-medium text-[var(--ink-900)]">{media.filename}</div>
                    <div className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.06em] text-[var(--ink-soft)]">
                        {meta}
                    </div>
                </div>
                <Icon name="download" size={16} color="var(--ink-soft)" />
            </div>
        )
    }

    if (media.kind === "location") {
        return (
            <div className="mb-1.5 overflow-hidden rounded-md border border-[var(--ink-100)]">
                <div className="relative h-[118px]">
                    <MapPlaceholder />
                    <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[85%]">
                        <span className="grid h-7 w-7 place-items-center rounded-full bg-white/85 shadow-[0_2px_6px_rgba(10,10,10,0.25)]">
                            <Icon name="map-pin" size={18} color="#DC3838" />
                        </span>
                    </div>
                </div>
                {media.name || media.address ? (
                    <div className="bg-white px-2.5 py-1.5">
                        {media.name ? (
                            <div className="text-[12.5px] font-medium text-[var(--ink-900)]">{media.name}</div>
                        ) : null}
                        {media.address ? (
                            <div className="mt-0.5 text-[11.5px] text-[var(--ink-soft)]">{media.address}</div>
                        ) : null}
                    </div>
                ) : null}
            </div>
        )
    }

    // image | video — full-width media block.
    const isVideo = media.kind === "video"
    return (
        <div className="relative mb-1.5 h-[150px] overflow-hidden rounded-md">
            {media.src ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                    src={media.src}
                    alt={media.kind === "image" ? (media.alt ?? "") : ""}
                    className="absolute inset-0 h-full w-full object-cover"
                />
            ) : (
                <PhotoPlaceholder dim={isVideo} />
            )}
            {isVideo ? (
                <>
                    <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-black/55 backdrop-blur-sm">
                        <Icon name="play" size={22} color="#ffffff" />
                    </span>
                    <span className="absolute bottom-1.5 right-1.5 rounded bg-black/55 px-1.5 py-0.5 font-mono text-[10px] tabular-nums text-white">
                        {media.duration ?? "0:30"}
                    </span>
                </>
            ) : null}
        </div>
    )
}

// ── Body helper ───────────────────────────────────────────────────────────────

/**
 * Render a template body, highlighting `{{N}}` tokens in the accent colour.
 * Pass `resolve` to substitute each token with its bound example value (wizard);
 * omit it to keep the literal `{{N}}` token (template catalogue).
 */
export function highlightBody(text: string, resolve?: (token: string) => string): ReactNode {
    return text.split(/(\{\{\d+\}\})/g).map((part, i) => {
        if (!/^\{\{\d+\}\}$/.test(part)) return <Fragment key={i}>{part}</Fragment>
        return (
            <b key={i} className="font-medium text-[var(--accent)]">
                {resolve ? resolve(part) : part}
            </b>
        )
    })
}

// ── Bubble ────────────────────────────────────────────────────────────────────

export interface WhatsAppBubbleProps {
    media?: WaMedia | null
    /** Body content — use `highlightBody()` to format `{{N}}` tokens. */
    body: ReactNode
    footer?: ReactNode
    time?: string
    /** Delivery state drives the tick: read = blue double, delivered = grey double, sent = single. */
    status?: "sent" | "delivered" | "read"
    buttons?: WaButton[]
    className?: string
}

/** The white message bubble itself (no chat background — wrap with WaChatFrame). */
export function WhatsAppBubble({
    media,
    body,
    footer,
    time = "10:00",
    status = "read",
    buttons,
    className,
}: WhatsAppBubbleProps) {
    return (
        <div
            data-testid="wa-bubble"
            className={cn(
                "bg-white px-2.5 py-2 text-[13px] leading-[1.45] tracking-[-0.005em] text-[var(--ink-900)] shadow-[0_1px_1px_rgba(10,10,10,0.08)]",
                className,
            )}
            style={{ borderRadius: "8px 8px 8px 2px" }}
        >
            {media ? <WaMediaHeader media={media} /> : null}

            <div>{body}</div>

            {footer ? <div className="mt-1.5 text-[11.5px] italic text-[var(--ink-soft)]">{footer}</div> : null}

            <div className="mt-1.5 flex items-center justify-end gap-1">
                <span className="font-mono text-[10px] tabular-nums text-[var(--ink-soft)]">{time}</span>
                <Icon
                    name={status === "sent" ? "check" : "check-double"}
                    size={13}
                    color={status === "read" ? WA_READ : "var(--ink-soft)"}
                />
            </div>

            {buttons && buttons.length > 0 ? (
                <div className="mt-1.5 flex flex-col border-t border-[var(--ink-100)]">
                    {buttons.map((b, i) => (
                        <div
                            key={`${b.label}-${i}`}
                            className={cn(
                                "flex items-center justify-center gap-1.5 py-[7px] text-[12.5px] font-medium",
                                i > 0 && "border-t border-[var(--ink-100)]",
                            )}
                            style={{ color: WA_LINK }}
                        >
                            {b.kind ? <Icon name={BTN_ICON[b.kind]} size={14} color={WA_LINK} /> : null}
                            {b.label}
                        </div>
                    ))}
                </div>
            ) : null}
        </div>
    )
}

// ── Chat frame ────────────────────────────────────────────────────────────────

/** The WhatsApp paper background (dotted) that the bubble sits on. */
export function WaChatFrame({ children, className }: { children: ReactNode; className?: string }) {
    return (
        <div
            className={cn("rounded-xl p-3.5", className)}
            style={{
                background: "#E3DDD0",
                backgroundImage: "radial-gradient(rgba(10,10,10,0.05) 1px, transparent 1px)",
                backgroundSize: "9px 9px",
            }}
        >
            {children}
        </div>
    )
}
