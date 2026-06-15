"use client"

import { Bar, BarChart, CartesianGrid, Cell, Label, Pie, PieChart, XAxis } from "recharts"

import {
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
    type ChartConfig,
} from "@/components/ui/chart"

// ── 30-day conversation volume, stacked by channel (shadcn bar) ───────────────

/** One day's stacked bar: `day` label + an arbitrary set of numeric series. */
export interface VolumePoint {
    day: string
    [channel: string]: number | string
}

export interface VolumeChannel {
    key: string
    label: string
    color: string
}

export function VolumeChart({
    data,
    channels,
}: {
    data: VolumePoint[]
    channels: VolumeChannel[]
}) {
    const config: ChartConfig = Object.fromEntries(
        channels.map((c) => [c.key, { label: c.label, color: c.color }]),
    )
    const lastKey = channels[channels.length - 1]?.key
    return (
        <ChartContainer config={config} className="aspect-auto h-[200px] w-full">
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
                {channels.map((c) => (
                    <Bar
                        key={c.key}
                        dataKey={c.key}
                        stackId="v"
                        fill={`var(--color-${c.key})`}
                        radius={c.key === lastKey ? [2, 2, 0, 0] : undefined}
                    />
                ))}
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

export function StatusDonut({
    data,
    centerLabel,
}: {
    data: StatusSlice[]
    /** Override the donut center text (defaults to the summed value as "%"). */
    centerLabel?: string
}) {
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
                                        {centerLabel ?? `${total}%`}
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
