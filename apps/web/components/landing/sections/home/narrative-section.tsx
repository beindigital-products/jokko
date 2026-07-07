"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Plug, Users, MessageSquareReply, BarChart3 } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

// Non-translatable icon components, aligned by index with m.narrative.steps.
const stepIcons = [Plug, Users, MessageSquareReply, BarChart3];

export function NarrativeSection() {
  const { m } = useLocale();
  const sectionRef = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: sectionRef,
    offset: ["start end", "end start"],
  });

  return (
    <section
      ref={sectionRef}
      id="comment-ca-marche"
      className="relative py-32 md:py-40"
    >
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {m.narrative.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
            {m.narrative.title}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {m.narrative.subtitle}
          </p>
        </div>

        <div className="mt-20 grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-24">
          <div className="hidden lg:block">
            <div className="sticky top-32">
              <StickyVisual progress={scrollYProgress} />
            </div>
          </div>

          <div className="space-y-20 lg:space-y-36">
            {m.narrative.steps.map((step, i) => (
              <NarrativeStep
                key={step.num}
                step={step}
                index={i}
                stepLabel={m.narrative.stepLabel}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

function NarrativeStep({
  step,
  index,
  stepLabel,
}: {
  step: { num: string; title: string; body: string };
  index: number;
  stepLabel: string;
}) {
  const Icon = stepIcons[index];
  return (
    <motion.div
      initial={{ opacity: 0, y: 40 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.4 }}
      transition={{ duration: 0.8, delay: index * 0.05, ease: [0.22, 1, 0.36, 1] }}
      className="relative"
    >
      <div className="flex items-center gap-3 font-mono text-[12px] uppercase tracking-[0.2em] text-muted-foreground">
        <span className="text-[var(--accent)]">{step.num}</span>
        <span className="h-px w-12 bg-border" />
        <span>{stepLabel}</span>
      </div>
      <h3 className="mt-4 font-display text-3xl font-bold tracking-tight md:text-4xl">
        {step.title}
      </h3>
      <p className="mt-4 max-w-xl text-lg leading-relaxed text-muted-foreground">
        {step.body}
      </p>
      <div className="mt-6 inline-flex items-center gap-2 rounded-full border border-border/60 bg-card px-3 py-1.5">
        <Icon className="h-3.5 w-3.5 text-[var(--accent)]" />
        <span className="text-xs font-medium">{step.title}</span>
      </div>

      <div className="mt-8 lg:hidden">
        <StepVisual index={index} />
      </div>
    </motion.div>
  );
}

function StickyVisual({
  progress,
}: {
  progress: ReturnType<typeof useScroll>["scrollYProgress"];
}) {
  const activeIndex = useTransform(progress, [0.1, 0.3, 0.5, 0.7, 0.9], [0, 1, 2, 3, 3]);
  const o0 = useTransform(activeIndex, (v) => Math.max(0, 1 - Math.abs(v - 0)));
  const o1 = useTransform(activeIndex, (v) => Math.max(0, 1 - Math.abs(v - 1)));
  const o2 = useTransform(activeIndex, (v) => Math.max(0, 1 - Math.abs(v - 2)));
  const o3 = useTransform(activeIndex, (v) => Math.max(0, 1 - Math.abs(v - 3)));
  const opacities = [o0, o1, o2, o3];

  return (
    <div className="relative aspect-[4/5] w-full overflow-hidden rounded-3xl border border-border/60 bg-gradient-to-br from-muted/40 to-background shadow-xl">
      {stepIcons.map((_, i) => (
        <motion.div
          key={i}
          className="absolute inset-0 flex items-center justify-center"
          style={{ opacity: opacities[i] }}
        >
          <StepVisual index={i} />
        </motion.div>
      ))}
    </div>
  );
}

function StepVisual({ index }: { index: number }) {
  const { m } = useLocale();
  const v = m.narrative.visuals;
  const commonClass =
    "relative flex h-full w-full flex-col items-center justify-center gap-4 p-8";

  if (index === 0) {
    return (
      <div className={commonClass}>
        <div className="flex flex-col items-center gap-3">
          {[1, 2, 3].map((n) => (
            <div
              key={n}
              className="flex items-center gap-3 rounded-2xl border border-border/60 bg-background px-4 py-3 shadow-sm"
            >
              <div className="flex h-8 w-8 items-center justify-center rounded-xl bg-[var(--whatsapp)] text-white">
                <svg viewBox="0 0 24 24" className="h-4 w-4" fill="currentColor">
                  <path d="M12 2a10 10 0 0 0-8.7 14.9L2 22l5.3-1.3A10 10 0 1 0 12 2z" />
                </svg>
              </div>
              <div className="text-xs">
                <p className="font-semibold">+221 {77 + n}0 000 00</p>
                <p className="text-muted-foreground">
                  {v.connectedStatus} · {n * 3} {v.agentsSuffix}
                </p>
              </div>
              <div className="ml-6 h-2 w-2 rounded-full bg-emerald-500" />
            </div>
          ))}
        </div>
      </div>
    );
  }

  if (index === 1) {
    return (
      <div className={commonClass}>
        <svg className="h-full w-full max-h-[300px]" viewBox="0 0 320 300" fill="none">
          <circle cx="160" cy="60" r="32" fill="var(--accent-muted)" />
          <text x="160" y="66" textAnchor="middle" fontSize="12" fill="var(--accent)" fontWeight="600">
            {v.newMessage}
          </text>
          {[80, 160, 240].map((x, i) => (
            <g key={i}>
              <line
                x1="160"
                y1="92"
                x2={x}
                y2="200"
                stroke="var(--accent)"
                strokeWidth="1.5"
                strokeDasharray="4 4"
                opacity="0.4"
              />
              <circle cx={x} cy="220" r="28" fill="white" stroke="#e5e5e5" strokeWidth="1" />
              <text x={x} y="226" textAnchor="middle" fontSize="10" fontWeight="600">
                {["Fatou", "Moussa", "Jo · IA"][i]}
              </text>
            </g>
          ))}
        </svg>
      </div>
    );
  }

  if (index === 2) {
    return (
      <div className={commonClass}>
        <div className="w-full max-w-sm space-y-2">
          <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-xs">
            {v.customerMessage}
          </div>
          <div className="rounded-2xl border border-[var(--accent)]/30 bg-[var(--accent-muted)] p-3">
            <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              {v.aiDraftLabel}
            </p>
            <p className="text-xs">
              {v.aiDraftText}
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={commonClass}>
      <div className="grid w-full max-w-sm grid-cols-2 gap-3">
        <MetricCard label={v.metrics.firstResponse} value="47s" trend="-82%" />
        <MetricCard label={v.metrics.resolutionRate} value="94%" trend="+31%" />
        <MetricCard label={v.metrics.csat} value="4.9/5" trend="+0.8" />
        <MetricCard label={v.metrics.revenue} value="+12M F" trend="+48%" />
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  trend,
}: {
  label: string;
  value: string;
  trend: string;
}) {
  return (
    <div className="rounded-xl border border-border/60 bg-background p-3">
      <p className="text-[9px] uppercase tracking-wider text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-bold">{value}</p>
      <p className={cn("text-[10px] font-medium", trend.startsWith("-") ? "text-emerald-600" : "text-emerald-600")}>
        {trend}
      </p>
    </div>
  );
}
