'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search, Pencil, Trash2, Loader2, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
    useListActivityTypes, useCreateActivityType, useUpdateActivityType, useDeleteActivityType,
    type ActivityType,
} from '@/services/activity-types'
import { useEnterprise } from '@/hooks/use-enterprise'

// ─── Color presets ────────────────────────────────────────────────────────────

const COLOR_PRESETS = [
    '#6366f1', '#8b5cf6', '#ec4899', '#f43f5e',
    '#f97316', '#eab308', '#22c55e', '#14b8a6',
    '#3b82f6', '#06b6d4', '#64748b', '#1e293b',
]

// ─── Dialog ───────────────────────────────────────────────────────────────────

function ActivityTypeDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: ActivityType
    enterpriseId: string
}) {
    const isEdit = !!initial
    const [name, setName] = useState(initial?.name ?? '')
    const [color, setColor] = useState(initial?.color ?? COLOR_PRESETS[0])

    const { mutate: create, isPending: creating } = useCreateActivityType()
    const { mutate: update, isPending: updating } = useUpdateActivityType()
    const isPending = creating || updating

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (isEdit) {
            update({ id: initial.id, enterpriseId, name: name.trim(), color }, {
                onSuccess: () => { toast.success('Tipo atualizado!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, name: name.trim(), color }, {
                onSuccess: () => {
                    toast.success('Tipo criado!')
                    onOpenChange(false)
                    setName('')
                    setColor(COLOR_PRESETS[0])
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar tipo' : 'Novo tipo de atividade'}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? 'Edite o tipo de atividade.' : 'Crie um novo tipo para classificar suas atividades.'}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="type-name">Nome</Label>
                        <Input
                            id="type-name"
                            placeholder="ex: Ligação, Reunião, E-mail..."
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Cor</Label>
                        <div className="flex flex-wrap gap-2">
                            {COLOR_PRESETS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    disabled={isPending}
                                    className="size-7 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring"
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && (
                                        <Check className="size-3.5 text-white" strokeWidth={3} />
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                                : isEdit ? 'Salvar' : 'Confirmar'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ActivityTypesPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [editType, setEditType] = useState<ActivityType | null>(null)
    const [deleteType, setDeleteType] = useState<ActivityType | null>(null)

    const { data: types = [], isLoading } = useListActivityTypes(enterprise?.id ?? '')
    const { mutate: remove, isPending: deleting } = useDeleteActivityType()

    const filtered = search.trim()
        ? types.filter(t => t.name.toLowerCase().includes(search.toLowerCase()))
        : types

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {}, 0)
    }

    function confirmDelete() {
        if (!deleteType || !enterprise) return
        remove({ id: deleteType.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Tipo removido.'); setDeleteType(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Tipos de atividade</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Crie e gerencie os tipos de atividades do seu time
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    disabled={!enterprise}
                >
                    <Plus className="size-3.5 mr-1.5" />
                    Criar
                </Button>
            </div>

            {/* ── Search + count ──────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-8 h-8 w-52 text-sm"
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {isLoading ? '...' : `${filtered.length} resultado${filtered.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            {/* ── Table ───────────────────────────────────────────────────── */}
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="w-10 px-4 py-2.5 text-left">
                                <Checkbox disabled />
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                                Tipo de atividade
                            </th>
                            <th className="w-24 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                                Cor
                            </th>
                            <th className="w-40 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                                Data de criação
                            </th>
                            <th className="w-20" />
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center">
                                    <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
                                </td>
                            </tr>
                        )}

                        {!isLoading && filtered.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                                    {search
                                        ? 'Nenhum resultado encontrado.'
                                        : 'Nenhum tipo de atividade cadastrado. Clique em "Criar" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {filtered.map(type => (
                            <tr key={type.id} className="border-t hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <Checkbox />
                                </td>
                                <td className="px-4 py-3 font-medium">{type.name}</td>
                                <td className="px-4 py-3">
                                    <div
                                        className="size-5 rounded-full border border-white shadow-sm"
                                        style={{ backgroundColor: type.color }}
                                    />
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {format(new Date(type.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditType(type)}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteType(type)}
                                            className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                        >
                                            <Trash2 className="size-3.5" />
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Dialogs ─────────────────────────────────────────────────── */}
            {enterprise && createOpen && (
                <ActivityTypeDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editType && (
                <ActivityTypeDialog
                    open
                    onOpenChange={v => { if (!v) setEditType(null) }}
                    initial={editType}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteType} onOpenChange={v => { if (!v) setDeleteType(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover tipo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover{' '}
                            <strong>"{deleteType?.name}"</strong>?
                            As atividades existentes com este tipo perderão a classificação.
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
