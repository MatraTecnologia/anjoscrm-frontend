'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
    Plus, Globe, Trash2, WifiOff, QrCode, RefreshCw, Loader2,
    Check, Wifi, Webhook, Phone, Zap, ShieldCheck, Clock,
    CreditCard, ExternalLink, MessageSquare, Sparkles, ArrowRight,
    AlertCircle, Ban,
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
    type Connection,
} from '@/services/connections'
import {
    useWhatsappSubscriptions, useCreateWhatsappSubscription, useCancelWhatsappSubscription,
    type WhatsappSubscription,
} from '@/services/subscriptions'
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

// ─── Sub status badge ─────────────────────────────────────────────────────────

function SubStatusBadge({ status }: { status: WhatsappSubscription['status'] }) {
    if (status === 'ACTIVE') {
        return (
            <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 text-xs">
                <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                Ativa
            </Badge>
        )
    }
    if (status === 'PENDING_PAYMENT') {
        return (
            <Badge className="gap-1 bg-amber-500/10 text-amber-600 border-amber-500/20 hover:bg-amber-500/10 text-xs">
                <Clock className="size-3" />
                Aguardando pagamento
            </Badge>
        )
    }
    if (status === 'SUSPENDED') {
        return (
            <Badge className="gap-1 bg-red-500/10 text-red-600 border-red-500/20 hover:bg-red-500/10 text-xs">
                <AlertCircle className="size-3" />
                Suspensa
            </Badge>
        )
    }
    return (
        <Badge variant="secondary" className="gap-1 text-xs">
            <Ban className="size-3" />
            Cancelada
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
                                Não foi possível carregar o QR Code. Tente novamente em instantes.
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

// ─── Purchase dialog (VoIP/Twilio) ────────────────────────────────────────────

function VoipDialog({
    enterpriseId,
    open,
    onClose,
}: {
    enterpriseId: string
    open: boolean
    onClose: () => void
}) {
    const [name, setName] = useState('')
    const [accountSid, setAccountSid] = useState('')
    const [authToken, setAuthToken] = useState('')
    const [twilioNumber, setTwilioNumber] = useState('')

    const { mutate: create, isPending } = useCreateConnection()

    function reset() {
        setName(''); setAccountSid(''); setAuthToken(''); setTwilioNumber('')
    }

    function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        create({
            enterpriseId,
            payload: { name: name.trim(), type: 'VOIP', accountSid: accountSid.trim(), authToken: authToken.trim(), twilioNumber: twilioNumber.trim() },
        }, {
            onSuccess: () => { toast.success('Conexão VoIP criada!'); reset(); onClose() },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    const canSubmit = name.trim() && accountSid.trim() && authToken.trim() && twilioNumber.trim()

    return (
        <Dialog open={open} onOpenChange={v => { if (!v) { reset(); onClose() } }}>
            <DialogContent className="sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <Phone className="size-4 text-blue-500" />
                        Conectar VoIP / Twilio
                    </DialogTitle>
                </DialogHeader>
                <form onSubmit={handleCreate} className="flex flex-col gap-4 py-1">
                    <div className="rounded-lg bg-muted/50 border px-3 py-2.5 text-xs text-muted-foreground leading-relaxed">
                        Acesse <strong>console.twilio.com</strong> → copie o <strong>Account SID</strong> e <strong>Auth Token</strong> da dashboard principal.
                        O número deve estar no formato <strong>+5511...</strong>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="voip-name">Nome *</Label>
                        <Input id="voip-name" placeholder="Ex: Telefone Comercial" value={name} onChange={e => setName(e.target.value)} disabled={isPending} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="voip-sid">Account SID *</Label>
                        <Input id="voip-sid" placeholder="ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" value={accountSid} onChange={e => setAccountSid(e.target.value)} disabled={isPending} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="voip-token">Auth Token *</Label>
                        <Input id="voip-token" type="password" placeholder="••••••••••••••••••••••••••••••••" value={authToken} onChange={e => setAuthToken(e.target.value)} disabled={isPending} required />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="voip-number">Número Twilio *</Label>
                        <Input id="voip-number" placeholder="+5511999998888" value={twilioNumber} onChange={e => setTwilioNumber(e.target.value)} disabled={isPending} required />
                    </div>
                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={() => { reset(); onClose() }} disabled={isPending}>Cancelar</Button>
                        <Button type="submit" disabled={!canSubmit || isPending}>
                            {isPending ? <><Loader2 className="size-4 animate-spin mr-1.5" />Criando...</> : 'Criar conexão'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── WhatsApp purchase card ───────────────────────────────────────────────────

function WhatsappPurchaseCard({
    enterpriseId,
    onSuccess,
}: {
    enterpriseId: string
    onSuccess: () => void
}) {
    const [label, setLabel] = useState('')
    const [showLabel, setShowLabel] = useState(false)
    const { mutate: create, isPending } = useCreateWhatsappSubscription()

    function handlePurchase() {
        create({ enterpriseId, label: label.trim() || 'WhatsApp Principal' }, {
            onSuccess: (data) => {
                if (data.paymentUrl) {
                    window.open(data.paymentUrl, '_blank', 'noopener,noreferrer')
                    toast.success('Redirecionando para o pagamento. Após confirmar, sua linha será ativada automaticamente.')
                } else {
                    toast.info('Assinatura criada! Aguarde a confirmação do pagamento.')
                }
                onSuccess()
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    const features = [
        { icon: MessageSquare, text: 'Envio e recebimento de mensagens' },
        { icon: Zap, text: 'Automações e chatbots com IA' },
        { icon: ShieldCheck, text: 'Infraestrutura gerenciada pela plataforma' },
        { icon: RefreshCw, text: 'Reconexão automática' },
    ]

    return (
        <div className="relative overflow-hidden rounded-xl border bg-card">
            {/* Gradient accent */}
            <div className="absolute inset-x-0 top-0 h-1 bg-gradient-to-r from-green-400 via-emerald-500 to-green-600" />

            <div className="p-6 flex flex-col gap-5">
                {/* Header */}
                <div className="flex items-start justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <div className="flex size-12 items-center justify-center rounded-xl bg-green-500/10 text-green-500">
                            <WhatsAppIcon className="size-6" />
                        </div>
                        <div>
                            <div className="flex items-center gap-2">
                                <p className="font-semibold text-base">Linha WhatsApp</p>
                                <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 text-[11px] px-1.5">
                                    <Sparkles className="size-2.5" />
                                    Recomendado
                                </Badge>
                            </div>
                            <p className="text-sm text-muted-foreground mt-0.5">Canal conversacional completo</p>
                        </div>
                    </div>

                    {/* Pricing */}
                    <div className="text-right shrink-0">
                        <div className="flex items-baseline gap-0.5 justify-end">
                            <span className="text-xs text-muted-foreground">R$</span>
                            <span className="text-3xl font-bold tabular-nums">97</span>
                        </div>
                        <p className="text-xs text-muted-foreground">/mês por linha</p>
                    </div>
                </div>

                {/* Features */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {features.map(({ icon: Icon, text }) => (
                        <div key={text} className="flex items-center gap-2 text-sm text-muted-foreground">
                            <div className="flex size-5 shrink-0 items-center justify-center rounded-full bg-green-500/10">
                                <Icon className="size-3 text-green-600" />
                            </div>
                            {text}
                        </div>
                    ))}
                </div>

                <div className="h-px bg-border" />

                {/* Nome opcional */}
                {showLabel ? (
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="sub-label" className="text-sm">Nome da linha (opcional)</Label>
                        <Input
                            id="sub-label"
                            placeholder="Ex: WhatsApp Comercial"
                            value={label}
                            onChange={e => setLabel(e.target.value)}
                            className="h-9"
                        />
                    </div>
                ) : (
                    <button
                        type="button"
                        className="text-xs text-muted-foreground hover:text-foreground transition-colors text-left"
                        onClick={() => setShowLabel(true)}
                    >
                        + Personalizar nome da linha
                    </button>
                )}

                {/* CTA */}
                <Button
                    className="w-full gap-2 bg-green-600 hover:bg-green-700 text-white h-11 text-sm font-medium"
                    onClick={handlePurchase}
                    disabled={isPending}
                >
                    {isPending ? (
                        <><Loader2 className="size-4 animate-spin" /> Processando...</>
                    ) : (
                        <>
                            <CreditCard className="size-4" />
                            Assinar agora — R$ 97/mês
                            <ArrowRight className="size-4 ml-auto" />
                        </>
                    )}
                </Button>

                <p className="text-[11px] text-muted-foreground text-center leading-relaxed">
                    Cobrança recorrente via Pix, boleto ou cartão · Cancele quando quiser
                </p>
            </div>
        </div>
    )
}

// ─── Subscription card ────────────────────────────────────────────────────────

function SubscriptionCard({
    sub,
    enterpriseId,
    onDelete,
}: {
    sub: WhatsappSubscription
    enterpriseId: string
    onDelete: (s: WhatsappSubscription) => void
}) {
    const [showQr, setShowQr] = useState(false)

    const { mutate: disconnect, isPending: disconnecting } = useDisconnect()
    const { mutate: configWebhook, isPending: configuringWebhook } = useConfigureWebhook()

    const conn = sub.connection
    const isActive = sub.status === 'ACTIVE'
    const isPending = sub.status === 'PENDING_PAYMENT'
    const isConnected = conn?.status === 'CONNECTED'

    function handleDisconnect() {
        if (!conn) return
        disconnect({ id: conn.id, enterpriseId }, {
            onSuccess: () => toast.success('WhatsApp desconectado.'),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleWebhook() {
        if (!conn) return
        configWebhook({ id: conn.id, enterpriseId }, {
            onSuccess: () => toast.success('Webhook configurado!'),
            onError: (err: unknown) => {
                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                toast.error(msg ?? 'Erro ao configurar webhook.')
            },
        })
    }

    return (
        <>
            <div className={cn(
                'flex items-center gap-4 rounded-lg border bg-card p-4 transition-colors',
                isPending ? 'border-amber-200 bg-amber-50/40 dark:bg-amber-500/5 dark:border-amber-500/20' : 'hover:bg-muted/20',
            )}>
                {/* Ícone */}
                <div className={cn(
                    'flex size-10 shrink-0 items-center justify-center rounded-lg',
                    isActive ? 'bg-green-500/10 text-green-500' : 'bg-muted text-muted-foreground',
                )}>
                    <WhatsAppIcon className="size-5" />
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                        <p className="text-sm font-medium truncate">{sub.label}</p>
                        <SubStatusBadge status={sub.status} />
                        {conn && <StatusBadge status={conn.status as Connection['status']} />}
                    </div>
                    <p className="text-xs text-muted-foreground mt-0.5">
                        R$ {sub.priceMonthly.toLocaleString('pt-BR', { minimumFractionDigits: 0 })}/mês
                        {conn?.phoneNumber && ` · ${conn.phoneNumber}`}
                    </p>
                </div>

                {/* Ações */}
                <div className="flex items-center gap-1.5 shrink-0">
                    {/* Pendente: botão de pagar */}
                    {isPending && sub.paymentUrl && (
                        <Button
                            size="sm"
                            className="h-7 text-xs gap-1.5 bg-amber-500 hover:bg-amber-600 text-white"
                            onClick={() => window.open(sub.paymentUrl!, '_blank', 'noopener,noreferrer')}
                        >
                            <ExternalLink className="size-3.5" />
                            Pagar agora
                        </Button>
                    )}

                    {/* Ativa + sem conexão ainda: aguardando provisionamento */}
                    {isActive && !conn && (
                        <Badge variant="secondary" className="text-xs gap-1">
                            <Loader2 className="size-3 animate-spin" />
                            Provisionando...
                        </Badge>
                    )}

                    {/* Ativa + conexão disponível + não conectado: QR code */}
                    {isActive && conn && !isConnected && (
                        <Button size="sm" variant="outline" onClick={() => setShowQr(true)} className="h-7 text-xs gap-1.5">
                            <QrCode className="size-3.5" />
                            Conectar
                        </Button>
                    )}

                    {/* Webhook */}
                    {isActive && conn && (
                        <Button
                            size="sm"
                            variant="outline"
                            onClick={handleWebhook}
                            disabled={configuringWebhook}
                            className="h-7 text-xs gap-1.5"
                            title="Registrar/atualizar webhook"
                        >
                            {configuringWebhook
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Webhook className="size-3.5" />
                            }
                            Webhook
                        </Button>
                    )}

                    {/* Desconectar */}
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
                        onClick={() => onDelete(sub)}
                    >
                        <Trash2 className="size-3.5" />
                    </Button>
                </div>
            </div>

            {showQr && conn && (
                <QrDialog
                    connection={conn as Connection}
                    enterpriseId={enterpriseId}
                    open={showQr}
                    onClose={() => setShowQr(false)}
                />
            )}
        </>
    )
}

// ─── VoIP connection card ─────────────────────────────────────────────────────

function VoipCard({
    connection,
    enterpriseId,
    onDelete,
}: {
    connection: Connection
    enterpriseId: string
    onDelete: (c: Connection) => void
}) {
    const { mutate: disconnect, isPending: disconnecting } = useDisconnect()
    const isConnected = connection.status === 'CONNECTED'

    function handleDisconnect() {
        disconnect({ id: connection.id, enterpriseId }, {
            onSuccess: () => toast.success(`${connection.name} desconectado.`),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/20 transition-colors">
            <div className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-blue-500/10 text-blue-500">
                <Phone className="size-5" />
            </div>
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{connection.name}</p>
                    <StatusBadge status={connection.status} />
                </div>
                <p className="text-xs text-muted-foreground mt-0.5">
                    VoIP · Twilio
                    {connection.phoneNumber && ` · ${connection.phoneNumber}`}
                </p>
            </div>
            <div className="flex items-center gap-1.5 shrink-0">
                {isConnected && (
                    <Button size="sm" variant="outline" onClick={handleDisconnect} disabled={disconnecting} className="h-7 text-xs gap-1.5">
                        {disconnecting ? <Loader2 className="size-3.5 animate-spin" /> : <WifiOff className="size-3.5" />}
                        Desconectar
                    </Button>
                )}
                <Button size="icon" variant="ghost" className="size-7 text-muted-foreground hover:text-destructive" onClick={() => onDelete(connection)}>
                    <Trash2 className="size-3.5" />
                </Button>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConnectionsPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [showVoipCreate, setShowVoipCreate] = useState(false)
    const [deleteSubTarget, setDeleteSubTarget] = useState<WhatsappSubscription | null>(null)
    const [deleteConnTarget, setDeleteConnTarget] = useState<Connection | null>(null)

    const { data: connections = [], isLoading: loadingConn } = useConnections(enterpriseId)
    const { data: waSubs = [], isLoading: loadingSubs } = useWhatsappSubscriptions(enterpriseId)
    const { mutate: removeConn, isPending: deletingConn } = useDeleteConnection()
    const { mutate: cancelSub, isPending: cancelingSub } = useCancelWhatsappSubscription()

    const isLoading = loadingConn || loadingSubs

    // VoIP connections (não gerenciadas por assinatura)
    const voipConnections = connections.filter(c => c.type === 'VOIP')

    // Assinaturas ativas ou pendentes (não canceladas)
    const activeSubs = waSubs.filter(s => s.status !== 'CANCELLED')

    // Contagem para uso
    const totalConnections = voipConnections.length + activeSubs.filter(s => s.status === 'ACTIVE').length

    function confirmDeleteSub() {
        if (!deleteSubTarget) return
        cancelSub({ id: deleteSubTarget.id, enterpriseId }, {
            onSuccess: () => { toast.success('Assinatura cancelada.'); setDeleteSubTarget(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function confirmDeleteConn() {
        if (!deleteConnTarget) return
        removeConn({ id: deleteConnTarget.id, enterpriseId }, {
            onSuccess: () => { toast.success('Conexão removida.'); setDeleteConnTarget(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    const hasAnything = activeSubs.length > 0 || voipConnections.length > 0

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
                <Button variant="outline" onClick={() => setShowVoipCreate(true)} className="gap-1.5">
                    <Phone className="size-4" />
                    Adicionar VoIP
                </Button>
            </div>

            {/* ── Contador ───────────────────────────────────────────────── */}
            {!isLoading && hasAnything && (
                <div className="flex items-center gap-4 px-6 py-3 border-b shrink-0">
                    <span className="text-sm text-muted-foreground">
                        {totalConnections} de {enterprise?.maxConnections ?? '—'} conexões ativas
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <Wifi className="size-3.5" />
                            {activeSubs.filter(s => s.connection?.status === 'CONNECTED').length + voipConnections.filter(c => c.status === 'CONNECTED').length} online
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
                ) : !hasAnything ? (
                    // Estado vazio: mostra card de compra em destaque
                    <div className="flex flex-col items-center gap-8 max-w-lg mx-auto pt-6">
                        <div className="text-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-green-500/10 text-green-500 mx-auto mb-4">
                                <WhatsAppIcon className="size-8" />
                            </div>
                            <h2 className="text-lg font-semibold">Conecte seu WhatsApp</h2>
                            <p className="text-sm text-muted-foreground mt-1.5 leading-relaxed">
                                Ative uma linha WhatsApp e comece a atender seus clientes diretamente pela plataforma,
                                com IA, automações e CRM integrados.
                            </p>
                        </div>
                        <div className="w-full">
                            <WhatsappPurchaseCard enterpriseId={enterpriseId} onSuccess={() => { }} />
                        </div>
                    </div>
                ) : (
                    <div className="flex flex-col gap-6 max-w-2xl">

                        {/* ── WhatsApp ── */}
                        <div>
                            <div className="flex items-center justify-between mb-3">
                                <div className="flex items-center gap-2">
                                    <WhatsAppIcon className="size-4 text-green-500" />
                                    <h2 className="text-sm font-semibold">WhatsApp</h2>
                                    <Badge variant="secondary" className="text-xs">{activeSubs.length}</Badge>
                                </div>
                            </div>

                            <div className="flex flex-col gap-3">
                                {activeSubs.map(sub => (
                                    <SubscriptionCard
                                        key={sub.id}
                                        sub={sub}
                                        enterpriseId={enterpriseId}
                                        onDelete={setDeleteSubTarget}
                                    />
                                ))}

                                {/* Card de compra de nova linha */}
                                {(enterprise?.maxConnections ?? 0) > totalConnections && (
                                    <WhatsappPurchaseCard enterpriseId={enterpriseId} onSuccess={() => { }} />
                                )}
                            </div>
                        </div>

                        {/* ── VoIP ── */}
                        {voipConnections.length > 0 && (
                            <div>
                                <div className="flex items-center gap-2 mb-3">
                                    <Phone className="size-4 text-blue-500" />
                                    <h2 className="text-sm font-semibold">VoIP / Telefone</h2>
                                    <Badge variant="secondary" className="text-xs">{voipConnections.length}</Badge>
                                </div>
                                <div className="flex flex-col gap-3">
                                    {voipConnections.map(c => (
                                        <VoipCard
                                            key={c.id}
                                            connection={c}
                                            enterpriseId={enterpriseId}
                                            onDelete={setDeleteConnTarget}
                                        />
                                    ))}
                                </div>
                            </div>
                        )}

                        {/* Em breve */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Globe className="size-4 text-muted-foreground" />
                                <h2 className="text-sm font-semibold text-muted-foreground">Em breve</h2>
                            </div>
                            <div className="flex flex-wrap gap-2">
                                {['Instagram', 'Telegram', 'Webhook', 'API'].map(label => (
                                    <div key={label} className="flex items-center gap-1.5 rounded-lg border border-dashed px-3 py-2 text-xs text-muted-foreground/60">
                                        {label}
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* ── Dialogs ────────────────────────────────────────────────── */}
            {enterprise && (
                <VoipDialog
                    enterpriseId={enterpriseId}
                    open={showVoipCreate}
                    onClose={() => setShowVoipCreate(false)}
                />
            )}

            {/* Cancelar assinatura WhatsApp */}
            <AlertDialog open={!!deleteSubTarget} onOpenChange={v => { if (!v) setDeleteSubTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Cancelar assinatura?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja cancelar a assinatura <strong>{deleteSubTarget?.label}</strong>?
                            A cobrança será encerrada e a linha será desativada. Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Voltar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteSub}
                            disabled={cancelingSub}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {cancelingSub ? <><Loader2 className="size-4 animate-spin" /> Cancelando...</> : 'Cancelar assinatura'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>

            {/* Remover conexão VoIP */}
            <AlertDialog open={!!deleteConnTarget} onOpenChange={v => { if (!v) setDeleteConnTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover conexão?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{deleteConnTarget?.name}</strong>?
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDeleteConn}
                            disabled={deletingConn}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deletingConn ? <><Loader2 className="size-4 animate-spin" /> Removendo...</> : 'Remover'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
