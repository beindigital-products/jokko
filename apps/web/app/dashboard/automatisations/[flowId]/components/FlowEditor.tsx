'use client';

import { useState, useCallback, useEffect } from 'react';
import { useQuery, useMutation } from 'convex/react';
import { api } from '@/convex/_generated/api';
import { Id } from '@/convex/_generated/dataModel';
import {
    ReactFlow,
    addEdge,
    Background,
    useNodesState,
    useEdgesState,
    Connection,
    Edge,
    Node,
    ReactFlowProvider,
    useReactFlow,
    useViewport,
    BackgroundVariant,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import {
    ArrowLeft, Check, Loader2, Minus, Plus, Maximize2, Trash2,
} from 'lucide-react';
import { useRouter } from 'next/navigation';
import { toast } from 'sonner';

import { cn } from '@/lib/utils';
import { Icon, type IconName } from '@/components/dashboard/primitives/Icon';
import { CustomNodeMessage } from '../../components/nodes/CustomNodeMessage';
import { CustomNodeStart } from '../../components/nodes/CustomNodeStart';
import { CustomNodeInteractive } from '../../components/nodes/CustomNodeInteractive';
import { CustomNodeAction } from '../../components/nodes/CustomNodeAction';
import { NODE_KIND, type NodeKind } from '../../components/nodes/_nodeShell';

const nodeTypes = {
    message: CustomNodeMessage,
    start: CustomNodeStart,
    interactive: CustomNodeInteractive,
    action: CustomNodeAction,
};

const FIELD =
    'h-[38px] w-full rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-3 text-[13.5px] text-[var(--ink-900)] outline-none transition-colors placeholder:text-[var(--ink-soft)] focus:border-[var(--accent)]';
const EYEBROW = 'font-mono text-[10px] font-medium uppercase tracking-[0.12em] text-[var(--ink-soft)]';

interface FlowEditorProps {
    flowId: Id<"flows">;
}

type FlowOption = { id?: string; title?: string; label?: string };

type FlowNodeData = Record<string, unknown> & {
    label?: string;
    content?: string;
    triggerType?: string;
    keywords?: string;
    interactiveType?: string;
    options?: FlowOption[];
    actionType?: string;
    details?: string;
};

type FlowNode = Node<FlowNodeData>;
type FlowNodePatch = Partial<FlowNodeData>;

// Palette blocks (drag onto the canvas). `kind` is only for the swatch colour.
const PALETTE: { type: string; kind: NodeKind; label: string; icon: IconName }[] = [
    { type: 'start', kind: 'trigger', label: 'Déclencheur', icon: 'bolt' },
    { type: 'message', kind: 'message', label: 'Message', icon: 'send' },
    { type: 'interactive', kind: 'condition', label: 'Interactif', icon: 'list' },
    { type: 'action', kind: 'action', label: 'Action', icon: 'cog' },
];

function FlowEditorContent({ flowId }: FlowEditorProps) {
    const router = useRouter();
    const flow = useQuery(api.flows.get, { flowId });
    const updateFlow = useMutation(api.flows.update);
    const { screenToFlowPosition } = useReactFlow();

    const [nodes, setNodes, onNodesChange] = useNodesState<FlowNode>([]);
    const [edges, setEdges, onEdgesChange] = useEdgesState<Edge>([]);
    const [selectedNode, setSelectedNode] = useState<FlowNode | null>(null);
    const [isSaving, setIsSaving] = useState(false);
    const [isToggling, setIsToggling] = useState(false);

    useEffect(() => {
        if (flow) {
            try {
                setNodes(flow.nodes ? (JSON.parse(flow.nodes) as FlowNode[]) : []);
                setEdges(flow.edges ? JSON.parse(flow.edges) : []);
            } catch (e) {
                console.error('Failed to parse flow data', e);
            }
        }
    }, [flow, setNodes, setEdges]);

    const onConnect = useCallback(
        (params: Connection) =>
            setEdges((eds) =>
                addEdge({ ...params, animated: true, style: { stroke: 'var(--ink-300)', strokeWidth: 1.6 } }, eds),
            ),
        [setEdges],
    );

    const onDragOver = useCallback((event: React.DragEvent) => {
        event.preventDefault();
        event.dataTransfer.dropEffect = 'move';
    }, []);

    const onDrop = useCallback(
        (event: React.DragEvent) => {
            event.preventDefault();
            const type = event.dataTransfer.getData('application/reactflow');
            if (!type) return;
            const position = screenToFlowPosition({ x: event.clientX, y: event.clientY });
            const newNode: FlowNode = {
                id: `${type}-${Date.now()}`,
                type,
                position,
                data: { label: `${type} node`, content: '' },
            };
            setNodes((nds) => nds.concat(newNode));
            setSelectedNode(newNode);
        },
        [screenToFlowPosition, setNodes],
    );

    const onNodeClick = useCallback((_: React.MouseEvent, node: FlowNode) => setSelectedNode(node), []);
    const onPaneClick = useCallback(() => setSelectedNode(null), []);

    const handleSave = async () => {
        if (!flow) return;
        setIsSaving(true);
        try {
            await updateFlow({ flowId: flow._id, nodes: JSON.stringify(nodes), edges: JSON.stringify(edges) });
            toast.success('Automatisation sauvegardée');
        } catch (e) {
            console.error('Save failed', e);
            toast.error('Erreur lors de la sauvegarde');
        } finally {
            setIsSaving(false);
        }
    };

    const handleToggleStatus = async () => {
        if (!flow) return;
        setIsToggling(true);
        try {
            await updateFlow({ flowId: flow._id, isActive: !flow.isActive });
            toast.success(flow.isActive ? 'Automatisation dépubliée' : 'Automatisation publiée !');
        } catch {
            toast.error('Erreur lors de la mise à jour');
        } finally {
            setIsToggling(false);
        }
    };

    const updateNodeData = (id: string, data: FlowNodePatch) => {
        setNodes((nds) => nds.map((node) => (node.id === id ? { ...node, data: { ...node.data, ...data } } : node)));
        if (selectedNode?.id === id) {
            setSelectedNode((prev) => (prev ? { ...prev, data: { ...prev.data, ...data } } : null));
        }
    };

    const deleteNode = (id: string) => {
        setNodes((nds) => nds.filter((n) => n.id !== id));
        setEdges((eds) => eds.filter((e) => e.source !== id && e.target !== id));
        setSelectedNode(null);
    };

    const duplicateNode = (node: FlowNode) => {
        const copy: FlowNode = {
            ...node,
            id: `${node.type}-${Date.now()}`,
            position: { x: node.position.x + 48, y: node.position.y + 48 },
            selected: false,
        };
        setNodes((nds) => nds.concat(copy));
        setSelectedNode(copy);
    };

    if (!flow) {
        return (
            <div className="flex h-full items-center justify-center bg-[var(--paper-warm)]">
                <div className="flex flex-col items-center gap-3">
                    <Loader2 className="h-7 w-7 animate-spin text-[var(--accent)]" />
                    <p className="text-sm font-medium text-[var(--ink-500)]">Chargement du studio…</p>
                </div>
            </div>
        );
    }

    return (
        <div className="flex h-full w-full flex-col bg-[var(--paper-warm)]">
            {/* ── Top bar ─────────────────────────────────────────────── */}
            <div className="flex h-14 shrink-0 items-center gap-3 border-b border-[var(--ink-200)] bg-[var(--paper-white)] pl-3.5 pr-4">
                <button
                    type="button"
                    onClick={() => router.push('/dashboard/automatisations')}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                    aria-label="Retour"
                >
                    <ArrowLeft className="h-4 w-4" />
                </button>
                <span className="truncate font-editorial text-[18px] italic tracking-[-0.01em] text-[var(--ink-900)]">
                    {flow.name}
                </span>
                <StatusDot active={flow.isActive} />
                <span className="hidden whitespace-nowrap font-mono text-[11px] text-[var(--ink-soft)] lg:inline">
                    {flow.isActive ? 'publié' : 'brouillon'}
                </span>

                <div className="ml-auto flex items-center gap-1.5">
                    <BarBtn icon="sparkle" onClick={() => router.push(`/dashboard/automatisations/${flow._id}?mode=guided`)}>
                        Assistant IA
                    </BarBtn>
                    <BarBtn icon="play" onClick={() => toast.info('Le test de flow arrive bientôt')}>Tester</BarBtn>
                    <BarBtn icon="clock" onClick={() => toast.info("L'historique des versions arrive bientôt")} hideBelow="lg">
                        Historique
                    </BarBtn>
                    <div className="mx-1 h-[22px] w-px bg-[var(--ink-200)]" />
                    <button
                        type="button"
                        onClick={handleSave}
                        disabled={isSaving}
                        className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)] disabled:opacity-60"
                    >
                        {isSaving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : null}
                        Sauvegarder
                    </button>
                    <button
                        type="button"
                        onClick={handleToggleStatus}
                        disabled={isToggling}
                        className="inline-flex items-center gap-1.5 rounded-md bg-[var(--ink-900)] px-3 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[var(--ink-700)] disabled:opacity-60"
                    >
                        {isToggling ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                        {flow.isActive ? 'Dépublier' : 'Publier'}
                    </button>
                </div>
            </div>

            {/* ── Canvas + inspector ──────────────────────────────────── */}
            <div className="flex min-h-0 flex-1">
                <div
                    className="relative min-w-0 flex-1"
                    onDrop={onDrop}
                    onDragOver={onDragOver}
                    style={{
                        background:
                            'radial-gradient(circle, rgba(10,10,10,0.06) 1px, transparent 1.2px), var(--paper-warm)',
                        backgroundSize: '20px 20px',
                    }}
                >
                    <ReactFlow
                        nodes={nodes}
                        edges={edges}
                        onNodesChange={onNodesChange}
                        onEdgesChange={onEdgesChange}
                        onConnect={onConnect}
                        onNodeClick={onNodeClick}
                        onPaneClick={onPaneClick}
                        nodeTypes={nodeTypes}
                        fitView
                        fitViewOptions={{ maxZoom: 1.2 }}
                        minZoom={0.2}
                        maxZoom={2}
                        defaultEdgeOptions={{ animated: true, style: { strokeWidth: 1.6, stroke: 'var(--ink-300)' } }}
                        proOptions={{ hideAttribution: true }}
                    >
                        <Background color="transparent" gap={20} variant={BackgroundVariant.Dots} />
                    </ReactFlow>

                    {/* Palette */}
                    <div className="absolute left-4 top-4 w-[156px] rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] p-2 shadow-[0_6px_18px_rgba(10,10,10,0.07)]">
                        <div className={cn(EYEBROW, 'mx-1 mb-2 mt-0.5')}>Blocs</div>
                        <div className="flex flex-col gap-[3px]">
                            {PALETTE.map((p) => {
                                const c = NODE_KIND[p.kind];
                                return (
                                    <div
                                        key={p.type}
                                        draggable
                                        onDragStart={(e) => e.dataTransfer.setData('application/reactflow', p.type)}
                                        className="flex h-[34px] cursor-grab items-center gap-2.5 rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] px-2 transition-colors hover:bg-[var(--paper-warm)] active:cursor-grabbing"
                                    >
                                        <span
                                            className="flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-md"
                                            style={{ background: c.tint }}
                                        >
                                            <Icon name={p.icon} size={12.5} color={c.ico} strokeWidth={1.9} />
                                        </span>
                                        <span className="text-[12px] font-medium tracking-[-0.005em] text-[var(--ink-700)]">
                                            {p.label}
                                        </span>
                                    </div>
                                );
                            })}
                        </div>
                    </div>

                    {/* Stats overlay */}
                    <div className="absolute bottom-4 left-4 flex items-center gap-[18px] rounded-xl border border-[var(--ink-200)] bg-[var(--paper-white)] px-4 py-[11px] shadow-[0_6px_18px_rgba(10,10,10,0.07)]">
                        {[
                            { k: 'Exéc. 7 j', v: '—' },
                            { k: 'Conversion', v: '—' },
                            { k: 'Échecs', v: '—' },
                        ].map((s, i) => (
                            <div key={s.k} className="flex items-center gap-[18px]">
                                {i > 0 ? <div className="h-7 w-px bg-[var(--ink-200)]" /> : null}
                                <div>
                                    <div className={cn(EYEBROW, 'text-[9.5px]')}>{s.k}</div>
                                    <div className="mt-1 font-editorial text-[21px] italic leading-none tracking-[-0.01em] text-[var(--ink-900)]">
                                        {s.v}
                                    </div>
                                </div>
                            </div>
                        ))}
                        <div className="h-7 w-px bg-[var(--ink-200)]" />
                        <span className="rounded-md border border-[var(--ink-200)] px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em] text-[var(--ink-soft)]">
                            à venir
                        </span>
                    </div>

                    <ZoomControl />
                </div>

                {selectedNode ? (
                    <FlowInspector
                        node={selectedNode}
                        updateNodeData={updateNodeData}
                        onClose={() => setSelectedNode(null)}
                        onDelete={() => deleteNode(selectedNode.id)}
                        onDuplicate={() => duplicateNode(selectedNode)}
                    />
                ) : null}
            </div>
        </div>
    );
}

function StatusDot({ active }: { active: boolean }) {
    return (
        <span
            className={cn(
                'inline-flex shrink-0 items-center gap-1.5 rounded-md px-1.5 py-0.5 font-mono text-[9px] font-medium uppercase tracking-[0.05em]',
                active
                    ? 'bg-[var(--status-good-soft)] text-[var(--status-good)]'
                    : 'bg-[var(--status-warn-soft)] text-[var(--status-warn)]',
            )}
        >
            <span
                className="h-1.5 w-1.5 rounded-full"
                style={{ background: active ? 'var(--status-good)' : 'var(--status-warn)' }}
            />
            {active ? 'Actif' : 'Brouillon'}
        </span>
    );
}

function BarBtn({
    icon,
    children,
    onClick,
    hideBelow,
}: {
    icon: IconName;
    children: React.ReactNode;
    onClick?: () => void;
    hideBelow?: 'lg';
}) {
    return (
        <button
            type="button"
            onClick={onClick}
            className={cn(
                'items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]',
                hideBelow === 'lg' ? 'hidden lg:inline-flex' : 'inline-flex',
            )}
        >
            <Icon name={icon} size={14} strokeWidth={1.8} />
            {children}
        </button>
    );
}

function ZoomControl() {
    const { zoomIn, zoomOut, fitView } = useReactFlow();
    const { zoom } = useViewport();
    const btn =
        'flex h-7 w-7 items-center justify-center rounded-[7px] text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]';
    return (
        <div className="absolute bottom-4 right-4 flex items-center gap-0.5 rounded-[10px] border border-[var(--ink-200)] bg-[var(--paper-white)] p-1 shadow-[0_6px_18px_rgba(10,10,10,0.07)]">
            <button type="button" className={btn} onClick={() => zoomOut()} aria-label="Dézoomer">
                <Minus className="h-[15px] w-[15px]" />
            </button>
            <div className="min-w-[40px] text-center font-mono text-[11px] text-[var(--ink-500)]">
                {Math.round(zoom * 100)}%
            </div>
            <button type="button" className={btn} onClick={() => zoomIn()} aria-label="Zoomer">
                <Plus className="h-[15px] w-[15px]" />
            </button>
            <div className="mx-0.5 h-[18px] w-px bg-[var(--ink-200)]" />
            <button type="button" className={btn} onClick={() => fitView({ duration: 200 })} aria-label="Ajuster">
                <Maximize2 className="h-[14px] w-[14px]" />
            </button>
        </div>
    );
}

// ── Inspector ───────────────────────────────────────────────────────────────
function InsBlock({ label, hint, children }: { label?: string; hint?: string; children: React.ReactNode }) {
    return (
        <div className="mb-[18px]">
            {label ? (
                <div className="mb-[7px] flex items-baseline justify-between">
                    <span className={EYEBROW}>{label}</span>
                    {hint ? <span className="text-[11px] text-[var(--ink-soft)]">{hint}</span> : null}
                </div>
            ) : null}
            {children}
        </div>
    );
}

function Seg<T extends string>({
    value,
    onChange,
    options,
}: {
    value: T;
    onChange: (v: T) => void;
    options: { id: T; label: string; icon?: IconName }[];
}) {
    return (
        <div className="flex gap-[3px] rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-warm)] p-[3px]">
            {options.map((o) => {
                const on = o.id === value;
                return (
                    <button
                        key={o.id}
                        type="button"
                        onClick={() => onChange(o.id)}
                        className={cn(
                            'flex h-[30px] flex-1 items-center justify-center gap-1.5 rounded-md text-[12.5px] font-medium transition-colors',
                            on
                                ? 'bg-[var(--paper-white)] text-[var(--ink-900)] shadow-[0_1px_2px_rgba(10,10,10,0.08)]'
                                : 'text-[var(--ink-soft)] hover:text-[var(--ink-900)]',
                        )}
                    >
                        {o.icon ? <Icon name={o.icon} size={13} strokeWidth={1.8} /> : null}
                        {o.label}
                    </button>
                );
            })}
        </div>
    );
}

function kindMeta(node: FlowNode): { kind: NodeKind; icon: IconName; title: string } {
    const t = node.type ?? 'message';
    if (t === 'start') {
        const tt = (node.data.triggerType as string) || 'keyword';
        const title =
            tt === 'new_conversation' ? 'Premier message' : tt === 'no_reply' ? 'Sans réponse' : 'Sur mot-clé';
        return { kind: 'trigger', icon: 'bolt', title };
    }
    if (t === 'message') return { kind: 'message', icon: 'send', title: 'Message texte' };
    if (t === 'interactive') {
        const isList = node.data.interactiveType === 'list';
        return { kind: 'condition', icon: isList ? 'list' : 'circle-check', title: isList ? 'Liste de choix' : 'Boutons' };
    }
    const at = (node.data.actionType as string) || 'tag';
    const title = at === 'assign' ? 'Assigner un agent' : at === 'close' ? 'Clôturer' : 'Ajouter un tag';
    return { kind: 'action', icon: at === 'assign' ? 'user' : at === 'close' ? 'close' : 'bookmark', title };
}

function FlowInspector({
    node,
    updateNodeData,
    onClose,
    onDelete,
    onDuplicate,
}: {
    node: FlowNode;
    updateNodeData: (id: string, data: FlowNodePatch) => void;
    onClose: () => void;
    onDelete: () => void;
    onDuplicate: () => void;
}) {
    const meta = kindMeta(node);
    const c = NODE_KIND[meta.kind];
    const KIND_LABEL: Record<NodeKind, string> = {
        trigger: 'Déclencheur',
        message: 'Message',
        condition: 'Interactif',
        action: 'Action',
    };

    return (
        <div className="flex w-[344px] shrink-0 flex-col border-l border-[var(--ink-200)] bg-[var(--paper-white)]">
            {/* header */}
            <div className="flex shrink-0 items-start gap-[11px] border-b border-[var(--ink-200)] px-[18px] pb-3.5 pt-4">
                <span
                    className="flex h-8 w-8 shrink-0 items-center justify-center rounded-[9px] border"
                    style={{ background: c.tint, borderColor: c.border }}
                >
                    <Icon name={meta.icon} size={16} color={c.ico} strokeWidth={1.9} />
                </span>
                <div className="min-w-0 flex-1">
                    <div className={EYEBROW} style={{ color: c.head }}>
                        {KIND_LABEL[meta.kind]}
                    </div>
                    <div className="mt-[3px] text-[14.5px] font-semibold tracking-[-0.01em] text-[var(--ink-900)]">
                        {meta.title}
                    </div>
                </div>
                <button
                    type="button"
                    onClick={onClose}
                    className="flex h-7 w-7 items-center justify-center rounded-md text-[var(--ink-500)] transition-colors hover:bg-[var(--paper-warm)] hover:text-[var(--ink-900)]"
                    aria-label="Fermer"
                >
                    <Icon name="close" size={15} />
                </button>
            </div>

            {/* body */}
            <div className="flex-1 overflow-y-auto px-[18px] pb-2 pt-[18px]">
                <InspectorBody node={node} updateNodeData={updateNodeData} />
            </div>

            {/* footer */}
            <div className="flex shrink-0 items-center gap-2 border-t border-[var(--ink-200)] px-4 py-3">
                <button
                    type="button"
                    onClick={onDelete}
                    className="flex h-8 w-8 items-center justify-center rounded-lg border border-[var(--ink-200)] bg-[var(--paper-white)] text-[var(--status-danger)] transition-colors hover:bg-[var(--status-danger-soft)]"
                    aria-label="Supprimer le nœud"
                >
                    <Trash2 className="h-[15px] w-[15px]" />
                </button>
                <div className="flex-1" />
                <button
                    type="button"
                    onClick={onDuplicate}
                    className="inline-flex items-center gap-1.5 rounded-md px-2.5 py-1.5 text-[12.5px] font-medium text-[var(--ink-700)] transition-colors hover:bg-[var(--paper-warm)]"
                >
                    <Icon name="doc" size={14} strokeWidth={1.8} />
                    Dupliquer
                </button>
                <button
                    type="button"
                    onClick={onClose}
                    className="rounded-md bg-[var(--ink-900)] px-3.5 py-1.5 text-[12.5px] font-medium text-white transition-colors hover:bg-[var(--ink-700)]"
                >
                    Appliquer
                </button>
            </div>
        </div>
    );
}

function InspectorBody({
    node,
    updateNodeData,
}: {
    node: FlowNode;
    updateNodeData: (id: string, data: FlowNodePatch) => void;
}) {
    const set = (data: FlowNodePatch) => updateNodeData(node.id, data);

    if (node.type === 'start') {
        const triggerType = (node.data.triggerType as string) || 'keyword';
        return (
            <>
                <InsBlock label="Type de déclencheur">
                    <select className={FIELD} value={triggerType} onChange={(e) => set({ triggerType: e.target.value })}>
                        <option value="keyword">Mot-clé spécifique</option>
                        <option value="new_conversation">Premier message reçu</option>
                        <option value="no_reply">Sans réponse (timeout)</option>
                    </select>
                </InsBlock>
                {triggerType === 'keyword' ? (
                    <InsBlock label="Mots-clés" hint="séparés par des virgules">
                        <input
                            className={FIELD}
                            value={(node.data.keywords as string) || ''}
                            onChange={(e) => set({ keywords: e.target.value })}
                            placeholder="bonjour, devis, info"
                        />
                    </InsBlock>
                ) : null}
                <div className="rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-[13px] py-[11px] text-[12px] leading-[1.5] text-[var(--ink-500)]">
                    {triggerType === 'new_conversation'
                        ? 'Ne se déclenche qu’une fois par contact, sur son tout premier message entrant.'
                        : triggerType === 'no_reply'
                          ? 'Se déclenche lorsqu’un contact reste sans réponse pendant le délai configuré.'
                          : 'Se déclenche quand le message entrant contient l’un des mots-clés.'}
                </div>
            </>
        );
    }

    if (node.type === 'message') {
        const content = (node.data.content as string) || '';
        return (
            <>
                <InsBlock label="Texte du message" hint="1024 max">
                    <textarea
                        className={FIELD.replace('h-[38px]', 'min-h-[96px] py-2.5') + ' resize-none leading-relaxed'}
                        value={content}
                        onChange={(e) => set({ content: e.target.value })}
                        placeholder="Bonjour {{prenom}} 👋 Comment pouvons-nous vous aider ?"
                    />
                </InsBlock>
                <InsBlock label="Variables">
                    <div className="flex flex-wrap gap-1.5">
                        {['{{prenom}}', '{{entreprise}}', '{{agent}}'].map((v) => (
                            <button
                                key={v}
                                type="button"
                                onClick={() => set({ content: `${content}${content && !content.endsWith(' ') ? ' ' : ''}${v}` })}
                                className="rounded-md bg-[var(--accent-muted)] px-2 py-1 font-mono text-[11px] text-[var(--accent)] transition-opacity hover:opacity-80"
                            >
                                {v}
                            </button>
                        ))}
                    </div>
                </InsBlock>
            </>
        );
    }

    if (node.type === 'interactive') {
        const options = node.data.options || [];
        const iType: 'list' | 'button' = node.data.interactiveType === 'list' ? 'list' : 'button';
        return (
            <>
                <InsBlock label="Format">
                    <Seg<'button' | 'list'>
                        value={iType}
                        onChange={(v) => set({ interactiveType: v })}
                        options={[
                            { id: 'button', label: 'Boutons', icon: 'circle-dot' },
                            { id: 'list', label: 'Liste / menu', icon: 'list' },
                        ]}
                    />
                </InsBlock>
                <InsBlock label="Texte d'introduction">
                    <textarea
                        className={FIELD.replace('h-[38px]', 'min-h-[72px] py-2.5') + ' resize-none'}
                        value={(node.data.content as string) || ''}
                        onChange={(e) => set({ content: e.target.value })}
                        placeholder="Que souhaitez-vous faire ?"
                    />
                </InsBlock>
                <InsBlock label="Options" hint={`${options.length} / 10`}>
                    <div className="flex flex-col gap-[7px]">
                        {options.map((opt, idx) => (
                            <div
                                key={idx}
                                className="group flex h-9 items-center gap-2 rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-white)] px-2.5"
                            >
                                <span className="font-mono text-[10.5px] text-[var(--ink-soft)]">{idx + 1}</span>
                                <input
                                    className="min-w-0 flex-1 border-none bg-transparent text-[13px] text-[var(--ink-900)] outline-none placeholder:text-[var(--ink-soft)]"
                                    value={opt.label || opt.title || ''}
                                    onChange={(e) => {
                                        const next = [...options];
                                        next[idx] = {
                                            ...next[idx],
                                            label: e.target.value,
                                            title: e.target.value,
                                            id: e.target.value.toLowerCase().replace(/\s/g, '_'),
                                        };
                                        set({ options: next });
                                    }}
                                    placeholder={`Option ${idx + 1}`}
                                />
                                <button
                                    type="button"
                                    onClick={() => {
                                        const next = [...options];
                                        next.splice(idx, 1);
                                        set({ options: next });
                                    }}
                                    className="flex h-6 w-6 shrink-0 items-center justify-center rounded-md text-[var(--ink-400)] opacity-0 transition hover:bg-[var(--status-danger-soft)] hover:text-[var(--status-danger)] group-hover:opacity-100"
                                    aria-label="Supprimer l'option"
                                >
                                    <Icon name="close" size={13} />
                                </button>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={() => set({ options: [...options, { id: `opt_${Date.now()}`, title: '', label: '' }] })}
                            className="flex h-[34px] items-center justify-center gap-1.5 rounded-[9px] border border-dashed border-[var(--ink-200)] text-[12.5px] font-medium text-[var(--accent)] transition-colors hover:bg-[var(--paper-warm)]"
                        >
                            <Icon name="plus" size={13} />
                            Ajouter une option
                        </button>
                    </div>
                </InsBlock>
            </>
        );
    }

    // action
    const actionType: 'assign' | 'tag' | 'close' =
        node.data.actionType === 'assign' ? 'assign' : node.data.actionType === 'close' ? 'close' : 'tag';
    return (
        <>
            <InsBlock label="Type d'action">
                <Seg<'assign' | 'tag' | 'close'>
                    value={actionType}
                    onChange={(v) => set({ actionType: v })}
                    options={[
                        { id: 'assign', label: 'Assigner' },
                        { id: 'tag', label: 'Tag' },
                        { id: 'close', label: 'Clôturer' },
                    ]}
                />
            </InsBlock>
            {actionType === 'tag' ? (
                <InsBlock label="Nom du tag">
                    <input
                        className={FIELD}
                        value={(node.data.details as string) || ''}
                        onChange={(e) => set({ details: e.target.value })}
                        placeholder="ex. suivi, ventes, vip"
                    />
                </InsBlock>
            ) : null}
            {actionType === 'assign' ? (
                <InsBlock label="Assigner à" hint="pôle ou agent">
                    <input
                        className={FIELD}
                        value={(node.data.details as string) || ''}
                        onChange={(e) => set({ details: e.target.value })}
                        placeholder="ex. Pôle Ventes (round-robin)"
                    />
                </InsBlock>
            ) : null}
            {actionType === 'close' ? (
                <div className="rounded-[9px] border border-[var(--ink-200)] bg-[var(--paper-warm)] px-[13px] py-[11px] text-[12px] leading-[1.5] text-[var(--ink-500)]">
                    La conversation sera marquée comme résolue et clôturée automatiquement.
                </div>
            ) : null}
        </>
    );
}

export function FlowEditor(props: FlowEditorProps) {
    return (
        <ReactFlowProvider>
            <FlowEditorContent {...props} />
        </ReactFlowProvider>
    );
}
