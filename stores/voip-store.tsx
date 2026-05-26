'use client'

import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { getSocket } from '@/lib/socket'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TranscriptSegment = {
    speaker: 'agent' | 'lead'
    text: string
    timestamp: number
}

type ActiveCall = {
    phone: string
    leadName: string
    leadId: string
    enterpriseId: string
    userId?: string
}

type VoipStoreContextType = {
    activeCall: ActiveCall | null
    callSid: string | null
    transcript: TranscriptSegment[]
    startCall: (phone: string, leadName: string, leadId: string, enterpriseId: string, userId?: string) => void
    setCallSid: (sid: string) => void
    endCall: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const VoipStoreContext = createContext<VoipStoreContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VoipStoreProvider({ children }: { children: React.ReactNode }) {
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)
    const [callSid, setCallSidState] = useState<string | null>(null)
    const [transcript, setTranscript] = useState<TranscriptSegment[]>([])

    // Entra na room de voz quando o callSid é conhecido
    useEffect(() => {
        if (!callSid) return
        const socket = getSocket()
        socket.emit('join-voice', callSid)

        const handler = (data: { callSid: string; segment: TranscriptSegment }) => {
            if (data.callSid !== callSid) return
            setTranscript(prev => [...prev, data.segment])
        }

        socket.on('voice:transcription', handler)

        return () => {
            socket.emit('leave-voice', callSid)
            socket.off('voice:transcription', handler)
        }
    }, [callSid])

    const startCall = useCallback((phone: string, leadName: string, leadId: string, enterpriseId: string, userId?: string) => {
        setTranscript([])
        setCallSidState(null)
        setActiveCall({ phone, leadName, leadId, enterpriseId, userId })
    }, [])

    const setCallSid = useCallback((sid: string) => {
        setCallSidState(sid)
    }, [])

    const endCall = useCallback(() => {
        setActiveCall(null)
        setCallSidState(null)
        setTranscript([])
    }, [])

    return (
        <VoipStoreContext.Provider value={{ activeCall, callSid, transcript, startCall, setCallSid, endCall }}>
            {children}
        </VoipStoreContext.Provider>
    )
}

// ─── Hook ─────────────────────────────────────────────────────────────────────

export function useVoipStore(): VoipStoreContextType {
    const ctx = useContext(VoipStoreContext)
    if (!ctx) {
        throw new Error('useVoipStore must be used within VoipStoreProvider')
    }
    return ctx
}
