'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
    Plus, Trash2, Pencil, GripVertical, Loader2,
    Type, Hash, DollarSign, Calendar, CalendarDays,
    List, CheckSquare, Link, Phone, Mail, AlignLeft,
    LayoutGrid, ChevronDown,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useCustomFields, useCreateCustomField, useUpdateCustomField,
    useDeleteCustomField, useReorderCustomFields,
    type CustomFieldDef, type CustomFieldPayload,
} from '@/services/custom-fields'
import { cn } from '@/lib/utils'

// ─── Constants ────────────────────────────────────────────────────────────────

const FIELD_TYPES = [
    { value: 'text',        label: 'Texto',            icon: Type },
    { value: 'textarea',    label: 'Texto longo',      icon: AlignLeft },
    { value: 'number',      label: 'Número',           icon: Hash },
    { value: 'currency',    label: 'Moeda',            icon: DollarSign },
    { value: 'date',        label: 'Data',             icon: Calendar },
    { value: 'datetime',    label: 'Data e hora',      icon: CalendarDays },
    { value: 'select',      label: 'Seleção única',    icon: ChevronDown },
    { value: 'multiselect', label: 'Seleção múltipla', icon: List },
    { value: 'checkbox',    label: 'Caixa de seleção', icon: CheckSquare },
    { value: 'url',         label: 'URL',              icon: Link },
    { value: 'phone',       label: 'Telefone',         icon: Phone },
    { value: 'email',       label: 'E-mail',           icon: Mail },
]

function fieldTypeLabel(type: string) {
    return FIELD_TYPES.find(t => t.value === type)?.label ?? type
}

function FieldTypeIcon({ type, className }: { type: string; className?: string }) {
    const Icon = FIELD_TYPES.find(t => t.value === type)?.icon ?? Type
    return <Icon className={className} />
}

// ─── Form dialog ──────────────────────────────────────────────────────────────

type FormState = {
    name: string
    description: string
    group: string
    entity: string
    fieldType: string
    required: boolean
    isPublic: boolean
    alwaysVisible: boolean
    options: string  // comma-separated para select/multiselect
}

const EMPTY_FORM: FormState = {
    name: '',
    description: '',
    group: '',
    entity: 'lead',
    fieldType: 'text',
    required: false,
    isPublic: true,
    alwaysVisible: false,
    options: '',
}

function FieldFormDialog({
    open,
    onClose,
    initialData,
    enterpriseId,
}: {
    open: boolean
    onClose: () => void
    initialData?: CustomFieldDef | null
    enterpriseId: string
}) {
    const isEdit = !!initialData

    const [form, setForm] = useState<FormState>(() =>
        initialData
            ? {
                name: initialData.name,
                description: initialData.description ?? '',
                group: initialData.group ?? '',
                entity: initialData.entity,
                fieldType: initialData.fieldType,
                required: initialData.required,
                isPublic: initialData.isPublic,
                alwaysVisible: initialData.alwaysVisible,
                options: initialData.options?.join(', ') ?? '',
            }
            : EMPTY_FORM,
    )

    const { mutate: create, isPending: creating } = useCreateCustomField()
    const { mutate: update, isPending: updating } = useUpdateCustomField()
    const isPending = creating || updating

    function set<K extends keyof FormState>(key: K, value: FormState[K]) {
        setForm(prev => ({ ...prev, [key]: value }))
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()

        const hasOptions = form.fieldType === 'select' || form.fieldType === 'multiselect'
        const payload: CustomFieldPayload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            group: form.group.trim() || null,
            entity: form.entity,
            fieldType: form.fieldType,
            required: form.required,
            isPublic: form.isPublic,
            alwaysVisible: form.alwaysVisible,
            options: hasOptions
                ? form.options.split(',').map(s => s.trim()).filter(Boolean)
                : null,
        }

        if (isEdit) {
            update({ id: initialData!.id, enterpriseId, payload }, {
                onSuccess: () => { toast.success('Campo atualizado!'); onClose() },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, payload }, {
                onSuccess: () => { toast.success('Campo criado!'); onClose() },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    const canSubmit = form.name.trim().length > 0

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) onClose() }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar campo adicional' : 'Criar campo adicional'}</DialogTitle>
                    {!isEdit && <p className="text-sm text-muted-foreground">Crie um novo campo adicional</p>}
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    {/* Nome */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cf-name">Nome *</Label>
                        <Input
                            id="cf-name"
                            placeholder="Nome do campo adicional"
                            value={form.name}
                            onChange={e => set('name', e.target.value)}
                            disabled={isPending}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Descrição */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cf-desc">Descrição</Label>
                        <Input
                            id="cf-desc"
                            placeholder="Descrição do campo adicional"
                            value={form.description}
                            onChange={e => set('description', e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    {/* Grupo */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="cf-group">Grupo</Label>
                        <Input
                            id="cf-group"
                            placeholder="Ex: Dados Comerciais"
                            value={form.group}
                            onChange={e => set('group', e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    {/* Aplicação */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Aplicação</Label>
                        <Select value={form.entity} onValueChange={v => set('entity', v)} disabled={isEdit || isPending}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="lead">Lead</SelectItem>
                                <SelectItem value="deal">Negócio</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Tipo + Visualização */}
                    <div className="flex gap-3">
                        <div className="flex flex-col gap-1.5 flex-1">
                            <Label>Tipo</Label>
                            <Select value={form.fieldType} onValueChange={v => set('fieldType', v)} disabled={isEdit || isPending}>
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    {FIELD_TYPES.map(({ value, label }) => (
                                        <SelectItem key={value} value={value}>{label}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Visualização</Label>
                            <div className="flex items-center gap-2 h-9">
                                <Switch
                                    checked={form.isPublic}
                                    onCheckedChange={v => set('isPublic', v)}
                                    disabled={isPending}
                                />
                                <span className="text-sm">{form.isPublic ? 'Público' : 'Privado'}</span>
                            </div>
                        </div>
                    </div>

                    {/* Opções para select/multiselect */}
                    {(form.fieldType === 'select' || form.fieldType === 'multiselect') && (
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="cf-options">Opções</Label>
                            <Textarea
                                id="cf-options"
                                placeholder="Opção 1, Opção 2, Opção 3"
                                value={form.options}
                                onChange={e => set('options', e.target.value)}
                                disabled={isPending}
                                className="resize-none text-sm min-h-16"
                            />
                            <p className="text-xs text-muted-foreground">Separe as opções por vírgula</p>
                        </div>
                    )}

                    {/* Sempre visível */}
                    <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={form.alwaysVisible}
                                onCheckedChange={v => set('alwaysVisible', v)}
                                disabled={isPending}
                            />
                            <Label className="cursor-pointer">Sempre visível</Label>
                        </div>
                        {form.alwaysVisible && (
                            <p className="text-xs text-primary ml-12">
                                Quando ativado, este campo aparecerá em todos os leads/negócios, mesmo sem valor atribuído
                            </p>
                        )}
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!canSubmit || isPending}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin mr-1.5" />{isEdit ? 'Salvando...' : 'Criando...'}</>
                                : isEdit ? 'Salvar' : 'Confirmar'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Field row ────────────────────────────────────────────────────────────────

function FieldRow({
    field,
    enterpriseId,
    onEdit,
    onDelete,
    dragHandleProps,
}: {
    field: CustomFieldDef
    enterpriseId: string
    onEdit: (f: CustomFieldDef) => void
    onDelete: (f: CustomFieldDef) => void
    dragHandleProps: {
        draggable: boolean
        onDragStart: React.DragEventHandler
        onDragOver: React.DragEventHandler
        onDrop: React.DragEventHandler
        onDragEnd: React.DragEventHandler
        'data-dragging'?: boolean
    }
}) {
    return (
        <div
            {...dragHandleProps}
            className={cn(
                'flex items-center gap-3 rounded-lg border bg-card px-3 py-2.5 group transition-colors',
                dragHandleProps['data-dragging'] && 'opacity-40 scale-[0.98]',
            )}
        >
            <GripVertical className="size-4 text-muted-foreground/40 cursor-grab shrink-0 group-hover:text-muted-foreground" />

            <div className="flex size-7 shrink-0 items-center justify-center rounded-md bg-muted">
                <FieldTypeIcon type={field.fieldType} className="size-3.5 text-muted-foreground" />
            </div>

            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium truncate">{field.name}</span>
                    {field.required && (
                        <span className="text-[10px] text-destructive font-medium">obrigatório</span>
                    )}
                    {!field.isPublic && (
                        <Badge variant="secondary" className="text-[10px] py-0 px-1.5 h-4">privado</Badge>
                    )}
                </div>
                <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-muted-foreground">{fieldTypeLabel(field.fieldType)}</span>
                    {field.group && (
                        <>
                            <span className="text-muted-foreground/40 text-xs">·</span>
                            <span className="text-xs text-muted-foreground">{field.group}</span>
                        </>
                    )}
                </div>
            </div>

            <div className="flex items-center gap-1 shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground"
                    onClick={() => onEdit(field)}
                >
                    <Pencil className="size-3.5" />
                </Button>
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={() => onDelete(field)}
                >
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function CustomFieldsPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [entityTab, setEntityTab] = useState<'lead' | 'deal'>('lead')
    const [showForm, setShowForm] = useState(false)
    const [editTarget, setEditTarget] = useState<CustomFieldDef | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<CustomFieldDef | null>(null)

    // drag state
    const [dragFrom, setDragFrom] = useState<number | null>(null)
    const [dragOver, setDragOver] = useState<number | null>(null)

    const { data: fields = [], isLoading } = useCustomFields(enterpriseId, entityTab)
    const { mutate: remove, isPending: deleting } = useDeleteCustomField()
    const { mutate: reorder } = useReorderCustomFields()

    function openCreate() {
        setEditTarget(null)
        setShowForm(true)
    }

    function openEdit(f: CustomFieldDef) {
        setEditTarget(f)
        setShowForm(true)
    }

    function confirmDelete() {
        if (!deleteTarget) return
        remove({ id: deleteTarget.id, enterpriseId }, {
            onSuccess: () => { toast.success('Campo removido.'); setDeleteTarget(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    // Drag-to-reorder
    function commitReorder(newOrder: CustomFieldDef[]) {
        reorder({ enterpriseId, ids: newOrder.map(f => f.id) })
    }

    const grouped = fields.reduce<Record<string, CustomFieldDef[]>>((acc, f) => {
        const g = f.group ?? ''
        if (!acc[g]) acc[g] = []
        acc[g].push(f)
        return acc
    }, {})

    // flat list for drag index tracking (global index across groups)
    const flatFields = fields

    return (
        <div className="flex flex-col max-w-3xl mx-auto w-full">

            {/* ── Header ─────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-8 py-6 border-b">
                <div>
                    <h1 className="text-lg font-semibold">Campos Adicionais</h1>
                    <p className="text-sm text-muted-foreground">Crie seus campos adicionais por aqui</p>
                </div>
                <Button onClick={openCreate} className="gap-1.5">
                    <Plus className="size-4" />
                    Novo campo
                </Button>
            </div>

            {/* ── Content ─────────────────────────────────────────────── */}
            <div className="flex flex-col gap-6 p-8">
                <div className="rounded-lg border flex flex-col overflow-hidden">

                    {/* Entity tabs */}
                    <div className="flex gap-0 border-b px-2">
                        {(['lead', 'deal'] as const).map(tab => (
                            <button
                                key={tab}
                                onClick={() => setEntityTab(tab)}
                                className={cn(
                                    'px-4 py-2.5 text-sm font-medium border-b-2 transition-colors',
                                    entityTab === tab
                                        ? 'border-primary text-primary'
                                        : 'border-transparent text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab === 'lead' ? 'Lead' : 'Negócio'}
                            </button>
                        ))}
                    </div>

                    {/* Fields list */}
                    <div className="p-4">
                        {isLoading ? (
                            <div className="flex items-center justify-center h-32">
                                <Loader2 className="size-5 animate-spin text-muted-foreground" />
                            </div>
                        ) : flatFields.length === 0 ? (
                            <div className="flex flex-col items-center justify-center py-12 gap-4 text-center">
                                <div className="flex size-12 items-center justify-center rounded-full bg-muted">
                                    <LayoutGrid className="size-5 text-muted-foreground" />
                                </div>
                                <div>
                                    <p className="text-sm font-medium">Nenhum campo adicional</p>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Crie campos personalizados para {entityTab === 'lead' ? 'leads' : 'negócios'}
                                    </p>
                                </div>
                                <Button onClick={openCreate} className="gap-1.5">
                                    <Plus className="size-4" />
                                    Novo campo
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-4">
                                {Object.entries(grouped).map(([group, groupFields]) => (
                                    <div key={group} className="flex flex-col gap-2">
                                        {group && (
                                            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1">
                                                {group}
                                            </p>
                                        )}
                                        {groupFields.map(field => {
                                            const idx = flatFields.indexOf(field)
                                            return (
                                                <FieldRow
                                                    key={field.id}
                                                    field={field}
                                                    enterpriseId={enterpriseId}
                                                    onEdit={openEdit}
                                                    onDelete={setDeleteTarget}
                                                    dragHandleProps={{
                                                        draggable: true,
                                                        'data-dragging': dragFrom === idx,
                                                        onDragStart: () => setDragFrom(idx),
                                                        onDragOver: (e) => { e.preventDefault(); setDragOver(idx) },
                                                        onDrop: () => {
                                                            if (dragFrom === null || dragFrom === idx) return
                                                            const newOrder = [...flatFields]
                                                            const [moved] = newOrder.splice(dragFrom, 1)
                                                            newOrder.splice(idx, 0, moved)
                                                            commitReorder(newOrder)
                                                            setDragFrom(null); setDragOver(null)
                                                        },
                                                        onDragEnd: () => { setDragFrom(null); setDragOver(null) },
                                                    }}
                                                />
                                            )
                                        })}
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>
                </div>
            </div>

            {/* ── Form dialog ─────────────────────────────────────────── */}
            {showForm && (
                <FieldFormDialog
                    open={showForm}
                    onClose={() => { setShowForm(false); setEditTarget(null) }}
                    initialData={editTarget}
                    enterpriseId={enterpriseId}
                />
            )}

            {/* ── Delete dialog ───────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover campo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover o campo <strong>{deleteTarget?.name}</strong>?
                            Todos os valores salvos serão excluídos junto com o campo.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting
                                ? <><Loader2 className="size-4 animate-spin" /> Removendo...</>
                                : 'Remover'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
