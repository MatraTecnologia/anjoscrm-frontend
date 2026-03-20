"use client"

import { useState, useEffect, useCallback } from "react"
import {
  CheckCircle2Icon,
  XCircleIcon,
  AlertCircleIcon,
  LoaderIcon,
  RefreshCwIcon,
  ChevronDownIcon,
  ChevronRightIcon,
  ZapIcon,
  ClockIcon,
  UserIcon,
  CalendarIcon,
  InfoIcon,
  LightbulbIcon,
  FilterIcon,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"
import { api } from "@/lib/api"
import { getTriggerById } from "@/lib/automation-types"

// ─── Types ────────────────────────────────────────────────────────────────────

interface StepResult {
  nodeId: string
  nodeType: string
  label?: string
  status: "success" | "error" | "warning" | "skipped"
  input?: Record<string, unknown>
  output?: Record<string, unknown>
  error?: string
  errorCode?: string
  suggestion?: string
  duration?: number
  timestamp?: string
}

interface LogLead {
  name?: string
  phone?: string
  email?: string
}

interface LogDeal {
  title?: string
  stage?: string
}

interface WorkflowLog {
  id: string
  automationId: string
  triggerType: string
  status: "running" | "success" | "error" | "partial"
  leadId?: string
  dealId?: string
  data?: {
    lead?: LogLead
    deal?: LogDeal
    steps?: StepResult[]
  }
  error?: string
  startedAt: string
  finishedAt?: string
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function duration(start: string, end?: string): string {
  if (!end) return "—"
  const ms = new Date(end).getTime() - new Date(start).getTime()
  if (ms < 1000) return `${ms}ms`
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`
  return `${Math.round(ms / 60000)}min`
}

function relativeTime(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  if (diff < 60000) return "agora"
  if (diff < 3600000) return `${Math.round(diff / 60000)}min atrás`
  if (diff < 86400000) return `${Math.round(diff / 3600000)}h atrás`
  return new Date(iso).toLocaleDateString("pt-BR")
}

function formatDateTime(iso: string): string {
  return new Date(iso).toLocaleString("pt-BR", {
    day: "2-digit", month: "2-digit", year: "numeric",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  })
}

type LogStatus = WorkflowLog["status"]

const STATUS_CONFIG: Record<LogStatus, { icon: React.ReactNode; label: string; className: string; dotClass: string }> = {
  success: {
    icon: <CheckCircle2Icon size={14} />,
    label: "Sucesso",
    className: "text-emerald-600 dark:text-emerald-400",
    dotClass: "bg-emerald-500",
  },
  error: {
    icon: <XCircleIcon size={14} />,
    label: "Erro",
    className: "text-red-600 dark:text-red-400",
    dotClass: "bg-red-500",
  },
  partial: {
    icon: <AlertCircleIcon size={14} />,
    label: "Parcial",
    className: "text-amber-600 dark:text-amber-400",
    dotClass: "bg-amber-500",
  },
  running: {
    icon: <LoaderIcon size={14} className="animate-spin" />,
    label: "Executando",
    className: "text-blue-600 dark:text-blue-400",
    dotClass: "bg-blue-500",
  },
}

type StepStatus = StepResult["status"]

const STEP_CONFIG: Record<StepStatus, { color: string; bg: string; badge: string }> = {
  success: { color: "bg-emerald-500", bg: "bg-emerald-50 dark:bg-emerald-950/30", badge: "text-emerald-700 bg-emerald-100 dark:text-emerald-300 dark:bg-emerald-900/40" },
  error: { color: "bg-red-500", bg: "bg-red-50 dark:bg-red-950/30", badge: "text-red-700 bg-red-100 dark:text-red-300 dark:bg-red-900/40" },
  warning: { color: "bg-amber-500", bg: "bg-amber-50 dark:bg-amber-950/30", badge: "text-amber-700 bg-amber-100 dark:text-amber-300 dark:bg-amber-900/40" },
  skipped: { color: "bg-slate-300", bg: "bg-slate-50 dark:bg-slate-900/30", badge: "text-slate-500 bg-slate-100 dark:text-slate-400 dark:bg-slate-800/40" },
}

const NODE_TYPE_LABEL: Record<string, string> = {
  start: "Gatilho", message: "Mensagem", wait: "Espera",
  condition: "Condição", action: "Ação", ai: "IA",
  api: "API", field_ops: "Campos", randomizer: "Randomizador", javascript: "JavaScript",
}

// ─── Step detail (expandable) ─────────────────────────────────────────────────

function StepCard({ step, index }: { step: StepResult; index: number }) {
  const [open, setOpen] = useState(step.status === "error")
  const cfg = STEP_CONFIG[step.status]

  return (
    <div className={cn("rounded-xl border border-border overflow-hidden", open && cfg.bg)}>
      {/* Step header */}
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex items-center gap-3 w-full px-4 py-3 hover:bg-muted/40 transition-colors text-left"
      >
        {/* Step number + status bar */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] text-muted-foreground/60 font-mono w-4 text-right">{index + 1}</span>
          <div className={cn("w-1.5 h-8 rounded-full shrink-0", cfg.color)} />
        </div>

        {/* Node info */}
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-xs font-semibold text-foreground truncate">
              {step.label ?? NODE_TYPE_LABEL[step.nodeType] ?? step.nodeType}
            </span>
            <span className={cn("inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium shrink-0", cfg.badge)}>
              {step.status === "success" ? "Sucesso" : step.status === "error" ? "Erro" : step.status === "warning" ? "Alerta" : "Ignorado"}
            </span>
          </div>
          {step.error && !open && (
            <p className="text-[10px] text-red-500 truncate mt-0.5">{step.error}</p>
          )}
        </div>

        {/* Duration + expand */}
        <div className="flex items-center gap-2 shrink-0">
          {step.duration != null && (
            <span className="text-[10px] text-muted-foreground">{step.duration}ms</span>
          )}
          {open ? <ChevronDownIcon size={13} className="text-muted-foreground" /> : <ChevronRightIcon size={13} className="text-muted-foreground" />}
        </div>
      </button>

      {/* Expanded content */}
      {open && (
        <div className="px-4 pb-4 space-y-3 border-t border-border/50">
          {/* Error block */}
          {step.status === "error" && step.error && (
            <div className="mt-3 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/60 p-4 space-y-3">
              <div className="flex items-start gap-2">
                <XCircleIcon size={15} className="text-red-500 shrink-0 mt-0.5" />
                <div className="flex-1 min-w-0">
                  <p className="text-xs font-semibold text-red-700 dark:text-red-300">Erro na execução</p>
                  {step.errorCode && (
                    <code className="text-[10px] text-red-500 font-mono">{step.errorCode}</code>
                  )}
                </div>
              </div>

              <div className="bg-red-100/60 dark:bg-red-900/30 rounded-lg px-3 py-2.5">
                <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed font-mono whitespace-pre-wrap">
                  {step.error}
                </p>
              </div>

              {step.suggestion && (
                <div className="flex items-start gap-2 bg-amber-50 dark:bg-amber-950/30 rounded-lg px-3 py-2.5 border border-amber-200/50 dark:border-amber-800/50">
                  <LightbulbIcon size={13} className="text-amber-500 shrink-0 mt-0.5" />
                  <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">
                    <span className="font-semibold">Possível solução: </span>{step.suggestion}
                  </p>
                </div>
              )}
            </div>
          )}

          {/* Warning block */}
          {step.status === "warning" && step.error && (
            <div className="mt-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200/60 dark:border-amber-800/60 p-3">
              <div className="flex items-start gap-2">
                <AlertCircleIcon size={14} className="text-amber-500 shrink-0 mt-0.5" />
                <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed">{step.error}</p>
              </div>
            </div>
          )}

          {/* Input */}
          {step.input && Object.keys(step.input).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Entrada</p>
              <pre className="text-[10px] font-mono bg-muted/60 rounded-lg px-3 py-2.5 overflow-x-auto text-foreground/80 leading-relaxed">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}

          {/* Output */}
          {step.output && Object.keys(step.output).length > 0 && (
            <div className="space-y-1">
              <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Saída</p>
              <pre className="text-[10px] font-mono bg-muted/60 rounded-lg px-3 py-2.5 overflow-x-auto text-foreground/80 leading-relaxed">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  )
}

// ─── Execution Detail ─────────────────────────────────────────────────────────

function ExecutionDetail({ log }: { log: WorkflowLog }) {
  const status = STATUS_CONFIG[log.status]
  const steps = log.data?.steps ?? []
  const lead = log.data?.lead
  const deal = log.data?.deal
  const triggerDef = getTriggerById(log.triggerType)

  return (
    <div className="flex flex-col h-full">
      {/* Summary header */}
      <div className="px-5 py-4 border-b border-border shrink-0 space-y-3">
        <div className="flex items-center justify-between">
          <div className={cn("flex items-center gap-1.5 text-sm font-semibold", status.className)}>
            {status.icon}
            {status.label}
          </div>
          <span className="text-[10px] text-muted-foreground font-mono">{log.id.slice(0, 12)}…</span>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <InfoChip icon={<ZapIcon size={11} />} label="Gatilho" value={triggerDef?.label ?? log.triggerType} />
          <InfoChip icon={<ClockIcon size={11} />} label="Duração" value={duration(log.startedAt, log.finishedAt)} />
          <InfoChip icon={<CalendarIcon size={11} />} label="Iniciado em" value={formatDateTime(log.startedAt)} />
          {lead?.name && <InfoChip icon={<UserIcon size={11} />} label="Lead" value={lead.name} />}
          {deal?.title && <InfoChip icon={<ZapIcon size={11} />} label="Negócio" value={deal.title} />}
        </div>
      </div>

      {/* Top-level error */}
      {log.status === "error" && log.error && !steps.some((s) => s.status === "error") && (
        <div className="mx-5 mt-4 rounded-xl bg-red-50 dark:bg-red-950/40 border border-red-200/60 dark:border-red-800/60 p-4">
          <div className="flex items-start gap-2">
            <XCircleIcon size={15} className="text-red-500 shrink-0 mt-0.5" />
            <div>
              <p className="text-xs font-semibold text-red-700 dark:text-red-300 mb-1">Erro na automação</p>
              <p className="text-xs text-red-800 dark:text-red-200 leading-relaxed font-mono whitespace-pre-wrap">{log.error}</p>
            </div>
          </div>
        </div>
      )}

      {/* Steps */}
      <div className="flex-1 overflow-y-auto px-5 py-4">
        {steps.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <InfoIcon size={28} className="text-muted-foreground/30 mb-3" />
            <p className="text-xs text-muted-foreground">Nenhum detalhe de etapa registrado.</p>
            <p className="text-[10px] text-muted-foreground/60 mt-1">
              Os workers precisam registrar steps em <code>data.steps</code>.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide mb-3">
              {steps.length} etapa{steps.length !== 1 ? "s" : ""} executada{steps.length !== 1 ? "s" : ""}
            </p>
            {steps.map((step, i) => (
              <StepCard key={step.nodeId + i} step={step} index={i} />
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function InfoChip({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="flex items-start gap-1.5">
      <span className="text-muted-foreground/60 mt-0.5 shrink-0">{icon}</span>
      <div className="min-w-0">
        <p className="text-[9px] font-semibold text-muted-foreground uppercase tracking-wide leading-none">{label}</p>
        <p className="text-[11px] text-foreground font-medium mt-0.5 truncate">{value}</p>
      </div>
    </div>
  )
}

// ─── Execution List Item ──────────────────────────────────────────────────────

function LogItem({ log, selected, onClick }: { log: WorkflowLog; selected: boolean; onClick: () => void }) {
  const status = STATUS_CONFIG[log.status]
  const steps = log.data?.steps ?? []
  const lead = log.data?.lead
  const dur = duration(log.startedAt, log.finishedAt)

  return (
    <button
      onClick={onClick}
      className={cn(
        "w-full flex items-start gap-3 px-4 py-3 text-left transition-colors border-b border-border/50",
        selected ? "bg-primary/5 border-l-2 border-l-primary" : "hover:bg-muted/40",
      )}
    >
      {/* Status dot */}
      <div className={cn("w-2 h-2 rounded-full shrink-0 mt-1.5", status.dotClass)} />

      <div className="flex-1 min-w-0 space-y-0.5">
        {/* Lead name + status */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-xs font-semibold text-foreground truncate">
            {lead?.name ?? "Execução sem lead"}
          </span>
          <span className={cn("text-[10px] font-medium shrink-0", status.className)}>
            {status.label}
          </span>
        </div>

        {/* Trigger + duration */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground truncate">
            {getTriggerById(log.triggerType)?.label ?? log.triggerType}
          </span>
          <span className="text-[10px] text-muted-foreground shrink-0">{dur}</span>
        </div>

        {/* Timestamp + steps count */}
        <div className="flex items-center justify-between gap-2">
          <span className="text-[10px] text-muted-foreground/60">{relativeTime(log.startedAt)}</span>
          {steps.length > 0 && (
            <span className="text-[10px] text-muted-foreground/60">{steps.length} etapa{steps.length !== 1 ? "s" : ""}</span>
          )}
        </div>
      </div>
    </button>
  )
}

// ─── Filter tabs ──────────────────────────────────────────────────────────────

type FilterStatus = "all" | LogStatus

const FILTERS: { value: FilterStatus; label: string }[] = [
  { value: "all", label: "Todos" },
  { value: "success", label: "Sucesso" },
  { value: "error", label: "Erro" },
  { value: "partial", label: "Parcial" },
  { value: "running", label: "Rodando" },
]

// ─── Main Logs Component ──────────────────────────────────────────────────────

interface AutomationLogsProps {
  automationId: string
  enterpriseId?: string
}

export function AutomationLogs({ automationId, enterpriseId }: AutomationLogsProps) {
  const [logs, setLogs] = useState<WorkflowLog[]>([])
  const [selected, setSelected] = useState<WorkflowLog | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [filter, setFilter] = useState<FilterStatus>("all")

  const headers = enterpriseId ? { "X-Enterprise-Id": enterpriseId } : {}

  const fetchLogs = useCallback(async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await api.get(`/automations/${automationId}/logs?limit=50`, { headers })
      const data = res.data?.logs ?? res.data ?? []
      setLogs(data)
      if (data.length > 0 && !selected) setSelected(data[0])
    } catch (e: unknown) {
      const msg = e instanceof Error ? e.message : "Erro ao carregar logs"
      setError(msg)
    } finally {
      setLoading(false)
    }
  }, [automationId])

  useEffect(() => { fetchLogs() }, [fetchLogs])

  const filtered = filter === "all" ? logs : logs.filter((l) => l.status === filter)

  const counts: Partial<Record<FilterStatus, number>> = {
    all: logs.length,
    success: logs.filter((l) => l.status === "success").length,
    error: logs.filter((l) => l.status === "error").length,
    partial: logs.filter((l) => l.status === "partial").length,
    running: logs.filter((l) => l.status === "running").length,
  }

  return (
    <div className="flex flex-1 min-h-0">
      {/* ── Left: execution list ─────────────────────────────── */}
      <div className="w-[300px] shrink-0 flex flex-col border-r border-border">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-border shrink-0">
          <h3 className="text-xs font-semibold text-foreground">Histórico de execuções</h3>
          <Button
            variant="ghost"
            size="icon"
            className="h-6 w-6"
            onClick={fetchLogs}
            disabled={loading}
          >
            <RefreshCwIcon size={12} className={cn(loading && "animate-spin")} />
          </Button>
        </div>

        {/* Filter tabs */}
        <div className="flex items-center gap-0.5 px-2 py-2 border-b border-border shrink-0 overflow-x-auto">
          {FILTERS.filter((f) => f.value === "all" || (counts[f.value] ?? 0) > 0).map((f) => (
            <button
              key={f.value}
              onClick={() => setFilter(f.value)}
              className={cn(
                "flex items-center gap-1 px-2 py-1 rounded text-[10px] font-medium whitespace-nowrap transition-colors shrink-0",
                filter === f.value
                  ? "bg-primary/10 text-primary"
                  : "text-muted-foreground hover:text-foreground hover:bg-muted",
              )}
            >
              {f.value !== "all" && (
                <span className={cn(
                  "w-1.5 h-1.5 rounded-full",
                  f.value === "success" ? "bg-emerald-500" :
                  f.value === "error" ? "bg-red-500" :
                  f.value === "partial" ? "bg-amber-500" : "bg-blue-500",
                )} />
              )}
              {f.label}
              {(counts[f.value] ?? 0) > 0 && (
                <span className="text-muted-foreground/60">{counts[f.value]}</span>
              )}
            </button>
          ))}
        </div>

        {/* List */}
        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="flex flex-col gap-2 p-4">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg bg-muted animate-pulse" />
              ))}
            </div>
          ) : error ? (
            <div className="flex flex-col items-center justify-center py-10 px-4 text-center">
              <XCircleIcon size={24} className="text-red-400 mb-2" />
              <p className="text-xs text-muted-foreground">{error}</p>
              <Button variant="outline" size="sm" className="mt-3 h-7 text-xs" onClick={fetchLogs}>
                Tentar novamente
              </Button>
            </div>
          ) : filtered.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
              <FilterIcon size={24} className="text-muted-foreground/30 mb-3" />
              <p className="text-xs font-medium text-muted-foreground">
                {logs.length === 0 ? "Nenhuma execução registrada" : "Nenhum resultado para este filtro"}
              </p>
              <p className="text-[10px] text-muted-foreground/60 mt-1">
                {logs.length === 0
                  ? "Ative a automação para começar a registrar execuções."
                  : "Tente um filtro diferente."}
              </p>
            </div>
          ) : (
            filtered.map((log) => (
              <LogItem
                key={log.id}
                log={log}
                selected={selected?.id === log.id}
                onClick={() => setSelected(log)}
              />
            ))
          )}
        </div>

        {/* Footer count */}
        {!loading && logs.length > 0 && (
          <div className="px-4 py-2 border-t border-border shrink-0">
            <p className="text-[10px] text-muted-foreground">{logs.length} execuções · últimas 50</p>
          </div>
        )}
      </div>

      {/* ── Right: execution detail ──────────────────────────── */}
      <div className="flex-1 overflow-hidden">
        {selected ? (
          <ExecutionDetail log={selected} />
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center px-8">
            <div className="w-14 h-14 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <ZapIcon size={22} className="text-muted-foreground/40" />
            </div>
            <p className="text-sm font-medium text-muted-foreground">Selecione uma execução</p>
            <p className="text-xs text-muted-foreground/60 mt-1">
              Clique em uma execução para ver todos os detalhes, incluindo entradas, saídas e erros de cada etapa.
            </p>
          </div>
        )}
      </div>
    </div>
  )
}
