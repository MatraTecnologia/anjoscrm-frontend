"use client"

import { Handle, Position, type NodeProps, type Node } from "@xyflow/react"
import {
  PlayIcon,
  PlusIcon,
  XIcon,
  BriefcaseIcon,
  UsersIcon,
  MessageCircleIcon,
  GlobeIcon,
  SettingsIcon,
  ActivityIcon,
  ZapIcon,
} from "lucide-react"
import { BaseNode, NodeHeader, NodeBody } from "./base-node"
import { cn } from "@/lib/utils"
import type { StartNodeData, TriggerItem } from "@/lib/automation-types"

type StartNodeType = Node<StartNodeData, "start">

function categoryIcon(category?: string) {
  switch (category) {
    case "Negócios": return BriefcaseIcon
    case "Leads": return UsersIcon
    case "Mensagens": return MessageCircleIcon
    case "HTTP": return GlobeIcon
    case "Sistema": return SettingsIcon
    case "Atividades": return ActivityIcon
    default: return ZapIcon
  }
}

export function StartNode({ data, selected }: NodeProps<StartNodeType>) {
  const triggers = (data.triggers as TriggerItem[]) ?? []
  const onAddTrigger = data.onAddTrigger as (() => void) | undefined
  const onRemoveTrigger = data.onRemoveTrigger as ((id: string) => void) | undefined

  return (
    <BaseNode
      selected={selected}
      showStats
      accentColor="bg-emerald-500"
    >
      <NodeHeader
        icon={<PlayIcon size={13} />}
        title="Início"
        iconBg="bg-emerald-100 dark:bg-emerald-950"
        iconColor="text-emerald-600 dark:text-emerald-400"
        subtitle="O gatilho é responsável por acionar a automação."
      />

      <NodeBody>
        {triggers.length === 0 && (
          <p className="text-[11px] text-muted-foreground/70 italic mb-2.5">
            Clique em "+ Adicionar gatilho" para começar:
          </p>
        )}

        {/* Trigger list */}
        {triggers.length > 0 && (
          <div className="space-y-1.5 mb-2.5">
            {triggers.map((t) => {
              const Icon = categoryIcon(t.category)
              return (
                <div
                  key={t.id}
                  className="group flex items-center gap-2 bg-card border border-border/70 rounded-lg px-2.5 py-2 hover:border-emerald-300 dark:hover:border-emerald-700 transition-colors"
                >
                  <Icon size={12} className="text-emerald-500 shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-medium text-foreground leading-none truncate">{t.label}</p>
                    {t.description && (
                      <p className="text-[10px] text-muted-foreground mt-0.5 truncate leading-none">
                        {t.description.length > 42 ? t.description.slice(0, 42) + "…" : t.description}
                      </p>
                    )}
                  </div>
                  {onRemoveTrigger && (
                    <button
                      className="opacity-0 group-hover:opacity-100 flex items-center justify-center w-4 h-4 rounded text-muted-foreground/60 hover:text-red-500 transition-all shrink-0"
                      onClick={(e) => { e.stopPropagation(); onRemoveTrigger(t.id) }}
                    >
                      <XIcon size={10} />
                    </button>
                  )}
                </div>
              )
            })}
          </div>
        )}

        {/* Add trigger button */}
        <button
          className={cn(
            "w-full flex items-center justify-center gap-1.5 border border-dashed rounded-lg px-2.5 py-2 text-[11px] font-medium transition-colors",
            "border-emerald-300 dark:border-emerald-800 text-emerald-600 dark:text-emerald-400",
            "hover:bg-emerald-50 dark:hover:bg-emerald-950/40",
          )}
          onClick={(e) => { e.stopPropagation(); onAddTrigger?.() }}
        >
          <PlusIcon size={11} />
          Adicionar gatilho
        </button>

        {triggers.length > 0 && (
          <p className="text-[10px] text-muted-foreground/60 text-center mt-2.5 leading-none">
            Quando o evento ocorrer, então →
          </p>
        )}
      </NodeBody>

      <Handle
        type="source"
        position={Position.Right}
        className="!w-3 !h-3 !bg-emerald-500 !border-2 !border-background"
      />
    </BaseNode>
  )
}
