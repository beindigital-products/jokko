import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import { Metric } from "./Metric"
import { UsageCard } from "./UsageCard"
import { Pagination } from "./Pagination"

const meta = {
    title: "Dashboard/Primitives/Metric",
    parameters: { layout: "padded" },
    tags: ["autodocs"],
} satisfies Meta

export default meta
type Story = StoryObj

export const Default: Story = {
    render: () => (
        <Metric eyebrow="CONVERSATIONS" value="4 612" trend="↗ +12% vs mois préc." />
    ),
}

export const TrendNeutral: Story = {
    render: () => (
        <Metric
            eyebrow="COÛT META · MOIS"
            value="€148.72"
            trend="€820 budget"
            trendDirection="neutral"
        />
    ),
}

export const FourKpis: Story = {
    name: "4 KPI cards row (Analytics)",
    render: () => (
        <div className="grid grid-cols-4 gap-4">
            <Metric eyebrow="CONVERSATIONS" value="4 612" trend="↗ +12% vs mois préc." />
            <Metric eyebrow="TEMPS MOY. 1RE RÉPONSE" value="2m 14s" trend="↘ −18% vs mois préc." />
            <Metric eyebrow="TAUX DE RÉSOLUTION" value="94.2%" trend="↗ +2.1 pt vs mois préc." />
            <Metric eyebrow="SATISFACTION (CSAT)" value="4.7 / 5" trend="↗ +0.3 vs mois préc." />
        </div>
    ),
}

export const UsageCards: Story = {
    name: "UsageCard variants",
    render: () => (
        <div className="grid grid-cols-3 gap-4">
            <UsageCard label="CONVERSATIONS META" value="4 612" total="10 000" sub="Ce mois · €148.72" tone="accent" />
            <UsageCard label="CONTACTS" value="2 408" total="5 000" sub="Ce mois · inclus" tone="good" />
            <UsageCard label="SIÈGES" value="8" total="10" sub="Ce mois · inclus" tone="warn" />
        </div>
    ),
}

export const PaginationExample: Story = {
    name: "Pagination — bottom of tables",
    render: () => (
        <Pagination summary="12 sur 2 408 · 0 sélectionné" page="1 / 201" />
    ),
}
