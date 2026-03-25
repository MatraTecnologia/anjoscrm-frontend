'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    User, Activity, Briefcase,
    MessageCircle, Files, Headphones, Loader2,
    Plus, ArrowRight, Trash2, Pencil, ChevronDown,
    SlidersHorizontal, MessageSquarePlus, Send, Tag,
    ShoppingCart, MoreHorizontal, Check, Clock, X,
    Camera, Copy, ExternalLink, Calendar, CheckCircle2, Circle,
} from 'lucide-react'
import type { Value as PhoneValue } from 'react-phone-number-input'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'

import { cn } from '@/lib/utils'
import { PhoneInput } from '@/components/phone-input'
import { Dialog, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent } from '@/components/ui/sheet'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Badge } from '@/components/ui/badge'
import { ScrollArea } from '@/components/ui/scroll-area'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { Textarea } from '@/components/ui/textarea'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import type { Lead } from '@/services/leads'
import { useUpdateLead } from '@/services/leads'
import { useMembers } from '@/services/enterprises'
import { useListLeadAuditLogs, useAddLeadComment, ACTION_LABELS, type AuditLog } from '@/services/audit'
import { useLeadDeals, type DealWithPipeline } from '@/services/deals'
import { useLeadCustomFieldValues, useSaveLeadCustomFieldValues, type CustomFieldWithValue } from '@/services/custom-fields'
import { useLeadActivities, useCreateActivity, useToggleActivityComplete, useDeleteActivity, type Activity } from '@/services/activities'
import { useListActivityTypes } from '@/services/activity-types'

// ─── Crop helpers ─────────────────────────────────────────────────────────────

async function getCroppedImg(imageSrc: string, pixelCrop: Area): Promise<string> {
    const img = await new Promise<HTMLImageElement>((res, rej) => {
        const i = new window.Image()
        i.onload = () => res(i)
        i.onerror = rej
        i.src = imageSrc
    })
    const canvas = document.createElement('canvas')
    const size = 256
    canvas.width = size
    canvas.height = size
    const ctx = canvas.getContext('2d')!
    ctx.drawImage(img, pixelCrop.x, pixelCrop.y, pixelCrop.width, pixelCrop.height, 0, 0, size, size)
    return canvas.toDataURL('image/jpeg', 0.82)
}

// ─── CropModal ────────────────────────────────────────────────────────────────

function CropModal({ src, onSave, onClose }: { src: string; onSave: (dataUrl: string) => void; onClose: () => void }) {
    const [crop, setCrop]       = useState({ x: 0, y: 0 })
    const [zoom, setZoom]       = useState(1)
    const [croppedArea, setCroppedArea] = useState<Area | null>(null)
    const [saving, setSaving]   = useState(false)

    const onCropComplete = useCallback((_: Area, areaPixels: Area) => {
        setCroppedArea(areaPixels)
    }, [])

    async function handleSave() {
        if (!croppedArea) return
        setSaving(true)
        try {
            const dataUrl = await getCroppedImg(src, croppedArea)
            onSave(dataUrl)
        } finally {
            setSaving(false)
        }
    }

    return (
        <Dialog open onOpenChange={onClose}>
            <DialogContent className="max-w-sm">
                <DialogHeader>
                    <DialogTitle>Ajustar foto</DialogTitle>
                </DialogHeader>
                <div className="relative w-full aspect-square rounded-lg overflow-hidden bg-muted">
                    <Cropper
                        image={src}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>
                <div className="flex items-center gap-3 px-1">
                    <span className="text-xs text-muted-foreground">Zoom</span>
                    <input
                        type="range" min={1} max={3} step={0.05}
                        value={zoom}
                        onChange={e => setZoom(Number(e.target.value))}
                        className="flex-1 accent-primary"
                    />
                </div>
                <DialogFooter>
                    <Button variant="outline" size="sm" onClick={onClose}>Cancelar</Button>
                    <Button size="sm" onClick={handleSave} disabled={saving}>
                        {saving ? <Loader2 className="size-3 animate-spin mr-1" /> : null}
                        Salvar
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
]

function getAvatarColor(name: string) {
    let hash = 0
    for (let i = 0; i < name.length; i++) hash = name.charCodeAt(i) + ((hash << 5) - hash)
    return AVATAR_COLORS[Math.abs(hash) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function daysAgo(dateStr: string) {
    return Math.floor((Date.now() - new Date(dateStr).getTime()) / 86400000)
}

// ─── Input masks ──────────────────────────────────────────────────────────────

function applyCepMask(raw: string): string {
    const d = raw.replace(/\D/g, '').slice(0, 8)
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function applyDocMask(raw: string): string {
    const d = raw.replace(/\D/g, '')
    if (d.length <= 11) {
        // CPF: 000.000.000-00
        const c = d.slice(0, 11)
        if (c.length > 9) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6, 9)}-${c.slice(9)}`
        if (c.length > 6) return `${c.slice(0, 3)}.${c.slice(3, 6)}.${c.slice(6)}`
        if (c.length > 3) return `${c.slice(0, 3)}.${c.slice(3)}`
        return c
    }
    // CNPJ: 00.000.000/0000-00
    const n = d.slice(0, 14)
    if (n.length > 12) return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8, 12)}-${n.slice(12)}`
    if (n.length > 8)  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5, 8)}/${n.slice(8)}`
    if (n.length > 5)  return `${n.slice(0, 2)}.${n.slice(2, 5)}.${n.slice(5)}`
    if (n.length > 2)  return `${n.slice(0, 2)}.${n.slice(2)}`
    return n
}

// ─── Filter ───────────────────────────────────────────────────────────────────

type FilterType = 'all' | 'deal' | 'lead' | 'comment'

const FILTER_LABELS: Record<FilterType, string> = {
    all:     'Todos',
    deal:    'Negócios',
    lead:    'Lead',
    comment: 'Comentários',
}

function matchesFilter(log: AuditLog, filter: FilterType): boolean {
    if (filter === 'all')     return true
    if (filter === 'deal')    return log.action.startsWith('deal.')
    if (filter === 'lead')    return log.action.startsWith('lead.')
    if (filter === 'comment') return log.action === 'comment.added'
    return true
}

// ─── Timeline icon ────────────────────────────────────────────────────────────

function TimelineIcon({ action }: { action: string }) {
    const base = 'flex size-9 shrink-0 items-center justify-center rounded-full text-white'
    if (action === 'deal.moved')    return <span className={`${base} bg-emerald-500`}><ArrowRight className="size-4" /></span>
    if (action === 'deal.created')  return <span className={`${base} bg-emerald-500`}><Briefcase className="size-4" /></span>
    if (action === 'deal.deleted')  return <span className={`${base} bg-red-500`}><Trash2 className="size-4" /></span>
    if (action === 'deal.updated')  return <span className={`${base} bg-emerald-500`}><Briefcase className="size-4" /></span>
    if (action === 'lead.created')  return <span className={`${base} bg-blue-500`}><User className="size-4" /></span>
    if (action === 'lead.updated')  return <span className={`${base} bg-blue-500`}><Pencil className="size-4" /></span>
    if (action === 'lead.tag_added' || action === 'lead.tag_removed') return <span className={`${base} bg-blue-500`}><Tag className="size-4" /></span>
    if (action === 'comment.added') return <span className={`${base} bg-purple-500`}><MessageCircle className="size-4" /></span>
    return <span className={`${base} bg-muted-foreground`}><Activity className="size-4" /></span>
}

// ─── Timeline item ────────────────────────────────────────────────────────────

function TimelineItem({ log, isLast }: { log: AuditLog; isLast: boolean }) {
    const meta = log.metadata as Record<string, unknown> | null

    let content: React.ReactNode

    if (log.action === 'deal.moved') {
        const from = meta?.fromStageName as string | undefined
        const to   = meta?.toStageName   as string | undefined
        content = (
            <span>
                Negócio{' '}
                {log.entityName && <span className="text-primary font-medium">#{log.entityName}</span>}
                {' '}movido de{' '}
                {from && <span className="font-medium text-violet-500">{from}</span>}
                {from && to && <span className="text-muted-foreground"> para </span>}
                {to && <span className="font-medium text-blue-500">{to}</span>}
            </span>
        )
    } else if (log.action === 'deal.created') {
        const value = meta?.value
        content = (
            <span>
                Negócio{' '}
                {log.entityName && <span className="text-primary font-medium">#{log.entityName}</span>}
                {' '}criado
                {value != null && value !== 0 && (
                    <>
                        {' — '}
                        <span className="text-green-600 font-medium">
                            R$ {Number(value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                        </span>
                    </>
                )}
            </span>
        )
    } else if (log.action === 'deal.deleted') {
        content = (
            <span>
                Negócio{' '}
                {log.entityName && <span className="text-destructive font-medium">#{log.entityName}</span>}
                {' '}excluído
            </span>
        )
    } else if (log.action === 'deal.updated') {
        content = (
            <span>
                Negócio{' '}
                {log.entityName && <span className="text-primary font-medium">#{log.entityName}</span>}
                {' '}atualizado
            </span>
        )
    } else if (log.action === 'lead.created') {
        content = <span>Lead criado</span>
    } else if (log.action === 'lead.updated') {
        content = <span>Dados do lead atualizados</span>
    } else if (log.action === 'comment.added') {
        const comment = meta?.comment as string | undefined
        content = (
            <div className="flex flex-col gap-1.5">
                <span className="text-muted-foreground">Comentário adicionado</span>
                {comment && (
                    <div className="rounded-md border bg-muted/40 px-3 py-2 text-sm text-foreground whitespace-pre-wrap">
                        {comment}
                    </div>
                )}
            </div>
        )
    } else {
        const label = ACTION_LABELS[log.action] ?? log.action
        content = (
            <span>
                {label}
                {log.entityName && <span className="font-medium"> "{log.entityName}"</span>}
            </span>
        )
    }

    return (
        <div className="flex gap-3 px-5">
            <div className="flex flex-col items-center">
                <TimelineIcon action={log.action} />
                {!isLast && <div className="w-px flex-1 bg-border min-h-3 my-1.5" />}
            </div>
            <div className={`flex-1 min-w-0 ${isLast ? 'pb-2' : 'pb-5'}`}>
                <div className="flex items-start justify-between gap-2 pt-1.5">
                    <div className="flex-1 min-w-0 text-sm leading-snug">{content}</div>
                    <ChevronDown className="size-4 text-muted-foreground shrink-0 opacity-40 mt-0.5" />
                </div>
                <div className="flex items-center gap-2 mt-2">
                    {log.user.image ? (
                        <img src={log.user.image} alt={log.user.name} className="size-5 shrink-0 rounded-full object-cover" />
                    ) : (
                        <div className={`flex size-5 shrink-0 items-center justify-center rounded-full text-white text-[10px] font-semibold ${getAvatarColor(log.user.name)}`}>
                            {getInitials(log.user.name)}
                        </div>
                    )}
                    <span className="text-xs text-muted-foreground">{log.user.name}</span>
                    <span className="text-xs text-muted-foreground ml-auto tabular-nums shrink-0">
                        {format(new Date(log.createdAt), "dd/MM/yyyy HH:mm", { locale: ptBR })}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Histórico tab ────────────────────────────────────────────────────────────

function HistoricoTab({ leadId, enterpriseId }: { leadId: string; enterpriseId: string }) {
    const [filter, setFilter] = useState<FilterType>('all')
    const [showCommentForm, setShowCommentForm] = useState(false)
    const [commentText, setCommentText] = useState('')

    const { data, isLoading, fetchNextPage, hasNextPage, isFetchingNextPage } =
        useListLeadAuditLogs(leadId, enterpriseId)

    const addComment = useAddLeadComment(leadId, enterpriseId)

    const allLogs = data?.pages.flatMap(p => p.logs) ?? []
    const logs = allLogs.filter(log => matchesFilter(log, filter))

    function handleSaveComment() {
        if (!commentText.trim()) return
        addComment.mutate(commentText, {
            onSuccess: () => {
                setCommentText('')
                setShowCommentForm(false)
            },
        })
    }

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-4 py-3 border-b shrink-0">
                <div>
                    <p className="text-sm font-semibold">Histórico</p>
                    <p className="text-xs text-muted-foreground">Veja o histórico do seu lead</p>
                </div>
                <div className="flex items-center gap-2">
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7">
                                <SlidersHorizontal className="size-3" />
                                {FILTER_LABELS[filter]}
                                <ChevronDown className="size-3 opacity-50" />
                            </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                            {(Object.entries(FILTER_LABELS) as [FilterType, string][]).map(([value, label]) => (
                                <DropdownMenuItem key={value} onSelect={() => setFilter(value)} className={filter === value ? 'font-medium' : ''}>
                                    {label}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <Button variant="outline" size="sm" className="gap-1.5 text-xs h-7 text-primary border-primary/30 hover:bg-primary/5" onClick={() => setShowCommentForm(v => !v)}>
                        <MessageSquarePlus className="size-3" />
                        Comentário
                    </Button>
                </div>
            </div>

            {showCommentForm && (
                <div className="px-4 py-3 border-b bg-muted/10 flex flex-col gap-2 shrink-0">
                    <Textarea
                        placeholder="Escreva um comentário..."
                        className="resize-none text-sm min-h-16 bg-background"
                        value={commentText}
                        onChange={e => setCommentText(e.target.value)}
                        autoFocus
                        onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveComment() }}
                    />
                    <div className="flex items-center justify-end gap-2">
                        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={() => { setShowCommentForm(false); setCommentText('') }}>Cancelar</Button>
                        <Button size="sm" className="h-7 text-xs gap-1.5" disabled={!commentText.trim() || addComment.isPending} onClick={handleSaveComment}>
                            {addComment.isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                            Salvar
                        </Button>
                    </div>
                </div>
            )}

            {isLoading ? (
                <div className="flex flex-col gap-0 px-5 py-4">
                    {Array.from({ length: 5 }).map((_, i) => (
                        <div key={i} className="flex gap-3">
                            <div className="flex flex-col items-center">
                                <Skeleton className="size-9 rounded-full shrink-0" />
                                {i < 4 && <div className="w-px flex-1 bg-border min-h-8 my-1.5" />}
                            </div>
                            <div className="flex-1 pb-5 pt-1.5">
                                <Skeleton className="h-4 w-3/4 mb-2" />
                                <div className="flex gap-2 items-center"><Skeleton className="size-5 rounded-full" /><Skeleton className="h-3 w-1/3" /></div>
                            </div>
                        </div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                    <Activity className="size-10 opacity-20" />
                    <p className="text-sm">{filter === 'all' ? 'Nenhuma atividade registrada.' : `Nenhum evento de "${FILTER_LABELS[filter]}" encontrado.`}</p>
                </div>
            ) : (
                <div className="flex flex-col py-4">
                    {logs.map((log, i) => <TimelineItem key={log.id} log={log} isLast={i === logs.length - 1} />)}
                    {hasNextPage && (
                        <div className="px-5 pt-2">
                            <Button variant="ghost" size="sm" className="w-full text-xs" disabled={isFetchingNextPage} onClick={() => fetchNextPage()}>
                                {isFetchingNextPage ? <><Loader2 className="size-3 animate-spin mr-1" />Carregando...</> : 'Carregar mais'}
                            </Button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}

// ─── Deal row (lista de negócios) ─────────────────────────────────────────────

function DealRow({ deal, index, onClick }: { deal: DealWithPipeline; index: number; onClick: () => void }) {
    const stages = deal.pipeline.stages
    const currentStageIdx = stages.findIndex(s => s.id === deal.stageId)
    const open = daysAgo(deal.createdAt)

    return (
        <div
            className="flex items-center gap-3 px-5 py-3.5 hover:bg-muted/20 cursor-pointer transition-colors border-b last:border-0"
            onClick={onClick}
        >
            {/* Ícone + nome + valor */}
            <div className="flex items-center gap-3 w-44 shrink-0 min-w-0">
                <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-muted/60">
                    <ShoppingCart className="size-4 text-muted-foreground" />
                </div>
                <div className="min-w-0">
                    <p className="text-sm font-medium truncate">{deal.title}</p>
                    <p className="text-xs text-muted-foreground">
                        {deal.value
                            ? `R$ ${Number(deal.value).toLocaleString('pt-BR', { minimumFractionDigits: 2 })}`
                            : 'Sem valor'
                        }
                    </p>
                </div>
            </div>

            {/* Atividades */}
            <div className="w-28 shrink-0">
                <p className="text-xs text-muted-foreground">Sem atividades</p>
            </div>

            {/* Atendente */}
            <div className="w-32 shrink-0 flex items-center gap-1.5">
                <div className="flex size-6 shrink-0 items-center justify-center rounded-full bg-muted/60">
                    <User className="size-3 text-muted-foreground" />
                </div>
                <span className="text-xs text-primary truncate">Sem atendente</span>
            </div>

            {/* Pipeline + barra de progresso */}
            <div className="flex-1 min-w-0">
                <p className="text-xs font-medium text-foreground truncate mb-1">{deal.pipeline.name}</p>
                <div className="flex gap-0.5">
                    {stages.map((stage, i) => (
                        <div
                            key={stage.id}
                            className={`h-1.5 flex-1 rounded-sm transition-colors ${i <= currentStageIdx ? 'bg-primary' : 'bg-muted'}`}
                        />
                    ))}
                </div>
            </div>

            {/* Em aberto */}
            <div className="w-16 shrink-0 text-center">
                <p className="text-sm font-semibold tabular-nums">{open}d</p>
                <p className="text-[10px] text-muted-foreground">Em aberto</p>
            </div>

            <div className="w-px h-8 bg-border shrink-0" />

            {/* Tempo na etapa */}
            <div className="w-16 shrink-0 text-center">
                <p className="text-sm font-semibold tabular-nums">0d</p>
                <p className="text-[10px] text-muted-foreground">Tempo na etapa</p>
            </div>

            {/* Menu */}
            <button
                className="shrink-0 flex size-7 items-center justify-center rounded hover:bg-muted transition-colors text-muted-foreground"
                onClick={e => e.stopPropagation()}
            >
                <MoreHorizontal className="size-4" />
            </button>
        </div>
    )
}

// ─── Negócios tab ─────────────────────────────────────────────────────────────

function NegociosTab({ leadId, enterpriseId, onSelectDeal }: {
    leadId: string
    enterpriseId: string
    onSelectDeal: (deal: DealWithPipeline, number: number) => void
}) {
    const { data: deals, isLoading } = useLeadDeals(leadId, enterpriseId)

    return (
        <div className="flex flex-col h-full">
            <div className="flex items-center justify-between px-5 py-4 border-b shrink-0">
                <div>
                    <p className="text-sm font-semibold">Negócios</p>
                    <p className="text-xs text-muted-foreground">Veja qual a participação do lead</p>
                </div>
                <Button variant="ghost" size="sm" className="gap-1.5 text-xs text-primary h-7">
                    <Plus className="size-3" />
                    Criar negócio
                </Button>
            </div>

            {isLoading ? (
                <div className="flex flex-col divide-y px-5 py-3">
                    {Array.from({ length: 3 }).map((_, i) => (
                        <div key={i} className="flex items-center gap-3 py-3.5">
                            <Skeleton className="size-8 rounded-lg" />
                            <div className="flex flex-col gap-1.5 flex-1">
                                <Skeleton className="h-4 w-32" />
                                <Skeleton className="h-3 w-20" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : !deals?.length ? (
                <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                    <Briefcase className="size-10 opacity-20" />
                    <p className="text-sm">Nenhum negócio encontrado.</p>
                </div>
            ) : (
                <div className="flex flex-col">
                    {deals.map((deal, i) => (
                        <DealRow key={deal.id} deal={deal} index={i + 1} onClick={() => onSelectDeal(deal, i + 1)} />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Deal detail tab ──────────────────────────────────────────────────────────

function PipelineStepper({ stages, currentStageId }: {
    stages: DealWithPipeline['pipeline']['stages']
    currentStageId: string
}) {
    const currentIdx = stages.findIndex(s => s.id === currentStageId)

    return (
        <div className="flex items-start overflow-x-auto pb-2">
            {stages.map((stage, i) => {
                const isPast    = i < currentIdx
                const isCurrent = i === currentIdx

                return (
                    <div key={stage.id} className="flex items-start flex-1 min-w-0">
                        {/* Connector + icon + label */}
                        <div className="flex flex-col items-center flex-1 min-w-0">
                            <div className="flex items-center w-full">
                                {/* Left line */}
                                {i > 0 && (
                                    <div className={`h-0.5 flex-1 ${i <= currentIdx ? 'bg-primary' : 'bg-border'}`} />
                                )}
                                {/* Icon */}
                                <div className={`flex size-10 shrink-0 items-center justify-center rounded-full border-2 transition-colors ${
                                    isCurrent ? 'bg-primary border-primary text-white' :
                                    isPast    ? 'bg-muted border-muted-foreground/20 text-muted-foreground' :
                                               'bg-background border-border text-muted-foreground'
                                }`}>
                                    {isCurrent || isPast
                                        ? <Check className="size-4" />
                                        : <Clock className="size-3.5" />
                                    }
                                </div>
                                {/* Right line */}
                                {i < stages.length - 1 && (
                                    <div className={`h-0.5 flex-1 ${i < currentIdx ? 'bg-primary' : 'bg-border'}`} />
                                )}
                            </div>
                            {/* Stage name + time */}
                            <div className="text-center mt-2 px-1">
                                <p className="text-xs font-medium truncate max-w-20" title={stage.name}>{stage.name}</p>
                                <p className="text-xs text-muted-foreground">—</p>
                            </div>
                        </div>
                    </div>
                )
            })}
        </div>
    )
}

function DealDetailTab({ deal, dealNumber }: { deal: DealWithPipeline; dealNumber: number }) {
    const [pipelineSubTab, setPipelineSubTab] = useState<'completa' | 'jornada'>('completa')

    const value = deal.value ? Number(deal.value) : 0

    return (
        <div className="flex flex-col h-full">
            {/* 3 stat cards */}
            <div className="grid grid-cols-3 gap-3 px-5 py-4 border-b shrink-0">
                <div className="rounded-lg border border-blue-200 bg-blue-50 dark:border-blue-800 dark:bg-blue-950/40 px-4 py-3">
                    <p className="text-xs font-medium text-blue-600 dark:text-blue-400">Número</p>
                    <p className="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-0.5">#{dealNumber}</p>
                </div>
                <div className="rounded-lg border border-green-200 bg-green-50 dark:border-green-800 dark:bg-green-950/40 px-4 py-3">
                    <p className="text-xs font-medium text-green-600 dark:text-green-400">Valor Total</p>
                    <p className="text-xl font-bold text-green-700 dark:text-green-300 mt-0.5">
                        R$ {value.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}
                    </p>
                </div>
                <div className="rounded-lg border border-purple-200 bg-purple-50 dark:border-purple-800 dark:bg-purple-950/40 px-4 py-3">
                    <p className="text-xs font-medium text-purple-600 dark:text-purple-400">Data de Criação</p>
                    <p className="text-xl font-bold text-purple-700 dark:text-purple-300 mt-0.5">
                        {format(new Date(deal.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                    </p>
                </div>
            </div>

            {/* Pipeline sub-tabs + stepper */}
            <div className="px-5 py-4 border-b shrink-0">
                <div className="flex gap-4 border-b mb-5">
                    {[
                        { key: 'completa', label: 'Pipeline Completa' },
                        { key: 'jornada',  label: 'Jornada do Negócio' },
                    ].map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setPipelineSubTab(key as typeof pipelineSubTab)}
                            className={`text-sm pb-2 border-b-2 transition-colors ${
                                pipelineSubTab === key
                                    ? 'border-primary text-foreground font-medium'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>
                {pipelineSubTab === 'completa' ? (
                    <PipelineStepper stages={deal.pipeline.stages} currentStageId={deal.stageId} />
                ) : (
                    <div className="flex items-center justify-center py-10 text-muted-foreground text-sm">
                        Jornada em breve.
                    </div>
                )}
            </div>

            {/* Bottom sub-tabs */}
            <Tabs defaultValue="produtos" className="flex flex-col flex-1 min-h-0">
                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto px-3 py-2 gap-1 shrink-0">
                    {[
                        { value: 'produtos',  label: 'Produtos e Valores' },
                        { value: 'campos',    label: 'Campos adicionais' },
                        { value: 'anexos',    label: 'Anexos' },
                        { value: 'historico', label: 'Histórico' },
                        { value: 'atividades',label: 'Atividades' },
                    ].map(({ value, label }) => (
                        <TabsTrigger
                            key={value}
                            value={value}
                            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all whitespace-nowrap"
                        >
                            {label}
                        </TabsTrigger>
                    ))}
                </TabsList>

                <div className="flex-1 min-h-0 overflow-y-auto">
                    <TabsContent value="produtos" className="mt-0 h-full">
                        <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                            <ShoppingCart className="size-10 opacity-20" />
                            <p className="text-sm">Produtos em breve.</p>
                        </div>
                    </TabsContent>
                    {['campos', 'anexos', 'historico', 'atividades'].map(v => (
                        <TabsContent key={v} value={v} className="mt-0 h-full">
                            <div className="flex flex-col items-center justify-center py-20 text-muted-foreground gap-2">
                                <Activity className="size-10 opacity-20" />
                                <p className="text-sm capitalize">{v} em breve.</p>
                            </div>
                        </TabsContent>
                    ))}
                </div>
            </Tabs>
        </div>
    )
}

// ─── Placeholder tab ──────────────────────────────────────────────────────────

function PlaceholderTab({ icon: Icon, label }: { icon: React.ElementType; label: string }) {
    return (
        <div className="flex flex-col items-center justify-center h-full py-20 text-muted-foreground gap-3">
            <Icon className="size-10 opacity-20" />
            <p className="text-sm">{label} em breve.</p>
        </div>
    )
}

// ─── Lead Custom Fields Tab ───────────────────────────────────────────────────

function LeadCustomFieldsTab({ lead, enterpriseId }: { lead: Lead; enterpriseId: string }) {
    const { data: fields = [], isLoading } = useLeadCustomFieldValues(lead.id, enterpriseId)
    const { mutate: saveValues } = useSaveLeadCustomFieldValues()

    function handleSave(fieldId: string, value: unknown) {
        saveValues({ leadId: lead.id, enterpriseId, items: [{ fieldId, value }] })
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-14">
                <Loader2 className="size-4 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (fields.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-14 text-muted-foreground gap-2 px-4 text-center">
                <Plus className="size-8 opacity-20" />
                <p className="text-sm font-medium">Sem campos adicionais</p>
                <p className="text-xs opacity-70">Crie campos em Configurações → Campos Adicionais.</p>
            </div>
        )
    }

    // Group by group name
    const grouped = fields.reduce<Record<string, CustomFieldWithValue[]>>((acc, f) => {
        const g = f.group ?? ''
        if (!acc[g]) acc[g] = []
        acc[g].push(f)
        return acc
    }, {})

    return (
        <div className="px-4 py-4 flex flex-col gap-5">
            {Object.entries(grouped).map(([group, groupFields]) => (
                <div key={group} className="flex flex-col gap-3">
                    {group && (
                        <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wider">
                            {group}
                        </p>
                    )}
                    {groupFields.map(field => (
                        <CustomFieldInput
                            key={field.id}
                            field={field}
                            onSave={(value) => handleSave(field.id, value)}
                        />
                    ))}
                </div>
            ))}
        </div>
    )
}

function CustomFieldInput({
    field,
    onSave,
}: {
    field: CustomFieldWithValue
    onSave: (value: unknown) => void
}) {
    const strVal = field.value != null ? String(field.value) : ''
    const [localVal, setLocalVal] = useState(strVal)

    const inputCls = 'text-sm bg-muted/20 rounded-md px-3 py-1.5 border border-border w-full focus:outline-none focus:ring-1 focus:ring-primary'

    function commitBlur() {
        if (localVal !== strVal) onSave(localVal || null)
    }

    if (field.fieldType === 'checkbox') {
        const checked = field.value === true || field.value === 'true'
        return (
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    defaultChecked={checked}
                    onChange={e => onSave(e.target.checked)}
                    className="size-4 rounded border-border accent-primary cursor-pointer"
                />
                <label className="text-[11px] text-muted-foreground font-medium">{field.name}</label>
            </div>
        )
    }

    if (field.fieldType === 'select') {
        const opts: string[] = Array.isArray(field.options) ? field.options : []
        return (
            <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground font-medium">{field.name}</label>
                <select
                    defaultValue={strVal}
                    onChange={e => onSave(e.target.value || null)}
                    className={inputCls}
                >
                    <option value="">Não selecionado</option>
                    {opts.map(o => <option key={o} value={o}>{o}</option>)}
                </select>
            </div>
        )
    }

    if (field.fieldType === 'textarea') {
        return (
            <div className="flex flex-col gap-1">
                <label className="text-[11px] text-muted-foreground font-medium">{field.name}</label>
                <textarea
                    value={localVal}
                    onChange={e => setLocalVal(e.target.value)}
                    onBlur={commitBlur}
                    rows={3}
                    className={`${inputCls} resize-none`}
                    placeholder="Não informado"
                />
            </div>
        )
    }

    const htmlType =
        field.fieldType === 'number' || field.fieldType === 'currency' ? 'number' :
        field.fieldType === 'date' ? 'date' :
        field.fieldType === 'datetime' ? 'datetime-local' :
        field.fieldType === 'url' ? 'url' :
        field.fieldType === 'phone' ? 'tel' :
        field.fieldType === 'email' ? 'email' :
        'text'

    return (
        <div className="flex flex-col gap-1">
            <label className="text-[11px] text-muted-foreground font-medium">{field.name}</label>
            <input
                type={htmlType}
                value={localVal}
                onChange={e => setLocalVal(e.target.value)}
                onBlur={commitBlur}
                className={inputCls}
                placeholder="Não informado"
            />
        </div>
    )
}

// ─── Left panel ───────────────────────────────────────────────────────────────

type ProfileSubTab = 'perfil' | 'endereco' | 'campos'

function LeadProfile({ lead, enterpriseId }: { lead: Lead; enterpriseId: string }) {
    // Inline-edit CSS: sem borda/bg por padrão, aparece só no foco
    const inlineCls = cn(
        'text-sm w-full rounded px-2 py-1',
        'bg-transparent border border-transparent',
        'hover:bg-muted/30',
        'focus:bg-background focus:border-border/60 focus:outline-none focus:ring-1 focus:ring-primary/30',
        'transition-colors placeholder:text-muted-foreground/40',
    )

    const fileInputRef = useRef<HTMLInputElement>(null)
    const [editingName, setEditingName] = useState(false)
    const [nameValue, setNameValue]     = useState(lead.name)
    const [metricsOpen, setMetricsOpen] = useState(true)
    const [notesOpen, setNotesOpen]     = useState(false)
    const [noteText, setNoteText]       = useState('')
    const [profileTab, setProfileTab]   = useState<ProfileSubTab>('perfil')

    // Crop modal
    const [cropSrc, setCropSrc]         = useState<string | null>(null)

    // Deals for metrics
    const { data: deals } = useLeadDeals(lead.id, enterpriseId)

    // Assignee popover
    const [assigneeOpen, setAssigneeOpen] = useState(false)
    const [memberSearch, setMemberSearch] = useState('')

    // Editable field values
    const [emailVal,      setEmailVal]      = useState(lead.email ?? '')
    const [phoneVal,      setPhoneVal]      = useState(lead.phone ?? '')
    const [empresaVal,    setEmpresaVal]    = useState(lead.empresa ?? '')
    const [documentoVal,  setDocumentoVal]  = useState(applyDocMask(lead.documento ?? ''))
    const [origemVal,     setOrigemVal]     = useState(lead.origem ?? '')
    const [siteVal,       setSiteVal]       = useState(lead.site ?? '')
    const [cepVal,        setCepVal]        = useState(applyCepMask(lead.cep ?? ''))
    const [logradouroVal, setLogradouroVal] = useState(lead.logradouro ?? '')
    const [numeroVal,     setNumeroVal]     = useState(lead.numero ?? '')
    const [complementoVal,setComplementoVal]= useState(lead.complemento ?? '')
    const [bairroVal,     setBairroVal]     = useState(lead.bairro ?? '')
    const [cidadeVal,     setCidadeVal]     = useState(lead.cidade ?? '')
    const [ufVal,         setUfVal]         = useState(lead.uf ?? '')
    const [paisVal,       setPaisVal]       = useState(lead.pais ?? 'Brasil')

    const updateLead = useUpdateLead()
    const { data: members } = useMembers(enterpriseId)
    const addNote = useAddLeadComment(lead.id, enterpriseId)

    const avatarBg = getAvatarColor(lead.name)

    // ─── Computed metrics ─────────────────────────────────────────────────────
    const dealsArr = deals ?? []
    const dealsWithValue = dealsArr.filter(d => d.value != null && Number(d.value) > 0)
    const totalValue = dealsWithValue.reduce((acc, d) => acc + Number(d.value), 0)
    const avgTicket = dealsWithValue.length ? totalValue / dealsWithValue.length : 0
    const daysAsLead = daysAgo(lead.createdAt)
    const lastDealDays = dealsArr.length
        ? daysAgo(dealsArr.slice().sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())[0].createdAt)
        : null

    function formatBRL(val: number) {
        return val.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
    }

    // Sync field values when lead changes (e.g. after mutation refetch)
    useEffect(() => { setEmailVal(lead.email ?? '') },      [lead.email])
    useEffect(() => { setPhoneVal(lead.phone ?? '') },      [lead.phone])
    useEffect(() => { setEmpresaVal(lead.empresa ?? '') },  [lead.empresa])
    useEffect(() => { setDocumentoVal(applyDocMask(lead.documento ?? '')) }, [lead.documento])
    useEffect(() => { setOrigemVal(lead.origem ?? '') },    [lead.origem])
    useEffect(() => { setSiteVal(lead.site ?? '') },        [lead.site])
    useEffect(() => { setCepVal(applyCepMask(lead.cep ?? '')) }, [lead.cep])
    useEffect(() => { setLogradouroVal(lead.logradouro ?? '')}, [lead.logradouro])
    useEffect(() => { setNumeroVal(lead.numero ?? '') },    [lead.numero])
    useEffect(() => { setComplementoVal(lead.complemento ?? '')}, [lead.complemento])
    useEffect(() => { setBairroVal(lead.bairro ?? '') },    [lead.bairro])
    useEffect(() => { setCidadeVal(lead.cidade ?? '') },    [lead.cidade])
    useEffect(() => { setUfVal(lead.uf ?? '') },            [lead.uf])
    useEffect(() => { setPaisVal(lead.pais ?? 'Brasil') },  [lead.pais])

    function saveName() {
        const trimmed = nameValue.trim()
        if (!trimmed || trimmed === lead.name) { setEditingName(false); return }
        updateLead.mutate(
            { id: lead.id, enterpriseId, payload: { name: trimmed } },
            { onSettled: () => setEditingName(false) },
        )
    }

    function saveField(field: string, value: string) {
        updateLead.mutate({ id: lead.id, enterpriseId, payload: { [field]: value || null } })
    }

    function copyToClipboard(text: string) {
        navigator.clipboard.writeText(text).catch(() => {})
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        const reader = new FileReader()
        reader.onload = ev => {
            setCropSrc(ev.target?.result as string)
        }
        reader.readAsDataURL(file)
        // reset so the same file can be picked again
        e.target.value = ''
    }

    function handleCropSave(dataUrl: string) {
        setCropSrc(null)
        updateLead.mutate({ id: lead.id, enterpriseId, payload: { image: dataUrl } })
    }

    function handleSaveNote() {
        const text = noteText.trim()
        if (!text) return
        addNote.mutate(text, { onSuccess: () => setNoteText('') })
    }

    return (
        <div className="flex flex-col h-full min-h-0">

            {/* ════ TOPO FIXO — não rola ══════════════════════════ */}
            <div className="flex flex-col shrink-0">

                {/* Banner */}
                <div className="relative h-[72px] overflow-hidden bg-gradient-to-r from-orange-400 to-orange-500">
                    {lead.image && (
                        <img
                            src={lead.image}
                            alt=""
                            className="absolute inset-0 w-full h-full object-cover scale-110"
                            style={{ filter: 'blur(8px) brightness(0.6)' }}
                        />
                    )}
                </div>

                {/* Crop modal */}
                {cropSrc && (
                    <CropModal
                        src={cropSrc}
                        onSave={handleCropSave}
                        onClose={() => setCropSrc(null)}
                    />
                )}

                {/* Avatar + nome + tags */}
                <div className="flex flex-col items-center gap-2.5 px-4 pb-4 -mt-10">
                    <button className="relative group" onClick={() => fileInputRef.current?.click()}>
                        {lead.image ? (
                            <img
                                src={lead.image}
                                alt={lead.name}
                                className="size-20 rounded-full border-4 border-background object-cover shadow-sm"
                            />
                        ) : (
                            <div className={`flex size-20 items-center justify-center rounded-full border-4 border-background text-white text-2xl font-semibold shadow-sm ${avatarBg}`}>
                                {getInitials(lead.name)}
                            </div>
                        )}
                        <div className="absolute inset-0 flex items-center justify-center rounded-full bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity">
                            <Camera className="size-5 text-white" />
                        </div>
                    </button>
                    <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileChange} />

                    {editingName ? (
                        <input
                            autoFocus
                            value={nameValue}
                            onChange={e => setNameValue(e.target.value)}
                            onBlur={saveName}
                            onKeyDown={e => {
                                if (e.key === 'Enter') saveName()
                                if (e.key === 'Escape') { setNameValue(lead.name); setEditingName(false) }
                            }}
                            className="text-base font-semibold text-center bg-transparent border-b-2 border-primary focus:outline-none w-full max-w-[220px]"
                        />
                    ) : (
                        <button
                            onClick={() => { setNameValue(lead.name); setEditingName(true) }}
                            className="group flex items-center gap-1.5 text-base font-semibold hover:text-primary transition-colors text-center"
                        >
                            {lead.name}
                            <Pencil className="size-3 text-muted-foreground opacity-0 group-hover:opacity-100 transition-opacity" />
                        </button>
                    )}

                    <div className="flex flex-wrap gap-1 justify-center items-center">
                        {lead.tags.map(tag => (
                            <Badge key={tag.id} className="text-xs py-0 px-2 border-0 text-white cursor-pointer" style={{ backgroundColor: tag.color }}>
                                {tag.name}
                            </Badge>
                        ))}
                        <button className="flex size-5 items-center justify-center rounded-full border border-dashed border-muted-foreground/50 text-muted-foreground hover:border-primary hover:text-primary transition-colors">
                            <Plus className="size-3" />
                        </button>
                    </div>
                </div>

                {/* + Adicionar listas */}
                <button className="flex items-center gap-2 px-4 py-2.5 text-xs text-muted-foreground hover:bg-muted/30 transition-colors border-y">
                    <Plus className="size-3.5" />
                    Adicionar listas
                </button>

                {/* Atendente */}
                <Popover open={assigneeOpen} onOpenChange={setAssigneeOpen}>
                    <PopoverTrigger asChild>
                        <div className="flex items-center gap-2.5 px-4 py-2.5 border-b hover:bg-muted/20 cursor-pointer transition-colors">
                            {lead.assignee ? (
                                <>
                                    {lead.assignee.image ? (
                                        <img src={lead.assignee.image} alt={lead.assignee.name} className="size-7 shrink-0 rounded-full object-cover" />
                                    ) : (
                                        <div className={`flex size-7 items-center justify-center rounded-full text-white text-xs font-semibold shrink-0 ${getAvatarColor(lead.assignee.name)}`}>
                                            {getInitials(lead.assignee.name)}
                                        </div>
                                    )}
                                    <span className="text-sm">{lead.assignee.name}</span>
                                </>
                            ) : (
                                <>
                                    <div className="flex size-7 items-center justify-center rounded-full border border-dashed border-muted-foreground/40 bg-muted/20">
                                        <User className="size-3.5 text-muted-foreground" />
                                    </div>
                                    <span className="text-sm text-muted-foreground">Sem atendente</span>
                                </>
                            )}
                        </div>
                    </PopoverTrigger>
                    <PopoverContent className="w-60 p-2" align="start">
                        <input
                            className="w-full text-sm px-2 py-1.5 rounded border border-border bg-muted/20 focus:outline-none focus:ring-1 focus:ring-primary mb-2"
                            placeholder="Buscar membro..."
                            value={memberSearch}
                            onChange={e => setMemberSearch(e.target.value)}
                            autoFocus
                        />
                        <div className="flex flex-col max-h-48 overflow-y-auto gap-0.5">
                            {lead.assignee && (
                                <button
                                    onClick={() => {
                                        updateLead.mutate({ id: lead.id, enterpriseId, payload: { assigneeId: null } })
                                        setAssigneeOpen(false)
                                        setMemberSearch('')
                                    }}
                                    className="flex items-center gap-2 px-2 py-1.5 rounded text-sm text-muted-foreground hover:bg-muted transition-colors w-full text-left"
                                >
                                    <X className="size-3.5 shrink-0" />
                                    Remover atendente
                                </button>
                            )}
                            {members
                                ?.filter(m => m.user.name.toLowerCase().includes(memberSearch.toLowerCase()))
                                .map(member => (
                                    <button
                                        key={member.id}
                                        onClick={() => {
                                            updateLead.mutate({ id: lead.id, enterpriseId, payload: { assigneeId: member.user.id } })
                                            setAssigneeOpen(false)
                                            setMemberSearch('')
                                        }}
                                        className={`flex items-center gap-2 px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors w-full text-left ${lead.assignee?.id === member.user.id ? 'bg-muted' : ''}`}
                                    >
                                        {member.user.image ? (
                                            <img src={member.user.image} alt={member.user.name} className="size-6 shrink-0 rounded-full object-cover" />
                                        ) : (
                                            <div className={`flex size-6 items-center justify-center rounded-full text-white text-xs font-semibold shrink-0 ${getAvatarColor(member.user.name)}`}>
                                                {getInitials(member.user.name)}
                                            </div>
                                        )}
                                        <span className="flex-1 truncate">{member.user.name}</span>
                                        {lead.assignee?.id === member.user.id && <Check className="size-3.5 text-primary shrink-0" />}
                                    </button>
                                ))
                            }
                            {!members?.length && (
                                <p className="text-xs text-muted-foreground text-center py-2">Nenhum membro encontrado</p>
                            )}
                        </div>
                    </PopoverContent>
                </Popover>

                {/* Métricas (colapsável) */}
                <div className="border-b">
                    <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/20 transition-colors" onClick={() => setMetricsOpen(v => !v)}>
                        <span className="text-sm font-medium">Métricas</span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${metricsOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {metricsOpen && (
                        <div className="px-4 pb-3 grid grid-cols-2 gap-2">
                            {[
                                { label: 'Ticket médio',   value: formatBRL(avgTicket) },
                                { label: 'Total',           value: formatBRL(totalValue) },
                                { label: 'Dias como lead',  value: `${daysAsLead}d` },
                                { label: 'Último negócio',  value: lastDealDays != null ? `${lastDealDays}d atrás` : '—' },
                            ].map(({ label, value }) => (
                                <div key={label} className="rounded-lg border bg-muted/20 px-3 py-2">
                                    <p className="text-[11px] text-muted-foreground leading-tight">{label}</p>
                                    <p className="text-sm font-semibold mt-0.5">{value}</p>
                                </div>
                            ))}
                        </div>
                    )}
                </div>

                {/* Notas (colapsável) */}
                <div className="border-b">
                    <button className="flex items-center justify-between w-full px-4 py-3 hover:bg-muted/20 transition-colors" onClick={() => setNotesOpen(v => !v)}>
                        <span className="text-sm font-medium">Notas</span>
                        <ChevronDown className={`size-4 text-muted-foreground transition-transform duration-200 ${notesOpen ? 'rotate-180' : ''}`} />
                    </button>
                    {notesOpen && (
                        <div className="px-4 pb-3 flex flex-col gap-2">
                            <Textarea
                                placeholder="Adicione uma nota..."
                                className="resize-none text-sm min-h-20 bg-muted/20"
                                value={noteText}
                                onChange={e => setNoteText(e.target.value)}
                                onKeyDown={e => { if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) handleSaveNote() }}
                            />
                            <Button
                                size="sm"
                                className="self-end h-7 text-xs gap-1.5"
                                disabled={!noteText.trim() || addNote.isPending}
                                onClick={handleSaveNote}
                            >
                                {addNote.isPending ? <Loader2 className="size-3 animate-spin" /> : <Send className="size-3" />}
                                Salvar nota
                            </Button>
                        </div>
                    )}
                </div>

                {/* Sub-tabs */}
                <div className="flex border-b">
                    {([
                        { key: 'perfil',   label: 'Perfil' },
                        { key: 'endereco', label: 'Endereço' },
                        { key: 'campos',   label: 'Campos' },
                    ] as { key: ProfileSubTab; label: string }[]).map(({ key, label }) => (
                        <button
                            key={key}
                            onClick={() => setProfileTab(key)}
                            className={`flex-1 py-2.5 text-xs font-medium border-b-2 transition-colors ${
                                profileTab === key
                                    ? 'border-primary text-primary'
                                    : 'border-transparent text-muted-foreground hover:text-foreground'
                            }`}
                        >
                            {label}
                        </button>
                    ))}
                </div>

            </div>{/* fim topo fixo */}

            {/* ════ ÁREA ROLÁVEL — só o conteúdo das sub-tabs ═════ */}
            <div className="flex-1 min-h-0 overflow-y-auto overflow-x-hidden">

                {/* Perfil */}
                {profileTab === 'perfil' && (
                    <div className="px-4 py-4 flex flex-col gap-3.5">

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Empresa</label>
                            <input
                                value={empresaVal}
                                onChange={e => setEmpresaVal(e.target.value)}
                                onBlur={() => saveField('empresa', empresaVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Não informado"
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">E-mail</label>
                            <div className="flex items-center gap-1">
                                <input
                                    value={emailVal}
                                    onChange={e => setEmailVal(e.target.value)}
                                    onBlur={() => saveField('email', emailVal)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                    className={cn(inlineCls, 'flex-1 min-w-0')}
                                    placeholder="Não informado"
                                />
                                {emailVal && <>
                                    <button onClick={() => copyToClipboard(emailVal)} className="flex size-7 shrink-0 items-center justify-center rounded border border-border hover:bg-muted transition-colors">
                                        <Copy className="size-3 text-muted-foreground" />
                                    </button>
                                    <a href={`mailto:${emailVal}`} className="flex size-7 shrink-0 items-center justify-center rounded border border-border hover:bg-muted transition-colors">
                                        <ExternalLink className="size-3 text-muted-foreground" />
                                    </a>
                                </>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Telefone</label>
                            <div className="flex items-center gap-1">
                                {/* PhoneInput com aparência de texto quando não focado */}
                                <div
                                    className={cn(
                                        'flex-1 min-w-0 rounded transition-colors',
                                        // Transparente quando sem foco
                                        '[&:not(:focus-within)_button]:border-transparent [&:not(:focus-within)_button]:bg-transparent [&:not(:focus-within)_button]:shadow-none',
                                        '[&:not(:focus-within)_input]:border-transparent [&:not(:focus-within)_input]:bg-transparent [&:not(:focus-within)_input]:shadow-none',
                                        '[&:not(:focus-within):hover]:bg-muted/30',
                                        // Borda aparece quando focado
                                        'focus-within:ring-1 focus-within:ring-primary/30 focus-within:rounded-md',
                                    )}
                                    onBlurCapture={(e) => {
                                        const container = e.currentTarget
                                        setTimeout(() => {
                                            const isCountryOpen = !!container.querySelector('button[aria-expanded="true"]')
                                            if (!container.contains(document.activeElement) && !isCountryOpen) {
                                                saveField('phone', phoneVal)
                                            }
                                        }, 150)
                                    }}
                                >
                                    <PhoneInput
                                        value={phoneVal as PhoneValue}
                                        onChange={(v) => setPhoneVal(v ?? '')}
                                        defaultCountry="BR"
                                        onKeyDown={(e: React.KeyboardEvent) => {
                                            if (e.key === 'Enter') (e.currentTarget as HTMLElement).blur()
                                        }}
                                    />
                                </div>
                                {phoneVal && <>
                                    <button onClick={() => copyToClipboard(phoneVal)} className="flex size-7 shrink-0 items-center justify-center rounded border border-border hover:bg-muted transition-colors">
                                        <Copy className="size-3 text-muted-foreground" />
                                    </button>
                                    <a href={`tel:${phoneVal}`} className="flex size-7 shrink-0 items-center justify-center rounded border border-border hover:bg-muted transition-colors">
                                        <ExternalLink className="size-3 text-muted-foreground" />
                                    </a>
                                </>}
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Documento (CPF / CNPJ)</label>
                            <input
                                value={documentoVal}
                                onChange={e => setDocumentoVal(applyDocMask(e.target.value))}
                                onBlur={() => saveField('documento', documentoVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="000.000.000-00"
                                maxLength={18}
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Origem</label>
                            <input
                                value={origemVal}
                                onChange={e => setOrigemVal(e.target.value)}
                                onBlur={() => saveField('origem', origemVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Não informado"
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Site</label>
                            <input
                                value={siteVal}
                                onChange={e => setSiteVal(e.target.value)}
                                onBlur={() => saveField('site', siteVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Não informado"
                            />
                        </div>

                    </div>
                )}

                {/* Endereço */}
                {profileTab === 'endereco' && (
                    <div className="px-4 py-4 flex flex-col gap-3.5">

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">CEP</label>
                            <input
                                value={cepVal}
                                onChange={e => setCepVal(applyCepMask(e.target.value))}
                                onBlur={() => saveField('cep', cepVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="00000-000"
                                maxLength={9}
                            />
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Logradouro</label>
                            <input
                                value={logradouroVal}
                                onChange={e => setLogradouroVal(e.target.value)}
                                onBlur={() => saveField('logradouro', logradouroVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Rua, Avenida, Travessa..."
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex flex-col gap-0.5 w-24 shrink-0">
                                <label className="text-[11px] text-muted-foreground font-medium">Número</label>
                                <input
                                    value={numeroVal}
                                    onChange={e => setNumeroVal(e.target.value)}
                                    onBlur={() => saveField('numero', numeroVal)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                    className={inlineCls}
                                    placeholder="Nº"
                                />
                            </div>
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <label className="text-[11px] text-muted-foreground font-medium">Complemento</label>
                                <input
                                    value={complementoVal}
                                    onChange={e => setComplementoVal(e.target.value)}
                                    onBlur={() => saveField('complemento', complementoVal)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                    className={inlineCls}
                                    placeholder="Apto, Sala..."
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">Bairro</label>
                            <input
                                value={bairroVal}
                                onChange={e => setBairroVal(e.target.value)}
                                onBlur={() => saveField('bairro', bairroVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Não informado"
                            />
                        </div>

                        <div className="flex gap-2">
                            <div className="flex flex-col gap-0.5 flex-1 min-w-0">
                                <label className="text-[11px] text-muted-foreground font-medium">Cidade</label>
                                <input
                                    value={cidadeVal}
                                    onChange={e => setCidadeVal(e.target.value)}
                                    onBlur={() => saveField('cidade', cidadeVal)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                    className={inlineCls}
                                    placeholder="Não informado"
                                />
                            </div>
                            <div className="flex flex-col gap-0.5 w-20 shrink-0">
                                <label className="text-[11px] text-muted-foreground font-medium">UF</label>
                                <input
                                    value={ufVal}
                                    onChange={e => setUfVal(e.target.value.toUpperCase())}
                                    onBlur={() => saveField('uf', ufVal)}
                                    onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                    className={cn(inlineCls, 'uppercase')}
                                    placeholder="MG"
                                    maxLength={2}
                                />
                            </div>
                        </div>

                        <div className="flex flex-col gap-0.5">
                            <label className="text-[11px] text-muted-foreground font-medium">País</label>
                            <input
                                value={paisVal}
                                onChange={e => setPaisVal(e.target.value)}
                                onBlur={() => saveField('pais', paisVal)}
                                onKeyDown={e => { if (e.key === 'Enter') e.currentTarget.blur() }}
                                className={inlineCls}
                                placeholder="Brasil"
                            />
                        </div>
                    </div>
                )}

                {/* Campos adicionais */}
                {profileTab === 'campos' && (
                    <LeadCustomFieldsTab lead={lead} enterpriseId={enterpriseId} />
                )}

            </div>{/* fim área rolável */}

        </div>
    )
}

// ─── Main ─────────────────────────────────────────────────────────────────────

type LeadSheetProps = {
    lead: Lead | null
    enterpriseId: string
    open: boolean
    onOpenChange: (v: boolean) => void
    onEdit: (lead: Lead) => void
}

export function LeadSheet({ lead, enterpriseId, open, onOpenChange }: LeadSheetProps) {
    const [activeTab, setActiveTab] = useState('historico')
    const [selectedDeal, setSelectedDeal] = useState<DealWithPipeline | null>(null)
    const [selectedDealNumber, setSelectedDealNumber] = useState(1)

    function handleSelectDeal(deal: DealWithPipeline, number: number) {
        setSelectedDeal(deal)
        setSelectedDealNumber(number)
        setActiveTab('deal-detail')
    }

    function handleCloseDealDetail() {
        setSelectedDeal(null)
        setActiveTab('negocios')
    }

    // Reset state when sheet closes
    function handleOpenChange(v: boolean) {
        if (!v) {
            setActiveTab('historico')
            setSelectedDeal(null)
        }
        onOpenChange(v)
    }

    const mainTabs = [
        { value: 'historico',    label: 'Histórico' },
        { value: 'atividades',   label: 'Atividades' },
        { value: 'negocios',     label: 'Negócios' },
        { value: 'arquivos',     label: 'Arquivos' },
        { value: 'atendimentos', label: 'Atendimentos' },
    ]

    return (
        <Sheet open={open} onOpenChange={handleOpenChange}>
            <SheetContent
                side="right"
                showCloseButton={false}
                className="p-0 flex flex-col gap-0"
                style={{ width: '85vw', maxWidth: '85vw' }}
            >
                {lead && (
                    <div className="flex h-full min-h-0">
                        {/* ── Left panel ─────────────────────────────── */}
                        <div className="w-[310px] shrink-0 border-r flex flex-col h-full min-h-0">
                            <LeadProfile lead={lead} enterpriseId={enterpriseId} />
                        </div>

                        {/* ── Right panel ────────────────────────────── */}
                        <div className="flex flex-col flex-1 min-w-0 min-h-0">
                            <Tabs value={activeTab} onValueChange={setActiveTab} className="flex flex-col flex-1 min-h-0">
                                {/* Tabs bar */}
                                <TabsList className="w-full justify-start rounded-none border-b bg-transparent h-auto px-3 py-2 gap-1 shrink-0 overflow-x-auto">
                                    {mainTabs.map(({ value, label }) => (
                                        <TabsTrigger
                                            key={value}
                                            value={value}
                                            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all whitespace-nowrap"
                                        >
                                            {label}
                                        </TabsTrigger>
                                    ))}
                                    {/* Dynamic deal-detail tab */}
                                    {selectedDeal && (
                                        <TabsTrigger
                                            value="deal-detail"
                                            className="rounded-lg px-3.5 py-1.5 text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-muted/60 data-[state=active]:bg-primary/10 data-[state=active]:text-primary data-[state=active]:shadow-none transition-all whitespace-nowrap flex items-center gap-1.5"
                                        >
                                            Informações do Negócio
                                            <span
                                                role="button"
                                                onClick={e => { e.stopPropagation(); handleCloseDealDetail() }}
                                                className="flex size-4 items-center justify-center rounded-full hover:bg-primary/20 transition-colors"
                                            >
                                                <X className="size-3" />
                                            </span>
                                        </TabsTrigger>
                                    )}
                                </TabsList>

                                {/* Tab contents */}
                                <div className="flex-1 min-h-0 overflow-y-auto">
                                    <TabsContent value="historico" className="mt-0 h-full">
                                        <HistoricoTab leadId={lead.id} enterpriseId={enterpriseId} />
                                    </TabsContent>
                                    <TabsContent value="atividades" className="mt-0 h-full">
                                        <PlaceholderTab icon={Activity} label="Atividades" />
                                    </TabsContent>
                                    <TabsContent value="negocios" className="mt-0 h-full">
                                        <NegociosTab
                                            leadId={lead.id}
                                            enterpriseId={enterpriseId}
                                            onSelectDeal={(deal, number) => handleSelectDeal(deal, number)}
                                        />
                                    </TabsContent>
                                    <TabsContent value="arquivos" className="mt-0 h-full">
                                        <PlaceholderTab icon={Files} label="Arquivos" />
                                    </TabsContent>
                                    <TabsContent value="atendimentos" className="mt-0 h-full">
                                        <PlaceholderTab icon={Headphones} label="Atendimentos" />
                                    </TabsContent>
                                    {selectedDeal && (
                                        <TabsContent value="deal-detail" className="mt-0 h-full">
                                            <DealDetailTab deal={selectedDeal} dealNumber={selectedDealNumber} />
                                        </TabsContent>
                                    )}
                                </div>
                            </Tabs>
                        </div>
                    </div>
                )}
            </SheetContent>
        </Sheet>
    )
}
