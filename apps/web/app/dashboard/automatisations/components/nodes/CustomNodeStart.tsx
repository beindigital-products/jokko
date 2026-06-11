import { NodeProps } from '@xyflow/react';

import { FlowNodeShell } from './_nodeShell';

const TRIGGER_SUB: Record<string, string> = {
    keyword: 'Sur mot-clé reçu',
    new_conversation: 'Premier message reçu',
    no_reply: 'Aucune réponse (timeout)',
};

export function CustomNodeStart({ data, selected }: NodeProps) {
    const triggerType = typeof data.triggerType === 'string' ? data.triggerType : 'new_conversation';
    const sub = (data.label as string) || TRIGGER_SUB[triggerType] || 'Premier message reçu';
    return (
        <FlowNodeShell kind="trigger" icon="bolt" title="Déclencheur" sub={sub} hasTarget={false} selected={selected} />
    );
}
