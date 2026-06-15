import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { MentionsScreen } from "./MentionsScreen"
import type { MentionsData } from "./types"

const DATA: MentionsData = {
    items: [
        {
            id: "1",
            kind: "mention",
            who: "Tom R.",
            text: "vous a mentionné·e sur",
            conv: "Mehdi Sané",
            note: "@Inès tu peux vérifier le stock Tessier noir M ?",
            time: "il y a 8 min",
            href: "#",
            unread: true,
        },
        {
            id: "2",
            kind: "assignment",
            who: "Coralie Vidal",
            text: "vous est assignée",
            conv: "",
            note: "Cliente VIP, à traiter ce matin.",
            time: "il y a 32 min",
            href: "#",
        },
        {
            id: "3",
            kind: "reply",
            who: "Omar B.",
            text: "a répondu à votre note sur",
            conv: "Naomi Diop",
            note: "« Stock OK, on a 4 pièces »",
            time: "il y a 1h",
            href: "#",
        },
    ],
}

const meta = {
    title: "Screens/Mentions",
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
