import { NodeProps } from '@xyflow/react';

import type { IconName } from '@/components/dashboard/primitives/Icon';
import { FlowNodeShell } from './_nodeShell';

const ACTION: Record<string, { icon: IconName; label: string }> = {
    assign: { icon: 'user', label: 'Assigner un agent' },
    close: { icon: 'close', label: 'Clôturer' },
    tag: { icon: 'bookmark', label: 'Ajouter un tag' },
    generic: { icon: 'cog', label: 'Action' },
};

export function CustomNodeAction({ data, selected }: NodeProps) {
    const actionType = typeof data.actionType === 'string' ? data.actionType : 'generic';
    const meta = ACTION[actionType] ?? ACTION.generic;
    const sub = (data.details as string) || 'Information';
    return <FlowNodeShell kind="action" icon={meta.icon} title={meta.label} sub={sub} selected={selected} />;
}
