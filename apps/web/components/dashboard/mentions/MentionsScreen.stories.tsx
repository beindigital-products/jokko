import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { MentionsScreen } from "./MentionsScreen"
import type { MentionsData } from "./types"

const DATA: MentionsData = {
    items: [
        {
            id: "1",
            who: "Tom R.",
            text: "vous a mentionnée sur",
            conv: "Mehdi Sané",
            note: "@Inès tu peux vérifier le stock Tessier noir M ?",
            time: "il y a 8 min",
        },
        {
            id: "2",
            who: "Lucie A.",
            text: "vous a assigné",
            conv: "Coralie Vidal",
            note: "Cliente VIP — à traiter ce matin",
            time: "il y a 32 min",
        },
        {
            id: "3",
            who: "Omar B.",
            text: "a répondu à votre note",
            conv: "Naomi Diop",
            note: "« Stock OK, on a 4 pièces »",
            time: "il y a 1h",
        },
    ],
}

const meta = {
    title: "Dashboard/Mentions",
    component: MentionsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 760 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof MentionsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}

export const Empty: Story = {
    args: {
        data: {
            items: [],
        },
    },
}
