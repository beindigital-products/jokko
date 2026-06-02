import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Button } from "@/components/ui/button"
import { Icon } from "@/components/dashboard/primitives/Icon"

/**
 * Primitives/Buttons — reproduces the "Jokko Dashboard · Primitives" button
 * section. The app's <Button> (shadcn + v3 variants) is the source of truth;
 * each `.spec` cell shows a live demo row plus the design-doc class names.
 *
 * Mapping doc → app variant:
 *   .btn-primary → <Button>           .btn-accent → variant="accent"
 *   .btn-ghost   → variant="outline"  .btn-soft   → variant="secondary"
 *   .btn-sm      → size="sm"          .btn-lg     → size="lg"
 *   .btn-icon    → size="icon"
 */
const meta = {
    title: "Primitives/Buttons",
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

/** A spec cell — white card, hairline border, rounded, demo row + mono caption. */
function Spec({ caption, children }: { caption: React.ReactNode; children: React.ReactNode }) {
    return (
        <div className="rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-[18px]">
            <div className="flex flex-wrap items-center gap-2.5">{children}</div>
            <div className="mt-3.5 font-mono text-[11px] text-[var(--ink-soft)]">{caption}</div>
        </div>
    )
}

/** Class-name fragment styled for captions. */
function C({ children }: { children: React.ReactNode }) {
    return <b className="text-[var(--ink-700)]">{children}</b>
}

export const All: Story = {
    render: () => (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <Spec
                caption={
                    <>
                        <C>.btn-primary</C> · <C>.btn-accent</C>
                    </>
                }
            >
                <Button>Inviter un coéquipier</Button>
                <Button variant="accent">Activer</Button>
            </Spec>

            <Spec
                caption={
                    <>
                        <C>.btn-ghost</C> · <C>.btn-soft</C>
                    </>
                }
            >
                <Button variant="outline">Filtres</Button>
                <Button variant="secondary">Annuler</Button>
            </Spec>

            <Spec
                caption={
                    <>
                        icône à gauche / droite · <C>[&_svg]</C>
                    </>
                }
            >
                <Button variant="outline">
                    <Icon name="plus" size={14} />
                    Nouvelle campagne
                </Button>
                <Button>
                    <Icon name="bolt" size={14} />
                    Payer €100
                    <Icon name="arrow-right" size={14} />
                </Button>
            </Spec>

            <Spec caption={<C>.btn-sm</C>}>
                <Button size="sm" variant="outline">
                    Assigner
                </Button>
                <Button size="sm">Ouvrir</Button>
            </Spec>

            <Spec caption={<C>.btn-lg</C>}>
                <Button size="lg">Enregistrer</Button>
            </Spec>

            <Spec caption={<C>.btn-icon</C>}>
                <Button size="icon" variant="ghost">
                    <Icon name="more-h" />
                </Button>
                <Button size="icon" variant="outline">
                    <Icon name="filter" />
                </Button>
                <Button size="icon" variant="accent">
                    <Icon name="plus" />
                </Button>
            </Spec>
        </div>
    ),
}
