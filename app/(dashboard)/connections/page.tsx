'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
    Plus, Globe, Trash2, WifiOff, QrCode, RefreshCw, Loader2,
    Check, Wifi, Webhook, Phone,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useConnections, useCreateConnection, useDeleteConnection,
    useConnectionQr, useConnectionStatus, useDisconnect, useConfigureWebhook,
    type Connection, type ConnectionType,
} from '@/services/connections'
import { cn } from '@/lib/utils'

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
            <path d="M16 3C9.37 3 4 8.37 4 15c0 2.55.8 4.92 2.16 6.88L4 29l7.31-2.13A11.93 11.93 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 2c5.52 0 10 4.48 10 10s-4.48 10-10 10a9.94 9.94 0 0 1-5.04-1.36l-.36-.22-4.33 1.27 1.27-4.22-.24-.38A9.94 9.94 0 0 1 6 15c0-5.52 4.48-10 10-10zm-2.5 5.5c-.28 0-.73.1-1.11.52-.38.42-1.45 1.42-1.45 3.46s1.49 4.01 1.7 4.29c.21.28 2.9 4.64 7.14 6.3.99.4 1.77.64 2.37.82.99.3 1.9.26 2.62.16.8-.12 2.47-1.01 2.82-1.99.35-.98.35-1.82.25-1.99-.1-.17-.38-.28-.8-.49-.42-.21-2.47-1.22-2.85-1.36-.38-.14-.66-.21-.94.21-.28.42-1.08 1.36-1.32 1.64-.24.28-.49.32-.91.1-.42-.21-1.77-.65-3.37-2.08-1.25-1.11-2.09-2.48-2.33-2.9-.24-.42-.03-.65.18-.86.19-.19.42-.49.63-.74.21-.25.28-.42.42-.7.14-.28.07-.52-.04-.73-.11-.21-.94-2.27-1.29-3.1-.34-.81-.69-.7-.94-.71l-.8-.01z" />
        </svg>
    )
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status }: { status: Connection['status'] }) {
    if (status === 'CONNECTED') {
        return (
            <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 text-xs">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Conectado
            </Badge>
        )
    }
    if (status === 'ERROR') {
        return <Badge variant="destructive" className="text-xs">Erro</Badge>
    }
    return (
        <Badge variant="secondary" className="text-xs">
            Desconectado
        </Badge>
    )
}

// ─── QR Code dialog ───────────────────────────────────────────────────────────

function QrDialog({
    connection,
    enterpriseId,
    open,
    onClose,
}: {
    connection: Connection
    enterpriseId: string
    open: boolean
    onClose: () => void
}) {
    const [connected, setConnected] = useState(false)

    const { data: qrData, isLoading: qrLoading, refetch: refetchQr, isError: qrError } =
        useConnectionQr(connection.id, enterpriseId, open && !connected)

    const { data: statusData } = useConnectionStatus(connection.id, enterpriseId, open && !connected)

    useEffect(() => {
        if (statusData?.status === 'CONNECTED') {
            setConnected(true)
            toast.success(`${connection.name} conectado com sucesso!`)
            const t = setTimeout(onClose, 1800)
            return () => clearTimeout(t)
        }
    }, [statusData?.status])

    useEffect(() => {
        if (!open) setConnected(false)
    }, [open])

    const qrSrc = qrData?.qr
        ? qrData.qr.startsWith('data:') ? qrData.qr : `data:image/png;base64,${qrData.qr}`
        : null

    return (
        <Dialog open={open} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-sm">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <WhatsAppIcon className="size-5 text-green-500" />
                        Conectar WhatsApp
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col items-center gap-4 py-2">
                    {connected ? (
                        <div className="flex size-52 flex-col items-center justify-center gap-3 rounded-lg bg-green-500/10">
                            <div className="flex size-14 items-center justify-center rounded-full bg-green-500/20">
                                <Check className="size-7 text-green-600" />
                            </div>
                            <p className="text-sm font-medium text-green-600">WhatsApp conectado!</p>
                        </div>
                    ) : qrLoading ? (
                        <div className="flex size-52 flex-col items-center justify-center gap-3 rounded-lg bg-muted">
                            <RefreshCw className="size-6 animate-spin text-muted-foreground" />
                            <p className="text-xs text-muted-foreground">Gerando QR Code...</p>
                        </div>
                    ) : qrError || !qrSrc ? (
                        <div className="flex size-52 flex-col items-center justify-center gap-3 rounded-lg bg-muted text-muted-foreground">
                            <QrCode className="size-8" />
                            <p className="text-xs text-center px-4">
                                Não foi possível carregar o QR Code. Verifique a URL e a API Key do Uazap.
                            </p>
                        </div>
                    ) : (
                        <div className="relative">
                            <img
                                src={qrSrc}
                                alt="QR Code WhatsApp"
                                className="size-52 rounded-lg"
                            />
                            <p className="absolute -bottom-1 left-0 right-0 text-center text-[10px] text-muted-foreground">
                                Expira em ~30s
                            </p>
                        </div>
                    )}

                    {!connected && (
                        <p className="text-sm text-muted-foreground text-center leading-relaxed">
                            Abra o WhatsApp no celular → <strong>Aparelhos conectados</strong> → Escanear QR Code
                        </p>
                    )}
                </div>

                {!connected && (
                    <DialogFooter className="gap-2 sm:gap-0">
                        <Button variant="outline" size="sm" onClick={() => refetchQr()}>
                            <RefreshCw className="size-3.5 mr-1.5" />
                            Novo QR
                        </Button>
                        <Button variant="ghost" size="sm" onClick={onClose}>Fechar</Button>
                    </DialogFooter>
                )}
            </DialogContent>
        </Dialog>
    )
}

// ─── Create dialog ────────────────────────────────────────────────────────────

const TYPE_OPTIONS: { value: ConnectionType; label: string; available: boolean }[] = [
    { value: 'WHATSAPP', label: 'WhatsApp', available: true },
    { value: 'VOIP', label: 'VoIP / Telefone', available: true },
    { value: 'INSTAGRAM', label: 'Instagram', available: false },
    { value: 'TELEGRAM', label: 'Telegram', available: false },
    { value: 'WEBHOOK', label: 'Webhook', available: false },
    { value: 'API', label: 'API', available: false },
]

function CreateDialog({
    enterpriseId,
    open,
    onClose,
}: {
    enterpriseId: string
    open: boolean
    onClose: () => void
}) {
    const [type, setType] = useState<ConnectionType>('WHATSAPP')
    const [name, setName] = useState('')
    const [baseUrl, setBaseUrl] = useState('')
    const [adminToken, setAdminToken] = useState('')
    const [accountSid, setAccountSid] = useState('')
    const [authToken, setAuthToken] = useState('')
    const [twilioNumber, setTwilioNumber] = useState('')

    const { mutate: create, isPending } = useCreateConnection()

    function reset() {
        setName('')
        setBaseUrl('')
        setAdminToken('')
        setAccountSid('')
        setAuthToken('')
        setTwilioNumber('')
        setType('WHATSAPP')
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        create({
            enterpriseId,
            payload: {
                name: name.trim(),
                type,
                ...(type === 'WHATSAPP' ? { baseUrl: baseUrl.trim(), adminToken: adminToken.trim() } : {}),
                ...(type === 'VOIP' ? { accountSid: accountSid.trim(), authToken: authToken.trim(), twilioNumber: twilioNumber.trim() } : {}),
            },
        }, {
            onSuccess: () => {
                toast.success('Conexão criada!')
                reset()
                onClose()
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    const canSubmit = name.trim()
        && (type !== 'WHATSAPP' || (baseUrl.trim() && adminToken.trim()))
        && (type !== 'VOIP' || (accountSid.trim() && authToken.trim() && twilioNumber.trim()))

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Nova Conexão</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleCreate} className="flex flex-col gap-4 py-1">
                    {/* Tipo */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Tipo</Label>
                        <div className="flex gap-2 flex-wrap">
                            {TYPE_OPTIONS.map(({ value, label, available }) => (
                                <button
                                    key={value}
                                    type="button"
                                    disabled={!available}
                                    onClick={() => setType(value)}
                                    className={cn(
                                        'rounded border px-3 py-1.5 text-xs font-medium transition-colors',
                                        type === value && available
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : available
                                                ? 'border-border hover:bg-muted'
                                                : 'border-border text-muted-foreground/50 cursor-not-allowed',
                                    )}
                                >
                                    {label}
                                    {!available && (
                                        <span className="ml-1 text-[10px] opacity-60">em breve</span>
                                    )}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Nome */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="conn-name">Nome *</Label>
                        <Input
                            id="conn-name"
                            placeholder="Ex: WhatsApp Comercial"
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            autoFocus
                            required
                        />
                    </div>

                    {/* Campos específicos do WhatsApp */}
                    {type === 'WHATSAPP' && (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="conn-baseurl">URL do Uazap *</Label>
                                <Input
                                    id="conn-baseurl"
                                    placeholder="https://api.seuuazap.com"
                                    value={baseUrl}
                                    onChange={e => setBaseUrl(e.target.value)}
                                    disabled={isPending}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    URL base do seu servidor Uazap (Evolution API)
                                </p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="conn-admintoken">Admin Token *</Label>
                                <Input
                                    id="conn-admintoken"
                                    type="password"
                                    placeholder="••••••••••••••••"
                                    value={adminToken}
                                    onChange={e => setAdminToken(e.target.value)}
                                    disabled={isPending}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Token de administrador do seu servidor uazapiGO
                                </p>
                            </div>
                        </>
                    )}

                    {/* Campos específicos do VoIP (Twilio) */}
                    {type === 'VOIP' && (
                        <>
                            <div className="rounded-lg bg-muted/50 border px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                                Acesse <strong>console.twilio.com</strong> → copie o <strong>Account SID</strong> e <strong>Auth Token</strong> da dashboard principal.
                                O número deve estar no formato <strong>+5511...</strong>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="conn-sid">Account SID *</Label>
                                <Input
                                    id="conn-sid"
                                    placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
                                    value={accountSid}
                                    onChange={e => setAccountSid(e.target.value)}
                                    disabled={isPending}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="conn-authtoken">Auth Token *</Label>
                                <Input
                                    id="conn-authtoken"
                                    type="password"
                                    placeholder="••••••••••••••••••••••••••••••••"
                                    value={authToken}
                                    onChange={e => setAuthToken(e.target.value)}
                                    disabled={isPending}
                                    required
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="conn-twilio-number">Número Twilio *</Label>
                                <Input
                                    id="conn-twilio-number"
                                    placeholder="+5511999998888"
                                    value={twilioNumber}
                                    onChange={e => setTwilioNumber(e.target.value)}
                                    disabled={isPending}
                                    required
                                />
                                <p className="text-xs text-muted-foreground">
                                    Número comprado no Twilio, com código do país (+55 para Brasil)
                                </p>
                            </div>
                        </>
                    )}

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={!canSubmit || isPending}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin mr-1.5" /> Criando...</>
                                : 'Criar conexão'
                            }
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Connection card ──────────────────────────────────────────────────────────

function ConnectionCard({
    connection,
    enterpriseId,
    onDelete,
}: {
    connection: Connection
    enterpriseId: string
    onDelete: (c: Connection) => void
}) {
    const [showQr, setShowQr] = useState(false)

    const { mutate: disconnect, isPending: disconnecting } = useDisconnect()
    const { mutate: configWebhook, isPending: configuringWebhook } = useConfigureWebhook()

    function handleDisconnect() {
        disconnect({ id: connection.id, enterpriseId }, {
            onSuccess: () => toast.success(`${connection.name} desconectado.`),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleConfigureWebhook() {
        configWebhook({ id: connection.id, enterpriseId }, {
            onSuccess: () => toast.success('Webhook configurado com sucesso!'),
            onError: (err: unknown) => {
                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                toast.error(msg ?? 'Erro ao configurar webhook.')
            },
        })
    }

    const isWhatsApp = connection.type === 'WHATSAPP'
    const isVoip = connection.type === 'VOIP'
    const isConnected = connection.status === 'CONNECTED'

    return (
        <>
            <div className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/20 transition-colors">
                {/* Ícone */}
                <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isWhatsApp ? 'bg-green-500/10 text-green-500'
                    : isVoip ? 'bg-blue-500/10 text-blue-500'
                    : 'bg-muted text-muted-foreground',
                )}>
                    {isWhatsApp ? <WhatsAppIcon className="size-5" />
                    : isVoip ? <Phone className="size-5" />
                    : <Globe className="size-5" />}
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{connection.name}</p>
                        <StatusBadge status={connection.status} />
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        {connection.type}
                        {connection.phoneNumber && ` · ${connection.phoneNumber}`}
                    </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {isWhatsApp && !isConnected && (
                        <Button size="sm" variant="outline" onClick={() => setShowQr(true)} className="h-7 text-xs gap-1.5">
                            <QrCode className="size-3.5" />
                            Conectar
                        </Button>
                    )}

                    {isWhatsApp && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleConfigureWebhook}
                            disabled={configuringWebhook}
                            className="h-7 text-xs gap-1.5"
                            title="Registrar/atualizar webhook na uazapiGO"
                        >
                            {configuringWebhook
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Webhook className="size-3.5" />
                            }
                            Webhook
                        </Button>
                    )}

                    {isConnected && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleDisconnect}
                            disabled={disconnecting}
                            className="h-7 text-xs gap-1.5"
                        >
                            {disconnecting
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <WifiOff className="size-3.5" />
                            }
                            Desconectar
                        </Button>
                    )}

                    <Button
                        size="icon"
                        variant="ghost"
                        className="size-7 text-muted-foreground hover:text-destructive"
                        onClick={() => onDelete(connection)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {showQr && (
                <QrDialog
                    connection={connection}
                    enterpriseId={enterpriseId}
                    open={showQr}
                    onClose={() => setShowQr(false)}
                />
            )}
        </>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [showCreate, setShowCreate] = useState(false)
    const [deleteTarget, setDeleteTarget] = useState<Connection | null>(null)

    const { data: connections = [], isLoading } = useConnections(enterpriseId)
    const { mutate: remove, isPending: deleting } = useDeleteConnection()

    function confirmDelete() {
        if (!deleteTarget) return
        remove({ id: deleteTarget.id, enterpriseId }, {
            onSuccess: () => { toast.success('Conexão removida.'); setDeleteTarget(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div>
                    <h1 className="text-xl font-semibold">Conexões</h1>
                    <p className="text-sm text-muted-foreground">
                        Gerencie seus canais de atendimento e integrações
                    </p>
                </div>
                <Button onClick={() => setShowCreate(true)} className="gap-1.5">
                    <Plus className="size-4" />
                    Nova conexão
                </Button>
            </div>

            {/* ── Contador ───────────────────────────────────────────────── */}
            {!isLoading && connections.length > 0 && (
                <div className="flex items-center gap-4 px-6 py-3 border-b shrink-0">
                    <span className="text-sm text-muted-foreground">
                        {connections.length} de {enterprise?.maxConnections ?? '—'} conexões usadas
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <Wifi className="size-3.5" />
                            {connections.filter(c => c.status === 'CONNECTED').length} ativas
                        </span>
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                            <WifiOff className="size-3.5" />
                            {connections.filter(c => c.status !== 'CONNECTED').length} inativas
                        </span>
                    </div>
                </div>
            )}

            {/* ── Content ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : connections.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 gap-4 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                            <Globe className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Nenhuma conexão ainda</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Conecte seu WhatsApp para começar a receber e enviar mensagens
                            </p>
                        </div>
                        <Button onClick={() => setShowCreate(true)} className="gap-1.5">
                            <Plus className="size-4" />
                            Nova conexão
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 max-w-2xl">
                        {connections.map(c => (
                            <ConnectionCard
                                key={c.id}
                                connection={c}
                                enterpriseId={enterpriseId}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Dialogs ────────────────────────────────────────────────── */}
            {enterprise && (
                <CreateDialog
                    enterpriseId={enterpriseId}
                    open={showCreate}
                    onClose={() => setShowCreate(false)}
                />
            )}

            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover conexão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
                            {deleteTarget?.type === 'WHATSAPP' && ' A instância também será deletada do Uazap.'}
                            {' '}Esta ação não pode ser desfeita.
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
