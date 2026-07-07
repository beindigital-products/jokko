"use client";

import Link from "next/link";
import { Play } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { useDemoModal } from "@/lib/stores/demo-modal-store";
import { useLocale } from "@/lib/i18n/locale-context";

/**
 * "Voir la démo (2 min)" lightbox. Opened from the hero CTA via the demo-modal
 * store. The video source is configured with `NEXT_PUBLIC_DEMO_VIDEO_URL`
 * (YouTube, Vimeo, or a direct .mp4/.webm). Until that env var is set, a polished
 * placeholder is shown so the button is still a real, working action.
 *
 * Playback stops on close because Radix unmounts the dialog content (iframe/video
 * is removed), so no extra teardown is needed.
 */

// Defaults to the bundled product screencast in /public; override with the env
// var to point at a hosted/CDN video (YouTube, Vimeo, or a direct file URL).
const DEMO_VIDEO_URL = process.env.NEXT_PUBLIC_DEMO_VIDEO_URL || "/demo.mp4";

const TEXT = {
  fr: {
    title: "Démo Jokko",
    soonTitle: "La démo arrive très bientôt",
    soonBody:
      "En attendant, créez votre compte et testez Jokko gratuitement pendant 14 jours.",
    soonCta: "Démarrer gratuitement",
  },
  en: {
    title: "Jokko demo",
    soonTitle: "The demo is on its way",
    soonBody:
      "In the meantime, create your account and try Jokko free for 14 days.",
    soonCta: "Start for free",
  },
} as const;

/** Turn a YouTube/Vimeo share URL into an autoplaying embed URL (null if it's a file). */
function toEmbedUrl(url: string): string | null {
  const yt = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/)([\w-]{11})/);
  if (yt) return `https://www.youtube.com/embed/${yt[1]}?autoplay=1&rel=0`;
  const vimeo = url.match(/vimeo\.com\/(\d+)/);
  if (vimeo) return `https://player.vimeo.com/video/${vimeo[1]}?autoplay=1`;
  return null;
}

export function DemoVideoModal() {
  const open = useDemoModal((s) => s.open);
  const setOpen = useDemoModal((s) => s.setOpen);
  const { locale } = useLocale();
  const t = TEXT[locale];

  const embedUrl = DEMO_VIDEO_URL ? toEmbedUrl(DEMO_VIDEO_URL) : null;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogContent
        aria-describedby={undefined}
        className="max-w-4xl overflow-hidden border-0 bg-black p-0 sm:max-w-4xl [&_[data-slot=dialog-close]]:text-white [&_[data-slot=dialog-close]]:opacity-80 [&_[data-slot=dialog-close]]:hover:opacity-100"
      >
        <DialogTitle className="sr-only">{t.title}</DialogTitle>
        <div className="relative aspect-video w-full bg-black">
          {DEMO_VIDEO_URL ? (
            embedUrl ? (
              <iframe
                src={embedUrl}
                title={t.title}
                className="absolute inset-0 h-full w-full"
                allow="autoplay; fullscreen; picture-in-picture; encrypted-media"
                allowFullScreen
              />
            ) : (
              <video
                src={DEMO_VIDEO_URL}
                className="absolute inset-0 h-full w-full"
                controls
                autoPlay
                muted
                playsInline
              />
            )
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-5 bg-gradient-to-br from-[var(--surface-dark)] to-black px-8 text-center">
              <span className="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--accent)]/20 text-[var(--accent)] ring-1 ring-[var(--accent)]/40">
                <Play className="h-6 w-6 fill-current" />
              </span>
              <div>
                <p className="font-display text-2xl font-bold text-white">
                  {t.soonTitle}
                </p>
                <p className="mx-auto mt-2 max-w-md text-sm leading-relaxed text-white/60">
                  {t.soonBody}
                </p>
              </div>
              <Link
                href="/auth/sign-up"
                onClick={() => setOpen(false)}
                className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2.5 text-sm font-medium text-[var(--surface-dark)] transition-transform hover:-translate-y-0.5"
              >
                {t.soonCta}
              </Link>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
