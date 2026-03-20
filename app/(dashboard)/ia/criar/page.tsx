'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Bot, ArrowLeft, ArrowRight, Check, Loader2,
    ChevronRight, Info,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import { Slider } from '@/components/ui/slider'

import { useEnterprise } from '@/hooks/use-enterprise'
import { useCreateAiAgent, type CreateAgentPayload } from '@/services/ai-agents'
import { useConnections } from '@/services/connections'
import { useListPipelines } from '@/services/pipelines'
import { useListProducts, type Product } from '@/services/products'
import { cn } from '@/lib/utils'

// ─── Helpers / constantes ─────────────────────────────────────────────────────

const STEPS = [
    { id: 1, label: 'Identidade' },
    { id: 2, label: 'Modelo' },
    { id: 3, label: 'Estratégia' },
    { id: 4, label: 'Negócio' },
    { id: 5, label: 'Pipeline' },
    { id: 6, label: 'Conexão' },
    { id: 7, label: 'Produtos' },
    { id: 8, label: 'Revisão' },
]

const TONE_OPTIONS = [
    { value: 'professional', label: 'Profissional', desc: 'Formal e objetivo' },
    { value: 'friendly', label: 'Amigável', desc: 'Descontraído e próximo' },
    { value: 'consultative', label: 'Consultivo', desc: 'Especialista e educativo' },
    { value: 'urgent', label: 'Urgente', desc: 'Cria senso de urgência' },
]

const STRATEGY_OPTIONS = [
    { value: 'qualify', label: 'Qualificar', desc: 'Identificar leads com maior potencial' },
    { value: 'sell', label: 'Vender', desc: 'Fechar negócio direto na conversa' },
    { value: 'schedule', label: 'Agendar', desc: 'Marcar reunião com o closer' },
    { value: 'support', label: 'Suporte', desc: 'Responder dúvidas e resolver problemas' },
]

const PROVIDER_OPTIONS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
    { value: 'google', label: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
]

// ─── Step indicator ───────────────────────────────────────────────────────────

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center justify-center gap-1 py-4 px-6">
            {STEPS.map((step, i) => (
                <div key={step.id} className="flex items-center gap-1">
                    <div className={cn(
                        'flex size-7 items-center justify-center rounded-full text-xs font-medium transition-colors',
                        step.id < current && 'bg-primary text-primary-foreground',
                        step.id === current && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                        step.id > current && 'bg-muted text-muted-foreground',
                    )}>
                        {step.id < current ? <Check className="size-3.5" /> : step.id}
                    </div>
                    {i < STEPS.length - 1 && (
                        <div className={cn(
                            'h-px w-4 transition-colors',
                            step.id < current ? 'bg-primary' : 'bg-border',
                        )} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Wizard state ─────────────────────────────────────────────────────────────

type WizardState = {
    // Step 1 - Identidade
    name: string
    description: string
    role: string
    tone: string
    // Step 2 - Modelo
    provider: string
    model: string
    apiKey: string
    temperature: number
    // Step 3 - Estratégia
    strategyMode: string
    maxFollowups: number
    fallbackToHuman: boolean
    customRules: string
    // Step 4 - Negócio
    mainDifferential: string
    ticketAverage: string
    canGiveDiscount: boolean
    maxDiscountPct: string
    // Step 5 - Pipeline
    pipelineId: string
    // Step 6 - Conexão
    connectionId: string
    // Step 7 - Produtos
    productIds: string[]
}

const INITIAL: WizardState = {
    name: '',
    description: '',
    role: 'Você é um especialista em vendas e atendimento.',
    tone: 'friendly',
    provider: 'openai',
    model: 'gpt-4o-mini',
    apiKey: '',
    temperature: 0.7,
    strategyMode: 'qualify',
    maxFollowups: 3,
    fallbackToHuman: true,
    customRules: '',
    mainDifferential: '',
    ticketAverage: '',
    canGiveDiscount: false,
    maxDiscountPct: '',
    pipelineId: '',
    connectionId: '',
    productIds: [],
}

// ─── Steps ────────────────────────────────────────────────────────────────────

function Step1({ state, setState }: { state: WizardState; setState: (v: Partial<WizardState>) => void }) {
    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Identidade do agente</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Como seu agente vai se apresentar e se comunicar</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-name">Nome do agente *</Label>
                <Input
                    id="ia-name"
                    placeholder="Ex: Sofia — Atendente Comercial"
                    value={state.name}
                    onChange={e => setState({ name: e.target.value })}
                    autoFocus
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-desc">Descrição (interna)</Label>
                <Input
                    id="ia-desc"
                    placeholder="Agente de qualificação para leads via WhatsApp"
                    value={state.description}
                    onChange={e => setState({ description: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Visível apenas para você, para identificar o agente</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-role">Persona / papel</Label>
                <Textarea
                    id="ia-role"
                    placeholder="Você é uma especialista em vendas consultivas com foco em qualificação de leads..."
                    value={state.role}
                    onChange={e => setState({ role: e.target.value })}
                    rows={3}
                />
                <p className="text-xs text-muted-foreground">Como a IA vai se descrever e se comportar na conversa</p>
            </div>

            <div className="flex flex-col gap-2">
                <Label>Tom de voz</Label>
                <div className="grid grid-cols-2 gap-2">
                    {TONE_OPTIONS.map(t => (
                        <button
                            key={t.value}
                            type="button"
                            onClick={() => setState({ tone: t.value })}
                            className={cn(
                                'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                                state.tone === t.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted',
                            )}
                        >
                            <span className="text-sm font-medium">{t.label}</span>
                            <span className="text-xs text-muted-foreground">{t.desc}</span>
                        </button>
                    ))}
                </div>
            </div>
        </div>
    )
}

function Step2({ state, setState }: { state: WizardState; setState: (v: Partial<WizardState>) => void }) {
    const selectedProvider = PROVIDER_OPTIONS.find(p => p.value === state.provider)

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Modelo de IA</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Qual provedor e modelo o agente vai usar</p>
            </div>

            <div className="flex flex-col gap-2">
                <Label>Provedor</Label>
                <div className="grid grid-cols-3 gap-2">
                    {PROVIDER_OPTIONS.map(p => (
                        <button
                            key={p.value}
                            type="button"
                            onClick={() => setState({ provider: p.value, model: p.models[0] })}
                            className={cn(
                                'rounded-lg border p-3 text-sm font-medium transition-colors',
                                state.provider === p.value
                                    ? 'border-primary bg-primary/5 text-primary'
                                    : 'border-border hover:bg-muted',
                            )}
                        >
                            {p.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Modelo</Label>
                <Select value={state.model} onValueChange={v => setState({ model: v })}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        {selectedProvider?.models.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-apikey">API Key *</Label>
                <Input
                    id="ia-apikey"
                    type="password"
                    placeholder="sk-..."
                    value={state.apiKey}
                    onChange={e => setState({ apiKey: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">
                    Chave da API do provedor selecionado. É armazenada de forma segura e nunca exibida.
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label>Temperatura: {state.temperature.toFixed(1)}</Label>
                    <span className="text-xs text-muted-foreground">
                        {state.temperature < 0.4 ? 'Mais preciso' : state.temperature > 0.8 ? 'Mais criativo' : 'Equilibrado'}
                    </span>
                </div>
                <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[state.temperature]}
                    onValueChange={([v]) => setState({ temperature: v })}
                />
                <div className="flex justify-between text-xs text-muted-foreground">
                    <span>0 — Focado</span>
                    <span>1 — Criativo</span>
                </div>
            </div>
        </div>
    )
}

function Step3({ state, setState }: { state: WizardState; setState: (v: Partial<WizardState>) => void }) {
    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Estratégia de atendimento</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Como o agente vai conduzir as conversas</p>
            </div>

            <div className="flex flex-col gap-2">
                <Label>Objetivo principal</Label>
                <div className="grid grid-cols-2 gap-2">
                    {STRATEGY_OPTIONS.map(s => (
                        <button
                            key={s.value}
                            type="button"
                            onClick={() => setState({ strategyMode: s.value })}
                            className={cn(
                                'flex flex-col items-start rounded-lg border p-3 text-left transition-colors',
                                state.strategyMode === s.value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted',
                            )}
                        >
                            <span className="text-sm font-medium">{s.label}</span>
                            <span className="text-xs text-muted-foreground">{s.desc}</span>
                        </button>
                    ))}
                </div>
            </div>

            <div className="flex flex-col gap-1.5">
                <div className="flex items-center justify-between">
                    <Label>Máx. de follow-ups: {state.maxFollowups}</Label>
                </div>
                <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[state.maxFollowups]}
                    onValueChange={([v]) => setState({ maxFollowups: v })}
                />
                <p className="text-xs text-muted-foreground">
                    Quantidade máxima de mensagens proativas que a IA pode enviar sem resposta do lead
                </p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                    <p className="text-sm font-medium">Transferir para humano</p>
                    <p className="text-xs text-muted-foreground">A IA encaminha para um atendente quando não souber responder</p>
                </div>
                <Switch
                    checked={state.fallbackToHuman}
                    onCheckedChange={v => setState({ fallbackToHuman: v })}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-rules">Regras personalizadas</Label>
                <Textarea
                    id="ia-rules"
                    placeholder="Ex: Nunca revelar preço sem antes qualificar o lead. Sempre perguntar o tamanho da empresa..."
                    value={state.customRules}
                    onChange={e => setState({ customRules: e.target.value })}
                    rows={4}
                />
                <p className="text-xs text-muted-foreground">Instruções adicionais que serão adicionadas ao prompt do sistema</p>
            </div>
        </div>
    )
}

function Step4({ state, setState }: { state: WizardState; setState: (v: Partial<WizardState>) => void }) {
    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Contexto do negócio</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Informações que ajudam a IA a vender melhor</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-diff">Principal diferencial</Label>
                <Textarea
                    id="ia-diff"
                    placeholder="Ex: Somos a única plataforma com entrega em 2h no Brasil. Atendemos +500 empresas com 98% de satisfação..."
                    value={state.mainDifferential}
                    onChange={e => setState({ mainDifferential: e.target.value })}
                    rows={3}
                />
                <p className="text-xs text-muted-foreground">A IA usará isso ao comparar com concorrentes e rebater objeções</p>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label htmlFor="ia-ticket">Ticket médio (R$)</Label>
                <Input
                    id="ia-ticket"
                    type="number"
                    placeholder="Ex: 1500"
                    value={state.ticketAverage}
                    onChange={e => setState({ ticketAverage: e.target.value })}
                />
                <p className="text-xs text-muted-foreground">Usado para calibrar as respostas conforme o valor do produto</p>
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                    <p className="text-sm font-medium">Pode dar desconto</p>
                    <p className="text-xs text-muted-foreground">Permite que a IA ofereça desconto dentro de um limite</p>
                </div>
                <Switch
                    checked={state.canGiveDiscount}
                    onCheckedChange={v => setState({ canGiveDiscount: v })}
                />
            </div>

            {state.canGiveDiscount && (
                <div className="flex flex-col gap-1.5">
                    <Label htmlFor="ia-discount">Desconto máximo (%)</Label>
                    <Input
                        id="ia-discount"
                        type="number"
                        min={1}
                        max={100}
                        placeholder="Ex: 15"
                        value={state.maxDiscountPct}
                        onChange={e => setState({ maxDiscountPct: e.target.value })}
                    />
                </div>
            )}
        </div>
    )
}

function Step5({
    state,
    setState,
    enterpriseId,
}: {
    state: WizardState
    setState: (v: Partial<WizardState>) => void
    enterpriseId: string
}) {
    const { data: pipelines = [], isLoading } = useListPipelines(enterpriseId)

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Pipeline de vendas</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    A IA pode mover leads automaticamente entre etapas do funil (opcional)
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Carregando pipelines...</span>
                </div>
            ) : pipelines.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Info className="size-8" />
                    <p className="text-sm">Nenhum pipeline cadastrado ainda</p>
                    <p className="text-xs">Você pode associar um pipeline depois, nas configurações do agente</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setState({ pipelineId: '' })}
                        className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            !state.pipelineId
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted',
                        )}
                    >
                        <div className="size-3 rounded-full bg-muted-foreground/30" />
                        <div>
                            <p className="text-sm font-medium">Sem pipeline</p>
                            <p className="text-xs text-muted-foreground">A IA não moverá leads automaticamente</p>
                        </div>
                    </button>
                    {pipelines.map(p => (
                        <button
                            key={p.id}
                            type="button"
                            onClick={() => setState({ pipelineId: p.id })}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                state.pipelineId === p.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted',
                            )}
                        >
                            <div
                                className="size-3 rounded-full shrink-0"
                                style={{ background: p.color ?? '#6366f1' }}
                            />
                            <p className="text-sm font-medium">{p.name}</p>
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function Step6({
    state,
    setState,
    enterpriseId,
}: {
    state: WizardState
    setState: (v: Partial<WizardState>) => void
    enterpriseId: string
}) {
    const { data: connections = [], isLoading } = useConnections(enterpriseId)

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Conexão WhatsApp</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Qual número de WhatsApp esse agente vai monitorar e responder (opcional)
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Carregando conexões...</span>
                </div>
            ) : connections.filter(c => c.type === 'WHATSAPP').length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Info className="size-8" />
                    <p className="text-sm">Nenhuma conexão WhatsApp disponível</p>
                    <p className="text-xs">Crie uma conexão primeiro em <strong>Conexões</strong> para ativar a IA</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setState({ connectionId: '' })}
                        className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            !state.connectionId
                                ? 'border-primary bg-primary/5'
                                : 'border-border hover:bg-muted',
                        )}
                    >
                        <div className="size-3 rounded-full bg-muted-foreground/30" />
                        <div>
                            <p className="text-sm font-medium">Sem conexão</p>
                            <p className="text-xs text-muted-foreground">Configurar depois</p>
                        </div>
                    </button>
                    {connections.filter(c => c.type === 'WHATSAPP').map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setState({ connectionId: c.id })}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                state.connectionId === c.id
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted',
                            )}
                        >
                            <div className={cn(
                                'size-3 rounded-full shrink-0',
                                c.status === 'CONNECTED' ? 'bg-green-500' : 'bg-muted-foreground/30',
                            )} />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{c.name}</p>
                                {c.phoneNumber && <p className="text-xs text-muted-foreground">{c.phoneNumber}</p>}
                            </div>
                            {c.status === 'CONNECTED' && (
                                <Badge className="text-[10px] bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10">
                                    Conectado
                                </Badge>
                            )}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

function Step7({
    state,
    setState,
    enterpriseId,
}: {
    state: WizardState
    setState: (v: Partial<WizardState>) => void
    enterpriseId: string
}) {
    const { data: products = [], isLoading } = useListProducts(enterpriseId)

    function toggle(id: string) {
        const next = state.productIds.includes(id)
            ? state.productIds.filter(p => p !== id)
            : [...state.productIds, id]
        setState({ productIds: next })
    }

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Produtos / serviços</h2>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Quais produtos o agente pode apresentar e vender (opcional)
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground py-4">
                    <Loader2 className="size-4 animate-spin" />
                    <span className="text-sm">Carregando produtos...</span>
                </div>
            ) : products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Info className="size-8" />
                    <p className="text-sm">Nenhum produto cadastrado ainda</p>
                    <p className="text-xs">Adicione produtos em <strong>Configurações → Produtos</strong></p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {products.map((p: Product) => {
                        const selected = state.productIds.includes(p.id)
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggle(p.id)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                    selected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                                )}
                            >
                                <div className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                                    selected ? 'bg-primary border-primary' : 'border-border',
                                )}>
                                    {selected && <Check className="size-3 text-primary-foreground" />}
                                </div>
                                <div className="flex-1 min-w-0">
                                    <p className="text-sm font-medium truncate">{p.name}</p>
                                    {p.price != null && (
                                        <p className="text-xs text-muted-foreground">
                                            R$ {Number(p.price).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                                        </p>
                                    )}
                                </div>
                            </button>
                        )
                    })}
                    {state.productIds.length > 0 && (
                        <p className="text-xs text-muted-foreground text-right">
                            {state.productIds.length} produto{state.productIds.length !== 1 ? 's' : ''} selecionado{state.productIds.length !== 1 ? 's' : ''}
                        </p>
                    )}
                </div>
            )}
        </div>
    )
}

function Step8({ state }: { state: WizardState }) {
    const providerLabel = PROVIDER_OPTIONS.find(p => p.value === state.provider)?.label ?? state.provider
    const toneLabel = TONE_OPTIONS.find(t => t.value === state.tone)?.label ?? state.tone
    const strategyLabel = STRATEGY_OPTIONS.find(s => s.value === state.strategyMode)?.label ?? state.strategyMode

    return (
        <div className="flex flex-col gap-5">
            <div>
                <h2 className="text-lg font-semibold">Revisão</h2>
                <p className="text-sm text-muted-foreground mt-0.5">Confira as configurações antes de criar o agente</p>
            </div>

            <div className="flex flex-col gap-3">
                <ReviewRow label="Nome" value={state.name || '—'} />
                <ReviewRow label="Tom" value={toneLabel} />
                <ReviewRow label="Modelo" value={`${providerLabel} · ${state.model}`} />
                <ReviewRow label="API Key" value={state.apiKey ? '••••••••' : 'Não configurada'} warn={!state.apiKey} />
                <ReviewRow label="Temperatura" value={state.temperature.toFixed(1)} />
                <ReviewRow label="Estratégia" value={strategyLabel} />
                <ReviewRow label="Max. follow-ups" value={String(state.maxFollowups)} />
                <ReviewRow label="Transferir p/ humano" value={state.fallbackToHuman ? 'Sim' : 'Não'} />
                {state.ticketAverage && (
                    <ReviewRow label="Ticket médio" value={`R$ ${Number(state.ticketAverage).toLocaleString('pt-BR')}`} />
                )}
                {state.canGiveDiscount && state.maxDiscountPct && (
                    <ReviewRow label="Desconto máx." value={`${state.maxDiscountPct}%`} />
                )}
                <ReviewRow
                    label="Conexão"
                    value={state.connectionId ? 'Configurada' : 'Sem conexão (configurar depois)'}
                />
                <ReviewRow
                    label="Pipeline"
                    value={state.pipelineId ? 'Configurado' : 'Sem pipeline'}
                />
                <ReviewRow
                    label="Produtos"
                    value={state.productIds.length > 0 ? `${state.productIds.length} selecionado(s)` : 'Nenhum'}
                />
            </div>

            {!state.apiKey && (
                <div className="flex items-start gap-2 rounded-lg border border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-900 p-3">
                    <Info className="size-4 text-amber-600 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-400">
                        O agente será criado mas <strong>não poderá ser ativado</strong> sem uma API Key.
                        Você pode adicioná-la depois nas configurações.
                    </p>
                </div>
            )}
        </div>
    )
}

function ReviewRow({ label, value, warn = false }: { label: string; value: string; warn?: boolean }) {
    return (
        <div className="flex items-center justify-between py-1.5 border-b last:border-0">
            <span className="text-sm text-muted-foreground">{label}</span>
            <span className={cn('text-sm font-medium', warn && 'text-amber-600')}>{value}</span>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CriarIaPage() {
    const router = useRouter()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [step, setStep] = useState(1)
    const [state, setStateRaw] = useState<WizardState>(INITIAL)

    function setState(partial: Partial<WizardState>) {
        setStateRaw(prev => ({ ...prev, ...partial }))
    }

    const { mutate: create, isPending } = useCreateAiAgent()

    function canNext(): boolean {
        if (step === 1) return state.name.trim().length > 0
        if (step === 2) return true // API key optional on creation
        return true
    }

    function handleNext() {
        if (step < STEPS.length) setStep(s => s + 1)
    }

    function handleBack() {
        if (step > 1) setStep(s => s - 1)
    }

    function handleCreate() {
        const payload: CreateAgentPayload = {
            name: state.name.trim(),
            description: state.description.trim() || null,
            role: state.role.trim(),
            tone: state.tone,
            provider: state.provider,
            model: state.model,
            apiKey: state.apiKey.trim() || null,
            temperature: state.temperature,
            strategyMode: state.strategyMode,
            maxFollowups: state.maxFollowups,
            fallbackToHuman: state.fallbackToHuman,
            customRules: state.customRules.trim() || null,
            mainDifferential: state.mainDifferential.trim() || null,
            ticketAverage: state.ticketAverage ? Number(state.ticketAverage) : null,
            canGiveDiscount: state.canGiveDiscount,
            maxDiscountPct: state.canGiveDiscount && state.maxDiscountPct ? Number(state.maxDiscountPct) : null,
            pipelineId: state.pipelineId || null,
            connectionId: state.connectionId || null,
            productIds: state.productIds,
        }

        create({ enterpriseId, payload }, {
            onSuccess: (agent) => {
                toast.success('Agente criado com sucesso!')
                router.push(`/ia/${agent.id}`)
            },
            onError: () => toast.error('Erro ao criar agente. Verifique os campos e tente novamente.'),
        })
    }

    const stepProps = { state, setState, enterpriseId }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
                <button
                    onClick={() => router.push('/ia')}
                    className="flex items-center justify-center rounded size-8 hover:bg-muted transition-colors text-muted-foreground"
                >
                    <ArrowLeft className="size-4" />
                </button>
                <div>
                    <h1 className="text-xl font-semibold">Novo agente IA</h1>
                    <p className="text-sm text-muted-foreground">
                        {STEPS[step - 1].label} · Passo {step} de {STEPS.length}
                    </p>
                </div>
            </div>

            {/* ── Step indicator ─────────────────────────────────────────── */}
            <StepIndicator current={step} />

            {/* ── Step content ───────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <div className="max-w-lg mx-auto px-6 pb-8">
                    {step === 1 && <Step1 {...stepProps} />}
                    {step === 2 && <Step2 {...stepProps} />}
                    {step === 3 && <Step3 {...stepProps} />}
                    {step === 4 && <Step4 {...stepProps} />}
                    {step === 5 && <Step5 {...stepProps} />}
                    {step === 6 && <Step6 {...stepProps} />}
                    {step === 7 && <Step7 {...stepProps} />}
                    {step === 8 && <Step8 state={state} />}
                </div>
            </div>

            {/* ── Footer / nav ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-t shrink-0 bg-background">
                <Button
                    variant="outline"
                    onClick={step === 1 ? () => router.push('/ia') : handleBack}
                    className="gap-1.5"
                >
                    <ArrowLeft className="size-4" />
                    {step === 1 ? 'Cancelar' : 'Voltar'}
                </Button>

                {step < STEPS.length ? (
                    <Button
                        onClick={handleNext}
                        disabled={!canNext()}
                        className="gap-1.5"
                    >
                        Próximo
                        <ArrowRight className="size-4" />
                    </Button>
                ) : (
                    <Button
                        onClick={handleCreate}
                        disabled={isPending || !state.name.trim()}
                        className="gap-1.5"
                    >
                        {isPending
                            ? <><Loader2 className="size-4 animate-spin" /> Criando...</>
                            : <><Check className="size-4" /> Criar agente</>
                        }
                    </Button>
                )}
            </div>
        </div>
    )
}
