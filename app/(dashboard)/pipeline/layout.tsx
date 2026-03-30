'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Plus, Loader2, Trash2, MoreHorizontal, ChevronDown, ChevronRight,
    GripVertical, FolderPlus, X, Copy, Check, ArrowLeftRight, Pencil, Link2,
} from 'lucide-react'
import { toast } from 'sonner'
import {
    DndContext, closestCenter, PointerSensor, useSensor, useSensors,
    type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, useSortable, verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import { Switch } from '@/components/ui/switch'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useListGroups, useListPipelines,
    useCreateGroup, useDeleteGroup, useReorderGroups,
    useCreatePipeline, useUpdatePipeline, useDeletePipeline, useReorderPipelines,
    useCreateStage, useDeleteStage,
    useActivateBilateral, useGetBilateralConfig, useKommoPipelines,
    type PipelineGroup, type Pipeline, type PipelineStage,
} from '@/services/pipelines'
import { useCredentials } from '@/services/credentials'
import { api } from '@/lib/api'

// ─── Stage helpers ────────────────────────────────────────────────────────────

type StageItem = { tempId: string; name: string; color: string; kommoStatusId?: number }

const DEFAULT_PIPELINE_STAGES: StageItem[] = [
    { tempId: 'def-0', name: 'Prospecção', color: '#6b7280' },
    { tempId: 'def-1', name: 'Qualificação', color: '#3b82f6' },
    { tempId: 'def-2', name: 'Proposta', color: '#8b5cf6' },
    { tempId: 'def-3', name: 'Negociação', color: '#f59e0b' },
    { tempId: 'def-4', name: 'Ganho', color: '#10b981' },
    { tempId: 'def-5', name: 'Perdido', color: '#ef4444' },
]

// ─── Ícone funil ──────────────────────────────────────────────────────────────

function FunnelIcon({ color }: { color: string }) {
    return (
        <svg width="13" height="13" viewBox="0 0 14 14" fill="none">
            <path
                d="M1 2h12l-4.5 5.5V12L5.5 10.5V7.5L1 2z"
                fill={color} stroke={color} strokeWidth="0.5" strokeLinejoin="round"
            />
        </svg>
    )
}

// ─── Sortable Pipeline Item ────────────────────────────────────────────────────

function SortablePipelineItem({
    pipeline, groupId, selectedId, onDelete, onEdit, onWebhook,
}: {
    pipeline: Pipeline
    groupId: string | null
    selectedId?: string
    onDelete: (p: Pipeline) => void
    onEdit: (p: Pipeline) => void
    onWebhook: (p: Pipeline) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: pipeline.id,
        data: { type: 'pipeline', groupId },
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className={cn(
                'group flex items-center gap-1 px-1.5 py-1 rounded-md text-sm transition-colors',
                selectedId === pipeline.id
                    ? 'bg-muted text-foreground font-medium'
                    : 'text-muted-foreground hover:bg-muted/60 hover:text-foreground',
            )}
        >
            <button
                {...attributes} {...listeners}
                className="opacity-0 group-hover:opacity-100 cursor-grab shrink-0 p-0.5 rounded"
            >
                <GripVertical className="size-3" />
            </button>

            <Link href={`/pipeline/${pipeline.id}`} className="flex items-center gap-1.5 flex-1 min-w-0">
                <FunnelIcon color={pipeline.color} />
                <span className="truncate text-xs">{pipeline.name}</span>
            </Link>

            <DropdownMenu>
                <DropdownMenuTrigger asChild>
                    <button className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted">
                        <MoreHorizontal className="size-3.5" />
                    </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-40">
                    <DropdownMenuItem onClick={() => onEdit(pipeline)}>
                        <Pencil className="size-3.5 mr-2" />
                        Editar
                    </DropdownMenuItem>
                    {pipeline.isBilateral && (
                        <DropdownMenuItem onClick={() => onWebhook(pipeline)}>
                            <Link2 className="size-3.5 mr-2" />
                            Ver webhook
                        </DropdownMenuItem>
                    )}
                    <DropdownMenuItem
                        className="text-red-600 focus:text-red-600"
                        onClick={() => onDelete(pipeline)}
                    >
                        <Trash2 className="size-3.5 mr-2" />
                        Excluir
                    </DropdownMenuItem>
                </DropdownMenuContent>
            </DropdownMenu>
        </div>
    )
}

// ─── Sortable Group ────────────────────────────────────────────────────────────

function SortableGroup({
    group, isExpanded, onToggle, selectedId, onDeletePipeline, onDeleteGroup, onEditPipeline, onWebhookPipeline,
}: {
    group: PipelineGroup
    isExpanded: boolean
    onToggle: () => void
    selectedId?: string
    onDeletePipeline: (p: Pipeline) => void
    onDeleteGroup: (g: PipelineGroup) => void
    onEditPipeline: (p: Pipeline) => void
    onWebhookPipeline: (p: Pipeline) => void
}) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
        id: `group-${group.id}`,
        data: { type: 'group' },
    })

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            className="mb-0.5"
        >
            {/* Group header */}
            <div className="group flex items-center gap-1 px-1 py-0.5 rounded-md hover:bg-muted/40 transition-colors">
                <button
                    {...attributes} {...listeners}
                    className="opacity-0 group-hover:opacity-100 cursor-grab shrink-0 p-0.5 rounded"
                >
                    <GripVertical className="size-3" />
                </button>

                <button onClick={onToggle} className="flex items-center gap-1 flex-1 min-w-0 text-left py-0.5">
                    {isExpanded
                        ? <ChevronDown className="size-3 shrink-0 text-muted-foreground" />
                        : <ChevronRight className="size-3 shrink-0 text-muted-foreground" />
                    }
                    <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider truncate">
                        {group.name}
                    </span>
                    {group.pipelines.length > 0 && (
                        <span className="ml-1 text-[10px] text-muted-foreground/60">
                            {group.pipelines.length}
                        </span>
                    )}
                </button>

                <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                        <button className="opacity-0 group-hover:opacity-100 shrink-0 p-0.5 rounded hover:bg-muted">
                            <MoreHorizontal className="size-3.5" />
                        </button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end" className="w-36">
                        <DropdownMenuItem
                            className="text-red-600 focus:text-red-600"
                            onClick={() => onDeleteGroup(group)}
                        >
                            <Trash2 className="size-3.5 mr-2" />
                            Excluir grupo
                        </DropdownMenuItem>
                    </DropdownMenuContent>
                </DropdownMenu>
            </div>

            {/* Pipelines dentro do grupo */}
            {isExpanded && (
                <div className="ml-3 mt-0.5">
                    <SortableContext
                        items={group.pipelines.map(p => p.id)}
                        strategy={verticalListSortingStrategy}
                    >
                        {group.pipelines.length === 0 ? (
                            <p className="text-[10px] text-muted-foreground/50 px-2 py-1 italic">Vazio</p>
                        ) : (
                            group.pipelines.map(p => (
                                <SortablePipelineItem
                                    key={p.id}
                                    pipeline={p}
                                    groupId={group.id}
                                    selectedId={selectedId}
                                    onDelete={onDeletePipeline}
                                    onEdit={onEditPipeline}
                                    onWebhook={onWebhookPipeline}
                                />
                            ))
                        )}
                    </SortableContext>
                </div>
            )}
        </div>
    )
}

// ─── Layout principal ─────────────────────────────────────────────────────────

export default function PipelineLayout({ children }: { children: React.ReactNode }) {
    const { enterprise, isLoading: entLoading } = useEnterprise()
    const params = useParams()
    const router = useRouter()
    const selectedId = params?.id as string | undefined

    const { data: groups = [], isLoading: groupsLoading } = useListGroups(enterprise?.id ?? '')
    const { data: allPipelines = [], isLoading: pipesLoading } = useListPipelines(enterprise?.id ?? '')
    const isLoading = entLoading || groupsLoading || pipesLoading

    const ungrouped = allPipelines.filter(p => !p.groupId)

    // Grupos colapsados (por padrão todos abertos)
    const [collapsed, setCollapsed] = useState<Set<string>>(new Set())

    // Auto-expand novos grupos quando carregados pela primeira vez
    const [initialized, setInitialized] = useState(false)
    useEffect(() => {
        if (!initialized && groups.length > 0) setInitialized(true)
    }, [groups, initialized])

    // Dialogs
    const [createPipelineOpen, setCreatePipelineOpen] = useState(false)
    const [pName, setPName] = useState('')
    const [pColor, setPColor] = useState('#6366f1')
    const [pDesc, setPDesc] = useState('')
    const [pGroupId, setPGroupId] = useState<string>('none')
    const [pStages, setPStages] = useState<StageItem[]>([...DEFAULT_PIPELINE_STAGES])
    const [pBilateral, setPBilateral] = useState(false)
    const [pKommoCredId, setPKommoCredId] = useState<string>('none')
    const [pKommoPipelineId, setPKommoPipelineId] = useState<number | null>(null)
    const [createStep, setCreateStep] = useState(1)
    const [webhookUrl, setWebhookUrl] = useState<string | null>(null)
    const [createdPipelineId, setCreatedPipelineId] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const [createGroupOpen, setCreateGroupOpen] = useState(false)
    const [gName, setGName] = useState('')

    // Edit pipeline
    const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null)
    const [editName, setEditName] = useState('')
    const [editColor, setEditColor] = useState('#6366f1')
    const [editDesc, setEditDesc] = useState('')

    // Webhook dialog
    const [webhookPipeline, setWebhookPipeline] = useState<Pipeline | null>(null)
    const [webhookCopied, setWebhookCopied] = useState(false)

    const createPipeline = useCreatePipeline()
    const deletePipeline = useDeletePipeline()
    const createStage = useCreateStage()
    const deleteStage = useDeleteStage()
    const createGroup = useCreateGroup()
    const deleteGroup = useDeleteGroup()
    const reorderGroups = useReorderGroups()
    const reorderPipelines = useReorderPipelines()
    const activateBilateral = useActivateBilateral()
    const updatePipeline = useUpdatePipeline()

    const { data: bilateralConfig, isLoading: bilateralLoading } = useGetBilateralConfig(
        webhookPipeline?.id ?? '',
        enterprise?.id ?? '',
    )

    const { data: allCredentials = [] } = useCredentials(enterprise?.id ?? '')
    const kommoCredentials = allCredentials.filter(c => c.type === 'KOMMO' && c.isActive)

    const { data: kommoPipelines = [], isLoading: kommoPipelinesLoading } = useKommoPipelines(
        pBilateral && pKommoCredId !== 'none' ? pKommoCredId : null,
        enterprise?.id ?? '',
    )
    const selectedKommoPipeline = kommoPipelines.find(p => p.id === pKommoPipelineId) ?? null

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    // Auto-popular stages ao selecionar pipeline Kommo
    useEffect(() => {
        if (selectedKommoPipeline?.statuses?.length) {
            setPStages(selectedKommoPipeline.statuses.map((s) => ({
                tempId: `kommo-${s.id}`,
                name: s.name,
                color: s.color || '#6366f1',
                kommoStatusId: s.id,
            })))
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [pKommoPipelineId])

    function toggle(groupId: string) {
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    function addPStage() {
        setPStages(prev => [...prev, { tempId: `new-${Date.now()}`, name: '', color: '#6366f1' }])
    }
    function removePStage(i: number) {
        setPStages(prev => prev.filter((_, idx) => idx !== i))
    }
    function updatePStage(i: number, field: 'name' | 'color', value: string) {
        setPStages(prev => prev.map((s, idx) => idx === i ? { ...s, [field]: value } : s))
    }

    async function handleCreatePipeline() {
        if (!enterprise?.id || !pName.trim()) return
        try {
            const p = await createPipeline.mutateAsync({
                enterpriseId: enterprise.id,
                name: pName.trim(),
                color: pColor,
                description: pDesc.trim() || undefined,
                groupId: pGroupId === 'none' ? null : pGroupId,
            })

            // Busca pipeline completo para ter os estágios criados automaticamente
            const { data: fresh } = await api.get<Pipeline>(
                `/pipelines/detail/${p.id}`,
                { headers: { 'X-Enterprise-Id': enterprise.id } },
            )
            const autoCreated: PipelineStage[] = fresh.stages ?? []
            const validUserStages = pStages.filter(s => s.name.trim())
            const userNames = new Set(validUserStages.map(s => s.name.trim().toLowerCase()))
            const autoNames = new Set(autoCreated.map(s => s.name.toLowerCase()))

            const toDelete = autoCreated.filter(s => !userNames.has(s.name.toLowerCase()))
            const toCreate = validUserStages.filter(s => !autoNames.has(s.name.trim().toLowerCase()))

            // Deletar stages desnecessários em paralelo
            await Promise.allSettled(
                toDelete.map(s => deleteStage.mutateAsync({ stageId: s.id, enterpriseId: enterprise.id }))
            )
            // Criar stages SEQUENCIALMENTE para garantir a ordem correta
            for (const s of toCreate) {
                await createStage.mutateAsync({
                    pipelineId: p.id,
                    enterpriseId: enterprise.id,
                    name: s.name.trim(),
                    color: s.color,
                    ...(s.kommoStatusId !== undefined && { kommoStatusId: s.kommoStatusId }),
                })
            }

            // Ativar bilateral: ir para passo 3 com URL do webhook
            if (pBilateral && pKommoCredId && pKommoCredId !== 'none') {
                try {
                    const config = await activateBilateral.mutateAsync({
                        pipelineId: p.id,
                        enterpriseId: enterprise.id,
                        kommoCredentialId: pKommoCredId,
                        kommoPipelineId: pKommoPipelineId ?? undefined,
                    })
                    setCreatedPipelineId(p.id)
                    setWebhookUrl(config.webhookUrl)
                    setCreateStep(3)
                    toast.success('Pipeline criada!')
                } catch {
                    toast.error('Pipeline criada, mas falha ao ativar bilateral com Kommo.')
                    setCreatePipelineOpen(false)
                    setPName(''); setPDesc(''); setPGroupId('none')
                    setPStages([...DEFAULT_PIPELINE_STAGES])
                    setPBilateral(false); setPKommoCredId('none'); setPKommoPipelineId(null); setCreateStep(1)
                    router.push(`/pipeline/${p.id}`)
                }
            } else {
                setCreatePipelineOpen(false)
                setPName(''); setPDesc(''); setPGroupId('none')
                setPStages([...DEFAULT_PIPELINE_STAGES])
                setPBilateral(false); setPKommoCredId('none'); setPKommoPipelineId(null); setCreateStep(1)
                router.push(`/pipeline/${p.id}`)
                toast.success('Pipeline criada!')
            }
        } catch {
            toast.error('Erro ao criar pipeline.')
        }
    }

    function handleFinishCreate() {
        const id = createdPipelineId
        setCreatePipelineOpen(false)
        setPName(''); setPDesc(''); setPGroupId('none')
        setPStages([...DEFAULT_PIPELINE_STAGES])
        setPBilateral(false); setPKommoCredId('none'); setPKommoPipelineId(null); setCreateStep(1)
        setWebhookUrl(null); setCreatedPipelineId(null)
        if (id) router.push(`/pipeline/${id}`)
    }

    function copyWebhook(url: string) {
        navigator.clipboard.writeText(url).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }

    function handleCreateGroup() {
        if (!enterprise?.id || !gName.trim()) return
        createGroup.mutate(
            { enterpriseId: enterprise.id, name: gName.trim() },
            {
                onSuccess: () => {
                    setCreateGroupOpen(false)
                    setGName('')
                    toast.success('Grupo criado!')
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleOpenEdit(p: Pipeline) {
        setEditPipeline(p)
        setEditName(p.name)
        setEditColor(p.color)
        setEditDesc(p.description ?? '')
    }

    function handleSaveEdit() {
        if (!enterprise?.id || !editPipeline || !editName.trim()) return
        updatePipeline.mutate(
            { id: editPipeline.id, enterpriseId: enterprise.id, name: editName.trim(), color: editColor, description: editDesc.trim() || undefined },
            {
                onSuccess: () => {
                    setEditPipeline(null)
                    toast.success('Pipeline atualizada.')
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleDeletePipeline(p: Pipeline) {
        if (!enterprise?.id) return
        deletePipeline.mutate(
            { id: p.id, enterpriseId: enterprise.id },
            {
                onSuccess: () => {
                    toast.success('Pipeline excluída.')
                    if (selectedId === p.id) router.push('/pipeline')
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleDeleteGroup(g: PipelineGroup) {
        if (!enterprise?.id) return
        deleteGroup.mutate(
            { id: g.id, enterpriseId: enterprise.id },
            {
                onSuccess: () => toast.success('Grupo excluído.'),
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleDragEnd(event: DragEndEvent) {
        const { active, over } = event
        if (!over || active.id === over.id || !enterprise?.id) return

        const activeType = (active.data.current as { type: string } | undefined)?.type
        const overType = (over.data.current as { type: string } | undefined)?.type

        // Reordenar grupos
        if (activeType === 'group' && overType === 'group') {
            const oldIdx = groups.findIndex(g => `group-${g.id}` === active.id)
            const newIdx = groups.findIndex(g => `group-${g.id}` === over.id)
            if (oldIdx === -1 || newIdx === -1) return
            const reordered = arrayMove(groups, oldIdx, newIdx)
            reorderGroups.mutate({
                enterpriseId: enterprise.id,
                items: reordered.map((g, i) => ({ id: g.id, order: i })),
            })
            return
        }

        // Reordenar pipelines dentro de um grupo
        if (activeType === 'pipeline' && overType === 'pipeline') {
            const activeGroupId = (active.data.current as { groupId: string | null } | undefined)?.groupId ?? null
            const source = activeGroupId
                ? groups.find(g => g.id === activeGroupId)?.pipelines ?? []
                : ungrouped
            const oldIdx = source.findIndex(p => p.id === active.id)
            const newIdx = source.findIndex(p => p.id === over.id)
            if (oldIdx === -1 || newIdx === -1) return
            const reordered = arrayMove(source, oldIdx, newIdx)
            reorderPipelines.mutate({
                enterpriseId: enterprise.id,
                items: reordered.map((p, i) => ({ id: p.id, order: i })),
            })
        }
    }

    return (
        <div className="flex flex-1 min-h-0 overflow-hidden">
            {/* ── Sidebar ──────────────────────────────────────────────────────── */}
            <aside className="w-56 flex-shrink-0 border-r flex flex-col bg-background">
                {/* Botões do topo */}
                <div className="p-2.5 border-b flex gap-1.5">
                    <button
                        onClick={() => setCreatePipelineOpen(true)}
                        className="flex-1 flex items-center justify-center gap-1.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-xs font-medium py-1.5 transition-colors"
                    >
                        <Plus className="size-3.5" />
                        Nova pipeline
                    </button>
                    <button
                        onClick={() => setCreateGroupOpen(true)}
                        title="Novo grupo"
                        className="p-1.5 rounded-md border hover:bg-muted transition-colors shrink-0"
                    >
                        <FolderPlus className="size-4 text-muted-foreground" />
                    </button>
                </div>

                {/* Nav */}
                <nav className="flex-1 overflow-y-auto p-2">
                    {isLoading ? (
                        <div className="flex justify-center py-8">
                            <Loader2 className="size-4 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
                            {/* Grupos */}
                            <SortableContext
                                items={groups.map(g => `group-${g.id}`)}
                                strategy={verticalListSortingStrategy}
                            >
                                {groups.map(g => (
                                    <SortableGroup
                                        key={g.id}
                                        group={g}
                                        isExpanded={!collapsed.has(g.id)}
                                        onToggle={() => toggle(g.id)}
                                        selectedId={selectedId}
                                        onDeletePipeline={handleDeletePipeline}
                                        onDeleteGroup={handleDeleteGroup}
                                        onEditPipeline={handleOpenEdit}
                                        onWebhookPipeline={setWebhookPipeline}
                                    />
                                ))}
                            </SortableContext>

                            {/* Pipelines sem grupo */}
                            {ungrouped.length > 0 && (
                                <div className={cn(groups.length > 0 && 'mt-2 pt-2 border-t')}>
                                    {groups.length > 0 && (
                                        <p className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-0.5">
                                            Sem grupo
                                        </p>
                                    )}
                                    <SortableContext
                                        items={ungrouped.map(p => p.id)}
                                        strategy={verticalListSortingStrategy}
                                    >
                                        {ungrouped.map(p => (
                                            <SortablePipelineItem
                                                key={p.id}
                                                pipeline={p}
                                                groupId={null}
                                                selectedId={selectedId}
                                                onDelete={handleDeletePipeline}
                                                onEdit={handleOpenEdit}
                                                onWebhook={setWebhookPipeline}
                                            />
                                        ))}
                                    </SortableContext>
                                </div>
                            )}

                            {/* Estado vazio */}
                            {groups.length === 0 && ungrouped.length === 0 && (
                                <p className="text-xs text-muted-foreground text-center py-8 px-2">
                                    Nenhuma pipeline criada
                                </p>
                            )}
                        </DndContext>
                    )}
                </nav>
            </aside>

            {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0 flex flex-col">{children}</div>

            {/* ── Dialog: criar pipeline ───────────────────────────────────────── */}
            <Dialog open={createPipelineOpen} onOpenChange={(v) => { if (!v) { const id = createdPipelineId; setCreatePipelineOpen(false); setPName(''); setPDesc(''); setPGroupId('none'); setPStages([...DEFAULT_PIPELINE_STAGES]); setPBilateral(false); setPKommoCredId('none'); setPKommoPipelineId(null); setCreateStep(1); setWebhookUrl(null); setCreatedPipelineId(null); if (id) router.push(`/pipeline/${id}`) } else { setCreatePipelineOpen(true) } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center justify-between">
                            Nova pipeline
                            <span className="text-xs font-normal text-muted-foreground">
                                Passo {createStep} de {pBilateral || createStep === 3 ? 3 : 2}
                            </span>
                        </DialogTitle>
                    </DialogHeader>

                    {/* ── Passo 1: Informações básicas ── */}
                    {createStep === 1 && (
                        <div className="flex flex-col gap-3 py-2">
                            <div className="flex flex-col gap-1.5">
                                <Label>Nome</Label>
                                <Input
                                    value={pName}
                                    onChange={(e) => setPName(e.target.value)}
                                    placeholder="Ex: Vendas B2B"
                                    autoFocus
                                />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label>
                                    Descrição{' '}
                                    <span className="text-muted-foreground font-normal">(opcional)</span>
                                </Label>
                                <Input
                                    value={pDesc}
                                    onChange={(e) => setPDesc(e.target.value)}
                                    placeholder="Breve descrição..."
                                />
                            </div>
                            {groups.length > 0 && (
                                <div className="flex flex-col gap-1.5">
                                    <Label>Grupo</Label>
                                    <Select value={pGroupId} onValueChange={setPGroupId}>
                                        <SelectTrigger>
                                            <SelectValue placeholder="Sem grupo" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="none">Sem grupo</SelectItem>
                                            {groups.map(g => (
                                                <SelectItem key={g.id} value={g.id}>{g.name}</SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            )}
                            <div className="flex flex-col gap-1.5">
                                <Label>Cor</Label>
                                <div className="flex items-center gap-2">
                                    <input
                                        type="color"
                                        value={pColor}
                                        onChange={(e) => setPColor(e.target.value)}
                                        className="size-8 rounded cursor-pointer border"
                                    />
                                    <span className="text-sm text-muted-foreground">{pColor}</span>
                                </div>
                            </div>

                            {/* Sincronização bilateral com Kommo */}
                            {kommoCredentials.length > 0 && (
                                <div className="flex flex-col gap-2 rounded-lg border p-3">
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <ArrowLeftRight className="size-4 text-muted-foreground" />
                                            <div>
                                                <p className="text-sm font-medium">Sincronizar com Kommo</p>
                                                <p className="text-xs text-muted-foreground">Deals espelhados bidirecionalmente</p>
                                            </div>
                                        </div>
                                        <Switch checked={pBilateral} onCheckedChange={(v) => { setPBilateral(v); if (!v) { setPKommoCredId('none'); setPKommoPipelineId(null) } }} />
                                    </div>
                                    {pBilateral && (
                                        <Select value={pKommoCredId} onValueChange={(v) => { setPKommoCredId(v); setPKommoPipelineId(null) }}>
                                            <SelectTrigger className="h-8 text-xs">
                                                <SelectValue placeholder="Selecione a conta Kommo" />
                                            </SelectTrigger>
                                            <SelectContent>
                                                <SelectItem value="none">Selecione uma conta</SelectItem>
                                                {kommoCredentials.map(c => (
                                                    <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
                                                ))}
                                            </SelectContent>
                                        </Select>
                                    )}
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Passo 2: Estágios ── */}
                    {createStep === 2 && (
                        <div className="flex flex-col gap-3 py-2">
                            {pBilateral ? (
                                <>
                                    {/* Seletor de pipeline Kommo */}
                                    <div className="flex flex-col gap-1.5">
                                        <Label>Pipeline do Kommo</Label>
                                        <p className="text-xs text-muted-foreground -mt-1">
                                            Selecione o pipeline do Kommo para sincronizar. Os estágios serão importados automaticamente.
                                        </p>
                                        {kommoPipelinesLoading ? (
                                            <div className="flex items-center gap-2 text-xs text-muted-foreground py-2">
                                                <Loader2 className="size-3.5 animate-spin" />
                                                Carregando pipelines do Kommo...
                                            </div>
                                        ) : kommoPipelines.length === 0 ? (
                                            <p className="text-xs text-muted-foreground py-2">Nenhum pipeline encontrado na conta Kommo.</p>
                                        ) : (
                                            <Select
                                                value={pKommoPipelineId?.toString() ?? 'none'}
                                                onValueChange={(v) => setPKommoPipelineId(v === 'none' ? null : Number(v))}
                                            >
                                                <SelectTrigger>
                                                    <SelectValue placeholder="Selecione um pipeline" />
                                                </SelectTrigger>
                                                <SelectContent>
                                                    <SelectItem value="none">Selecione um pipeline</SelectItem>
                                                    {kommoPipelines.map(p => (
                                                        <SelectItem key={p.id} value={p.id.toString()}>{p.name}</SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        )}
                                    </div>

                                    {/* Preview dos estágios importados */}
                                    {selectedKommoPipeline && (
                                        <div className="flex flex-col gap-1.5">
                                            <Label className="text-xs text-muted-foreground">
                                                Estágios importados ({pStages.length})
                                            </Label>
                                            <div className="flex flex-col gap-1 max-h-44 overflow-y-auto pr-1 rounded-md border p-2">
                                                {pStages.map((s) => (
                                                    <div key={s.tempId} className="flex items-center gap-2 py-0.5">
                                                        <span
                                                            className="size-2.5 rounded-full shrink-0"
                                                            style={{ backgroundColor: s.color }}
                                                        />
                                                        <span className="text-xs">{s.name}</span>
                                                    </div>
                                                ))}
                                            </div>
                                        </div>
                                    )}
                                </>
                            ) : (
                                /* Editor manual de estágios (sem bilateral) */
                                <div className="flex flex-col gap-1.5">
                                    <div className="flex items-center justify-between">
                                        <Label>Estágios</Label>
                                        <button
                                            type="button"
                                            onClick={addPStage}
                                            className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-700 transition-colors"
                                        >
                                            <Plus className="size-3" />
                                            Adicionar
                                        </button>
                                    </div>
                                    <div className="flex flex-col gap-1 max-h-52 overflow-y-auto pr-1">
                                        {pStages.map((s, i) => (
                                            <div key={s.tempId} className="flex items-center gap-2">
                                                <input
                                                    type="color"
                                                    value={s.color}
                                                    onChange={(e) => updatePStage(i, 'color', e.target.value)}
                                                    className="size-6 rounded cursor-pointer border flex-shrink-0"
                                                    title="Cor do estágio"
                                                />
                                                <Input
                                                    value={s.name}
                                                    onChange={(e) => updatePStage(i, 'name', e.target.value)}
                                                    className="h-7 text-xs flex-1"
                                                    placeholder="Nome do estágio"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => removePStage(i)}
                                                    className="p-0.5 text-muted-foreground hover:text-destructive transition-colors flex-shrink-0"
                                                >
                                                    <X className="size-3.5" />
                                                </button>
                                            </div>
                                        ))}
                                        {pStages.length === 0 && (
                                            <p className="text-xs text-muted-foreground text-center py-2">
                                                Nenhum estágio. Adicione pelo menos um.
                                            </p>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {/* ── Passo 3: URL do webhook (bilateral) ── */}
                    {createStep === 3 && (
                        <div className="flex flex-col gap-3 py-2">
                            <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
                                <ArrowLeftRight className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                                <div>
                                    <p className="text-sm font-medium text-green-800 dark:text-green-300">Sincronização bilateral ativada!</p>
                                    <p className="text-xs text-green-700 dark:text-green-400">Configure o webhook no Kommo para receber eventos.</p>
                                </div>
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <Label className="text-xs">URL do Webhook</Label>
                                <p className="text-xs text-muted-foreground -mt-0.5">
                                    Acesse o Kommo em{' '}
                                    <strong>Configurações → Webhooks → Adicionar URL</strong>{' '}
                                    e cole esta URL:
                                </p>
                                <div className="flex items-center gap-2 mt-1">
                                    <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                                        {webhookUrl}
                                    </code>
                                    <Button
                                        size="icon"
                                        variant="outline"
                                        className="shrink-0"
                                        onClick={() => webhookUrl && copyWebhook(webhookUrl)}
                                    >
                                        {copied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                    </Button>
                                </div>
                            </div>
                        </div>
                    )}

                    <DialogFooter>
                        {createStep === 1 && (
                            <>
                                <Button variant="outline" onClick={() => setCreatePipelineOpen(false)}>
                                    Cancelar
                                </Button>
                                <Button
                                    onClick={() => setCreateStep(2)}
                                    disabled={
                                        !pName.trim() ||
                                        (pBilateral && (pKommoCredId === 'none' || !pKommoCredId))
                                    }
                                >
                                    Próximo
                                </Button>
                            </>
                        )}
                        {createStep === 2 && (
                            <>
                                <Button variant="outline" onClick={() => setCreateStep(1)}>
                                    Voltar
                                </Button>
                                <Button
                                    onClick={handleCreatePipeline}
                                    disabled={
                                        createPipeline.isPending || createStage.isPending || deleteStage.isPending || activateBilateral.isPending ||
                                        (pBilateral && !pKommoPipelineId)
                                    }
                                >
                                    {(createPipeline.isPending || createStage.isPending || deleteStage.isPending || activateBilateral.isPending) && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                                    Criar pipeline
                                </Button>
                            </>
                        )}
                        {createStep === 3 && (
                            <Button onClick={handleFinishCreate}>
                                Concluir e abrir pipeline
                            </Button>
                        )}
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: editar pipeline ──────────────────────────────────────── */}
            <Dialog open={!!editPipeline} onOpenChange={(v) => { if (!v) setEditPipeline(null) }}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Editar pipeline</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nome</Label>
                            <Input
                                value={editName}
                                onChange={(e) => setEditName(e.target.value)}
                                placeholder="Nome da pipeline"
                                autoFocus
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Descrição <span className="text-muted-foreground font-normal">(opcional)</span></Label>
                            <Input
                                value={editDesc}
                                onChange={(e) => setEditDesc(e.target.value)}
                                placeholder="Breve descrição..."
                            />
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Cor</Label>
                            <div className="flex items-center gap-2">
                                <input
                                    type="color"
                                    value={editColor}
                                    onChange={(e) => setEditColor(e.target.value)}
                                    className="size-8 rounded cursor-pointer border"
                                />
                                <span className="text-sm text-muted-foreground">{editColor}</span>
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setEditPipeline(null)}>Cancelar</Button>
                        <Button onClick={handleSaveEdit} disabled={!editName.trim() || updatePipeline.isPending}>
                            {updatePipeline.isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                            Salvar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: webhook URL ───────────────────────────────────────────── */}
            <Dialog open={!!webhookPipeline} onOpenChange={(v) => { if (!v) { setWebhookPipeline(null); setWebhookCopied(false) } }}>
                <DialogContent className="max-w-md">
                    <DialogHeader>
                        <DialogTitle className="flex items-center gap-2">
                            <Link2 className="size-4" />
                            Webhook Kommo — {webhookPipeline?.name}
                        </DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                        {bilateralLoading ? (
                            <div className="flex items-center gap-2 text-sm text-muted-foreground py-4 justify-center">
                                <Loader2 className="size-4 animate-spin" />
                                Carregando...
                            </div>
                        ) : bilateralConfig?.webhookUrl ? (
                            <>
                                <div className="flex items-center gap-2 rounded-lg bg-green-50 dark:bg-green-950/20 border border-green-200 dark:border-green-900 p-3">
                                    <ArrowLeftRight className="size-4 text-green-600 dark:text-green-400 shrink-0" />
                                    <p className="text-sm text-green-800 dark:text-green-300">Sincronização bilateral ativa</p>
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label className="text-xs">URL do Webhook</Label>
                                    <p className="text-xs text-muted-foreground">
                                        Configure no Kommo em{' '}
                                        <strong>Configurações → Webhooks → Adicionar URL</strong>:
                                    </p>
                                    <div className="flex items-center gap-2 mt-1">
                                        <code className="flex-1 rounded-md bg-muted px-3 py-2 text-xs font-mono break-all">
                                            {bilateralConfig.webhookUrl}
                                        </code>
                                        <Button
                                            size="icon"
                                            variant="outline"
                                            className="shrink-0"
                                            onClick={() => {
                                                navigator.clipboard.writeText(bilateralConfig.webhookUrl!)
                                                setWebhookCopied(true)
                                                setTimeout(() => setWebhookCopied(false), 2000)
                                            }}
                                        >
                                            {webhookCopied ? <Check className="size-4 text-green-500" /> : <Copy className="size-4" />}
                                        </Button>
                                    </div>
                                </div>
                            </>
                        ) : (
                            <p className="text-sm text-muted-foreground text-center py-4">
                                Nenhum webhook configurado para esta pipeline.
                            </p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => { setWebhookPipeline(null); setWebhookCopied(false) }}>
                            Fechar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* ── Dialog: criar grupo ──────────────────────────────────────────── */}
            <Dialog open={createGroupOpen} onOpenChange={setCreateGroupOpen}>
                <DialogContent className="max-w-xs">
                    <DialogHeader>
                        <DialogTitle>Novo grupo</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nome do grupo</Label>
                            <Input
                                value={gName}
                                onChange={(e) => setGName(e.target.value)}
                                placeholder="Ex: Vendas, Marketing..."
                                onKeyDown={(e) => e.key === 'Enter' && handleCreateGroup()}
                                autoFocus
                            />
                        </div>
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreateGroupOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreateGroup}
                            disabled={!gName.trim() || createGroup.isPending}
                        >
                            {createGroup.isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                            Criar
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>
        </div>
    )
}
