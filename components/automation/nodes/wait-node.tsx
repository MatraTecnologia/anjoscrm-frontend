"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { ClockIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { WaitNodeData } from "@/lib/automation-types"

const unitLabel: Record<string, string> = {
  minutes: "minuto(s)",
  hours: "hora(s)",
  days: "dia(s)",
}

type WaitNodeType = Node<WaitNodeData, "wait">
export function WaitNode({ data, selected }: NodeProps<WaitNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-orange-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-orange-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<ClockIcon size={12} />}
        title="Espera"
        iconBg="bg-orange-50 dark:bg-orange-950"
        iconColor="text-orange-600 dark:text-orange-400"
      />
      <NodeBody>
        {data.configured ? (
          <span className="text-foreground font-medium text-[11px]">
            Aguardar {data.duration} {unitLabel[data.unit] ?? data.unit}
          </span>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-orange-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
