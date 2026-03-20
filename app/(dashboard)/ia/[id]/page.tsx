'use client'

import { useState, use, useRef, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    ArrowLeft, Bot, Power, Loader2, Save,
    Upload, Trash2, FileText, Check,
    Users, Settings, BookOpen, ShoppingBag, GitBranch, Zap, Plug,
    Info, MessageSquare, Send, RotateCcw, UserCheck,
    RotateCw, UserCog, ArrowDownUp, HandHelping,
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
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useAiAgent, useUpdateAiAgent, useToggleAiAgent,
    useUploadDocument, useDeleteDocument, useChatWithAgent,
    type ChatMessage,
} from '@/services/ai-agents'
import { useConnections } from '@/services/connections'
import { useListPipelines } from '@/services/pipelines'
import { useListProducts, type Product } from '@/services/products'
import { useMembers } from '@/services/enterprises'
import { cn } from '@/lib/utils'

// ─── Constantes ───────────────────────────────────────────────────────────────

const TABS = [
    { id: 'geral', label: 'Geral', icon: Settings },
    { id: 'comportamento', label: 'Comportamento', icon: Zap },
    { id: 'conhecimento', label: 'Conhecimento', icon: BookOpen },
    { id: 'produtos', label: 'Produtos', icon: ShoppingBag },
    { id: 'pipeline', label: 'Pipeline', icon: GitBranch },
    { id: 'conexao', label: 'Conexão', icon: Plug },
    { id: 'leads', label: 'Leads', icon: Users },
    { id: 'atendentes', label: 'Atendentes', icon: UserCheck },
    { id: 'testar', label: 'Testar', icon: MessageSquare },
] as const

type TabId = typeof TABS[number]['id']

const TONE_OPTIONS = [
    { value: 'professional', label: 'Profissional' },
    { value: 'friendly', label: 'Amigável' },
    { value: 'consultative', label: 'Consultivo' },
    { value: 'urgent', label: 'Urgente' },
]

const STRATEGY_OPTIONS = [
    { value: 'qualify', label: 'Qualificar' },
    { value: 'sell', label: 'Vender' },
    { value: 'schedule', label: 'Agendar' },
    { value: 'support', label: 'Suporte' },
]

const PROVIDER_OPTIONS = [
    { value: 'openai', label: 'OpenAI', models: ['gpt-4o', 'gpt-4o-mini', 'gpt-4-turbo', 'gpt-3.5-turbo'] },
    { value: 'anthropic', label: 'Anthropic', models: ['claude-opus-4-6', 'claude-sonnet-4-6', 'claude-haiku-4-5-20251001'] },
    { value: 'google', label: 'Google', models: ['gemini-2.0-flash', 'gemini-1.5-pro', 'gemini-1.5-flash'] },
]

// ─── Tab Geral ────────────────────────────────────────────────────────────────

function TabGeral({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const [name, setName] = useState(agent?.name ?? '')
    const [description, setDescription] = useState(agent?.description ?? '')
    const [role, setRole] = useState(agent?.role ?? '')
    const [tone, setTone] = useState(agent?.tone ?? 'friendly')
    const [provider, setProvider] = useState(agent?.provider ?? 'openai')
    const [model, setModel] = useState(agent?.model ?? 'gpt-4o-mini')
    const [apiKey, setApiKey] = useState('')
    const [temperature, setTemperature] = useState(agent?.temperature ?? 0.7)

    if (!agent) return null

    const selectedModels = PROVIDER_OPTIONS.find(p => p.value === provider)?.models ?? []

    function handleSave() {
        update({
            id: agentId,
            enterpriseId,
            payload: {
                name: name.trim(),
                description: description.trim() || null,
                role: role.trim(),
                tone,
                provider,
                model,
                apiKey: apiKey.trim() || undefined,
                temperature,
            },
        }, {
            onSuccess: () => toast.success('Agente atualizado!'),
            onError: () => toast.error('Erro ao salvar.'),
        })
    }

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <div className="flex flex-col gap-1.5">
                <Label>Nome *</Label>
                <Input value={name} onChange={e => setName(e.target.value)} />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Descrição (interna)</Label>
                <Input
                    placeholder="Agente de qualificação para leads via WhatsApp"
                    value={description}
                    onChange={e => setDescription(e.target.value)}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Persona / papel</Label>
                <Textarea value={role} onChange={e => setRole(e.target.value)} rows={3} />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Tom de voz</Label>
                <Select value={tone} onValueChange={setTone}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {TONE_OPTIONS.map(t => (
                            <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Provedor</Label>
                <Select
                    value={provider}
                    onValueChange={v => {
                        setProvider(v)
                        const models = PROVIDER_OPTIONS.find(p => p.value === v)?.models ?? []
                        setModel(models[0] ?? '')
                    }}
                >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {PROVIDER_OPTIONS.map(p => (
                            <SelectItem key={p.value} value={p.value}>{p.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Modelo</Label>
                <Select value={model} onValueChange={setModel}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {selectedModels.map(m => (
                            <SelectItem key={m} value={m}>{m}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>API Key</Label>
                <Input
                    type="password"
                    placeholder={agent.hasApiKey ? `Configurada — termina em ${agent.apiKeyHint ?? '****'}` : 'Não configurada'}
                    value={apiKey}
                    onChange={e => setApiKey(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                    {agent.hasApiKey
                        ? 'Deixe em branco para manter a chave atual. Preencha para substituí-la.'
                        : 'Obrigatória para ativar o agente.'
                    }
                </p>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label>Temperatura: {temperature.toFixed(1)}</Label>
                </div>
                <Slider
                    min={0}
                    max={1}
                    step={0.1}
                    value={[temperature]}
                    onValueChange={([v]) => setTemperature(v)}
                />
            </div>

            <Button onClick={handleSave} disabled={isPending || !name.trim()} className="self-start gap-1.5">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Comportamento ────────────────────────────────────────────────────────

function TabComportamento({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const [strategyMode, setStrategyMode] = useState(agent?.strategyMode ?? 'qualify')
    const [maxFollowups, setMaxFollowups] = useState(agent?.maxFollowups ?? 3)
    const [fallbackToHuman, setFallbackToHuman] = useState(agent?.fallbackToHuman ?? true)
    const [customRules, setCustomRules] = useState(agent?.customRules ?? '')
    const [systemPrompt, setSystemPrompt] = useState(agent?.systemPrompt ?? '')
    const [mainDifferential, setMainDifferential] = useState(agent?.mainDifferential ?? '')
    const [ticketAverage, setTicketAverage] = useState(agent?.ticketAverage != null ? String(agent.ticketAverage) : '')
    const [canGiveDiscount, setCanGiveDiscount] = useState(agent?.canGiveDiscount ?? false)
    const [maxDiscountPct, setMaxDiscountPct] = useState(agent?.maxDiscountPct != null ? String(agent.maxDiscountPct) : '')

    if (!agent) return null

    function handleSave() {
        update({
            id: agentId,
            enterpriseId,
            payload: {
                strategyMode,
                maxFollowups,
                fallbackToHuman,
                customRules: customRules.trim() || null,
                systemPrompt: systemPrompt.trim() || null,
                mainDifferential: mainDifferential.trim() || null,
                ticketAverage: ticketAverage ? Number(ticketAverage) : null,
                canGiveDiscount,
                maxDiscountPct: canGiveDiscount && maxDiscountPct ? Number(maxDiscountPct) : null,
            },
        }, {
            onSuccess: () => toast.success('Comportamento atualizado!'),
            onError: () => toast.error('Erro ao salvar.'),
        })
    }

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <div className="flex flex-col gap-1.5">
                <Label>Estratégia</Label>
                <Select value={strategyMode} onValueChange={setStrategyMode}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                        {STRATEGY_OPTIONS.map(s => (
                            <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                        ))}
                    </SelectContent>
                </Select>
            </div>

            <div className="flex flex-col gap-2">
                <div className="flex items-center justify-between">
                    <Label>Máx. de follow-ups: {maxFollowups}</Label>
                </div>
                <Slider
                    min={0}
                    max={10}
                    step={1}
                    value={[maxFollowups]}
                    onValueChange={([v]) => setMaxFollowups(v)}
                />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                    <p className="text-sm font-medium">Transferir para humano</p>
                    <p className="text-xs text-muted-foreground">Encaminha para atendente quando não souber responder</p>
                </div>
                <Switch checked={fallbackToHuman} onCheckedChange={setFallbackToHuman} />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Principal diferencial</Label>
                <Textarea
                    placeholder="Somos a única plataforma com..."
                    value={mainDifferential}
                    onChange={e => setMainDifferential(e.target.value)}
                    rows={2}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>Ticket médio (R$)</Label>
                <Input
                    type="number"
                    value={ticketAverage}
                    onChange={e => setTicketAverage(e.target.value)}
                />
            </div>

            <div className="flex items-center justify-between rounded-lg border p-3">
                <div>
                    <p className="text-sm font-medium">Pode dar desconto</p>
                </div>
                <Switch checked={canGiveDiscount} onCheckedChange={setCanGiveDiscount} />
            </div>

            {canGiveDiscount && (
                <div className="flex flex-col gap-1.5">
                    <Label>Desconto máximo (%)</Label>
                    <Input
                        type="number"
                        min={1}
                        max={100}
                        value={maxDiscountPct}
                        onChange={e => setMaxDiscountPct(e.target.value)}
                    />
                </div>
            )}

            <div className="flex flex-col gap-1.5">
                <Label>Regras personalizadas</Label>
                <Textarea
                    placeholder="Nunca revelar preço sem antes qualificar..."
                    value={customRules}
                    onChange={e => setCustomRules(e.target.value)}
                    rows={4}
                />
            </div>

            <div className="flex flex-col gap-1.5">
                <Label>System prompt adicional</Label>
                <Textarea
                    placeholder="Instruções avançadas adicionadas ao final do prompt do sistema..."
                    value={systemPrompt}
                    onChange={e => setSystemPrompt(e.target.value)}
                    rows={4}
                />
                <p className="text-xs text-muted-foreground">Para usuários avançados — adicionado após o prompt gerado automaticamente</p>
            </div>

            <Button onClick={handleSave} disabled={isPending} className="self-start gap-1.5">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Conhecimento ─────────────────────────────────────────────────────────

function TabConhecimento({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { mutate: upload, isPending: uploading } = useUploadDocument()
    const { mutate: remove, isPending: removing } = useDeleteDocument()
    const [deleteTarget, setDeleteTarget] = useState<string | null>(null)

    if (!agent) return null

    function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        upload({ id: agentId, enterpriseId, file }, {
            onSuccess: () => toast.success('Documento enviado e indexado!'),
            onError: () => toast.error('Erro ao enviar documento.'),
        })
        e.target.value = ''
    }

    function handleDelete() {
        if (!deleteTarget) return
        remove({ id: agentId, docId: deleteTarget, enterpriseId }, {
            onSuccess: () => { toast.success('Documento removido.'); setDeleteTarget(null) },
            onError: () => toast.error('Erro ao remover documento.'),
        })
    }

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <div>
                <p className="text-sm text-muted-foreground">
                    Faça upload de documentos (PDF, TXT, DOCX) para que a IA aprenda sobre seu produto,
                    objeções comuns, cases de sucesso e mais.
                </p>
            </div>

            {/* Upload button */}
            <div>
                <Label
                    htmlFor="doc-upload"
                    className={cn(
                        'flex items-center gap-2 w-full cursor-pointer justify-center rounded-lg border-2 border-dashed border-border p-6 hover:border-primary/50 hover:bg-muted/30 transition-colors',
                        uploading && 'opacity-50 pointer-events-none',
                    )}
                >
                    {uploading ? (
                        <><Loader2 className="size-5 animate-spin text-muted-foreground" /><span className="text-sm text-muted-foreground">Enviando...</span></>
                    ) : (
                        <><Upload className="size-5 text-muted-foreground" /><span className="text-sm text-muted-foreground">Clique para enviar um documento</span></>
                    )}
                </Label>
                <input
                    id="doc-upload"
                    type="file"
                    className="hidden"
                    accept=".pdf,.txt,.doc,.docx,.md"
                    onChange={handleUpload}
                    disabled={uploading}
                />
                <p className="text-xs text-muted-foreground mt-1.5 text-center">
                    PDF, TXT, DOC, DOCX, MD · Máx. 10MB por arquivo
                </p>
            </div>

            {/* Document list */}
            {(agent.documents?.length ?? 0) > 0 ? (
                <div className="flex flex-col gap-2">
                    {agent.documents?.map(doc => (
                        <div key={doc.id} className="flex items-center gap-3 rounded-lg border p-3">
                            <FileText className="size-4 text-muted-foreground shrink-0" />
                            <div className="flex-1 min-w-0">
                                <p className="text-sm font-medium truncate">{doc.name}</p>
                                <p className="text-xs text-muted-foreground">
                                    {doc.chunkCount} chunk{doc.chunkCount !== 1 ? 's' : ''} indexado{doc.chunkCount !== 1 ? 's' : ''}
                                    {' · '}
                                    <span className={cn(
                                        doc.status === 'ready' ? 'text-green-600' :
                                        doc.status === 'processing' ? 'text-amber-600' : 'text-red-500',
                                    )}>
                                        {doc.status === 'ready' ? 'Pronto' : doc.status === 'processing' ? 'Processando...' : 'Erro'}
                                    </span>
                                </p>
                            </div>
                            <Button
                                size="icon"
                                variant="ghost"
                                className="size-7 text-muted-foreground hover:text-destructive shrink-0"
                                onClick={() => setDeleteTarget(doc.id)}
                                disabled={removing}
                            >
                                <Trash2 className="size-3.5" />
                            </Button>
                        </div>
                    ))}
                </div>
            ) : (
                <div className="text-center py-6 text-sm text-muted-foreground">
                    Nenhum documento ainda. Envie materiais para enriquecer o conhecimento da IA.
                </div>
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover documento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O documento e todos os seus chunks serão removidos permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={removing}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {removing ? <Loader2 className="size-4 animate-spin mr-1" /> : null}
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ─── Tab Produtos ─────────────────────────────────────────────────────────────

function TabProdutos({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { data: products = [] } = useListProducts(enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const currentIds = agent?.products?.map(p => p.product.id) ?? []
    const [selected, setSelected] = useState<string[]>(currentIds)

    if (!agent) return null

    function toggle(id: string) {
        setSelected(prev =>
            prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id],
        )
    }

    function handleSave() {
        update({
            id: agentId,
            enterpriseId,
            payload: { productIds: selected },
        }, {
            onSuccess: () => toast.success('Produtos atualizados!'),
            onError: () => toast.error('Erro ao salvar.'),
        })
    }

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <p className="text-sm text-muted-foreground">
                Selecione os produtos que este agente pode apresentar e vender.
            </p>

            {products.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Info className="size-8" />
                    <p className="text-sm">Nenhum produto cadastrado</p>
                    <p className="text-xs">Vá em Configurações → Produtos para cadastrar</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    {products.map((p: Product) => {
                        const isSelected = selected.includes(p.id)
                        return (
                            <button
                                key={p.id}
                                type="button"
                                onClick={() => toggle(p.id)}
                                className={cn(
                                    'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                    isSelected ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                                )}
                            >
                                <div className={cn(
                                    'flex size-5 shrink-0 items-center justify-center rounded border transition-colors',
                                    isSelected ? 'bg-primary border-primary' : 'border-border',
                                )}>
                                    {isSelected && <Check className="size-3 text-primary-foreground" />}
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
                </div>
            )}

            <Button
                onClick={handleSave}
                disabled={isPending || products.length === 0}
                className="self-start gap-1.5"
            >
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Pipeline ─────────────────────────────────────────────────────────────

function TabPipeline({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { data: pipelines = [] } = useListPipelines(enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const [pipelineId, setPipelineId] = useState(agent?.pipelineId ?? '')

    if (!agent) return null

    function handleSave() {
        update({
            id: agentId,
            enterpriseId,
            payload: { pipelineId: pipelineId || null },
        }, {
            onSuccess: () => toast.success('Pipeline atualizado!'),
            onError: () => toast.error('Erro ao salvar.'),
        })
    }

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <p className="text-sm text-muted-foreground">
                Associe um funil para que a IA possa mover leads automaticamente entre etapas.
            </p>

            <div className="flex flex-col gap-2">
                <button
                    type="button"
                    onClick={() => setPipelineId('')}
                    className={cn(
                        'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                        !pipelineId ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
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
                        onClick={() => setPipelineId(p.id)}
                        className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            pipelineId === p.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
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

            <Button onClick={handleSave} disabled={isPending} className="self-start gap-1.5">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Conexão ──────────────────────────────────────────────────────────────

function TabConexao({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { data: connections = [] } = useConnections(enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const [connectionId, setConnectionId] = useState(agent?.connectionId ?? '')

    if (!agent) return null

    function handleSave() {
        update({
            id: agentId,
            enterpriseId,
            payload: { connectionId: connectionId || null },
        }, {
            onSuccess: () => toast.success('Conexão atualizada!'),
            onError: () => toast.error('Erro ao salvar.'),
        })
    }

    const whatsappConns = connections.filter(c => c.type === 'WHATSAPP')

    return (
        <div className="flex flex-col gap-5 max-w-lg">
            <p className="text-sm text-muted-foreground">
                Qual número de WhatsApp este agente vai monitorar e responder automaticamente.
            </p>

            {whatsappConns.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-8 text-center text-muted-foreground">
                    <Info className="size-8" />
                    <p className="text-sm">Nenhuma conexão WhatsApp disponível</p>
                    <p className="text-xs">Crie uma conexão em <strong>Conexões</strong> primeiro</p>
                </div>
            ) : (
                <div className="flex flex-col gap-2">
                    <button
                        type="button"
                        onClick={() => setConnectionId('')}
                        className={cn(
                            'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                            !connectionId ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
                        )}
                    >
                        <div className="size-3 rounded-full bg-muted-foreground/30" />
                        <div>
                            <p className="text-sm font-medium">Sem conexão</p>
                            <p className="text-xs text-muted-foreground">IA inativa (não responderá mensagens)</p>
                        </div>
                    </button>
                    {whatsappConns.map(c => (
                        <button
                            key={c.id}
                            type="button"
                            onClick={() => setConnectionId(c.id)}
                            className={cn(
                                'flex items-center gap-3 rounded-lg border p-3 text-left transition-colors',
                                connectionId === c.id ? 'border-primary bg-primary/5' : 'border-border hover:bg-muted',
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

            <Button onClick={handleSave} disabled={isPending || whatsappConns.length === 0} className="self-start gap-1.5">
                {isPending ? <Loader2 className="size-4 animate-spin" /> : <Save className="size-4" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Leads ────────────────────────────────────────────────────────────────

function TabLeads({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)

    if (!agent) return null

    const count = agent._count?.leadStates ?? 0

    return (
        <div className="flex flex-col gap-4 max-w-lg">
            <div className="flex flex-col gap-1 rounded-lg border p-4">
                <p className="text-3xl font-bold">{count}</p>
                <p className="text-sm text-muted-foreground">
                    lead{count !== 1 ? 's' : ''} em interação com este agente
                </p>
            </div>
            <p className="text-sm text-muted-foreground">
                Gerencie leads individuais diretamente pela tela de <strong>Leads</strong> ou no <strong>Chat</strong>.
                Você pode pausar ou retomar a IA por conversa no painel de chat.
            </p>
        </div>
    )
}

// ─── Tab Atendentes ───────────────────────────────────────────────────────────

const ASSIGNMENT_STRATEGIES = [
    {
        value: 'round_robin',
        label: 'Rotativo',
        description: 'Distribui leads de forma circular entre os atendentes disponíveis.',
        icon: RotateCw,
    },
    {
        value: 'least_busy',
        label: 'Menos ocupado',
        description: 'Atribui ao atendente com menos leads abertos no momento.',
        icon: ArrowDownUp,
    },
    {
        value: 'fixed_owner',
        label: 'Atendente fixo',
        description: 'Sempre atribui ao mesmo atendente escolhido abaixo.',
        icon: UserCog,
    },
    {
        value: 'manual',
        label: 'Manual',
        description: 'A IA realiza o handoff sem atribuir automaticamente — o operador escolhe.',
        icon: HandHelping,
    },
] as const

function TabAtendentes({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { data: members = [] } = useMembers(enterpriseId)
    const { mutate: update, isPending } = useUpdateAiAgent()

    const [strategy, setStrategy] = useState(agent?.assignmentStrategy ?? 'round_robin')
    const [fixedOwnerId, setFixedOwnerId] = useState(agent?.fixedOwnerId ?? '')

    useEffect(() => {
        if (agent) {
            setStrategy(agent.assignmentStrategy ?? 'round_robin')
            setFixedOwnerId(agent.fixedOwnerId ?? '')
        }
    }, [agent])

    if (!agent) return null

    function handleSave() {
        update(
            {
                id: agentId,
                enterpriseId,
                payload: {
                    assignmentStrategy: strategy,
                    fixedOwnerId: strategy === 'fixed_owner' ? (fixedOwnerId || null) : null,
                },
            },
            {
                onSuccess: () => toast.success('Configuração salva'),
                onError: () => toast.error('Erro ao salvar'),
            },
        )
    }

    return (
        <div className="max-w-2xl space-y-6">
            <div>
                <h2 className="text-sm font-semibold mb-1">Estratégia de atribuição</h2>
                <p className="text-xs text-muted-foreground mb-4">
                    Quando a IA realizar um handoff, como o lead será distribuído entre os atendentes?
                </p>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {ASSIGNMENT_STRATEGIES.map(({ value, label, description, icon: Icon }) => (
                        <button
                            key={value}
                            type="button"
                            onClick={() => setStrategy(value)}
                            className={cn(
                                'flex items-start gap-3 rounded-lg border p-4 text-left transition-colors',
                                strategy === value
                                    ? 'border-primary bg-primary/5'
                                    : 'border-border hover:bg-muted/50',
                            )}
                        >
                            <div className={cn(
                                'flex size-8 shrink-0 items-center justify-center rounded-md',
                                strategy === value ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                            )}>
                                <Icon className="size-4" />
                            </div>
                            <div className="min-w-0">
                                <p className={cn(
                                    'text-sm font-medium leading-tight',
                                    strategy === value && 'text-primary',
                                )}>
                                    {label}
                                </p>
                                <p className="text-xs text-muted-foreground mt-0.5 leading-relaxed">
                                    {description}
                                </p>
                            </div>
                        </button>
                    ))}
                </div>
            </div>

            {strategy === 'fixed_owner' && (
                <div className="space-y-2">
                    <Label>Atendente fixo</Label>
                    <Select value={fixedOwnerId} onValueChange={setFixedOwnerId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Selecione um atendente" />
                        </SelectTrigger>
                        <SelectContent>
                            {members.map(m => (
                                <SelectItem key={m.userId} value={m.userId}>
                                    <span className="flex items-center gap-2">
                                        <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-medium uppercase shrink-0">
                                            {m.user.name.charAt(0)}
                                        </span>
                                        <span>{m.user.name}</span>
                                        <span className="text-muted-foreground text-xs">· {m.role.name}</span>
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {members.length === 0 && (
                        <p className="text-xs text-muted-foreground">Nenhum membro encontrado nesta empresa.</p>
                    )}
                </div>
            )}

            <Button onClick={handleSave} disabled={isPending} className="gap-1.5">
                {isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Save className="size-3.5" />}
                Salvar
            </Button>
        </div>
    )
}

// ─── Tab Testar ───────────────────────────────────────────────────────────────

function TabTestar({ agentId, enterpriseId }: { agentId: string; enterpriseId: string }) {
    const { data: agent } = useAiAgent(agentId, enterpriseId)
    const { mutate: sendMessage, isPending: sending } = useChatWithAgent()

    const [history, setHistory] = useState<ChatMessage[]>([])
    const [input, setInput] = useState('')
    const bottomRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [history, sending])

    if (!agent) return null

    function handleSend(e?: React.FormEvent) {
        e?.preventDefault()
        const text = input.trim()
        if (!text || sending) return

        const newHistory: ChatMessage[] = [...history, { role: 'user', content: text }]
        setHistory(newHistory)
        setInput('')

        sendMessage(
            { id: agentId, enterpriseId, message: text, history },
            {
                onSuccess: ({ text: reply }) => {
                    setHistory(prev => [...prev, { role: 'assistant', content: reply }])
                },
                onError: (err: Error) => {
                    setHistory(prev => [...prev, {
                        role: 'assistant',
                        content: `❌ Erro: ${err.message}`,
                    }])
                },
            },
        )
    }

    function handleReset() {
        setHistory([])
        setInput('')
    }

    return (
        <div className="flex flex-col max-w-2xl" style={{ minHeight: 'calc(100vh - 200px)' }}>

            {/* Info banner */}
            <div className="flex items-start gap-2 rounded-lg border border-blue-200 bg-blue-50 dark:bg-blue-950/20 dark:border-blue-900 p-3 mb-4 shrink-0">
                <Info className="size-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" />
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed">
                    Chat de teste — use para calibrar as respostas do agente.
                    As conversas aqui <strong>não são salvas</strong> e não afetam leads reais.
                    {!agent.hasApiKey && <span className="text-amber-600 dark:text-amber-400"> API Key não configurada — configure na aba Geral.</span>}
                </p>
            </div>

            {/* Histórico de mensagens */}
            <div className="flex-1 overflow-auto rounded-lg border bg-muted/20 p-4 flex flex-col gap-3" style={{ minHeight: 320 }}>
                {history.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-muted-foreground">
                        <Bot className="size-8 opacity-40" />
                        <p className="text-sm">Envie uma mensagem para começar a conversa</p>
                        <p className="text-xs opacity-70">Ex: &quot;Olá, quero saber mais sobre os seus produtos&quot;</p>
                    </div>
                ) : (
                    history.map((msg, i) => (
                        <div
                            key={i}
                            className={cn(
                                'flex max-w-[85%] flex-col gap-0.5',
                                msg.role === 'user' ? 'self-end items-end' : 'self-start items-start',
                            )}
                        >
                            <span className="text-[10px] text-muted-foreground px-1">
                                {msg.role === 'user' ? 'Você' : agent.name}
                            </span>
                            <div className={cn(
                                'rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed whitespace-pre-wrap',
                                msg.role === 'user'
                                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                                    : 'bg-background border rounded-bl-sm',
                            )}>
                                {msg.content}
                            </div>
                        </div>
                    ))
                )}
                {sending && (
                    <div className="flex items-center gap-2 self-start">
                        <div className="flex items-center gap-1 rounded-2xl rounded-bl-sm bg-background border px-4 py-3">
                            <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '0ms' }} />
                            <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '150ms' }} />
                            <span className="size-1.5 rounded-full bg-muted-foreground animate-bounce" style={{ animationDelay: '300ms' }} />
                        </div>
                    </div>
                )}
                <div ref={bottomRef} />
            </div>

            {/* Input */}
            <form onSubmit={handleSend} className="flex gap-2 mt-3 shrink-0">
                <input
                    className="flex-1 rounded-lg border bg-background px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring placeholder:text-muted-foreground disabled:opacity-50"
                    placeholder={agent.hasApiKey ? 'Digite uma mensagem...' : 'Configure a API Key para testar'}
                    value={input}
                    onChange={e => setInput(e.target.value)}
                    disabled={sending || !agent.hasApiKey}
                    onKeyDown={e => {
                        if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault()
                            handleSend()
                        }
                    }}
                    autoFocus
                />
                <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={handleReset}
                    disabled={history.length === 0}
                    title="Limpar conversa"
                    className="shrink-0"
                >
                    <RotateCcw className="size-4" />
                </Button>
                <Button
                    type="submit"
                    size="icon"
                    disabled={sending || !input.trim() || !agent.hasApiKey}
                    className="shrink-0"
                >
                    {sending
                        ? <Loader2 className="size-4 animate-spin" />
                        : <Send className="size-4" />
                    }
                </Button>
            </form>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IaDetailPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params)
    const router = useRouter()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [activeTab, setActiveTab] = useState<TabId>('geral')

    const { data: agent, isLoading } = useAiAgent(id, enterpriseId)
    const { mutate: toggle, isPending: toggling } = useToggleAiAgent()

    function handleToggle() {
        toggle({ id, enterpriseId }, {
            onSuccess: updated => toast.success(updated.isActive ? 'IA ativada' : 'IA pausada'),
            onError: () => toast.error('Erro ao alterar status'),
        })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!agent) {
        return (
            <div className="flex flex-col items-center justify-center h-full gap-3">
                <p className="text-sm text-muted-foreground">Agente não encontrado</p>
                <Button variant="outline" onClick={() => router.push('/ia')}>Voltar</Button>
            </div>
        )
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-4 border-b shrink-0">
                <button
                    onClick={() => router.push('/ia')}
                    className="flex items-center justify-center rounded size-8 hover:bg-muted transition-colors text-muted-foreground shrink-0"
                >
                    <ArrowLeft className="size-4" />
                </button>

                <div className={cn(
                    'flex size-8 shrink-0 items-center justify-center rounded-lg',
                    agent.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                )}>
                    <Bot className="size-4" />
                </div>

                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                        <h1 className="text-lg font-semibold truncate">{agent.name}</h1>
                        {agent.isActive ? (
                            <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 text-xs shrink-0">
                                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                                Ativo
                            </Badge>
                        ) : (
                            <Badge variant="secondary" className="text-xs shrink-0">Pausado</Badge>
                        )}
                    </div>
                    <p className="text-xs text-muted-foreground truncate">
                        {agent.provider} · {agent.model}
                        {agent.connection && ` · ${agent.connection.name}`}
                    </p>
                </div>

                <Button
                    size="sm"
                    variant="outline"
                    onClick={handleToggle}
                    disabled={toggling || !agent.hasApiKey}
                    title={!agent.hasApiKey ? 'Configure a API Key para ativar' : undefined}
                    className={cn(
                        'gap-1.5 shrink-0',
                        agent.isActive && 'text-amber-600 border-amber-300 hover:bg-amber-50',
                    )}
                >
                    {toggling ? <Loader2 className="size-3.5 animate-spin" /> : <Power className="size-3.5" />}
                    {agent.isActive ? 'Pausar' : 'Ativar'}
                </Button>
            </div>

            {/* ── Tabs ───────────────────────────────────────────────────── */}
            <div className="flex gap-0.5 px-6 border-b shrink-0 overflow-x-auto">
                {TABS.map(({ id: tabId, label, icon: Icon }) => (
                    <button
                        key={tabId}
                        onClick={() => setActiveTab(tabId)}
                        className={cn(
                            'flex items-center gap-1.5 px-3 py-3 text-sm border-b-2 -mb-px transition-colors shrink-0',
                            activeTab === tabId
                                ? 'border-primary text-primary font-medium'
                                : 'border-transparent text-muted-foreground hover:text-foreground',
                        )}
                    >
                        <Icon className="size-3.5" />
                        {label}
                    </button>
                ))}
            </div>

            {/* ── Tab content ────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6">
                {activeTab === 'geral' && <TabGeral agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'comportamento' && <TabComportamento agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'conhecimento' && <TabConhecimento agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'produtos' && <TabProdutos agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'pipeline' && <TabPipeline agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'conexao' && <TabConexao agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'leads' && <TabLeads agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'atendentes' && <TabAtendentes agentId={id} enterpriseId={enterpriseId} />}
                {activeTab === 'testar' && <TabTestar agentId={id} enterpriseId={enterpriseId} />}
            </div>
        </div>
    )
}
