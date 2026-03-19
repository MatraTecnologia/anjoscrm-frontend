'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ConnectionType = 'WHATSAPP' | 'INSTAGRAM' | 'TELEGRAM' | 'WEBHOOK' | 'API'
export type ConnectionStatus = 'CONNECTED' | 'DISCONNECTED' | 'ERROR'

export type Connection = {
    id: string
    enterpriseId: string
    name: string
    type: ConnectionType
    status: ConnectionStatus
    phoneNumber: string | null
    config: Record<string, unknown> | null
    createdAt: string
    updatedAt: string
}

export type CreateConnectionPayload = {
    name: string
    type: ConnectionType
    baseUrl?: string
    apiKey?: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listConnectionsFn(enterpriseId: string): Promise<Connection[]> {
    const { data } = await api.get<Connection[]>(`/connections/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createConnectionFn({
    enterpriseId,
    payload,
}: {
    enterpriseId: string
    payload: CreateConnectionPayload
}): Promise<Connection> {
    const { data } = await api.post<Connection>(`/connections/${enterpriseId}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteConnectionFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/connections/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function getQrCodeFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<{ qr: string | null }> {
    const { data } = await api.get<{ qr: string | null }>(`/connections/${id}/qr`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getStatusFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<{ state: string; status: ConnectionStatus }> {
    const { data } = await api.get<{ state: string; status: ConnectionStatus }>(`/connections/${id}/status`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function disconnectFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<Connection> {
    const { data } = await api.post<Connection>(`/connections/${id}/disconnect`, null, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useConnections(enterpriseId: string) {
    return useQuery({
        queryKey: keys.connections.all(enterpriseId),
        queryFn: () => listConnectionsFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useCreateConnection() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createConnectionFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}

export function useDeleteConnection() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteConnectionFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}

export function useConnectionQr(id: string, enterpriseId: string, enabled: boolean) {
    return useQuery({
        queryKey: [...keys.connections.detail(id), 'qr'],
        queryFn: () => getQrCodeFn({ id, enterpriseId }),
        enabled: !!id && !!enterpriseId && enabled,
        refetchInterval: 25000, // QR expira ~30s, atualizar com margem
        retry: false,
    })
}

export function useConnectionStatus(id: string, enterpriseId: string, enabled: boolean) {
    return useQuery({
        queryKey: [...keys.connections.detail(id), 'status'],
        queryFn: () => getStatusFn({ id, enterpriseId }),
        enabled: !!id && !!enterpriseId && enabled,
        refetchInterval: 4000, // polling a cada 4s para detectar scan
    })
}

export function useDisconnect() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: disconnectFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}
