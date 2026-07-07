"use client";

import { Fragment } from "react";
import { motion } from "framer-motion";
import { Sparkles, Clock, MessageSquare, Zap } from "lucide-react";
import { CountUp } from "@/components/animations/count-up";
import { useLocale } from "@/lib/i18n/locale-context";

export function AiSection() {
  const { m } = useLocale();
  const featureIcons = [Clock, MessageSquare, Zap] as const;
  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <div
        aria-hidden
        className="pointer-events-none absolute -left-32 top-1/4 h-[400px] w-[400px] rounded-full opacity-30 blur-[120px]"
        style={{ background: "radial-gradient(circle, var(--accent-glow) 0%, transparent 70%)" }}
      />

      <div className="mx-auto max-w-7xl px-6">
        <div className="grid gap-16 lg:grid-cols-[1fr_1.1fr] lg:gap-20">
          <motion.div
            initial={{ opacity: 0, y: 24 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="inline-flex items-center gap-2 rounded-full border border-[var(--accent)]/30 bg-[var(--accent-muted)] px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-[var(--accent)]">
              <Sparkles className="h-3 w-3" />
              {m.ai.eyebrow}
            </div>

            <h2 className="mt-6 font-display text-4xl font-bold tracking-tight md:text-6xl">
              {m.ai.title}
            </h2>
            <p className="mt-6 max-w-xl text-lg leading-relaxed text-muted-foreground">
              {m.ai.subtitle}
            </p>

            <div className="mt-10 space-y-4">
              {m.ai.features.map((feature, i) => (
                <FeatureLine
                  key={feature.title}
                  icon={featureIcons[i]}
                  title={feature.title}
                  body={feature.body}
                />
              ))}
            </div>

            <div className="mt-12 flex items-baseline gap-4">
              <div className="font-display text-7xl font-bold leading-none tracking-tighter text-foreground md:text-8xl">
                <CountUp to={10} suffix={m.ai.bigNumberSuffix} />
              </div>
              <p className="text-sm uppercase tracking-wider text-muted-foreground">
                {m.ai.bigNumberLabel.split("\n").map((line, i, arr) => (
                  <Fragment key={i}>
                    {line}
                    {i < arr.length - 1 && <br />}
                  </Fragment>
                ))}
              </p>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            whileInView={{ opacity: 1, scale: 1 }}
            viewport={{ once: true, amount: 0.3 }}
            transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="relative"
          >
            <AiComparison />
          </motion.div>
        </div>
      </div>
    </section>
  );
}

function FeatureLine({
  icon: Icon,
  title,
  body,
}: {
  icon: typeof Clock;
  title: string;
  body: string;
}) {
  return (
    <div className="flex items-start gap-4">
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl border border-border/60 bg-card text-[var(--accent)]">
        <Icon className="h-4 w-4" />
      </div>
      <div>
        <p className="font-semibold">{title}</p>
        <p className="text-sm text-muted-foreground">{body}</p>
      </div>
    </div>
  );
}

function AiComparison() {
  const { m } = useLocale();
  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/60 bg-card p-5">
        <div className="mb-3 flex items-center gap-2">
          <span className="rounded-full bg-rose-500/10 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-rose-600">
            {m.ai.comparison.withoutAiLabel}
          </span>
          <span className="text-[11px] text-muted-foreground">{m.ai.comparison.withoutAiTime}</span>
        </div>
        <div className="space-y-2 text-sm">
          <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-[13px]">
            {m.ai.comparison.customerMessage}
          </div>
          <div className="flex items-center justify-end gap-2 text-[11px] text-muted-foreground">
            <span>{m.ai.comparison.agentTyping}</span>
            <span className="flex gap-0.5">
              <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" />
              <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.15s" }} />
              <span className="h-1 w-1 animate-bounce rounded-full bg-muted-foreground/60" style={{ animationDelay: "0.3s" }} />
            </span>
          </div>
        </div>
      </div>

      <div className="relative rounded-2xl border border-[var(--accent)]/30 bg-gradient-to-br from-[var(--accent-muted)] to-card p-5 shadow-[0_20px_60px_-20px_var(--accent-glow)]">
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-2xl opacity-0"
          animate={{ opacity: [0, 0.4, 0] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background:
              "conic-gradient(from var(--angle), transparent 70%, var(--accent) 80%, transparent 90%)",
          }}
        />
        <div className="relative">
          <div className="mb-3 flex items-center gap-2">
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)]/15 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
              <Sparkles className="h-2.5 w-2.5" />
              {m.ai.comparison.withAiLabel}
            </span>
            <span className="text-[11px] text-muted-foreground">{m.ai.comparison.withAiTime}</span>
          </div>
          <div className="space-y-2 text-sm">
            <div className="self-start rounded-2xl rounded-bl-sm bg-muted px-3 py-2 text-[13px]">
              {m.ai.comparison.customerMessage}
            </div>
            <div className="rounded-xl border border-[var(--accent)]/20 bg-background/80 p-3 backdrop-blur">
              <p className="mb-1 text-[10px] font-semibold uppercase tracking-wider text-[var(--accent)]">
                {m.ai.comparison.joConfidence}
              </p>
              <p className="text-[13px] leading-relaxed">
                {m.ai.comparison.joReply}
              </p>
              <div className="mt-3 flex gap-2">
                <button className="rounded-full bg-[var(--accent)] px-3 py-1 text-[11px] font-medium text-white">
                  {m.ai.comparison.actionSend}
                </button>
                <button className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium">
                  {m.ai.comparison.actionRephrase}
                </button>
                <button className="rounded-full border border-border/60 px-3 py-1 text-[11px] font-medium">
                  {m.ai.comparison.actionSoften}
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
