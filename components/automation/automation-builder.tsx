"use client"

import { useCallback, useState, useEffect, useRef, useMemo } from "react"
import {
  ReactFlow,
  ReactFlowProvider,
  Background,
  Controls,
  addEdge,
  useNodesState,
  useEdgesState,
  useReactFlow,
  useViewport,
  type Connection,
  type NodeTypes,
  type EdgeTypes,
  type Node,
  BackgroundVariant,
  BaseEdge,
  getSmoothStepPath,
  type EdgeProps,
  MarkerType,
} from "@xyflow/react"
import "@xyflow/react/dist/style.css"

import { PlusIcon } from "lucide-react"
import { toast } from "sonner"

import { StartNode } from "./nodes/start-node"
import { MessageNode } from "./nodes/message-node"
import { WaitNode } from "./nodes/wait-node"
import { ConditionNode } from "./nodes/condition-node"
import { ActionNode } from "./nodes/action-node"
import { AINode } from "./nodes/ai-node"
import { ApiNode } from "./nodes/api-node"
import { FieldOpsNode } from "./nodes/field-ops-node"
import { RandomizerNode } from "./nodes/randomizer-node"
import { JavaScriptNode } from "./nodes/javascript-node"
import { NodePickerMenu } from "./node-picker-menu"
import { NodeConfigPanel } from "./node-config-panel"
import { NodeContextMenu } from "./node-context-menu"
import { TriggerSelectModal } from "./trigger-select-modal"
import { AutomationToolbar } from "./automation-toolbar"
import { AutomationLogs } from "./automation-logs"

import type {
  WorkflowAutomation,
  WorkflowNode,
  WorkflowEdge,
  NodeKind,
  TriggerDefinition,
} from "@/lib/automation-types"
import { api } from "@/lib/api"

// ─── Custom Edge ──────────────────────────────────────────────────────────────

function CustomEdge({
  id,
  sourceX,
  sourceY,
  targetX,
  targetY,
  sourcePosition,
  targetPosition,
  selected,
  markerEnd,
}: EdgeProps) {
  const [edgePath] = getSmoothStepPath({
    sourceX,
    sourceY,
    sourcePosition,
    targetX,
    targetY,
    targetPosition,
    borderRadius: 12,
  })

  return (
    <BaseEdge
      id={id}
      path={edgePath}
      markerEnd={markerEnd}
      style={{
        stroke: selected ? "#6366f1" : "#94a3b8",
        strokeWidth: selected ? 2 : 1.5,
        strokeDasharray: selected ? undefined : "6 3",
      }}
    />
  )
}

// ─── Node Types ───────────────────────────────────────────────────────────────

const NODE_TYPES: NodeTypes = {
  start: StartNode as never,
  message: MessageNode as never,
  wait: WaitNode as never,
  condition: ConditionNode as never,
  action: ActionNode as never,
  ai: AINode as never,
  api: ApiNode as never,
  field_ops: FieldOpsNode as never,
  randomizer: RandomizerNode as never,
  javascript: JavaScriptNode as never,
}

const EDGE_TYPES: EdgeTypes = {
  custom: CustomEdge,
}

// ─── Default node data ────────────────────────────────────────────────────────

function makeDefaultNodeData(kind: NodeKind): Record<string, unknown> {
  const base = { configured: false, label: kindLabel(kind) }
  switch (kind) {
    case "message": return { ...base, messageType: "template", templateMessage: "" }
    case "wait": return { ...base, duration: 1, unit: "hours" }
    case "condition": return { ...base, field: "", operator: "equals", value: "" }
    case "action": return { ...base, actionType: "add_tag" }
    case "ai": return { ...base, promptOverride: "" }
    case "api": return { ...base, method: "POST", url: "" }
    case "field_ops": return { ...base, operations: [{ field: "", value: "" }] }
    case "randomizer": return { ...base, branches: [{ label: "Caminho A", percentage: 50 }, { label: "Caminho B", percentage: 50 }] }
    case "javascript": return { ...base, code: "" }
    default: return base
  }
}

function kindLabel(kind: NodeKind): string {
  const m: Record<NodeKind, string> = {
    start: "Início",
    message: "Mensagem",
    wait: "Espera",
    condition: "Condição",
    action: "Ação",
    ai: "IA",
    api: "API",
    field_ops: "Campos",
    randomizer: "Randomizador",
    javascript: "JavaScript",
  }
  return m[kind] ?? kind
}

// ─── Initial nodes ────────────────────────────────────────────────────────────

function makeStartNode(): WorkflowNode {
  return {
    id: "start",
    type: "start",
    position: { x: 80, y: 200 },
    data: { label: "Início", configured: false, triggers: [] },
  }
}

// ─── Context menu state type ──────────────────────────────────────────────────

interface ContextMenuState {
  x: number
  y: number
  nodeId: string
  nodeType: string
}

// ─── Main Builder ─────────────────────────────────────────────────────────────

interface AutomationBuilderInnerProps {
  automation: WorkflowAutomation
  enterpriseId?: string
  onUpdate: (updated: WorkflowAutomation) => void
  onBack: () => void
  onDelete: (id: string) => void
}

function AutomationBuilderInner({ automation, enterpriseId = "", onUpdate, onBack, onDelete }: AutomationBuilderInnerProps) {
  const headers = enterpriseId ? { "X-Enterprise-Id": enterpriseId } : {}
  const initialNodes: WorkflowNode[] =
    automation.nodes && (automation.nodes as WorkflowNode[]).length > 0
      ? (automation.nodes as WorkflowNode[])
      : [makeStartNode()]

  const [nodes, setNodes, onNodesChange] = useNodesState<WorkflowNode>(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState<WorkflowEdge>(
    (automation.edges as WorkflowEdge[]) ?? [],
  )

  const [isDirty, setIsDirty] = useState(false)
  const [isSaving, setIsSaving] = useState(false)
  const [selectedNode, setSelectedNode] = useState<WorkflowNode | null>(null)
  const [pickerSource, setPickerSource] = useState<{ nodeId: string } | null>(null)
  const [triggerModalOpen, setTriggerModalOpen] = useState(false)
  const [contextMenu, setContextMenu] = useState<ContextMenuState | null>(null)
  const [view, setView] = useState<"flow" | "logs">("flow")
  const wrapperRef = useRef<HTMLDivElement>(null)

  // Keyboard shortcuts (Ctrl+S to save; Delete/Backspace to delete selected node)
  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      // Don't intercept when user is typing in an input/textarea
      const tag = (e.target as HTMLElement)?.tagName
      const isEditable = tag === "INPUT" || tag === "TEXTAREA" || (e.target as HTMLElement)?.isContentEditable

      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault()
        if (isDirty) handleSave()
        return
      }

      if ((e.key === "Delete" || e.key === "Backspace") && !isEditable) {
        if (selectedNode && selectedNode.type !== "start") {
          e.preventDefault()
          handleDeleteNode(selectedNode.id)
        }
      }
    }
    window.addEventListener("keydown", onKeyDown)
    return () => window.removeEventListener("keydown", onKeyDown)
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDirty, nodes, edges, selectedNode])

  // Mark dirty on node/edge changes after initial load
  const mountedRef = useRef(false)
  useEffect(() => {
    if (!mountedRef.current) { mountedRef.current = true; return }
    setIsDirty(true)
  }, [nodes, edges])

  // ─── Trigger management ───────────────────────────────────────────────────

  const handleRemoveTrigger = useCallback((triggerId: string) => {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== "start") return n
        const current = ((n.data as Record<string, unknown>).triggers as Array<{ id: string }>) ?? []
        const updated = current.filter((t) => t.id !== triggerId)
        return { ...n, data: { ...n.data, triggers: updated, configured: updated.length > 0 } }
      }),
    )
  }, [setNodes])

  // Inject callbacks into start node data so the node card can call them
  const nodesWithCallbacks = useMemo(() =>
    nodes.map((n) =>
      n.type !== "start" ? n : {
        ...n,
        data: {
          ...n.data,
          onAddTrigger: () => setTriggerModalOpen(true),
          onRemoveTrigger: handleRemoveTrigger,
        },
      },
    ),
    [nodes, handleRemoveTrigger],
  )

  // ─── Edge connections ─────────────────────────────────────────────────────

  const onConnect = useCallback(
    (params: Connection) => {
      setEdges((eds) =>
        addEdge({
          ...params,
          type: "custom",
          animated: false,
          markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#9ca3af" },
        }, eds),
      )
    },
    [setEdges],
  )

  // ─── Node CRUD ────────────────────────────────────────────────────────────

  function handleDeleteNode(nodeId: string) {
    if (nodeId === "start") return
    setNodes((nds) => nds.filter((n) => n.id !== nodeId))
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    if (selectedNode?.id === nodeId) setSelectedNode(null)
    setContextMenu(null)
  }

  function handleDuplicateNode(nodeId: string) {
    const source = nodes.find((n) => n.id === nodeId)
    if (!source) return
    const newId = crypto.randomUUID().replace(/-/g, "").slice(0, 8)
    const newNode: WorkflowNode = {
      ...source,
      id: newId,
      position: { x: source.position.x + 40, y: source.position.y + 60 },
      data: { ...source.data },
    }
    setNodes((nds) => [...nds, newNode])
    setContextMenu(null)
  }

  function handleDisconnectNode(nodeId: string) {
    setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId))
    setContextMenu(null)
  }

  // ─── Node interactions ────────────────────────────────────────────────────

  function onNodeClick(_: React.MouseEvent, node: Node) {
    const wn = node as WorkflowNode
    // Start node triggers are managed via the button inside the node card
    if (wn.type !== "start") {
      setSelectedNode(wn)
    }
    setContextMenu(null)
  }

  function onNodeContextMenu(e: React.MouseEvent, node: Node) {
    e.preventDefault()
    const wn = node as WorkflowNode
    const wrapperRect = wrapperRef.current?.getBoundingClientRect()
    const x = wrapperRect ? e.clientX - wrapperRect.left : e.clientX
    const y = wrapperRect ? e.clientY - wrapperRect.top : e.clientY
    setContextMenu({ x, y, nodeId: wn.id, nodeType: wn.type ?? "message" })
  }

  function handleAddNode(kind: NodeKind) {
    if (!pickerSource) return
    const sourceNode = nodes.find((n) => n.id === pickerSource.nodeId)
    const newId = crypto.randomUUID().replace(/-/g, "").slice(0, 8)
    const newNode: WorkflowNode = {
      id: newId,
      type: kind,
      position: {
        x: (sourceNode?.position.x ?? 80) + 340,
        y: (sourceNode?.position.y ?? 200),
      },
      data: makeDefaultNodeData(kind) as never,
    }
    const newEdge: WorkflowEdge = {
      id: `e-${pickerSource.nodeId}-${newId}`,
      source: pickerSource.nodeId,
      target: newId,
      type: "custom",
      markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#9ca3af" } as never,
    }
    setNodes((nds) => [...nds, newNode])
    setEdges((eds) => [...eds, newEdge])
    setPickerSource(null)
    setSelectedNode(newNode)
  }

  function handleTriggerSelect(trigger: TriggerDefinition) {
    setNodes((nds) =>
      nds.map((n) => {
        if (n.id !== "start") return n
        const existing = ((n.data as Record<string, unknown>).triggers as Array<{ id: string }>) ?? []
        // Avoid duplicate triggers
        if (existing.some((t) => t.id === trigger.id)) return n
        return {
          ...n,
          data: {
            ...n.data,
            triggers: [
              ...existing,
              { id: trigger.id, label: trigger.label, description: trigger.description, category: trigger.category },
            ],
            configured: true,
          },
        }
      }),
    )
  }

  function handleNodeConfigSave(nodeId: string, data: Record<string, unknown>) {
    setNodes((nds) =>
      nds.map((n) => (n.id === nodeId ? { ...n, data: { ...n.data, ...data } } : n)),
    )
  }

  // ─── Persistence ──────────────────────────────────────────────────────────

  async function handleSave() {
    setIsSaving(true)
    try {
      const startNode = nodes.find((n) => n.id === "start")
      const triggers = ((startNode?.data as Record<string, unknown>)?.triggers as Array<{ id: string }>) ?? []
      const updated = await api.put(`/automations/${automation.id}`, {
        nodes,
        edges,
        name: automation.name,
        category: automation.category,
        triggerType: triggers[0]?.id ?? automation.triggerType,
      }, { headers })
      onUpdate({ ...automation, ...updated.data, nodes: nodes as never, edges: edges as never })
      setIsDirty(false)
      toast.success("Automação salva")
    } catch {
      toast.error("Erro ao salvar automação")
    } finally {
      setIsSaving(false)
    }
  }

  async function handleToggleActive() {
    try {
      const res = await api.patch(`/automations/${automation.id}/toggle`, {}, { headers })
      onUpdate({ ...automation, isActive: res.data.isActive })
      toast.success(res.data.isActive ? "Automação ativada" : "Automação desativada")
    } catch {
      toast.error("Erro ao alterar status")
    }
  }

  async function handleRename(name: string) {
    try {
      await api.put(`/automations/${automation.id}`, { name }, { headers })
      onUpdate({ ...automation, name })
      toast.success("Nome atualizado")
    } catch {
      toast.error("Erro ao renomear")
    }
  }

  async function handleDuplicate() {
    try {
      const res = await api.post(`/automations/${automation.id}/duplicate`, {}, { headers })
      onUpdate(res.data)
      toast.success("Automação duplicada")
    } catch {
      toast.error("Erro ao duplicar")
    }
  }

  async function handleDelete() {
    try {
      await api.delete(`/automations/${automation.id}`, { headers })
      onDelete(automation.id)
      toast.success("Automação deletada")
      onBack()
    } catch {
      toast.error("Erro ao deletar")
    }
  }

  function handleExport() {
    const data = JSON.stringify({ automation, nodes, edges }, null, 2)
    const blob = new Blob([data], { type: "application/json" })
    const url = URL.createObjectURL(blob)
    const a = document.createElement("a")
    a.href = url
    a.download = `${automation.name.replace(/\s+/g, "_")}.json`
    a.click()
    URL.revokeObjectURL(url)
  }

  // Nodes without outgoing edges get a "+" button
  const nodeIdsWithSource = new Set(edges.map((e) => e.source))
  const terminalNodes = nodes.filter((n) => !nodeIdsWithSource.has(n.id) && n.type !== "condition" && n.type !== "randomizer")

  // The node referenced by the context menu (to pass to handlers)
  const contextMenuNode = contextMenu ? nodes.find((n) => n.id === contextMenu.nodeId) : null

  return (
    <div className="flex flex-col h-full w-full">
      <AutomationToolbar
        automation={automation}
        isDirty={isDirty}
        onSave={handleSave}
        onToggleActive={handleToggleActive}
        onRename={handleRename}
        onDuplicate={handleDuplicate}
        onDelete={handleDelete}
        onExport={handleExport}
        onBack={onBack}
        isSaving={isSaving}
        view={view}
        onViewChange={setView}
      />

      {view === "logs" ? (
        <AutomationLogs automationId={automation.id} enterpriseId={enterpriseId} />
      ) : (
        <div className="flex flex-1 min-h-0">
          {/* Canvas */}
          <div className="flex-1 relative min-w-0" ref={wrapperRef}>
            <style>{`
              .react-flow__node { cursor: pointer; }
              .react-flow__handle { cursor: crosshair; }
              .react-flow__edge-path { transition: stroke 0.15s; }
            `}</style>

            <ReactFlow
              nodes={nodesWithCallbacks}
              edges={edges}
              onNodesChange={onNodesChange}
              onEdgesChange={onEdgesChange}
              onConnect={onConnect}
              onNodeClick={onNodeClick}
              onNodeContextMenu={onNodeContextMenu}
              onPaneClick={() => { setPickerSource(null); setSelectedNode(null); setContextMenu(null) }}
              nodeTypes={NODE_TYPES}
              edgeTypes={EDGE_TYPES}
              defaultEdgeOptions={{
                type: "custom",
                markerEnd: { type: MarkerType.ArrowClosed, width: 14, height: 14, color: "#9ca3af" },
              }}
              fitView
              fitViewOptions={{ padding: 0.3 }}
              minZoom={0.3}
              maxZoom={1.8}
              className="bg-background"
            >
              <Background
                variant={BackgroundVariant.Dots}
                gap={20}
                size={1}
                color="hsl(var(--border))"
              />
              <Controls className="!bg-card !border-border !shadow-sm" />
            </ReactFlow>

            {/* Terminal node "+" buttons — rendered outside ReactFlow for correct pan/zoom support */}
            {terminalNodes.map((node) => (
              <AddNodeButton
                key={node.id}
                nodeId={node.id}
                position={node.position}
                wrapperRef={wrapperRef}
                onClick={() => setPickerSource({ nodeId: node.id })}
              />
            ))}

            {/* Node picker popup */}
            {pickerSource && (
              <div className="absolute bottom-6 right-6 z-50">
                <NodePickerMenu
                  onSelect={handleAddNode}
                  onClose={() => setPickerSource(null)}
                />
              </div>
            )}

            {/* Context menu */}
            {contextMenu && contextMenuNode && (
              <NodeContextMenu
                x={contextMenu.x}
                y={contextMenu.y}
                nodeId={contextMenu.nodeId}
                nodeType={contextMenu.nodeType}
                onConfigure={() => {
                  if (contextMenuNode.type !== "start") setSelectedNode(contextMenuNode)
                  setContextMenu(null)
                }}
                onDuplicate={() => handleDuplicateNode(contextMenu.nodeId)}
                onDisconnect={() => handleDisconnectNode(contextMenu.nodeId)}
                onDelete={() => handleDeleteNode(contextMenu.nodeId)}
                onClose={() => setContextMenu(null)}
              />
            )}
          </div>

          {/* Inline node config panel */}
          {selectedNode && (
            <NodeConfigPanel
              node={selectedNode}
              onClose={() => setSelectedNode(null)}
              onSave={handleNodeConfigSave}
            />
          )}
        </div>
      )}

      {/* Trigger modal */}
      <TriggerSelectModal
        open={triggerModalOpen}
        onClose={() => setTriggerModalOpen(false)}
        onSelect={handleTriggerSelect}
      />
    </div>
  )
}

// ─── Add Node Button ──────────────────────────────────────────────────────────

function AddNodeButton({
  nodeId,
  position,
  wrapperRef,
  onClick,
}: {
  nodeId: string
  position: { x: number; y: number }
  wrapperRef: React.RefObject<HTMLDivElement | null>
  onClick: () => void
}) {
  const { flowToScreenPosition } = useReactFlow()
  useViewport() // re-render on pan/zoom so position stays correct

  const screenPos = flowToScreenPosition({ x: position.x + 308, y: position.y + 34 })
  const containerRect = wrapperRef.current?.getBoundingClientRect()
  const left = containerRect ? screenPos.x - containerRect.left : 0
  const top = containerRect ? screenPos.y - containerRect.top : 0

  return (
    <div className="absolute z-20 pointer-events-none" style={{ left, top }}>
      <button
        className="pointer-events-auto flex items-center gap-1 bg-card border border-dashed border-border hover:border-primary text-muted-foreground hover:text-primary px-2.5 py-1 rounded-full text-[10px] font-medium shadow-sm transition-all"
        onClick={onClick}
      >
        <PlusIcon size={10} />
        Próximo passo
      </button>
    </div>
  )
}

// ─── Export ───────────────────────────────────────────────────────────────────

export function AutomationBuilder(props: AutomationBuilderInnerProps) {
  return (
    <ReactFlowProvider>
      <AutomationBuilderInner {...props} />
    </ReactFlowProvider>
  )
}

export type { AutomationBuilderInnerProps as AutomationBuilderProps }
