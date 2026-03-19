'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import {
    Plus, Search, Phone, Mail, MoreHorizontal,
    Pencil, Briefcase, MessageCircle, Trash2, Loader2,
} from 'lucide-react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { TagSelector } from '@/components/tag-selector'

import { useLeads, useCreateLead, useUpdateLead, useDeleteLead, type Lead } from '@/services/leads'
import { useListTags, useCreateTag, type Tag } from '@/services/tags'
import { useEnterprise } from '@/hooks/use-enterprise'
import { LeadSheet } from '@/components/lead-sheet'

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

// ─── Lead Form Dialog ─────────────────────────────────────────────────────────

type FormState = { name: string; phone: string; email: string }

function LeadDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: Lead
    enterpriseId: string
}) {
    const isEdit = !!initial
    const [form, setForm] = useState<FormState>({
        name: initial?.name ?? '',
        phone: initial?.phone ?? '',
        email: initial?.email ?? '',
    })
    const [selectedTags, setSelectedTags] = useState<Tag[]>(initial?.tags ?? [])

    const { data: allTags = [] } = useListTags(enterpriseId)
    const { mutateAsync: createTag, isPending: creatingTag } = useCreateTag()

    const { mutate: create, isPending: creating } = useCreateLead()
    const { mutate: update, isPending: updating } = useUpdateLead()
    const isPending = creating || updating

    async function handleCreateTag(name: string): Promise<Tag> {
        return createTag({ enterpriseId, name })
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        const payload = {
            name: form.name.trim(),
            phone: form.phone.trim() || null,
            email: form.email.trim() || null,
            tagIds: selectedTags.map(t => t.id),
        }

        if (isEdit) {
            update({ id: initial.id, enterpriseId, payload }, {
                onSuccess: () => { toast.success('Lead atualizado!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, payload }, {
                onSuccess: () => {
                    toast.success('Lead criado!')
                    onOpenChange(false)
                    setForm({ name: '', phone: '', email: '' })
                    setSelectedTags([])
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    function set(field: keyof FormState) {
        return (e: React.ChangeEvent<HTMLInputElement>) =>
            setForm(f => ({ ...f, [field]: e.target.value }))
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar lead' : 'Criar novo Lead'}</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ln">Nome *</Label>
                        <Input
                            id="ln"
                            placeholder="Informe o nome do lead"
                            required
                            value={form.name}
                            onChange={set('name')}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Telefone</Label>
                        <PhoneInput
                            value={form.phone}
                            onChange={v => setForm(f => ({ ...f, phone: v }))}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="le">E-mail</Label>
                        <Input
                            id="le"
                            type="email"
                            placeholder="lead@exemplo.com"
                            value={form.email}
                            onChange={set('email')}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Tags</Label>
                        <TagSelector
                            allTags={allTags}
                            value={selectedTags}
                            onChange={setSelectedTags}
                            onCreateTag={handleCreateTag}
                            isCreating={creatingTag}
                            disabled={isPending}
                        />
                    </div>

                    <DialogFooter className="pt-2">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                                : isEdit ? 'Salvar alterações' : 'Confirmar'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function LeadsPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [editLead, setEditLead] = useState<Lead | null>(null)
    const [deleteLead, setDeleteLead] = useState<Lead | null>(null)
    const [sheetLead, setSheetLead] = useState<Lead | null>(null)

    const { data: leads = [], isLoading } = useLeads(enterprise?.id ?? '', query || undefined)
    const { mutate: remove, isPending: deleting } = useDeleteLead()

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(value), 400)
    }

    function confirmDelete() {
        if (!deleteLead || !enterprise) return
        remove({ id: deleteLead.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Lead excluído.'); setDeleteLead(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div>
                    <h1 className="text-xl font-semibold">Leads</h1>
                    <p className="text-sm text-muted-foreground">Consulte, crie, modifique ou remova seus leads</p>
                </div>
                <Button onClick={() => setCreateOpen(true)} className="gap-1.5">
                    <Plus className="size-4" />
                    Novo Lead
                </Button>
            </div>

            {/* ── Toolbar ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3 px-6 py-3 border-b shrink-0">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-8 h-8 w-48 text-sm"
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {isLoading ? '...' : `${leads.length} resultado${leads.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            {/* ── Table ──────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                <table className="w-full text-sm border-collapse">
                    <thead className="sticky top-0 bg-background border-b z-10">
                        <tr>
                            <th className="w-10 px-4 py-2.5 text-left">
                                <Checkbox disabled />
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nome</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Contatos</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Tags</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Dados</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Data de criação</th>
                            <th className="w-12" />
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={7} className="py-16 text-center">
                                    <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
                                </td>
                            </tr>
                        )}

                        {!isLoading && leads.length === 0 && (
                            <tr>
                                <td colSpan={7} className="py-16 text-center text-sm text-muted-foreground">
                                    {query
                                        ? 'Nenhum lead encontrado para essa busca.'
                                        : 'Nenhum lead cadastrado ainda. Clique em "Novo Lead" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {leads.map(lead => (
                            <tr
                                key={lead.id}
                                className="border-b hover:bg-muted/30 transition-colors cursor-pointer"
                                onClick={() => setSheetLead(lead)}
                            >

                                {/* Checkbox */}
                                <td className="px-4 py-3">
                                    <Checkbox />
                                </td>

                                {/* Nome */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-3">
                                        {lead.image ? (
                                            <img src={lead.image} alt={lead.name} className="size-8 shrink-0 rounded-full object-cover" />
                                        ) : (
                                            <div className={`flex size-8 shrink-0 items-center justify-center rounded-full text-white text-xs font-semibold ${getAvatarColor(lead.name)}`}>
                                                {getInitials(lead.name)}
                                            </div>
                                        )}
                                        <div className="min-w-0">
                                            <p className="font-medium leading-tight truncate max-w-44">{lead.name}</p>
                                            <p className="text-xs text-muted-foreground leading-tight mt-0.5">
                                                Ticket médio{' '}
                                                <span className="text-green-600 font-medium">R$ 0,00</span>
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Contatos */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-col gap-1">
                                        {lead.phone && (
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Phone className="size-3 shrink-0" />
                                                <span className="truncate max-w-36">{lead.phone}</span>
                                            </span>
                                        )}
                                        {lead.email && (
                                            <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                                                <Mail className="size-3 shrink-0" />
                                                <span className="truncate max-w-36">{lead.email}</span>
                                            </span>
                                        )}
                                        {!lead.phone && !lead.email && (
                                            <span className="text-xs text-muted-foreground">—</span>
                                        )}
                                    </div>
                                </td>

                                {/* Tags */}
                                <td className="px-4 py-3">
                                    <div className="flex flex-wrap gap-1 max-w-44">
                                        {lead.tags.length > 0
                                            ? lead.tags.map(tag => (
                                                <Badge
                                                    key={tag.id}
                                                    variant="outline"
                                                    className="text-xs py-0 px-1.5 border-0 text-white"
                                                    style={{ backgroundColor: tag.color }}
                                                >
                                                    {tag.name}
                                                </Badge>
                                            ))
                                            : <span className="text-xs text-muted-foreground">—</span>
                                        }
                                    </div>
                                </td>

                                {/* Dados */}
                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-4">
                                        <div>
                                            <p className="text-xs text-muted-foreground leading-tight">Total</p>
                                            <p className="text-sm font-medium leading-tight">R$ 0,00</p>
                                        </div>
                                        <div className="border-l pl-4">
                                            <p className="text-lg font-semibold leading-tight tabular-nums">
                                                {lead._count?.deals ?? 0}
                                            </p>
                                            <p className="text-xs text-muted-foreground leading-tight">
                                                {(lead._count?.deals ?? 0) === 1 ? 'Negócio' : 'Negócios'}
                                            </p>
                                        </div>
                                    </div>
                                </td>

                                {/* Data */}
                                <td className="px-4 py-3 text-sm text-muted-foreground whitespace-nowrap">
                                    {format(new Date(lead.createdAt), "d 'de' MMMM 'de' yyyy", { locale: ptBR })}
                                </td>

                                {/* Actions */}
                                <td className="px-2 py-3" onClick={e => e.stopPropagation()}>
                                    <DropdownMenu>
                                        <DropdownMenuTrigger asChild>
                                            <Button variant="ghost" size="icon" className="size-8">
                                                <MoreHorizontal className="size-4" />
                                            </Button>
                                        </DropdownMenuTrigger>
                                        <DropdownMenuContent align="end" className="w-56">
                                            <DropdownMenuItem onClick={() => setEditLead(lead)} className="gap-2.5 py-2">
                                                <Pencil className="size-4 text-muted-foreground shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">Editar</p>
                                                    <p className="text-xs text-muted-foreground">Abrir menu para editar informações</p>
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem disabled className="gap-2.5 py-2">
                                                <Briefcase className="size-4 text-muted-foreground shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">Criar negócio</p>
                                                    <p className="text-xs text-muted-foreground">Crie um negócio para o lead</p>
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuItem disabled className="gap-2.5 py-2">
                                                <MessageCircle className="size-4 text-muted-foreground shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">Abrir Chat</p>
                                                    <p className="text-xs text-muted-foreground">Abrir conversa no chat express</p>
                                                </div>
                                            </DropdownMenuItem>

                                            <DropdownMenuSeparator />

                                            <DropdownMenuItem
                                                onClick={() => setDeleteLead(lead)}
                                                className="gap-2.5 py-2 text-destructive focus:text-destructive"
                                            >
                                                <Trash2 className="size-4 shrink-0" />
                                                <div>
                                                    <p className="font-medium text-sm">Excluir</p>
                                                    <p className="text-xs opacity-70">Excluir lead do sistema</p>
                                                </div>
                                            </DropdownMenuItem>
                                        </DropdownMenuContent>
                                    </DropdownMenu>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </div>

            {/* ── Dialogs ────────────────────────────────────────────────── */}
            {enterprise && (
                <LeadSheet
                    lead={sheetLead}
                    enterpriseId={enterprise.id}
                    open={!!sheetLead}
                    onOpenChange={v => { if (!v) setSheetLead(null) }}
                    onEdit={lead => { setSheetLead(null); setEditLead(lead) }}
                />
            )}

            {enterprise && createOpen && (
                <LeadDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editLead && (
                <LeadDialog
                    open
                    onOpenChange={v => { if (!v) setEditLead(null) }}
                    initial={editLead}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteLead} onOpenChange={v => { if (!v) setDeleteLead(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir lead?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>{deleteLead?.name}</strong>?
                            Todos os negócios e mensagens relacionados também serão removidos.
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
