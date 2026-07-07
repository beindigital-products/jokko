"use client";

import { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Sparkles, Zap, Store, Building2, ArrowRight } from "lucide-react";
import { usePlans } from "@/hooks/usePlans";
import { formatLimit } from "@/lib/plan-utils";
import { cn } from "@/lib/utils";
import { ShimmerButton } from "@/components/landing/ui/shimmer-button";
import { useLocale } from "@/lib/i18n/locale-context";
import type { LandingMessages } from "@/lib/i18n/landing-messages";

const PLAN_UI: Record<
  string,
  { icon: typeof Zap; accent: string }
> = {
  STARTER: { icon: Zap, accent: "slate" },
  BUSINESS: { icon: Store, accent: "accent" },
  PRO: { icon: Building2, accent: "dark" },
};

type Plan = {
  key: string;
  name: string;
  monthlyPriceFCFA: number;
  description: string;
  maxAgents: number;
  maxWhatsappChannels: number;
  maxConversationsPerMonth: number;
  supportLevel: string;
  features: { label: string; included: boolean }[];
  popular?: boolean;
};

function buildPlans(planDefs: Plan[], t: LandingMessages["pricing"]) {
  const ft = t.featureTemplates;
  return planDefs
    .filter((p) => PLAN_UI[p.key])
    .map((p) => {
      const ui = PLAN_UI[p.key];
      const agentWord = p.maxAgents > 1 ? ft.agentsPlural : ft.agents;
      const numberWord =
        p.maxWhatsappChannels > 1
          ? ft.whatsappNumbersPlural
          : ft.whatsappNumbers;
      return {
        key: p.key,
        name: p.name,
        price: new Intl.NumberFormat("fr-FR").format(p.monthlyPriceFCFA),
        description: p.description,
        icon: ui.icon,
        accent: ui.accent,
        cta: t.planCta[p.key as keyof typeof t.planCta] ?? p.name,
        popular: p.popular || false,
        features: [
          `${formatLimit(p.maxAgents)} ${agentWord}`,
          `${formatLimit(p.maxWhatsappChannels)} ${numberWord}`,
          `${formatLimit(p.maxConversationsPerMonth)} ${ft.conversationsPerMonth}`,
          ...p.features.filter((f) => f.included).map((f) => f.label),
          `${ft.supportPrefix} ${p.supportLevel}`,
        ],
      };
    });
}

export function PricingSection() {
  const { m } = useLocale();
  const { plans: planDefs, isLoading } = usePlans();
  const [cycle, setCycle] = useState<"monthly" | "yearly">("monthly");
  const plans = buildPlans(planDefs as Plan[], m.pricing);

  return (
    <section id="pricing" className="relative py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {m.pricing.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
            {m.pricing.title}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {m.pricing.subtitle}
          </p>

          <div className="mt-8 inline-flex rounded-full border border-border/70 bg-card p-1">
            {(["monthly", "yearly"] as const).map((c) => (
              <button
                key={c}
                onClick={() => setCycle(c)}
                className={cn(
                  "relative rounded-full px-4 py-1.5 text-sm font-medium transition-colors",
                  cycle === c ? "text-background" : "text-muted-foreground hover:text-foreground"
                )}
              >
                {cycle === c && (
                  <motion.span
                    layoutId="pricing-toggle"
                    className="absolute inset-0 rounded-full bg-foreground"
                    transition={{ type: "spring", stiffness: 400, damping: 32 }}
                  />
                )}
                <span className="relative">
                  {c === "monthly" ? m.pricing.cycleMonthly : m.pricing.cycleYearly}
                  {c === "yearly" && (
                    <span className="ml-1.5 rounded-full bg-[var(--accent-muted)] px-1.5 py-0.5 text-[10px] font-bold text-[var(--accent)]">
                      {m.pricing.yearlyDiscount}
                    </span>
                  )}
                </span>
              </button>
            ))}
          </div>
        </div>

        <div className="mt-16 grid grid-cols-1 items-start gap-6 md:grid-cols-3">
          {isLoading && <PlanSkeletons />}
          {!isLoading &&
            plans.map((plan, i) => (
              <PricingCard key={plan.key} plan={plan} cycle={cycle} index={i} />
            ))}
        </div>

        <div className="mt-14 rounded-3xl border border-border/60 bg-gradient-to-br from-[var(--surface-dark)] to-[var(--surface-dark-elevated)] p-8 text-white md:p-12">
          <div className="flex flex-col items-start gap-6 md:flex-row md:items-center md:justify-between md:gap-8">
            <div className="max-w-xl">
              <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-white/50">
                {m.pricing.enterprise.eyebrow}
              </p>
              <h3 className="mt-2 font-display text-2xl font-bold md:text-3xl">
                {m.pricing.enterprise.title}
              </h3>
              <p className="mt-3 text-[14px] text-white/70">
                {m.pricing.enterprise.description}
              </p>
            </div>
            <ShimmerButton asChild size="lg" variant="light">
              <Link href="/contact?subject=enterprise">
                {m.pricing.enterprise.cta}
                <ArrowRight className="h-4 w-4" />
              </Link>
            </ShimmerButton>
          </div>
        </div>
      </div>
    </section>
  );
}

function PricingCard({
  plan,
  cycle,
  index,
}: {
  plan: ReturnType<typeof buildPlans>[number];
  cycle: "monthly" | "yearly";
  index: number;
}) {
  const { m } = useLocale();
  const Icon = plan.icon;
  const displayPrice =
    cycle === "yearly"
      ? new Intl.NumberFormat("fr-FR").format(
          Math.round(parseInt(plan.price.replace(/\D/g, "")) * 0.8)
        )
      : plan.price;

  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.6, delay: index * 0.08, ease: [0.22, 1, 0.36, 1] }}
      className={cn(
        "relative flex h-full flex-col rounded-2xl border p-8 transition-all",
        plan.popular
          ? "border-[var(--accent)]/40 bg-gradient-to-br from-[var(--accent-muted)] to-card shadow-[0_32px_80px_-20px_var(--accent-glow)] lg:-mt-6"
          : "border-border/60 bg-card"
      )}
    >
      {plan.popular && (
        <motion.div
          aria-hidden
          className="absolute -inset-px rounded-2xl opacity-60"
          animate={{ opacity: [0.3, 0.6, 0.3] }}
          transition={{ duration: 3, repeat: Infinity }}
          style={{
            background:
              "conic-gradient(from 0deg, transparent 60%, var(--accent) 75%, transparent 90%)",
            filter: "blur(1px)",
            pointerEvents: "none",
          }}
        />
      )}

      <div className="relative">
        <div className="flex items-start justify-between">
          <div
            className={cn(
              "flex h-11 w-11 items-center justify-center rounded-xl",
              plan.popular
                ? "bg-[var(--accent)] text-white"
                : "border border-border/60 bg-background text-foreground"
            )}
          >
            <Icon className="h-5 w-5" />
          </div>
          {plan.popular && (
            <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent)] px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider text-white">
              <Sparkles className="h-2.5 w-2.5" />
              {m.pricing.recommendedBadge}
            </span>
          )}
        </div>

        <h3 className="mt-6 font-display text-2xl font-bold">{plan.name}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{plan.description}</p>

        <div className="mt-6 flex items-baseline gap-2">
          <AnimatePresence mode="wait">
            <motion.span
              key={cycle}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="font-display text-5xl font-bold tracking-tight tabular-nums"
            >
              {displayPrice}
            </motion.span>
          </AnimatePresence>
          <span className="text-sm text-muted-foreground">{m.pricing.priceSuffix}</span>
        </div>

        <ul className="mt-8 space-y-3">
          {plan.features.map((f, i) => (
            <li key={i} className="flex items-start gap-2.5 text-sm">
              <span
                className={cn(
                  "mt-0.5 flex h-4 w-4 shrink-0 items-center justify-center rounded-full",
                  plan.popular
                    ? "bg-[var(--accent)] text-white"
                    : "bg-muted text-muted-foreground"
                )}
              >
                <Check className="h-2.5 w-2.5" />
              </span>
              <span className="text-foreground/80">{f}</span>
            </li>
          ))}
        </ul>

        <div className="mt-8 pt-8 border-t border-border/40">
          <ShimmerButton
            asChild
            size="default"
            className="w-full"
            variant={plan.popular ? "primary" : "ghost"}
          >
            <Link href="/auth/sign-up">
              {plan.cta}
              <ArrowRight className="h-3.5 w-3.5" />
            </Link>
          </ShimmerButton>
        </div>
      </div>
    </motion.div>
  );
}

function PlanSkeletons() {
  return (
    <>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="h-[480px] animate-pulse rounded-2xl border border-border/60 bg-muted/40"
        />
      ))}
    </>
  );
}
