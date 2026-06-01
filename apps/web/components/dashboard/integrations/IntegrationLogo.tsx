interface LogoConfig {
    bg: string
    fg: string
    glyph: string
    border?: string
}

const LOGOS: Record<string, LogoConfig> = {
    hubspot:    { bg: "#FF7A59", fg: "#fff",     glyph: "h" },
    salesforce: { bg: "#00A1E0", fg: "#fff",     glyph: "sf" },
    pipedrive:  { bg: "#0C0C0C", fg: "#fff",     glyph: "p" },
    zoho:       { bg: "#E42527", fg: "#fff",     glyph: "z" },
    notion:     { bg: "#fff",    fg: "#0C0C0C",  glyph: "N", border: "#E5E5E5" },
    sheets:     { bg: "#0F9D58", fg: "#fff",     glyph: "⊞" },
    slack:      { bg: "#4A154B", fg: "#ECB22E",  glyph: "#" },
    teams:      { bg: "#5059C9", fg: "#fff",     glyph: "T" },
    webhook:    { bg: "#1F1F1F", fg: "#A5F0A1",  glyph: "{ }" },
    zapier:     { bg: "#FF4A00", fg: "#fff",     glyph: "Z" },
    stripe:     { bg: "#635BFF", fg: "#fff",     glyph: "S" },
    shopify:    { bg: "#95BF47", fg: "#fff",     glyph: "sh" },
}

interface IntegrationLogoProps {
    id: string
    name: string
}

/**
 * IntegrationLogo — 40×40 branded glyph block for each integration.
 * Falls back to the first letter of the integration name for unknown IDs.
 */
export function IntegrationLogo({ id, name }: IntegrationLogoProps) {
    const s = LOGOS[id] ?? {
        bg: "var(--paper-warm)",
        fg: "var(--ink-900)",
        glyph: name[0] ?? "?",
    }

    return (
        <div
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[10px] font-display text-base font-medium"
            style={{
                background: s.bg,
                color: s.fg,
                border: s.border ? `1px solid ${s.border}` : "none",
                fontStyle: "italic",
                letterSpacing: 0,
            }}
        >
            {s.glyph}
        </div>
    )
}
