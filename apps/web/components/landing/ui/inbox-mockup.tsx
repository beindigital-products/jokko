"use client";

import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import {
  Search,
  Clock,
  Phone,
  MoreHorizontal,
  Paperclip,
  Smile,
  Send,
  Mic,
  Mail,
  Building2,
  Tag as TagIcon,
  Inbox,
  UserRound,
  Sparkles,
  Check,
  ChevronRight,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { Avatar, type AvatarColor } from "@/components/dashboard/primitives/Avatar";
import { Chip, type ChipTone } from "@/components/dashboard/primitives/Chip";

// ============================================
// Data — a slice of the real product (West-African support inbox)
// ============================================

type Step = 0 | 1 | 2 | 3 | 4;
type Win = "ok" | "warn" | "danger";

interface Thread {
  id: string;
  name: string;
  initials: string;
  color: AvatarColor;
  preview: string;
  time: string;
  unread?: number;
  window?: Win;
  windowLabel?: string;
  active?: boolean;
  section: "mine" | "unassigned";
}

const WIN_TONE: Record<Win, ChipTone> = {
  ok: "good",
  warn: "warn",
  danger: "danger",
};

const threads: Thread[] = [
  {
    id: "1",
    name: "Aïssatou Diop",
    initials: "AD",
    color: "violet",
    preview: "Bonjour, ma commande #4821 est-elle…",
    time: "10:24",
    unread: 2,
    window: "ok",
    windowLabel: "23h45",
    active: true,
    section: "mine",
  },
  {
    id: "2",
    name: "Moussa Fall",
    initials: "MF",
    color: "emerald",
    preview: "Merci beaucoup pour votre retour 🙏",
    time: "10:21",
    window: "ok",
    windowLabel: "18h",
    section: "mine",
  },
  {
    id: "3",
    name: "Awa Sarr",
    initials: "AS",
    color: "amber",
    preview: "Bonjour, livrez-vous à Thiès ?",
    time: "09:52",
    unread: 1,
    window: "warn",
    windowLabel: "4h",
    section: "unassigned",
  },
  {
    id: "4",
    name: "Coumba Sow",
    initials: "CS",
    color: "sky",
    preview: "Je voudrais changer la taille du produit",
    time: "09:41",
    window: "ok",
    windowLabel: "21h",
    section: "unassigned",
  },
  {
    id: "5",
    name: "Ibrahima Ndiaye",
    initials: "IN",
    color: "crimson",
    preview: "Parfait, j'attends le lien de paiement.",
    time: "Hier",
    window: "danger",
    windowLabel: "Fermée",
    section: "mine",
  },
];

const incoming: { text: string; time: string }[] = [
  { text: "Bonjour, ma commande #4821 est-elle bien expédiée ?", time: "10:22" },
  { text: "J'attends depuis 3 jours 😕", time: "10:24" },
];

const replyText =
  "Bonjour Aïssatou 👋 Votre commande #4821 est partie hier soir. Suivi : AB123456 — livraison prévue demain matin. Désolés pour l'attente !";

// ============================================
// Root — auto-playing demo loop (typing → IA draft → send → sent)
// ============================================

export function InboxMockup() {
  const [step, setStep] = useState<Step>(0);
  const [typed, setTyped] = useState(0);

  useEffect(() => {
    let timers: ReturnType<typeof setTimeout>[] = [];
    const cycle = () => {
      setStep(0);
      setTyped(0);
      timers = [
        setTimeout(() => setStep(1), 1800), // contact typing
        setTimeout(() => setStep(2), 3200), // IA drafts reply
        setTimeout(() => setStep(3), 6600), // sending
        setTimeout(() => setStep(4), 7500), // sent bubble
        setTimeout(cycle, 10500), // loop
      ];
    };
    cycle();
    return () => timers.forEach(clearTimeout);
  }, []);

  // Typewriter for the IA-drafted reply (only during step 2).
  useEffect(() => {
    if (step !== 2) return;
    let current = 0;
    const id = setInterval(() => {
      current += 3;
      setTyped(Math.min(current, replyText.length));
      if (current >= replyText.length) clearInterval(id);
    }, 22);
    return () => clearInterval(id);
  }, [step]);

  return (
    <div data-testid="inbox-mockup" className="relative w-full">
      {/* Cobalt + hint-of-pink glow (no WhatsApp green) */}
      <div
        aria-hidden
        className="pointer-events-none absolute -inset-8 -z-10 rounded-[2.5rem] opacity-70 blur-3xl"
        style={{
          background:
            "radial-gradient(ellipse at 25% 15%, var(--accent-glow) 0%, transparent 55%), radial-gradient(ellipse at 85% 85%, var(--accent-hot-pink-soft) 0%, transparent 55%)",
        }}
      />

      <div className="relative overflow-hidden rounded-3xl border border-[var(--ink-200)] bg-[var(--paper-white)] shadow-[0_40px_100px_-20px_rgba(20,20,26,0.20)]">
        <ChromeBar />
        <div className="grid grid-cols-1 md:h-[520px] md:grid-cols-[240px_1fr] lg:grid-cols-[240px_1fr_220px]">
          <ThreadList />
          <ConversationPanel step={step} typed={typed} />
          <CustomerPanel />
        </div>
      </div>

      <FloatingAssignToast show={step === 0} />
      <FloatingSentToast show={step === 4} />
    </div>
  );
}

// ============================================
// Browser chrome — frames the preview as "the dashboard"
// ============================================

function ChromeBar() {
  return (
    <div className="flex items-center gap-3 border-b border-[var(--ink-100)] bg-[var(--paper-warm)] px-4 py-2.5">
      <div className="flex gap-1.5">
        {[0, 1, 2].map((i) => (
          <span key={i} className="h-2.5 w-2.5 rounded-full bg-[var(--ink-200)]" />
        ))}
      </div>
      <div className="mx-auto hidden items-center gap-1.5 rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1 font-mono text-[10px] text-[var(--ink-soft)] sm:flex">
        <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-good)]" />
        app.jokko.co/conversations
      </div>
      <Image
        src="/logo-mark.png"
        alt=""
        aria-hidden
        width={18}
        height={18}
        className="h-[18px] w-[18px] shrink-0"
      />
    </div>
  );
}

// ============================================
// Left — thread list (mirrors ConversationListItem.tsx)
// ============================================

function ThreadList() {
  const totalUnread = threads.reduce((acc, t) => acc + (t.unread || 0), 0);
  const mine = threads.filter((t) => t.section === "mine");
  const unassigned = threads.filter((t) => t.section === "unassigned");

  return (
    <aside className="hidden flex-col overflow-hidden border-r border-[var(--ink-200)] bg-[var(--paper-white)] md:flex md:h-[520px]">
      <div className="flex items-center justify-between px-3 py-3">
        <h2 className="text-[14px] font-bold tracking-tight text-[var(--ink-900)]">
          Conversations
        </h2>
        {totalUnread > 0 && (
          <span className="inline-flex items-center gap-1 rounded-full bg-[var(--accent-muted)] px-1.5 py-0.5 font-mono text-[9px] font-semibold text-[var(--accent)]">
            <motion.span
              className="h-1.5 w-1.5 rounded-full bg-[var(--accent)]"
              animate={{ opacity: [1, 0.3, 1] }}
              transition={{ duration: 1.6, repeat: Infinity }}
            />
            {totalUnread} non lus
          </span>
        )}
      </div>

      {/* Scope toggle */}
      <div className="px-3">
        <div className="flex rounded-lg bg-[var(--ink-100)] p-0.5">
          <button className="flex-1 rounded-md bg-[var(--paper-white)] px-2 py-1 text-[10px] font-semibold text-[var(--ink-900)] shadow-sm">
            Tous
          </button>
          <button className="flex-1 rounded-md px-2 py-1 text-[10px] font-medium text-[var(--ink-500)]">
            Les miens
          </button>
        </div>
      </div>

      {/* Search */}
      <div className="mx-3 mt-2 flex items-center gap-1.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-1.5 font-mono text-[10px] text-[var(--ink-400)]">
        <Search className="h-3 w-3" />
        Rechercher…
        <span className="ml-auto rounded border border-[var(--ink-200)] px-1 text-[9px]">
          ⌘K
        </span>
      </div>

      {/* Filter pills */}
      <div className="flex flex-wrap gap-1 px-3 py-2">
        <FilterPill icon={Inbox} active>
          Tout
        </FilterPill>
        <FilterPill icon={Mail}>Non lus</FilterPill>
        <FilterPill icon={UserRound}>Non assign.</FilterPill>
      </div>

      {/* Sections */}
      <div className="flex-1 overflow-hidden">
        <SectionLabel title="Mes conversations" count={mine.length} />
        {mine.map((t) => (
          <ThreadRow key={t.id} thread={t} />
        ))}
        <SectionLabel title="Non assignées" count={unassigned.length} />
        {unassigned.map((t) => (
          <ThreadRow key={t.id} thread={t} />
        ))}
      </div>
    </aside>
  );
}

function FilterPill({
  children,
  active,
  icon: Icon,
}: {
  children: React.ReactNode;
  active?: boolean;
  icon: React.ElementType;
}) {
  return (
    <button
      className={cn(
        "inline-flex shrink-0 items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.04em] transition-colors",
        active
          ? "bg-[var(--accent)] text-white"
          : "border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-600)] hover:bg-[var(--paper-warm)]"
      )}
    >
      <Icon className="h-2.5 w-2.5" />
      {children}
    </button>
  );
}

function SectionLabel({ title, count }: { title: string; count: number }) {
  return (
    <div className="flex items-center justify-between px-3 pb-1 pt-3">
      <span className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
        {title}
      </span>
      <span className="rounded-full bg-[var(--ink-100)] px-1.5 font-mono text-[9px] font-semibold text-[var(--ink-500)]">
        {count}
      </span>
    </div>
  );
}

function ThreadRow({ thread }: { thread: Thread }) {
  const unread = (thread.unread || 0) > 0;
  return (
    <button
      type="button"
      className={cn(
        "flex w-full items-start gap-2.5 px-3 py-2.5 text-left transition-colors",
        thread.active
          ? "border-l-2 border-l-[var(--accent)] bg-[var(--accent-muted)]/40"
          : "border-l-2 border-l-transparent hover:bg-[var(--paper-warm)]"
      )}
    >
      <Avatar
        initials={thread.initials}
        color={thread.color}
        status={thread.active ? "online" : undefined}
      />
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between gap-1">
          <span
            className={cn(
              "truncate text-[12.5px] text-[var(--ink-900)]",
              unread ? "font-bold" : "font-semibold"
            )}
          >
            {thread.name}
          </span>
          <span className="shrink-0 font-mono text-[9px] text-[var(--ink-soft)]">
            {thread.time}
          </span>
        </div>
        <p className="mt-0.5 truncate text-[11px] text-[var(--ink-soft)]">
          {thread.preview}
        </p>
        <div className="mt-1 flex items-center gap-1">
          {thread.window && thread.windowLabel && (
            <Chip tone={WIN_TONE[thread.window]}>
              <Clock className="h-2.5 w-2.5" />
              {thread.windowLabel}
            </Chip>
          )}
          {unread && (
            <span className="ml-auto inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-[var(--accent)] px-1 font-mono text-[9px] font-bold text-white">
              {thread.unread}
            </span>
          )}
        </div>
      </div>
    </button>
  );
}

// ============================================
// Center — conversation (mirrors ConversationHeader + MessageBubble)
// ============================================

function ConversationPanel({ step, typed }: { step: Step; typed: number }) {
  const shown = replyText.slice(0, typed);
  return (
    <main className="flex min-w-0 flex-col overflow-hidden bg-[var(--paper-warm)] md:h-[520px]">
      {/* Header */}
      <div className="flex items-center justify-between gap-2 border-b border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-2.5">
        <div className="flex min-w-0 items-center gap-2.5">
          <Avatar initials="AD" color="violet" status="online" />
          <div className="min-w-0">
            <div className="flex items-center gap-1.5">
              <span className="truncate text-[13px] font-semibold text-[var(--ink-900)]">
                Aïssatou Diop
              </span>
              <span className="hidden font-mono text-[11px] text-[var(--ink-soft)] lg:inline">
                +221 77 834 12 48
              </span>
            </div>
            <div className="mt-0.5 flex items-center gap-1.5">
              <Chip tone="good">
                <Clock className="h-2.5 w-2.5" />
                23h45
              </Chip>
              <Chip tone="accent">
                <span className="flex h-3 w-3 items-center justify-center rounded-full bg-[var(--accent)] text-[7px] font-bold text-white">
                  S
                </span>
                Santiago
              </Chip>
            </div>
          </div>
        </div>
        <div className="flex shrink-0 items-center gap-1">
          <IconBtn>
            <Phone className="h-3.5 w-3.5" />
          </IconBtn>
          <IconBtn>
            <MoreHorizontal className="h-3.5 w-3.5" />
          </IconBtn>
        </div>
      </div>

      {/* Messages (paper-warm + subtle dot grid, no WhatsApp beige) */}
      <div
        className="flex min-h-0 flex-1 flex-col gap-2 overflow-hidden px-4 py-3"
        style={{
          backgroundImage:
            "radial-gradient(circle at 1px 1px, rgba(20,20,26,0.04) 1px, transparent 0)",
          backgroundSize: "22px 22px",
        }}
      >
        <div className="mb-1 flex justify-center">
          <span className="rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 py-0.5 font-mono text-[9px] font-medium text-[var(--ink-soft)]">
            Aujourd&apos;hui
          </span>
        </div>

        {incoming.map((m, i) => (
          <InBubble key={i} text={m.text} time={m.time} />
        ))}

        <AnimatePresence>{step === 1 && <TypingBubble />}</AnimatePresence>
        <AnimatePresence>
          {step === 4 && <OutBubble text={replyText} time="10:25" />}
        </AnimatePresence>
      </div>

      <Composer step={step} shown={shown} />
    </main>
  );
}

function InBubble({ text, time }: { text: string; time: string }) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="max-w-[78%] self-start rounded-2xl rounded-bl-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 shadow-sm"
    >
      <p className="text-[12px] leading-relaxed text-[var(--ink-900)]">{text}</p>
      <div className="mt-0.5 text-right font-mono text-[9px] text-[var(--ink-soft)]">
        {time}
      </div>
    </motion.div>
  );
}

function OutBubble({ text, time }: { text: string; time: string }) {
  return (
    <motion.div
      key="sent"
      initial={{ opacity: 0, y: 12, scale: 0.96 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className="max-w-[80%] self-end rounded-2xl rounded-br-md bg-[var(--ink-900)] px-3 py-2 shadow-sm"
    >
      <p className="whitespace-pre-wrap text-[12px] leading-relaxed text-white">
        {text}
      </p>
      <div className="mt-1 flex items-center justify-end gap-1 font-mono text-[9px] text-white/60">
        {time}
        <span className="text-sky-400">✓✓</span>
      </div>
    </motion.div>
  );
}

function TypingBubble() {
  return (
    <motion.div
      key="typing"
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: -4 }}
      className="flex items-center gap-1 self-start rounded-2xl rounded-bl-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 shadow-sm"
    >
      {[0, 1, 2].map((i) => (
        <motion.span
          key={i}
          className="h-1.5 w-1.5 rounded-full bg-[var(--ink-400)]"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -2, 0] }}
          transition={{ duration: 0.9, repeat: Infinity, delay: i * 0.15 }}
        />
      ))}
    </motion.div>
  );
}

function Composer({ step, shown }: { step: Step; shown: string }) {
  const drafting = step === 2 && shown.length > 0;
  return (
    <div className="border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2.5">
      <AnimatePresence>
        {step === 2 && (
          <motion.div
            key="ia"
            initial={{ opacity: 0, y: 4 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            className="mb-1.5 inline-flex items-center gap-1 rounded-full bg-[var(--accent-hot-pink-soft)] px-2 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.04em] text-[var(--accent-hot-pink)]"
          >
            <Sparkles className="h-2.5 w-2.5" />
            Brouillon IA · Copilot
          </motion.div>
        )}
      </AnimatePresence>
      <div className="flex items-center gap-2 rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 py-1.5">
        <Smile className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
        <Paperclip className="h-3.5 w-3.5 shrink-0 text-[var(--ink-400)]" />
        <div className="min-w-0 flex-1 truncate text-[11.5px]">
          {drafting ? (
            <span className="text-[var(--ink-900)]">
              {shown}
              <span className="ml-0.5 inline-block h-3 w-0.5 animate-pulse bg-[var(--accent)] align-middle" />
            </span>
          ) : step === 3 ? (
            <span className="italic text-[var(--ink-400)]">Envoi en cours…</span>
          ) : (
            <span className="text-[var(--ink-400)]">Écrire un message…</span>
          )}
        </div>
        <motion.button
          className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-[var(--accent)] text-white shadow-sm"
          animate={step === 3 ? { scale: [1, 1.15, 1] } : { scale: 1 }}
          transition={{ duration: 0.4 }}
        >
          {step === 0 ? <Mic className="h-3 w-3" /> : <Send className="h-3 w-3" />}
        </motion.button>
      </div>
    </div>
  );
}

function IconBtn({ children }: { children: React.ReactNode }) {
  return (
    <button className="flex h-7 w-7 items-center justify-center rounded-full text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)]">
      {children}
    </button>
  );
}

// ============================================
// Right — customer panel (mirrors ContactInfo)
// ============================================

function CustomerPanel() {
  return (
    <aside className="hidden flex-col overflow-hidden border-l border-[var(--ink-200)] bg-[var(--paper-white)] lg:flex lg:h-[520px]">
      <div className="flex flex-col items-center gap-1.5 border-b border-[var(--ink-100)] px-3 py-4">
        <Avatar initials="AD" color="violet" size="xl" />
        <p className="text-[12px] font-semibold text-[var(--ink-900)]">
          Aïssatou Diop
        </p>
        <p className="font-mono text-[10px] text-[var(--ink-soft)]">
          +221 77 834 12 48
        </p>
      </div>

      <div className="border-b border-[var(--ink-100)] px-3 py-3">
        <p className="mb-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Détails
        </p>
        <InfoRow icon={Mail} label="Email" value="aissatou@gmail.com" />
        <InfoRow icon={Building2} label="Société" value="Aïssa Mode" />
      </div>

      <div className="border-b border-[var(--ink-100)] px-3 py-3">
        <div className="mb-1.5 flex items-center gap-1">
          <TagIcon className="h-2.5 w-2.5 text-[var(--ink-400)]" />
          <p className="font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
            Tags
          </p>
        </div>
        <div className="flex flex-wrap gap-1">
          <Chip tone="accent">VIP</Chip>
          <Chip tone="good">Fidèle</Chip>
          <Chip tone="warn">B2C</Chip>
        </div>
      </div>

      <div className="flex-1 px-3 py-3">
        <p className="mb-1.5 font-mono text-[9px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]">
          Activité
        </p>
        <div className="space-y-1.5">
          <StatRow label="Commandes" value="12" />
          <StatRow label="Valeur à vie" value="284 000 F" />
          <StatRow label="Dernière cmd." value="il y a 2 j" />
        </div>
      </div>

      <div className="border-t border-[var(--ink-100)] bg-[var(--paper-warm)] px-3 py-2.5">
        <button className="flex w-full items-center justify-between rounded-md px-2 py-1 text-[10px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-white)]">
          Voir l&apos;historique
          <ChevronRight className="h-3 w-3" />
        </button>
      </div>
    </aside>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
}) {
  return (
    <div className="flex items-start gap-2 py-1">
      <div className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md border border-[var(--ink-100)] bg-[var(--paper-warm)]">
        <Icon className="h-3 w-3 text-[var(--ink-500)]" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="font-mono text-[8px] uppercase tracking-wide text-[var(--ink-400)]">
          {label}
        </p>
        <p className="truncate text-[10px] font-medium text-[var(--ink-900)]">
          {value}
        </p>
      </div>
    </div>
  );
}

function StatRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-[10px] text-[var(--ink-soft)]">{label}</span>
      <span className="font-mono text-[10px] font-semibold text-[var(--ink-900)]">
        {value}
      </span>
    </div>
  );
}

// ============================================
// Floating toasts — real notifications, on-brand
// ============================================

function FloatingAssignToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="assign"
          initial={{ opacity: 0, y: 12, scale: 0.94 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="absolute -left-4 top-28 hidden items-center gap-2 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-2 shadow-[0_16px_40px_-12px_rgba(20,20,26,0.25)] md:flex"
        >
          <div className="flex h-6 w-6 items-center justify-center rounded-full bg-[var(--accent)] font-mono text-[9px] font-bold text-white">
            S
          </div>
          <div>
            <p className="font-mono text-[8px] font-medium uppercase tracking-[0.1em] text-[var(--ink-soft)]">
              Assignée à
            </p>
            <p className="text-[11px] font-semibold text-[var(--ink-900)]">
              Santiago · Support
            </p>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function FloatingSentToast({ show }: { show: boolean }) {
  return (
    <AnimatePresence>
      {show && (
        <motion.div
          key="sent-toast"
          initial={{ opacity: 0, y: 20, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.4 }}
          className="absolute -right-4 bottom-20 hidden items-center gap-2 rounded-full border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 py-1.5 shadow-[0_16px_40px_-12px_rgba(20,20,26,0.25)] md:flex"
        >
          <div className="flex h-5 w-5 items-center justify-center rounded-full bg-[var(--status-good)]">
            <Check className="h-2.5 w-2.5 text-white" strokeWidth={3} />
          </div>
          <span className="text-[10px] font-semibold text-[var(--ink-900)]">
            Répondu en 8s
          </span>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
