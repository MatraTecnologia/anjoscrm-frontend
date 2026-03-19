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

import { useListTags, useCreateTag, useUpdateTag, useDeleteTag, type Tag } from '@/services/tags'
import { useEnterprise } from '@/hooks/use-enterprise'

// ─── Paleta de cores ─────────────────────────────────────────────────────────

const TAG_COLORS = [
    '#ef4444', '#f97316', '#f59e0b', '#eab308', '#84cc16',
    '#22c55e', '#10b981', '#14b8a6', '#06b6d4', '#0ea5e9',
    '#3b82f6', '#6366f1', '#8b5cf6', '#a855f7', '#d946ef',
    '#ec4899', '#f43f5e', '#64748b', '#6b7280', '#111827',
]

// ─── Dialog ───────────────────────────────────────────────────────────────────

function TagDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: Tag
    enterpriseId: string
}) {
    const isEdit = !!initial
    const [name, setName] = useState(initial?.name ?? '')
    const [color, setColor] = useState(initial?.color ?? TAG_COLORS[5])

    const { mutate: create, isPending: creating } = useCreateTag()
    const { mutate: update, isPending: updating } = useUpdateTag()
    const isPending = creating || updating

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (isEdit) {
            update({ id: initial.id, enterpriseId, name: name.trim(), color }, {
                onSuccess: () => { toast.success('Tag atualizada!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, name: name.trim(), color }, {
                onSuccess: () => {
                    toast.success('Tag criada!')
                    onOpenChange(false)
                    setName('')
                    setColor(TAG_COLORS[5])
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar tag' : 'Confirmar'}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? 'Edite as informações da tag' : 'Crie novas tags para uma melhor organização'}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="tag-name">Nome</Label>
                        <Input
                            id="tag-name"
                            placeholder="Nome da tag"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    {/* Color picker */}
                    <div className="flex flex-col gap-2">
                        <div className="flex flex-wrap gap-2">
                            {TAG_COLORS.map(c => (
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

export default function TagsSettingsPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [editTag, setEditTag] = useState<Tag | null>(null)
    const [deleteTag, setDeleteTag] = useState<Tag | null>(null)

    const { data: tags = [], isLoading } = useListTags(enterprise?.id ?? '', query || undefined)
    const { mutate: remove, isPending: deleting } = useDeleteTag()

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(value), 400)
    }

    function confirmDelete() {
        if (!deleteTag || !enterprise) return
        remove({ id: deleteTag.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Tag excluída.'); setDeleteTag(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Tags</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Organize suas ideias com tags
                    </p>
                </div>
                <Button
                    size="sm"
                    onClick={() => setCreateOpen(true)}
                    disabled={!enterprise}
                >
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
                    {isLoading ? '...' : `${tags.length} resultado${tags.length !== 1 ? 's' : ''}`}
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
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tags</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Descrição</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Data de criação</th>
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

                        {!isLoading && tags.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                                    {query
                                        ? 'Nenhuma tag encontrada para essa busca.'
                                        : 'Nenhuma tag criada ainda. Clique em "Criar" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {tags.map(tag => (
                            <tr key={tag.id} className="border-t hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <Checkbox />
                                </td>

                                {/* Nome + cor */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-3 rounded-full shrink-0"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        <span className="font-medium">{tag.name}</span>
                                    </div>
                                </td>

                                {/* Descrição */}
                                <td className="px-4 py-3 text-muted-foreground">—</td>

                                {/* Data */}
                                <td className="px-4 py-3 text-muted-foreground">
                                    {format(new Date(tag.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </td>

                                {/* Actions */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditTag(tag)}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteTag(tag)}
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
                <TagDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editTag && (
                <TagDialog
                    open
                    onOpenChange={v => { if (!v) setEditTag(null) }}
                    initial={editTag}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteTag} onOpenChange={v => { if (!v) setDeleteTag(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir tag?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir a tag{' '}
                            <strong>"{deleteTag?.name}"</strong>?
                            Ela será removida de todos os leads.
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
                                ? <><Loader2 className="size-4 animate-spin" /> Excluindo...</>
                                : 'Excluir'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
