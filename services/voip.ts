'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CallStatus =
    | 'idle'
    | 'connecting'   // inicializando Device
    | 'calling'      // discando
    | 'ringing'      // chamando o lead
    | 'connected'    // em ligação
    | 'ended'        // encerrada
    | 'error'

export type VoipTokenResponse = {
    token: string
    connectionId: string
    twilioNumber: string
    userId: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchVoipToken(enterpriseId: string, connectionId?: string): Promise<VoipTokenResponse> {
    const params = connectionId ? `?connectionId=${connectionId}` : ''
    const { data } = await api.get<VoipTokenResponse>(`/voice/token${params}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoipToken(enterpriseId: string, enabled = false) {
    return useQuery({
        queryKey: ['voip', 'token', enterpriseId],
        queryFn: () => fetchVoipToken(enterpriseId),
        enabled: !!enterpriseId && enabled,
        staleTime: 50 * 60 * 1000, // 50 min (token válido por 1h)
        retry: false,
    })
}

// ─── Call hook ────────────────────────────────────────────────────────────────

export type UseVoipCallReturn = {
    status: CallStatus
    duration: number          // segundos em ligação
    error: string | null
    isMuted: boolean
    callSid: string | null
    startCall: (phone: string, enterpriseId: string, leadId?: string, userId?: string) => Promise<void>
    hangup: () => void
    toggleMute: () => void
}

export function useVoipCall(onCallSid?: (sid: string) => void): UseVoipCallReturn {
    const [status, setStatus] = useState<CallStatus>('idle')
    const [duration, setDuration] = useState(0)
    const [error, setError] = useState<string | null>(null)
    const [isMuted, setIsMuted] = useState(false)
    const [callSid, setCallSid] = useState<string | null>(null)

    // Armazenamos Device e Call como refs para não causar re-renders
    const deviceRef = useRef<import('@twilio/voice-sdk').Device | null>(null)
    const callRef = useRef<import('@twilio/voice-sdk').Call | null>(null)
    const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
    const isMutedRef = useRef(false)

    function clearTimer() {
        if (timerRef.current) {
            clearInterval(timerRef.current)
            timerRef.current = null
        }
    }

    function startTimer() {
        clearTimer()
        setDuration(0)
        timerRef.current = setInterval(() => setDuration(d => d + 1), 1000)
    }

    useEffect(() => () => {
        clearTimer()
        deviceRef.current?.destroy()
    }, [])

    const hangup = useCallback(() => {
        const call = callRef.current
        const device = deviceRef.current
        callRef.current = null
        deviceRef.current = null
        try { call?.disconnect() } catch { /* ignora */ }
        try { device?.destroy() } catch { /* ignora */ }
        clearTimer()
        isMutedRef.current = false
        setStatus('ended')
        setIsMuted(false)
        setCallSid(null)
    }, [])

    const toggleMute = useCallback(() => {
        if (!callRef.current) return
        const next = !isMutedRef.current
        isMutedRef.current = next
        callRef.current.mute(next)
        setIsMuted(next)
    }, [])

    const startCall = useCallback(async (phone: string, enterpriseId: string, leadId?: string, userId?: string) => {
        try {
            setStatus('connecting')
            setError(null)
            isMutedRef.current = false
            setIsMuted(false)

            // Lazy import — @twilio/voice-sdk só roda no browser
            const { Device } = await import('@twilio/voice-sdk')

            // Obtém token do backend
            const tokenData = await fetchVoipToken(enterpriseId)

            // Usa o userId do token se não foi passado explicitamente
            const resolvedUserId = userId ?? tokenData.userId

            // Cria e registra o Device
            // register() retorna Promise<void> na v2.x — await direto, sem timeout manual
            const device = new Device(tokenData.token, { logLevel: 'warn' })
            deviceRef.current = device

            device.on('error', (err) => {
                setError(err.message ?? 'Erro no dispositivo Twilio')
                setStatus('error')
                deviceRef.current?.destroy()
            })

            await device.register()

            setStatus('calling')

            const call = await device.connect({
                params: {
                    To: phone,
                    connectionId: tokenData.connectionId,
                    ...(leadId ? { leadId } : {}),
                    ...(resolvedUserId ? { userId: resolvedUserId } : {}),
                },
            })

            callRef.current = call

            call.on('ringing', () => setStatus('ringing'))
            call.on('accept', () => {
                setStatus('connected')
                startTimer()
                // Captura o CallSid para a sala de transcrição
                const sid = call.parameters?.CallSid as string | undefined
                if (sid) {
                    setCallSid(sid)
                    onCallSid?.(sid)
                }
            })
            call.on('disconnect', () => hangup())
            call.on('error', (err) => {
                setError(err.message)
                setStatus('error')
                clearTimer()
            })

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro desconhecido'
            setError(msg)
            setStatus('error')
            deviceRef.current?.destroy()
        }
    }, [hangup])

    return { status, duration, error, isMuted, callSid, startCall, hangup, toggleMute }
}

// ─── Voice Call History ───────────────────────────────────────────────────────

export type VoiceCallRecord = {
    id: string
    callSid: string
    leadId: string | null
    userId: string | null
    direction: 'OUTBOUND' | 'INBOUND'
    fromNumber: string
    toNumber: string
    status: 'INITIATED' | 'IN_PROGRESS' | 'COMPLETED' | 'FAILED' | 'BUSY' | 'NO_ANSWER'
    duration: number | null
    recordingUrl: string | null
    transcription: string | null
    transcriptSegments: { speaker: 'agent' | 'lead'; text: string; timestamp: number }[] | null
    startedAt: string
    endedAt: string | null
    user: { id: string; name: string; image: string | null } | null
}

export function useLeadVoiceCalls(leadId: string, enterpriseId: string) {
    return useQuery({
        queryKey: ['voice', 'calls', leadId],
        queryFn: async () => {
            const { data } = await api.get<VoiceCallRecord[]>(`/voice/calls?leadId=${leadId}`, {
                headers: { 'X-Enterprise-Id': enterpriseId },
            })
            return data
        },
        enabled: !!leadId && !!enterpriseId,
    })
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}
