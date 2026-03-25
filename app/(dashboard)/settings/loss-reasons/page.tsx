'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Plus, Search, Pencil, Trash2, Loader2, CheckCircle2, XCircle } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Switch } from '@/components/ui/switch'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import {
    useListLossReasons, useCreateLossReason, useUpdateLossReason, useDeleteLossReason,
    type LossReason,
} from '@/services/loss-reasons'
import { useEnterprise } from '@/hooks/use-enterprise'

// ─── Dialog ───────────────────────────────────────────────────────────────────

function LossReasonDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: LossReason
    enterpriseId: string
}) {
    const isEdit = !!initial
    const [name, setName] = useState(initial?.name ?? '')
    const [requireJustification, setRequireJustification] = useState(initial?.requireJustification ?? false)

    const { mutate: create, isPending: creating } = useCreateLossReason()
    const { mutate: update, isPending: updating } = useUpdateLossReason()
    const isPending = creating || updating

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (isEdit) {
            update({ id: initial.id, enterpriseId, name: name.trim(), requireJustification }, {
                onSuccess: () => { toast.success('Motivo atualizado!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, name: name.trim(), requireJustification }, {
                onSuccess: () => {
                    toast.success('Motivo criado!')
                    onOpenChange(false)
                    setName('')
                    setRequireJustification(false)
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar motivo' : 'Novo motivo'}</DialogTitle>
                    <p className="text-sm text-muted-foreground">
                        {isEdit ? 'Edite o motivo de perda.' : 'Crie motivos de perda dos seus negócios.'}
                    </p>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="reason-name">Motivo</Label>
                        <Input
                            id="reason-name"
                            placeholder="ex: Não tinha crédito para a compra..."
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <Label>Justificativa obrigatória</Label>
                        <div className="flex items-center gap-3">
                            <Switch
                                checked={requireJustification}
                                onCheckedChange={setRequireJustification}
                                disabled={isPending}
                            />
                            <span className="text-sm text-muted-foreground">
                                {requireJustification ? 'Sim' : 'Não'}
                            </span>
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

export default function LossReasonsPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [editReason, setEditReason] = useState<LossReason | null>(null)
    const [deleteReason, setDeleteReason] = useState<LossReason | null>(null)

    const { data: reasons = [], isLoading } = useListLossReasons(enterprise?.id ?? '')
    const { mutate: remove, isPending: deleting } = useDeleteLossReason()

    const filtered = search.trim()
        ? reasons.filter(r => r.name.toLowerCase().includes(search.toLowerCase()))
        : reasons

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => {}, 0)
    }

    function confirmDelete() {
        if (!deleteReason || !enterprise) return
        remove({ id: deleteReason.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Motivo removido.'); setDeleteReason(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">

            {/* ── Header ──────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Motivos de perda dos negócios</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Descubra, organize e gerencie seus motivos de perda
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
                                Motivos de perda dos negócios
                            </th>
                            <th className="w-36 px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">
                                Obrigatório
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
                                        : 'Nenhum motivo de perda cadastrado. Clique em "Criar" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {filtered.map(reason => (
                            <tr key={reason.id} className="border-t hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3">
                                    <Checkbox />
                                </td>
                                <td className="px-4 py-3 font-medium">{reason.name}</td>
                                <td className="px-4 py-3">
                                    {reason.requireJustification ? (
                                        <Badge
                                            variant="outline"
                                            className="text-emerald-600 border-emerald-200 bg-emerald-50 gap-1 dark:bg-emerald-950 dark:border-emerald-800 dark:text-emerald-400"
                                        >
                                            <CheckCircle2 className="size-3" />
                                            Sim
                                        </Badge>
                                    ) : (
                                        <Badge
                                            variant="outline"
                                            className="text-red-500 border-red-200 bg-red-50 gap-1 dark:bg-red-950 dark:border-red-800 dark:text-red-400"
                                        >
                                            <XCircle className="size-3" />
                                            Não
                                        </Badge>
                                    )}
                                </td>
                                <td className="px-4 py-3 text-muted-foreground">
                                    {format(new Date(reason.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </td>
                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditReason(reason)}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteReason(reason)}
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
                <LossReasonDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editReason && (
                <LossReasonDialog
                    open
                    onOpenChange={v => { if (!v) setEditReason(null) }}
                    initial={editReason}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteReason} onOpenChange={v => { if (!v) setDeleteReason(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover motivo</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover{' '}
                            <strong>"{deleteReason?.name}"</strong>?
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
