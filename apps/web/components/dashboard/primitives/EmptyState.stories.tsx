import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { EmptyState } from "./EmptyState"
import { StateIllustration, type IllustrationName } from "./StateIllustration"

// Lightweight action buttons matching the design's DBtn tones.
function PrimaryBtn({ children }: { children: React.ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-btn)] bg-[var(--ink-900)] px-3 text-[13px] font-medium text-white"
        >
            {children}
        </button>
    )
}
function GhostBtn({ children }: { children: React.ReactNode }) {
    return (
        <button
            type="button"
            className="inline-flex h-8 items-center gap-1.5 rounded-[var(--radius-btn)] border border-[var(--ink-200)] px-3 text-[13px] font-medium text-[var(--ink-700)]"
        >
            {children}
        </button>
    )
}
function LinkBtn({ children }: { children: React.ReactNode }) {
    return (
        <button type="button" className="inline-flex items-center gap-1 text-[13px] font-medium text-[var(--accent)]">
            {children} ↗
        </button>
    )
}

const meta = {
    title: "Primitives/EmptyState",
    component: EmptyState,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div className="flex" style={{ width: "100%", height: 460, background: "var(--paper-white)" }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof EmptyState>

export default meta
type Story = StoryObj<typeof meta>

export const Inbox: Story = {
    args: {
        illustration: "inbox",
        title: (
            <>
                Aucune conversation
                <br />
                pour l&apos;instant.
            </>
        ),
        body: "Quand un message vous sera assigné, il s'affichera ici. Inutile de rafraîchir, l'inbox est en temps réel.",
        secondary: <LinkBtn>Voir les conversations de l&apos;équipe</LinkBtn>,
    },
}

export const Contacts: Story = {
    args: {
        illustration: "contacts",
        title: "Votre annuaire est vide.",
        body: "Importez vos contacts depuis HubSpot, Pipedrive ou un fichier CSV — ou laissez-les se créer tout seuls au fil des conversations.",
        secondary: <LinkBtn>Voir le guide d&apos;import</LinkBtn>,
    },
}

export const Campaigns: Story = {
    args: {
        illustration: "megaphone",
        title: "Pas encore de campagne.",
        body: "Une campagne combine un modèle, une audience, et une plage horaire. Le statut Meta est suivi en temps réel.",
        primary: <PrimaryBtn>+ Nouvelle campagne</PrimaryBtn>,
        secondary: <LinkBtn>Voir un exemple</LinkBtn>,
    },
}

export const Notifications: Story = {
    args: {
        illustration: "bell",
        title: "Boîte calme.",
        body: "On vous préviendra ici dès qu'on a quelque chose à dire — mention dans une conversation, assignation, modèle approuvé.",
        secondary: <LinkBtn>Réglages des notifications</LinkBtn>,
    },
}

export const TemplatesAgentDense: Story = {
    args: {
        illustration: "templates",
        dense: true,
        title: (
            <>
                Rien à envoyer
                <br />
                pour l&apos;instant.
            </>
        ),
        body: "Quand un administrateur publiera un modèle approuvé par Meta, il apparaîtra ici.",
        primary: <GhostBtn>Demander à l&apos;admin</GhostBtn>,
    },
}

export const FilterNoResults: Story = {
    args: {
        illustration: "funnel",
        dense: true,
        title: "Filtres trop serrés.",
        body: "Cette combinaison de filtres ne renvoie aucun résultat. Essayez d'élargir la plage de dates ou retirez un tag.",
        primary: <PrimaryBtn>Réinitialiser tout</PrimaryBtn>,
        secondary: <GhostBtn>Élargir à 90 j</GhostBtn>,
    },
}

const ALL_ILLUS: IllustrationName[] = [
    "inbox", "contacts", "templates", "megaphone", "flow", "plug", "chart", "team",
    "bell", "search", "funnel", "archive", "bolt", "compass", "broken-link",
    "cloud-off", "warning", "check", "rocket", "lock", "ghost",
]

export const Illustrations: Story = {
    args: { title: "" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", background: "var(--paper-white)", padding: 24 }}>
                <Story />
            </div>
        ),
    ],
    render: () => (
        <div className="grid grid-cols-4 gap-4 sm:grid-cols-6">
            {ALL_ILLUS.map((name) => (
                <div
                    key={name}
                    className="flex flex-col items-center gap-2 border border-[var(--ink-100)] bg-[var(--paper-warm)] py-5"
                >
                    <StateIllustration name={name} size={56} />
                    <span className="font-mono text-[9px] uppercase tracking-[0.1em] text-[var(--ink-soft)]">
                        {name}
                    </span>
                </div>
            ))}
        </div>
    ),
}
