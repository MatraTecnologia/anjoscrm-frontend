'use client'

import { useRef, useState, useEffect, useMemo } from 'react'
import { useParams } from 'next/navigation'
import { useQueryClient } from '@tanstack/react-query'
import { useVirtualizer } from '@tanstack/react-virtual'
import {
    DndContext,
    DragOverlay,
    PointerSensor,
    useSensor,
    useSensors,
    useDroppable,
    useDraggable,
    type DragStartEvent,
    type DragEndEvent,
} from '@dnd-kit/core'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import {
    MoreHorizontal, Plus, Search, SlidersHorizontal, ArrowUpDown,
    Loader2, Banknote, CalendarDays, Tag as TagIcon,
    MessageCircle, ChevronDown, Trash2, ArrowLeft, UserPlus,
    Pencil, Trophy, XCircle, User, Send, X, Check, WifiOff,
    Package, Minus,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useEnterprise } from '@/hooks/use-enterprise'
import { usePipelineSocket } from '@/hooks/use-pipeline-socket'
import { useGetPipeline, type PipelineStage } from '@/services/pipelines'
import {
    useStageDeals, useCreateDeal, useUpdateDeal, useDeleteDeal,
    useListDealProducts, useAddDealProduct, useUpdateDealProduct, useRemoveDealProduct,
    type Deal, type DealLead, type StageDealsPage,
} from '@/services/deals'
import { useListProducts } from '@/services/products'
import { useLeads, useCreateLead, useUpdateLead } from '@/services/leads'
import { useMembers } from '@/services/enterprises'
import { useListTags } from '@/services/tags'
import { useConnections } from '@/services/connections'
import { useMessages, useSendMessage, useChatSocket } from '@/services/chat'
import { keys } from '@/lib/keys'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#14b8a6', '#f97316',
]

function avatarColor(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function initials(name: string) {
    return name.split(' ').map((w) => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatBRL(val: string | number | null) {
    if (val === null || val === undefined) return 'R$ 0,00'
    return Number(val).toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

// ─── Tipos locais ─────────────────────────────────────────────────────────────

type Sort = 'recent' | 'value_desc' | 'value_asc' | 'alpha'
type Tab = 'recent' | 'interval' | 'lastyear'

const SORT_LABELS: Record<Sort, string> = {
    recent: 'Mais recentes',
    value_desc: 'Maior valor',
    value_asc: 'Menor valor',
    alpha: 'Alfabética',
}

// ─── Deal Card Body (visual compartilhado) ────────────────────────────────────

function DealCardBody({
    deal,
    index,
    stages,
    enterpriseId,
    handleProps,
    onWhatsappClick,
}: {
    deal: Deal
    index: number
    stages: PipelineStage[]
    enterpriseId: string
    handleProps?: React.HTMLAttributes<HTMLElement>
    onWhatsappClick?: (lead: DealLead) => void
}) {
    const qc = useQueryClient()
    const updateDeal = useUpdateDeal()
    const deleteDeal = useDeleteDeal()
    const updateLead = useUpdateLead()
    const { data: members = [] } = useMembers(enterpriseId)
    const color = avatarColor(deal.lead.name)

    const [sheetOpen, setSheetOpen] = useState(false)
    const [editTitle, setEditTitle] = useState('')
    const [editValue, setEditValue] = useState('')
    const [memberSearch, setMemberSearch] = useState('')
    const [tagPickerOpen, setTagPickerOpen] = useState(false)
    const [productSearch, setProductSearch] = useState('')
    const { data: allTags = [] } = useListTags(enterpriseId)

    const { data: dealProducts = [] } = useListDealProducts(sheetOpen ? deal.id : '')
    const { data: allProducts = [] } = useListProducts(enterpriseId, productSearch ? { q: productSearch } : undefined)
    const addDealProduct = useAddDealProduct()
    const updateDealProduct = useUpdateDealProduct()
    const removeDealProduct = useRemoveDealProduct()

    const ganhoStage = stages.find(s => s.name.toLowerCase().includes('ganho'))
    const perdidoStage = stages.find(s =>
        s.name.toLowerCase().includes('perdido') || s.name.toLowerCase().includes('perder'),
    )
    const otherStages = stages.filter(s =>
        s.id !== deal.stageId &&
        s.id !== ganhoStage?.id &&
        s.id !== perdidoStage?.id,
    )

    const assignee = deal.lead.assignee
    const currentStage = stages.find(s => s.id === deal.stageId)
    const filteredMembers = members.filter(m =>
        m.user.name.toLowerCase().includes(memberSearch.toLowerCase()),
    )

    function openSheet() {
        setEditTitle(deal.title)
        setEditValue(deal.value != null ? String(deal.value) : '')
        setMemberSearch('')
        setProductSearch('')
        setSheetOpen(true)
    }

    function handleMove(stageId: string) {
        updateDeal.mutate(
            { id: deal.id, enterpriseId, stageId },
            { onError: (e) => toast.error(e.message) },
        )
    }

    function handleDelete() {
        deleteDeal.mutate(
            { id: deal.id, enterpriseId },
            {
                onSuccess: () => { setSheetOpen(false); toast.success('Negócio excluído.') },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleSaveDeal() {
        if (!editTitle.trim()) return
        updateDeal.mutate(
            {
                id: deal.id,
                enterpriseId,
                title: editTitle.trim(),
                value: editValue ? Number(editValue.replace(',', '.')) : null,
            },
            { onError: (e) => toast.error(e.message) },
        )
    }

    function handleAssign(userId: string | null) {
        updateLead.mutate(
            { id: deal.leadId, enterpriseId, payload: { assigneeId: userId } },
            {
                onSuccess: () => {
                    qc.invalidateQueries({ queryKey: keys.deals.byStage(deal.stageId) })
                    toast.success(userId ? 'Atendente atribuído!' : 'Atendente removido.')
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleToggleTag(tagId: string) {
        const currentIds = deal.lead.tags.map(t => t.id)
        const newIds = currentIds.includes(tagId)
            ? currentIds.filter(id => id !== tagId)
            : [...currentIds, tagId]
        updateLead.mutate(
            { id: deal.leadId, enterpriseId, payload: { tagIds: newIds } },
            {
                onSuccess: () => qc.invalidateQueries({ queryKey: keys.deals.byStage(deal.stageId) }),
                onError: (e) => toast.error(e.message),
            },
        )
    }

    return (
        <>
            <div className="mx-2 mb-2 rounded-lg border bg-background shadow-sm hover:shadow-md transition-shadow select-none">
                <div className="flex items-start gap-2 p-3 pb-2">
                    {/* Drag handle */}
                    {handleProps && (
                        <div
                            {...(handleProps as React.HTMLAttributes<HTMLDivElement>)}
                            className="mt-1 cursor-grab active:cursor-grabbing text-muted-foreground/30 hover:text-muted-foreground/60 transition-colors flex-shrink-0"
                        >
                            <svg width="8" height="14" viewBox="0 0 8 14" fill="currentColor">
                                <circle cx="2" cy="2" r="1.5" />
                                <circle cx="6" cy="2" r="1.5" />
                                <circle cx="2" cy="7" r="1.5" />
                                <circle cx="6" cy="7" r="1.5" />
                                <circle cx="2" cy="12" r="1.5" />
                                <circle cx="6" cy="12" r="1.5" />
                            </svg>
                        </div>
                    )}

                    {/* Avatar */}
                    {deal.lead.image ? (
                        <img src={deal.lead.image} alt={deal.lead.name} className="size-7 rounded-full flex-shrink-0 object-cover" />
                    ) : (
                        <div
                            className="size-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                            style={{ backgroundColor: color }}
                        >
                            {initials(deal.lead.name)}
                        </div>
                    )}

                    {/* Título + lead */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-1">
                            <button
                                className="text-xs font-semibold leading-tight truncate text-left hover:text-blue-600 transition-colors"
                                onPointerDown={(e) => e.stopPropagation()}
                                onClick={openSheet}
                            >
                                {deal.title}
                            </button>
                            <span className="text-[10px] text-muted-foreground flex-shrink-0">#{index + 1}</span>
                        </div>
                        <p className="text-[11px] text-muted-foreground truncate mt-0.5">{deal.lead.name}</p>
                    </div>

                    {/* Menu */}
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button
                                className="p-0.5 rounded hover:bg-muted transition-colors flex-shrink-0"
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <MoreHorizontal className="size-3.5 text-muted-foreground" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-48">
                            <DropdownMenuItem onSelect={openSheet}>
                                <Pencil className="size-3.5 mr-2" />
                                Editar negócio
                            </DropdownMenuItem>

                            <DropdownMenuSeparator />

                            {ganhoStage && ganhoStage.id !== deal.stageId && (
                                <DropdownMenuItem
                                    className="text-green-600 focus:text-green-600"
                                    onClick={() => handleMove(ganhoStage.id)}
                                >
                                    <Trophy className="size-3.5 mr-2" />
                                    Ganho
                                </DropdownMenuItem>
                            )}

                            {perdidoStage && perdidoStage.id !== deal.stageId && (
                                <DropdownMenuItem
                                    className="text-orange-600 focus:text-orange-600"
                                    onClick={() => handleMove(perdidoStage.id)}
                                >
                                    <XCircle className="size-3.5 mr-2" />
                                    Perdido
                                </DropdownMenuItem>
                            )}

                            {otherStages.length > 0 && (
                                <>
                                    <DropdownMenuSeparator />
                                    {otherStages.map((s) => (
                                        <DropdownMenuItem key={s.id} onClick={() => handleMove(s.id)}>
                                            <span
                                                className="size-2 rounded-full mr-2 flex-shrink-0"
                                                style={{ backgroundColor: s.color }}
                                            />
                                            Mover para {s.name}
                                        </DropdownMenuItem>
                                    ))}
                                </>
                            )}

                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                                className="text-red-600 focus:text-red-600"
                                onClick={handleDelete}
                            >
                                <Trash2 className="size-3.5 mr-2" />
                                Excluir
                            </DropdownMenuItem>
                        </DropdownMenuContent>
                    </DropdownMenu>
                </div>

                {/* Infos */}
                <div className="px-3 pb-2 space-y-0.5">
                    <div className="flex items-center gap-1.5 text-xs">
                        <Banknote className="size-3 flex-shrink-0 text-muted-foreground" />
                        <button
                            className="text-blue-600 font-medium hover:underline"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={openSheet}
                        >
                            {formatBRL(deal.value)}
                        </button>
                    </div>
                    <div className="flex items-center gap-1.5 text-[11px] text-muted-foreground">
                        <CalendarDays className="size-3 flex-shrink-0" />
                        <span>{format(new Date(deal.createdAt), 'dd/MM/yyyy', { locale: ptBR })}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs">
                        <User className="size-3 flex-shrink-0 text-muted-foreground" />
                        <button
                            className="text-blue-600 font-medium hover:underline truncate"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={openSheet}
                        >
                            {assignee ? assignee.name : 'Sem atendente'}
                        </button>
                    </div>
                </div>

                {/* Tags */}
                {deal.lead.tags.length > 0 && (
                    <div className="px-3 pb-2 flex flex-wrap gap-1">
                        {deal.lead.tags.map((tag) => (
                            <span
                                key={tag.id}
                                className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium"
                                style={{
                                    backgroundColor: tag.color + '22',
                                    color: tag.color,
                                    border: `1px solid ${tag.color}44`,
                                }}
                            >
                                {tag.name}
                            </span>
                        ))}
                    </div>
                )}

                {/* Footer */}
                <div className="px-3 pb-2 flex items-center justify-end gap-1 border-t mt-1 pt-1.5">
                    {deal.lead.phone && (
                        <button
                            className="p-1 rounded hover:bg-muted transition-colors text-green-600"
                            onPointerDown={(e) => e.stopPropagation()}
                            onClick={() => onWhatsappClick?.(deal.lead)}
                        >
                            <MessageCircle className="size-3.5" />
                        </button>
                    )}
                    <Popover open={tagPickerOpen} onOpenChange={setTagPickerOpen}>
                        <PopoverTrigger asChild>
                            <button
                                className={cn(
                                    'p-1 rounded hover:bg-muted transition-colors',
                                    deal.lead.tags.length > 0 ? 'text-blue-600' : 'text-muted-foreground',
                                )}
                                onPointerDown={(e) => e.stopPropagation()}
                            >
                                <TagIcon className="size-3.5" />
                            </button>
                        </PopoverTrigger>
                        <PopoverContent className="w-52 p-0" align="end" side="top" sideOffset={4}>
                            <div className="px-3 py-2 border-b">
                                <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide">
                                    Etiquetas
                                </p>
                            </div>
                            <div className="max-h-44 overflow-y-auto py-1">
                                {allTags.length === 0 ? (
                                    <p className="text-xs text-muted-foreground text-center py-4">Nenhuma etiqueta</p>
                                ) : (
                                    allTags.map(tag => {
                                        const isSelected = deal.lead.tags.some(t => t.id === tag.id)
                                        return (
                                            <button
                                                key={tag.id}
                                                onClick={() => handleToggleTag(tag.id)}
                                                className="w-full flex items-center gap-2 px-3 py-1.5 hover:bg-muted transition-colors text-xs"
                                            >
                                                <span
                                                    className="size-2.5 rounded-full flex-shrink-0"
                                                    style={{ backgroundColor: tag.color }}
                                                />
                                                <span className="flex-1 text-left">{tag.name}</span>
                                                {isSelected && <Check className="size-3 text-blue-600 flex-shrink-0" />}
                                            </button>
                                        )
                                    })
                                )}
                            </div>
                        </PopoverContent>
                    </Popover>
                </div>
            </div>

            {/* ── Sheet: detalhe do negócio ─────────────────────────────────────── */}
            <Sheet open={sheetOpen} onOpenChange={setSheetOpen}>
                <SheetContent className="w-full max-w-sm flex flex-col gap-0 p-0">
                    <SheetHeader className="px-5 py-4 border-b">
                        <div className="flex items-center gap-2.5">
                            {deal.lead.image ? (
                                <img src={deal.lead.image} alt={deal.lead.name} className="size-9 rounded-full flex-shrink-0 object-cover" />
                            ) : (
                                <div
                                    className="size-9 rounded-full flex-shrink-0 flex items-center justify-center text-white text-xs font-bold"
                                    style={{ backgroundColor: color }}
                                >
                                    {initials(deal.lead.name)}
                                </div>
                            )}
                            <div className="flex flex-col min-w-0">
                                <SheetTitle className="text-sm font-semibold leading-tight">{deal.lead.name}</SheetTitle>
                                <p className="text-[11px] text-muted-foreground mt-0.5">
                                    {currentStage?.name ?? 'Sem etapa'}
                                </p>
                            </div>
                        </div>
                    </SheetHeader>

                    <div className="flex-1 overflow-auto px-5 py-4 flex flex-col gap-5">
                        {/* Título */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Título</Label>
                            <Input
                                value={editTitle}
                                onChange={(e) => setEditTitle(e.target.value)}
                                onBlur={handleSaveDeal}
                                onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                className="text-sm"
                            />
                        </div>

                        {/* Valor */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Valor</Label>
                            <div className="relative">
                                <span className="absolute left-3 top-2.5 text-xs text-muted-foreground">R$</span>
                                <Input
                                    className="pl-9 text-sm"
                                    placeholder="0,00"
                                    value={editValue}
                                    onChange={(e) => setEditValue(e.target.value.replace(/[^0-9,]/g, ''))}
                                    onBlur={handleSaveDeal}
                                    onKeyDown={(e) => e.key === 'Enter' && e.currentTarget.blur()}
                                />
                            </div>
                        </div>

                        {/* Etapa */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Etapa</Label>
                            <div className="flex flex-wrap gap-1.5">
                                {stages.map(s => (
                                    <button
                                        key={s.id}
                                        onClick={() => handleMove(s.id)}
                                        className={cn(
                                            'flex items-center gap-1 px-2 py-1 rounded-md text-[11px] font-medium border transition-colors',
                                            deal.stageId === s.id
                                                ? 'bg-primary text-primary-foreground border-primary'
                                                : 'border-border hover:bg-muted',
                                        )}
                                    >
                                        <span
                                            className="size-1.5 rounded-full flex-shrink-0"
                                            style={{ backgroundColor: s.color ?? '#888' }}
                                        />
                                        {s.name}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Atendente */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Atendente</Label>
                            <div className="relative mb-1">
                                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                                <input
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Pesquisar..."
                                    value={memberSearch}
                                    onChange={(e) => setMemberSearch(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col rounded-md border overflow-hidden max-h-44 overflow-y-auto">
                                <button
                                    onClick={() => handleAssign(null)}
                                    className={cn(
                                        'flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-left',
                                        !assignee && 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 font-medium',
                                    )}
                                >
                                    <div className="size-6 rounded-full flex-shrink-0 flex items-center justify-center bg-muted">
                                        <User className="size-3 text-muted-foreground" />
                                    </div>
                                    Sem atendente
                                    {!assignee && <span className="ml-auto text-blue-500 text-[10px]">✓</span>}
                                </button>

                                {filteredMembers.map(m => (
                                    <button
                                        key={m.id}
                                        onClick={() => handleAssign(m.user.id)}
                                        className={cn(
                                            'flex items-center gap-2.5 px-3 py-2 text-xs hover:bg-muted transition-colors text-left',
                                            assignee?.id === m.user.id && 'bg-blue-50 dark:bg-blue-950/30 text-blue-600 font-medium',
                                        )}
                                    >
                                        <div
                                            className="size-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                                            style={{ backgroundColor: avatarColor(m.user.name) }}
                                        >
                                            {initials(m.user.name)}
                                        </div>
                                        <span className="truncate">{m.user.name}</span>
                                        {assignee?.id === m.user.id && <span className="ml-auto text-blue-500 text-[10px]">✓</span>}
                                    </button>
                                ))}
                            </div>
                        </div>

                        {/* Produtos */}
                        <div className="flex flex-col gap-1.5">
                            <Label className="text-xs text-muted-foreground">Produtos</Label>

                            {/* Lista de produtos já adicionados */}
                            {dealProducts.length > 0 && (
                                <div className="flex flex-col gap-1 mb-1">
                                    {dealProducts.map(dp => (
                                        <div key={dp.id} className="flex items-center gap-2 px-2.5 py-1.5 rounded-md border bg-muted/20 text-xs">
                                            <Package className="size-3 flex-shrink-0 text-muted-foreground" />
                                            <span className="flex-1 truncate">{dp.product.name}</span>
                                            <div className="flex items-center gap-0.5">
                                                <button
                                                    onClick={() => updateDealProduct.mutate({ dealId: deal.id, productId: dp.productId, quantity: Math.max(1, dp.quantity - 1) })}
                                                    className="size-5 rounded flex items-center justify-center hover:bg-muted border"
                                                >
                                                    <Minus className="size-3" />
                                                </button>
                                                <span className="w-6 text-center font-medium">{dp.quantity}</span>
                                                <button
                                                    onClick={() => updateDealProduct.mutate({ dealId: deal.id, productId: dp.productId, quantity: dp.quantity + 1 })}
                                                    className="size-5 rounded flex items-center justify-center hover:bg-muted border"
                                                >
                                                    <Plus className="size-3" />
                                                </button>
                                            </div>
                                            <span className="text-muted-foreground text-[11px] min-w-[4.5rem] text-right">
                                                {formatBRL(dp.unitPrice * dp.quantity)}
                                            </span>
                                            <button
                                                onClick={() => removeDealProduct.mutate({ dealId: deal.id, productId: dp.productId })}
                                                className="p-0.5 rounded hover:bg-red-50 dark:hover:bg-red-950/30 hover:text-red-500 text-muted-foreground/40 transition-colors"
                                            >
                                                <X className="size-3" />
                                            </button>
                                        </div>
                                    ))}
                                    <div className="flex justify-end pr-1">
                                        <span className="text-[11px] text-muted-foreground">
                                            Total: <strong className="text-foreground">
                                                {formatBRL(dealProducts.reduce((sum, dp) => sum + dp.unitPrice * dp.quantity, 0))}
                                            </strong>
                                        </span>
                                    </div>
                                </div>
                            )}

                            {/* Busca para adicionar produto */}
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                                <input
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Buscar produto para adicionar..."
                                    value={productSearch}
                                    onChange={(e) => setProductSearch(e.target.value)}
                                />
                            </div>
                            {productSearch && (
                                <div className="flex flex-col rounded-md border overflow-hidden max-h-36 overflow-y-auto">
                                    {allProducts.length === 0 ? (
                                        <p className="text-xs text-muted-foreground text-center py-4">Nenhum produto encontrado</p>
                                    ) : (
                                        allProducts.map(p => {
                                            const alreadyAdded = dealProducts.some(dp => dp.productId === p.id)
                                            return (
                                                <button
                                                    key={p.id}
                                                    disabled={alreadyAdded || addDealProduct.isPending}
                                                    onClick={() => {
                                                        if (alreadyAdded) return
                                                        addDealProduct.mutate(
                                                            { dealId: deal.id, productId: p.id, quantity: 1 },
                                                            { onSuccess: () => setProductSearch('') },
                                                        )
                                                    }}
                                                    className={cn(
                                                        'flex items-center gap-2 px-3 py-2 text-xs hover:bg-muted transition-colors text-left',
                                                        alreadyAdded && 'opacity-50 cursor-default',
                                                    )}
                                                >
                                                    <Package className="size-3 flex-shrink-0 text-muted-foreground" />
                                                    <span className="flex-1 truncate">{p.name}</span>
                                                    <span className="text-muted-foreground flex-shrink-0">{formatBRL(p.price)}</span>
                                                    {alreadyAdded
                                                        ? <Check className="size-3 text-blue-500 flex-shrink-0" />
                                                        : <Plus className="size-3 text-muted-foreground flex-shrink-0" />
                                                    }
                                                </button>
                                            )
                                        })
                                    )}
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Footer */}
                    <div className="px-5 py-3 border-t flex items-center justify-between">
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
                            onClick={handleDelete}
                            disabled={deleteDeal.isPending}
                        >
                            {deleteDeal.isPending
                                ? <Loader2 className="size-3.5 animate-spin mr-1.5" />
                                : <Trash2 className="size-3.5 mr-1.5" />
                            }
                            Excluir
                        </Button>
                        <Button variant="outline" size="sm" onClick={() => setSheetOpen(false)}>
                            Fechar
                        </Button>
                    </div>
                </SheetContent>
            </Sheet>
        </>
    )
}

// ─── Deal Card (com drag) ─────────────────────────────────────────────────────

function DealCard({
    deal,
    index,
    stages,
    enterpriseId,
    onWhatsappClick,
}: {
    deal: Deal
    index: number
    stages: PipelineStage[]
    enterpriseId: string
    onWhatsappClick?: (lead: DealLead) => void
}) {
    const { attributes, listeners, setNodeRef, isDragging } = useDraggable({
        id: deal.id,
        data: { deal },
    })

    return (
        <div
            ref={setNodeRef}
            style={{ opacity: isDragging ? 0.25 : 1 }}
            {...attributes}
        >
            <DealCardBody
                deal={deal}
                index={index}
                stages={stages}
                enterpriseId={enterpriseId}
                handleProps={listeners}
                onWhatsappClick={onWhatsappClick}
            />
        </div>
    )
}

// ─── Popover Novo Negócio ─────────────────────────────────────────────────────

type PopoverStep = 'search' | 'deal-form' | 'new-lead'

function NewDealPopover({
    stageId,
    pipelineId,
    enterpriseId,
}: {
    stageId: string
    pipelineId: string
    enterpriseId: string
}) {
    const [open, setOpen] = useState(false)
    const [step, setStep] = useState<PopoverStep>('search')
    const [search, setSearch] = useState('')
    const [selectedLead, setSelectedLead] = useState<{ id: string; name: string; image: string | null } | null>(null)
    const [title, setTitle] = useState('')
    const [value, setValue] = useState('')
    const [newName, setNewName] = useState('')
    const [newPhone, setNewPhone] = useState('')
    const [newEmail, setNewEmail] = useState('')

    const { data: leads = [], isLoading: leadsLoading } = useLeads(enterpriseId, search || undefined)
    const createDeal = useCreateDeal()
    const createLead = useCreateLead()

    function reset() {
        setStep('search')
        setSearch('')
        setSelectedLead(null)
        setTitle('')
        setValue('')
        setNewName('')
        setNewPhone('')
        setNewEmail('')
    }

    function handleOpen(next: boolean) {
        setOpen(next)
        if (!next) reset()
    }

    function handleSelectLead(lead: { id: string; name: string; image: string | null }) {
        setSelectedLead(lead)
        setTitle(lead.name)
        setStep('deal-form')
    }

    function handleSubmitDeal() {
        if (!selectedLead || !title.trim()) return
        createDeal.mutate(
            {
                leadId: selectedLead.id,
                pipelineId,
                stageId,
                title: title.trim(),
                value: value ? Number(value.replace(',', '.')) : null,
                enterpriseId,
            },
            {
                onSuccess: () => { toast.success('Negócio criado!'); handleOpen(false) },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleSubmitNewLead() {
        if (!newName.trim() || !title.trim()) return
        createLead.mutate(
            { enterpriseId, payload: { name: newName.trim(), phone: newPhone.trim() || null, email: newEmail.trim() || null } },
            {
                onSuccess: (lead) => {
                    createDeal.mutate(
                        {
                            leadId: lead.id,
                            pipelineId,
                            stageId,
                            title: title.trim(),
                            value: value ? Number(value.replace(',', '.')) : null,
                            enterpriseId,
                        },
                        {
                            onSuccess: () => { toast.success('Lead e negócio criados!'); handleOpen(false) },
                            onError: (e) => toast.error(e.message),
                        },
                    )
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    const isPending = createDeal.isPending || createLead.isPending

    return (
        <Popover open={open} onOpenChange={handleOpen}>
            <PopoverTrigger asChild>
                <button className="w-full flex items-center gap-1.5 px-2 py-1.5 rounded-md text-xs text-muted-foreground hover:text-foreground hover:bg-muted transition-colors">
                    <Plus className="size-3.5" />
                    Novo negócio
                </button>
            </PopoverTrigger>

            <PopoverContent className="w-72 p-0 gap-0" align="start" side="top" sideOffset={4}>

                {/* ── Step: pesquisar lead ─────────────────────────────────── */}
                {step === 'search' && (
                    <div className="flex flex-col">
                        <div className="px-3 pt-3 pb-2 border-b">
                            <p className="text-[11px] font-semibold text-muted-foreground uppercase tracking-wide mb-2">
                                Selecionar lead
                            </p>
                            <div className="relative">
                                <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                                <input
                                    autoFocus
                                    className="w-full pl-8 pr-3 py-1.5 text-xs border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Pesquisar lead..."
                                    value={search}
                                    onChange={(e) => setSearch(e.target.value)}
                                />
                            </div>
                        </div>

                        <div className="max-h-52 overflow-y-auto py-1">
                            {leadsLoading ? (
                                <div className="flex justify-center py-5">
                                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                </div>
                            ) : leads.length === 0 ? (
                                <p className="text-xs text-muted-foreground text-center py-5">
                                    {search ? 'Nenhum lead encontrado' : 'Nenhum lead cadastrado'}
                                </p>
                            ) : (
                                leads.map((lead) => (
                                    <button
                                        key={lead.id}
                                        type="button"
                                        onClick={() => handleSelectLead(lead)}
                                        className="w-full text-left px-3 py-2 hover:bg-muted transition-colors flex items-center gap-2.5"
                                    >
                                        {lead.image ? (
                                            <img src={lead.image} alt={lead.name} className="size-6 rounded-full flex-shrink-0 object-cover" />
                                        ) : (
                                            <div
                                                className="size-6 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[9px] font-bold"
                                                style={{ backgroundColor: avatarColor(lead.name) }}
                                            >
                                                {initials(lead.name)}
                                            </div>
                                        )}
                                        <div className="flex flex-col min-w-0">
                                            <span className="text-xs font-medium truncate">{lead.name}</span>
                                            {lead.email && (
                                                <span className="text-[11px] text-muted-foreground truncate">{lead.email}</span>
                                            )}
                                        </div>
                                    </button>
                                ))
                            )}
                        </div>

                        <div className="border-t p-2">
                            <button
                                type="button"
                                onClick={() => setStep('new-lead')}
                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-950/30 rounded-md transition-colors font-medium"
                            >
                                <UserPlus className="size-3.5" />
                                Criar novo lead
                            </button>
                        </div>
                    </div>
                )}

                {/* ── Step: formulário do negócio ──────────────────────────── */}
                {step === 'deal-form' && (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b">
                            <button
                                onClick={() => setStep('search')}
                                className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                            </button>
                            {selectedLead?.image ? (
                                <img src={selectedLead.image} alt={selectedLead.name} className="size-6 rounded-full flex-shrink-0 object-cover" />
                            ) : (
                                <div
                                    className="size-6 rounded-full flex items-center justify-center text-white text-[9px] font-bold flex-shrink-0"
                                    style={{ backgroundColor: avatarColor(selectedLead?.name ?? '') }}
                                >
                                    {initials(selectedLead?.name ?? '?')}
                                </div>
                            )}
                            <span className="text-xs font-semibold truncate">{selectedLead?.name}</span>
                        </div>

                        <div className="flex flex-col gap-3 p-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Título *</label>
                                <input
                                    autoFocus
                                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Ex: Proposta comercial"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                    onKeyDown={(e) => e.key === 'Enter' && handleSubmitDeal()}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Valor (opcional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                                    <input
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                        placeholder="0,00"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value.replace(/[^0-9,]/g, ''))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-3 pb-3">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={handleSubmitDeal}
                                disabled={!title.trim() || isPending}
                            >
                                {isPending && <Loader2 className="size-3 animate-spin mr-1.5" />}
                                Criar negócio
                            </Button>
                        </div>
                    </div>
                )}

                {/* ── Step: criar novo lead ────────────────────────────────── */}
                {step === 'new-lead' && (
                    <div className="flex flex-col">
                        <div className="flex items-center gap-2 px-3 pt-3 pb-2 border-b">
                            <button
                                onClick={() => setStep('search')}
                                className="p-0.5 rounded hover:bg-muted transition-colors text-muted-foreground"
                            >
                                <ArrowLeft className="size-3.5" />
                            </button>
                            <span className="text-xs font-semibold">Novo lead</span>
                        </div>

                        <div className="flex flex-col gap-2.5 p-3">
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Nome *</label>
                                <input
                                    autoFocus
                                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Nome completo"
                                    value={newName}
                                    onChange={(e) => setNewName(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Telefone</label>
                                <input
                                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="+55 11 99999-9999"
                                    value={newPhone}
                                    onChange={(e) => setNewPhone(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">E-mail</label>
                                <input
                                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="email@exemplo.com"
                                    value={newEmail}
                                    onChange={(e) => setNewEmail(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Título do negócio *</label>
                                <input
                                    className="w-full px-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                    placeholder="Ex: Proposta comercial"
                                    value={title}
                                    onChange={(e) => setTitle(e.target.value)}
                                />
                            </div>
                            <div className="flex flex-col gap-1">
                                <label className="text-[11px] font-medium text-muted-foreground">Valor (opcional)</label>
                                <div className="relative">
                                    <span className="absolute left-3 top-2 text-xs text-muted-foreground">R$</span>
                                    <input
                                        className="w-full pl-8 pr-3 py-1.5 text-sm border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                        placeholder="0,00"
                                        value={value}
                                        onChange={(e) => setValue(e.target.value.replace(/[^0-9,]/g, ''))}
                                    />
                                </div>
                            </div>
                        </div>

                        <div className="px-3 pb-3">
                            <Button
                                size="sm"
                                className="w-full"
                                onClick={handleSubmitNewLead}
                                disabled={!newName.trim() || !title.trim() || isPending}
                            >
                                {isPending && <Loader2 className="size-3 animate-spin mr-1.5" />}
                                Criar lead e negócio
                            </Button>
                        </div>
                    </div>
                )}
            </PopoverContent>
        </Popover>
    )
}

// ─── Barra de ação durante o drag ────────────────────────────────────────────

function DragActionBar({ visible, stages }: { visible: boolean; stages: PipelineStage[] }) {
    const { setNodeRef: ganhoRef, isOver: isOverGanho } = useDroppable({ id: '__ganho__' })
    const { setNodeRef: perdidoRef, isOver: isOverPerdido } = useDroppable({ id: '__perdido__' })
    const { setNodeRef: excluirRef, isOver: isOverExcluir } = useDroppable({ id: '__excluir__' })

    const hasGanho = stages.some(s => s.name.toLowerCase().includes('ganho'))
    const hasPerdido = stages.some(s => s.name.toLowerCase().includes('perdido'))

    if (!visible) return null

    return (
        <div className="flex gap-2 px-4 py-2 border-b bg-background/95 backdrop-blur-sm animate-in slide-in-from-top-2 duration-150 flex-shrink-0">
            {hasGanho && (
                <div
                    ref={ganhoRef}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-2.5 transition-all select-none',
                        isOverGanho
                            ? 'border-green-500 bg-green-100 dark:bg-green-950/40 scale-[1.02]'
                            : 'border-green-300/70 bg-green-50/60 dark:bg-green-950/10',
                    )}
                >
                    <Trophy className="size-4 text-green-600" />
                    <span className="text-sm font-semibold text-green-700 dark:text-green-400">Ganho</span>
                </div>
            )}
            {hasPerdido && (
                <div
                    ref={perdidoRef}
                    className={cn(
                        'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-2.5 transition-all select-none',
                        isOverPerdido
                            ? 'border-orange-500 bg-orange-100 dark:bg-orange-950/40 scale-[1.02]'
                            : 'border-orange-300/70 bg-orange-50/60 dark:bg-orange-950/10',
                    )}
                >
                    <XCircle className="size-4 text-orange-600" />
                    <span className="text-sm font-semibold text-orange-700 dark:text-orange-400">Perdido</span>
                </div>
            )}
            <div
                ref={excluirRef}
                className={cn(
                    'flex-1 flex items-center justify-center gap-2 rounded-lg border-2 border-dashed py-2.5 transition-all select-none',
                    isOverExcluir
                        ? 'border-red-500 bg-red-100 dark:bg-red-950/40 scale-[1.02]'
                        : 'border-red-300/70 bg-red-50/60 dark:bg-red-950/10',
                )}
            >
                <Trash2 className="size-4 text-red-600" />
                <span className="text-sm font-semibold text-red-700 dark:text-red-400">Excluir</span>
            </div>
        </div>
    )
}

// ─── Chat Widget ──────────────────────────────────────────────────────────────

function ChatWidget({
    lead,
    enterpriseId,
    onClose,
}: {
    lead: DealLead
    enterpriseId: string
    onClose: () => void
}) {
    const { data: connections = [] } = useConnections(enterpriseId)
    const whatsappConns = connections.filter(c => c.type === 'WHATSAPP' && c.status === 'CONNECTED')

    const [selectedConn, setSelectedConn] = useState('')
    const [message, setMessage] = useState('')
    const messagesEndRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        if (whatsappConns.length > 0 && !selectedConn) {
            setSelectedConn(whatsappConns[0].id)
        }
    }, [whatsappConns.length])

    const { data: messages = [], isLoading: messagesLoading } = useMessages(
        enterpriseId,
        selectedConn,
        lead.id,
    )
    const sendMsg = useSendMessage()
    useChatSocket(enterpriseId)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    function handleSend() {
        if (!message.trim() || !selectedConn) return
        sendMsg.mutate(
            { enterpriseId, connectionId: selectedConn, leadId: lead.id, content: message.trim() },
            {
                onSuccess: () => setMessage(''),
                onError: (e) => toast.error(e.message),
            },
        )
    }

    const color = avatarColor(lead.name)

    return (
        <div className="fixed bottom-6 right-6 z-50 w-80 flex flex-col rounded-xl border bg-background shadow-2xl overflow-hidden">
            {/* Header */}
            <div className="flex items-center gap-2 px-3 py-2.5 bg-green-600 text-white flex-shrink-0">
                {lead.image ? (
                    <img src={lead.image} alt={lead.name} className="size-7 rounded-full object-cover flex-shrink-0" />
                ) : (
                    <div
                        className="size-7 rounded-full flex-shrink-0 flex items-center justify-center text-white text-[10px] font-bold"
                        style={{ backgroundColor: color }}
                    >
                        {initials(lead.name)}
                    </div>
                )}
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold truncate leading-tight">{lead.name}</p>
                    {lead.phone && (
                        <p className="text-[10px] text-green-100 truncate">{lead.phone}</p>
                    )}
                </div>
                <button
                    onClick={onClose}
                    className="p-1 rounded hover:bg-green-500 transition-colors flex-shrink-0"
                >
                    <X className="size-4" />
                </button>
            </div>

            {whatsappConns.length === 0 ? (
                <div className="flex flex-col items-center justify-center gap-3 py-8 px-4 text-center">
                    <WifiOff className="size-8 text-muted-foreground" />
                    <div>
                        <p className="text-sm font-medium">Nenhuma conexão WhatsApp</p>
                        <p className="text-xs text-muted-foreground mt-1">
                            Crie uma conexão WhatsApp para enviar mensagens.
                        </p>
                    </div>
                    <a
                        href="/connections"
                        className="text-xs text-blue-600 hover:underline font-medium"
                    >
                        Criar conexão →
                    </a>
                </div>
            ) : (
                <>
                    {/* Seletor de conexão (só aparece se tiver mais de uma) */}
                    {whatsappConns.length > 1 && (
                        <div className="px-3 py-2 border-b flex-shrink-0">
                            <select
                                className="w-full text-xs border rounded-md px-2 py-1 bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                                value={selectedConn}
                                onChange={(e) => setSelectedConn(e.target.value)}
                            >
                                {whatsappConns.map(c => (
                                    <option key={c.id} value={c.id}>{c.name}</option>
                                ))}
                            </select>
                        </div>
                    )}

                    {/* Mensagens */}
                    <div className="flex-1 overflow-y-auto p-3 flex flex-col gap-1.5 max-h-64 min-h-28">
                        {messagesLoading ? (
                            <div className="flex justify-center py-6">
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        ) : messages.length === 0 ? (
                            <p className="text-xs text-muted-foreground text-center py-6">
                                Nenhuma mensagem ainda
                            </p>
                        ) : (
                            messages.map(msg => (
                                <div
                                    key={msg.id}
                                    className={cn(
                                        'max-w-[85%] px-2.5 py-1.5 rounded-lg text-xs',
                                        msg.direction === 'OUTBOUND'
                                            ? 'self-end bg-green-100 dark:bg-green-900/40 text-green-900 dark:text-green-100'
                                            : 'self-start bg-muted text-foreground',
                                    )}
                                >
                                    <p className="break-words">{msg.content}</p>
                                    <p className="text-[9px] text-muted-foreground mt-0.5 text-right">
                                        {format(new Date(msg.sentAt), 'HH:mm')}
                                    </p>
                                </div>
                            ))
                        )}
                        <div ref={messagesEndRef} />
                    </div>

                    {/* Input */}
                    <div className="flex items-center gap-1.5 px-2 py-2 border-t flex-shrink-0">
                        <input
                            className="flex-1 text-xs px-2.5 py-1.5 border rounded-md bg-background focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Digite uma mensagem..."
                            value={message}
                            onChange={(e) => setMessage(e.target.value)}
                            onKeyDown={(e) => {
                                if (e.key === 'Enter' && !e.shiftKey) {
                                    e.preventDefault()
                                    handleSend()
                                }
                            }}
                        />
                        <button
                            onClick={handleSend}
                            disabled={!message.trim() || sendMsg.isPending}
                            className="p-1.5 rounded-md bg-green-600 text-white hover:bg-green-700 disabled:opacity-50 transition-colors flex-shrink-0"
                        >
                            {sendMsg.isPending
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Send className="size-3.5" />
                            }
                        </button>
                    </div>
                </>
            )}
        </div>
    )
}

// ─── Coluna kanban ────────────────────────────────────────────────────────────

function KanbanColumn({
    stage,
    stages,
    pipelineId,
    enterpriseId,
    sort,
    onWhatsappClick,
}: {
    stage: PipelineStage
    stages: PipelineStage[]
    pipelineId: string
    enterpriseId: string
    sort: Sort
    onWhatsappClick?: (lead: DealLead) => void
}) {
    const scrollRef = useRef<HTMLDivElement>(null)
    const { setNodeRef: setDropRef, isOver } = useDroppable({ id: stage.id })

    const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading } =
        useStageDeals(stage.id, enterpriseId, sort)

    const allDeals = useMemo(
        () => data?.pages.flatMap((p: StageDealsPage) => p.deals) ?? [],
        [data],
    )
    const total = data?.pages[0]?.total ?? stage._count?.deals ?? 0
    const totalValue = data?.pages[0]?.totalValue ?? 0

    const virtualizer = useVirtualizer({
        count: allDeals.length + (hasNextPage ? 1 : 0),
        getScrollElement: () => scrollRef.current,
        estimateSize: () => 140,
        overscan: 4,
    })

    useEffect(() => {
        const items = virtualizer.getVirtualItems()
        if (!items.length) return
        const last = items[items.length - 1]
        if (last.index >= allDeals.length && hasNextPage && !isFetchingNextPage) {
            fetchNextPage()
        }
    }, [virtualizer.getVirtualItems(), hasNextPage, isFetchingNextPage, allDeals.length, fetchNextPage])

    return (
        <div className="w-72 flex-shrink-0 flex flex-col rounded-xl bg-muted/40 border border-border/60">
            {/* Header */}
            <div className="px-3 pt-3 pb-2">
                <div className="flex items-center gap-1.5">
                    <span className="size-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: stage.color }} />
                    <span className="text-sm font-semibold truncate">{stage.name}</span>
                    <span className="ml-auto text-xs text-muted-foreground font-mono">{total}</span>
                </div>
                <div className="text-xs font-medium text-blue-600 mt-0.5 pl-4">
                    {formatBRL(totalValue)}
                </div>
            </div>

            {/* Drop zone */}
            <div
                ref={setDropRef}
                className={cn(
                    'flex-1 min-h-0 mx-1 mb-1 rounded-lg transition-all',
                    isOver && 'bg-blue-50 dark:bg-blue-950/20 ring-2 ring-blue-400/40',
                )}
            >
                <div
                    ref={scrollRef}
                    className="overflow-y-auto h-full"
                    style={{ height: 'calc(100vh - 288px)' }}
                >
                    {isLoading ? (
                        <div className="flex justify-center py-10">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : allDeals.length === 0 ? (
                        <div className={cn(
                            'flex items-center justify-center h-20 text-xs text-muted-foreground rounded-lg transition-colors',
                            isOver && 'border-2 border-dashed border-blue-300 bg-blue-50/50 dark:bg-blue-950/20',
                        )}>
                            {isOver ? 'Soltar aqui' : 'Nenhum negócio'}
                        </div>
                    ) : (
                        <div style={{ height: virtualizer.getTotalSize(), width: '100%', position: 'relative' }}>
                            {virtualizer.getVirtualItems().map((vItem) => {
                                const isSentinel = vItem.index >= allDeals.length
                                return (
                                    <div
                                        key={vItem.key}
                                        data-index={vItem.index}
                                        ref={virtualizer.measureElement}
                                        style={{ position: 'absolute', top: vItem.start, left: 0, width: '100%' }}
                                    >
                                        {isSentinel ? (
                                            <div className="flex justify-center py-3">
                                                {isFetchingNextPage && (
                                                    <Loader2 className="size-4 animate-spin text-muted-foreground" />
                                                )}
                                            </div>
                                        ) : (
                                            <DealCard
                                                deal={allDeals[vItem.index]}
                                                index={vItem.index}
                                                stages={stages}
                                                enterpriseId={enterpriseId}
                                                onWhatsappClick={onWhatsappClick}
                                            />
                                        )}
                                    </div>
                                )
                            })}
                        </div>
                    )}
                </div>
            </div>

            {/* Footer */}
            <div className="px-2 py-2 border-t border-border/60">
                <NewDealPopover
                    stageId={stage.id}
                    pipelineId={pipelineId}
                    enterpriseId={enterpriseId}
                />
            </div>
        </div>
    )
}

// ─── Página principal ─────────────────────────────────────────────────────────

export default function PipelinePage() {
    const { id } = useParams<{ id: string }>()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const { data: pipeline, isLoading } = useGetPipeline(id, enterpriseId)
    const updateDeal = useUpdateDeal()
    const deleteDeal = useDeleteDeal()

    // Tempo real: recebe eventos de outros usuários na mesma pipeline
    usePipelineSocket(id, enterpriseId)

    const [sort, setSort] = useState<Sort>('recent')
    const [activeTab, setActiveTab] = useState<Tab>('recent')
    const [activeDeal, setActiveDeal] = useState<Deal | null>(null)
    const [chatLead, setChatLead] = useState<DealLead | null>(null)

    function handleWhatsappClick(lead: DealLead) {
        setChatLead(prev => prev?.id === lead.id ? null : lead)
    }

    const sensors = useSensors(
        useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    )

    function handleDragStart(event: DragStartEvent) {
        setActiveDeal((event.active.data.current?.deal as Deal) ?? null)
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        setActiveDeal(null)
        if (!over || !enterpriseId || !pipeline) return
        const deal = active.data.current?.deal as Deal
        if (!deal) return

        // Zona: Ganho
        if (over.id === '__ganho__') {
            const stage = pipeline.stages.find(s => s.name.toLowerCase().includes('ganho'))
            if (stage && deal.stageId !== stage.id) {
                updateDeal.mutate({ id: deal.id, enterpriseId, stageId: stage.id },
                    { onError: (e) => toast.error(e.message) })
            }
            return
        }

        // Zona: Perdido
        if (over.id === '__perdido__') {
            const stage = pipeline.stages.find(s => s.name.toLowerCase().includes('perdido'))
            if (stage && deal.stageId !== stage.id) {
                updateDeal.mutate({ id: deal.id, enterpriseId, stageId: stage.id },
                    { onError: (e) => toast.error(e.message) })
            }
            return
        }

        // Zona: Excluir
        if (over.id === '__excluir__') {
            deleteDeal.mutate(
                { id: deal.id, enterpriseId },
                {
                    onSuccess: () => toast.success('Negócio excluído.'),
                    onError: (e) => toast.error(e.message),
                },
            )
            return
        }

        // Mover entre etapas normais
        const targetStageId = over.id as string
        if (deal.stageId === targetStageId) return
        updateDeal.mutate(
            { id: deal.id, enterpriseId, stageId: targetStageId },
            { onError: (e) => toast.error(e.message) },
        )
    }

    if (isLoading) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!pipeline) {
        return (
            <div className="flex flex-1 items-center justify-center text-sm text-muted-foreground">
                Pipeline não encontrada.
            </div>
        )
    }

    const tabs: { id: Tab; label: string }[] = [
        { id: 'recent', label: 'Mais recentes' },
        { id: 'interval', label: 'Intervalo' },
        { id: 'lastyear', label: 'Último ano' },
    ]

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Header */}
            <div className="flex items-center justify-between gap-4 px-5 py-3 border-b flex-shrink-0">
                <div className="flex items-center gap-6">
                    <div>
                        <h1 className="text-base font-semibold leading-tight">{pipeline.name}</h1>
                        <p className="text-xs text-muted-foreground">Funil de vendas</p>
                    </div>
                    <div className="flex items-center gap-0.5 bg-muted/40 rounded-lg border p-0.5">
                        {tabs.map((tab) => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'px-3 py-1 rounded-md text-xs font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-background text-foreground shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>

                <div className="flex items-center gap-2">
                    <div className="relative">
                        <Search className="absolute left-2.5 top-2 size-3.5 text-muted-foreground" />
                        <input
                            className="pl-8 pr-3 py-1.5 text-xs border rounded-md bg-background w-36 focus:outline-none focus:ring-1 focus:ring-ring"
                            placeholder="Pesquisar..."
                        />
                    </div>
                    <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors">
                        <SlidersHorizontal className="size-3.5" />
                        Filtros
                    </button>
                    <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                            <button className="flex items-center gap-1.5 px-3 py-1.5 text-xs border rounded-md hover:bg-muted transition-colors">
                                <ArrowUpDown className="size-3.5" />
                                {SORT_LABELS[sort]}
                                <ChevronDown className="size-3" />
                            </button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end" className="w-40">
                            {(Object.keys(SORT_LABELS) as Sort[]).map((s) => (
                                <DropdownMenuItem
                                    key={s}
                                    onClick={() => setSort(s)}
                                    className={cn(sort === s && 'font-medium')}
                                >
                                    {SORT_LABELS[s]}
                                </DropdownMenuItem>
                            ))}
                        </DropdownMenuContent>
                    </DropdownMenu>
                    <button className="p-1.5 border rounded-md hover:bg-muted transition-colors">
                        <MoreHorizontal className="size-3.5 text-muted-foreground" />
                    </button>
                </div>
            </div>

            {/* Kanban Board */}
            <DndContext
                sensors={sensors}
                onDragStart={handleDragStart}
                onDragEnd={handleDragEnd}
                onDragCancel={() => setActiveDeal(null)}
            >
                <DragActionBar visible={!!activeDeal} stages={pipeline.stages} />
                <div className="flex-1 min-h-0 overflow-x-auto overflow-y-hidden">
                    <div className="flex gap-3 p-4 h-full">
                        {pipeline.stages.map((stage) => (
                            <KanbanColumn
                                key={stage.id}
                                stage={stage}
                                stages={pipeline.stages}
                                pipelineId={pipeline.id}
                                enterpriseId={enterpriseId}
                                sort={sort}
                                onWhatsappClick={handleWhatsappClick}
                            />
                        ))}
                    </div>
                </div>

                {/* Ghost card durante o drag */}
                <DragOverlay dropAnimation={null}>
                    {activeDeal && (
                        <div className="rotate-2 scale-105 opacity-90 pointer-events-none">
                            <DealCardBody
                                deal={activeDeal}
                                index={0}
                                stages={pipeline.stages}
                                enterpriseId={enterpriseId}
                            />
                        </div>
                    )}
                </DragOverlay>
            </DndContext>

            {/* Widget de chat WhatsApp */}
            {chatLead && (
                <ChatWidget
                    lead={chatLead}
                    enterpriseId={enterpriseId}
                    onClose={() => setChatLead(null)}
                />
            )}
        </div>
    )
}
