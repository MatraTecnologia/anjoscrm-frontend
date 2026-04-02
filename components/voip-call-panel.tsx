'use client'

import { useEffect } from 'react'
import { Phone, PhoneOff, Mic, MicOff, Loader2 } from 'lucide-react'
import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { useVoipCall, formatDuration, type CallStatus } from '@/services/voip'

// ─── Types ────────────────────────────────────────────────────────────────────

interface Props {
    phone: string
    leadName: string
    enterpriseId: string
    onClose: () => void
}

// ─── Status helpers ───────────────────────────────────────────────────────────

const STATUS_LABEL: Record<CallStatus, string> = {
    idle: 'Pronto',
    connecting: 'Conectando...',
    calling: 'Discando...',
    ringing: 'Chamando...',
    connected: 'Em ligação',
    ended: 'Encerrada',
    error: 'Erro',
}

const STATUS_COLOR: Record<CallStatus, string> = {
    idle: 'text-muted-foreground',
    connecting: 'text-amber-500',
    calling: 'text-blue-500',
    ringing: 'text-blue-500',
    connected: 'text-green-500',
    ended: 'text-muted-foreground',
    error: 'text-destructive',
}

function PulsingRing({ active }: { active: boolean }) {
    if (!active) return null
    return (
        <span className="absolute inset-0 rounded-full animate-ping bg-green-400 opacity-30" />
    )
}

// ─── Component ────────────────────────────────────────────────────────────────

export function VoipCallPanel({ phone, leadName, enterpriseId, onClose }: Props) {
    const { status, duration, error, isMuted, startCall, hangup, toggleMute } = useVoipCall()

    // Inicia a chamada ao montar
    useEffect(() => {
        startCall(phone, enterpriseId)
    }, []) // eslint-disable-line react-hooks/exhaustive-deps

    const isActive = status === 'connected'
    const isEnded = status === 'ended' || status === 'error'
    const isLoading = status === 'connecting' || status === 'calling' || status === 'ringing'

    // Fecha automaticamente após encerrar
    useEffect(() => {
        if (status === 'ended') {
            const t = setTimeout(onClose, 2000)
            return () => clearTimeout(t)
        }
    }, [status, onClose])

    return (
        <div className="fixed bottom-6 right-6 z-50 w-72 rounded-2xl border bg-background shadow-2xl overflow-hidden">

            {/* Barra de status colorida */}
            <div className={cn(
                'h-1 w-full transition-all duration-700',
                isActive ? 'bg-green-500' : isEnded ? 'bg-muted' : 'bg-blue-500',
            )} />

            <div className="p-5">
                {/* Avatar + info do lead */}
                <div className="flex flex-col items-center gap-3 mb-6">
                    <div className="relative">
                        <div className={cn(
                            'size-16 rounded-full flex items-center justify-center text-2xl font-bold text-white transition-all',
                            isActive ? 'bg-green-500' : 'bg-muted-foreground/30',
                        )}>
                            {leadName[0]?.toUpperCase() ?? '?'}
                        </div>
                        <PulsingRing active={isActive} />
                    </div>

                    <div className="text-center">
                        <p className="text-sm font-semibold">{leadName}</p>
                        <p className="text-xs text-muted-foreground font-mono">{phone}</p>
                    </div>
                </div>

                {/* Status + timer */}
                <div className="flex flex-col items-center gap-1 mb-6">
                    <div className="flex items-center gap-1.5">
                        {isLoading && <Loader2 className="size-3.5 animate-spin text-blue-500" />}
                        <span className={cn('text-sm font-medium', STATUS_COLOR[status])}>
                            {STATUS_LABEL[status]}
                        </span>
                    </div>
                    {isActive && (
                        <span className="text-xl font-mono font-semibold tracking-widest tabular-nums">
                            {formatDuration(duration)}
                        </span>
                    )}
                    {error && (
                        <p className="text-xs text-destructive text-center max-w-[200px]">{error}</p>
                    )}
                </div>

                {/* Controles */}
                <div className="flex items-center justify-center gap-4">
                    {/* Mudo */}
                    <button
                        type="button"
                        onClick={toggleMute}
                        disabled={!isActive}
                        className={cn(
                            'flex flex-col items-center gap-1 p-3 rounded-xl transition-all',
                            isActive
                                ? isMuted
                                    ? 'bg-amber-100 text-amber-600 dark:bg-amber-950 dark:text-amber-400'
                                    : 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'opacity-30 cursor-not-allowed',
                        )}
                    >
                        {isMuted
                            ? <MicOff className="size-5" />
                            : <Mic className="size-5" />
                        }
                        <span className="text-[10px]">{isMuted ? 'Ativar' : 'Mudo'}</span>
                    </button>

                    {/* Desligar */}
                    <button
                        type="button"
                        onClick={isEnded ? onClose : hangup}
                        className={cn(
                            'flex flex-col items-center gap-1 p-3.5 rounded-2xl transition-all',
                            isEnded
                                ? 'bg-muted text-muted-foreground hover:bg-muted/80'
                                : 'bg-destructive text-white hover:bg-destructive/90 shadow-lg shadow-destructive/30',
                        )}
                    >
                        <PhoneOff className="size-6" />
                        <span className="text-[10px]">{isEnded ? 'Fechar' : 'Encerrar'}</span>
                    </button>
                </div>
            </div>
        </div>
    )
}
