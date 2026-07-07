"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion";
import { useLocale } from "@/lib/i18n/locale-context";

export function FaqSection() {
  const { m } = useLocale();
  return (
    <section id="faq" className="relative bg-muted/20 py-28 md:py-36">
      <div className="mx-auto max-w-4xl px-6">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
          className="text-center"
        >
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {m.faq.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-5xl">
            {m.faq.title}
          </h2>
          <p className="mt-5 text-lg text-muted-foreground">
            {m.faq.subtitleBefore}{" "}
            <Link href="/contact" className="text-[var(--accent)] underline underline-offset-4">
              {m.faq.subtitleLink}
            </Link>{" "}
            {m.faq.subtitleAfter}
          </p>
        </motion.div>

        <div className="mt-14">
          <Accordion type="single" collapsible className="space-y-3">
            {m.faq.items.map((f, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 12 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, amount: 0.3 }}
                transition={{ duration: 0.45, delay: i * 0.04, ease: [0.22, 1, 0.36, 1] }}
              >
                <AccordionItem
                  value={`item-${i}`}
                  className="overflow-hidden rounded-2xl border border-border/60 bg-card px-5 transition-colors hover:border-[var(--accent)]/30"
                >
                  <AccordionTrigger className="py-5 text-left text-[15px] font-semibold hover:no-underline">
                    {f.q}
                  </AccordionTrigger>
                  <AccordionContent className="pb-5 text-[14px] leading-relaxed text-muted-foreground">
                    {f.a}
                  </AccordionContent>
                </AccordionItem>
              </motion.div>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
