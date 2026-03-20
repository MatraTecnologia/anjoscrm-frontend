"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { MessageCircleIcon, BotIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { MessageNodeData } from "@/lib/automation-types"

type MessageNodeType = Node<MessageNodeData, "message">
export function MessageNode({ data, selected }: NodeProps<MessageNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-blue-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<MessageCircleIcon size={12} />}
        title="Mensagem"
        iconBg="bg-blue-50 dark:bg-blue-950"
        iconColor="text-blue-600 dark:text-blue-400"
      />
      <NodeBody>
        {data.configured ? (
          <div className="space-y-0.5">
            <div className="flex items-center gap-1">
              {data.messageType === "ai" ? (
                <BotIcon size={9} className="text-sky-500 shrink-0" />
              ) : (
                <MessageCircleIcon size={9} className="text-blue-500 shrink-0" />
              )}
              <span className="text-[10px] text-muted-foreground">
                {data.messageType === "ai" ? "Resposta da IA" : "Mensagem template"}
              </span>
            </div>
            {data.templateMessage && (
              <p className="text-foreground line-clamp-2 leading-relaxed text-[11px]">
                {data.templateMessage}
              </p>
            )}
          </div>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-blue-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
