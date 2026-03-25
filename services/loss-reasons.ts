'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LossReason = {
    id: string
    enterpriseId: string
    name: string
    requireJustification: boolean
    createdAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listLossReasonsFn({ enterpriseId }: { enterpriseId: string }): Promise<LossReason[]> {
    const { data } = await api.get<LossReason[]>(`/loss-reasons/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createLossReasonFn({
    enterpriseId,
    name,
    requireJustification,
}: {
    enterpriseId: string
    name: string
    requireJustification: boolean
}): Promise<LossReason> {
    const { data } = await api.post<LossReason>(
        `/loss-reasons/${enterpriseId}`,
        { name, requireJustification },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function updateLossReasonFn({
    id,
    enterpriseId,
    name,
    requireJustification,
}: {
    id: string
    enterpriseId: string
    name?: string
    requireJustification?: boolean
}): Promise<LossReason> {
    const { data } = await api.patch<LossReason>(
        `/loss-reasons/${id}`,
        { name, requireJustification },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function deleteLossReasonFn({ id, enterpriseId }: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/loss-reasons/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListLossReasons(enterpriseId: string) {
    return useQuery({
        queryKey: keys.lossReasons.all(enterpriseId),
        queryFn: () => listLossReasonsFn({ enterpriseId }),
        enabled: !!enterpriseId,
    })
}

export function useCreateLossReason() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createLossReasonFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.lossReasons.all(enterpriseId) })
        },
    })
}

export function useUpdateLossReason() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateLossReasonFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.lossReasons.all(enterpriseId) })
        },
    })
}

export function useDeleteLossReason() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteLossReasonFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.lossReasons.all(enterpriseId) })
        },
    })
}
