'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';
import { ArrowLeft, Check, Loader2 } from 'lucide-react';

import { cn } from '@/lib/utils';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import { Icon, type IconName } from '@/components/dashboard/primitives/Icon';
import { NODE_KIND, type NodeKind } from './nodes/_nodeShell';

interface FlowAIAssistantProps {
    flowId: string;
}

const EYEBROW = 'font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]';

/** The welcome + routing flow the assistant assembles — real, editable nodes. */
function buildFlow() {
    const nodes = [
        { id: 'start-1', type: 'start', position: { x: 250, y: 0 }, data: { label: 'Déclencheur', triggerType: 'NEW_CONVERSATION' } },
        { id: 'msg-1', type: 'message', position: { x: 250, y: 150 }, data: { label: 'Message', content: 'Bonjour {{prenom}} 👋 Merci de nous écrire ! Comment pouvons-nous vous aider aujourd’hui ?' } },
        {
            id: 'menu-1',
            type: 'interactive',
            position: { x: 250, y: 300 },
            data: {
                label: 'Menu de tri',
                interactiveType: 'list',
                content: 'Que souhaitez-vous faire ?',
                options: [
                    { id: 'ventes', title: 'Ventes & devis', label: 'Ventes & devis' },
                    { id: 'support', title: 'Support technique', label: 'Support technique' },
                    { id: 'suivi', title: 'Suivi de commande', label: 'Suivi de commande' },
                ],
            },
        },
        { id: 'act-1', type: 'action', position: { x: 600, y: 230 }, data: { label: 'Assigner', actionType: 'assign', details: 'Pôle Ventes (round-robin)' } },
        { id: 'act-2', type: 'action', position: { x: 600, y: 360 }, data: { label: 'Assigner', actionType: 'assign', details: 'Pôle Support (round-robin)' } },
        { id: 'act-3', type: 'action', position: { x: 600, y: 490 }, data: { label: 'Tag', actionType: 'tag', details: 'suivi' } },
    ];
    const edges = [
        { id: 'e1', source: 'start-1', target: 'msg-1', animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } },
        { id: 'e2', source: 'msg-1', target: 'menu-1', animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } },
        { id: 'e3', source: 'menu-1', target: 'act-1', animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } },
        { id: 'e4', source: 'menu-1', target: 'act-2', animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } },
        { id: 'e5', source: 'menu-1', target: 'act-3', animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } },
    ];
    return { nodes, edges };
}

/**
 * FlowAIAssistant — conversational automation builder recreated from the design
 * handoff (`flow-ai.jsx`): chat thread (left) + live read-only preview (right).
 * The conversation is scripted but assembles a *real* welcome + routing flow,
 * persisted via `flows.update`; "Publier" sets it live, "Ouvrir dans l'éditeur"
 * hands off to the diagram editor.
 */
export function FlowAIAssistant({ flowId }: FlowAIAssistantProps) {
    const router = useRouter();
    const flow = useQuery(api.flows.get, { flowId: flowId as Id<'flows'> });
    const updateFlow = useMutation(api.flows.update);

    const [step, setStep] = useState(0); // 0 greeting · 1 trigger · 2 message-kept · 3 built
    const [busy, setBusy] = useState<null | 'publish' | 'editor'>(null);
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const built = step >= 3;

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [step]);

    const persist = async (publish: boolean) => {
        setBusy(publish ? 'publish' : 'editor');
        try {
            const { nodes, edges } = buildFlow();
            await updateFlow({
                flowId: flowId as Id<'flows'>,
                triggerType: 'NEW_CONVERSATION',
                nodes: JSON.stringify(nodes),
                edges: JSON.stringify(edges),
                ...(publish ? { isActive: true } : {}),
            });
            if (publish) {
                toast.success('Automatisation publiée !');
                router.push('/dashboard/automatisations');
            } else {
                router.push(`/dashboard/automatisations/${flowId}`);
            }
        } catch {
            toast.error('Erreur lors de l’enregistrement');
            setBusy(null);
        }
    };

    const quickReplies = built
        ? ['Ajouter une condition', 'Changer le ton du message', 'Ajouter une relance']
        : step === 0
          ? ['Quand un nouveau client écrit', 'Sur un mot-clé']
          : step === 1
            ? ['Oui, garde ce message', 'Reformuler']
            : ['Oui, ajoute le menu', 'Non merci'];

    const advance = () => setStep((s) => Math.min(s + 1, 3));

    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-warm)]">
            {/* Top bar */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--ink-200)] bg-[var(--paper-white)] pl-3.5 pr-4">
                <button
                    type="button"
                    onClick={() => router.push('/dashboard/automatisations')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    aria-label="Retour"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="flex h-[26px] w-[26px] shrink-0 items-center justify-center rounded-lg bg-[var(--accent)]">
                    <Icon name="sparkle" size={14} color="#fff" strokeWidth={1.9} />
                </span>
                <span className="truncate font-editorial text-[18px] italic tracking-[-0.01em] text-[var(--ink-900)]">
                    Assistant IA
                </span>
                <span className="inline-flex items-center gap-1.5 rounded-md bg-[var(--status-warn-soft)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--status-warn)]">
                    <span className="h-1.5 w-1.5 rounded-full bg-[var(--status-warn)]" />
                    Brouillon
                </span>
                <div className="ml-auto flex items-center gap-1.5">
                    <button
                        type="button"
                        onClick={() => persist(false)}
                        disabled={!built || busy !== null}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-50"
                    >
                        {busy === 'editor' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Icon name="hub" size={14} strokeWidth={1.8} />}
                        Ouvrir dans l&apos;éditeur
                    </button>
                    <button
                        type="button"
                        onClick={() => persist(true)}
                        disabled={!built || busy !== null}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                    >
                        {busy === 'publish' ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        Publier
                    </button>
                </div>
            </div>

            <div className="flex min-h-0 flex-1">
                {/* Chat column */}
                <div className="flex min-w-0 flex-1 flex-col bg-[var(--paper-white)]">
                    <div ref={scrollRef} className="flex-1 overflow-y-auto py-7">
                        <div className="mx-auto flex max-w-[600px] flex-col gap-[18px] px-7">
                            <AIMsg>Bonjour 👋 Décrivez ce que doit faire votre automatisation — je construis le flux pour vous, nœud par nœud.</AIMsg>
                            <AIMsg>Pour commencer : qu&apos;est-ce qui doit déclencher ce flux ?</AIMsg>

                            {step >= 1 ? (
                                <>
                                    <UserMsg>Quand un nouveau client nous écrit pour la première fois.</UserMsg>
                                    <AIMsg tags={[{ icon: 'bolt', label: 'Déclencheur · Premier message', tone: 'warn' }]}>
                                        Parfait. J&apos;ajoute un déclencheur « Premier message ». Voici un message d&apos;accueil — gardez-le ou reformulez :
                                        <AICard>Bonjour {'{{prenom}}'} 👋 Merci de nous écrire ! Comment pouvons-nous vous aider aujourd&apos;hui ?</AICard>
                                    </AIMsg>
                                </>
                            ) : null}

                            {step >= 2 ? (
                                <>
                                    <UserMsg>Oui, garde ce message.</UserMsg>
                                    <AIMsg tags={[{ icon: 'send', label: 'Message · Accueil', tone: 'accent' }]}>
                                        Souhaitez-vous trier les demandes vers le bon pôle avec un menu de choix ?
                                    </AIMsg>
                                </>
                            ) : null}

                            {built ? (
                                <>
                                    <UserMsg>Oui — Ventes, Support, et Suivi de commande.</UserMsg>
                                    <AIMsg
                                        tags={[
                                            { icon: 'list', label: 'Menu · 3 options', tone: 'ink' },
                                            { icon: 'user', label: '3 actions d’assignation', tone: 'good' },
                                        ]}
                                    >
                                        C&apos;est construit 🎉 Le menu route chaque choix vers le pôle correspondant en round-robin. Aperçu complet à droite.
                                        <div className="mt-3 flex gap-2">
                                            <button
                                                type="button"
                                                onClick={() => persist(false)}
                                                disabled={busy !== null}
                                                className="inline-flex items-center gap-1.5 rounded-md border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-50"
                                            >
                                                <Icon name="hub" size={14} strokeWidth={1.8} />
                                                Affiner dans l&apos;éditeur
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => persist(true)}
                                                disabled={busy !== null}
                                                className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-50"
                                            >
                                                <Check className="h-3.5 w-3.5" />
                                                Publier le flux
                                            </button>
                                        </div>
                                    </AIMsg>
                                </>
                            ) : null}
                        </div>
                    </div>

                    {/* Composer */}
                    <div className="shrink-0 border-t border-[var(--ink-200)] pb-4 pt-3.5">
                        <div className="mx-auto max-w-[600px] px-7">
                            <div className="mb-2.5 flex flex-wrap gap-[7px]">
                                {quickReplies.map((q) => (
                                    <button
                                        key={q}
                                        type="button"
                                        onClick={advance}
                                        className="h-[30px] rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[12.5px] font-medium tracking-[-0.005em] text-[var(--ink-700)] transition-colors hover:border-[var(--accent)]"
                                    >
                                        {q}
                                    </button>
                                ))}
                            </div>
                            <div className="flex h-[46px] items-center gap-2.5 rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] pl-3.5 pr-1.5">
                                <Icon name="sparkle" size={16} color="var(--ink-soft)" />
                                <input
                                    value={draft}
                                    onChange={(e) => setDraft(e.target.value)}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter' && draft.trim()) {
                                            setDraft('');
                                            advance();
                                        }
                                    }}
                                    placeholder="Décrivez une modification…"
                                    className="flex-1 border-none bg-transparent text-[14px] tracking-[-0.005em] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-soft)]"
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        setDraft('');
                                        advance();
                                    }}
                                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--accent)] transition-opacity hover:opacity-90"
                                    aria-label="Envoyer"
                                >
                                    <Icon name="send" size={16} color="#fff" strokeWidth={2} />
                                </button>
                            </div>
                        </div>
                    </div>
                </div>

                {/* Preview column */}
                <div className="flex w-[452px] shrink-0 flex-col border-l border-[var(--ink-200)] bg-[var(--paper-warm)]">
                    <div className="flex shrink-0 items-center gap-2.5 border-b border-[var(--ink-200)] bg-[var(--paper-white)] px-5 pb-3 pt-[15px]">
                        <div className="min-w-0 flex-1">
                            <div className={EYEBROW}>Aperçu du flux</div>
                            <div className="mt-[3px] truncate text-[14px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                                {flow?.name ?? 'Nouvelle automatisation'}
                            </div>
                        </div>
                        <span className="inline-flex items-center gap-1 rounded-md border border-[var(--ink-200)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                            <Icon name="eye" size={11} />
                            Lecture seule
                        </span>
                    </div>

                    <div
                        className="relative flex-1 overflow-hidden"
                        style={{
                            background: 'radial-gradient(circle, rgba(10,10,10,0.05) 1px, transparent 1.2px), var(--paper-warm)',
                            backgroundSize: '16px 16px',
                        }}
                    >
                        <PreviewFlow built={built} />
                    </div>

                    <div className="flex shrink-0 gap-[18px] border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-[13px]">
                        {[
                            { k: 'Nœuds', v: built ? '6' : '2' },
                            { k: 'Déclencheur', v: '1er msg' },
                            { k: 'Branches', v: built ? '3' : '0' },
                        ].map((s, i) => (
                            <div key={s.k} className="flex items-center gap-[18px]">
                                {i > 0 ? <div className="h-7 w-px bg-[var(--ink-200)]" /> : null}
                                <div>
                                    <div className={cn(EYEBROW, 'text-[9.5px]')}>{s.k}</div>
                                    <div className="mt-[3px] font-mono text-[14px] font-semibold text-[var(--ink-900)]">{s.v}</div>
                                </div>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </div>
    );
}

// ── Chat bubbles ────────────────────────────────────────────────────────────
type Tag = { icon: IconName; label: string; tone: 'warn' | 'accent' | 'good' | 'ink' };

function AIMsg({ children, tags }: { children: React.ReactNode; tags?: Tag[] }) {
    const toneColor = (t: Tag['tone']) =>
        t === 'warn' ? 'var(--status-warn)' : t === 'accent' ? 'var(--accent)' : t === 'good' ? 'var(--status-good)' : 'var(--ink-700)';
    return (
        <div className="flex items-start gap-[11px]">
            <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--accent)]">
                <Icon name="sparkle" size={15} color="#fff" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="rounded-[4px_14px_14px_14px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-[11px] text-[13.5px] leading-[1.5] tracking-[-0.005em] text-[var(--ink-900)] shadow-[0_1px_2px_rgba(10,10,10,0.03)]">
                    {children}
                </div>
                {tags ? (
                    <div className="mt-2 flex flex-wrap gap-1.5">
                        {tags.map((t, i) => (
                            <span
                                key={i}
                                className="inline-flex h-6 items-center gap-1.5 rounded-[7px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5 font-mono text-[10.5px] font-medium tracking-[0.02em] text-[var(--ink-500)]"
                            >
                                <Icon name={t.icon} size={11} color={toneColor(t.tone)} strokeWidth={1.9} />
                                {t.label}
                            </span>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function UserMsg({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex justify-end pl-[60px]">
            <div className="rounded-[14px_14px_4px_14px] bg-[var(--ink-900)] px-3.5 py-2.5 text-[13.5px] leading-[1.5] tracking-[-0.005em] text-white">
                {children}
            </div>
        </div>
    );
}

function AICard({ children }: { children: React.ReactNode }) {
    return (
        <div className="mt-2.5 rounded-[10px] border border-l-[2.5px] border-[var(--ink-200)] border-l-[var(--accent)] bg-[var(--paper-warm)] px-[13px] py-[11px] text-[13px] leading-[1.5] tracking-[-0.005em] text-[var(--ink-700)]">
            {children}
        </div>
    );
}

// ── Read-only mini preview ──────────────────────────────────────────────────
function PreviewNode({
    x,
    y,
    kind,
    icon,
    title,
    sub,
    options,
    width = 188,
}: {
    x: number;
    y: number;
    kind: NodeKind;
    icon: IconName;
    title: string;
    sub?: string;
    options?: string[];
    width?: number;
}) {
    const c = NODE_KIND[kind];
    const KIND_LABEL: Record<NodeKind, string> = { trigger: 'Déclencheur', message: 'Message', condition: 'Interactif', action: 'Action' };
    return (
        <div
            className="absolute overflow-hidden rounded-xl border bg-[var(--paper-white)] shadow-[0_3px_12px_rgba(10,10,10,0.07)]"
            style={{ left: x, top: y, width, borderColor: c.border }}
        >
            <div className="flex items-center gap-[7px] border-b px-[11px] py-[7px]" style={{ background: c.tint, borderColor: c.border }}>
                <Icon name={icon} size={12} color={c.ico} strokeWidth={1.9} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: c.head }}>
                    {KIND_LABEL[kind]}
                </span>
            </div>
            <div className="px-3 pb-[10px] pt-[8px]">
                <div className="text-[12px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">{title}</div>
                {sub ? <div className="mt-0.5 line-clamp-2 text-[11px] leading-[1.4] text-[var(--ink-500)]">{sub}</div> : null}
                {options ? (
                    <div className="mt-2 flex flex-col gap-[5px]">
                        {options.map((o, i) => (
                            <div
                                key={i}
                                className="flex h-[24px] items-center gap-[7px] rounded-[7px] border border-[var(--ink-100)] bg-[var(--paper-warm)] px-[9px] text-[11px] font-medium text-[var(--ink-700)]"
                            >
                                <span className="font-mono text-[9.5px] text-[var(--ink-soft)]">{i + 1}</span>
                                <span className="min-w-0 flex-1 truncate">{o}</span>
                            </div>
                        ))}
                    </div>
                ) : null}
            </div>
        </div>
    );
}

function PreviewFlow({ built }: { built: boolean }) {
    return (
        <div className="absolute left-0 top-0 origin-top-left" style={{ width: 470, height: 540, transform: 'scale(0.82)', padding: '6px 0 0 6px' }}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full">
                <defs>
                    <marker id="ai-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                </defs>
                <path d="M118,92 C118,116 118,116 118,140" stroke="var(--ink-300)" strokeWidth="1.6" fill="none" markerEnd="url(#ai-arr)" />
                {built ? (
                    <>
                        <path d="M118,236 C118,256 118,256 118,284" stroke="var(--ink-300)" strokeWidth="1.6" fill="none" markerEnd="url(#ai-arr)" />
                        <path d="M236,360 C300,360 300,300 250,300" stroke="var(--ink-300)" strokeWidth="1.6" fill="none" markerEnd="url(#ai-arr)" />
                        <path d="M236,372 C300,372 304,374 250,374" stroke="var(--ink-300)" strokeWidth="1.6" fill="none" markerEnd="url(#ai-arr)" />
                        <path d="M236,384 C300,384 304,448 250,448" stroke="var(--ink-300)" strokeWidth="1.6" fill="none" markerEnd="url(#ai-arr)" />
                    </>
                ) : null}
            </svg>

            <PreviewNode x={24} y={20} kind="trigger" icon="bolt" title="Premier message" sub="Nouveau contact" />
            <PreviewNode x={24} y={140} kind="message" icon="send" title="Message d'accueil" sub="« Bonjour {{prenom}} 👋 … »" />
            {built ? (
                <>
                    <PreviewNode x={24} y={284} kind="condition" icon="list" title="Menu de tri" options={['Ventes', 'Support', 'Suivi']} />
                    <PreviewNode x={250} y={274} kind="action" icon="user" title="→ Ventes" width={180} />
                    <PreviewNode x={250} y={350} kind="action" icon="user" title="→ Support" width={180} />
                    <PreviewNode x={250} y={426} kind="action" icon="doc" title="→ Suivi + tag" width={180} />
                </>
            ) : null}
        </div>
    );
}
