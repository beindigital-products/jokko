import type { Meta, StoryObj } from "@storybook/nextjs-vite"
import {
    ReactFlow,
    ReactFlowProvider,
    Background,
    BackgroundVariant,
    type Node,
    type Edge,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { CustomNodeStart } from "@/app/dashboard/automatisations/components/nodes/CustomNodeStart"
import { CustomNodeMessage } from "@/app/dashboard/automatisations/components/nodes/CustomNodeMessage"
import { CustomNodeInteractive } from "@/app/dashboard/automatisations/components/nodes/CustomNodeInteractive"
import { CustomNodeAction } from "@/app/dashboard/automatisations/components/nodes/CustomNodeAction"

const nodeTypes = {
    start: CustomNodeStart,
    message: CustomNodeMessage,
    interactive: CustomNodeInteractive,
    action: CustomNodeAction,
}

const nodes: Node[] = [
    { id: "1", type: "start", position: { x: 40, y: 60 }, data: { triggerType: "new_conversation" } },
    { id: "2", type: "message", position: { x: 300, y: 40 }, data: { content: "Bonjour ! Merci pour votre message, comment puis-je vous aider ?" } },
    {
        id: "3",
        type: "interactive",
        position: { x: 300, y: 200 },
        data: { interactiveType: "list", content: "Choisissez un sujet :", options: [{ label: "Commande" }, { label: "Support" }, { label: "Autre" }] },
    },
    { id: "4", type: "action", position: { x: 620, y: 70 }, data: { actionType: "assign", details: "Pôle Ventes · round-robin" }, selected: true },
    { id: "5", type: "action", position: { x: 620, y: 220 }, data: { actionType: "tag", details: "support" } },
]

const edges: Edge[] = [
    { id: "e1-2", source: "1", target: "2", animated: true, style: { stroke: "var(--ink-300)", strokeWidth: 1.5 } },
    { id: "e2-3", source: "2", target: "3", animated: true, style: { stroke: "var(--ink-300)", strokeWidth: 1.5 } },
    { id: "e3-4", source: "3", target: "4", animated: true, style: { stroke: "var(--ink-300)", strokeWidth: 1.5 } },
    { id: "e3-5", source: "3", target: "5", animated: true, style: { stroke: "var(--ink-300)", strokeWidth: 1.5 } },
]

function FlowNodesPreview() {
    return (
        <div style={{ width: "100%", height: 480, background: "var(--paper-warm)" }}>
            <ReactFlowProvider>
                <ReactFlow nodes={nodes} edges={edges} nodeTypes={nodeTypes} fitView proOptions={{ hideAttribution: true }}>
                    <Background color="var(--ink-200)" gap={18} size={1.5} variant={BackgroundVariant.Dots} />
                </ReactFlow>
            </ReactFlowProvider>
        </div>
    )
}

const meta = {
    title: "Screens/Automations/FlowNodes",
    component: FlowNodesPreview,
    parameters: { layout: "fullscreen" },
} satisfies Meta<typeof FlowNodesPreview>

export default meta
type Story = StoryObj<typeof meta>

export const Canvas: Story = {}
