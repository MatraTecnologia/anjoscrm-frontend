"use client"

import { useState } from "react"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"
import {
  TRIGGER_CATEGORIES,
  type TriggerCategoryDef,
  type TriggerDefinition,
} from "@/lib/automation-types"
import {
  BriefcaseIcon,
  UserIcon,
  MessageCircleIcon,
  WebhookIcon,
  SettingsIcon,
  ActivityIcon,
  SearchIcon,
  ChevronRightIcon,
} from "lucide-react"

interface TriggerSelectModalProps {
  open: boolean
  onClose: () => void
  onSelect: (trigger: TriggerDefinition) => void
}

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  "Negócios": <BriefcaseIcon size={14} />,
  "Leads": <UserIcon size={14} />,
  "Mensagens": <MessageCircleIcon size={14} />,
  "HTTP": <WebhookIcon size={14} />,
  "Sistema": <SettingsIcon size={14} />,
  "Atividades": <ActivityIcon size={14} />,
}

export function TriggerSelectModal({ open, onClose, onSelect }: TriggerSelectModalProps) {
  const [selectedCategory, setSelectedCategory] = useState<TriggerCategoryDef>(TRIGGER_CATEGORIES[0])
  const [search, setSearch] = useState("")

  const filteredTriggers = selectedCategory.triggers.filter(
    (t) =>
      !search ||
      t.label.toLowerCase().includes(search.toLowerCase()) ||
      t.description.toLowerCase().includes(search.toLowerCase()),
  )

  function handleSelect(trigger: TriggerDefinition) {
    onSelect(trigger)
    onClose()
    setSearch("")
  }

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl p-0 gap-0 overflow-hidden">
        <DialogHeader className="px-5 pt-5 pb-3 border-b border-border">
          <DialogTitle className="text-base">Escolher gatilho</DialogTitle>
          <div className="relative mt-2">
            <SearchIcon size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Buscar gatilho..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-8 h-8 text-sm"
            />
          </div>
        </DialogHeader>

        <div className="flex h-[380px]">
          {/* Categorias */}
          <div className="w-44 border-r border-border shrink-0 overflow-y-auto py-2">
            {TRIGGER_CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                onClick={() => { setSelectedCategory(cat); setSearch("") }}
                className={cn(
                  "w-full flex items-center gap-2.5 px-3 py-2 text-sm text-left transition-colors",
                  selectedCategory.id === cat.id
                    ? "bg-primary/10 text-primary font-medium"
                    : "text-muted-foreground hover:bg-muted/60 hover:text-foreground",
                )}
              >
                <span className={cn("shrink-0", cat.color)}>
                  {CATEGORY_ICONS[cat.id]}
                </span>
                <span className="truncate">{cat.label}</span>
              </button>
            ))}
          </div>

          {/* Gatilhos */}
          <div className="flex-1 overflow-y-auto p-3 space-y-1">
            {filteredTriggers.length === 0 ? (
              <div className="flex items-center justify-center h-full text-sm text-muted-foreground">
                Nenhum gatilho encontrado
              </div>
            ) : (
              filteredTriggers.map((trigger) => (
                <button
                  key={trigger.id}
                  onClick={() => handleSelect(trigger)}
                  className="w-full flex items-start justify-between gap-3 p-3 rounded-lg text-left border border-transparent hover:border-border hover:bg-muted/50 transition-all group"
                >
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-foreground group-hover:text-primary transition-colors">
                      {trigger.label}
                    </p>
                    <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                      {trigger.description}
                    </p>
                  </div>
                  <ChevronRightIcon
                    size={14}
                    className="text-muted-foreground/40 group-hover:text-primary transition-colors shrink-0 mt-0.5"
                  />
                </button>
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
