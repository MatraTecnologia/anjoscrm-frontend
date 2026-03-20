import type { Node, Edge } from "@xyflow/react"

// ─── Automation Entity ────────────────────────────────────────────────────────

export interface WorkflowAutomation {
  id: string
  workspaceId: string
  name: string
  description?: string | null
  category: string
  isActive: boolean
  triggerType: string
  triggerConfig?: Record<string, unknown> | null
  nodes: WorkflowNode[]
  edges: WorkflowEdge[]
  createdAt: string
  updatedAt: string
  _count?: { logs: number }
}

// ─── ReactFlow Node Types ─────────────────────────────────────────────────────

export type NodeKind =
  | "start"
  | "message"
  | "wait"
  | "condition"
  | "action"
  | "ai"
  | "api"
  | "field_ops"
  | "randomizer"
  | "javascript"

export interface NodeStats {
  success: number
  warnings: number
  errors: number
}

export interface BaseNodeData {
  label: string
  description?: string
  configured: boolean
  stats?: NodeStats
  [key: string]: unknown
}

export interface TriggerItem {
  id: string
  label: string
  description?: string
  category?: string
}

export interface StartNodeData extends BaseNodeData {
  triggers?: TriggerItem[]
  onAddTrigger?: () => void
  onRemoveTrigger?: (id: string) => void
  // Legacy (backward compat)
  triggerType?: string
  triggerLabel?: string
  triggerConfig?: Record<string, unknown>
}

export interface MessageNodeData extends BaseNodeData {
  messageType: "template" | "ai"
  templateMessage?: string
  assistantId?: string
  connectionId?: string
}

export interface WaitNodeData extends BaseNodeData {
  duration: number
  unit: "minutes" | "hours" | "days"
}

export interface ConditionNodeData extends BaseNodeData {
  field: string
  operator: string
  value: string
}

export interface ActionNodeData extends BaseNodeData {
  actionType: "move_stage" | "add_tag" | "remove_tag" | "assign_attendant" | "close_deal" | "win_deal"
  targetStageId?: string
  tagName?: string
  attendantId?: string
}

export interface AINodeData extends BaseNodeData {
  assistantId?: string
  promptOverride?: string
}

export interface ApiNodeData extends BaseNodeData {
  method: "GET" | "POST" | "PUT" | "PATCH" | "DELETE"
  url: string
  headers?: Record<string, string>
  body?: string
}

export interface FieldOpsNodeData extends BaseNodeData {
  operations: Array<{ field: string; value: string }>
}

export interface RandomizerNodeData extends BaseNodeData {
  branches: Array<{ label: string; percentage: number }>
}

export interface JavaScriptNodeData extends BaseNodeData {
  code: string
}

export type WorkflowNodeData =
  | StartNodeData
  | MessageNodeData
  | WaitNodeData
  | ConditionNodeData
  | ActionNodeData
  | AINodeData
  | ApiNodeData
  | FieldOpsNodeData
  | RandomizerNodeData
  | JavaScriptNodeData

export type WorkflowNode = Node<WorkflowNodeData, NodeKind>
export type WorkflowEdge = Edge

// ─── Trigger Definitions ──────────────────────────────────────────────────────

export interface TriggerDefinition {
  id: string
  label: string
  description: string
  category: TriggerCategory
}

export type TriggerCategory =
  | "Negócios"
  | "Leads"
  | "Mensagens"
  | "HTTP"
  | "Sistema"
  | "Atividades"

export interface TriggerCategoryDef {
  id: TriggerCategory
  label: string
  icon: string
  color: string
  triggers: TriggerDefinition[]
}

export const TRIGGER_CATEGORIES: TriggerCategoryDef[] = [
  {
    id: "Negócios",
    label: "Negócios",
    icon: "briefcase",
    color: "text-blue-500",
    triggers: [
      { id: "deal_moved", label: "Negócio movido", description: "Quando um negócio é movido para outra etapa", category: "Negócios" },
      { id: "deal_created", label: "Negócio criado", description: "Quando um novo negócio é criado", category: "Negócios" },
      { id: "deal_attendant_assigned", label: "Atendente atribuído", description: "Quando um atendente é atribuído ao negócio", category: "Negócios" },
      { id: "deal_attendant_removed", label: "Atendente retirado", description: "Quando um atendente é removido do negócio", category: "Negócios" },
      { id: "deal_won", label: "Negócio ganho", description: "Quando um negócio é marcado como ganho", category: "Negócios" },
      { id: "deal_lost", label: "Negócio perdido", description: "Quando um negócio é marcado como perdido", category: "Negócios" },
      { id: "deal_restored", label: "Situação restaurada", description: "Quando um negócio perdido/ganho é restaurado", category: "Negócios" },
    ],
  },
  {
    id: "Leads",
    label: "Leads",
    icon: "user",
    color: "text-green-500",
    triggers: [
      { id: "lead_manual", label: "Execução manual", description: "Disparado manualmente pelo operador", category: "Leads" },
      { id: "lead_tag_removed", label: "Tag removida", description: "Quando uma tag é removida do lead", category: "Leads" },
      { id: "lead_tag_added", label: "Tag adicionada", description: "Quando uma tag é adicionada ao lead", category: "Leads" },
      { id: "lead_created", label: "Lead criado", description: "Quando um novo lead é cadastrado", category: "Leads" },
      { id: "lead_won_count", label: "N negócios ganhos", description: "Quando o lead atinge um número de negócios ganhos", category: "Leads" },
    ],
  },
  {
    id: "Mensagens",
    label: "Mensagens",
    icon: "message-circle",
    color: "text-purple-500",
    triggers: [
      { id: "message_received", label: "Mensagem recebida", description: "Quando o lead envia uma mensagem", category: "Mensagens" },
      { id: "message_sent", label: "Mensagem enviada", description: "Quando uma mensagem é enviada ao lead", category: "Mensagens" },
      { id: "attendance_finished", label: "Atendimento finalizado", description: "Quando o atendimento é encerrado", category: "Mensagens" },
      { id: "attendance_started", label: "Atendimento iniciado", description: "Quando um novo atendimento é iniciado", category: "Mensagens" },
      { id: "department_changed", label: "Departamento alterado", description: "Quando o lead é movido para outro departamento", category: "Mensagens" },
    ],
  },
  {
    id: "HTTP",
    label: "HTTP / Webhook",
    icon: "webhook",
    color: "text-orange-500",
    triggers: [
      { id: "webhook_received", label: "Webhook recebido", description: "Quando uma requisição HTTP chega no endpoint", category: "HTTP" },
    ],
  },
  {
    id: "Sistema",
    label: "Sistema",
    icon: "settings",
    color: "text-gray-500",
    triggers: [
      { id: "time_scheduled", label: "Agendamento", description: "Executa em um horário programado (cron)", category: "Sistema" },
      { id: "api_call", label: "Chamada de API", description: "Disparado via API externa", category: "Sistema" },
    ],
  },
  {
    id: "Atividades",
    label: "Atividades",
    icon: "activity",
    color: "text-teal-500",
    triggers: [
      { id: "activity_created", label: "Atividade criada", description: "Quando uma nova atividade é criada no CRM", category: "Atividades" },
      { id: "activity_completed", label: "Atividade concluída", description: "Quando uma atividade é marcada como concluída", category: "Atividades" },
      { id: "activity_overdue", label: "Atividade em atraso", description: "Quando uma atividade passa do prazo", category: "Atividades" },
    ],
  },
]

export function getTriggerById(id: string): TriggerDefinition | undefined {
  for (const cat of TRIGGER_CATEGORIES) {
    const t = cat.triggers.find((t) => t.id === id)
    if (t) return t
  }
  return undefined
}

// ─── Node Picker Definitions ──────────────────────────────────────────────────

export interface NodePickerItem {
  kind: NodeKind
  label: string
  description: string
  icon: string
  color: string
  bgColor: string
}

export const NODE_PICKER_ITEMS: NodePickerItem[] = [
  { kind: "message", label: "Mensagem", description: "Enviar mensagem ao lead", icon: "message-circle", color: "text-blue-600", bgColor: "bg-blue-50 dark:bg-blue-950" },
  { kind: "action", label: "Ações", description: "Executar uma ação no CRM", icon: "zap", color: "text-violet-600", bgColor: "bg-violet-50 dark:bg-violet-950" },
  { kind: "condition", label: "Condições", description: "Bifurcar o fluxo por condição", icon: "filter", color: "text-yellow-600", bgColor: "bg-yellow-50 dark:bg-yellow-950" },
  { kind: "wait", label: "Espera", description: "Aguardar antes de continuar", icon: "clock", color: "text-orange-600", bgColor: "bg-orange-50 dark:bg-orange-950" },
  { kind: "randomizer", label: "Randomizador", description: "Distribuir em caminhos aleatórios", icon: "shuffle", color: "text-pink-600", bgColor: "bg-pink-50 dark:bg-pink-950" },
  { kind: "api", label: "API", description: "Fazer requisição HTTP externa", icon: "brackets", color: "text-gray-600", bgColor: "bg-gray-50 dark:bg-gray-950" },
  { kind: "field_ops", label: "Campos", description: "Atualizar campos do lead/negócio", icon: "table-2", color: "text-green-600", bgColor: "bg-green-50 dark:bg-green-950" },
  { kind: "ai", label: "IA", description: "Processar com inteligência artificial", icon: "bot", color: "text-sky-600", bgColor: "bg-sky-50 dark:bg-sky-950" },
  { kind: "javascript", label: "JavaScript", description: "Executar código personalizado", icon: "code", color: "text-amber-600", bgColor: "bg-amber-50 dark:bg-amber-950" },
]
