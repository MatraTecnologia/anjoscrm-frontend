"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { CodeIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { JavaScriptNodeData } from "@/lib/automation-types"

type JavaScriptNodeType = Node<JavaScriptNodeData, "javascript">
export function JavaScriptNode({ data, selected }: NodeProps<JavaScriptNodeType>) {
  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-amber-500">
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<CodeIcon size={12} />}
        title="JavaScript"
        iconBg="bg-amber-50 dark:bg-amber-950"
        iconColor="text-amber-600 dark:text-amber-400"
        subtitle="Código personalizado"
      />
      <NodeBody>
        {data.configured && data.code ? (
          <pre className="font-mono text-[9px] text-foreground bg-muted/50 rounded p-1.5 overflow-hidden max-h-[40px] leading-relaxed">
            {data.code.substring(0, 60)}{data.code.length > 60 ? "…" : ""}
          </pre>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para escrever o código</span>
        )}
      </NodeBody>
      <Handle
        type="source"
        position={Position.Right}
        className="!w-2.5 !h-2.5 !bg-amber-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
