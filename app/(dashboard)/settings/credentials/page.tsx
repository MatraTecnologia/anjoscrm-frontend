'use client'

import { useEffect, useState } from 'react'
import { toast } from 'sonner'
import {
    Bot, Trash2, KeyRound, Power, Loader2, RefreshCw, Plus,
    CheckCircle2, XCircle, AlertCircle, Eye, EyeOff,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useCredentials, useSaveOpenAI, useSaveKommo, useSaveRDStation,
    useDeleteCredential, useToggleCredential, useRenewCredential, useUpdateCredential,
    type Credential,
} from '@/services/credentials'
import { cn } from '@/lib/utils'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getExpiryInfo(expiresAt?: string | null): { label: string; urgent: boolean } {
    if (!expiresAt) return { label: '', urgent: false }
    const diff = new Date(expiresAt).getTime() - Date.now()
    const days = Math.floor(diff / (1000 * 60 * 60 * 24))
    if (diff < 0) return { label: 'Token expirado', urgent: true }
    if (days === 0) return { label: 'Expira hoje', urgent: true }
    if (days <= 7) return { label: `Expira em ${days} dia${days > 1 ? 's' : ''}`, urgent: true }
    return { label: `Expira em ${days} dias`, urgent: false }
}

type ApiError = { response?: { data?: { error?: string } } }
function getErrMsg(err: unknown, fallback: string) {
    return (err as ApiError)?.response?.data?.error ?? fallback
}

// ─── Badge de status ──────────────────────────────────────────────────────────

function StatusBadge({ credential }: { credential: Credential }) {
    const expired = credential.expiresAt && new Date(credential.expiresAt) < new Date()
    if (expired) return (
        <Badge variant="destructive" className="gap-1 text-xs shrink-0">
            <XCircle className="size-3" /> Expirada
        </Badge>
    )
    if (!credential.isActive) return (
        <Badge variant="secondary" className="gap-1 text-xs shrink-0">
            <AlertCircle className="size-3" /> Inativa
        </Badge>
    )
    return (
        <Badge className="gap-1 text-xs bg-emerald-500/15 text-emerald-600 hover:bg-emerald-500/20 border-0 shrink-0">
            <CheckCircle2 className="size-3" /> Ativa
        </Badge>
    )
}

// ─── Dialog OpenAI ────────────────────────────────────────────────────────────

function OpenAIDialog({
    open, onOpenChange, enterpriseId, existing,
}: {
    open: boolean; onOpenChange: (v: boolean) => void
    enterpriseId: string; existing?: Credential
}) {
    const [name, setName] = useState(existing?.name ?? 'OpenAI')
    const [apiKey, setApiKey] = useState('')
    const [show, setShow] = useState(false)
    const saveNew = useSaveOpenAI()
    const update = useUpdateCredential()
    const isPending = saveNew.isPending || update.isPending

    useEffect(() => {
        if (open) { setName(existing?.name ?? 'OpenAI'); setApiKey(''); setShow(false) }
    }, [open, existing])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (existing) {
            update.mutate({ enterpriseId, id: existing.id, name: name.trim(), apiKey: apiKey.trim() || undefined }, {
                onSuccess: () => { toast.success('Chave atualizada!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao atualizar chave')),
            })
        } else {
            if (!apiKey.trim()) return
            saveNew.mutate({ enterpriseId, name: name.trim(), apiKey: apiKey.trim() }, {
                onSuccess: () => { toast.success('Chave adicionada!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao salvar chave')),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{existing ? 'Editar' : 'Adicionar'} chave OpenAI</DialogTitle>
                    <DialogDescription>
                        Sua chave fica armazenada de forma criptografada e nunca é exibida completa.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Nome</Label>
                        <Input value={name} onChange={e => setName(e.target.value)} placeholder="OpenAI" />
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            API Key
                            {existing && <span className="text-muted-foreground text-xs ml-1">(deixe em branco para manter a atual)</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                type={show ? 'text' : 'password'}
                                value={apiKey}
                                onChange={e => setApiKey(e.target.value)}
                                placeholder={existing?.maskedKey ?? 'sk-...'}
                                className="pr-10"
                                required={!existing}
                            />
                            <button type="button" onClick={() => setShow(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {existing?.maskedKey && (
                            <p className="text-xs text-muted-foreground font-mono">Atual: {existing.maskedKey}</p>
                        )}
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                            {existing ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Dialog Kommo ─────────────────────────────────────────────────────────────

function KommoDialog({
    open, onOpenChange, enterpriseId, existing,
}: {
    open: boolean; onOpenChange: (v: boolean) => void
    enterpriseId: string; existing?: Credential
}) {
    const [name, setName] = useState('')
    const [subdomain, setSubdomain] = useState('')
    const [token, setToken] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [show, setShow] = useState(false)
    const saveNew = useSaveKommo()
    const update = useUpdateCredential()
    const isPending = saveNew.isPending || update.isPending

    useEffect(() => {
        if (open) {
            setName(existing?.name ?? '')
            setSubdomain(existing?.subdomain ?? '')
            setToken('')
            setExpiresAt(existing?.expiresAt ? existing.expiresAt.split('T')[0] : '')
            setShow(false)
        }
    }, [open, existing])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!subdomain.trim()) return
        if (existing) {
            update.mutate({
                enterpriseId,
                id: existing.id,
                name: name.trim() || undefined,
                subdomain: subdomain.trim(),
                accessToken: token.trim() || undefined,
                expiresAt: expiresAt || null,
            }, {
                onSuccess: () => { toast.success('Kommo atualizado!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao atualizar Kommo')),
            })
        } else {
            if (!token.trim()) return
            saveNew.mutate({
                enterpriseId,
                name: name.trim() || undefined,
                subdomain: subdomain.trim(),
                accessToken: token.trim(),
                expiresAt: expiresAt || undefined,
            }, {
                onSuccess: () => { toast.success('Kommo adicionado!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao salvar Kommo')),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{existing ? 'Editar' : 'Adicionar'} conta Kommo</DialogTitle>
                    <DialogDescription>
                        Insira o subdomínio e o token de longa duração da conta Kommo.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Nome da conexão <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Conta Principal, Empresa XYZ..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>Subdomínio da conta</Label>
                        <div className="flex items-center gap-1">
                            <Input
                                value={subdomain}
                                onChange={e => setSubdomain(e.target.value.replace(/\.kommo\.com.*$/, '').replace(/^https?:\/\//, '').split('.')[0])}
                                placeholder="minhaempresa"
                                required
                            />
                            <span className="text-sm text-muted-foreground shrink-0">.kommo.com</span>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            Token de longa duração
                            {existing && <span className="text-muted-foreground text-xs ml-1">(deixe em branco para manter)</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                type={show ? 'text' : 'password'}
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder={existing?.maskedToken ?? 'Cole o token aqui'}
                                className="pr-10"
                                required={!existing}
                            />
                            <button type="button" onClick={() => setShow(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {existing?.maskedToken && (
                            <p className="text-xs text-muted-foreground font-mono">Atual: {existing.maskedToken}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Data de expiração <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            type="date"
                            value={expiresAt}
                            onChange={e => setExpiresAt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se preenchida, a credencial será desativada automaticamente ao expirar.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                            {existing ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Dialog RD Station ────────────────────────────────────────────────────────

function RDStationDialog({
    open, onOpenChange, enterpriseId, existing,
}: {
    open: boolean; onOpenChange: (v: boolean) => void
    enterpriseId: string; existing?: Credential
}) {
    const [name, setName] = useState('')
    const [token, setToken] = useState('')
    const [expiresAt, setExpiresAt] = useState('')
    const [show, setShow] = useState(false)
    const saveNew = useSaveRDStation()
    const update = useUpdateCredential()
    const isPending = saveNew.isPending || update.isPending

    useEffect(() => {
        if (open) {
            setName(existing?.name ?? '')
            setToken('')
            setExpiresAt(existing?.expiresAt ? existing.expiresAt.split('T')[0] : '')
            setShow(false)
        }
    }, [open, existing])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (existing) {
            update.mutate({
                enterpriseId,
                id: existing.id,
                name: name.trim() || undefined,
                accessToken: token.trim() || undefined,
                expiresAt: expiresAt || null,
            }, {
                onSuccess: () => { toast.success('RD Station atualizado!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao atualizar RD Station')),
            })
        } else {
            if (!token.trim()) return
            saveNew.mutate({
                enterpriseId,
                name: name.trim() || undefined,
                accessToken: token.trim(),
                expiresAt: expiresAt || undefined,
            }, {
                onSuccess: () => { toast.success('RD Station adicionado!'); onOpenChange(false) },
                onError: (err) => toast.error(getErrMsg(err, 'Erro ao salvar RD Station')),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>{existing ? 'Editar' : 'Adicionar'} conta RD Station</DialogTitle>
                    <DialogDescription>
                        Insira o token de acesso da conta RD Station.
                    </DialogDescription>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-1.5">
                        <Label>Nome da conexão <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            value={name}
                            onChange={e => setName(e.target.value)}
                            placeholder="Ex: Conta Principal, Empresa XYZ..."
                        />
                    </div>
                    <div className="space-y-1.5">
                        <Label>
                            Access Token
                            {existing && <span className="text-muted-foreground text-xs ml-1">(deixe em branco para manter)</span>}
                        </Label>
                        <div className="relative">
                            <Input
                                type={show ? 'text' : 'password'}
                                value={token}
                                onChange={e => setToken(e.target.value)}
                                placeholder={existing?.maskedToken ?? 'Cole o token aqui'}
                                className="pr-10"
                                required={!existing}
                            />
                            <button type="button" onClick={() => setShow(v => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
                                {show ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                        {existing?.maskedToken && (
                            <p className="text-xs text-muted-foreground font-mono">Atual: {existing.maskedToken}</p>
                        )}
                    </div>
                    <div className="space-y-1.5">
                        <Label>Data de expiração <span className="text-muted-foreground text-xs">(opcional)</span></Label>
                        <Input
                            type="date"
                            value={expiresAt}
                            onChange={e => setExpiresAt(e.target.value)}
                        />
                        <p className="text-xs text-muted-foreground">
                            Se preenchida, a credencial será desativada automaticamente ao expirar.
                        </p>
                    </div>
                    <DialogFooter>
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>Cancelar</Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending && <Loader2 className="size-4 animate-spin mr-2" />}
                            {existing ? 'Salvar' : 'Adicionar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Row de credencial numa lista ─────────────────────────────────────────────

function CredentialRow({
    credential, showRenew, onEdit, onDelete, onToggle, onRenew,
}: {
    credential: Credential
    showRenew?: boolean
    onEdit: () => void
    onDelete: () => void
    onToggle: () => void
    onRenew: () => void
}) {
    const expiry = getExpiryInfo(credential.expiresAt)

    return (
        <div className="rounded-lg border bg-card px-4 py-3 flex flex-col gap-2">
            <div className="flex items-center justify-between gap-3 flex-wrap">
                <div className="flex items-center gap-2 min-w-0">
                    <span className="font-medium text-sm truncate">{credential.name}</span>
                    <StatusBadge credential={credential} />
                </div>
                <div className="flex items-center gap-1 shrink-0">
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onEdit}>
                        <KeyRound className="size-3 mr-1" /> Editar
                    </Button>
                    {showRenew && (
                        <Button size="sm" variant="ghost" className="h-7 px-2 text-xs" onClick={onRenew} title="Marca como renovado">
                            <RefreshCw className="size-3 mr-1" /> Renovar
                        </Button>
                    )}
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-xs text-muted-foreground" onClick={onToggle}>
                        <Power className="size-3 mr-1" />
                        {credential.isActive ? 'Desativar' : 'Ativar'}
                    </Button>
                    <Button size="sm" variant="ghost" className="h-7 px-2 text-destructive hover:text-destructive" onClick={onDelete}>
                        <Trash2 className="size-3" />
                    </Button>
                </div>
            </div>

            <div className="flex flex-wrap gap-x-4 gap-y-0.5 text-xs text-muted-foreground">
                {credential.maskedKey && (
                    <span className="font-mono">Chave: {credential.maskedKey}</span>
                )}
                {credential.maskedToken && (
                    <span className="font-mono">Token: {credential.maskedToken}</span>
                )}
                {credential.subdomain && (
                    <span><span className="font-medium text-foreground">{credential.subdomain}</span>.kommo.com</span>
                )}
                {expiry.label && (
                    <span className={expiry.urgent ? 'text-orange-500 font-medium' : ''}>{expiry.label}</span>
                )}
                {credential.lastRefreshedAt && (
                    <span>Atualizado em {new Date(credential.lastRefreshedAt).toLocaleDateString('pt-BR')}</span>
                )}
            </div>
        </div>
    )
}

// ─── Seção por tipo ───────────────────────────────────────────────────────────

const META = {
    OPENAI: {
        icon: <Bot className="size-4" />,
        label: 'OpenAI / ChatGPT',
        description: 'API key usada pelos agentes de IA (modelos GPT).',
        color: 'text-emerald-600',
        bg: 'bg-emerald-500/10',
    },
    KOMMO: {
        icon: <span className="text-xs font-bold leading-none">K</span>,
        label: 'Kommo (amoCRM)',
        description: 'Token de integração de contas Kommo.',
        color: 'text-blue-600',
        bg: 'bg-blue-500/10',
    },
    RDSTATION: {
        icon: <span className="text-xs font-bold leading-none">RD</span>,
        label: 'RD Station',
        description: 'Token de acesso de contas RD Station.',
        color: 'text-orange-600',
        bg: 'bg-orange-500/10',
    },
} as const

function CredentialSection({
    type, credentials, onAdd, onEdit, onDelete, onToggle, onRenew,
}: {
    type: keyof typeof META
    credentials: Credential[]
    onAdd: () => void
    onEdit: (cred: Credential) => void
    onDelete: (cred: Credential) => void
    onToggle: (cred: Credential) => void
    onRenew: (cred: Credential) => void
}) {
    const meta = META[type]
    const showRenew = type !== 'OPENAI'

    return (
        <div className="space-y-3">
            <div className="flex items-center justify-between gap-3">
                <div className="flex items-center gap-3">
                    <div className={cn('size-8 rounded-md flex items-center justify-center shrink-0', meta.bg, meta.color)}>
                        {meta.icon}
                    </div>
                    <div>
                        <p className="font-medium text-sm">{meta.label}</p>
                        <p className="text-xs text-muted-foreground">{meta.description}</p>
                    </div>
                </div>
                <Button size="sm" variant="outline" onClick={onAdd} className="shrink-0">
                    <Plus className="size-3.5 mr-1.5" />
                    {type === 'OPENAI' && credentials.length > 0 ? 'Editar chave' : 'Adicionar'}
                </Button>
            </div>

            {credentials.length === 0 ? (
                <div className="rounded-lg border border-dashed px-4 py-5 text-center text-sm text-muted-foreground">
                    Nenhuma credencial configurada.{' '}
                    <button type="button" onClick={onAdd} className="underline underline-offset-2 hover:text-foreground">
                        Adicionar agora
                    </button>
                </div>
            ) : (
                <div className="space-y-2">
                    {credentials.map(cred => (
                        <CredentialRow
                            key={cred.id}
                            credential={cred}
                            showRenew={showRenew}
                            onEdit={() => onEdit(cred)}
                            onDelete={() => onDelete(cred)}
                            onToggle={() => onToggle(cred)}
                            onRenew={() => onRenew(cred)}
                        />
                    ))}
                </div>
            )}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type DialogState =
    | { kind: 'openai'; credential?: Credential }
    | { kind: 'kommo'; credential?: Credential }
    | { kind: 'rdstation'; credential?: Credential }
    | null

export default function CredenciaisPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const { data: credentials = [], isLoading } = useCredentials(enterpriseId)
    const deleteMutation = useDeleteCredential()
    const toggleMutation = useToggleCredential()
    const renewMutation = useRenewCredential()

    const [dialog, setDialog] = useState<DialogState>(null)
    const [deleteTarget, setDeleteTarget] = useState<Credential | null>(null)

    const openaiList = credentials.filter(c => c.type === 'OPENAI')
    const kommoList = credentials.filter(c => c.type === 'KOMMO')
    const rdstationList = credentials.filter(c => c.type === 'RDSTATION')

    function handleToggle(cred: Credential) {
        toggleMutation.mutate({ enterpriseId, id: cred.id }, {
            onSuccess: (updated) => toast.success(updated.isActive ? 'Credencial ativada' : 'Credencial desativada'),
            onError: () => toast.error('Erro ao alterar status'),
        })
    }

    function handleRenew(cred: Credential) {
        renewMutation.mutate({ enterpriseId, id: cred.id }, {
            onSuccess: () => toast.success('Marcado como renovado!'),
            onError: () => toast.error('Erro ao renovar'),
        })
    }

    function handleDelete() {
        if (!deleteTarget) return
        deleteMutation.mutate({ enterpriseId, id: deleteTarget.id }, {
            onSuccess: () => { toast.success('Credencial removida'); setDeleteTarget(null) },
            onError: () => toast.error('Erro ao remover'),
        })
    }

    return (
        <div className="p-6 max-w-2xl space-y-8">
            <div>
                <h1 className="text-xl font-semibold">Credenciais</h1>
                <p className="text-sm text-muted-foreground mt-1">
                    Chaves de API e tokens de integração. Armazenados de forma criptografada.
                </p>
            </div>

            {isLoading ? (
                <div className="flex items-center gap-2 text-muted-foreground text-sm py-8">
                    <Loader2 className="size-4 animate-spin" /> Carregando...
                </div>
            ) : (
                <div className="flex flex-col gap-8">
                    <CredentialSection
                        type="OPENAI"
                        credentials={openaiList}
                        onAdd={() => setDialog({ kind: 'openai', credential: openaiList[0] })}
                        onEdit={cred => setDialog({ kind: 'openai', credential: cred })}
                        onDelete={cred => setDeleteTarget(cred)}
                        onToggle={handleToggle}
                        onRenew={handleRenew}
                    />

                    <div className="border-t" />

                    <CredentialSection
                        type="KOMMO"
                        credentials={kommoList}
                        onAdd={() => setDialog({ kind: 'kommo' })}
                        onEdit={cred => setDialog({ kind: 'kommo', credential: cred })}
                        onDelete={cred => setDeleteTarget(cred)}
                        onToggle={handleToggle}
                        onRenew={handleRenew}
                    />

                    <div className="border-t" />

                    <CredentialSection
                        type="RDSTATION"
                        credentials={rdstationList}
                        onAdd={() => setDialog({ kind: 'rdstation' })}
                        onEdit={cred => setDialog({ kind: 'rdstation', credential: cred })}
                        onDelete={cred => setDeleteTarget(cred)}
                        onToggle={handleToggle}
                        onRenew={handleRenew}
                    />
                </div>
            )}

            {/* Dialogs */}
            <OpenAIDialog
                open={dialog?.kind === 'openai'}
                onOpenChange={open => setDialog(open ? { kind: 'openai', credential: dialog?.kind === 'openai' ? dialog.credential : undefined } : null)}
                enterpriseId={enterpriseId}
                existing={dialog?.kind === 'openai' ? dialog.credential : undefined}
            />
            <KommoDialog
                open={dialog?.kind === 'kommo'}
                onOpenChange={open => setDialog(open ? { kind: 'kommo', credential: dialog?.kind === 'kommo' ? dialog.credential : undefined } : null)}
                enterpriseId={enterpriseId}
                existing={dialog?.kind === 'kommo' ? dialog.credential : undefined}
            />
            <RDStationDialog
                open={dialog?.kind === 'rdstation'}
                onOpenChange={open => setDialog(open ? { kind: 'rdstation', credential: dialog?.kind === 'rdstation' ? dialog.credential : undefined } : null)}
                enterpriseId={enterpriseId}
                existing={dialog?.kind === 'rdstation' ? dialog.credential : undefined}
            />

            {/* Confirmação de exclusão */}
            <AlertDialog open={!!deleteTarget} onOpenChange={open => !open && setDeleteTarget(null)}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover credencial</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleteMutation.isPending
                                ? <><Loader2 className="size-4 animate-spin mr-2" /> Removendo...</>
                                : 'Remover'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
