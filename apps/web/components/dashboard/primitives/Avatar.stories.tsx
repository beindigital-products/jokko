import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Avatar, type AvatarColor } from "./Avatar"

const COLORS: AvatarColor[] = [
    "violet",
    "emerald",
    "rose",
    "amber",
    "sky",
    "indigo",
    "crimson",
    "teal",
]

const meta = {
    title: "Primitives/Avatar",
    parameters: { layout: "centered" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
    render: () => <Avatar initials="MS" color="violet" />,
}

export const AllColors: Story = {
    render: () => (
        <div className="flex flex-wrap gap-3">
            {COLORS.map((c) => (
                <Avatar key={c} initials={c.slice(0, 2).toUpperCase()} color={c} size="lg" />
            ))}
        </div>
    ),
}

export const Sizes: Story = {
    render: () => (
        <div className="flex items-end gap-4">
            <Avatar initials="MS" color="violet" size="sm" />
            <Avatar initials="MS" color="violet" size="md" />
            <Avatar initials="MS" color="violet" size="lg" />
            <Avatar initials="MS" color="violet" size="xl" />
        </div>
    ),
}

export const Shapes: Story = {
    render: () => (
        <div className="flex gap-3">
            <Avatar initials="MS" color="violet" size="lg" shape="circle" />
            <Avatar initials="a" color="indigo" size="lg" shape="square" />
        </div>
    ),
}

export const WithStatus: Story = {
    render: () => (
        <div className="flex gap-4">
            <Avatar initials="MS" color="violet" status="online" />
            <Avatar initials="LA" color="rose" status="busy" />
            <Avatar initials="OB" color="emerald" status="away" />
        </div>
    ),
}
