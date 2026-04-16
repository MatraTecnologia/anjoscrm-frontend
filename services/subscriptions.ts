'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type WhatsappSubStatus = 'PENDING_PAYMENT' | 'ACTIVE' | 'SUSPENDED' | 'CANCELLED'

export type WhatsappSubscription = {
    id: string
    enterpriseId: string
    connectionId: string | null
    asaasSubId: string | null
    asaasPaymentId: string | null
    status: WhatsappSubStatus
    priceMonthly: number
    paymentUrl: string | null
    label: string
    createdAt: string
    updatedAt: string
    connection: {
        id: string
        name: string
        status: string
        phoneNumber: string | null
    } | null
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listWhatsappSubsFn(enterpriseId: string): Promise<WhatsappSubscription[]> {
    const { data } = await api.get<WhatsappSubscription[]>(`/subscriptions/whatsapp/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createWhatsappSubFn({
    enterpriseId,
    label,
}: {
    enterpriseId: string
    label?: string
}): Promise<WhatsappSubscription> {
    const { data } = await api.post<WhatsappSubscription>(
        `/subscriptions/whatsapp/${enterpriseId}`,
        { label },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function cancelWhatsappSubFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/subscriptions/whatsapp/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useWhatsappSubscriptions(enterpriseId: string) {
    return useQuery({
        queryKey: keys.subscriptions.whatsapp(enterpriseId),
        queryFn: () => listWhatsappSubsFn(enterpriseId),
        enabled: !!enterpriseId,
        // Polling para detectar ativação após pagamento confirmado
        refetchInterval: (query) => {
            const hasPending = query.state.data?.some(s => s.status === 'PENDING_PAYMENT')
            return hasPending ? 8000 : false
        },
    })
}

export function useCreateWhatsappSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createWhatsappSubFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.subscriptions.whatsapp(enterpriseId) })
        },
    })
}

export function useCancelWhatsappSubscription() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: cancelWhatsappSubFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.subscriptions.whatsapp(enterpriseId) })
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}
