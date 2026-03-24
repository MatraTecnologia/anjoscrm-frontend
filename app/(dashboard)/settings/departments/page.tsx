'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Plus, Search, Pencil, Trash2, Loader2, Check, ChevronLeft, X, UserPlus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import { useMembers } from '@/services/enterprises'
import { useListWorkSchedules } from '@/services/work-schedules'
import {
    useListDepartments, useCreateDepartment, useUpdateDepartment, useDeleteDepartment,
    useListDepartmentMembers, useAddDepartmentMember, useRemoveDepartmentMember,
    type Department,
} from '@/services/departments'

// ─── Color palette ────────────────────────────────────────────────────────────

const DEPT_COLORS = [
    '#ef4444', '#ef4444', '#f87171', '#fb7185', '#f43f5e',
    '#ec4899', '#f97316', '#fb923c', '#22c55e', '#16a34a',
    '#14b8a6', '#06b6d4', '#0ea5e9', '#3b82f6', '#6366f1',
    '#8b5cf6', '#a855f7', '#64748b', '#374151', '#111827',
]

const UNIQUE_COLORS = [
    '#ef4444', '#f87171', '#fb7185', '#ec4899', '#f43f5e',
    '#f97316', '#fb923c', '#22c55e', '#16a34a', '#14b8a6',
    '#06b6d4', '#0ea5e9', '#6366f1', '#8b5cf6', '#a855f7',
    '#64748b', '#374151', '#111827',
]

function getInitials(name: string) {
    return name.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
}

// ─── Create/Edit Dialog ───────────────────────────────────────────────────────

type DialogStep = 'info' | 'members'

function DepartmentDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: Department
    enterpriseId: string
}) {
    const isEdit = !!initial
    const [step, setStep] = useState<DialogStep>('info')

    // Step 1 state
    const [name, setName] = useState(initial?.name ?? '')
    const [color, setColor] = useState(initial?.color ?? '#6366f1')
    const [workScheduleId, setWorkScheduleId] = useState<string>(initial?.workScheduleId ?? '')

    // For newly created dept (create flow)
    const [createdDeptId, setCreatedDeptId] = useState<string | null>(initial?.id ?? null)

    const { data: schedules = [] } = useListWorkSchedules(enterpriseId)
    const { data: allMembers = [] } = useMembers(enterpriseId)

    // Members of dept
    const activeDeptId = createdDeptId ?? initial?.id ?? ''
    const { data: deptMembers = [], refetch: refetchMembers } = useListDepartmentMembers(
        enterpriseId, activeDeptId,
    )

    const { mutate: create, isPending: creating } = useCreateDepartment()
    const { mutate: update, isPending: updating } = useUpdateDepartment()
    const { mutate: addMember, isPending: addingMember } = useAddDepartmentMember()
    const { mutate: removeMember } = useRemoveDepartmentMember()

    const isPending = creating || updating

    const memberUserIds = new Set(deptMembers.map(m => m.userId))
    const availableToAdd = allMembers.filter(m => !memberUserIds.has(m.userId))

    function handleInfoSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (isEdit && initial) {
            update({
                id: initial.id, enterpriseId,
                name: name.trim(), color,
                workScheduleId: workScheduleId || null,
            }, {
                onSuccess: () => {
                    toast.success('Departamento atualizado!')
                    setStep('members')
                },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({
                enterpriseId,
                name: name.trim(), color,
                workScheduleId: workScheduleId || null,
            }, {
                onSuccess: (dept) => {
                    setCreatedDeptId(dept.id)
                    setStep('members')
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    function handleAddMember(userId: string) {
        if (!activeDeptId) return
        addMember({ enterpriseId, departmentId: activeDeptId, userId }, {
            onSuccess: () => refetchMembers(),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleRemoveMember(userId: string) {
        if (!activeDeptId) return
        removeMember({ enterpriseId, departmentId: activeDeptId, userId }, {
            onSuccess: () => refetchMembers(),
        })
    }

    function handleConfirm() {
        toast.success(isEdit ? 'Departamento atualizado!' : 'Departamento criado!')
        onOpenChange(false)
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Editar departamento' : 'Criar departamento'}
                    </DialogTitle>
                </DialogHeader>

                {/* ── Step 1: Info ──────────────────────────────────────── */}
                {step === 'info' && (
                    <form onSubmit={handleInfoSubmit} className="flex flex-col gap-4 py-1">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="dept-name">Nome</Label>
                            <Input
                                id="dept-name"
                                placeholder="Nome do departamento"
                                required
                                value={name}
                                onChange={e => setName(e.target.value)}
                                disabled={isPending}
                                autoFocus
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Horário de funcionamento</Label>
                            <Select
                                value={workScheduleId || 'none'}
                                onValueChange={v => setWorkScheduleId(v === 'none' ? '' : v)}
                                disabled={isPending}
                            >
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="none">Nenhum</SelectItem>
                                    {schedules.map(s => (
                                        <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Color picker */}
                        <div className="flex flex-wrap gap-2">
                            {UNIQUE_COLORS.map(c => (
                                <button
                                    key={c}
                                    type="button"
                                    onClick={() => setColor(c)}
                                    disabled={isPending}
                                    className="size-8 rounded-full flex items-center justify-center transition-transform hover:scale-110 focus:outline-none focus:ring-2 focus:ring-offset-1 focus:ring-ring"
                                    style={{ backgroundColor: c }}
                                >
                                    {color === c && <Check className="size-3.5 text-white" strokeWidth={3} />}
                                </button>
                            ))}
                        </div>

                        <DialogFooter className="pt-1">
                            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending}>
                                {isPending
                                    ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                                    : 'Continuar'
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                )}

                {/* ── Step 2: Members ───────────────────────────────────── */}
                {step === 'members' && (
                    <div className="flex flex-col gap-4 py-1">
                        <div className="flex items-center justify-between">
                            <p className="text-sm font-medium">Lista de atendentes</p>
                            <DropdownMenu>
                                <DropdownMenuTrigger asChild>
                                    <button
                                        type="button"
                                        disabled={addingMember}
                                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 px-2 h-8 rounded hover:bg-blue-50 dark:hover:bg-blue-950/30 transition-colors disabled:opacity-50"
                                    >
                                        {addingMember
                                            ? <Loader2 className="size-3.5 animate-spin" />
                                            : <Plus className="size-3.5" />
                                        }
                                        <span>Adicionar</span>
                                    </button>
                                </DropdownMenuTrigger>
                                <DropdownMenuContent align="end" className="w-52 max-h-60 overflow-y-auto">
                                    {availableToAdd.length === 0 ? (
                                        <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                                            Todos os membros já foram adicionados.
                                        </div>
                                    ) : (
                                        availableToAdd.map(m => (
                                            <DropdownMenuItem
                                                key={m.userId}
                                                onSelect={() => handleAddMember(m.userId)}
                                            >
                                                <Avatar className="size-5 mr-2 shrink-0">
                                                    <AvatarImage src={m.user.image ?? undefined} />
                                                    <AvatarFallback className="text-[10px]">{getInitials(m.user.name)}</AvatarFallback>
                                                </Avatar>
                                                <span className="truncate">{m.user.name}</span>
                                            </DropdownMenuItem>
                                        ))
                                    )}
                                </DropdownMenuContent>
                            </DropdownMenu>
                        </div>

                        <p className="text-xs text-muted-foreground -mt-2">
                            Escolha os atendentes que poderão acessar este departamento.
                        </p>

                        {deptMembers.length === 0 ? (
                            <div className="flex flex-col items-center gap-2 py-10 text-muted-foreground">
                                <UserPlus className="size-10 opacity-30" />
                                <p className="text-sm">Nenhum atendente adicionado.</p>
                            </div>
                        ) : (
                            <div className="flex flex-col gap-1 max-h-52 overflow-y-auto">
                                {deptMembers.map(m => (
                                    <div key={m.id} className="flex items-center gap-2 px-2 py-1.5 rounded hover:bg-muted/50 group">
                                        <Avatar className="size-7 shrink-0">
                                            <AvatarImage src={m.user.image ?? undefined} />
                                            <AvatarFallback className="text-xs">{getInitials(m.user.name)}</AvatarFallback>
                                        </Avatar>
                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{m.user.name}</p>
                                            <p className="text-xs text-muted-foreground truncate">{m.user.email}</p>
                                        </div>
                                        <button
                                            type="button"
                                            onClick={() => handleRemoveMember(m.userId)}
                                            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-all"
                                        >
                                            <X className="size-3.5" />
                                        </button>
                                    </div>
                                ))}
                            </div>
                        )}

                        <DialogFooter className="pt-1">
                            <Button type="button" variant="outline" onClick={() => setStep('info')}>
                                <ChevronLeft className="size-4 mr-1" /> Voltar
                            </Button>
                            <Button onClick={handleConfirm}>Confirmar</Button>
                        </DialogFooter>
                    </div>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DepartmentsSettingsPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

    const [createOpen, setCreateOpen] = useState(false)
    const [editDept, setEditDept] = useState<Department | null>(null)
    const [deleteDept, setDeleteDept] = useState<Department | null>(null)

    const { data: departments = [], isLoading } = useListDepartments(enterprise?.id ?? '', query || undefined)
    const { mutate: remove, isPending: deleting } = useDeleteDepartment()

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(value), 400)
    }

    function confirmDelete() {
        if (!deleteDept || !enterprise) return
        remove({ id: deleteDept.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Departamento excluído.'); setDeleteDept(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Departamentos</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Organize sua equipe com departamentos
                    </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!enterprise}>
                    Criar
                </Button>
            </div>

            {/* ── Search ────────────────────────────────────────────────── */}
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
                    {isLoading ? '...' : `${departments.length} resultado${departments.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            {/* ── Table ─────────────────────────────────────────────────── */}
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="w-10 px-4 py-2.5 text-left">
                                <Checkbox disabled />
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Departamentos</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Atendentes</th>
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

                        {!isLoading && departments.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-16 text-center text-sm text-muted-foreground">
                                    {query
                                        ? 'Nenhum departamento encontrado para essa busca.'
                                        : 'Nenhum departamento criado ainda. Clique em "Criar" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {departments.map(dept => (
                            <tr key={dept.id} className="border-t hover:bg-muted/20 transition-colors">
                                <td className="px-4 py-3"><Checkbox /></td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-3 rounded-full shrink-0"
                                            style={{ backgroundColor: dept.color }}
                                        />
                                        <span className="font-medium">{dept.name}</span>
                                    </div>
                                </td>

                                <td className="px-4 py-3 text-muted-foreground">
                                    {dept._count.members} atendente{dept._count.members !== 1 ? 's' : ''}
                                </td>

                                <td className="px-4 py-3 text-muted-foreground">
                                    {format(new Date(dept.createdAt), 'dd/MM/yyyy', { locale: ptBR })}
                                </td>

                                <td className="px-4 py-3">
                                    <div className="flex items-center justify-end gap-1">
                                        <button
                                            type="button"
                                            onClick={() => setEditDept(dept)}
                                            className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                        >
                                            <Pencil className="size-3.5" />
                                        </button>
                                        <button
                                            type="button"
                                            onClick={() => setDeleteDept(dept)}
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

            {/* ── Dialogs ───────────────────────────────────────────────── */}
            {enterprise && createOpen && (
                <DepartmentDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editDept && (
                <DepartmentDialog
                    open
                    onOpenChange={v => { if (!v) setEditDept(null) }}
                    initial={editDept}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteDept} onOpenChange={v => { if (!v) setDeleteDept(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir departamento?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o departamento{' '}
                            <strong>"{deleteDept?.name}"</strong>?
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
