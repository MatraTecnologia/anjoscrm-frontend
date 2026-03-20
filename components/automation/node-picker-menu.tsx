"use client"

import { useEffect, useRef } from "react"
import {
  MessageCircleIcon,
  ZapIcon,
  FilterIcon,
  ClockIcon,
  ShuffleIcon,
  BracesIcon,
  Table2Icon,
  BotIcon,
  CodeIcon,
  PlusIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import { NODE_PICKER_ITEMS, type NodeKind } from "@/lib/automation-types"

const ICONS: Record<string, React.ReactNode> = {
  "message-circle": <MessageCircleIcon size={16} />,
  "zap": <ZapIcon size={16} />,
  "filter": <FilterIcon size={16} />,
  "clock": <ClockIcon size={16} />,
  "shuffle": <ShuffleIcon size={16} />,
  "brackets": <BracesIcon size={16} />,
  "table-2": <Table2Icon size={16} />,
  "bot": <BotIcon size={16} />,
  "code": <CodeIcon size={16} />,
}

interface NodePickerMenuProps {
  onSelect: (kind: NodeKind) => void
  onClose: () => void
  position?: { x: number; y: number }
}

export function NodePickerMenu({ onSelect, onClose, position }: NodePickerMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        onClose()
      }
    }
    document.addEventListener("mousedown", handleClick)
    return () => document.removeEventListener("mousedown", handleClick)
  }, [onClose])

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-card border border-border rounded-xl shadow-xl p-3 w-[280px]"
      style={
        position
          ? { left: position.x, top: position.y }
          : { bottom: "2rem", right: "2rem" }
      }
    >
      <div className="flex items-center gap-2 mb-2.5 px-1">
        <PlusIcon size={12} className="text-muted-foreground" />
        <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
          Próximo passo
        </span>
      </div>
      <div className="grid grid-cols-2 gap-1.5">
        {NODE_PICKER_ITEMS.map((item) => (
          <button
            key={item.kind}
            onClick={() => { onSelect(item.kind); onClose() }}
            className={cn(
              "flex items-center gap-2.5 p-2.5 rounded-lg border border-transparent text-left transition-all",
              "hover:border-border",
              item.bgColor,
            )}
          >
            <span className={cn("shrink-0", item.color)}>
              {ICONS[item.icon]}
            </span>
            <div className="min-w-0">
              <p className={cn("text-xs font-semibold truncate", item.color)}>{item.label}</p>
              <p className="text-[9px] text-muted-foreground leading-tight truncate">
                {item.description}
              </p>
            </div>
          </button>
        ))}
      </div>
    </div>
  )
}
