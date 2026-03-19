'use client'

import { useState } from 'react'
import { toast } from 'sonner'
import {
    Loader2,
    UserPlus,
    Trash2,
    Shield,
    ShieldCheck,
    Link2,
    Check,
    Plus,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from '@/components/ui/dialog'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import { useSession } from '@/services/auth'
import {
    useMembers,
    useRoles,
    useCreateRole,
    useDeleteRole,
    useCreateInvite,
    useRemoveMember,
    useUpdateMemberRole,
    type EnterpriseMember,
    type EnterpriseRole,
} from '@/services/enterprises'

// ─── Permissões ────────────────────────────────────────────────────────────────

const PERMISSION_GROUPS = [
    {
        label: 'Empresa',
        perms: ['enterprise:read', 'enterprise:update', 'enterprise:delete'],
    },
    {
        label: 'Membros',
        perms: ['members:read', 'members:invite', 'members:remove', 'members:update'],
    },
    {
        label: 'Cargos',
        perms: ['roles:read', 'roles:create', 'roles:update', 'roles:delete'],
    },
    {
        label: 'Leads',
        perms: ['leads:read', 'leads:create', 'leads:update', 'leads:delete'],
    },
    {
        label: 'Funis',
        perms: ['pipelines:read', 'pipelines:create', 'pipelines:update', 'pipelines:delete'],
    },
    {
        label: 'Negócios',
        perms: ['deals:read', 'deals:create', 'deals:update', 'deals:delete'],
    },
    {
        label: 'Conexões',
        perms: ['connections:read', 'connections:create', 'connections:update', 'connections:delete'],
    },
    {
        label: 'Chat',
        perms: ['chat:read', 'chat:send'],
    },
    {
        label: 'Automações',
        perms: ['automations:read', 'automations:create', 'automations:update', 'automations:delete'],
    },
]

const PERM_LABELS: Record<string, string> = {
    'enterprise:read': 'Visualizar',
    'enterprise:update': 'Editar',
    'enterprise:delete': 'Excluir',
    'members:read': 'Visualizar',
    'members:invite': 'Convidar',
    'members:remove': 'Remover',
    'members:update': 'Editar cargos',
    'roles:read': 'Visualizar',
    'roles:create': 'Criar',
    'roles:update': 'Editar',
    'roles:delete': 'Excluir',
    'leads:read': 'Visualizar',
    'leads:create': 'Criar',
    'leads:update': 'Editar',
    'leads:delete': 'Excluir',
    'pipelines:read': 'Visualizar',
    'pipelines:create': 'Criar',
    'pipelines:update': 'Editar',
    'pipelines:delete': 'Excluir',
    'deals:read': 'Visualizar',
    'deals:create': 'Criar',
    'deals:update': 'Editar',
    'deals:delete': 'Excluir',
    'connections:read': 'Visualizar',
    'connections:create': 'Criar',
    'connections:update': 'Editar',
    'connections:delete': 'Excluir',
    'chat:read': 'Visualizar',
    'chat:send': 'Enviar',
    'automations:read': 'Visualizar',
    'automations:create': 'Criar',
    'automations:update': 'Editar',
    'automations:delete': 'Excluir',
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function initials(name: string) {
    return name
        .split(' ')
        .map(w => w[0])
        .slice(0, 2)
        .join('')
        .toUpperCase()
}

function formatDate(iso: string) {
    return new Date(iso).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, action, children }: {
    title: string
    description?: string
    action?: React.ReactNode
    children: React.ReactNode
}) {
    return (
        <div className="rounded-lg border bg-card flex flex-col gap-0">
            <div className="flex items-center justify-between px-6 py-4 border-b">
                <div>
                    <h2 className="text-sm font-semibold">{title}</h2>
                    {description && (
                        <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                    )}
                </div>
                {action}
            </div>
            <div className="p-6">{children}</div>
        </div>
    )
}

// ─── Invite Dialog ─────────────────────────────────────────────────────────────

function InviteDialog({
    open,
    onClose,
    enterpriseId,
    roles,
}: {
    open: boolean
    onClose: () => void
    enterpriseId: string
    roles: EnterpriseRole[]
}) {
    const [email, setEmail] = useState('')
    const [roleId, setRoleId] = useState('')
    const [inviteUrl, setInviteUrl] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const { mutate: invite, isPending } = useCreateInvite()

    function handleClose() {
        setEmail('')
        setRoleId('')
        setInviteUrl(null)
        setCopied(false)
        onClose()
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!roleId) return
        invite(
            { enterpriseId, payload: { email: email.trim() || null, roleId } },
            {
                onSuccess: (data) => {
                    if (data.email) {
                        toast.success('Convite enviado por e-mail!')
                        handleClose()
                    } else {
                        setInviteUrl(data.inviteUrl)
                    }
                },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    function handleCopy() {
        if (!inviteUrl) return
        navigator.clipboard.writeText(inviteUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Convidar atendente</DialogTitle>
                    <DialogDescription>
                        Envie um convite por e-mail ou gere um link de convite para compartilhar.
                    </DialogDescription>
                </DialogHeader>

                {inviteUrl ? (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground">
                            Convite gerado! Compartilhe o link abaixo com o atendente.
                            O link expira em 7 dias.
                        </p>
                        <div className="flex items-center gap-2">
                            <Input value={inviteUrl} readOnly className="text-xs" />
                            <Button type="button" size="sm" variant="outline" onClick={handleCopy} className="shrink-0">
                                {copied ? <Check className="size-4" /> : <Link2 className="size-4" />}
                            </Button>
                        </div>
                        <DialogFooter>
                            <Button type="button" onClick={handleClose}>Fechar</Button>
                        </DialogFooter>
                    </div>
                ) : (
                    <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="inv-email">E-mail (opcional)</Label>
                            <Input
                                id="inv-email"
                                type="email"
                                placeholder="atendente@empresa.com"
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={isPending}
                            />
                            <p className="text-xs text-muted-foreground">
                                Deixe em branco para gerar um link de convite genérico.
                            </p>
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Cargo</Label>
                            <Select value={roleId} onValueChange={setRoleId} disabled={isPending}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Selecionar cargo..." />
                                </SelectTrigger>
                                <SelectContent>
                                    {roles.map(r => (
                                        <SelectItem key={r.id} value={r.id}>{r.name}</SelectItem>
                                    ))}
                                </SelectContent>
                            </Select>
                        </div>

                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                                Cancelar
                            </Button>
                            <Button type="submit" disabled={isPending || !roleId}>
                                {isPending
                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                    : email.trim()
                                        ? 'Enviar convite'
                                        : 'Gerar link'
                                }
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Create Role Dialog ────────────────────────────────────────────────────────

function CreateRoleDialog({
    open,
    onClose,
    enterpriseId,
}: {
    open: boolean
    onClose: () => void
    enterpriseId: string
}) {
    const [name, setName] = useState('')
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const { mutate: createRole, isPending } = useCreateRole()

    function handleClose() {
        setName('')
        setSelected(new Set())
        onClose()
    }

    function toggle(perm: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(perm) ? next.delete(perm) : next.add(perm)
            return next
        })
    }

    function toggleGroup(perms: string[]) {
        const allOn = perms.every(p => selected.has(p))
        setSelected(prev => {
            const next = new Set(prev)
            if (allOn) {
                perms.forEach(p => next.delete(p))
            } else {
                perms.forEach(p => next.add(p))
            }
            return next
        })
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim() || selected.size === 0) return
        createRole(
            { enterpriseId, payload: { name: name.trim(), permissions: [...selected] } },
            {
                onSuccess: () => {
                    toast.success('Cargo criado!')
                    handleClose()
                },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) handleClose() }}>
            <DialogContent className="max-w-lg max-h-[90vh] flex flex-col">
                <DialogHeader>
                    <DialogTitle>Novo cargo</DialogTitle>
                    <DialogDescription>
                        Defina o nome e as permissões do cargo personalizado.
                    </DialogDescription>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-4 flex-1 min-h-0">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="role-name">Nome do cargo</Label>
                        <Input
                            id="role-name"
                            placeholder="Ex: Supervisor, Coordenador..."
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                        />
                    </div>

                    <div className="flex flex-col gap-3 overflow-y-auto flex-1 pr-1">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Permissões</p>
                        {PERMISSION_GROUPS.map(group => {
                            const allOn = group.perms.every(p => selected.has(p))
                            const someOn = group.perms.some(p => selected.has(p))
                            return (
                                <div key={group.label} className="rounded-md border p-3 flex flex-col gap-2">
                                    <div
                                        className="flex items-center gap-2 cursor-pointer"
                                        onClick={() => toggleGroup(group.perms)}
                                    >
                                        <Checkbox
                                            checked={someOn && !allOn ? 'indeterminate' : allOn}
                                            onCheckedChange={() => toggleGroup(group.perms)}
                                        />
                                        <span className="text-sm font-medium">{group.label}</span>
                                    </div>
                                    <div className="ml-6 flex flex-wrap gap-x-4 gap-y-1.5">
                                        {group.perms.map(perm => (
                                            <label
                                                key={perm}
                                                className="flex items-center gap-1.5 cursor-pointer"
                                            >
                                                <Checkbox
                                                    checked={selected.has(perm)}
                                                    onCheckedChange={() => toggle(perm)}
                                                    disabled={isPending}
                                                />
                                                <span className="text-xs text-muted-foreground">
                                                    {PERM_LABELS[perm] ?? perm}
                                                </span>
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )
                        })}
                    </div>

                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={handleClose} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending || !name.trim() || selected.size === 0}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" /> Criando...</>
                                : 'Criar cargo'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Members Section ───────────────────────────────────────────────────────────

function MembersSection({
    enterpriseId,
    roles,
    currentUserId,
}: {
    enterpriseId: string
    roles: EnterpriseRole[]
    currentUserId: string
}) {
    const { data: members = [], isLoading } = useMembers(enterpriseId)
    const { mutate: updateRole } = useUpdateMemberRole()
    const { mutate: removeMember, isPending: isRemoving } = useRemoveMember()
    const [removeTarget, setRemoveTarget] = useState<EnterpriseMember | null>(null)

    function handleRoleChange(member: EnterpriseMember, roleId: string) {
        updateRole(
            { enterpriseId, memberId: member.id, roleId },
            {
                onSuccess: () => toast.success('Cargo atualizado!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    function handleRemoveConfirm() {
        if (!removeTarget) return
        removeMember(
            { enterpriseId, memberId: removeTarget.id },
            {
                onSuccess: () => {
                    toast.success('Membro removido.')
                    setRemoveTarget(null)
                },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    if (isLoading) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (members.length === 0) {
        return (
            <p className="text-sm text-muted-foreground text-center py-8">
                Nenhum membro encontrado.
            </p>
        )
    }

    return (
        <>
            <div className="flex flex-col divide-y">
                {members.map(member => {
                    const isMe = member.userId === currentUserId
                    return (
                        <div key={member.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                            {/* Avatar */}
                            <div className="size-9 rounded-full bg-primary/10 text-primary flex items-center justify-center text-xs font-semibold shrink-0 overflow-hidden">
                                {member.user.image
                                    ? <img src={member.user.image} alt={member.user.name} className="size-full object-cover" />
                                    : initials(member.user.name)
                                }
                            </div>

                            {/* Info */}
                            <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                    <p className="text-sm font-medium truncate">{member.user.name}</p>
                                    {isMe && (
                                        <Badge variant="secondary" className="text-xs py-0">Você</Badge>
                                    )}
                                </div>
                                <p className="text-xs text-muted-foreground truncate">{member.user.email}</p>
                            </div>

                            {/* Joined date */}
                            <p className="text-xs text-muted-foreground shrink-0 hidden sm:block">
                                {formatDate(member.createdAt)}
                            </p>

                            {/* Role select */}
                            <div className="w-36 shrink-0">
                                <Select
                                    value={member.roleId}
                                    onValueChange={v => handleRoleChange(member, v)}
                                    disabled={isMe}
                                >
                                    <SelectTrigger className="h-8 text-xs">
                                        <SelectValue />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {roles.map(r => (
                                            <SelectItem key={r.id} value={r.id} className="text-xs">
                                                {r.name}
                                            </SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                            </div>

                            {/* Remove */}
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                disabled={isMe || isRemoving}
                                onClick={() => setRemoveTarget(member)}
                                title="Remover membro"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        </div>
                    )
                })}
            </div>

            <AlertDialog open={!!removeTarget} onOpenChange={v => { if (!v) setRemoveTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover membro?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{removeTarget?.user.name}</strong> perderá o acesso à empresa imediatamente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleRemoveConfirm}
                            disabled={isRemoving}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isRemoving ? <Loader2 className="size-4 animate-spin" /> : 'Remover'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Roles Section ─────────────────────────────────────────────────────────────

function RolesSection({
    enterpriseId,
    roles,
    isLoadingRoles,
}: {
    enterpriseId: string
    roles: EnterpriseRole[]
    isLoadingRoles: boolean
}) {
    const { mutate: deleteRole, isPending: isDeleting } = useDeleteRole()
    const [deleteTarget, setDeleteTarget] = useState<EnterpriseRole | null>(null)

    function handleDeleteConfirm() {
        if (!deleteTarget) return
        deleteRole(
            { enterpriseId, roleId: deleteTarget.id },
            {
                onSuccess: () => {
                    toast.success('Cargo removido.')
                    setDeleteTarget(null)
                },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    if (isLoadingRoles) {
        return (
            <div className="flex items-center justify-center py-10">
                <Loader2 className="size-5 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <>
            <div className="flex flex-col divide-y">
                {roles.map(role => (
                    <div key={role.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0">
                        {/* Icon */}
                        <div className="size-9 rounded-lg border bg-muted flex items-center justify-center shrink-0">
                            {role.isSystem
                                ? <ShieldCheck className="size-4 text-primary" />
                                : <Shield className="size-4 text-muted-foreground" />
                            }
                        </div>

                        {/* Info */}
                        <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                                <p className="text-sm font-medium">{role.name}</p>
                                {role.isSystem && (
                                    <Badge variant="outline" className="text-xs py-0">Padrão</Badge>
                                )}
                            </div>
                            <p className="text-xs text-muted-foreground">
                                {role._count.members} membro{role._count.members !== 1 ? 's' : ''} · {role.permissions.length} permiss{role.permissions.length !== 1 ? 'ões' : 'ão'}
                            </p>
                        </div>

                        {/* Delete (custom only) */}
                        {!role.isSystem && (
                            <Button
                                type="button"
                                variant="ghost"
                                size="icon"
                                className="size-8 text-muted-foreground hover:text-destructive shrink-0"
                                disabled={isDeleting}
                                onClick={() => setDeleteTarget(role)}
                                title="Remover cargo"
                            >
                                <Trash2 className="size-4" />
                            </Button>
                        )}
                    </div>
                ))}
            </div>

            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover cargo?</AlertDialogTitle>
                        <AlertDialogDescription>
                            O cargo <strong>{deleteTarget?.name}</strong> será removido.
                            {(deleteTarget?._count.members ?? 0) > 0 && (
                                <> Ele possui <strong>{deleteTarget?._count.members} membro{deleteTarget?._count.members !== 1 ? 's' : ''}</strong> — estes membros perderão o cargo.</>
                            )}
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDeleteConfirm}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Remover cargo'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function AtendentesPage() {
    const { enterprise } = useEnterprise()
    const { data: session } = useSession()
    const { data: roles = [], isLoading: isLoadingRoles } = useRoles(enterprise?.id ?? '')
    const [inviteOpen, setInviteOpen] = useState(false)
    const [createRoleOpen, setCreateRoleOpen] = useState(false)

    const currentUserId = session?.user.id ?? ''

    if (!enterprise) {
        return (
            <div className="flex items-center justify-center flex-1 py-20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-3xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-semibold">Atendentes</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Gerencie quem tem acesso à sua empresa
                </p>
            </div>

            {/* Membros */}
            <Section
                title="Membros"
                description="Pessoas com acesso à empresa"
                action={
                    <Button size="sm" onClick={() => setInviteOpen(true)}>
                        <UserPlus className="size-4" />
                        Convidar
                    </Button>
                }
            >
                <MembersSection
                    enterpriseId={enterprise.id}
                    roles={roles}
                    currentUserId={currentUserId}
                />
            </Section>

            {/* Cargos */}
            <Section
                title="Cargos"
                description="Defina os níveis de acesso dos atendentes"
                action={
                    <Button size="sm" variant="outline" onClick={() => setCreateRoleOpen(true)}>
                        <Plus className="size-4" />
                        Novo cargo
                    </Button>
                }
            >
                <RolesSection
                    enterpriseId={enterprise.id}
                    roles={roles}
                    isLoadingRoles={isLoadingRoles}
                />
            </Section>

            {/* Dialogs */}
            <InviteDialog
                open={inviteOpen}
                onClose={() => setInviteOpen(false)}
                enterpriseId={enterprise.id}
                roles={roles}
            />
            <CreateRoleDialog
                open={createRoleOpen}
                onClose={() => setCreateRoleOpen(false)}
                enterpriseId={enterprise.id}
            />
        </div>
    )
}
