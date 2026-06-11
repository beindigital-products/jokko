import { NodeProps } from '@xyflow/react';

import { FlowNodeShell } from './_nodeShell';

interface InteractiveOption {
    label?: string;
    title?: string;
}

function isInteractiveOption(value: unknown): value is InteractiveOption {
    return typeof value === 'object' && value !== null;
}

export function CustomNodeInteractive({ data, selected }: NodeProps) {
    const isList = data.interactiveType === 'list';
    const options = Array.isArray(data.options) ? data.options.filter(isInteractiveOption) : [];
    const sub = (data.content as string) || 'Choisir une option…';

    return (
        <FlowNodeShell
            kind="condition"
            icon={isList ? 'list' : 'circle-check'}
            title={isList ? 'Liste de choix' : 'Boutons'}
            sub={sub}
            badge={options.length > 0 ? `${options.length} opt.` : undefined}
            selected={selected}
        >
            {options.length > 0 ? (
                <div className="mt-[9px] flex flex-col gap-[5px]">
                    {options.slice(0, 3).map((opt, i) => (
                        <div
                            key={i}
                            className="flex h-[26px] items-center gap-[7px] rounded-[7px] border border-[var(--ink-100)] bg-[var(--paper-warm)] px-[9px] text-[11.5px] font-medium text-[var(--ink-700)]"
                        >
                            <span className="font-mono text-[9.5px] text-[var(--ink-soft)]">{i + 1}</span>
                            <span className="min-w-0 flex-1 truncate">{opt.label || opt.title || 'Option'}</span>
                        </div>
                    ))}
                    {options.length > 3 ? (
                        <div className="pl-[9px] text-[10px] font-medium text-[var(--ink-soft)]">
                            +{options.length - 3} autres…
                        </div>
                    ) : null}
                </div>
            ) : null}
        </FlowNodeShell>
    );
}
