"use client";

import { LogoMarquee } from "@/components/landing/ui/logo-marquee";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * Logos illustratifs — MARQUES FICTIVES (placeholders dessinés).
 * À remplacer par de vrais logos clients (avec accord) quand ils seront disponibles.
 * On utilise des marques inventées, pas de vraies entreprises, pour éviter tout
 * usage de marque non autorisé. Chaque logo = logomark + wordmark en `currentColor`
 * (rendu monochrome « logo cloud », s'éclaircit au survol).
 */
const Wordmark = ({ children }: { children: React.ReactNode }) => (
  <span className="font-display text-xl font-semibold tracking-tight">{children}</span>
);

const logos = [
  {
    name: "Maraa",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
          <circle cx="12" cy="6" r="3.1" />
          <circle cx="12" cy="18" r="3.1" />
          <circle cx="6" cy="12" r="3.1" />
          <circle cx="18" cy="12" r="3.1" />
        </svg>
        <Wordmark>Maraa</Wordmark>
      </div>
    ),
  },
  {
    name: "Senda",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
          <path d="M6 8h12l-1.2 11.2A1 1 0 0 1 15.8 20H8.2a1 1 0 0 1-1-.8L6 8Z" />
          <path d="M9 8a3 3 0 0 1 6 0" />
        </svg>
        <Wordmark>Senda</Wordmark>
      </div>
    ),
  },
  {
    name: "Niovo",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinejoin="round" aria-hidden>
          <path d="M12 2.5 3.5 7v10L12 21.5 20.5 17V7L12 2.5Z" />
          <path d="M3.5 7 12 11.5 20.5 7" />
          <path d="M12 11.5v10" />
        </svg>
        <Wordmark>Niovo</Wordmark>
      </div>
    ),
  },
  {
    name: "Kessa",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="currentColor" aria-hidden>
          <path d="M12 2.5C7.4 7.2 5.5 10.8 5.5 14a6.5 6.5 0 0 0 13 0c0-3.2-1.9-6.8-6.5-11.5Z" />
        </svg>
        <Wordmark>Kessa</Wordmark>
      </div>
    ),
  },
  {
    name: "Wendo",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} aria-hidden>
          <circle cx="12" cy="12" r="9" />
          <circle cx="12" cy="12" r="3.4" fill="currentColor" stroke="none" />
        </svg>
        <Wordmark>Wendo</Wordmark>
      </div>
    ),
  },
  {
    name: "Baytel",
    svg: (
      <div className="flex items-center gap-2">
        <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" aria-hidden>
          <circle cx="12" cy="17" r="1.6" fill="currentColor" stroke="none" />
          <path d="M8 13.2a5.6 5.6 0 0 1 8 0" />
          <path d="M5 10a10 10 0 0 1 14 0" />
        </svg>
        <Wordmark>Baytel</Wordmark>
      </div>
    ),
  },
];

export function LogoTickerSection() {
  const { m } = useLocale();
  return (
    <section className="border-y border-border/50 bg-muted/20 py-12">
      <div className="mx-auto max-w-7xl px-6">
        <p className="mb-8 text-center font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">
          {m.logoTicker.eyebrow}
        </p>
        <LogoMarquee logos={logos} speed="slow" />
      </div>
    </section>
  );
}
