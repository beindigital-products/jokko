"use client"

import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis } from "recharts"

import {
    ChartContainer,
    ChartLegend,
    ChartLegendContent,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

// ── 7-day activity (inbound vs outbound), shadcn bar chart ────────────────

export interface ActivityPoint {
    day: string
    inbound: number
    outbound: number
}

const ACTIVITY_CONFIG = {
    inbound: { label: "Reçus", color: "var(--ink-400)" },
    outbound: { label: "Envoyés", color: "var(--accent)" },
} satisfies ChartConfig

export function ActivityChart({ data }: { data: ActivityPoint[] }) {
    return (
        <ChartContainer config={ACTIVITY_CONFIG} className="aspect-auto h-[180px] w-full">
            <BarChart accessibilityLayer data={data} barGap={3} margin={{ left: -16, right: 4 }}>
                <CartesianGrid vertical={false} />
                <XAxis
                    dataKey="day"
                    tickLine={false}
                    axisLine={false}
                    tickMargin={8}
                    fontSize={10}
                />
                <ChartTooltip cursor={false} content={<ChartTooltipContent />} />
                <ChartLegend content={<ChartLegendContent />} />
                <Bar dataKey="inbound" fill="var(--color-inbound)" radius={[3, 3, 0, 0]} />
                <Bar dataKey="outbound" fill="var(--color-outbound)" radius={[3, 3, 0, 0]} />
            </BarChart>
        </ChartContainer>
    )
}

// ── conversations by status, shadcn donut ─────────────────────────────────

export interface StatusSlice {
    key: string
    label: string
    value: number
    color: string
}

export function StatusDonut({ data, total }: { data: StatusSlice[]; total?: number }) {
    const config: ChartConfig = Object.fromEntries(
        data.map((d) => [d.key, { label: d.label, color: d.color }]),
    )
    const sum = total ?? data.reduce((acc, d) => acc + d.value, 0)

    return (
        <ChartContainer config={config} className="mx-auto aspect-square h-[180px]">
            <PieChart>
                <ChartTooltip cursor={false} content={<ChartTooltipContent hideLabel />} />
                <Pie
                    data={data as unknown as Array<Record<string, unknown>>}
                    dataKey="value"
                    nameKey="key"
                    innerRadius={52}
                    outerRadius={78}
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
                                        className="fill-[var(--ink-900)] font-display text-[22px] font-bold"
                                    >
                                        {sum.toLocaleString("fr-FR")}
                                    </tspan>
                                    <tspan
                                        x={viewBox.cx}
                                        y={(viewBox.cy ?? 0) + 18}
                                        className="fill-[var(--ink-soft)] text-[10px]"
                                    >
                                        total
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
