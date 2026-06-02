/**
 * StateIllustration — the mono-line illustration set used by empty / error /
 * system states. One consistent style: 1.6px ink stroke + a single accent
 * detail. Drawn in an 88×88 viewBox so each sits inside a rounded tile.
 * Ported from the design's `states/kit.jsx` Illu set.
 */

export type IllustrationName =
    | "inbox"
    | "contacts"
    | "templates"
    | "megaphone"
    | "flow"
    | "plug"
    | "chart"
    | "team"
    | "bell"
    | "search"
    | "funnel"
    | "archive"
    | "bolt"
    | "compass"
    | "broken-link"
    | "cloud-off"
    | "warning"
    | "check"
    | "rocket"
    | "lock"
    | "ghost"

interface StateIllustrationProps {
    name: IllustrationName
    size?: number
    /** Stroke colour (defaults to ink). */
    color?: string
    /** Accent detail colour (defaults to the brand accent). */
    accent?: string
    className?: string
}

export function StateIllustration({
    name,
    size = 84,
    color = "var(--ink-900)",
    accent = "var(--accent)",
    className,
}: StateIllustrationProps) {
    const props = {
        width: size,
        height: size,
        viewBox: "0 0 88 88",
        fill: "none",
        stroke: color,
        strokeWidth: 1.6,
        strokeLinecap: "round" as const,
        strokeLinejoin: "round" as const,
        className,
        style: { display: "block" },
    }

    switch (name) {
        case "inbox":
            return (
                <svg {...props}>
                    <path d="M16 38l8-18h40l8 18v22a6 6 0 01-6 6H22a6 6 0 01-6-6V38z" />
                    <path d="M16 38h16l4 8h16l4-8h16" />
                    <circle cx="70" cy="22" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "contacts":
            return (
                <svg {...props}>
                    <circle cx="34" cy="34" r="11" />
                    <path d="M20 64a14 14 0 0128 0" />
                    <circle cx="58" cy="38" r="8" />
                    <path d="M50 64a12 12 0 0124 0" stroke={accent} />
                </svg>
            )
        case "templates":
            return (
                <svg {...props}>
                    <path d="M18 20h36l6 6v42H18z" />
                    <path d="M54 20v6h6" />
                    <path d="M26 38h28M26 46h28M26 54h18" />
                    <circle cx="62" cy="62" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "megaphone":
            return (
                <svg {...props}>
                    <path d="M14 36v16l38 14V22z" />
                    <path d="M52 30c6 0 10 6 10 14s-4 14-10 14" />
                    <path d="M22 52v8a4 4 0 008 0v-4" />
                    <circle cx="68" cy="22" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "flow":
            return (
                <svg {...props}>
                    <circle cx="18" cy="44" r="8" />
                    <circle cx="44" cy="22" r="8" />
                    <circle cx="44" cy="66" r="8" />
                    <circle cx="70" cy="44" r="8" stroke={accent} />
                    <path d="M26 40l10-12M26 48l10 12M52 26l10 12M52 62l10-12" />
                </svg>
            )
        case "plug":
            return (
                <svg {...props}>
                    <path d="M20 34h20a14 14 0 010 28H20a4 4 0 01-4-4V38a4 4 0 014-4z" />
                    <path d="M68 34h-8M68 62h-8M72 24v8M64 24v8" stroke={accent} />
                    <path d="M44 48h12" />
                </svg>
            )
        case "chart":
            return (
                <svg {...props}>
                    <path d="M14 70h60" />
                    <path d="M22 60v8M34 50v18M46 56v12M58 42v26M70 32v36" />
                    <path d="M18 38l14-10 14 6 12-14 14 4" stroke={accent} />
                </svg>
            )
        case "team":
            return (
                <svg {...props}>
                    <circle cx="44" cy="30" r="10" />
                    <circle cx="22" cy="40" r="7" />
                    <circle cx="66" cy="40" r="7" />
                    <path d="M28 64a16 16 0 0132 0" />
                    <path d="M10 64a12 12 0 0118-10" />
                    <path d="M78 64a12 12 0 00-18-10" stroke={accent} />
                </svg>
            )
        case "bell":
            return (
                <svg {...props}>
                    <path d="M22 36a22 22 0 0144 0c0 18 6 18 6 24H16c0-6 6-6 6-24z" />
                    <path d="M36 70a8 8 0 0016 0" />
                    <circle cx="64" cy="22" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "search":
            return (
                <svg {...props}>
                    <circle cx="38" cy="38" r="18" />
                    <path d="M52 52l16 16" />
                    <path d="M30 38a8 8 0 018-8" stroke={accent} />
                </svg>
            )
        case "funnel":
            return (
                <svg {...props}>
                    <path d="M14 20h60l-22 26v22l-16-8V46z" />
                    <circle cx="68" cy="14" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "archive":
            return (
                <svg {...props}>
                    <path d="M14 20h60l-4 14H18z" />
                    <path d="M20 34v32a4 4 0 004 4h40a4 4 0 004-4V34" />
                    <path d="M34 46h20" />
                </svg>
            )
        case "bolt":
            return (
                <svg {...props}>
                    <path d="M48 12L20 52h20l-6 24 28-40H42z" stroke={accent} />
                </svg>
            )
        case "compass":
            return (
                <svg {...props}>
                    <circle cx="44" cy="44" r="30" />
                    <path d="M56 32L50 50l-18 6 6-18z" fill={accent} fillOpacity="0.15" stroke={accent} />
                    <circle cx="44" cy="44" r="2.5" fill={color} stroke="none" />
                </svg>
            )
        case "broken-link":
            return (
                <svg {...props}>
                    <path d="M28 44l-8 8a10 10 0 01-14-14l8-8" />
                    <path d="M60 44l8-8a10 10 0 0114 14l-8 8" stroke={accent} />
                    <path d="M34 54l20-20" />
                    <path d="M42 14v6M58 68v6M14 42h6M68 46h6" />
                </svg>
            )
        case "cloud-off":
            return (
                <svg {...props}>
                    <path d="M18 60a14 14 0 014-28 18 18 0 0134 4" />
                    <path d="M58 60a10 10 0 008-16" />
                    <path d="M12 12l64 64" stroke={accent} strokeWidth="2" />
                </svg>
            )
        case "warning":
            return (
                <svg {...props}>
                    <path d="M44 12l34 60H10z" />
                    <path d="M44 36v18M44 62v.5" stroke={accent} strokeWidth="2.5" />
                </svg>
            )
        case "check":
            return (
                <svg {...props}>
                    <circle cx="44" cy="44" r="30" />
                    <path d="M30 44l10 10 18-20" stroke={accent} strokeWidth="2.5" />
                </svg>
            )
        case "rocket":
            return (
                <svg {...props}>
                    <path d="M44 8c12 8 18 22 18 36l-8 6h-20l-8-6c0-14 6-28 18-36z" />
                    <circle cx="44" cy="34" r="5" fill={accent} stroke="none" />
                    <path d="M36 60l-8 12M52 60l8 12M44 60v14" />
                </svg>
            )
        case "lock":
            return (
                <svg {...props}>
                    <rect x="20" y="38" width="48" height="36" rx="4" />
                    <path d="M30 38v-8a14 14 0 0128 0v8" />
                    <circle cx="44" cy="56" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        case "ghost":
            return (
                <svg {...props}>
                    <path d="M16 44a28 28 0 0156 0v30l-10-6-10 6-10-6-10 6-10-6 4-24z" />
                    <circle cx="34" cy="40" r="3" fill={color} stroke="none" />
                    <circle cx="54" cy="40" r="3" fill={color} stroke="none" />
                    <circle cx="62" cy="22" r="3.5" fill={accent} stroke="none" />
                </svg>
            )
        default:
            return <svg {...props} />
    }
}
