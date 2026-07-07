"use client";

import Link from "next/link";
import { ArrowRight, Play } from "lucide-react";
import { motion } from "framer-motion";
import { SplitText } from "@/components/animations/split-text";
import { InboxMockup } from "@/components/landing/ui/inbox-mockup";
import { ShimmerButton } from "@/components/landing/ui/shimmer-button";
import { useLocale } from "@/lib/i18n/locale-context";
import { useDemoModal } from "@/lib/stores/demo-modal-store";

export function HeroSection() {
  const { m } = useLocale();
  const openDemo = useDemoModal((s) => s.openModal);
  return (
    <section className="relative overflow-hidden pt-28 pb-16 md:pt-36 md:pb-24">
      {/* Dot grid background */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 -z-10"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(20,20,26,0.035) 1px, transparent 0)",
          backgroundSize: "28px 28px",
        }}
      />
      {/* Accent glow */}
      <div
        aria-hidden
        className="pointer-events-none absolute -top-1/3 left-1/2 -z-10 h-[800px] w-[1100px] -translate-x-1/2 rounded-full opacity-60 blur-[120px]"
        style={{
          background:
            "radial-gradient(ellipse, var(--accent-glow) 0%, transparent 60%)",
        }}
      />
      {/* Bottom fade */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-x-0 bottom-0 -z-10 h-40 bg-gradient-to-t from-background to-transparent"
      />

      <div className="mx-auto w-full max-w-7xl px-6">
        {/* ─── TEXT BLOCK (centered, breathing room) ─── */}
        <div className="mx-auto flex max-w-4xl flex-col items-center text-center">
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
            className="inline-flex items-center gap-2 rounded-full border border-border/70 bg-background/70 px-3 py-1 font-mono text-[11px] uppercase tracking-[0.18em] text-muted-foreground backdrop-blur"
          >
            <span className="flex h-1.5 w-1.5 rounded-full bg-[var(--accent)]" />
            {m.hero.eyebrow}
          </motion.div>

          <h1 className="mt-8 font-display text-[clamp(2.5rem,7vw,6rem)] font-bold leading-[0.98] tracking-[-0.025em]">
            <SplitText as="span" className="block">
              {m.hero.titleLine1}
            </SplitText>
            <SplitText
              as="span"
              delay={0.15}
              className="block bg-gradient-to-br from-foreground via-foreground to-[var(--accent)] bg-clip-text text-transparent"
            >
              {m.hero.titleLine2}
            </SplitText>
          </h1>

          <motion.p
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.5, ease: [0.22, 1, 0.36, 1] }}
            className="mt-8 max-w-2xl text-lg leading-relaxed text-muted-foreground md:text-xl"
          >
            {m.hero.subtitle}
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6, delay: 0.65, ease: [0.22, 1, 0.36, 1] }}
            className="mt-10 flex flex-wrap items-center justify-center gap-3"
          >
            <ShimmerButton asChild size="lg">
              <Link href="/auth/sign-up">
                {m.hero.ctaPrimary}
                <ArrowRight className="h-4 w-4 transition-transform group-hover:translate-x-0.5" />
              </Link>
            </ShimmerButton>
            <ShimmerButton
              type="button"
              variant="ghost"
              size="lg"
              onClick={openDemo}
            >
              <Play className="h-3.5 w-3.5 fill-current" />
              {m.hero.ctaSecondary}
            </ShimmerButton>
          </motion.div>

          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.6, delay: 0.85 }}
            className="mt-8 flex flex-wrap items-center justify-center gap-4"
          >
            <div className="flex -space-x-2">
              {[
                {
                  g: "from-rose-400 to-rose-600",
                  mark: (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                      <circle cx="12" cy="6" r="3.2" />
                      <circle cx="12" cy="18" r="3.2" />
                      <circle cx="6" cy="12" r="3.2" />
                      <circle cx="18" cy="12" r="3.2" />
                    </svg>
                  ),
                },
                {
                  g: "from-amber-400 to-amber-600",
                  mark: (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden>
                      <path d="M6 8h12l-1.2 11.2A1 1 0 0 1 15.8 20H8.2a1 1 0 0 1-1-.8L6 8Z" />
                      <path d="M9 8a3 3 0 0 1 6 0" />
                    </svg>
                  ),
                },
                {
                  g: "from-sky-400 to-sky-600",
                  mark: (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} strokeLinejoin="round" aria-hidden>
                      <path d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7L12 2.5Z" />
                      <path d="M3.5 7 12 11.5 20.5 7" />
                      <path d="M12 11.5v10" />
                    </svg>
                  ),
                },
                {
                  g: "from-emerald-400 to-emerald-600",
                  mark: (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="currentColor" aria-hidden>
                      <path d="M12 2.5C7.4 7.2 5.5 10.8 5.5 14a6.5 6.5 0 0 0 13 0c0-3.2-1.9-6.8-6.5-11.5Z" />
                    </svg>
                  ),
                },
                {
                  g: "from-violet-400 to-violet-600",
                  mark: (
                    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" stroke="currentColor" strokeWidth={2.2} aria-hidden>
                      <circle cx="12" cy="12" r="9" />
                      <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
                    </svg>
                  ),
                },
              ].map(({ g, mark }, i) => (
                <div
                  key={i}
                  className={`flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br ${g} text-white ring-2 ring-background`}
                >
                  {mark}
                </div>
              ))}
            </div>
            <div className="flex flex-col text-left text-xs">
              <span className="font-semibold text-foreground">
                {m.hero.socialProofCount}
              </span>
              <span className="text-muted-foreground">
                {m.hero.socialProofNote}
              </span>
            </div>
          </motion.div>
        </div>

        {/* ─── MOCKUP (centered, showcased) ─── */}
        <motion.div
          initial={{ opacity: 0, y: 60, scale: 0.96 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ duration: 1, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="relative mx-auto mt-16 w-full max-w-6xl md:mt-20"
        >
          <InboxMockup />
        </motion.div>
      </div>
    </section>
  );
}
