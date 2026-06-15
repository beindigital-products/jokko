import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { Avatar } from "@/components/dashboard/primitives/Avatar"
import { avatarColorFromString, initialsFromName } from "@/lib/dashboard/avatar-color"

/**
 * Primitives/Avatars — reproduces the design doc's avatar section.
 *
 * NOTE on sizing: the doc lists 28 / 32 / 40px, but the app's <Avatar> takes a
 * size *scale*, not explicit pixels: sm=24, md=32, lg=36, xl=56. We map to the
 * nearest scale step (sm≈28, md=32, lg≈40) and surface the real px in the
 * caption so the catalog stays honest about the primitive's API.
 *
 * Colors are deterministic via avatarColorFromString(name) and initials via
 * initialsFromName(name) — same helpers the live app uses, so a given name
 * always renders the same color here and in production.
 */
const meta = {
    title: "Primitives/Avatars",
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
            <div className="flex flex-wrap items-end gap-3">{children}</div>
            <div className="mt-3.5 font-mono text-[11px] text-[var(--ink-soft)]">{caption}</div>
        </div>
    )
}

/** Class-name fragment styled for captions. */
function C({ children }: { children: React.ReactNode }) {
    return <b className="text-[var(--ink-700)]">{children}</b>
}

const SEED = ["Mariama Sow", "Lamine Aïdara", "Ousmane Bâ"]

export const All: Story = {
    render: () => (
        <div className="grid grid-cols-1 gap-3.5 sm:grid-cols-2 lg:grid-cols-3">
            <Spec
                caption={
                    <>
                        <C>size=&quot;sm&quot;</C> 24 · <C>md</C> 32 · <C>lg</C> 36px
                        <span className="ml-1 normal-case">(doc 28 / 32 / 40)</span>
                    </>
                }
            >
                {SEED.map((name) => (
                    <Avatar
                        key={`sm-${name}`}
                        initials={initialsFromName(name)}
                        color={avatarColorFromString(name)}
                        size="sm"
                    />
                ))}
                {SEED.map((name) => (
                    <Avatar
                        key={`md-${name}`}
                        initials={initialsFromName(name)}
                        color={avatarColorFromString(name)}
                        size="md"
                    />
                ))}
                {SEED.map((name) => (
                    <Avatar
                        key={`lg-${name}`}
                        initials={initialsFromName(name)}
                        color={avatarColorFromString(name)}
                        size="lg"
                    />
                ))}
            </Spec>

            <Spec
                caption={
                    <>
                        présence · <C>status=&quot;online&quot;</C>
                    </>
                }
            >
                <Avatar
                    initials={initialsFromName("Mariama Sow")}
                    color={avatarColorFromString("Mariama Sow")}
                    size="lg"
                    status="online"
                />
                <Avatar
                    initials={initialsFromName("Lamine Aïdara")}
                    color={avatarColorFromString("Lamine Aïdara")}
                    size="lg"
                    status="online"
                />
            </Spec>

            <Spec
                caption={
                    <>
                        organisation · <C>shape=&quot;square&quot;</C>
                    </>
                }
            >
                <Avatar
                    initials="A"
                    color={avatarColorFromString("Atelier Bracquet")}
                    size="lg"
                    shape="square"
                />
            </Spec>
        </div>
    ),
}
