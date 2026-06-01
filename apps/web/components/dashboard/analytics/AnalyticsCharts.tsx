"use client"

import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

// ── 30-day conversation volume, stacked by channel (shadcn bar) ───────────────

export interface VolumePoint {
    day: string
    paris: number
    dakar: number
    abidjan: number
}

const VOLUME_CONFIG = {
    paris: { label: "Paris", color: "var(--accent)" },
    dakar: { label: "Dakar", color: "var(--ink-900)" },
    abidjan: { label: "Abidjan", color: "var(--status-warn)" },
} satisfies ChartConfig

export function VolumeChart({ data }: { data: VolumePoint[] }) {
    return (
        <ChartContainer config={VOLUME_CONFIG} className="aspect-auto h-[200px] w-full">
            <BarChart accessibilityLayer data={data} barCategoryGap={2} margin={{ left: -20, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    minTickGap={48}
                    fontSize={10}
                />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Bar dataKey="paris" stackId="v" fill="var(--color-paris)" />
                <Bar dataKey="dakar" stackId="v" fill="var(--color-dakar)" />
                <Bar dataKey="abidjan" stackId="v" fill="var(--color-abidjan)" radius={[2, 2, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
}

// ── conversations by status (shadcn donut) ────────────────────────────────────

export interface StatusSlice {
    key: string
    label: string
    value: number
    color: string
}

export function StatusDonut({ data }: { data: StatusSlice[] }) {
    const config: ChartConfig = Object.fromEntries(
        data.map((d) => [d.key, { label: d.label, color: d.color }]),
    )
    const total = data.reduce((acc, d) => acc + d.value, 0)

    return (
        <ChartContainer config={config} className="mx-auto aspect-square h-[150px]">
            <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data as unknown as Array<Record<string, unknown>>}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={44}
                    outerRadius={66}
                    strokeWidth={2}
                    stroke="var(--paper-white)"
                >
                    {data.map((d) => (
                        <Cell key={d.key} fill={d.color} />
                    ))}
                    <Label
                        content={({ viewBox }) => {
                            if (!viewBox || !("cx" in viewBox)) return null
                            return (
                                <text x={viewBox.cx} y={viewBox.cy} textAnchor="middle" dominantBaseline="middle">
                                    <tspan
                                        x={viewBox.cx}
                                        y={viewBox.cy}
                                        className="fill-[var(--ink-900)] font-display text-[18px] font-bold"
                                    >
                                        {total}%
                                    </tspan>
                                </text>
                            )
                        }}
                    />
                </Pie>
            </PieChart>
        </ChartContainer>
    )
}
