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
    startCall: (phone: string, enterpriseId: string) => Promise<void>
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
        try { callRef.current?.disconnect() } catch { /* ignora */ }
        try { deviceRef.current?.destroy() } catch { /* ignora */ }
        deviceRef.current = null
        callRef.current = null
        clearTimer()
        setStatus('ended')
        setIsMuted(false)
        setCallSid(null)
    }, [])

    const toggleMute = useCallback(() => {
        if (!callRef.current) return
        const next = !isMuted
        callRef.current.mute(next)
        setIsMuted(next)
    }, [isMuted])

    const startCall = useCallback(async (phone: string, enterpriseId: string) => {
        try {
            setStatus('connecting')
            setError(null)
            setIsMuted(false)

            // Lazy import — @twilio/voice-sdk só roda no browser
            const { Device } = await import('@twilio/voice-sdk')

            // Obtém token do backend
            const tokenData = await fetchVoipToken(enterpriseId)

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

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatDuration(seconds: number): string {
    const m = Math.floor(seconds / 60).toString().padStart(2, '0')
    const s = (seconds % 60).toString().padStart(2, '0')
    return `${m}:${s}`
}
