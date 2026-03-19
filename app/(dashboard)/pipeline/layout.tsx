'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useParams, useRouter } from 'next/navigation'
import {
    Plus, Loader2, Trash2, MoreHorizontal, ChevronDown, ChevronRight,
    GripVertical, FolderPlus,
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
    useCreatePipeline, useDeletePipeline, useReorderPipelines,
    type PipelineGroup, type Pipeline,
} from '@/services/pipelines'

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
    pipeline, groupId, selectedId, onDelete,
}: {
    pipeline: Pipeline
    groupId: string | null
    selectedId?: string
    onDelete: (p: Pipeline) => void
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
                <DropdownMenuContent align="end" className="w-36">
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
    group, isExpanded, onToggle, selectedId, onDeletePipeline, onDeleteGroup,
}: {
    group: PipelineGroup
    isExpanded: boolean
    onToggle: () => void
    selectedId?: string
    onDeletePipeline: (p: Pipeline) => void
    onDeleteGroup: (g: PipelineGroup) => void
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

    const [createGroupOpen, setCreateGroupOpen] = useState(false)
    const [gName, setGName] = useState('')

    const createPipeline = useCreatePipeline()
    const deletePipeline = useDeletePipeline()
    const createGroup = useCreateGroup()
    const deleteGroup = useDeleteGroup()
    const reorderGroups = useReorderGroups()
    const reorderPipelines = useReorderPipelines()

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 8 } }))

    function toggle(groupId: string) {
        setCollapsed(prev => {
            const next = new Set(prev)
            if (next.has(groupId)) next.delete(groupId)
            else next.add(groupId)
            return next
        })
    }

    function handleCreatePipeline() {
        if (!enterprise?.id || !pName.trim()) return
        createPipeline.mutate(
            {
                enterpriseId: enterprise.id,
                name: pName.trim(),
                color: pColor,
                description: pDesc.trim() || undefined,
                groupId: pGroupId === 'none' ? null : pGroupId,
            },
            {
                onSuccess: (p) => {
                    setCreatePipelineOpen(false)
                    setPName(''); setPDesc(''); setPGroupId('none')
                    router.push(`/pipeline/${p.id}`)
                    toast.success('Pipeline criada!')
                },
                onError: (e) => toast.error(e.message),
            },
        )
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
            <Dialog open={createPipelineOpen} onOpenChange={setCreatePipelineOpen}>
                <DialogContent className="max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Nova pipeline</DialogTitle>
                    </DialogHeader>
                    <div className="flex flex-col gap-3 py-2">
                        <div className="flex flex-col gap-1.5">
                            <Label>Nome</Label>
                            <Input
                                value={pName}
                                onChange={(e) => setPName(e.target.value)}
                                placeholder="Ex: Vendas B2B"
                                onKeyDown={(e) => e.key === 'Enter' && handleCreatePipeline()}
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
                    </div>
                    <DialogFooter>
                        <Button variant="outline" onClick={() => setCreatePipelineOpen(false)}>
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleCreatePipeline}
                            disabled={!pName.trim() || createPipeline.isPending}
                        >
                            {createPipeline.isPending && <Loader2 className="size-3.5 animate-spin mr-1.5" />}
                            Criar
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
