import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
    AtSign,
    BarChart3,
    BookUser,
    ChevronDown,
    ChevronRight,
    Copy,
    Download,
    ExternalLink,
    FileText,
    Filter,
    Globe,
    LayoutGrid,
    MessageCircle,
    MessageSquare,
    MoreHorizontal,
    Paperclip,
    Phone,
    Plus,
    Receipt,
    RefreshCw,
    Repeat,
    Search,
    Send,
    Settings,
    Smile,
    Sparkles,
    Upload,
    UsersRound,
    Zap,
} from "lucide-react"

import { cn } from "@/lib/utils"

/**
 * Dashboard v3 — visual storybook catalog (PDF "Jokko Desktop — Print").
 *
 * 10 écrans × 6 sections (cf. .context/design-extraction-dashboard.md).
 * Tout statique : les pages prod dépendent de Convex queries (conversations,
 * contacts, channels, analytics). Ces stories rendent une approximation
 * fidèle de la chrome + densité pour valider tokens, hiérarchie et layout.
 */

// ─── Shell ──────────────────────────────────────────────────────────────

type ActiveItem =
    | "tableau-de-bord"
    | "conversations"
    | "mentions"
    | "assignations"
    | "contacts"
    | "modeles"
    | "campagnes"
    | "automatisations"
    | "integrations"
    | "equipe"
    | "analytics"
    | "reglages"
    | "facturation"

function DashboardShell({
    active,
    children,
}: {
    active: ActiveItem
    children: React.ReactNode
}) {
    return (
        <div className="flex min-h-screen bg-[var(--paper-white)] font-sans text-[var(--ink-900)]">
            <Sidebar active={active} />
            <main className="flex-1 min-w-0 border-l border-[var(--ink-200)]">
                {children}
            </main>
        </div>
    )
}

function Sidebar({ active }: { active: ActiveItem }) {
    return (
        <aside className="w-[260px] shrink-0 bg-[#FCFAF6] flex flex-col">
            {/* Org card */}
            <div className="px-3 pt-4 pb-3">
                <button className="flex w-full items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-2 text-left hover:bg-[var(--paper-warm)]">
                    <span className="flex h-7 w-7 items-center justify-center rounded-md bg-[var(--ink-900)] text-xs font-bold text-white">
                        a
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="truncate text-[13px] font-semibold">Atelier Bracquet</div>
                        <div className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                            PRO · 8 SIÈGES
                        </div>
                    </div>
                    <ChevronDown className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                </button>
            </div>

            {/* Search */}
            <div className="px-3 pb-3">
                <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                    <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                    <span className="flex-1 text-[12px] text-[var(--ink-400)]">Rechercher</span>
                    <span className="font-mono text-[10px] text-[var(--ink-400)]">⌘K</span>
                </div>
            </div>

            {/* Nav sections */}
            <nav className="flex-1 overflow-y-auto px-3 pb-3 space-y-4">
                <SidebarSection label="PILOTAGE">
                    <SidebarItem icon={LayoutGrid} label="Tableau de bord" badge="5" active={active === "tableau-de-bord"} />
                </SidebarSection>
                <SidebarSection label="INBOX">
                    <SidebarItem icon={MessageSquare} label="Conversations" badge="142" active={active === "conversations"} />
                    <SidebarItem icon={AtSign} label="Mentions" badge="1" active={active === "mentions"} />
                    <SidebarItem icon={Repeat} label="Assignations" badge="14" active={active === "assignations"} />
                </SidebarSection>
                <SidebarSection label="DONNÉES">
                    <SidebarItem icon={BookUser} label="Contacts" active={active === "contacts"} />
                    <SidebarItem icon={FileText} label="Modèles" active={active === "modeles"} />
                    <SidebarItem icon={Send} label="Campagnes" active={active === "campagnes"} />
                </SidebarSection>
                <SidebarSection label="AUTOMATISATION">
                    <SidebarItem icon={Zap} label="Automatisations" active={active === "automatisations"} />
                    <SidebarItem icon={Globe} label="Intégrations" badge={active === "automatisations" ? "4" : undefined} active={active === "integrations"} />
                </SidebarSection>
                <SidebarSection label="ÉQUIPE & INSIGHTS">
                    <SidebarItem icon={UsersRound} label="Équipe" active={active === "equipe"} />
                    <SidebarItem icon={BarChart3} label="Analytics" active={active === "analytics"} />
                </SidebarSection>
                <SidebarSection label="COMPTE">
                    <SidebarItem icon={Settings} label="Réglages" active={active === "reglages"} />
                    <SidebarItem icon={Receipt} label="Facturation" active={active === "facturation"} />
                </SidebarSection>
            </nav>

            {/* User card */}
            <div className="px-3 pb-4 pt-3 border-t border-[var(--ink-200)]">
                <button className="flex w-full items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-2 text-left">
                    <span className="flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-emerald-400 to-teal-600 text-xs font-bold text-white">
                        SB
                    </span>
                    <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                            <span className="truncate text-[13px] font-semibold">Sophie Br…</span>
                            <span className="rounded bg-[var(--accent)] px-1.5 py-0.5 font-mono text-[8px] font-bold uppercase tracking-[0.1em] text-white">
                                OWNER
                            </span>
                        </div>
                        <div className="text-[11px] text-[var(--ink-soft)]">Propriétaire</div>
                    </div>
                    <MoreHorizontal className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                </button>
            </div>
        </aside>
    )
}

function SidebarSection({ label, children }: { label: string; children: React.ReactNode }) {
    return (
        <div>
            <p className="px-2 pb-1.5 font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                {label}
            </p>
            <ul className="space-y-0.5">{children}</ul>
        </div>
    )
}

function SidebarItem({
    icon: Icon,
    label,
    badge,
    active,
}: {
    icon: React.ComponentType<{ className?: string }>
    label: string
    badge?: string
    active?: boolean
}) {
    return (
        <li>
            <button
                className={cn(
                    "flex w-full items-center gap-2 rounded-md px-2 py-1.5 text-[13px] transition-colors",
                    active
                        ? "bg-[var(--paper-white)] border border-[var(--ink-200)] shadow-sm font-semibold text-[var(--ink-900)]"
                        : "text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
                )}
            >
                <Icon className="h-4 w-4 shrink-0 text-[var(--ink-500)]" />
                <span className="flex-1 text-left truncate">{label}</span>
                {badge ? (
                    <span className="font-mono text-[10px] font-medium text-[var(--ink-soft)]">{badge}</span>
                ) : null}
            </button>
        </li>
    )
}

// ─── Page header ────────────────────────────────────────────────────────

function PageHeader({
    eyebrow,
    title,
    description,
    actions,
}: {
    eyebrow: string
    title: string
    description?: string
    actions?: React.ReactNode
}) {
    return (
        <div className="border-b border-[var(--ink-200)] px-8 pt-7 pb-5">
            <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                    <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                        {eyebrow}
                    </p>
                    <h1 className="mt-1 font-display text-[28px] font-bold tracking-tight text-[var(--ink-900)]">
                        {title}
                    </h1>
                    {description ? (
                        <p className="mt-1.5 max-w-2xl text-sm text-[var(--ink-500)]">{description}</p>
                    ) : null}
                </div>
                {actions ? <div className="flex shrink-0 items-center gap-2">{actions}</div> : null}
            </div>
        </div>
    )
}

function HeaderButton({
    icon: Icon,
    children,
    primary,
}: {
    icon?: React.ComponentType<{ className?: string }>
    children: React.ReactNode
    primary?: boolean
}) {
    return (
        <button
            className={cn(
                "inline-flex items-center gap-1.5 rounded-md px-3 py-1.5 text-[13px] font-medium transition-colors",
                primary
                    ? "bg-[var(--ink-900)] text-white hover:bg-[var(--ink-700)]"
                    : "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] hover:bg-[var(--paper-warm)]",
            )}
        >
            {Icon ? <Icon className="h-3.5 w-3.5" /> : null}
            {children}
        </button>
    )
}

// ─── Filter pills ───────────────────────────────────────────────────────

function FilterPills({
    items,
    activeIndex = 0,
    trailing,
}: {
    items: { label: string; count?: number | string }[]
    activeIndex?: number
    trailing?: React.ReactNode
}) {
    return (
        <div className="flex items-center justify-between gap-3 px-8 pt-5 pb-3">
            <div className="flex flex-wrap items-center gap-1.5">
                {items.map((it, i) => (
                    <button
                        key={it.label}
                        className={cn(
                            "inline-flex items-center gap-1.5 rounded-md px-2.5 py-1 text-[12px] font-medium transition-colors",
                            i === activeIndex
                                ? "bg-[var(--ink-900)] text-white"
                                : "bg-[var(--paper-warm)] text-[var(--ink-700)] hover:bg-[var(--ink-100)]",
                        )}
                    >
                        {it.label}
                        {it.count != null ? (
                            <span className={cn(
                                "font-mono text-[10px]",
                                i === activeIndex ? "text-white/70" : "text-[var(--ink-soft)]",
                            )}>
                                {it.count}
                            </span>
                        ) : null}
                    </button>
                ))}
            </div>
            {trailing}
        </div>
    )
}

// ─── Avatars + chips ────────────────────────────────────────────────────

type AvatarColor = "violet" | "emerald" | "rose" | "amber" | "sky" | "indigo" | "crimson" | "teal"
const AVATAR_GRADIENTS: Record<AvatarColor, string> = {
    violet: "from-violet-400 to-indigo-600",
    emerald: "from-emerald-400 to-teal-600",
    rose: "from-rose-400 to-pink-600",
    amber: "from-amber-400 to-orange-600",
    sky: "from-sky-400 to-blue-600",
    indigo: "from-indigo-400 to-violet-600",
    crimson: "from-red-500 to-rose-700",
    teal: "from-teal-400 to-cyan-600",
}

function Avatar({
    initials,
    color = "violet",
    size = "md",
    rounded = "circle",
}: {
    initials: string
    color?: AvatarColor
    size?: "sm" | "md" | "lg"
    rounded?: "circle" | "square"
}) {
    const dims = size === "sm" ? "h-6 w-6 text-[9px]" : size === "lg" ? "h-9 w-9 text-xs" : "h-8 w-8 text-[10px]"
    return (
        <span
            className={cn(
                "inline-flex shrink-0 items-center justify-center bg-gradient-to-br font-bold text-white",
                rounded === "circle" ? "rounded-full" : "rounded-md",
                dims,
                AVATAR_GRADIENTS[color],
            )}
        >
            {initials}
        </span>
    )
}

function Chip({
    children,
    tone = "neutral",
}: {
    children: React.ReactNode
    tone?: "neutral" | "accent" | "good" | "warn" | "danger" | "dark"
}) {
    const toneClass: Record<typeof tone, string> = {
        neutral: "bg-[var(--paper-warm)] text-[var(--ink-700)] border border-[var(--ink-200)]",
        accent: "bg-[var(--accent-muted)] text-[var(--accent)]",
        good: "bg-[var(--status-good-soft)] text-[var(--status-good)]",
        warn: "bg-[var(--status-warn-soft)] text-[var(--status-warn)]",
        danger: "bg-[var(--status-danger-soft)] text-[var(--status-danger)]",
        dark: "bg-[var(--ink-900)] text-white",
    }
    return (
        <span
            className={cn(
                "inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em]",
                toneClass[tone],
            )}
        >
            {children}
        </span>
    )
}

function StatusDot({ tone }: { tone: "good" | "warn" | "danger" | "neutral" }) {
    const c = tone === "good" ? "bg-[var(--status-good)]" : tone === "warn" ? "bg-[var(--status-warn)]" : tone === "danger" ? "bg-[var(--status-danger)]" : "bg-[var(--ink-400)]"
    return <span className={cn("inline-block h-1.5 w-1.5 rounded-full", c)} />
}

// ─── Screen 1 : Inbox · Conversations (3 colonnes) ──────────────────────

function ConversationsScreen() {
    return (
        <DashboardShell active="conversations">
            <div className="flex h-screen">
                {/* Col 2 — conversation list */}
                <div className="w-[340px] shrink-0 border-r border-[var(--ink-200)] flex flex-col">
                    <div className="border-b border-[var(--ink-200)] px-5 pt-7 pb-3">
                        <p className="font-mono text-[10px] font-medium uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                            Boîte de réception
                        </p>
                        <h1 className="mt-1 font-display text-[24px] font-bold tracking-tight">
                            Conversations
                        </h1>
                        <div className="mt-3 flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                            <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                            <span className="flex-1 text-[12px] text-[var(--ink-400)]">Filtrer par nom, tag, numéro…</span>
                        </div>
                        <div className="mt-3 flex flex-wrap items-center gap-1.5">
                            {[
                                { label: "Tout", count: 142, active: true },
                                { label: "Non lu", count: 28 },
                                { label: "Assigné", count: 12 },
                                { label: "Mentions", count: 1 },
                            ].map((p) => (
                                <button
                                    key={p.label}
                                    className={cn(
                                        "inline-flex items-center gap-1 rounded-md px-2 py-0.5 text-[11px] font-medium",
                                        p.active
                                            ? "bg-[var(--ink-900)] text-white"
                                            : "bg-[var(--paper-warm)] text-[var(--ink-700)]",
                                    )}
                                >
                                    {p.label}
                                    <span className={cn(
                                        "font-mono text-[9px]",
                                        p.active ? "text-white/70" : "text-[var(--ink-soft)]",
                                    )}>
                                        {p.count}
                                    </span>
                                </button>
                            ))}
                        </div>
                    </div>

                    <ul className="flex-1 overflow-y-auto divide-y divide-[var(--ink-100)]">
                        {[
                            { name: "Léa Marchand", initials: "LM", color: "rose", snippet: "Parfait, on lance.", time: "11:47", tags: ["VIP"], badge: 2, unread: false },
                            { name: "Mehdi Sané", initials: "MS", color: "violet", snippet: "Vous livrez à Dakar le mardi 3 ?", time: "11:32", tags: ["PROSPECT", "DAKAR"], badge: 3, unread: true, active: true },
                            { name: "Coralie Vidal", initials: "CV", color: "emerald", snippet: "Voici la photo de la pièce", time: "11:08", tags: ["CLIENT"], badge: 1 },
                            { name: "Sébastien Ouattara", initials: "SO", color: "amber", snippet: "Pour mardi 3, vous avez expédiés par DHL ?", time: "10:24", tags: ["PROSPECT"], badge: 0 },
                            { name: "Aurélien Petit", initials: "AP", color: "sky", snippet: "Vous-y, c'est noté", time: "09:53", tags: ["CLIENT"], badge: 0 },
                            { name: "Naomi Diop", initials: "ND", color: "indigo", snippet: "Note vocale · 0:34", time: "09:18", tags: ["VIP"], badge: 1 },
                            { name: "Pierre Wahl", initials: "PW", color: "violet", snippet: "Je vais à la fin la gauche", time: "08:42", tags: ["CLIENT"], badge: 0 },
                            { name: "Camille Rousseau", initials: "CR", color: "crimson", snippet: "Comment se passe l'envoi ?", time: "08:11", tags: ["VIP"], badge: 1 },
                        ].map((row, i) => (
                            <li
                                key={i}
                                className={cn(
                                    "flex items-start gap-2.5 px-4 py-3 cursor-pointer transition-colors",
                                    row.active ? "bg-[var(--accent-muted)]/40 border-l-2 border-l-[var(--accent)]" : "hover:bg-[var(--paper-warm)]",
                                )}
                            >
                                <Avatar initials={row.initials} color={row.color as AvatarColor} />
                                <div className="min-w-0 flex-1">
                                    <div className="flex items-center justify-between gap-2">
                                        <span className={cn("truncate text-[13px]", row.unread ? "font-bold" : "font-semibold")}>
                                            {row.name}
                                        </span>
                                        <span className="font-mono text-[10px] text-[var(--ink-soft)]">{row.time}</span>
                                    </div>
                                    <p className="truncate text-[11.5px] text-[var(--ink-soft)] mt-0.5">{row.snippet}</p>
                                    <div className="flex items-center gap-1 mt-1.5">
                                        {row.tags.map((t) => (
                                            <Chip key={t} tone={t === "VIP" ? "accent" : "neutral"}>{t}</Chip>
                                        ))}
                                        {row.badge && row.badge > 0 ? (
                                            <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 font-mono text-[9px] font-bold text-white">
                                                {row.badge}
                                            </span>
                                        ) : null}
                                    </div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>

                {/* Col 3 — thread */}
                <div className="flex flex-1 min-w-0 flex-col">
                    <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-5 py-3">
                        <div className="flex items-center gap-2.5">
                            <Avatar initials="MS" color="violet" />
                            <div>
                                <div className="flex items-center gap-1.5">
                                    <span className="text-[13px] font-semibold">Mehdi Sané</span>
                                    <span className="font-mono text-[11px] text-[var(--ink-soft)]">+221 77 614 02 11</span>
                                </div>
                                <div className="flex items-center gap-1.5 mt-0.5">
                                    <Chip tone="neutral">VIA DAKAR</Chip>
                                    <Chip tone="warn">● ASSIGNÉ À MOI</Chip>
                                    <Chip tone="neutral">PROSPECT</Chip>
                                </div>
                            </div>
                        </div>
                        <div className="flex items-center gap-1.5">
                            <HeaderButton>Réassigner</HeaderButton>
                            <HeaderButton primary>Résoudre</HeaderButton>
                        </div>
                    </div>

                    <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[var(--paper-warm)]/40">
                        <div className="text-center">
                            <span className="font-mono text-[10px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">
                                Aujourd&apos;hui · 24 mai 2026
                            </span>
                        </div>
                        <Bubble side="in">
                            Bonjour Inès,
                            <br />Vous livrez à Dakar le mardi 3 ?
                        </Bubble>
                        <Bubble side="in">
                            J&apos;ai besoin de 3 pièces du modèle Tessier en noir, taille M.
                        </Bubble>
                        <Bubble side="out">
                            Bonjour Mehdi, merci pour votre message. Je vérifie le stock immédiatement.
                        </Bubble>
                        <Bubble side="out">
                            Pour le mardi 3, nous expédions par DHL Express depuis Paris — arrivée Dakar mercredi 4 en fin de journée.
                        </Bubble>
                        <Bubble side="in">
                            Parfait. Pouvez-vous me confirmer le tarif pour les 3 pièces livrées ?
                        </Bubble>
                        <Bubble side="out">
                            3 Tessier noir M : 480 € TTC. Livraison Dakar : 64 €. Total : 544 €.
                        </Bubble>
                    </div>

                    <div className="border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-3">
                        <div className="flex items-center gap-2 mb-2">
                            {["Réponse", "Note", "Modèles", "Raccourcis"].map((t, i) => (
                                <button
                                    key={t}
                                    className={cn(
                                        "rounded-md px-2.5 py-1 text-[12px] font-medium",
                                        i === 0 ? "bg-[var(--ink-900)] text-white" : "text-[var(--ink-soft)] hover:text-[var(--ink-900)]",
                                    )}
                                >
                                    {t}
                                </button>
                            ))}
                            <span className="ml-auto inline-flex items-center gap-1 rounded-md bg-[var(--paper-warm)] px-2 py-0.5 font-mono text-[10px] text-[var(--ink-soft)]">
                                <Sparkles className="h-3 w-3" />
                                AI · ⌘+SHIFT+R
                            </span>
                        </div>
                        <div className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-2.5 text-[12.5px] text-[var(--ink-soft)]">
                            Tapez un message, / pour un raccourci, @ pour mentionner un coéquipier…
                        </div>
                        <div className="mt-2 flex items-center gap-1.5 text-[var(--ink-400)]">
                            <button className="p-1 hover:text-[var(--ink-700)]"><Paperclip className="h-3.5 w-3.5" /></button>
                            <button className="p-1 hover:text-[var(--ink-700)]"><Smile className="h-3.5 w-3.5" /></button>
                            <span className="ml-auto inline-flex items-center gap-1.5">
                                <Chip tone="neutral">FERMER + SE</Chip>
                                <button className="inline-flex items-center gap-1 rounded-md bg-[var(--accent)] px-3 py-1.5 text-[12px] font-semibold text-white">
                                    Envoyer
                                </button>
                            </span>
                        </div>
                    </div>
                </div>

                {/* Col 4 — Copilot */}
                <div className="w-[300px] shrink-0 border-l border-[var(--ink-200)] overflow-y-auto">
                    <div className="px-4 pt-5 pb-3 border-b border-[var(--ink-200)]">
                        <Avatar initials="MS" color="violet" size="lg" />
                        <div className="mt-2 text-[14px] font-semibold">Mehdi Sané</div>
                        <div className="font-mono text-[10.5px] text-[var(--ink-soft)]">+221 77 614 02 11</div>
                        <div className="mt-2 flex gap-1.5">
                            <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--ink-200)] px-2 py-1 text-[11px] font-medium">
                                <MessageCircle className="h-3 w-3" /> Email
                            </button>
                            <button className="inline-flex flex-1 items-center justify-center gap-1 rounded-md border border-[var(--ink-200)] px-2 py-1 text-[11px] font-medium">
                                <Phone className="h-3 w-3" /> Appeler
                            </button>
                        </div>
                    </div>
                    <div className="px-4 py-3 border-b border-[var(--ink-200)]">
                        <div className="flex gap-1.5">
                            <span className="rounded-md bg-[var(--accent)] px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-white">Copilot</span>
                            <span className="rounded-md px-2 py-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">Résumé</span>
                        </div>
                        <div className="mt-3 text-[11.5px] text-[var(--ink-700)] leading-relaxed">
                            Mehdi veut commander 3 × Tessier noir M, livraison Dakar mardi 3. Devis envoyé à 544 € TTC, en attente de confirmation paiement.
                        </div>
                    </div>
                    <div className="px-4 py-3 border-b border-[var(--ink-200)]">
                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">Brouillon proposé</p>
                        <div className="mt-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5 text-[11.5px] leading-relaxed">
                            Mehdi, je vous confirme la prise en compte du règlement. Expédition demain matin, vous recevrez le numéro de suivi DHL dans la journée.
                        </div>
                        <div className="mt-2 flex gap-1.5">
                            <button className="flex-1 rounded-md bg-[var(--accent)] py-1 text-[11px] font-semibold text-white">Insérer</button>
                            <button className="flex-1 rounded-md border border-[var(--ink-200)] py-1 text-[11px] font-semibold">Régénérer</button>
                        </div>
                    </div>
                    <div className="px-4 py-3">
                        <p className="font-mono text-[9px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">Attributs</p>
                        <dl className="mt-2 space-y-1.5 text-[11.5px]">
                            <Attr label="Pays" value="🇸🇳 Sénégal" />
                            <Attr label="Langue" value="Français" />
                            <Attr label="Source" value="Landing · 12 mai" />
                            <Attr label="Premier contact" value="il y a 12 jours" />
                            <Attr label="Valeur estimée" value="544 € · L1 cmd" />
                        </dl>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

function Bubble({ side, children }: { side: "in" | "out"; children: React.ReactNode }) {
    return (
        <div className={cn("flex", side === "out" ? "justify-end" : "justify-start")}>
            <div
                className={cn(
                    "max-w-[70%] rounded-2xl px-3 py-2 text-[12.5px] leading-relaxed",
                    side === "out"
                        ? "bg-[var(--ink-900)] text-white rounded-br-md"
                        : "bg-[var(--paper-white)] border border-[var(--ink-200)] text-[var(--ink-900)] rounded-bl-md",
                )}
            >
                {children}
            </div>
        </div>
    )
}

function Attr({ label, value }: { label: string; value: React.ReactNode }) {
    return (
        <div className="flex justify-between gap-2">
            <dt className="text-[var(--ink-soft)]">{label}</dt>
            <dd className="text-right font-medium">{value}</dd>
        </div>
    )
}

// ─── Screen 2 : Inbox · Mentions ────────────────────────────────────────

function MentionsScreen() {
    return (
        <DashboardShell active="mentions">
            <PageHeader
                eyebrow="INBOX · MENTIONS"
                title="Mentions"
                description="Là où vous êtes attendue : @mentions, assignations, réponses à vos notes internes."
            />
            <div className="px-8 py-6 space-y-4">
                {[
                    {
                        author: "Tom R.",
                        initials: "TR",
                        color: "crimson" as AvatarColor,
                        action: "vous a mentionnée sur",
                        target: "Mehdi Sané",
                        message: "@Inès tu peux vérifier le stock Tessier noir M ?",
                        time: "il y a 8 min",
                    },
                    {
                        author: "Lucie A.",
                        initials: "LA",
                        color: "rose" as AvatarColor,
                        action: "vous a assigné",
                        target: "Coralie Vidal",
                        message: "Cliente VIP — à traiter ce matin",
                        time: "il y a 32 min",
                    },
                    {
                        author: "Omar B.",
                        initials: "OB",
                        color: "emerald" as AvatarColor,
                        action: "a répondu à votre note",
                        target: "Naomi Diop",
                        message: "« Stock OK, on a 4 pièces »",
                        time: "il y a 1h",
                    },
                ].map((row, i) => (
                    <div
                        key={i}
                        className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4"
                    >
                        <div className="flex items-start gap-3">
                            <Avatar initials={row.initials} color={row.color} />
                            <div className="flex-1 min-w-0">
                                <div className="text-[13px]">
                                    <span className="font-semibold">{row.author}</span>{" "}
                                    <span className="text-[var(--ink-soft)]">{row.action}</span>{" "}
                                    <span className="font-semibold">{row.target}</span>
                                </div>
                                <div className="mt-2 rounded-md border-l-2 border-[var(--accent)] bg-[var(--paper-warm)] px-3 py-2 text-[12px]">
                                    {row.message}
                                </div>
                                <div className="mt-2.5 flex items-center justify-between">
                                    <div className="flex items-center gap-2">
                                        <HeaderButton>↩ Répondre</HeaderButton>
                                        <HeaderButton>Ouvrir la conversation</HeaderButton>
                                    </div>
                                    <span className="font-mono text-[10px] text-[var(--ink-soft)]">{row.time}</span>
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
        </DashboardShell>
    )
}

// ─── Screen 3 : Contacts ────────────────────────────────────────────────

function ContactsScreen() {
    return (
        <DashboardShell active="contacts">
            <PageHeader
                eyebrow="DONNÉES · 2 408 CONTACTS"
                title="Contacts"
                description="Annuaire unifié — synchro WhatsApp, attributs, segments. Import CSV, déduplication, export RGPD."
                actions={
                    <>
                        <HeaderButton icon={Filter}>Filtres</HeaderButton>
                        <HeaderButton icon={Upload}>Importer</HeaderButton>
                        <HeaderButton icon={Download}>Exporter</HeaderButton>
                        <HeaderButton icon={Plus} primary>Nouveau contact</HeaderButton>
                    </>
                }
            />
            <FilterPills
                items={[
                    { label: "Tous", count: "2 408" },
                    { label: "VIP", count: 38 },
                    { label: "Prospects", count: 472 },
                    { label: "Clients actifs", count: "1 204" },
                    { label: "Inactifs 90j", count: 696 },
                    { label: "Dakar", count: 182 },
                    { label: "Abidjan", count: 94 },
                ]}
                trailing={
                    <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5 w-[280px]">
                        <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                        <span className="flex-1 text-[12px] text-[var(--ink-400)]">Rechercher un contact</span>
                    </div>
                }
            />
            <div className="px-8 pb-6">
                <table className="w-full">
                    <thead>
                        <tr className="border-y border-[var(--ink-200)]">
                            {["", "NOM", "TÉLÉPHONE · EMAIL", "TAGS", "DERNIER ÉCHANGE", "VALEUR", "CMD."].map((h) => (
                                <th
                                    key={h}
                                    className="px-2 py-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]"
                                >
                                    {h}
                                </th>
                            ))}
                            <th />
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-[var(--ink-100)]">
                        {[
                            { name: "Léa Marchand", initials: "LM", color: "rose", phone: "+33 6 12 34 56 78", email: "lea.marchand@gmail.com", tags: [{ l: "CLIENT", t: "neutral" }, { l: "VIP", t: "accent" }], last: "il y a 2h", value: "2 480 €", cmd: 3 },
                            { name: "Mehdi Sané", initials: "MS", color: "violet", phone: "+221 77 614 02 11", email: "mehdi@sene-imports.sn", tags: [{ l: "PROSPECT", t: "neutral" }, { l: "DAKAR", t: "neutral" }], last: "il y a 16min", value: "544 €", cmd: 1 },
                            { name: "Coralie Vidal", initials: "CV", color: "emerald", phone: "+33 7 88 23 47 02", email: "coralie.v@hotmail.fr", tags: [{ l: "SUPPORT", t: "neutral" }], last: "il y a 30min", value: "320 €", cmd: 2 },
                            { name: "Sébastien Ouattara", initials: "SO", color: "amber", phone: "+225 07 04 88 12 90", email: "ouattara.s@gmail.com", tags: [{ l: "PROSPECT", t: "neutral" }, { l: "ABIDJAN", t: "neutral" }], last: "il y a 1h", value: "—", cmd: 0 },
                            { name: "Aurélien Petit", initials: "AP", color: "sky", phone: "+33 6 65 03 11 47", email: "a.petit@maison-petit.fr", tags: [{ l: "CLIENT", t: "neutral" }], last: "il y a 2h", value: "1 120 €", cmd: 4 },
                            { name: "Naomi Diop", initials: "ND", color: "indigo", phone: "+221 76 408 33 02", email: "naomi.diop@orange.sn", tags: [{ l: "CLIENT", t: "neutral" }, { l: "DAKAR", t: "neutral" }], last: "hier", value: "880 €", cmd: 2 },
                            { name: "Pierre Wahl", initials: "PW", color: "violet", phone: "+33 6 41 22 88 09", email: "pierre.wahl@me.com", tags: [{ l: "CLIENT", t: "neutral" }], last: "hier", value: "410 €", cmd: 1 },
                            { name: "Camille Rousseau", initials: "CR", color: "crimson", phone: "+33 7 14 09 33 81", email: "c.rousseau@gmail.com", tags: [{ l: "CLIENT", t: "neutral" }, { l: "VIP", t: "accent" }], last: "mardi", value: "3 240 €", cmd: 6 },
                        ].map((c, i) => (
                            <tr key={i} className="hover:bg-[var(--paper-warm)]/60">
                                <td className="px-2 py-3">
                                    <input type="checkbox" className="h-3 w-3 rounded border-[var(--ink-300)]" />
                                </td>
                                <td className="px-2 py-3">
                                    <div className="flex items-center gap-2.5">
                                        <Avatar initials={c.initials} color={c.color as AvatarColor} />
                                        <div>
                                            <div className="text-[13px] font-semibold">{c.name}</div>
                                            <div className="font-mono text-[10px] text-[var(--ink-soft)]">{c.phone.replace(/\s/g, " ")}</div>
                                        </div>
                                    </div>
                                </td>
                                <td className="px-2 py-3">
                                    <div className="font-mono text-[11px]">{c.phone}</div>
                                    <div className="text-[11px] text-[var(--ink-soft)]">{c.email}</div>
                                </td>
                                <td className="px-2 py-3">
                                    <div className="flex flex-wrap gap-1">
                                        {c.tags.map((t) => (
                                            <Chip key={t.l} tone={t.t as "neutral" | "accent"}>{t.l}</Chip>
                                        ))}
                                    </div>
                                </td>
                                <td className="px-2 py-3 text-[12px]">{c.last}</td>
                                <td className="px-2 py-3 text-right text-[12px] font-semibold">{c.value}</td>
                                <td className="px-2 py-3 text-right text-[12px] tabular-nums">{c.cmd}</td>
                                <td className="px-2 py-3 text-right">
                                    <MoreHorizontal className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
                <Pagination current="12 sur 2 408 · 0 sélectionné" page="1 / 201" />
            </div>
        </DashboardShell>
    )
}

function Pagination({ current, page }: { current: string; page: string }) {
    return (
        <div className="mt-4 flex items-center justify-between text-[11px] text-[var(--ink-soft)]">
            <span>{current}</span>
            <div className="flex items-center gap-2">
                <button className="rounded-md border border-[var(--ink-200)] p-1">
                    <ChevronRight className="h-3 w-3 rotate-180" />
                </button>
                <span className="font-mono">{page}</span>
                <button className="rounded-md border border-[var(--ink-200)] p-1">
                    <ChevronRight className="h-3 w-3" />
                </button>
            </div>
        </div>
    )
}

// ─── Screen 4 : Modèles ─────────────────────────────────────────────────

function ModelesScreen() {
    const templates = [
        { name: "Devis envoyé", body: "Bonjour {{1}}, voici votre devis personnalisé…", category: "Marketing", lang: "FR", status: "APPROUVÉ", statusTone: "good", sent: "1 240", open: "78%", active: true },
        { name: "Confirmation commande", body: "Votre commande {{1}} est confirmée pour la…", category: "Utility", lang: "FR", status: "APPROUVÉ", statusTone: "good", sent: "3 480", open: "94%" },
        { name: "Suivi livraison", body: "Bonjour, votre colis {{1}} arrive le {{2}}. Suiv…", category: "Utility", lang: "FR", status: "APPROUVÉ", statusTone: "good", sent: "2 880", open: "88%" },
        { name: "Relance impayée", body: "Bonjour {{1}}, la facture {{2}} reste à régler…", category: "Utility", lang: "FR", status: "EN ATTENTE", statusTone: "warn", sent: "—", open: "—" },
        { name: "Rdv confirmé", body: "Votre rendez-vous est confirmé le {{1}} à {{2…", category: "Utility", lang: "FR", status: "APPROUVÉ", statusTone: "good", sent: "142", open: "92%" },
        { name: "Welcome customer", body: "Welcome {{1}}! Reply STOP to unsubscribe.", category: "Marketing", lang: "EN", status: "APPROUVÉ", statusTone: "good", sent: "88", open: "64%" },
        { name: "Promo Vendredi noir", body: "Profitez de -30% pendant 48h sur la collec…", category: "Marketing", lang: "FR", status: "REFUSÉ", statusTone: "danger", sent: "—", open: "—" },
    ]
    return (
        <DashboardShell active="modeles">
            <PageHeader
                eyebrow="DONNÉES · 24 MODÈLES · SYNCHRO META"
                title="Modèles"
                description="Templates WhatsApp synchronisés avec Meta. Header, body, footer, variables. Soumission + suivi approbation."
                actions={
                    <>
                        <HeaderButton icon={RefreshCw}>Sync Meta</HeaderButton>
                        <HeaderButton icon={Plus} primary>Nouveau modèle</HeaderButton>
                    </>
                }
            />
            <FilterPills
                items={[
                    { label: "Tous", count: 24 },
                    { label: "Utilitaires", count: 14 },
                    { label: "Marketing", count: 8 },
                    { label: "Authentif.", count: 2 },
                ]}
                trailing={
                    <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5 w-[240px]">
                        <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                        <span className="flex-1 text-[12px] text-[var(--ink-400)]">Rechercher</span>
                    </div>
                }
            />
            <div className="grid grid-cols-[1fr_320px] gap-0">
                {/* Left : table */}
                <div className="px-8 pb-6">
                    <table className="w-full">
                        <thead>
                            <tr className="border-y border-[var(--ink-200)]">
                                {["MODÈLE", "CATÉGORIE", "LANGUE", "STATUT META", "ENVOYÉS", "OUVERT"].map((h) => (
                                    <th key={h} className="px-2 py-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
                                        {h}
                                    </th>
                                ))}
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-[var(--ink-100)]">
                            {templates.map((t, i) => (
                                <tr
                                    key={i}
                                    className={cn(
                                        "hover:bg-[var(--paper-warm)]/60",
                                        t.active && "bg-[var(--accent-muted)]/30 border-l-2 border-l-[var(--accent)]",
                                    )}
                                >
                                    <td className="px-2 py-3">
                                        <div className="text-[13px] font-semibold">{t.name}</div>
                                        <div className="font-mono text-[11px] text-[var(--ink-soft)] mt-0.5 truncate max-w-[300px]">{t.body}</div>
                                    </td>
                                    <td className="px-2 py-3 text-[12px]">{t.category}</td>
                                    <td className="px-2 py-3 text-[12px]">{t.lang}</td>
                                    <td className="px-2 py-3">
                                        <Chip tone={t.statusTone as "good" | "warn" | "danger"}>● {t.status}</Chip>
                                    </td>
                                    <td className="px-2 py-3 text-right text-[12px] tabular-nums">{t.sent}</td>
                                    <td className="px-2 py-3 text-right text-[12px] tabular-nums">{t.open}</td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Right : aperçu fidèle */}
                <aside className="border-l border-[var(--ink-200)] px-5 pt-5 pb-6 bg-[var(--paper-warm)]/40">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">Aperçu</p>
                    <h3 className="mt-1 font-display text-lg font-bold tracking-tight">Devis envoyé</h3>
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        <Chip tone="good">● APPROUVÉ</Chip>
                        <Chip tone="neutral">MARKETING</Chip>
                        <Chip tone="neutral">FR</Chip>
                    </div>

                    {/* WhatsApp-like preview */}
                    <div className="mt-4 rounded-2xl border border-[var(--ink-200)] bg-[#FFFBF0] p-3 shadow-sm">
                        <div className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] p-2 text-[11px] text-[var(--ink-700)]">
                            📄 Devis_{`{{2}}`}.pdf
                        </div>
                        <div className="mt-2 text-[12px] text-[var(--ink-900)]">
                            Bonjour <span className="rounded bg-[var(--accent-muted)] px-1 font-mono text-[10px] text-[var(--accent)]">{`{{1}}`}</span>, voici votre devis personnalisé pour{" "}
                            <span className="rounded bg-[var(--accent-muted)] px-1 font-mono text-[10px] text-[var(--accent)]">{`{{2}}`}</span>. Il est valable 14 jours.
                            <div className="mt-1 text-[var(--ink-soft)] text-[11px]">— L&apos;équipe Atelier Bracquet</div>
                        </div>
                        <div className="mt-2 text-right font-mono text-[10px] text-[var(--ink-soft)]">11:32 ✓✓</div>
                        <div className="mt-3 space-y-1.5 border-t border-[var(--ink-200)] pt-2">
                            <button className="flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
                                <Phone className="h-3 w-3" /> Nous appeler
                            </button>
                            <button className="flex w-full items-center justify-center gap-1.5 text-[12px] font-medium text-[var(--accent)]">
                                <ExternalLink className="h-3 w-3" /> Voir la boutique
                            </button>
                        </div>
                    </div>

                    <div className="mt-4 flex gap-2">
                        <HeaderButton>Éditer</HeaderButton>
                        <HeaderButton>Envoyer test</HeaderButton>
                        <HeaderButton primary>Utiliser</HeaderButton>
                    </div>
                </aside>
            </div>
        </DashboardShell>
    )
}

// ─── Screen 5 : Campagnes ───────────────────────────────────────────────

function CampagnesScreen() {
    return (
        <DashboardShell active="campagnes">
            <PageHeader
                eyebrow="DIFFUSION · 6 CAMPAGNES"
                title="Campagnes"
                description="Diffusions massives sur templates approuvés Meta. Audiences segmentées, planification, suivi livraison + ROI."
                actions={
                    <>
                        <HeaderButton icon={Filter}>Filtres</HeaderButton>
                        <HeaderButton icon={Plus} primary>Nouvelle campagne</HeaderButton>
                    </>
                }
            />
            <div className="grid grid-cols-4 gap-4 border-b border-[var(--ink-200)] px-8 py-5">
                <Metric eyebrow="ENVOYÉS CE MOIS" value="4 695" trend="↗ +18%" />
                <Metric eyebrow="TAUX DE LIVRAISON" value="98.4%" trend="↗ +0.6 pt" />
                <Metric eyebrow="TAUX DE LECTURE" value="78.3%" trend="↗ +2.1 pt" />
                <Metric eyebrow="COÛT META · MOIS" value="€148.72" trend="€820 budget" subtle />
            </div>
            <table className="w-full px-8">
                <thead>
                    <tr className="border-b border-[var(--ink-200)]">
                        {["CAMPAGNE", "STATUT · DÉMARRAGE", "MODÈLE", "AUDIENCE", "LIVRÉS", "LUS", "COÛT"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-100)]">
                    {[
                        { name: "Nouvelle collection printemps", statusChip: { l: "● EN COURS", t: "accent" }, sub: "aujourd'hui 11:00", tpl: "Welcome customer", aud: "1 240", liv: "821", lu: "612", cout: "€26.48", underline: true },
                        { name: "Relance paniers abandonnés", statusChip: { l: "● PLANIFIÉE", t: "neutral" }, sub: "Démarre dans 21h", tpl: "Relance impayée", aud: "88", liv: "—", lu: "—", cout: "est. €2.80" },
                        { name: "Promo Fête des mères", statusChip: { l: "● TERMINÉE", t: "good" }, sub: "26 mai · terminé", tpl: "Devis envoyé", aud: "2 408", liv: "2 392", lu: "1 880", cout: "€76.94" },
                        { name: "Sondage satisfaction", statusChip: { l: "● TERMINÉE", t: "good" }, sub: "20 mai · terminé", tpl: "Confirmation cmd.", aud: "142", liv: "142", lu: "128", cout: "€4.54" },
                        { name: "Lancement service livraison", statusChip: { l: "BROUILLON", t: "neutral" }, sub: "À configurer", tpl: "—", aud: "—", liv: "—", cout: "—" },
                        { name: "Réactivation 90j", statusChip: { l: "● EN PAUSE", t: "warn" }, sub: "en pause", tpl: "Welcome customer", aud: "696", liv: "208", lu: "92", cout: "€6.72", underline: true },
                    ].map((c, i) => (
                        <tr key={i} className="hover:bg-[var(--paper-warm)]/60">
                            <td className="px-3 py-3">
                                <div className={cn("text-[13px] font-semibold", c.underline && "border-b-2 border-[var(--accent)] inline-block")}>{c.name}</div>
                            </td>
                            <td className="px-3 py-3">
                                <Chip tone={c.statusChip.t as "neutral" | "accent" | "good" | "warn"}>{c.statusChip.l}</Chip>
                                <div className="mt-1 text-[11px] text-[var(--ink-soft)]">{c.sub}</div>
                            </td>
                            <td className="px-3 py-3 text-[12px]">{c.tpl}</td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums">{c.aud}</td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums">{c.liv}</td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums">{c.lu}</td>
                            <td className="px-3 py-3 text-right text-[12px] tabular-nums">{c.cout}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DashboardShell>
    )
}

function Metric({
    eyebrow,
    value,
    trend,
    subtle,
}: {
    eyebrow: string
    value: string
    trend?: string
    subtle?: boolean
}) {
    return (
        <div>
            <p className="font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">{eyebrow}</p>
            <div className="mt-1 font-display text-[28px] font-bold tracking-tight tabular-nums">{value}</div>
            {trend ? (
                <div className={cn("mt-0.5 text-[11px]", subtle ? "text-[var(--ink-soft)]" : "text-[var(--status-good)]")}>
                    {trend}
                </div>
            ) : null}
        </div>
    )
}

// ─── Screen 6 : Flows · builder visuel ──────────────────────────────────

function FlowsScreen() {
    const tools = [
        { code: "DÉCL.", label: "Déclencheur" },
        { code: "MSG", label: "Message" },
        { code: "INT.", label: "Interaction" },
        { code: "COND.", label: "Condition" },
        { code: "ASSIG.", label: "Assignation" },
        { code: "API", label: "API" },
    ]
    return (
        <DashboardShell active="automatisations">
            <PageHeader
                eyebrow="AUTOMATISATION · 11 FLOWS"
                title="Flows"
                description="Builder visuel — déclencheurs, conditions, actions. Exécution serveur sur messages entrants."
                actions={
                    <>
                        <HeaderButton icon={FileText}>Modèles</HeaderButton>
                        <HeaderButton icon={Plus} primary>Nouveau flow</HeaderButton>
                    </>
                }
            />
            <div className="grid grid-cols-[320px_1fr] h-[calc(100vh-140px)]">
                {/* Flow list */}
                <div className="border-r border-[var(--ink-200)] overflow-y-auto">
                    <div className="px-4 py-3">
                        <div className="flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] px-2.5 py-1.5">
                            <Search className="h-3.5 w-3.5 text-[var(--ink-400)]" />
                            <span className="flex-1 text-[12px] text-[var(--ink-400)]">Rechercher un flow</span>
                        </div>
                    </div>
                    {[
                        { name: "Welcome — premier message", sub: "Premier message", exec: "1 240 exéc.", time: "il y a 8 min", percent: "78%", active: true },
                        { name: "Routage par mot-clé", sub: "Mots-clés", exec: "892 exéc.", time: "il y a 22 min", percent: "" },
                        { name: "Hors horaires — auto-réponse", sub: "Plage horaire", exec: "410 exéc.", time: "hier 19:01", percent: "" },
                        { name: "Devis automatisé", sub: "Mot-clé « devis »", exec: "188 exéc.", time: "il y a 1h", percent: "54%" },
                        { name: "Sondage post-livraison", sub: "Webhook livraison", exec: "64 exéc.", time: "20 mai", percent: "" },
                        { name: "Reroute support → ventes", sub: "Mot-clé « acheter »", exec: "142 exéc.", time: "il y a 4h", percent: "32%" },
                    ].map((f, i) => (
                        <div
                            key={i}
                            className={cn(
                                "px-4 py-3 border-b border-[var(--ink-100)] cursor-pointer",
                                f.active ? "bg-[var(--accent-muted)]/40 border-l-2 border-l-[var(--accent)]" : "hover:bg-[var(--paper-warm)]/60",
                            )}
                        >
                            <div className="flex items-start justify-between gap-2">
                                <span className={cn(
                                    "mt-0.5 inline-block h-3 w-5 rounded-full",
                                    i < 4 ? "bg-[var(--accent)]" : "bg-[var(--ink-200)]",
                                )}>
                                    <span className={cn("block h-2.5 w-2.5 rounded-full bg-white mt-px transition-transform", i < 4 ? "ml-2" : "ml-px")} />
                                </span>
                                <span className="flex-1 text-[13px] font-semibold">{f.name}</span>
                            </div>
                            <div className="mt-1 ml-7 text-[11px] text-[var(--ink-soft)]">
                                ⚡ {f.sub}
                            </div>
                            <div className="mt-1 ml-7 flex items-center justify-between text-[10px] text-[var(--ink-soft)]">
                                <span>{f.exec} {f.percent ? <span className="text-[var(--accent)]">· {f.percent}</span> : null}</span>
                                <span>{f.time}</span>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Canvas */}
                <div className="relative flex flex-col">
                    <div className="flex items-center justify-between border-b border-[var(--ink-200)] px-5 py-3">
                        <div className="flex items-center gap-2">
                            <Send className="h-4 w-4 text-[var(--accent)]" />
                            <span className="text-[14px] font-semibold">Welcome — premier message</span>
                            <Chip tone="good">● ACTIF</Chip>
                        </div>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] text-[var(--ink-soft)]">v.12 · édité il y a 2h</span>
                            <HeaderButton>Tester</HeaderButton>
                            <HeaderButton>Historique</HeaderButton>
                            <HeaderButton primary>Publier</HeaderButton>
                        </div>
                    </div>

                    <div className="flex flex-1 min-h-0">
                        {/* Tool palette */}
                        <div className="w-[52px] shrink-0 border-r border-[var(--ink-200)] py-3">
                            {tools.map((t) => (
                                <div key={t.code} className="px-1 py-2 text-center" title={t.label}>
                                    <span className="font-mono text-[8.5px] font-semibold tracking-[0.05em] text-[var(--ink-soft)]">{t.code}</span>
                                </div>
                            ))}
                        </div>
                        {/* Nodes */}
                        <div className="relative flex-1 bg-[var(--paper-warm)]/30 overflow-auto"
                            style={{
                                backgroundImage: "radial-gradient(circle at 1px 1px, rgba(20,20,26,0.08) 1px, transparent 0)",
                                backgroundSize: "16px 16px",
                            }}
                        >
                            <div className="absolute top-12 left-8 w-[200px] rounded-md border border-[var(--status-warn)]/40 bg-[var(--status-warn-soft)] p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--status-warn)]">
                                    <span>⚡ TRIGGER</span>
                                </div>
                                <div className="mt-1 text-[12px] font-semibold">Déclencheur</div>
                                <div className="text-[10.5px] text-[var(--ink-soft)]">Premier message reçu</div>
                            </div>

                            <div className="absolute top-12 left-[300px] w-[220px] rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                                    <Send className="h-2.5 w-2.5" /> MESSAGE
                                </div>
                                <div className="mt-1 text-[12px] font-semibold">Envoyer message</div>
                                <div className="text-[10.5px] text-[var(--ink-soft)]">« Bonjour ! Merci pour votre message… »</div>
                            </div>

                            <div className="absolute top-12 left-[560px] w-[200px] rounded-md border border-[var(--accent)]/40 bg-[var(--accent-muted)]/40 p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--accent)]">
                                    CONDITION · SI / SINON
                                </div>
                                <div className="mt-1 text-[12px] font-semibold">Condition</div>
                                <div className="text-[10.5px] text-[var(--ink-soft)]">Contient mot-clé ?</div>
                            </div>

                            <div className="absolute top-4 left-[810px] w-[200px] rounded-md border border-[var(--status-good)]/40 bg-[var(--status-good-soft)] p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--status-good)]">
                                    <UsersRound className="h-2.5 w-2.5" /> ACTION
                                </div>
                                <div className="mt-1 text-[12px] font-semibold">Assigner</div>
                                <div className="text-[10.5px] text-[var(--ink-soft)]">Pôle Ventes · round-robin</div>
                            </div>

                            <div className="absolute top-32 left-[810px] w-[200px] rounded-md border border-[var(--status-good)]/40 bg-[var(--status-good-soft)] p-2.5 shadow-sm">
                                <div className="flex items-center gap-1.5 text-[10px] font-mono font-semibold uppercase tracking-[0.1em] text-[var(--status-good)]">
                                    <UsersRound className="h-2.5 w-2.5" /> ACTION
                                </div>
                                <div className="mt-1 text-[12px] font-semibold">Tag + Modèle</div>
                                <div className="text-[10.5px] text-[var(--ink-soft)]">Tag « support » · « Welcome customer »</div>
                            </div>

                            {/* Connectors (lignes simplifiées) */}
                            <svg className="absolute inset-0 w-full h-full pointer-events-none">
                                <line x1="208" y1="58" x2="300" y2="58" stroke="var(--ink-300)" strokeWidth="1" />
                                <line x1="520" y1="58" x2="560" y2="58" stroke="var(--ink-300)" strokeWidth="1" />
                                <line x1="760" y1="58" x2="810" y2="35" stroke="var(--ink-300)" strokeWidth="1" />
                                <line x1="760" y1="58" x2="810" y2="160" stroke="var(--ink-300)" strokeWidth="1" />
                            </svg>
                        </div>
                    </div>

                    <div className="border-t border-[var(--ink-200)] flex items-center justify-between px-5 py-3 bg-[var(--paper-white)]">
                        <div className="flex items-center gap-5 text-[11px]">
                            <Metric eyebrow="EXÉC. 7J" value="1 240" />
                            <Metric eyebrow="CONVERSION" value="78%" />
                            <Metric eyebrow="ÉCHECS" value="2" />
                        </div>
                        <div className="flex items-center gap-1.5 text-[11px] text-[var(--ink-soft)]">
                            <button className="rounded border border-[var(--ink-200)] p-1">+</button>
                            <button className="rounded border border-[var(--ink-200)] p-1">−</button>
                            <span className="font-mono">100%</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

// ─── Screen 7 : Team ────────────────────────────────────────────────────

function TeamScreen() {
    return (
        <DashboardShell active="equipe">
            <PageHeader
                eyebrow="ÉQUIPE · 8 / 10 SIÈGES"
                title="Team"
                description="Membres, rôles et pôles. Round-robin d'assignation. Limite Pro : 10 sièges."
                actions={
                    <>
                        <HeaderButton icon={UsersRound}>Pôles</HeaderButton>
                        <HeaderButton>Invitations · 2</HeaderButton>
                        <HeaderButton icon={Plus} primary>Inviter un membre</HeaderButton>
                    </>
                }
            />
            <div className="px-8 py-5">
                <p className="font-mono text-[9.5px] uppercase tracking-[0.15em] text-[var(--ink-soft)]">Pôles</p>
                <div className="mt-2 grid grid-cols-4 gap-2.5">
                    {[
                        { name: "Ventes", color: "from-violet-400 to-violet-600", members: 3, conv: 22 },
                        { name: "Support", color: "from-emerald-400 to-emerald-600", members: 3, conv: 48 },
                        { name: "Dakar", color: "from-amber-400 to-amber-600", members: 2, conv: 14 },
                        { name: "Direction", color: "from-rose-400 to-rose-600", members: 1, conv: 2 },
                    ].map((p) => (
                        <div key={p.name} className="flex items-center gap-2.5 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-3">
                            <span className={cn("h-2 w-full max-w-[3px] rounded-full bg-gradient-to-b", p.color)} style={{ height: 36 }} />
                            <div>
                                <div className="text-[13px] font-semibold">{p.name}</div>
                                <div className="text-[11px] text-[var(--ink-soft)]">{p.members} membres · {p.conv} conv. ouvertes</div>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-center rounded-xl border border-dashed border-[var(--ink-200)] p-3 text-[12px] text-[var(--ink-soft)]">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Nouveau pôle
                    </div>
                </div>
            </div>
            <table className="w-full px-8">
                <thead>
                    <tr className="border-y border-[var(--ink-200)]">
                        {["MEMBRE", "RÔLE", "STATUT", "PÔLES", "CONV. OUVERTES", "A REJOINT"].map((h) => (
                            <th key={h} className="px-3 py-2.5 text-left font-mono text-[9.5px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">{h}</th>
                        ))}
                    </tr>
                </thead>
                <tbody className="divide-y divide-[var(--ink-100)]">
                    {[
                        { name: "Inès Caron", initials: "IC", color: "indigo", email: "ines@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "good", status: "En ligne", poles: ["VENTES"], conv: 12, joined: "8 mars 2026" },
                        { name: "Tom Roussel", initials: "TR", color: "crimson", email: "tom@bracquet.fr", role: { l: "ADMIN", t: "accent" }, dot: "good", status: "En ligne", poles: ["VENTES", "SUPPORT"], conv: 6, joined: "4 fév. 2026" },
                        { name: "Lucie Aubert", initials: "LA", color: "rose", email: "lucie@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "warn", status: "Occupé", poles: ["SUPPORT"], conv: 18, joined: "22 jan. 2026" },
                        { name: "Omar Ba", initials: "OB", color: "emerald", email: "omar@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "good", status: "En ligne", poles: ["DAKAR"], conv: 8, joined: "11 nov. 2025" },
                        { name: "Sophie Bracquet", initials: "SB", color: "teal", email: "sophie@bracquet.fr", role: { l: "OWNER", t: "dark" }, dot: "neutral", status: "Absent", poles: ["DIRECTION"], conv: 2, joined: "4 jan. 2025" },
                        { name: "Mathieu Khelifa", initials: "MK", color: "violet", email: "mathieu@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "neutral", status: "Hors ligne", poles: ["SUPPORT"], conv: 0, joined: "18 avr. 2026" },
                        { name: "Awa Sow", initials: "AS", color: "amber", email: "awa.sow@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "good", status: "En ligne", poles: ["DAKAR"], conv: 14, joined: "12 mai 2026" },
                        { name: "Camille Brun", initials: "CB", color: "crimson", email: "camille@bracquet.fr", role: { l: "AGENT", t: "neutral" }, dot: "neutral", status: "Absent", poles: ["VENTES"], conv: 4, joined: "2 mai 2026" },
                    ].map((m, i) => (
                        <tr key={i} className="hover:bg-[var(--paper-warm)]/60">
                            <td className="px-3 py-3">
                                <div className="flex items-center gap-2.5">
                                    <Avatar initials={m.initials} color={m.color as AvatarColor} />
                                    <div>
                                        <div className="text-[13px] font-semibold">{m.name}</div>
                                        <div className="text-[11px] text-[var(--ink-soft)]">{m.email}</div>
                                    </div>
                                </div>
                            </td>
                            <td className="px-3 py-3"><Chip tone={m.role.t as "neutral" | "accent" | "dark"}>{m.role.l}</Chip></td>
                            <td className="px-3 py-3">
                                <span className="inline-flex items-center gap-1.5 text-[12px]">
                                    <StatusDot tone={m.dot as "good" | "warn" | "neutral"} />
                                    {m.status}
                                </span>
                            </td>
                            <td className="px-3 py-3">
                                <div className="flex gap-1">
                                    {m.poles.map((p) => <Chip key={p} tone="neutral">{p}</Chip>)}
                                </div>
                            </td>
                            <td className="px-3 py-3 text-right text-[13px] tabular-nums">{m.conv}</td>
                            <td className="px-3 py-3 text-[12px]">{m.joined}</td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </DashboardShell>
    )
}

// ─── Screen 8 : Analytics ───────────────────────────────────────────────

function AnalyticsScreen() {
    return (
        <DashboardShell active="analytics">
            <PageHeader
                eyebrow="INSIGHTS · 30 DERNIERS JOURS"
                title="Analytics"
                description="Volume, temps de réponse, taux de résolution, performance des agents et campagnes."
                actions={
                    <>
                        <HeaderButton>📅 30 derniers jours</HeaderButton>
                        <HeaderButton icon={Download}>Exporter</HeaderButton>
                    </>
                }
            />
            <div className="grid grid-cols-4 gap-4 px-8 py-5 border-b border-[var(--ink-200)]">
                <Metric eyebrow="CONVERSATIONS" value="4 612" trend="↗ +12% vs mois préc." />
                <Metric eyebrow="TEMPS MOY. 1RE RÉPONSE" value="2m 14s" trend="↘ −18% vs mois préc." />
                <Metric eyebrow="TAUX DE RÉSOLUTION" value="94.2%" trend="↗ +2.1 pt vs mois préc." />
                <Metric eyebrow="SATISFACTION (CSAT)" value="4.7 / 5" trend="↗ +0.3 vs mois préc." />
            </div>
            <div className="grid grid-cols-[1fr_300px] gap-4 px-8 py-5 border-b border-[var(--ink-200)]">
                {/* Bar chart */}
                <div>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">VOLUME CONVERSATIONS</p>
                    <div className="mt-2 flex items-center justify-between text-[11px]">
                        <span className="font-display text-[15px] font-semibold">30 derniers jours · par canal</span>
                        <div className="flex items-center gap-3 font-mono text-[10px] text-[var(--ink-soft)]">
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> Paris</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[var(--ink-900)]" /> Dakar</span>
                            <span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-amber-500" /> Abidjan</span>
                        </div>
                    </div>
                    <div className="mt-3 flex h-[180px] items-end justify-between gap-[2px]">
                        {Array.from({ length: 30 }, (_, i) => {
                            const v = 30 + Math.sin(i / 2.5) * 20 + Math.random() * 30
                            const d = 10 + Math.cos(i / 3) * 15 + Math.random() * 15
                            const a = 5 + Math.sin(i / 4) * 8 + Math.random() * 8
                            return (
                                <div key={i} className="flex flex-1 flex-col items-center justify-end gap-px">
                                    <div style={{ height: `${a}px` }} className="w-full bg-amber-500" />
                                    <div style={{ height: `${d}px` }} className="w-full bg-[var(--ink-900)]" />
                                    <div style={{ height: `${v}px` }} className="w-full bg-[var(--accent)]" />
                                </div>
                            )
                        })}
                    </div>
                    <div className="mt-1.5 flex justify-between font-mono text-[10px] text-[var(--ink-soft)]">
                        <span>25 avr.</span>
                        <span>02 mai</span>
                        <span>09 mai</span>
                        <span>16 mai</span>
                        <span>23 mai</span>
                    </div>
                </div>
                {/* Agents leaderboard */}
                <div className="border-l border-[var(--ink-200)] pl-4">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">TOP AGENTS · 30J</p>
                    <ul className="mt-3 space-y-2.5">
                        {[
                            { rank: 1, name: "Lucie Aubert", initials: "LA", color: "rose", stats: "412 conv · 1m 48s · 4.9★" },
                            { rank: 2, name: "Tom Roussel", initials: "TR", color: "crimson", stats: "388 conv · 2m 02s · 4.8★" },
                            { rank: 3, name: "Inès Caron", initials: "IC", color: "indigo", stats: "366 conv · 2m 14s · 4.7★" },
                            { rank: 4, name: "Awa Sow", initials: "AS", color: "amber", stats: "304 conv · 2m 36s · 4.7★" },
                            { rank: 5, name: "Omar Ba", initials: "OB", color: "emerald", stats: "248 conv · 3m 04s · 4.6★" },
                        ].map((a) => (
                            <li key={a.rank} className="flex items-center gap-2 text-[11.5px]">
                                <span className="font-mono w-3 text-[var(--ink-soft)]">{a.rank}</span>
                                <Avatar initials={a.initials} color={a.color as AvatarColor} size="sm" />
                                <div className="min-w-0 flex-1">
                                    <div className="font-semibold">{a.name}</div>
                                    <div className="text-[10px] text-[var(--ink-soft)]">{a.stats}</div>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
            <div className="grid grid-cols-2 gap-8 px-8 py-5">
                {/* Donut */}
                <div>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">RÉPARTITION PAR STATUT</p>
                    <div className="mt-4 flex items-center gap-5">
                        <div className="relative h-[140px] w-[140px]">
                            <svg viewBox="0 0 36 36" className="h-full w-full -rotate-90">
                                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--ink-100)" strokeWidth="6" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--status-good)" strokeWidth="6" strokeDasharray="60 100" strokeDashoffset="0" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--accent)" strokeWidth="6" strokeDasharray="18 100" strokeDashoffset="-60" />
                                <circle cx="18" cy="18" r="14" fill="none" stroke="var(--status-warn)" strokeWidth="6" strokeDasharray="9 100" strokeDashoffset="-78" />
                            </svg>
                        </div>
                        <ul className="flex-1 space-y-1.5 text-[12px]">
                            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--status-good)]" /> Résolues</span><span className="font-mono font-semibold">68%</span></li>
                            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--accent)]" /> En cours</span><span className="font-mono font-semibold">18%</span></li>
                            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--status-warn)]" /> En attente</span><span className="font-mono font-semibold">9%</span></li>
                            <li className="flex items-center justify-between"><span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[var(--ink-300)]" /> Abandonnées</span><span className="font-mono font-semibold">5%</span></li>
                        </ul>
                    </div>
                </div>
                {/* Heatmap */}
                <div>
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">HEURES DE POINTE</p>
                    <div className="mt-4 grid grid-cols-[20px_repeat(7,_1fr)] gap-1 text-[10px]">
                        <div />
                        {["8h", "10h", "12h", "14h", "16h", "18h", "20h"].map((h) => (
                            <div key={h} className="text-center font-mono text-[var(--ink-soft)]">{h}</div>
                        ))}
                        {["L", "M", "M", "J", "V", "S", "D"].flatMap((d, di) => [
                            <div key={`label-${di}`} className="font-mono text-[var(--ink-soft)]">{d}</div>,
                            ...Array.from({ length: 7 }, (_, hi) => {
                                const intensity = Math.sin(di / 1.5) * 0.5 + Math.cos(hi / 2) * 0.4 + 0.4
                                return (
                                    <div
                                        key={`cell-${di}-${hi}`}
                                        className="h-5 rounded"
                                        style={{ background: `rgba(105,59,239,${Math.max(0.05, Math.min(0.85, intensity))})` }}
                                    />
                                )
                            }),
                        ])}
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

// ─── Screen 9 : Réglages ────────────────────────────────────────────────

function ReglagesScreen() {
    const tabs = [
        "Organisation",
        "Canaux WhatsApp",
        "Équipe & rôles",
        "Notifications",
        "Sécurité · 2FA",
        "API · Webhooks",
        "Intégrations",
        "Confidentialité",
        "Apparence",
    ]
    return (
        <DashboardShell active="reglages">
            <PageHeader
                eyebrow="COMPTE · ATELIER BRACQUET"
                title="Réglages"
                description="Numéros WhatsApp connectés, équipe, sécurité, webhooks, conformité RGPD."
            />
            <div className="grid grid-cols-[200px_1fr]">
                {/* Tabs nav */}
                <nav className="border-r border-[var(--ink-200)] py-5 pl-6 pr-2 space-y-0.5 text-[13px]">
                    {tabs.map((t, i) => (
                        <button
                            key={t}
                            className={cn(
                                "block w-full rounded-md px-2.5 py-1.5 text-left",
                                i === 1
                                    ? "bg-[var(--paper-warm)] border border-[var(--ink-200)] font-semibold text-[var(--ink-900)]"
                                    : "text-[var(--ink-soft)] hover:bg-[var(--paper-warm)]/60",
                            )}
                        >
                            {t}
                            {i === 1 ? <span className="ml-1.5 font-mono text-[10px] text-[var(--ink-soft)]">3</span> : null}
                            {i === 6 ? <span className="ml-1.5 font-mono text-[10px] text-[var(--ink-soft)]">4</span> : null}
                        </button>
                    ))}
                </nav>
                <div className="px-7 py-5">
                    <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">Canaux WhatsApp Business</p>
                    <h2 className="mt-1 font-display text-2xl font-bold tracking-tight">Trois numéros, une boîte unique.</h2>
                    <p className="mt-1.5 text-[13px] text-[var(--ink-500)]">
                        Chaque numéro est connecté via Meta Business Cloud API. Le webhook entrant est auto-configuré et signé HMAC-SHA256.
                    </p>

                    <div className="mt-5 space-y-2.5">
                        {[
                            { name: "Atelier Bracquet · Paris", phone: "+33 1 84 60 12 88", waba: "WABA ID 1023890123", status: { l: "● ACTIF", t: "good" }, quality: "GREEN", qTone: "good", volume: 142 },
                            { name: "Atelier Bracquet · Sénégal", phone: "+221 33 822 14 50", waba: "WABA ID 1023891123", status: { l: "● ACTIF", t: "good" }, quality: "GREEN", qTone: "good", volume: 38 },
                            { name: "Atelier Bracquet · CI", phone: "+225 27 22 91 04 17", waba: "WABA ID 1023892123", status: { l: "● QUALITÉ MOYENNE", t: "warn" }, quality: "YELLOW", qTone: "warn", volume: 21 },
                        ].map((c, i) => (
                            <div key={i} className="flex items-center justify-between rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] p-3">
                                <div className="flex items-center gap-3">
                                    <span className="flex h-8 w-8 items-center justify-center rounded-full bg-[var(--status-good-soft)]">
                                        <MessageCircle className="h-4 w-4 text-[var(--status-good)]" />
                                    </span>
                                    <div>
                                        <div className="flex items-center gap-2 text-[13px] font-semibold">
                                            {c.name}
                                            <Chip tone={c.status.t as "good" | "warn"}>{c.status.l}</Chip>
                                        </div>
                                        <div className="font-mono text-[11px] text-[var(--ink-soft)]">{c.phone} · {c.waba}</div>
                                    </div>
                                </div>
                                <div className="flex items-center gap-5 text-right">
                                    <div>
                                        <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">QUALITÉ META</div>
                                        <div className={cn("font-mono text-[11.5px] font-semibold", c.qTone === "good" ? "text-[var(--status-good)]" : "text-[var(--status-warn)]")}>{c.quality}</div>
                                    </div>
                                    <div>
                                        <div className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">VOLUME</div>
                                        <div className="font-display text-[16px] font-bold tabular-nums">{c.volume}</div>
                                    </div>
                                    <MoreHorizontal className="h-4 w-4 text-[var(--ink-400)]" />
                                </div>
                            </div>
                        ))}

                        <div className="flex items-center justify-between rounded-lg border border-dashed border-[var(--ink-200)] p-3">
                            <div className="flex items-center gap-3">
                                <span className="flex h-8 w-8 items-center justify-center rounded-full border-2 border-dashed border-[var(--ink-300)]">
                                    <Plus className="h-3.5 w-3.5 text-[var(--ink-500)]" />
                                </span>
                                <div>
                                    <div className="text-[13px] font-semibold">Connecter un nouveau numéro</div>
                                    <div className="text-[11px] text-[var(--ink-soft)]">via Meta Business · 1-2 minutes</div>
                                </div>
                            </div>
                            <HeaderButton primary>Connecter</HeaderButton>
                        </div>
                    </div>

                    <div className="mt-7">
                        <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">WEBHOOK ENTRANT · PARTAGÉ</p>
                        <div className="mt-2 flex items-center gap-2 rounded-md border border-[var(--ink-200)] bg-[var(--paper-warm)] p-2.5">
                            <Globe className="h-3.5 w-3.5 text-[var(--ink-soft)]" />
                            <span className="flex-1 font-mono text-[11.5px]">https://api.jokko.app/v1/webhooks/wa/atelier-bracquet</span>
                            <button className="inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-1 text-[11px]">
                                <Copy className="h-3 w-3" /> Copier
                            </button>
                        </div>
                        <div className="mt-2 flex items-center gap-4 text-[11px] text-[var(--ink-soft)]">
                            <span>Signature <span className="font-mono">HMAC-SHA256</span></span>
                            <span className="text-[var(--status-good)]">Vérifié il y a 4 min</span>
                            <span className="text-[var(--status-good)]">200 OK · 412 ms</span>
                        </div>
                    </div>
                </div>
            </div>
        </DashboardShell>
    )
}

// ─── Screen 10 : Facturation ────────────────────────────────────────────

function FacturationScreen() {
    return (
        <DashboardShell active="facturation">
            <PageHeader
                eyebrow="COMPTE · PRO · FACTURE MENSUELLE"
                title="Facturation"
                description="Plan, consommation, factures et méthodes de paiement. Facturation Stripe."
                actions={<HeaderButton icon={Download}>Télécharger factures</HeaderButton>}
            />
            <div className="px-8 py-5">
                {/* Big plan card */}
                <div
                    className="relative overflow-hidden rounded-2xl p-6 text-white"
                    style={{
                        background: "linear-gradient(135deg, var(--accent) 0%, var(--accent-hover) 100%)",
                    }}
                >
                    <div className="flex items-start justify-between">
                        <div>
                            <p className="font-mono text-[10px] uppercase tracking-[0.18em] text-white/80">Plan actuel</p>
                            <div className="mt-1 flex items-baseline gap-2">
                                <h2 className="font-display text-[32px] font-bold tracking-tight">Pro</h2>
                                <span className="text-[12px] text-white/80">jusqu&apos;à 10 sièges · 3 numéros</span>
                            </div>
                            <p className="mt-3 text-[12px] text-white/80 max-w-md">
                                Renouvellement automatique le 26 juin 2026. Période d&apos;essai terminée — paiement actif via VISA •••• 4842.
                            </p>
                        </div>
                        <div className="text-right">
                            <div className="font-display text-[42px] font-bold leading-none">€149</div>
                            <div className="text-[12px] text-white/80">/ mois HT</div>
                            <div className="mt-3 flex gap-2 justify-end">
                                <button className="rounded-md border border-white/40 bg-white/10 px-3 py-1 text-[12px] font-medium hover:bg-white/20">Changer de plan</button>
                                <button className="rounded-md px-3 py-1 text-[12px] font-medium text-white underline-offset-4 hover:underline">Passer à Business</button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Usage */}
                <div className="mt-5 grid grid-cols-3 gap-4">
                    <UsageCard label="CONVERSATIONS META" value="4 612" total="10 000" sub="Ce mois · €148.72" tone="accent" />
                    <UsageCard label="CONTACTS" value="2 408" total="5 000" sub="Ce mois · inclus" tone="good" />
                    <UsageCard label="SIÈGES" value="8" total="10" sub="Ce mois · inclus" tone="warn" />
                </div>

                {/* Invoices */}
                <div className="mt-7">
                    <div className="flex items-center justify-between">
                        <div>
                            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">HISTORIQUE DES FACTURES</p>
                            <h3 className="mt-1 font-display text-[20px] font-bold tracking-tight">6 dernières factures</h3>
                        </div>
                        <HeaderButton>Tout voir</HeaderButton>
                    </div>
                    <table className="mt-3 w-full">
                        <tbody className="divide-y divide-[var(--ink-100)]">
                            {[
                                { date: "26 mai 2026", id: "INV-2026-0526", amount: "€178.42" },
                                { date: "26 avr. 2026", id: "INV-2026-0426", amount: "€166.18" },
                                { date: "26 mars 2026", id: "INV-2026-0326", amount: "€189.04" },
                                { date: "26 fév. 2026", id: "INV-2026-0226", amount: "€149.00" },
                                { date: "26 jan. 2026", id: "INV-2026-0126", amount: "€149.00" },
                                { date: "26 déc. 2025", id: "INV-2025-1226", amount: "€149.00" },
                            ].map((inv, i) => (
                                <tr key={i} className="hover:bg-[var(--paper-warm)]/60">
                                    <td className="px-3 py-3 text-[12.5px] w-[180px]">{inv.date}</td>
                                    <td className="px-3 py-3 font-mono text-[11.5px] text-[var(--ink-soft)]">{inv.id}</td>
                                    <td className="px-3 py-3 text-right text-[13px] font-semibold tabular-nums">{inv.amount}</td>
                                    <td className="px-3 py-3"><Chip tone="good">● PAYÉE</Chip></td>
                                    <td className="px-3 py-3 text-right"><Receipt className="h-3.5 w-3.5 text-[var(--ink-400)] inline" /></td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </div>
        </DashboardShell>
    )
}

function UsageCard({
    label,
    value,
    total,
    sub,
    tone,
}: {
    label: string
    value: string
    total: string
    sub: string
    tone: "accent" | "good" | "warn"
}) {
    const num = parseFloat(value.replace(/\s/g, "")) || 0
    const tot = parseFloat(total.replace(/\s/g, "")) || 1
    const pct = Math.min(100, (num / tot) * 100)
    const barColor = tone === "accent" ? "bg-[var(--accent)]" : tone === "good" ? "bg-[var(--status-good)]" : "bg-[var(--status-warn)]"
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-4">
            <p className="font-mono text-[9.5px] uppercase tracking-[0.12em] text-[var(--ink-soft)]">{label}</p>
            <div className="mt-1 flex items-baseline gap-1">
                <span className="font-display text-[26px] font-bold tabular-nums">{value}</span>
                <span className="text-[11px] text-[var(--ink-soft)]">/ {total}</span>
            </div>
            <div className="mt-2 h-1.5 rounded-full bg-[var(--ink-100)] overflow-hidden">
                <div className={cn("h-full rounded-full", barColor)} style={{ width: `${pct}%` }} />
            </div>
            <p className="mt-2 text-[11px] text-[var(--ink-soft)]">{sub}</p>
        </div>
    )
}

// ─── Stories ────────────────────────────────────────────────────────────

const meta = {
    title: "Dashboard/Legacy Mockups",
    parameters: {
        layout: "fullscreen",
        docs: {
            description: {
                component:
                    "⚠ Legacy : maquettes statiques des 10 écrans cockpit (PDF Jokko Desktop). Conservées en référence tant que les écrans Modèles / Campagnes / Flows / Team / Analytics / Billing n'ont pas leurs composants modulaires. Les écrans Inbox / Contacts / Settings sont déjà composables dans Dashboard/Inbox, Dashboard/Contacts, Dashboard/Settings.",
            },
        },
    },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const ShellOnly: Story = {
    name: "0 · Shell (sidebar + main vide)",
    render: () => (
        <DashboardShell active="tableau-de-bord">
            <PageHeader eyebrow="PILOTAGE" title="Tableau de bord" description="Vue d'ensemble — KPIs, alertes, raccourcis." />
        </DashboardShell>
    ),
}

export const Conversations: Story = {
    name: "1 · Inbox — Conversations (3 colonnes + Copilot)",
    render: () => <ConversationsScreen />,
}

export const Mentions: Story = {
    name: "2 · Inbox — Mentions (feed équipe)",
    render: () => <MentionsScreen />,
}

export const Contacts: Story = {
    name: "3 · Données — Contacts (annuaire)",
    render: () => <ContactsScreen />,
}

export const Modeles: Story = {
    name: "4 · Données — Modèles WhatsApp (aperçu fidèle)",
    render: () => <ModelesScreen />,
}

export const Campagnes: Story = {
    name: "5 · Données — Campagnes (diffusion + ROI)",
    render: () => <CampagnesScreen />,
}

export const Flows: Story = {
    name: "6 · Automation — Flows (builder visuel)",
    render: () => <FlowsScreen />,
}

export const Team: Story = {
    name: "7 · Team — membres + pôles",
    render: () => <TeamScreen />,
}

export const Analytics: Story = {
    name: "8 · Insights — Analytics 30j",
    render: () => <AnalyticsScreen />,
}

export const Reglages: Story = {
    name: "9 · Compte — Réglages (canaux WA)",
    render: () => <ReglagesScreen />,
}

export const Facturation: Story = {
    name: "10 · Compte — Facturation (plan + factures)",
    render: () => <FacturationScreen />,
}
