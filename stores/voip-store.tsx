'use client'

import { createContext, useContext, useState } from 'react'

// ─── Types ────────────────────────────────────────────────────────────────────

type ActiveCall = {
    phone: string
    leadName: string
    enterpriseId: string
}

type VoipStoreContextType = {
    activeCall: ActiveCall | null
    startCall: (phone: string, leadName: string, enterpriseId: string) => void
    endCall: () => void
}

// ─── Context ──────────────────────────────────────────────────────────────────

const VoipStoreContext = createContext<VoipStoreContextType | null>(null)

// ─── Provider ─────────────────────────────────────────────────────────────────

export function VoipStoreProvider({ children }: { children: React.ReactNode }) {
    const [activeCall, setActiveCall] = useState<ActiveCall | null>(null)

    function startCall(phone: string, leadName: string, enterpriseId: string) {
        setActiveCall({ phone, leadName, enterpriseId })
    }

    function endCall() {
        setActiveCall(null)
    }

    return (
        <VoipStoreContext.Provider value={{ activeCall, startCall, endCall }}>
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
