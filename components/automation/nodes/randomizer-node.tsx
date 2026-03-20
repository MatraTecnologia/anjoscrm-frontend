"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import { ShuffleIcon } from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import type { RandomizerNodeData } from "@/lib/automation-types"

type RandomizerNodeType = Node<RandomizerNodeData, "randomizer">
export function RandomizerNode({ data, selected }: NodeProps<RandomizerNodeType>) {
  const branches = data.branches ?? []

  return (
    <BaseNode selected={selected} stats={data.stats} accentColor="bg-pink-500">
      {/* Entrada: esquerda */}
      <Handle
        type="target"
        position={Position.Left}
        className="!w-2.5 !h-2.5 !bg-pink-500 !border-2 !border-background"
      />
      <NodeHeader
        icon={<ShuffleIcon size={12} />}
        title="Randomizador"
        iconBg="bg-pink-50 dark:bg-pink-950"
        iconColor="text-pink-600 dark:text-pink-400"
        subtitle="Divisão probabilística"
      />
      <NodeBody>
        {data.configured && branches.length > 0 ? (
          <div className="space-y-0.5">
            {branches.map((b, i) => (
              <div key={i} className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-1 min-w-0">
                  <span
                    className="inline-block w-1.5 h-1.5 rounded-full shrink-0"
                    style={{ background: `hsl(${(i * 137) % 360}, 65%, 55%)` }}
                  />
                  <span className="text-foreground truncate text-[10px]">{b.label}</span>
                </div>
                <span className="text-pink-500 font-semibold text-[10px] shrink-0">{b.percentage}%</span>
              </div>
            ))}
          </div>
        ) : (
          <span className="italic text-muted-foreground/60">Clique para configurar</span>
        )}
      </NodeBody>

      {/* Saídas: direita, espaçadas verticalmente */}
      {branches.length > 0
        ? branches.map((_, i) => {
            // Calculates Y% so handles are evenly distributed vertically
            // Between 25% and 75% of the node height
            const pct = branches.length === 1
              ? 50
              : 25 + (i / (branches.length - 1)) * 50
            return (
              <Handle
                key={i}
                type="source"
                position={Position.Right}
                id={`branch-${i}`}
                style={{ top: `${pct}%` }}
                className="!w-2.5 !h-2.5 !bg-pink-500 !border-2 !border-background"
              />
            )
          })
        : (
          <Handle
            type="source"
            position={Position.Right}
            className="!w-2.5 !h-2.5 !bg-pink-500 !border-2 !border-background"
          />
        )}
    </BaseNode>
  )
}
