import type { Meta, StoryObj } from "@storybook/nextjs-vite"

import { AnalyticsScreen } from "./AnalyticsScreen"
import type { AnalyticsData } from "./types"

function vdate(i: number) {
    const d = 25 + i
    return d <= 30 ? `${d} avr` : `${d - 30} mai`
}

const VOLUME = Array.from({ length: 30 }, (_, i) => ({
    day: vdate(i),
    paris: 80 + Math.round(Math.sin(i * 0.4) * 30 + (i % 7 < 5 ? 30 : -10)),
    dakar: 30 + Math.round(Math.sin(i * 0.3 + 1) * 12 + (i % 7 < 5 ? 10 : -5)),
    abidjan: 15 + Math.round(Math.cos(i * 0.5) * 6),
}))

const HEAT_ROWS = Array.from({ length: 7 }, (_, di) =>
    Array.from({ length: 7 }, (_, hi) => {
        const v = Math.max(0.05, Math.sin((di * 7 + hi) * 1.3) * 0.5 + 0.5)
        return di >= 5 ? v * 0.4 : v
    }),
)

const DATA: AnalyticsData = {
    kpis: [
        { label: "Conversations", value: "4 612", delta: "+12%" },
        { label: "Temps moy. 1re réponse", value: "2m 14s", delta: "−18%" },
        { label: "Taux de résolution", value: "94.2%", delta: "+2.1 pt" },
        { label: "Satisfaction (CSAT)", value: "4.7 / 5", delta: "+0.3" },
    ],
    volume: VOLUME,
    channels: [
        { key: "paris", label: "Paris", color: "var(--accent)" },
        { key: "dakar", label: "Dakar", color: "var(--ink-900)" },
        { key: "abidjan", label: "Abidjan", color: "var(--status-warn)" },
    ],
    topAgents: [
        { id: "1", name: "Lucie Aubert", conv: 412, time: "1m 48s", csat: "4.9" },
        { id: "2", name: "Tom Roussel", conv: 388, time: "2m 02s", csat: "4.8" },
        { id: "3", name: "Inès Caron", conv: 366, time: "2m 14s", csat: "4.7" },
        { id: "4", name: "Awa Sow", conv: 304, time: "2m 36s", csat: "4.7" },
        { id: "5", name: "Omar Ba", conv: 248, time: "3m 04s", csat: "4.6" },
    ],
    status: [
        { key: "resolved", label: "Résolues", value: 68, color: "var(--status-good)" },
        { key: "open", label: "En cours", value: 18, color: "var(--accent)" },
        { key: "pending", label: "En attente", value: 9, color: "var(--status-warn)" },
        { key: "abandoned", label: "Abandonnées", value: 5, color: "var(--ink-400)" },
    ],
    heatmap: {
        rows: HEAT_ROWS,
        hours: ["8h", "10h", "12h", "14h", "16h", "18h", "20h"],
        days: ["L", "M", "M", "J", "V", "S", "D"],
        peakLabel: "jeudi 14h–16h",
        hint: "+2 agents recommandés",
    },
}

const meta = {
    title: "Dashboard/Analytics",
    component: AnalyticsScreen,
    parameters: { layout: "fullscreen" },
    decorators: [
        (Story) => (
            <div style={{ width: "100%", height: 960 }}>
                <Story />
            </div>
        ),
    ],
} satisfies Meta<typeof AnalyticsScreen>

export default meta
type Story = StoryObj<typeof meta>

export const Default: Story = {
    args: { data: DATA },
}
