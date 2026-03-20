"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Switch } from "@/components/ui/switch"
import { Label } from "@/components/ui/label"
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip"
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
  SaveIcon,
  CopyIcon,
  Trash2Icon,
  DownloadIcon,
  CheckIcon,
  PencilIcon,
  ChevronLeftIcon,
  GitBranchIcon,
  ListIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowAutomation } from "@/lib/automation-types"

interface AutomationToolbarProps {
  automation: WorkflowAutomation
  isDirty: boolean
  onSave: () => void
  onToggleActive: () => void
  onRename: (name: string) => void
  onDuplicate: () => void
  onDelete: () => void
  onExport: () => void
  onBack: () => void
  isSaving?: boolean
  view?: "flow" | "logs"
  onViewChange?: (view: "flow" | "logs") => void
}

export function AutomationToolbar({
  automation,
  isDirty,
  onSave,
  onToggleActive,
  onRename,
  onDuplicate,
  onDelete,
  onExport,
  onBack,
  isSaving,
  view = "flow",
  onViewChange,
}: AutomationToolbarProps) {
  const [editing, setEditing] = useState(false)
  const [nameValue, setNameValue] = useState(automation.name)
  const [confirmDelete, setConfirmDelete] = useState(false)

  function handleRenameSubmit() {
    if (nameValue.trim() && nameValue.trim() !== automation.name) {
      onRename(nameValue.trim())
    }
    setEditing(false)
  }

  return (
    <TooltipProvider delayDuration={400}>
      <div className="flex items-center gap-2 px-4 py-2 bg-card border-b border-border z-10 shrink-0">
        {/* Back */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="ghost" size="icon" className="h-8 w-8 shrink-0" onClick={onBack}>
              <ChevronLeftIcon size={16} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Voltar</TooltipContent>
        </Tooltip>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        {/* Nome */}
        {editing ? (
          <form
            onSubmit={(e) => { e.preventDefault(); handleRenameSubmit() }}
            className="flex items-center gap-1.5"
          >
            <Input
              value={nameValue}
              onChange={(e) => setNameValue(e.target.value)}
              className="h-7 text-sm w-48"
              autoFocus
              onBlur={handleRenameSubmit}
            />
            <Button type="submit" size="icon" variant="ghost" className="h-7 w-7">
              <CheckIcon size={13} />
            </Button>
          </form>
        ) : (
          <button
            onClick={() => { setEditing(true); setNameValue(automation.name) }}
            className="flex items-center gap-1.5 group"
          >
            <span className="text-sm font-semibold text-foreground">
              {automation.name}
              {isDirty && <span className="text-muted-foreground ml-0.5">*</span>}
            </span>
            <PencilIcon size={11} className="text-muted-foreground/40 group-hover:text-muted-foreground transition-colors" />
          </button>
        )}

        {/* View toggle */}
        {onViewChange && (
          <div className="flex items-center gap-0.5 bg-muted rounded-lg p-0.5 mx-2">
            <button
              onClick={() => onViewChange("flow")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all",
                view === "flow"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <GitBranchIcon size={12} />
              Fluxo
            </button>
            <button
              onClick={() => onViewChange("logs")}
              className={cn(
                "flex items-center gap-1.5 px-2.5 py-1 rounded text-xs font-medium transition-all",
                view === "logs"
                  ? "bg-card text-foreground shadow-sm"
                  : "text-muted-foreground hover:text-foreground",
              )}
            >
              <ListIcon size={12} />
              Logs
            </button>
          </div>
        )}

        <div className="flex-1" />

        {/* Toggle ativo */}
        <div className="flex items-center gap-2">
          <Switch
            checked={automation.isActive}
            onCheckedChange={onToggleActive}
            className="scale-90"
          />
          <Label className={cn("text-xs cursor-pointer select-none", automation.isActive ? "text-emerald-500 font-medium" : "text-muted-foreground")}>
            {automation.isActive ? "Ativo" : "Inativo"}
          </Label>
        </div>

        <div className="w-px h-5 bg-border mx-1 shrink-0" />

        {/* Salvar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              size="sm"
              onClick={onSave}
              disabled={!isDirty || isSaving}
              className={cn("h-8 gap-1.5 text-xs", isDirty && "border-primary")}
            >
              <SaveIcon size={13} />
              {isSaving ? "Salvando..." : "Salvar"}
            </Button>
          </TooltipTrigger>
          <TooltipContent>Salvar (Ctrl+S)</TooltipContent>
        </Tooltip>

        {/* Duplicar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onDuplicate}>
              <CopyIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Duplicar automação</TooltipContent>
        </Tooltip>

        {/* Exportar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button variant="outline" size="icon" className="h-8 w-8" onClick={onExport}>
              <DownloadIcon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Exportar JSON</TooltipContent>
        </Tooltip>

        {/* Deletar */}
        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="outline"
              size="icon"
              className="h-8 w-8 text-destructive hover:bg-destructive hover:text-destructive-foreground"
              onClick={() => setConfirmDelete(true)}
            >
              <Trash2Icon size={14} />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Deletar automação</TooltipContent>
        </Tooltip>

        {/* Confirm delete */}
        <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
          <AlertDialogContent>
            <AlertDialogHeader>
              <AlertDialogTitle>Deletar automação?</AlertDialogTitle>
              <AlertDialogDescription>
                A automação <strong>{automation.name}</strong> e todos os logs serão removidos permanentemente.
              </AlertDialogDescription>
            </AlertDialogHeader>
            <AlertDialogFooter>
              <AlertDialogCancel>Cancelar</AlertDialogCancel>
              <AlertDialogAction
                onClick={() => { setConfirmDelete(false); onDelete() }}
                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              >
                Deletar
              </AlertDialogAction>
            </AlertDialogFooter>
          </AlertDialogContent>
        </AlertDialog>
      </div>
    </TooltipProvider>
  )
}
