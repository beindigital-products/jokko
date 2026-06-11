import { NodeProps } from '@xyflow/react';

import { FlowNodeShell } from './_nodeShell';

export function CustomNodeMessage({ data, selected }: NodeProps) {
    const sub = typeof data.content === 'string' && data.content ? data.content : 'Pas de contenu défini';
    return <FlowNodeShell kind="message" icon="send" title="Envoyer un message" sub={sub} selected={selected} />;
}
