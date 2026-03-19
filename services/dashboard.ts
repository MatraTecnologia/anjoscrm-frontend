'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DashKpi = { count: number; value: number }

export type DashNegociosData = {
    kpis: {
        total:    DashKpi
        ganhos:   DashKpi
        perdidos: DashKpi
        emAberto: DashKpi
    }
    monthly: { month: string; count: number; value: number }[]
    byAssignee: { id: string; name: string; image: string | null; count: number; value: number }[]
    recentDeals: {
        id: string
        title: string
        value: number
        createdAt: string
        daysOpen: number
        lead: { id: string; name: string; image: string | null }
        stage: { id: string; name: string }
        pipeline: { id: string; name: string }
        assignee: { id: string; name: string; image: string | null } | null
    }[]
}

export type DashMessagesData = {
    kpis: {
        total:         { count: number }
        inbound:       { count: number }
        outbound:      { count: number }
        conversations: { count: number }
    }
    monthly: { month: string; count: number }[]
    heatmap: Record<string, number>
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function fetchNegocios(enterpriseId: string, from: string, to: string): Promise<DashNegociosData> {
    const { data } = await api.get<DashNegociosData>(`/dashboard/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: { from, to },
    })
    return data
}

async function fetchMessages(enterpriseId: string, from: string, to: string): Promise<DashMessagesData> {
    const { data } = await api.get<DashMessagesData>(`/dashboard/${enterpriseId}/messages`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: { from, to },
    })
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useDashNegocios(enterpriseId: string, from: string, to: string) {
    return useQuery({
        queryKey: keys.dashboard.negocios(enterpriseId, from, to),
        queryFn: () => fetchNegocios(enterpriseId, from, to),
        enabled: !!enterpriseId && !!from && !!to,
    })
}

export function useDashMessages(enterpriseId: string, from: string, to: string) {
    return useQuery({
        queryKey: keys.dashboard.messages(enterpriseId, from, to),
        queryFn: () => fetchMessages(enterpriseId, from, to),
        enabled: !!enterpriseId && !!from && !!to,
    })
}
