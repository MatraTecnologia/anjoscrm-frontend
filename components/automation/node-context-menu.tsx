"use client"

import { useEffect, useRef } from "react"
import { Settings2Icon, CopyIcon, Trash2Icon, UnlinkIcon } from "lucide-react"
import { cn } from "@/lib/utils"

interface NodeContextMenuProps {
  x: number
  y: number
  nodeId: string
  nodeType: string
  onConfigure: () => void
  onDuplicate: () => void
  onDisconnect: () => void
  onDelete: () => void
  onClose: () => void
}

export function NodeContextMenu({
  x,
  y,
  nodeId: _nodeId,
  nodeType,
  onConfigure,
  onDuplicate,
  onDisconnect,
  onDelete,
  onClose,
}: NodeContextMenuProps) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleDown(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) onClose()
    }
    function handleEsc(e: KeyboardEvent) {
      if (e.key === "Escape") onClose()
    }
    document.addEventListener("mousedown", handleDown)
    document.addEventListener("keydown", handleEsc)
    return () => {
      document.removeEventListener("mousedown", handleDown)
      document.removeEventListener("keydown", handleEsc)
    }
  }, [onClose])

  const isStart = nodeType === "start"

  const item = (label: string, icon: React.ReactNode, onClick: () => void, danger = false) => (
    <button
      onClick={() => { onClick(); onClose() }}
      className={cn(
        "flex items-center gap-2.5 w-full px-3 py-1.5 text-xs transition-colors rounded",
        danger
          ? "text-destructive hover:bg-destructive/10"
          : "text-foreground hover:bg-muted",
      )}
    >
      <span className={danger ? "text-destructive" : "text-muted-foreground"}>{icon}</span>
      {label}
    </button>
  )

  return (
    <div
      ref={ref}
      className="absolute z-50 bg-popover border border-border rounded-xl shadow-xl py-1.5 px-1 min-w-[175px]"
      style={{ left: x, top: y }}
    >
      {!isStart && item("Configurar", <Settings2Icon size={13} />, onConfigure)}
      {item("Duplicar nó", <CopyIcon size={13} />, onDuplicate)}
      {item("Desconectar arestas", <UnlinkIcon size={13} />, onDisconnect)}
      {!isStart && (
        <>
          <div className="mx-2 my-1 border-t border-border" />
          {item("Excluir nó", <Trash2Icon size={13} />, onDelete, true)}
        </>
      )}
    </div>
  )
}
