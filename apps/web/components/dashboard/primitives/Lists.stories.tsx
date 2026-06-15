import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Chip } from "./Chip"
import { Icon } from "./Icon"

const meta = {
    title: "Components/Lists",
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta

export default meta
type Story = StoryObj<typeof meta>

const caption = "font-mono text-[11px] text-[var(--ink-soft)]"
const spec = "border border-[var(--ink-200)] rounded-xl p-[18px]"
const COLS = "2fr 1fr 0.8fr"

// ── Table ────────────────────────────────────────────────────────────────────

function CampaignTable() {
    return (
        <div className="overflow-hidden rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
            <div
                className="grid items-center gap-3 border-b border-[var(--ink-100)] px-4 py-2.5 font-mono text-[10px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]"
                style={{ gridTemplateColumns: COLS }}
            >
                <span>Campagne</span>
                <span>Statut</span>
                <span className="text-right">Coût</span>
            </div>

            <div
                className="grid h-12 items-center gap-3 border-b border-[var(--ink-100)] px-4"
                style={{ gridTemplateColumns: COLS }}
            >
                <span className="truncate text-[13px] tracking-tight text-[var(--ink-900)]">
                    Promo Fête des mères
                </span>
                <span>
                    <Chip tone="good">● Terminée</Chip>
                </span>
                <span className="text-right font-mono text-[12.5px] tabular-nums text-[var(--ink-700)]">
                    €76.94
                </span>
            </div>

            <div
                className="grid h-12 items-center gap-3 px-4"
                style={{ gridTemplateColumns: COLS }}
            >
                <span className="truncate text-[13px] tracking-tight text-[var(--ink-900)]">
                    Nouvelle collection
                </span>
                <span>
                    <Chip tone="accent">● En cours</Chip>
                </span>
                <span className="text-right font-mono text-[12.5px] tabular-nums text-[var(--ink-700)]">
                    €26.48
                </span>
            </div>
        </div>
    )
}

// ── Mini sidebar ───────────────────────────────────────────────────────────────

function NavItem({
    icon,
    label,
    count,
    active,
}: {
    icon: Parameters<typeof Icon>[0]["name"]
    label: string
    count?: string
    active?: boolean
}) {
    return (
        <div
            className={
                active
                    ? "flex items-center gap-2.5 rounded-lg border border-[var(--accent)]/20 bg-[var(--paper-white)] px-2.5 py-2 text-[13px] font-medium tracking-tight text-[var(--accent)] shadow-[0_1px_2px_rgba(10,10,10,0.04)]"
                    : "flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-[13px] tracking-tight text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-white)]"
            }
        >
            <Icon name={icon} size={16} />
            <span className="flex-1 truncate">{label}</span>
            {count ? (
                <Chip tone={active ? "accent" : "neutral"}>{count}</Chip>
            ) : null}
        </div>
    )
}

function MiniSidebar() {
    return (
        <div className="sb-item rounded-xl border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5">
            <div className="px-2.5 pb-1.5 pt-1 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                Pilotage
            </div>
            <div className="flex flex-col gap-0.5">
                <NavItem icon="hub" label="Tableau de bord" count="5" active />
                <NavItem icon="inbox" label="Conversations" count="142" />
                <NavItem icon="send" label="Campagnes" />
            </div>
        </div>
    )
}

// ── Story ──────────────────────────────────────────────────────────────────────

export const Default: Story = {
    render: () => (
        <div className="grid gap-4" style={{ gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))" }}>
            <div className={spec}>
                <CampaignTable />
                <div className={`${caption} mt-3`}>table · grid {COLS} · rows 48px</div>
            </div>

            <div className={spec}>
                <div style={{ maxWidth: 260 }}>
                    <MiniSidebar />
                </div>
                <div className={`${caption} mt-3`}>sidebar · .sb-item · active highlight</div>
            </div>
        </div>
    ),
}
