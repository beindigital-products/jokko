import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Chip, type ChipTone } from "./Chip"
import { StatusDot, type StatusDotTone } from "./StatusDot"

const TONES: ChipTone[] = ["neutral", "accent", "good", "warn", "danger", "dark"]
const STATUS_TONES: StatusDotTone[] = ["good", "warn", "danger", "neutral"]

const meta = {
    title: "Dashboard/Primitives/Chip",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const AllTones: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            {TONES.map((t) => (
                <Chip key={t} tone={t}>
                    {t}
                </Chip>
            ))}
        </div>
    ),
}

export const AsStatusBullet: Story = {
    name: "Status (chip + bullet)",
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Chip tone="good">● ACTIF</Chip>
            <Chip tone="warn">● EN PAUSE</Chip>
            <Chip tone="danger">● REFUSÉ</Chip>
            <Chip tone="accent">● EN COURS</Chip>
        </div>
    ),
}

export const TagsExamples: Story = {
    render: () => (
        <div className="flex flex-wrap gap-2">
            <Chip tone="neutral">CLIENT</Chip>
            <Chip tone="accent">VIP</Chip>
            <Chip tone="neutral">DAKAR</Chip>
            <Chip tone="neutral">PROSPECT</Chip>
            <Chip tone="dark">OWNER</Chip>
        </div>
    ),
}

export const StatusDots: Story = {
    name: "StatusDot variants",
    render: () => (
        <div className="flex items-center gap-4 text-[13px]">
            {STATUS_TONES.map((t) => (
                <span key={t} className="inline-flex items-center gap-1.5">
                    <StatusDot tone={t} />
                    {t}
                </span>
            ))}
        </div>
    ),
}
