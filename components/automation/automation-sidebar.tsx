"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  PlusIcon,
  SearchIcon,
  MoreHorizontalIcon,
  CopyIcon,
  Trash2Icon,
  PencilIcon,
  ZapIcon,
  ZapOffIcon,
  ChevronDownIcon,
  ChevronRightIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowAutomation } from "@/lib/automation-types"

interface AutomationSidebarProps {
  automations: WorkflowAutomation[]
  selectedId: string | null
  onSelect: (id: string) => void
  onCreate: (name: string, category: string) => void
  onDuplicate: (id: string) => void
  onDelete: (id: string) => void
  onToggle: (id: string) => void
}

const CATEGORIES = ["Geral", "Vendas", "Marketing", "Suporte", "Onboarding", "Pós-venda"]

export function AutomationSidebar({
  automations,
  selectedId,
  onSelect,
  onCreate,
  onDuplicate,
  onDelete,
  onToggle,
}: AutomationSidebarProps) {
  const [search, setSearch] = useState("")
  const [openCategories, setOpenCategories] = useState<Set<string>>(new Set(["Geral", "Vendas", "Marketing", "Suporte"]))
  const [createOpen, setCreateOpen] = useState(false)
  const [newName, setNewName] = useState("")
  const [newCategory, setNewCategory] = useState("Geral")
  const [deleteId, setDeleteId] = useState<string | null>(null)

  const filtered = automations.filter(
    (a) => !search || a.name.toLowerCase().includes(search.toLowerCase()),
  )

  const grouped = filtered.reduce<Record<string, WorkflowAutomation[]>>((acc, a) => {
    const cat = a.category ?? "Geral"
    if (!acc[cat]) acc[cat] = []
    acc[cat].push(a)
    return acc
  }, {})

  const deleteTarget = automations.find((a) => a.id === deleteId)

  function toggleCategory(cat: string) {
    setOpenCategories((prev) => {
      const next = new Set(prev)
      if (next.has(cat)) next.delete(cat)
      else next.add(cat)
      return next
    })
  }

  function handleCreate() {
    if (!newName.trim()) return
    onCreate(newName.trim(), newCategory)
    setNewName("")
    setNewCategory("Geral")
    setCreateOpen(false)
  }

  return (
    <div className="flex flex-col h-full bg-sidebar border-r border-border w-[260px] shrink-0">
      {/* Header */}
      <div className="px-4 pt-4 pb-3 space-y-3">
        <div className="flex items-center justify-between">
          <h2 className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">
            Automações
          </h2>
          <Button
            size="icon"
            variant="ghost"
            className="h-6 w-6"
            onClick={() => setCreateOpen(true)}
          >
            <PlusIcon size={14} />
          </Button>
        </div>
        <div className="relative">
          <SearchIcon size={12} className="absolute left-2.5 top-1/2 -translate-y-1/2 text-muted-foreground" />
          <Input
            placeholder="Buscar..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-7 h-7 text-xs bg-muted/40"
          />
        </div>
      </div>

      {/* Lista */}
      <div className="flex-1 overflow-y-auto px-2 pb-4">
        {Object.keys(grouped).length === 0 ? (
          <div className="flex flex-col items-center justify-center py-10 text-center px-4">
            <ZapIcon size={28} className="text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">Nenhuma automação encontrada</p>
            <Button
              size="sm"
              variant="outline"
              className="mt-3 h-7 text-xs"
              onClick={() => setCreateOpen(true)}
            >
              <PlusIcon size={11} className="mr-1" />
              Criar automação
            </Button>
          </div>
        ) : (
          Object.entries(grouped).map(([category, items]) => (
            <div key={category} className="mb-1">
              <button
                onClick={() => toggleCategory(category)}
                className="flex items-center gap-1.5 w-full px-2 py-1.5 text-[11px] font-semibold text-muted-foreground hover:text-foreground uppercase tracking-wide transition-colors"
              >
                {openCategories.has(category) ? (
                  <ChevronDownIcon size={11} />
                ) : (
                  <ChevronRightIcon size={11} />
                )}
                {category}
                <span className="ml-auto text-[10px] font-normal text-muted-foreground/60">
                  {items.length}
                </span>
              </button>

              {openCategories.has(category) && (
                <div className="space-y-0.5">
                  {items.map((auto) => (
                    <AutomationItem
                      key={auto.id}
                      automation={auto}
                      isSelected={auto.id === selectedId}
                      onSelect={() => onSelect(auto.id)}
                      onDuplicate={() => onDuplicate(auto.id)}
                      onDelete={() => setDeleteId(auto.id)}
                      onToggle={() => onToggle(auto.id)}
                    />
                  ))}
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Modal criar */}
      <Dialog open={createOpen} onOpenChange={setCreateOpen}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="text-sm">Nova automação</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-1.5">
              <Label className="text-xs">Nome</Label>
              <Input
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                placeholder="Ex: Follow-up de inativos"
                className="h-8 text-sm"
                autoFocus
                onKeyDown={(e) => e.key === "Enter" && handleCreate()}
              />
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Categoria</Label>
              <Select value={newCategory} onValueChange={setNewCategory}>
                <SelectTrigger className="h-8 text-sm">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c} value={c}>{c}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" size="sm" onClick={() => setCreateOpen(false)}>
              Cancelar
            </Button>
            <Button size="sm" onClick={handleCreate} disabled={!newName.trim()}>
              Criar
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Confirm delete */}
      <AlertDialog open={!!deleteId} onOpenChange={() => setDeleteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deletar automação?</AlertDialogTitle>
            <AlertDialogDescription>
              <strong>{deleteTarget?.name}</strong> será removida permanentemente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => { if (deleteId) onDelete(deleteId); setDeleteId(null) }}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Deletar
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

function AutomationItem({
  automation,
  isSelected,
  onSelect,
  onDuplicate,
  onDelete,
  onToggle,
}: {
  automation: WorkflowAutomation
  isSelected: boolean
  onSelect: () => void
  onDuplicate: () => void
  onDelete: () => void
  onToggle: () => void
}) {
  return (
    <div
      className={cn(
        "group flex items-center gap-2 px-2 py-2 rounded-lg cursor-pointer transition-all",
        isSelected
          ? "bg-primary/10 text-primary"
          : "hover:bg-muted/60 text-muted-foreground hover:text-foreground",
      )}
      onClick={onSelect}
    >
      {/* Status dot */}
      <div
        className={cn(
          "w-1.5 h-1.5 rounded-full shrink-0 mt-0.5",
          automation.isActive ? "bg-emerald-500" : "bg-muted-foreground/30",
        )}
      />

      <span className={cn("text-xs flex-1 truncate font-medium", isSelected && "text-primary")}>
        {automation.name}
      </span>

      {/* Mais opções */}
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            size="icon"
            className="h-5 w-5 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
            onClick={(e) => e.stopPropagation()}
          >
            <MoreHorizontalIcon size={12} />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end" className="text-xs w-40">
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onToggle() }}>
            {automation.isActive ? (
              <><ZapOffIcon size={12} className="mr-2" />Desativar</>
            ) : (
              <><ZapIcon size={12} className="mr-2" />Ativar</>
            )}
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onSelect() }}>
            <PencilIcon size={12} className="mr-2" />
            Editar
          </DropdownMenuItem>
          <DropdownMenuItem onClick={(e) => { e.stopPropagation(); onDuplicate() }}>
            <CopyIcon size={12} className="mr-2" />
            Duplicar
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={(e) => { e.stopPropagation(); onDelete() }}
            className="text-destructive focus:text-destructive"
          >
            <Trash2Icon size={12} className="mr-2" />
            Deletar
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  )
}
