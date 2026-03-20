"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { Table2Icon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { FieldOpsNodeData } from "@/lib/automation-types"

type FieldOpsNodeType = Node<FieldOpsNodeData, "field_ops">
export function FieldOpsNode({ data, selected }: NodeProps<FieldOpsNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-teal-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-teal-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<Table2Icon size={12} />}
        title="Campos"
        iconBg="bg-teal-50 dark:bg-teal-950"
        iconColor="text-teal-600 dark:text-teal-400"
        subtitle="Operações de campos"
      />
      <NodeBody>
        {data.configured && data.operations?.length > 0 ? (
          <div className="space-y-0.5">
            <span className="text-foreground font-medium text-[11px]">
              {data.operations.length} campo(s) a atualizar
            </span>
            {data.operations.slice(0, 2).map((op, i) => (
              <div key={i} className="flex gap-1 text-[10px]">
                <span className="text-muted-foreground truncate">{op.field}</span>
                <span className="text-muted-foreground/60">→</span>
                <span className="text-foreground truncate">{op.value}</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-teal-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
