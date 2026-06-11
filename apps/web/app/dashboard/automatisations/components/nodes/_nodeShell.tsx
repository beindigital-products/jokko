import { Handle, Position } from '@xyflow/react';
import type { ReactNode } from 'react';

import { Icon, type IconName } from '@/components/dashboard/primitives/Icon';

export type NodeKind = 'trigger' | 'message' | 'condition' | 'action';

/**
 * v3 colour map for flow nodes — ported from the design handoff
 * (`screens-flows.jsx` FLOW_KINDS): trigger=amber, message=violet,
 * condition/interactive=neutral, action=green. `head` is the (darker) header
 * label colour, `ico` the icon colour, `tint`/`border` the header band.
 */
export const NODE_KIND: Record<NodeKind, { tint: string; border: string; head: string; ico: string }> = {
    trigger: { tint: '#FBF1DB', border: 'rgba(184,134,11,0.40)', head: '#9A6F0A', ico: 'var(--status-warn)' },
    message: { tint: '#F1EBFE', border: 'rgba(105,56,239,0.32)', head: 'var(--accent)', ico: 'var(--accent)' },
    condition: { tint: '#F1F0F3', border: 'var(--ink-200)', head: 'var(--ink-700)', ico: 'var(--ink-500)' },
    action: { tint: '#E4F2EA', border: 'rgba(19,138,78,0.38)', head: '#0F6E3E', ico: 'var(--status-good)' },
};

const KIND_LABEL: Record<NodeKind, string> = {
    trigger: 'Déclencheur',
    message: 'Message',
    condition: 'Interactif',
    action: 'Action',
};

interface FlowNodeShellProps {
    kind: NodeKind;
    icon: IconName;
    title: string;
    sub?: string;
    badge?: string;
    selected?: boolean;
    hasTarget?: boolean;
    hasSource?: boolean;
    width?: number;
    children?: ReactNode;
}

/**
 * FlowNodeShell — the v3 card chrome shared by every custom flow node:
 * a colour-coded header band (mono uppercase kind + icon) over a paper body
 * with title + sub, plus the React Flow connection handles.
 */
export function FlowNodeShell({
    kind,
    icon,
    title,
    sub,
    badge,
    selected,
    hasTarget = true,
    hasSource = true,
    width = 214,
    children,
}: FlowNodeShellProps) {
    const c = NODE_KIND[kind];
    return (
        <div
            style={{
                width,
                borderColor: selected ? 'var(--accent)' : c.border,
                boxShadow: selected
                    ? '0 0 0 3px color-mix(in srgb, var(--accent) 18%, transparent), 0 8px 22px rgba(10,10,10,0.10)'
                    : '0 3px 12px rgba(10,10,10,0.07), 0 1px 0 rgba(255,255,255,0.6) inset',
            }}
            className="overflow-hidden rounded-xl border bg-[var(--paper-white)] transition-[box-shadow,border-color]"
        >
            {hasTarget && (
                <Handle
                    type="target"
                    position={Position.Top}
                    style={{ width: 9, height: 9, background: c.ico, border: '2px solid var(--paper-white)' }}
                />
            )}

            <div
                className="flex items-center gap-[7px] border-b px-[11px] py-[7px]"
                style={{ background: c.tint, borderColor: c.border }}
            >
                <Icon name={icon} size={12.5} color={c.ico} strokeWidth={1.9} />
                <span
                    className="font-mono text-[10px] font-semibold uppercase tracking-[0.07em]"
                    style={{ color: c.head }}
                >
                    {KIND_LABEL[kind]}
                </span>
                {badge ? (
                    <span className="ml-auto font-mono text-[9.5px] tracking-[0.04em] text-[var(--ink-soft)]">
                        {badge}
                    </span>
                ) : null}
            </div>

            <div className="px-3 pb-[11px] pt-[9px]">
                <div className="text-[12.5px] font-semibold tracking-[-0.005em] text-[var(--ink-900)]">{title}</div>
                {sub ? <div className="mt-[3px] line-clamp-2 text-[11.5px] leading-[1.4] text-[var(--ink-500)]">{sub}</div> : null}
                {children}
            </div>

            {hasSource && (
                <Handle
                    type="source"
                    position={Position.Bottom}
                    style={{ width: 9, height: 9, background: c.ico, border: '2px solid var(--paper-white)' }}
                />
            )}
        </div>
    );
}
