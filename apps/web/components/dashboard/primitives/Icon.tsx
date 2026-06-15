/**
 * Icon — the Jokko line-icon set (stroke 1.6, round caps, 24×24 grid).
 * Ported verbatim from the design system (Primitives · §13 Iconographie).
 * This is the canonical UI icon vocabulary documented in Storybook; app code
 * may still use lucide-react, but new chrome should prefer these.
 */

export const ICON_PATHS = {
    "chevron-left": "M14 6l-6 6 6 6",
    "chevron-right": "M10 6l6 6-6 6",
    "chevron-down": "M6 9l6 6 6-6",
    "chevron-up": "M6 15l6-6 6 6",
    "arrow-left": "M5 12h14M5 12l6-6M5 12l6 6",
    "arrow-right": "M19 12H5M19 12l-6-6M19 12l-6 6",
    "arrow-up-right": "M7 17L17 7M9 7h8v8",
    close: "M6 6l12 12M18 6L6 18",
    plus: "M12 5v14M5 12h14",
    minus: "M5 12h14",
    "more-h": "M6 12h.01M12 12h.01M18 12h.01",
    "more-v": "M12 6h.01M12 12h.01M12 18h.01",
    search: "M11 4a7 7 0 1 0 0 14 7 7 0 0 0 0-14ZM21 21l-4.35-4.35",
    filter: "M3 6h18M6 12h12M10 18h4",
    inbox: "M3 13h5a3 3 0 0 0 3-3V8m10 5h-5a3 3 0 0 1-3-3V8M3 8l3-4h12l3 4v8a3 3 0 0 1-3 3H6a3 3 0 0 1-3-3V8Z",
    hub: "M4 4h7v7H4zM13 4h7v7h-7zM4 13h7v7H4zM13 13h7v7h-7z",
    bell: "M6 8a6 6 0 0 1 12 0c0 7 3 7 3 9H3c0-2 3-2 3-9ZM10 21a2 2 0 0 0 4 0",
    cog: "M12 9a3 3 0 1 0 0 6 3 3 0 0 0 0-6Zm9 3-2-.5-.6-1.5 1-2-2-2-2 1-1.5-.6L13.5 3h-3l-.4 2-1.5.6-2-1-2 2 1 2-.6 1.5L3 12l2 .5.6 1.5-1 2 2 2 2-1 1.5.6.4 2h3l.4-2 1.5-.6 2 1 2-2-1-2 .6-1.5L21 12Z",
    send: "M22 2 11 13M22 2l-7 20-4-9-9-4 20-7Z",
    paperclip: "M21 11.5 12.5 20a5 5 0 0 1-7-7L14 4.5a3.5 3.5 0 0 1 5 5L10.5 18a2 2 0 0 1-2.8-2.8L15 7",
    mic: "M12 14a3 3 0 0 0 3-3V6a3 3 0 0 0-6 0v5a3 3 0 0 0 3 3ZM19 11a7 7 0 0 1-14 0M12 18v4M8 22h8",
    camera: "M4 7h3l2-2h6l2 2h3a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H4a2 2 0 0 1-2-2V9a2 2 0 0 1 2-2ZM12 18a4 4 0 1 0 0-8 4 4 0 0 0 0 8Z",
    image: "M4 5h16a1 1 0 0 1 1 1v12a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM8 11a2 2 0 1 0 0-4 2 2 0 0 0 0 4ZM3 17l5-5 4 4 3-3 6 6",
    doc: "M14 3H6a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V9l-6-6ZM14 3v6h6M8 13h8M8 17h5",
    check: "M5 12l5 5L20 7",
    "check-double": "M2 12l4 4 7-7M11 16l8-8",
    clock: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 7v5l3 2",
    reply: "M9 17l-6-6 6-6M3 11h11a7 7 0 0 1 7 7v3",
    forward: "M15 17l6-6-6-6M21 11H10a7 7 0 0 0-7 7v3",
    pin: "M12 2 9 9l-5 1 4 4-2 8 6-5 6 5-2-8 4-4-5-1Z",
    archive: "M3 5h18l-1 4H4ZM5 9v10a1 1 0 0 0 1 1h12a1 1 0 0 0 1-1V9M9 13h6",
    bookmark: "M6 4h12v17l-6-4-6 4Z",
    star: "M12 3l2.7 5.5 6 .9-4.4 4.3 1 6-5.3-2.8L6.7 19.7l1-6L3.3 9.4l6-.9Z",
    heart: "M12 21s-8-4.5-8-11a5 5 0 0 1 9-3 5 5 0 0 1 9 3c0 6.5-10 11-10 11Z",
    "thumb-up": "M7 11v9H4a1 1 0 0 1-1-1v-7a1 1 0 0 1 1-1h3ZM7 11l4-7a2 2 0 0 1 4 1v3h4a2 2 0 0 1 2 2.4l-1.5 7A2 2 0 0 1 17.5 19H7",
    qr: "M3 3h7v7H3zM14 3h7v7h-7zM3 14h7v7H3zM14 14h2v2h-2zM18 14h3v3h-3zM14 18h2v3h-3v-3ZM18 19h3v2h-3z",
    shield: "M12 3l8 3v5c0 5-3.5 9-8 10-4.5-1-8-5-8-10V6Z",
    globe: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM3 12h18M12 3a14 14 0 0 1 0 18M12 3a14 14 0 0 0 0 18",
    whatsapp:
        "M16.7 13.2c-.2-.1-1.5-.7-1.7-.8-.2-.1-.4-.1-.6.1l-.8 1c-.2.2-.3.2-.6.1a6.8 6.8 0 0 1-2-1.3 7.7 7.7 0 0 1-1.4-1.7c-.1-.3 0-.4.1-.5.1-.1.3-.3.4-.5.1-.1.2-.3.3-.4 0-.2 0-.3 0-.4 0-.1-.6-1.4-.8-1.9-.2-.5-.4-.4-.6-.4h-.5c-.2 0-.4.1-.7.3-.2.2-.9.9-.9 2.2 0 1.3 1 2.6 1.1 2.7.1.2 1.8 2.7 4.4 3.8.6.2 1 .4 1.4.5.6.2 1.1.2 1.5.1.5-.1 1.5-.6 1.7-1.2.2-.6.2-1.1.1-1.2-.1-.1-.3-.2-.5-.3ZM12 2a10 10 0 0 0-8.5 15.2L2 22l4.9-1.3A10 10 0 1 0 12 2Z",
    video: "M3 5h13a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H3a1 1 0 0 1-1-1V6a1 1 0 0 1 1-1ZM18 9l3-2v10l-3-2",
    phone: "M22 17a2 2 0 0 1-2 2A18 18 0 0 1 2 4a2 2 0 0 1 2-2h3a1 1 0 0 1 1 .8l1 4a1 1 0 0 1-.3 1L7 9a16 16 0 0 0 8 8l1.2-1.7a1 1 0 0 1 1-.3l4 1a1 1 0 0 1 .8 1Z",
    user: "M12 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM4 21a8 8 0 0 1 16 0",
    users: "M16 21a6 6 0 0 0-12 0M10 13a4 4 0 1 0 0-8 4 4 0 0 0 0 8ZM22 21a6 6 0 0 0-4-5.7M16 5a4 4 0 0 1 0 8",
    lock: "M5 11h14v10H5zM8 11V7a4 4 0 0 1 8 0v4",
    logout: "M9 5H5a2 2 0 0 0-2 2v10a2 2 0 0 0 2 2h4M16 17l5-5-5-5M21 12H9",
    sun: "M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10ZM12 2v2M12 20v2M4 12H2M22 12h-2M5 5l1.5 1.5M17.5 17.5 19 19M5 19l1.5-1.5M17.5 6.5 19 5",
    moon: "M21 13A9 9 0 1 1 11 3a7 7 0 0 0 10 10Z",
    switch: "M16 3l4 4-4 4M20 7H8M8 21l-4-4 4-4M4 17h12",
    sparkle: "M12 3v6M12 15v6M3 12h6M15 12h6M5.5 5.5l4 4M14.5 14.5l4 4M18.5 5.5l-4 4M9.5 14.5l-4 4",
    play: "M6 4l14 8-14 8Z",
    pause: "M7 4h4v16H7zM13 4h4v16h-4z",
    trash: "M3 6h18M8 6V4a1 1 0 0 1 1-1h6a1 1 0 0 1 1 1v2M5 6l1 14a2 2 0 0 0 2 2h8a2 2 0 0 0 2-2l1-14",
    edit: "M14 4l6 6-12 12H2v-6Z",
    flame: "M12 2s5 5 5 9a5 5 0 1 1-10 0c0-2 1-3 2-4-1 3 1 4 3 4-2-3 0-6 0-9Z",
    bolt: "M13 2 3 14h8l-1 8 10-12h-8Z",
    "circle-dot": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM12 14a2 2 0 1 0 0-4 2 2 0 0 0 0 4Z",
    eye: "M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12ZM12 15a3 3 0 1 0 0-6 3 3 0 0 0 0 6Z",
    mail: "M3 6h18v12H3zM3 6l9 7 9-7",
    flag: "M5 21V4h13l-2 5 2 5H5",
    list: "M8 6h13M8 12h13M8 18h13M3 6h.01M3 12h.01M3 18h.01",
    "circle-check": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8 12l3 3 5-5",
    reaction: "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM8.5 14a4 4 0 0 0 7 0M9 9.5h.01M15 9.5h.01",
    rotate: "M3 12a9 9 0 0 1 15-6.7L21 8M21 3v5h-5M21 12a9 9 0 0 1-15 6.7L3 16M3 21v-5h5",
    building: "M3 21h18M5 21V5a1 1 0 0 1 1-1h12a1 1 0 0 1 1 1v16M9 8h.01M9 12h.01M9 16h.01M15 8h.01M15 12h.01M15 16h.01",
    "help-circle": "M12 21a9 9 0 1 0 0-18 9 9 0 0 0 0 18ZM9 9a3 3 0 0 1 6 0c0 2-3 2-3 4M12 17h.01",
    "map-pin": "M12 21s-7-5.6-7-11a7 7 0 0 1 14 0c0 5.4-7 11-7 11ZM12 12.5a2.5 2.5 0 1 0 0-5 2.5 2.5 0 0 0 0 5Z",
    download: "M12 3v11M8 11l4 4 4-4M5 20h14",
} as const

export type IconName = keyof typeof ICON_PATHS

interface IconProps {
    name: IconName
    size?: number
    color?: string
    strokeWidth?: number
    className?: string
}

export function Icon({ name, size = 18, color = "currentColor", strokeWidth = 1.6, className }: IconProps) {
    return (
        <svg
            width={size}
            height={size}
            viewBox="0 0 24 24"
            fill="none"
            stroke={color}
            strokeWidth={strokeWidth}
            strokeLinecap="round"
            strokeLinejoin="round"
            className={className}
            style={{ display: "block", flexShrink: 0 }}
            aria-hidden="true"
        >
            <path d={ICON_PATHS[name]} />
        </svg>
    )
}
