"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { BracesIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { ApiNodeData } from "@/lib/automation-types"

const METHOD_COLORS: Record<string, string> = {
  GET: "text-emerald-600",
  POST: "text-blue-600",
  PUT: "text-yellow-600",
  PATCH: "text-orange-600",
  DELETE: "text-red-600",
}

type ApiNodeType = Node<ApiNodeData, "api">
export function ApiNode({ data, selected }: NodeProps<ApiNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-slate-400">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-slate-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<BracesIcon size={12} />}
        title="Requisição API"
        iconBg="bg-slate-100 dark:bg-slate-900"
        iconColor="text-slate-600 dark:text-slate-400"
      />
      <NodeBody>
        {data.configured ? (
          <div className="space-y-0.5">
            <span className={`font-bold text-[10px] ${METHOD_COLORS[data.method] ?? "text-slate-600"}`}>
              {data.method}
            </span>
            <p className="text-foreground truncate text-[10px]">{data.url}</p>
          </div>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-slate-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
