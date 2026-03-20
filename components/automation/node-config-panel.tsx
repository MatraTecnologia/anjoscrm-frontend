"use client"

import { useState, useEffect, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Textarea } from "@/components/ui/textarea"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import {
  XIcon,
  MessageCircleIcon,
  ClockIcon,
  FilterIcon,
  ZapIcon,
  BotIcon,
  GlobeIcon,
  Table2Icon,
  ShuffleIcon,
  CodeIcon,
  PlayIcon,
  CheckIcon,
  PlusIcon,
  Trash2Icon,
  type LucideIcon,
} from "lucide-react"
import { cn } from "@/lib/utils"
import type { WorkflowNode, NodeKind } from "@/lib/automation-types"

// ─── Helpers ──────────────────────────────────────────────────────────────────

function SectionHeader({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-2 pt-1 pb-0.5">
      <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider whitespace-nowrap">
        {children}
      </span>
      <div className="flex-1 h-px bg-border" />
    </div>
  )
}

function Field({ label, hint, children }: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="space-y-1.5">
      <Label className="text-xs font-medium">{label}</Label>
      {children}
      {hint && <p className="text-[10px] text-muted-foreground leading-relaxed">{hint}</p>}
    </div>
  )
}

// ─── Node Meta ────────────────────────────────────────────────────────────────

type NodeMeta = {
  title: string
  subtitle: string
  Icon: LucideIcon
  iconBg: string
  iconColor: string
  accentClass: string
}

const NODE_META: Record<NodeKind, NodeMeta> = {
  start: {
    title: "Gatilho de início",
    subtitle: "Define o evento que dispara a automação",
    Icon: PlayIcon,
    iconBg: "bg-emerald-100 dark:bg-emerald-950",
    iconColor: "text-emerald-600 dark:text-emerald-400",
    accentClass: "bg-emerald-500",
  },
  message: {
    title: "Enviar mensagem",
    subtitle: "Envia uma mensagem para o lead",
    Icon: MessageCircleIcon,
    iconBg: "bg-blue-100 dark:bg-blue-950",
    iconColor: "text-blue-600 dark:text-blue-400",
    accentClass: "bg-blue-500",
  },
  wait: {
    title: "Aguardar",
    subtitle: "Pausa o fluxo por um período de tempo",
    Icon: ClockIcon,
    iconBg: "bg-orange-100 dark:bg-orange-950",
    iconColor: "text-orange-600 dark:text-orange-400",
    accentClass: "bg-orange-500",
  },
  condition: {
    title: "Condição",
    subtitle: "Divide o fluxo com base em uma condição",
    Icon: FilterIcon,
    iconBg: "bg-yellow-100 dark:bg-yellow-950",
    iconColor: "text-yellow-600 dark:text-yellow-700",
    accentClass: "bg-yellow-500",
  },
  action: {
    title: "Ação",
    subtitle: "Executa uma ação no negócio ou lead",
    Icon: ZapIcon,
    iconBg: "bg-violet-100 dark:bg-violet-950",
    iconColor: "text-violet-600 dark:text-violet-400",
    accentClass: "bg-violet-500",
  },
  ai: {
    title: "Resposta via IA",
    subtitle: "Usa inteligência artificial para responder",
    Icon: BotIcon,
    iconBg: "bg-sky-100 dark:bg-sky-950",
    iconColor: "text-sky-600 dark:text-sky-400",
    accentClass: "bg-sky-500",
  },
  api: {
    title: "Requisição HTTP",
    subtitle: "Faz uma chamada para uma API externa",
    Icon: GlobeIcon,
    iconBg: "bg-slate-100 dark:bg-slate-800",
    iconColor: "text-slate-600 dark:text-slate-400",
    accentClass: "bg-slate-400",
  },
  field_ops: {
    title: "Operar campos",
    subtitle: "Atualiza campos do lead ou negócio",
    Icon: Table2Icon,
    iconBg: "bg-teal-100 dark:bg-teal-950",
    iconColor: "text-teal-600 dark:text-teal-400",
    accentClass: "bg-teal-500",
  },
  randomizer: {
    title: "Randomizador",
    subtitle: "Divide leads aleatoriamente em grupos",
    Icon: ShuffleIcon,
    iconBg: "bg-pink-100 dark:bg-pink-950",
    iconColor: "text-pink-600 dark:text-pink-400",
    accentClass: "bg-pink-500",
  },
  javascript: {
    title: "Código JavaScript",
    subtitle: "Executa lógica personalizada em JavaScript",
    Icon: CodeIcon,
    iconBg: "bg-amber-100 dark:bg-amber-950",
    iconColor: "text-amber-600 dark:text-amber-500",
    accentClass: "bg-amber-500",
  },
}

// ─── Panel ────────────────────────────────────────────────────────────────────

interface NodeConfigPanelProps {
  node: WorkflowNode | null
  onClose: () => void
  onSave: (nodeId: string, data: Record<string, unknown>) => void
}

export function NodeConfigPanel({ node, onClose, onSave }: NodeConfigPanelProps) {
  const [formData, setFormData] = useState<Record<string, unknown>>({})
  const [saved, setSaved] = useState(false)

  useEffect(() => {
    if (node) {
      setFormData({ ...node.data })
      setSaved(false)
    }
  }, [node?.id])

  if (!node) return null

  const kind = node.type as NodeKind
  const meta = NODE_META[kind]

  function set(key: string, value: unknown) {
    setFormData((prev) => ({ ...prev, [key]: value }))
    setSaved(false)
  }

  function handleSave() {
    onSave(node!.id, { ...formData, configured: true })
    setSaved(true)
    setTimeout(() => setSaved(false), 2500)
  }

  return (
    <div className="flex flex-col w-[370px] shrink-0 h-full bg-card border-l border-border overflow-hidden">
      {/* Accent bar */}
      <div className={cn("h-0.5 shrink-0 w-full", meta.accentClass)} />

      {/* Header */}
      <div className="flex items-center gap-3 px-4 py-3.5 border-b border-border shrink-0">
        <div className={cn(
          "flex items-center justify-center w-9 h-9 rounded-xl shrink-0 shadow-sm",
          meta.iconBg,
        )}>
          <meta.Icon size={15} className={meta.iconColor} />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-semibold text-foreground leading-none">{meta.title}</p>
          <p className="text-[11px] text-muted-foreground mt-0.5 truncate">{meta.subtitle}</p>
        </div>
        <button
          onClick={onClose}
          className="flex items-center justify-center w-7 h-7 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
        >
          <XIcon size={14} />
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        <div className="px-4 py-4 space-y-4">
          {kind === "message" && <MessageConfig data={formData} set={set} />}
          {kind === "wait" && <WaitConfig data={formData} set={set} />}
          {kind === "condition" && <ConditionConfig data={formData} set={set} />}
          {kind === "action" && <ActionConfig data={formData} set={set} />}
          {kind === "ai" && <AIConfig data={formData} set={set} />}
          {kind === "api" && <ApiConfig data={formData} set={set} />}
          {kind === "field_ops" && <FieldOpsConfig data={formData} set={set} />}
          {kind === "randomizer" && <RandomizerConfig data={formData} set={set} />}
          {kind === "javascript" && <JavaScriptConfig data={formData} set={set} />}
        </div>
      </div>

      {/* Footer */}
      <div className="px-4 py-3.5 border-t border-border shrink-0 bg-muted/20">
        <Button
          onClick={handleSave}
          className={cn(
            "w-full h-9 gap-2 text-sm font-medium",
            saved && "bg-emerald-600 hover:bg-emerald-700",
          )}
        >
          {saved
            ? (<><CheckIcon size={14} />Configurações salvas</>)
            : "Aplicar configurações"
          }
        </Button>
      </div>
    </div>
  )
}

// ─── Variable chips ───────────────────────────────────────────────────────────

const VARIABLES = [
  { key: "lead_name", label: "nome" },
  { key: "lead_email", label: "email" },
  { key: "lead_phone", label: "telefone" },
  { key: "deal_stage", label: "etapa" },
  { key: "pipeline_name", label: "funil" },
  { key: "agent_name", label: "atendente" },
  { key: "company_name", label: "empresa" },
]

// ─── Config Forms ─────────────────────────────────────────────────────────────

type ConfigProps = { data: Record<string, unknown>; set: (k: string, v: unknown) => void }

function MessageConfig({ data, set }: ConfigProps) {
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  function insertVariable(key: string) {
    const el = textareaRef.current
    const current = (data.templateMessage as string) ?? ""
    if (!el) {
      set("templateMessage", current + `{${key}}`)
      return
    }
    const start = el.selectionStart ?? current.length
    const end = el.selectionEnd ?? current.length
    const token = `{${key}}`
    set("templateMessage", current.slice(0, start) + token + current.slice(end))
    requestAnimationFrame(() => {
      el.focus()
      el.setSelectionRange(start + token.length, start + token.length)
    })
  }

  const isAI = data.messageType === "ai"

  return (
    <div className="space-y-4">
      <Field label="Tipo de mensagem">
        <Select
          value={(data.messageType as string) ?? "template"}
          onValueChange={(v) => set("messageType", v)}
        >
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="template">Mensagem template</SelectItem>
            <SelectItem value="ai">Resposta gerada por IA</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {!isAI ? (
        <>
          <Field label="Conteúdo da mensagem">
            <Textarea
              ref={textareaRef}
              value={(data.templateMessage as string) ?? ""}
              onChange={(e) => set("templateMessage", e.target.value)}
              placeholder={"Olá {lead_name}, tudo bem?\n\nTemos uma novidade para você!"}
              rows={6}
              className="text-sm resize-none leading-relaxed"
            />
          </Field>

          <div className="space-y-2">
            <SectionHeader>Inserir variável</SectionHeader>
            <div className="flex flex-wrap gap-1.5">
              {VARIABLES.map((v) => (
                <button
                  key={v.key}
                  type="button"
                  onClick={() => insertVariable(v.key)}
                  className="inline-flex items-center px-2 py-0.5 rounded-full bg-muted hover:bg-primary/10 hover:text-primary border border-border hover:border-primary/30 text-[10px] font-medium transition-all cursor-pointer select-none"
                >
                  {`{${v.label}}`}
                </button>
              ))}
            </div>
          </div>

          <Field label="Atraso antes de enviar" hint="0 = envia imediatamente">
            <div className="flex gap-2">
              <Input
                type="number"
                min={0}
                value={(data.sendDelay as number) ?? 0}
                onChange={(e) => set("sendDelay", Number(e.target.value))}
                className="h-8 text-sm w-20 shrink-0"
              />
              <Select
                value={(data.sendDelayUnit as string) ?? "minutes"}
                onValueChange={(v) => set("sendDelayUnit", v)}
              >
                <SelectTrigger className="h-8 text-sm flex-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="seconds">Segundos</SelectItem>
                  <SelectItem value="minutes">Minutos</SelectItem>
                  <SelectItem value="hours">Horas</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </Field>
        </>
      ) : (
        <Field
          label="Instrução adicional (opcional)"
          hint="O assistente de IA configurado na automação será usado como base. Esta instrução é aplicada somente nesta etapa."
        >
          <Textarea
            value={(data.promptOverride as string) ?? ""}
            onChange={(e) => set("promptOverride", e.target.value)}
            placeholder={"Ex: Responda de forma mais formal.\nFoque em apresentar o produto X."}
            rows={5}
            className="text-sm resize-none"
          />
        </Field>
      )}
    </div>
  )
}

function WaitConfig({ data, set }: ConfigProps) {
  const unit = (data.unit as string) ?? "hours"
  const duration = (data.duration as number) ?? 1
  const unitLabel = { minutes: "minuto(s)", hours: "hora(s)", days: "dia(s)" }[unit] ?? "hora(s)"

  return (
    <div className="space-y-4">
      <SectionHeader>Duração da espera</SectionHeader>
      <div className="flex gap-3">
        <Field label="Quantidade">
          <Input
            type="number"
            min={1}
            value={duration}
            onChange={(e) => set("duration", Number(e.target.value))}
            className="h-8 text-sm w-28"
          />
        </Field>
        <Field label="Unidade">
          <Select value={unit} onValueChange={(v) => set("unit", v)}>
            <SelectTrigger className="h-8 text-sm min-w-[110px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="minutes">Minutos</SelectItem>
              <SelectItem value="hours">Horas</SelectItem>
              <SelectItem value="days">Dias</SelectItem>
            </SelectContent>
          </Select>
        </Field>
      </div>
      <div className="rounded-lg bg-muted/50 border border-border px-3 py-2.5">
        <p className="text-[11px] text-muted-foreground">
          O fluxo aguardará{" "}
          <span className="font-semibold text-foreground">{duration} {unitLabel}</span>{" "}
          antes de continuar para o próximo passo.
        </p>
      </div>
    </div>
  )
}

function ConditionConfig({ data, set }: ConfigProps) {
  const operator = (data.operator as string) ?? "equals"
  const hideValue = ["is_empty", "is_not_empty"].includes(operator)

  return (
    <div className="space-y-4">
      <SectionHeader>Configurar condição</SectionHeader>

      <Field label="Campo a verificar">
        <Select value={(data.field as string) ?? ""} onValueChange={(v) => set("field", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue placeholder="Selecione um campo" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="lead_name">Nome do lead</SelectItem>
            <SelectItem value="lead_tag">Tag do lead</SelectItem>
            <SelectItem value="lead_email">Email do lead</SelectItem>
            <SelectItem value="deal_stage">Etapa do negócio</SelectItem>
            <SelectItem value="deal_value">Valor do negócio</SelectItem>
            <SelectItem value="last_message_days">Dias sem mensagem</SelectItem>
            <SelectItem value="attendant">Atendente responsável</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      <Field label="Operador">
        <Select value={operator} onValueChange={(v) => set("operator", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="equals">é igual a</SelectItem>
            <SelectItem value="not_equals">não é igual a</SelectItem>
            <SelectItem value="contains">contém</SelectItem>
            <SelectItem value="not_contains">não contém</SelectItem>
            <SelectItem value="starts_with">começa com</SelectItem>
            <SelectItem value="greater_than">maior que</SelectItem>
            <SelectItem value="less_than">menor que</SelectItem>
            <SelectItem value="is_empty">está vazio</SelectItem>
            <SelectItem value="is_not_empty">não está vazio</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {!hideValue && (
        <Field label="Valor">
          <Input
            value={(data.value as string) ?? ""}
            onChange={(e) => set("value", e.target.value)}
            placeholder="Digite o valor de comparação..."
            className="h-8 text-sm"
          />
        </Field>
      )}

      <div className="rounded-lg bg-muted/30 border border-border px-3 py-2.5 space-y-1.5">
        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wide">Saídas deste nó</p>
        <div className="space-y-1">
          <span className="flex items-center gap-1.5 text-[11px] text-emerald-600 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 inline-block" />
            SIM — condição verdadeira
          </span>
          <span className="flex items-center gap-1.5 text-[11px] text-red-500 font-medium">
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 inline-block" />
            NÃO — condição falsa
          </span>
        </div>
      </div>
    </div>
  )
}

function ActionConfig({ data, set }: ConfigProps) {
  const actionType = (data.actionType as string) ?? "add_tag"

  return (
    <div className="space-y-4">
      <SectionHeader>Tipo de ação</SectionHeader>

      <Field label="Ação a executar">
        <Select value={actionType} onValueChange={(v) => set("actionType", v)}>
          <SelectTrigger className="h-8 text-sm">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="move_stage">Mover para etapa</SelectItem>
            <SelectItem value="add_tag">Adicionar tag ao lead</SelectItem>
            <SelectItem value="remove_tag">Remover tag do lead</SelectItem>
            <SelectItem value="assign_attendant">Atribuir atendente</SelectItem>
            <SelectItem value="remove_attendant">Remover atendente</SelectItem>
            <SelectItem value="win_deal">Marcar negócio como ganho</SelectItem>
            <SelectItem value="lose_deal">Marcar negócio como perdido</SelectItem>
            <SelectItem value="reopen_deal">Reabrir negócio</SelectItem>
            <SelectItem value="finish_attendance">Finalizar atendimento</SelectItem>
          </SelectContent>
        </Select>
      </Field>

      {(actionType === "add_tag" || actionType === "remove_tag") && (
        <Field label="Nome da tag" hint="Use letras minúsculas, sem espaços. Ex: cliente-vip">
          <Input
            value={(data.tagName as string) ?? ""}
            onChange={(e) => set("tagName", e.target.value)}
            placeholder="ex: cliente-vip"
            className="h-8 text-sm"
          />
        </Field>
      )}

      {actionType === "move_stage" && (
        <Field label="Nome da etapa" hint="Digite o nome exato da etapa de destino">
          <Input
            value={(data.stageName as string) ?? ""}
            onChange={(e) => set("stageName", e.target.value)}
            placeholder="ex: Proposta enviada"
            className="h-8 text-sm"
          />
        </Field>
      )}

      {actionType === "assign_attendant" && (
        <Field label="Usuário" hint="Digite o email ou nome do atendente">
          <Input
            value={(data.attendantName as string) ?? ""}
            onChange={(e) => set("attendantName", e.target.value)}
            placeholder="ex: joao@empresa.com"
            className="h-8 text-sm"
          />
        </Field>
      )}
    </div>
  )
}

function AIConfig({ data, set }: ConfigProps) {
  return (
    <div className="space-y-4">
      <SectionHeader>Configuração da IA</SectionHeader>

      <Field
        label="Instrução personalizada (opcional)"
        hint="Instrução adicional aplicada somente nesta etapa. O assistente de IA configurado na automação é usado como base."
      >
        <Textarea
          value={(data.promptOverride as string) ?? ""}
          onChange={(e) => set("promptOverride", e.target.value)}
          placeholder={"Ex: Responda com foco em apresentar os benefícios do plano Premium.\nSeja objetivo e direto."}
          rows={6}
          className="text-sm resize-none"
        />
      </Field>

      <div className="rounded-lg bg-sky-50 dark:bg-sky-950/30 border border-sky-200/60 dark:border-sky-800/60 px-3 py-2.5">
        <p className="text-[11px] text-sky-700 dark:text-sky-300">
          A IA analisará o contexto da conversa e gerará uma resposta contextualizada automaticamente.
        </p>
      </div>
    </div>
  )
}

function ApiConfig({ data, set }: ConfigProps) {
  return (
    <div className="space-y-4">
      <SectionHeader>Endpoint</SectionHeader>

      <div className="flex gap-2 items-end">
        <Field label="Método">
          <Select value={(data.method as string) ?? "POST"} onValueChange={(v) => set("method", v)}>
            <SelectTrigger className="h-8 text-sm w-[90px]">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {["GET", "POST", "PUT", "PATCH", "DELETE"].map((m) => (
                <SelectItem key={m} value={m}>{m}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </Field>
        <Field label="URL">
          <Input
            value={(data.url as string) ?? ""}
            onChange={(e) => set("url", e.target.value)}
            placeholder="https://api.exemplo.com/webhook"
            className="h-8 text-sm"
          />
        </Field>
      </div>

      <SectionHeader>Corpo da requisição</SectionHeader>

      <Field label="Body (JSON)" hint="Use variáveis como {lead_name} no JSON">
        <Textarea
          value={(data.body as string) ?? ""}
          onChange={(e) => set("body", e.target.value)}
          placeholder={'{\n  "lead": "{lead_name}",\n  "email": "{lead_email}"\n}'}
          rows={6}
          className="text-xs resize-none font-mono"
        />
      </Field>

      <Field label="Token de autenticação (opcional)" hint="Bearer token ou chave de API">
        <Input
          value={(data.authToken as string) ?? ""}
          onChange={(e) => set("authToken", e.target.value)}
          placeholder="Bearer seu-token-aqui"
          className="h-8 text-sm font-mono"
          type="password"
        />
      </Field>
    </div>
  )
}

function FieldOpsConfig({ data, set }: ConfigProps) {
  const ops: Array<{ field: string; value: string }> =
    (data.operations as Array<{ field: string; value: string }>) ?? [{ field: "", value: "" }]

  function updateOp(i: number, key: "field" | "value", val: string) {
    set("operations", ops.map((op, idx) => (idx === i ? { ...op, [key]: val } : op)))
  }

  return (
    <div className="space-y-4">
      <SectionHeader>Operações de campo</SectionHeader>

      <div className="space-y-2.5">
        {ops.map((op, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              {i === 0 && <Label className="text-[10px] text-muted-foreground">Campo</Label>}
              <Input
                value={op.field}
                onChange={(e) => updateOp(i, "field", e.target.value)}
                placeholder="nome_campo"
                className="h-8 text-xs"
              />
            </div>
            <div className="flex-1 space-y-1">
              {i === 0 && <Label className="text-[10px] text-muted-foreground">Valor</Label>}
              <Input
                value={op.value}
                onChange={(e) => updateOp(i, "value", e.target.value)}
                placeholder="novo valor"
                className="h-8 text-xs"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive", i === 0 && "mt-4")}
              onClick={() => {
                if (ops.length === 1) return
                set("operations", ops.filter((_, idx) => idx !== i))
              }}
              disabled={ops.length === 1}
            >
              <Trash2Icon size={13} />
            </Button>
          </div>
        ))}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => set("operations", [...ops, { field: "", value: "" }])}
        className="w-full h-8 text-xs gap-1.5 border-dashed"
      >
        <PlusIcon size={12} />
        Adicionar campo
      </Button>
    </div>
  )
}

function RandomizerConfig({ data, set }: ConfigProps) {
  const branches: Array<{ label: string; percentage: number }> =
    (data.branches as Array<{ label: string; percentage: number }>) ?? [
      { label: "Caminho A", percentage: 50 },
      { label: "Caminho B", percentage: 50 },
    ]

  const total = branches.reduce((s, b) => s + b.percentage, 0)

  function updateBranch(i: number, key: "label" | "percentage", val: string | number) {
    set("branches", branches.map((b, idx) => (idx === i ? { ...b, [key]: val } : b)))
  }

  return (
    <div className="space-y-4">
      <SectionHeader>Divisão de caminhos</SectionHeader>

      <div className="space-y-2.5">
        {branches.map((b, i) => (
          <div key={i} className="flex gap-2 items-end">
            <div className="flex-1 space-y-1">
              {i === 0 && <Label className="text-[10px] text-muted-foreground">Rótulo</Label>}
              <Input
                value={b.label}
                onChange={(e) => updateBranch(i, "label", e.target.value)}
                className="h-8 text-xs"
              />
            </div>
            <div className="w-16 shrink-0 space-y-1">
              {i === 0 && <Label className="text-[10px] text-muted-foreground">%</Label>}
              <Input
                type="number"
                min={0}
                max={100}
                value={b.percentage}
                onChange={(e) => updateBranch(i, "percentage", Number(e.target.value))}
                className="h-8 text-xs text-center"
              />
            </div>
            <Button
              variant="ghost"
              size="icon"
              className={cn("h-8 w-8 shrink-0 text-muted-foreground hover:text-destructive", i === 0 && "mt-4")}
              onClick={() => {
                if (branches.length <= 2) return
                set("branches", branches.filter((_, idx) => idx !== i))
              }}
              disabled={branches.length <= 2}
            >
              <Trash2Icon size={13} />
            </Button>
          </div>
        ))}
      </div>

      <div className={cn(
        "rounded-lg px-3 py-2 text-[11px] font-medium",
        total === 100
          ? "bg-emerald-50 dark:bg-emerald-950/30 text-emerald-700 dark:text-emerald-400 border border-emerald-200/60 dark:border-emerald-800/60"
          : "bg-red-50 dark:bg-red-950/30 text-red-600 dark:text-red-400 border border-red-200/60 dark:border-red-800/60",
      )}>
        Total: {total}% {total !== 100 && "— deve somar 100%"}
      </div>

      <Button
        variant="outline"
        size="sm"
        onClick={() => set("branches", [
          ...branches,
          { label: `Caminho ${String.fromCharCode(65 + branches.length)}`, percentage: 0 },
        ])}
        className="w-full h-8 text-xs gap-1.5 border-dashed"
      >
        <PlusIcon size={12} />
        Adicionar caminho
      </Button>
    </div>
  )
}

function JavaScriptConfig({ data, set }: ConfigProps) {
  return (
    <div className="space-y-4">
      <SectionHeader>Editor de código</SectionHeader>

      <Field label="Código JavaScript" hint="Variáveis disponíveis: lead, deal, context, pipeline, stage">
        <Textarea
          value={(data.code as string) ?? ""}
          onChange={(e) => set("code", e.target.value)}
          placeholder={"// Acesse dados do lead e negócio\nconst { lead, deal } = context\n\n// Retorne um objeto com os resultados\nreturn {\n  success: true,\n  message: `Olá ${lead.name}`\n}"}
          rows={12}
          className="text-xs resize-y font-mono min-h-[200px]"
        />
      </Field>

      <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200/60 dark:border-amber-800/60 px-3 py-2.5 space-y-1.5">
        <p className="text-[10px] font-semibold text-amber-700 dark:text-amber-400">Variáveis disponíveis</p>
        <div className="flex flex-wrap gap-1.5">
          {["lead", "deal", "context", "pipeline", "stage"].map((v) => (
            <code key={v} className="text-[10px] bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-1.5 py-0.5 rounded">
              {v}
            </code>
          ))}
        </div>
      </div>
    </div>
  )
}
