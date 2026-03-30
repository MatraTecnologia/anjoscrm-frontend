'use client'

import { useState, useEffect } from 'react'
import { Plus, Trash2, MessageSquare, Clock, Zap, ArrowDown, CheckCircle2, Loader2 } from 'lucide-react'
import { toast } from 'sonner'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'

import {
    useFirstContact, useUpsertFirstContact,
    useCadenceFlow, useUpsertCadenceFlow,
    type CadenceBlock,
} from '@/services/cadence'
import { useConnections } from '@/services/connections'

interface Props {
    open: boolean
    onOpenChange: (open: boolean) => void
    stageId: string
    stageName: string
    enterpriseId: string
}

function formatDelay(minutes: number): string {
    if (minutes < 60) return `${minutes}min`
    const h = Math.floor(minutes / 60)
    const m = minutes % 60
    return m === 0 ? `${h}h` : `${h}h ${m}min`
}

export function CadenceConfigSheet({ open, onOpenChange, stageId, stageName, enterpriseId }: Props) {
    const { data: firstContact, isLoading: loadingFC } = useFirstContact(stageId, enterpriseId)
    const { data: flow, isLoading: loadingFlow } = useCadenceFlow(stageId, enterpriseId)
    const { data: connections } = useConnections(enterpriseId)
    const upsertFC = useUpsertFirstContact()
    const upsertFlow = useUpsertCadenceFlow()

    const [fcActive, setFcActive] = useState(false)
    const [fcMessage, setFcMessage] = useState('')
    const [fcConnectionId, setFcConnectionId] = useState<string | null>(null)

    const [flowActive, setFlowActive] = useState(false)
    const [blocks, setBlocks] = useState<CadenceBlock[]>([])

    useEffect(() => {
        if (firstContact) {
            setFcActive(firstContact.isActive)
            setFcMessage(firstContact.message ?? '')
            setFcConnectionId(firstContact.connectionId ?? null)
        }
    }, [firstContact])

    useEffect(() => {
        if (flow) {
            setFlowActive(flow.isActive ?? false)
            setBlocks((flow.blocks ?? []).map((b, i) => ({
                id: (b as CadenceBlock & { id?: string }).id,
                order: i,
                message: b.message,
                delayMinutes: b.delayMinutes,
            })))
        }
    }, [flow])

    const whatsappConnections = (connections ?? []).filter(c => c.type === 'WHATSAPP')
    const loading = loadingFC || loadingFlow

    function handleSaveFC() {
        if (fcActive && !fcMessage.trim()) {
            toast.error('Digite a mensagem de primeiro contato.')
            return
        }
        upsertFC.mutate(
            { stageId, enterpriseId, payload: { isActive: fcActive, message: fcMessage, connectionId: fcConnectionId || null } },
            {
                onSuccess: () => toast.success('Primeiro contato salvo.'),
                onError: () => toast.error('Erro ao salvar.'),
            },
        )
    }

    function addBlock() {
        setBlocks(prev => [...prev, { order: prev.length, message: '', delayMinutes: 60 }])
    }

    function removeBlock(idx: number) {
        setBlocks(prev => prev.filter((_, i) => i !== idx).map((b, i) => ({ ...b, order: i })))
    }

    function updateBlock(idx: number, field: keyof CadenceBlock, value: string | number) {
        setBlocks(prev => prev.map((b, i) => (i === idx ? { ...b, [field]: value } : b)))
    }

    function handleSaveFlow() {
        const invalid = blocks.filter(b => !b.message.trim() || b.delayMinutes < 1)
        if (invalid.length > 0) {
            toast.error('Todos os blocos precisam ter mensagem e delay mínimo de 1 min.')
            return
        }
        if (!firstContact?.id && flowActive) {
            toast.error('Salve o Primeiro Contato antes de ativar o fluxo.')
            return
        }
        upsertFlow.mutate(
            {
                stageId, enterpriseId,
                payload: {
                    isActive: flowActive,
                    blocks: blocks.map((b, i) => ({ order: i, message: b.message, delayMinutes: b.delayMinutes })),
                },
            },
            {
                onSuccess: () => toast.success('Fluxo de cadência salvo.'),
                onError: (e) => toast.error(e.message || 'Erro ao salvar fluxo.'),
            },
        )
    }

    return (
        <Sheet open={open} onOpenChange={onOpenChange}>
            <SheetContent className="w-full sm:max-w-[460px] flex flex-col gap-0 p-0" side="right">

                {/* Header fixo */}
                <div className="px-5 pt-5 pb-4 border-b bg-background">
                    <SheetHeader>
                        <SheetTitle className="flex items-center gap-2 text-base">
                            <span className="flex items-center justify-center size-7 rounded-lg bg-amber-100 dark:bg-amber-950">
                                <Zap className="size-3.5 text-amber-600 dark:text-amber-400" />
                            </span>
                            Automação de Cadência
                        </SheetTitle>
                    </SheetHeader>
                    <p className="text-xs text-muted-foreground mt-1.5 leading-relaxed">
                        Etapa: <span className="font-medium text-foreground">{stageName}</span>
                    </p>
                </div>

                {/* Conteúdo scrollável */}
                <div className="flex-1 overflow-y-auto px-5 py-5 space-y-4">
                    {loading ? (
                        <div className="flex items-center justify-center h-32 gap-2 text-muted-foreground text-sm">
                            <Loader2 className="size-4 animate-spin" />
                            Carregando...
                        </div>
                    ) : (
                        <>
                            {/* ── STEP 1: Primeiro Contato ─────────────────────────── */}
                            <div className={cn(
                                'rounded-xl border transition-all',
                                fcActive
                                    ? 'border-blue-200 bg-blue-50/40 dark:border-blue-900 dark:bg-blue-950/20'
                                    : 'border-border bg-muted/20',
                            )}>
                                {/* Cabeçalho da seção */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <span className={cn(
                                        'flex items-center justify-center size-7 rounded-full text-xs font-bold shrink-0',
                                        fcActive
                                            ? 'bg-blue-500 text-white'
                                            : 'bg-muted-foreground/20 text-muted-foreground',
                                    )}>
                                        1
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <p className="text-sm font-semibold leading-none">Primeiro Contato</p>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Enviado <strong>imediatamente</strong> ao entrar na etapa
                                        </p>
                                    </div>
                                    <Switch checked={fcActive} onCheckedChange={setFcActive} />
                                </div>

                                {/* Formulário */}
                                <div className="px-4 pb-4 space-y-3 border-t border-dashed border-border/60 pt-3">
                                    {/* Conexão */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Conexão WhatsApp
                                        </Label>
                                        <Select
                                            value={fcConnectionId ?? 'none'}
                                            onValueChange={v => setFcConnectionId(v === 'none' ? null : v)}
                                        >
                                            <SelectTrigger className="h-9 text-sm bg-background">
                                                <SelectValue placeholder="Selecionar conexão" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Nenhuma</SelectItem>
                                                {whatsappConnections.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>
                                                        <span className="flex items-center gap-2">
                                                            <span className={cn(
                                                                'size-1.5 rounded-full shrink-0',
                                                                c.status === 'CONNECTED' ? 'bg-green-500' : 'bg-muted-foreground/40',
                                                            )} />
                                                            {c.name}
                                                        </span>
                                                    </SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    </div>

                                    {/* Mensagem */}
                                    <div className="space-y-1">
                                        <Label className="text-xs font-medium text-muted-foreground uppercase tracking-wide">
                                            Mensagem
                                        </Label>
                                        <Textarea
                                            value={fcMessage}
                                            onChange={e => setFcMessage(e.target.value)}
                                            placeholder="Olá {nome}, tudo bem? Vi que você tem interesse em..."
                                            className="text-sm min-h-[90px] resize-none bg-background"
                                        />
                                        <p className="text-[11px] text-muted-foreground">
                                            Use <code className="bg-muted px-1 py-0.5 rounded text-[10px]">{'{nome}'}</code> para inserir o nome do lead
                                        </p>
                                    </div>

                                    <Button
                                        size="sm"
                                        className="w-full h-9"
                                        onClick={handleSaveFC}
                                        disabled={upsertFC.isPending}
                                    >
                                        {upsertFC.isPending
                                            ? <><Loader2 className="size-3.5 mr-2 animate-spin" /> Salvando...</>
                                            : <><CheckCircle2 className="size-3.5 mr-2" /> Salvar primeiro contato</>
                                        }
                                    </Button>
                                </div>
                            </div>

                            {/* Conector visual */}
                            <div className="flex items-center gap-2 px-4">
                                <div className="w-6 flex justify-center">
                                    <div className="w-px h-6 bg-border" />
                                </div>
                                <ArrowDown className="size-3 text-muted-foreground/50" />
                                <span className="text-[11px] text-muted-foreground/60">se não responder em…</span>
                            </div>

                            {/* ── STEP 2: Fluxo de Cadência ──────────────────────────── */}
                            <div className={cn(
                                'rounded-xl border transition-all',
                                flowActive
                                    ? 'border-amber-200 bg-amber-50/40 dark:border-amber-900 dark:bg-amber-950/20'
                                    : 'border-border bg-muted/20',
                            )}>
                                {/* Cabeçalho */}
                                <div className="flex items-center gap-3 px-4 py-3">
                                    <span className={cn(
                                        'flex items-center justify-center size-7 rounded-full text-xs font-bold shrink-0',
                                        flowActive
                                            ? 'bg-amber-500 text-white'
                                            : 'bg-muted-foreground/20 text-muted-foreground',
                                    )}>
                                        2
                                    </span>
                                    <div className="flex-1 min-w-0">
                                        <div className="flex items-center gap-2">
                                            <p className="text-sm font-semibold leading-none">Fluxo de Cadência</p>
                                            {blocks.length > 0 && (
                                                <Badge variant="secondary" className="text-[10px] px-1.5 py-0 h-4">
                                                    {blocks.length} bloco{blocks.length !== 1 ? 's' : ''}
                                                </Badge>
                                            )}
                                        </div>
                                        <p className="text-[11px] text-muted-foreground mt-0.5">
                                            Sequência automática <strong>após o primeiro contato</strong>
                                        </p>
                                    </div>
                                    <Switch checked={flowActive} onCheckedChange={setFlowActive} />
                                </div>

                                {/* Blocos */}
                                <div className="px-4 pb-4 space-y-3 border-t border-dashed border-border/60 pt-3">
                                    {blocks.length === 0 ? (
                                        <div className="flex flex-col items-center gap-2 py-6 text-center">
                                            <div className="size-10 rounded-full bg-muted flex items-center justify-center">
                                                <MessageSquare className="size-4 text-muted-foreground/50" />
                                            </div>
                                            <p className="text-xs text-muted-foreground max-w-[200px]">
                                                Nenhum bloco ainda. Adicione mensagens com delay para a cadência.
                                            </p>
                                        </div>
                                    ) : (
                                        <div className="space-y-2">
                                            {blocks.map((block, idx) => (
                                                <div key={idx}>
                                                    {/* Linha de delay (exceto no primeiro) */}
                                                    {idx > 0 && (
                                                        <div className="flex items-center gap-2 my-1 px-1">
                                                            <div className="flex-1 h-px bg-border/60" />
                                                            <span className="text-[10px] text-muted-foreground/60 flex items-center gap-1">
                                                                <Clock className="size-2.5" />
                                                                {formatDelay(block.delayMinutes)} após anterior
                                                            </span>
                                                            <div className="flex-1 h-px bg-border/60" />
                                                        </div>
                                                    )}

                                                    <div className="rounded-lg border bg-background shadow-sm">
                                                        {/* Cabeçalho do bloco */}
                                                        <div className="flex items-center gap-2 px-3 py-2 border-b border-border/50">
                                                            <span className="size-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">
                                                                {idx + 1}
                                                            </span>
                                                            <span className="text-xs font-medium flex-1">
                                                                Mensagem {idx + 1}
                                                            </span>
                                                            <button
                                                                type="button"
                                                                onClick={() => removeBlock(idx)}
                                                                className="p-1 rounded hover:bg-destructive/10 hover:text-destructive transition-colors text-muted-foreground"
                                                            >
                                                                <Trash2 className="size-3" />
                                                            </button>
                                                        </div>

                                                        {/* Corpo do bloco */}
                                                        <div className="p-3 space-y-2.5">
                                                            {/* Delay (primeiro bloco usa delay após primeiro contato) */}
                                                            <div className="flex items-center gap-2">
                                                                <Clock className="size-3 text-muted-foreground shrink-0" />
                                                                <span className="text-xs text-muted-foreground shrink-0">
                                                                    {idx === 0 ? 'Após 1º contato:' : 'Após anterior:'}
                                                                </span>
                                                                <div className="flex items-center gap-1.5 flex-1">
                                                                    <Input
                                                                        type="number"
                                                                        min={1}
                                                                        value={block.delayMinutes}
                                                                        onChange={e => updateBlock(idx, 'delayMinutes', Math.max(1, Number(e.target.value)))}
                                                                        className="h-7 text-xs w-16 text-center"
                                                                    />
                                                                    <span className="text-xs text-muted-foreground">min</span>
                                                                    <span className="text-xs font-medium text-foreground/70">
                                                                        = {formatDelay(block.delayMinutes)}
                                                                    </span>
                                                                </div>
                                                            </div>

                                                            <Textarea
                                                                value={block.message}
                                                                onChange={e => updateBlock(idx, 'message', e.target.value)}
                                                                placeholder={`Texto da mensagem ${idx + 1}...`}
                                                                className="text-sm min-h-[64px] resize-none"
                                                            />
                                                        </div>
                                                    </div>
                                                </div>
                                            ))}
                                        </div>
                                    )}

                                    <Button
                                        type="button"
                                        variant="outline"
                                        size="sm"
                                        className="w-full h-8 gap-1.5 text-xs border-dashed"
                                        onClick={addBlock}
                                    >
                                        <Plus className="size-3.5" />
                                        Adicionar bloco
                                    </Button>

                                    <Button
                                        size="sm"
                                        className="w-full h-9"
                                        onClick={handleSaveFlow}
                                        disabled={upsertFlow.isPending}
                                    >
                                        {upsertFlow.isPending
                                            ? <><Loader2 className="size-3.5 mr-2 animate-spin" /> Salvando...</>
                                            : <><CheckCircle2 className="size-3.5 mr-2" /> Salvar fluxo de cadência</>
                                        }
                                    </Button>
                                </div>
                            </div>
                        </>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
