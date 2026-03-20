"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { FilterIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { ConditionNodeData } from "@/lib/automation-types"

type ConditionNodeType = Node<ConditionNodeData, "condition">
export function ConditionNode({ data, selected }: NodeProps<ConditionNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-yellow-500">
      {/* Entrada: esquerda */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-yellow-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<FilterIcon size={12} />}
        title="Condição"
        iconBg="bg-yellow-50 dark:bg-yellow-950"
        iconColor="text-yellow-600 dark:text-yellow-500"
      />
      <NodeBody>
        {data.configured ? (
          <span className="text-foreground font-medium text-[11px]">
            {data.field} {data.operator} {data.value}
          </span>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
        {/* Indicadores visuais das saídas */}
        <div className="mt-2 pt-1.5 border-t border-border/40 flex justify-between text-[9px] font-semibold">
          <span className="flex items-center gap-1">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            <span className="text-emerald-600 dark:text-emerald-400">SIM</span>
          </span>
          <span className="flex items-center gap-1">
            <span className="text-red-600 dark:text-red-400">NÃO</span>
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
          </span>
        </div>
      </NodeBody>
      {/* Saída SIM: direita, topo */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        style={{ top: "45%" }}
        className="!w-2.5 !h-2.5 !bg-emerald-500 !border-2 !border-background"
      />
      {/* Saída NÃO: direita, base */}
      <Handle
        type="source"
        position={Position.Right}
        id="no"
        style={{ top: "72%" }}
        className="!w-2.5 !h-2.5 !bg-red-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
