'use client';

import { useEffect, useRef, useState } from 'react';
import { useQuery, useMutation, useAction } from 'convex/react';
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

// ── Generated-flow shapes (what api.ai.generateFlow returns) ─────────────────
type GenOption = { id?: string; title?: string; label?: string; description?: string };
type GenNode = {
    id: string;
    type: string;
    position?: { x: number; y: number };
    data?: {
        label?: string;
        content?: string;
        triggerType?: string;
        keywords?: string;
        interactiveType?: string;
        options?: GenOption[];
        actionType?: string;
        details?: string;
    };
};
type GenEdge = { id: string; source: string; target: string };
type GeneratedFlow = { nodes: GenNode[]; edges: GenEdge[] };

type ChatTurn =
    | { role: 'user'; text: string }
    | { role: 'assistant'; text: string; tags?: Tag[] }
    | { role: 'error'; text: string };

const NODE_META: Record<string, { kind: NodeKind; icon: IconName }> = {
    start: { kind: 'trigger', icon: 'bolt' },
    message: { kind: 'message', icon: 'send' },
    interactive: { kind: 'condition', icon: 'list' },
    action: { kind: 'action', icon: 'user' },
};

/** Type guard: a usable {nodes, edges} payload (not the {error} branch). */
function isGeneratedFlow(r: unknown): r is GeneratedFlow {
    return (
        !!r &&
        typeof r === 'object' &&
        Array.isArray((r as GeneratedFlow).nodes) &&
        Array.isArray((r as GeneratedFlow).edges)
    );
}

/** Short, human summary of what the model assembled, shown as a chat reply + tags. */
function summarize(flow: GeneratedFlow): { text: string; tags: Tag[] } {
    const counts = flow.nodes.reduce<Record<string, number>>((acc, n) => {
        acc[n.type] = (acc[n.type] || 0) + 1;
        return acc;
    }, {});
    const tags: Tag[] = [];
    const start = flow.nodes.find((n) => n.type === 'start');
    if (start) {
        const tt = (start.data?.triggerType || '').toLowerCase();
        const label =
            tt === 'keyword'
                ? `Déclencheur · Mot-clé${start.data?.keywords ? ` (${start.data.keywords})` : ''}`
                : tt === 'no_reply'
                  ? 'Déclencheur · Sans réponse'
                  : 'Déclencheur · Premier message';
        tags.push({ icon: 'bolt', label, tone: 'warn' });
    }
    if (counts.message) tags.push({ icon: 'send', label: `${counts.message} message${counts.message > 1 ? 's' : ''}`, tone: 'accent' });
    if (counts.interactive) tags.push({ icon: 'list', label: `${counts.interactive} menu${counts.interactive > 1 ? 's' : ''}`, tone: 'ink' });
    if (counts.action) tags.push({ icon: 'user', label: `${counts.action} action${counts.action > 1 ? 's' : ''}`, tone: 'good' });

    return {
        text: `C'est construit 🎉 ${flow.nodes.length} nœud${flow.nodes.length > 1 ? 's' : ''} au total — aperçu à droite. Décrivez une modification, ou publiez.`,
        tags,
    };
}

/**
 * FlowAIAssistant — conversational automation builder (design handoff
 * `flow-ai.jsx`): chat thread (left) + live read-only preview (right).
 * The user describes the automation in natural language; each prompt is sent to
 * `api.ai.generateFlow`, and the returned {nodes, edges} are persisted via
 * `flows.update` and rendered live. "Publier" sets it active, "Ouvrir dans
 * l'éditeur" hands off to the diagram editor.
 */
export function FlowAIAssistant({ flowId }: FlowAIAssistantProps) {
    const router = useRouter();
    const flow = useQuery(api.flows.get, { flowId: flowId as Id<'flows'> });
    const updateFlow = useMutation(api.flows.update);
    const generateFlow = useAction(api.ai.generateFlow);

    const [turns, setTurns] = useState<ChatTurn[]>([]);
    const [generated, setGenerated] = useState<GeneratedFlow | null>(null);
    const [generating, setGenerating] = useState(false);
    const [busy, setBusy] = useState<null | 'publish' | 'editor'>(null);
    const [draft, setDraft] = useState('');
    const scrollRef = useRef<HTMLDivElement>(null);
    const built = generated !== null;

    // Hydrate the preview from an already-saved flow so reopening the assistant
    // shows the current state instead of an empty canvas.
    useEffect(() => {
        if (flow && generated === null && turns.length === 0) {
            try {
                const nodes = flow.nodes ? JSON.parse(flow.nodes) : [];
                const edges = flow.edges ? JSON.parse(flow.edges) : [];
                if (Array.isArray(nodes) && nodes.length > 0) {
                    setGenerated({ nodes, edges: Array.isArray(edges) ? edges : [] });
                }
            } catch {
                /* ignore malformed persisted flow */
            }
        }
    }, [flow, generated, turns.length]);

    useEffect(() => {
        if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }, [turns, generating]);

    const send = async (text: string) => {
        const prompt = text.trim();
        if (!prompt || generating) return;

        setDraft('');
        setTurns((t) => [...t, { role: 'user', text: prompt }]);
        setGenerating(true);
        try {
            const result = await generateFlow({
                prompt,
                ...(generated
                    ? {
                          currentNodes: JSON.stringify(generated.nodes),
                          currentEdges: JSON.stringify(generated.edges),
                      }
                    : {}),
            });

            if (!isGeneratedFlow(result)) {
                const message =
                    (result && typeof result === 'object' && 'error' in result && typeof result.error === 'string'
                        ? result.error
                        : null) || "L'assistant n'a pas pu générer le flux. Réessayez en reformulant.";
                setTurns((t) => [...t, { role: 'error', text: message }]);
                toast.error('Échec de la génération');
                return;
            }

            // Persist immediately (draft). flows.update reconciles triggerType /
            // triggerConfig.keywords from the generated start node for the engine.
            await updateFlow({
                flowId: flowId as Id<'flows'>,
                nodes: JSON.stringify(result.nodes),
                edges: JSON.stringify(result.edges),
            });

            setGenerated(result);
            const { text: reply, tags } = summarize(result);
            setTurns((t) => [...t, { role: 'assistant', text: reply, tags }]);
        } catch (e) {
            console.error('generateFlow failed', e);
            const message =
                e instanceof Error && e.message ? e.message : 'Une erreur est survenue pendant la génération.';
            setTurns((t) => [...t, { role: 'error', text: message }]);
            toast.error('Erreur lors de la génération');
        } finally {
            setGenerating(false);
        }
    };

    const persist = async (publish: boolean) => {
        if (!generated) return;
        setBusy(publish ? 'publish' : 'editor');
        try {
            await updateFlow({
                flowId: flowId as Id<'flows'>,
                nodes: JSON.stringify(generated.nodes),
                edges: JSON.stringify(generated.edges),
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
        ? ['Ajoute une relance après 24h', 'Change le ton du message d’accueil', 'Ajoute un menu de tri']
        : [
              'Accueille les nouveaux clients et trie vers le bon pôle',
              'Réponds au mot-clé « devis » avec un menu',
          ];

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
                            <AIMsg>Bonjour 👋 Décrivez ce que doit faire votre automatisation — je construis le flux complet pour vous (déclencheur, messages, menus, actions).</AIMsg>
                            <AIMsg>Par exemple : « Accueille les nouveaux clients, propose un menu Ventes / Support / Suivi, et assigne au bon pôle. »</AIMsg>

                            {turns.map((turn, i) =>
                                turn.role === 'user' ? (
                                    <UserMsg key={i}>{turn.text}</UserMsg>
                                ) : turn.role === 'error' ? (
                                    <ErrorMsg key={i}>{turn.text}</ErrorMsg>
                                ) : (
                                    <AIMsg key={i} tags={turn.tags}>
                                        {turn.text}
                                        {built ? (
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
                                        ) : null}
                                    </AIMsg>
                                ),
                            )}

                            {generating ? (
                                <div className="flex items-center gap-[11px]">
                                    <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--accent)]">
                                        <Icon name="sparkle" size={15} color="#fff" strokeWidth={1.9} />
                                    </span>
                                    <div className="inline-flex items-center gap-2 rounded-[4px_14px_14px_14px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3.5 py-[11px] text-[13.5px] text-[var(--ink-500)]">
                                        <Loader2 className="h-3.5 w-3.5 animate-spin text-[var(--accent)]" />
                                        Je construis le flux…
                                    </div>
                                </div>
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
                                        disabled={generating}
                                        onClick={() => send(q)}
                                        className="h-[30px] rounded-full border border-[var(--ink-200)] bg-[var(--paper-warm)] px-3 text-[12.5px] font-medium tracking-[-0.005em] text-[var(--ink-700)] transition-colors hover:border-[var(--accent)] disabled:opacity-50"
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
                                    disabled={generating}
                                    onKeyDown={(e) => {
                                        if (e.key === 'Enter') {
                                            e.preventDefault();
                                            send(draft);
                                        }
                                    }}
                                    placeholder={built ? 'Décrivez une modification…' : 'Décrivez votre automatisation…'}
                                    className="flex-1 border-none bg-transparent text-[14px] tracking-[-0.005em] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-soft)] disabled:opacity-60"
                                />
                                <button
                                    type="button"
                                    disabled={generating || !draft.trim()}
                                    onClick={() => send(draft)}
                                    className="flex h-[34px] w-[34px] items-center justify-center rounded-[9px] bg-[var(--accent)] transition-opacity hover:opacity-90 disabled:opacity-50"
                                    aria-label="Envoyer"
                                >
                                    {generating ? (
                                        <Loader2 className="h-4 w-4 animate-spin text-white" />
                                    ) : (
                                        <Icon name="send" size={16} color="#fff" strokeWidth={2} />
                                    )}
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
                        className="relative flex-1 overflow-auto"
                        style={{
                            background: 'radial-gradient(circle, rgba(10,10,10,0.05) 1px, transparent 1.2px), var(--paper-warm)',
                            backgroundSize: '16px 16px',
                        }}
                    >
                        <PreviewFlow flow={generated} />
                    </div>

                    <div className="flex shrink-0 gap-[18px] border-t border-[var(--ink-200)] bg-[var(--paper-white)] px-5 py-[13px]">
                        {[
                            { k: 'Nœuds', v: generated ? String(generated.nodes.length) : '—' },
                            { k: 'Déclencheur', v: generated ? triggerShort(generated) : '—' },
                            { k: 'Branches', v: generated ? String(branchCount(generated)) : '—' },
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

// ── Preview helpers ──────────────────────────────────────────────────────────
function triggerShort(flow: GeneratedFlow): string {
    const start = flow.nodes.find((n) => n.type === 'start');
    const tt = (start?.data?.triggerType || '').toLowerCase();
    if (tt === 'keyword') return 'mot-clé';
    if (tt === 'no_reply') return 'timeout';
    return '1er msg';
}

function branchCount(flow: GeneratedFlow): number {
    // Branches = nodes with more than one outgoing edge → fan-out count.
    const out = new Map<string, number>();
    for (const e of flow.edges) out.set(e.source, (out.get(e.source) || 0) + 1);
    let branches = 0;
    for (const count of out.values()) if (count > 1) branches += count;
    return branches;
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
                {tags && tags.length > 0 ? (
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

function ErrorMsg({ children }: { children: React.ReactNode }) {
    return (
        <div className="flex items-start gap-[11px]">
            <span className="mt-px flex h-7 w-7 shrink-0 items-center justify-center rounded-[9px] bg-[var(--status-danger-soft)]">
                <Icon name="flag" size={15} color="var(--status-danger)" strokeWidth={1.9} />
            </span>
            <div className="min-w-0 flex-1">
                <div className="rounded-[4px_14px_14px_14px] border border-[var(--status-danger)]/30 bg-[var(--status-danger-soft)] px-3.5 py-[11px] text-[13.5px] leading-[1.5] tracking-[-0.005em] text-[var(--status-danger)]">
                    {children}
                </div>
            </div>
        </div>
    );
}

// ── Read-only flow preview (renders the actual generated nodes) ──────────────
function PreviewNode({ node }: { node: GenNode }) {
    const meta = NODE_META[node.type] ?? { kind: 'message' as NodeKind, icon: 'cog' as IconName };
    const c = NODE_KIND[meta.kind];
    const KIND_LABEL: Record<NodeKind, string> = { trigger: 'Déclencheur', message: 'Message', condition: 'Interactif', action: 'Action' };

    const title =
        node.data?.label ||
        (node.type === 'start'
            ? 'Déclencheur'
            : node.type === 'action'
              ? node.data?.actionType || 'Action'
              : node.type === 'interactive'
                ? 'Menu'
                : 'Message');
    const sub =
        node.type === 'message'
            ? node.data?.content
            : node.type === 'action'
              ? node.data?.details
              : node.type === 'start'
                ? node.data?.keywords
                    ? `Mots-clés : ${node.data.keywords}`
                    : undefined
                : node.data?.content;
    const options =
        node.type === 'interactive'
            ? (node.data?.options || []).map((o) => o.label || o.title || 'Option')
            : undefined;

    const x = node.position?.x ?? 0;
    const y = node.position?.y ?? 0;

    return (
        <div
            className="absolute overflow-hidden rounded-xl border bg-[var(--paper-white)] shadow-[0_3px_12px_rgba(10,10,10,0.07)]"
            style={{ left: x, top: y, width: 188, borderColor: c.border }}
        >
            <div className="flex items-center gap-[7px] border-b px-[11px] py-[7px]" style={{ background: c.tint, borderColor: c.border }}>
                <Icon name={meta.icon} size={12} color={c.ico} strokeWidth={1.9} />
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.07em]" style={{ color: c.head }}>
                    {KIND_LABEL[meta.kind]}
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

function PreviewFlow({ flow }: { flow: GeneratedFlow | null }) {
    if (!flow || flow.nodes.length === 0) {
        return (
            <div className="flex h-full flex-col items-center justify-center gap-2.5 px-8 text-center">
                <span className="flex h-11 w-11 items-center justify-center rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)]">
                    <Icon name="sparkle" size={18} color="var(--ink-soft)" />
                </span>
                <p className="max-w-[260px] text-[12.5px] leading-[1.5] text-[var(--ink-500)]">
                    Décrivez votre automatisation dans le chat — l&apos;aperçu du flux apparaîtra ici.
                </p>
            </div>
        );
    }

    // Layout bounds → fit the generated nodes in the preview viewport.
    const NODE_W = 188;
    const NODE_H = 110;
    const PAD = 24;
    const xs = flow.nodes.map((n) => n.position?.x ?? 0);
    const ys = flow.nodes.map((n) => n.position?.y ?? 0);
    const width = Math.max(...xs) + NODE_W + PAD;
    const height = Math.max(...ys) + NODE_H + PAD;

    return (
        <div className="relative origin-top-left p-1.5" style={{ width, height }}>
            <svg className="pointer-events-none absolute inset-0 h-full w-full" style={{ width, height }}>
                <defs>
                    <marker id="ai-arr" viewBox="0 0 10 10" refX="8" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
                        <path d="M0,1 L9,5 L0,9" fill="none" stroke="var(--ink-soft)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                    </marker>
                </defs>
                {flow.edges.map((e) => {
                    const s = flow.nodes.find((n) => n.id === e.source);
                    const t = flow.nodes.find((n) => n.id === e.target);
                    if (!s || !t) return null;
                    const sx = (s.position?.x ?? 0) + NODE_W / 2 + 6;
                    const sy = (s.position?.y ?? 0) + NODE_H - 18 + 6;
                    const tx = (t.position?.x ?? 0) + NODE_W / 2 + 6;
                    const ty = (t.position?.y ?? 0) + 6;
                    return (
                        <path
                            key={e.id}
                            d={`M${sx},${sy} C${sx},${(sy + ty) / 2} ${tx},${(sy + ty) / 2} ${tx},${ty}`}
                            stroke="var(--ink-300)"
                            strokeWidth="1.6"
                            fill="none"
                            markerEnd="url(#ai-arr)"
                        />
                    );
                })}
            </svg>
            {flow.nodes.map((n) => (
                <PreviewNode key={n.id} node={n} />
            ))}
        </div>
    );
}
