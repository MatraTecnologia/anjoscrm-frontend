"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { ZapIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { ActionNodeData } from "@/lib/automation-types"

const ACTION_LABELS: Record<string, string> = {
  move_stage: "Mover para etapa",
  add_tag: "Adicionar tag",
  remove_tag: "Remover tag",
  assign_attendant: "Atribuir atendente",
  close_deal: "Fechar negócio",
  win_deal: "Ganhar negócio",
}

type ActionNodeType = Node<ActionNodeData, "action">
export function ActionNode({ data, selected }: NodeProps<ActionNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-violet-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<ZapIcon size={12} />}
        title="Ação"
        iconBg="bg-violet-50 dark:bg-violet-950"
        iconColor="text-violet-600 dark:text-violet-400"
      />
      <NodeBody>
        {data.configured ? (
          <span className="text-foreground font-medium text-[11px]">
            {ACTION_LABELS[data.actionType] ?? data.actionType}
            {data.tagName ? `: ${data.tagName}` : ""}
          </span>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-violet-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
