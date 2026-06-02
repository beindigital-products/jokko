import type { Meta, StoryObj } from "@storybook/nextjs-vite"

const meta = {
    title: "Primitives/Foundations",
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 28 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta

export default meta
type Story = StoryObj

// ── Colors ───────────────────────────────────────────────────────────────────

function Swatch({ hex, name }: { hex: string; name: string }) {
    return (
        <div>
            <div
                className="h-[60px] rounded-[10px] border border-[var(--ink-200)]"
                style={{ background: hex }}
            />
            <div className="mt-2 font-mono text-[11.5px] text-[var(--ink-700)]">{name}</div>
            <div className="mt-0.5 font-mono text-[10.5px] uppercase text-[var(--ink-soft)]">{hex}</div>
        </div>
    )
}

const SURFACES = [
    ["#FAFAFA", "--bg"],
    ["#FFFFFF", "--surface"],
    ["#F7F7F7", "--surface-2"],
    ["#252525", "--ink"],
    ["#5A5A5A", "--ink-3"],
    ["#8A8A8A", "--mute"],
]
const ACCENT = [
    ["#6938EF", "--accent"],
    ["#5A26D9", "--accent-2"],
    ["#4F1FCF", "--accent-ink"],
    ["#EFEAFE", "--accent-soft"],
    ["#EBEBEB", "--hairline"],
    ["#F2F2F2", "--hairline-2"],
]
const SEMANTIC = [
    ["#138A4E", "--good"],
    ["#B8860B", "--warn"],
    ["#DC3838", "--hot"],
    ["#25D366", "--wa-green"],
    ["#DBFF3A", "--highlight"],
]

function Group({ label, items }: { label: string; items: string[][] }) {
    return (
        <div className="mb-7">
            <div className="mb-3 font-mono text-[11px] font-semibold text-[var(--ink-700)]">{label}</div>
            <div className="grid grid-cols-3 gap-3.5 sm:grid-cols-6">
                {items.map(([hex, name]) => (
                    <Swatch key={name} hex={hex} name={name} />
                ))}
            </div>
        </div>
    )
}

export const Colors: Story = {
    render: () => (
        <div>
            <Group label="Surfaces & encre" items={SURFACES} />
            <Group label="Accent & lignes" items={ACCENT} />
            <Group label="Sémantique" items={SEMANTIC} />
        </div>
    ),
}

// ── Typography ────────────────────────────────────────────────────────────────

function TypeRow({ name, spec, children }: { name: string; spec: string; children: React.ReactNode }) {
    return (
        <div className="flex items-baseline gap-[18px] border-b border-[var(--ink-100)] py-3 last:border-b-0">
            <div className="w-[150px] shrink-0">
                <div className="font-mono text-[11px] text-[var(--ink-700)]">{name}</div>
                <div className="mt-0.5 font-mono text-[10px] text-[var(--ink-soft)]">{spec}</div>
            </div>
            <div className="min-w-0 text-[var(--ink-900)]">{children}</div>
        </div>
    )
}

export const Typography: Story = {
    render: () => (
        <div className="max-w-[820px] rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-5">
            <TypeRow name="Display" spec="JetBrains Mono · 38 / 500">
                <div className="font-display font-medium" style={{ fontSize: 38, lineHeight: 1 }}>
                    Tableau de bord
                </div>
            </TypeRow>
            <TypeRow name="Titre carte" spec="JetBrains Mono · 20 / 500">
                <div className="font-display font-medium" style={{ fontSize: 20 }}>
                    Qui prend la main
                </div>
            </TypeRow>
            <TypeRow name="Chiffre KPI" spec="JetBrains Mono · 30 · tnum">
                <div className="font-display font-medium tabular-nums" style={{ fontSize: 30 }}>
                    2 m 14 s
                </div>
            </TypeRow>
            <TypeRow name="Corps" spec="Geist · 13.5 / 400">
                <div className="text-[var(--ink-700)]" style={{ fontSize: 13.5 }}>
                    Ce qui demande votre attention ce matin, et un coup d&apos;œil sur l&apos;activité de
                    l&apos;équipe.
                </div>
            </TypeRow>
            <TypeRow name="Libellé" spec="Geist · 12.5 / 500">
                <div style={{ fontSize: 12.5, fontWeight: 500 }}>Montant à recharger</div>
            </TypeRow>
            <TypeRow name="Eyebrow / micro" spec="Geist Mono · 10.5 · caps">
                <div className="font-mono uppercase text-[var(--ink-soft)]" style={{ fontSize: 10.5, letterSpacing: "0.1em" }}>
                    Conversations reçues
                </div>
            </TypeRow>
        </div>
    ),
}

// ── Radius & Shadows ──────────────────────────────────────────────────────────

const RADII = [
    [4, "--r-xs · 4"],
    [8, "--r-sm · 8"],
    [12, "--r-md · 12"],
    [18, "--r-lg · 18"],
    [28, "--r-xl · 28"],
    [999, "--r-pill"],
] as const

const SHADOWS = [
    ["0 1px 2px rgba(10,10,10,0.04), 0 0 0 1px rgba(10,10,10,0.05)", "carte · subtile"],
    ["0 10px 30px -12px rgba(10,10,10,0.18)", "notification flottante"],
    ["0 24px 60px rgba(10,10,10,0.24)", "fenêtre modale"],
]

export const RadiusAndShadows: Story = {
    render: () => (
        <div>
            <div className="mb-3 font-mono text-[11px] font-semibold text-[var(--ink-700)]">Rayons</div>
            <div className="mb-8 grid grid-cols-3 gap-3.5 sm:grid-cols-6">
                {RADII.map(([r, label]) => (
                    <div key={label}>
                        <div
                            className="h-16 w-full border"
                            style={{
                                borderRadius: r,
                                background: "var(--accent-muted, #EFEAFE)",
                                borderColor: "rgba(105,56,239,0.22)",
                            }}
                        />
                        <div className="mt-2 font-mono text-[11px] text-[var(--ink-soft)]">{label}</div>
                    </div>
                ))}
            </div>

            <div className="mb-3 font-mono text-[11px] font-semibold text-[var(--ink-700)]">Ombres</div>
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
                {SHADOWS.map(([shadow, label]) => (
                    <div key={label}>
                        <div
                            className="h-16 w-full rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]"
                            style={{ boxShadow: shadow }}
                        />
                        <div className="mt-2 font-mono text-[11px] text-[var(--ink-soft)]">{label}</div>
                    </div>
                ))}
            </div>
        </div>
    ),
}
