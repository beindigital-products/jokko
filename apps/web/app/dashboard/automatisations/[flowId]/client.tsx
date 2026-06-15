'use client';

import { Id } from '@/convex/_generated/dataModel';
import { FlowEditor } from './components/FlowEditor';
import { FlowAIAssistant } from '../components/FlowAIAssistant';

interface FlowEditorClientProps {
    flowId: string;
    mode?: string;
}

export default function FlowEditorClient({ flowId, mode }: FlowEditorClientProps) {
    if (mode === 'guided') {
        return <FlowAIAssistant flowId={flowId} />;
    }

    return <FlowEditor flowId={flowId as Id<"flows">} />;
}
