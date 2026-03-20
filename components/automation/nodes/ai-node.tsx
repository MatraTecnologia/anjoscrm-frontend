"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { BotIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { AINodeData } from "@/lib/automation-types"

type AINodeType = Node<AINodeData, "ai">
export function AINode({ data, selected }: NodeProps<AINodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-sky-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-sky-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<BotIcon size={12} />}
        title="Assistente IA"
        iconBg="bg-sky-50 dark:bg-sky-950"
        iconColor="text-sky-600 dark:text-sky-400"
      />
      <NodeBody>
        {data.configured ? (
          <div className="space-y-0.5">
            <span className="text-foreground font-medium text-[11px]">Resposta via assistente IA</span>
            {data.promptOverride && (
              <p className="text-muted-foreground line-clamp-2 text-[10px]">{data.promptOverride}</p>
            )}
          </div>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-sky-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
