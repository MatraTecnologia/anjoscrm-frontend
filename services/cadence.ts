'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CadenceStatus =
    | 'FIRST_CONTACT_SENT'
    | 'IN_CADENCE'
    | 'REPLIED'
    | 'COMPLETED'
    | 'CANCELLED'

export type StageFirstContact = {
    id: string
    stageId: string
    enterpriseId: string
    connectionId: string | null
    isActive: boolean
    message: string
    connection?: { id: string; name: string; type: string } | null
    createdAt?: string
    updatedAt?: string
}

export type CadenceBlock = {
    id?: string
    order: number
    message: string
    delayMinutes: number
}

export type StageCadenceFlow = {
    id: string
    firstContactId: string
    enterpriseId: string
    isActive: boolean
    blocks: CadenceBlock[]
    createdAt?: string
    updatedAt?: string
}

export type CadenceExecution = {
    id: string
    flowId: string
    dealId: string
    leadId: string
    enterpriseId: string
    connectionId: string
    status: CadenceStatus
    nextBlockIndex: number
    nextSendAt: string | null
    firstContactSentAt: string | null
    repliedAt: string | null
    completedAt: string | null
    createdAt: string
    updatedAt: string
    flow: StageCadenceFlow & { blocks: CadenceBlock[] }
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function getFirstContactFn(stageId: string, enterpriseId: string): Promise<StageFirstContact> {
    const { data } = await api.get<StageFirstContact>(`/cadence/stages/${stageId}/first-contact`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function upsertFirstContactFn({
    stageId,
    enterpriseId,
    payload,
}: {
    stageId: string
    enterpriseId: string
    payload: { isActive: boolean; message: string; connectionId?: string | null }
}): Promise<StageFirstContact> {
    const { data } = await api.put<StageFirstContact>(
        `/cadence/stages/${stageId}/first-contact`,
        payload,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deleteFirstContactFn({ stageId, enterpriseId }: { stageId: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/cadence/stages/${stageId}/first-contact`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function getFlowFn(stageId: string, enterpriseId: string): Promise<StageCadenceFlow> {
    const { data } = await api.get<StageCadenceFlow>(`/cadence/stages/${stageId}/flow`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function upsertFlowFn({
    stageId,
    enterpriseId,
    payload,
}: {
    stageId: string
    enterpriseId: string
    payload: { isActive: boolean; blocks: CadenceBlock[] }
}): Promise<StageCadenceFlow> {
    const { data } = await api.put<StageCadenceFlow>(
        `/cadence/stages/${stageId}/flow`,
        payload,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function getExecutionFn(dealId: string, enterpriseId: string): Promise<CadenceExecution> {
    const { data } = await api.get<CadenceExecution>(`/cadence/deals/${dealId}/execution`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function cancelExecutionFn({ dealId, enterpriseId }: { dealId: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/cadence/deals/${dealId}/execution`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useFirstContact(stageId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.cadence.firstContact(stageId),
        queryFn: () => getFirstContactFn(stageId, enterpriseId),
        enabled: !!stageId && !!enterpriseId,
    })
}

export function useUpsertFirstContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: upsertFirstContactFn,
        onSuccess: (_data, { stageId }) => {
            queryClient.invalidateQueries({ queryKey: keys.cadence.firstContact(stageId) })
        },
    })
}

export function useDeleteFirstContact() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteFirstContactFn,
        onSuccess: (_data, { stageId }) => {
            queryClient.invalidateQueries({ queryKey: keys.cadence.firstContact(stageId) })
            queryClient.invalidateQueries({ queryKey: keys.cadence.flow(stageId) })
        },
    })
}

export function useCadenceFlow(stageId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.cadence.flow(stageId),
        queryFn: () => getFlowFn(stageId, enterpriseId),
        enabled: !!stageId && !!enterpriseId,
    })
}

export function useUpsertCadenceFlow() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: upsertFlowFn,
        onSuccess: (_data, { stageId }) => {
            queryClient.invalidateQueries({ queryKey: keys.cadence.flow(stageId) })
        },
    })
}

export function useCadenceExecution(dealId: string, enterpriseId: string, enabled = true) {
    return useQuery({
        queryKey: keys.cadence.execution(dealId),
        queryFn: () => getExecutionFn(dealId, enterpriseId),
        enabled: !!dealId && !!enterpriseId && enabled,
        retry: false,
    })
}

export function useCancelCadenceExecution() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: cancelExecutionFn,
        onSuccess: (_data, { dealId }) => {
            queryClient.invalidateQueries({ queryKey: keys.cadence.execution(dealId) })
        },
    })
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

export const CADENCE_STATUS_LABEL: Record<CadenceStatus, string> = {
    FIRST_CONTACT_SENT: 'Primeiro contato enviado',
    IN_CADENCE: 'Em fluxo de cadência',
    REPLIED: 'Lead respondeu',
    COMPLETED: 'Fluxo finalizado',
    CANCELLED: 'Cancelado',
}

export const CADENCE_STATUS_COLOR: Record<CadenceStatus, string> = {
    FIRST_CONTACT_SENT: 'text-blue-600 bg-blue-50',
    IN_CADENCE: 'text-amber-600 bg-amber-50',
    REPLIED: 'text-green-600 bg-green-50',
    COMPLETED: 'text-gray-600 bg-gray-100',
    CANCELLED: 'text-red-500 bg-red-50',
}
