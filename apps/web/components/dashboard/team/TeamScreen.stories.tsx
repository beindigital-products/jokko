import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { TeamScreen } from "./TeamScreen"
import type { TeamData } from "./types"

const DATA: TeamData = {
    seats: "8 / 10 sièges",
    poles: [
        { id: "1", name: "Ventes", members: 3, conv: 22, color: "var(--accent)" },
        { id: "2", name: "Support", members: 3, conv: 48, color: "#7A4FD9" },
        { id: "3", name: "Dakar", members: 2, conv: 14, color: "var(--status-good)" },
        { id: "4", name: "Direction", members: 1, conv: 2, color: "var(--status-warn)" },
    ],
    members: [
        { id: "1", name: "Inès Caron", email: "ines@bracquet.fr", role: "AGENT", status: "online", conv: 12, poles: ["Ventes"], joined: "8 mars 2026" },
        { id: "2", name: "Tom Roussel", email: "tom@bracquet.fr", role: "ADMIN", status: "online", conv: 6, poles: ["Ventes", "Support"], joined: "4 fév. 2026" },
        { id: "3", name: "Lucie Aubert", email: "lucie@bracquet.fr", role: "AGENT", status: "busy", conv: 18, poles: ["Support"], joined: "22 jan. 2026" },
        { id: "4", name: "Omar Ba", email: "omar@bracquet.fr", role: "AGENT", status: "online", conv: 8, poles: ["Dakar"], joined: "11 nov. 2025" },
        { id: "5", name: "Sophie Bracquet", email: "sophie@bracquet.fr", role: "OWNER", status: "away", conv: 2, poles: ["Direction"], joined: "4 jan. 2025" },
        { id: "6", name: "Mathieu Khelifa", email: "mathieu@bracquet.fr", role: "AGENT", status: "offline", conv: 0, poles: ["Support"], joined: "18 avr. 2026" },
        { id: "7", name: "Awa Sow", email: "awa.sow@bracquet.fr", role: "AGENT", status: "online", conv: 14, poles: ["Dakar"], joined: "12 mai 2026" },
        { id: "8", name: "Camille Brun", email: "camille@bracquet.fr", role: "AGENT", status: "away", conv: 4, poles: ["Ventes"], joined: "2 mai 2026" },
    ],
}

const meta = {
    title: "Dashboard/Team",
    component: TeamScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 820 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof TeamScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}

export const Empty: Story = {
    args: {
        data: {
            seats: "1 / 10 sièges",
            poles: [],
            members: [
                { id: "1", name: "Sophie Bracquet", email: "sophie@bracquet.fr", role: "OWNER", status: "online", conv: 0, poles: [], joined: "Aujourd'hui" },
            ],
        },
    },
}
