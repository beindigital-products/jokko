"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { ArrowUpRight, Quote, Star } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLocale } from "@/lib/i18n/locale-context";

// Témoignages illustratifs — personnes et marques FICTIVES, à remplacer par de
// vrais retours clients (avec accord) une fois disponibles. Ton volontairement
// mesuré et concret pour rester crédible.
// Champs traduisibles (quote/metric/author/role/company…) dans le dictionnaire
// i18n ; seul le dégradé d'avatar (non textuel) reste ici, zippé par index.
const featuredColors = [
  "from-rose-400 to-rose-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
];

// Retours illustratifs (fictifs) — à remplacer par de vrais avis avec accord.
// Texte dans le dictionnaire i18n ; le dégradé d'avatar reste ici (par index).
const tweetColors = [
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-rose-400 to-rose-600",
  "from-sky-400 to-sky-600",
  "from-violet-400 to-violet-600",
  "from-emerald-400 to-emerald-600",
  "from-amber-400 to-amber-600",
  "from-sky-400 to-sky-600",
];

export function SocialProofSection() {
  const { m } = useLocale();
  const featured = m.socialProof.featured.map((t, i) => ({
    ...t,
    color: featuredColors[i],
  }));
  const tweets = m.socialProof.tweets.map((t, i) => ({
    ...t,
    color: tweetColors[i],
  }));

  return (
    <section className="relative overflow-hidden py-28 md:py-36">
      <div className="mx-auto max-w-7xl px-6">
        <div className="mx-auto max-w-2xl text-center">
          <p className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--accent)]">
            {m.socialProof.eyebrow}
          </p>
          <h2 className="mt-4 font-display text-4xl font-bold tracking-tight md:text-6xl">
            {m.socialProof.title}
          </h2>
          {m.socialProof.disclaimer && (
            <p className="mt-3 text-xs text-muted-foreground/70">
              {m.socialProof.disclaimer}
            </p>
          )}
        </div>

        <div className="mt-16 grid gap-6 md:grid-cols-3">
          {featured.map((t, i) => (
            <FeaturedTestimonial key={i} {...t} index={i} />
          ))}
        </div>

        <div className="relative mt-20 grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <TweetColumn tweets={tweets.slice(0, 3)} direction="down" />
          <TweetColumn tweets={tweets.slice(3, 6)} direction="up" />
          <TweetColumn tweets={tweets.slice(6, 8)} direction="down" className="hidden lg:grid" />
        </div>
      </div>
    </section>
  );
}

function FeaturedTestimonial({
  quote,
  metric,
  metricLabel,
  author,
  role,
  company,
  color,
  index,
}: {
  quote: string;
  metric: string;
  metricLabel: string;
  author: string;
  role: string;
  company: string;
  color: string;
  index: number;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 30 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, amount: 0.3 }}
      transition={{ duration: 0.7, delay: index * 0.1, ease: [0.22, 1, 0.36, 1] }}
      className="relative flex flex-col rounded-2xl border border-border/60 bg-card p-8 shadow-sm"
    >
      <Quote className="h-5 w-5 text-[var(--accent)]" />
      <p className="mt-5 flex-1 text-[15px] leading-relaxed text-foreground">
        &laquo; {quote} &raquo;
      </p>

      <div className="my-6 flex items-baseline gap-3 border-t border-border/50 pt-6">
        <span className="font-display text-4xl font-bold tracking-tight text-[var(--accent)]">
          {metric}
        </span>
        <span className="text-xs text-muted-foreground">{metricLabel}</span>
      </div>

      <div className="flex items-center gap-3">
        <div
          className={cn(
            "flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br text-xs font-semibold text-white",
            color
          )}
        >
          {author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div>
          <p className="text-sm font-semibold">{author}</p>
          <p className="text-xs text-muted-foreground">
            {role} · {company}
          </p>
        </div>
        <div className="ml-auto flex items-center gap-0.5 text-amber-500">
          {[0, 1, 2, 3, 4].map((i) => (
            <Star key={i} className="h-3 w-3 fill-current" />
          ))}
        </div>
      </div>
    </motion.div>
  );
}

type Tweet = {
  author: string;
  handle: string;
  text: string;
  color: string;
};

function TweetColumn({
  tweets,
  direction,
  className,
}: {
  tweets: Tweet[];
  direction: "up" | "down";
  className?: string;
}) {
  const duration = direction === "up" ? "40s" : "45s";
  return (
    <div
      className={cn(
        "relative h-[500px] overflow-hidden [mask-image:linear-gradient(to_bottom,transparent,black_15%,black_85%,transparent)]",
        className
      )}
    >
      <div
        className="flex flex-col gap-4"
        style={{
          animation: `${direction === "up" ? "marquee-vertical" : "marquee-vertical-reverse"} ${duration} linear infinite`,
        }}
      >
        {[...tweets, ...tweets].map((t, i) => (
          <TweetCard key={i} {...t} />
        ))}
      </div>
    </div>
  );
}

function TweetCard({
  author,
  handle,
  text,
  color,
}: {
  author: string;
  handle: string;
  text: string;
  color: string;
}) {
  return (
    <div className="shrink-0 rounded-2xl border border-border/60 bg-card p-4">
      <div className="flex items-center gap-2">
        <div
          className={cn(
            "flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br text-[10px] font-semibold text-white",
            color
          )}
        >
          {author
            .split(" ")
            .map((n) => n[0])
            .join("")}
        </div>
        <div className="flex-1">
          <p className="text-xs font-semibold">{author}</p>
          <p className="text-[10px] text-muted-foreground">{handle}</p>
        </div>
      </div>
      <p className="mt-3 text-[13px] leading-relaxed">{text}</p>
    </div>
  );
}

export function CaseStudyRow() {
  const { m } = useLocale();
  return (
    <div className="mx-auto mt-20 grid max-w-7xl gap-6 px-6 md:grid-cols-3">
      {m.socialProof.caseStudy.items.map((cs) => (
        <Link
          key={cs.slug}
          href={`/solutions/${cs.slug}`}
          className="group flex items-center justify-between rounded-2xl border border-border/60 bg-card p-6 transition-all hover:-translate-y-0.5 hover:border-[var(--accent)]/40 hover:shadow-lg"
        >
          <div>
            <p className="font-mono text-[10px] uppercase tracking-wider text-muted-foreground">
              {m.socialProof.caseStudy.eyebrow}
            </p>
            <p className="mt-1 font-display text-xl font-bold">{cs.company}</p>
            <p className="text-sm text-[var(--accent)]">{cs.metric}</p>
          </div>
          <ArrowUpRight className="h-5 w-5 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
        </Link>
      ))}
    </div>
  );
}
