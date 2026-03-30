'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Tipos ────────────────────────────────────────────────────────────────────

export type CredentialType = 'OPENAI' | 'KOMMO' | 'RDSTATION'

export type Credential = {
    id: string
    enterpriseId: string
    type: CredentialType
    name: string
    isActive: boolean
    maskedKey?: string     // OpenAI: chave mascarada (sk-...****)
    maskedToken?: string   // OAuth: access token mascarado
    domain?: string        // Kommo: subdomínio da conta
    expiresAt?: string | null
    lastRefreshedAt?: string | null
    createdAt: string
    updatedAt: string
}

// ─── API functions ────────────────────────────────────────────────────────────

async function listCredentials(enterpriseId: string): Promise<Credential[]> {
    const { data } = await api.get<Credential[]>(`/credentials/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createOpenAI(
    enterpriseId: string,
    payload: { name: string; apiKey: string }
): Promise<Credential> {
    const { data } = await api.post<Credential>(`/credentials/${enterpriseId}/openai`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function updateCredential(
    enterpriseId: string,
    id: string,
    payload: { name?: string; apiKey?: string }
): Promise<Credential> {
    const { data } = await api.patch<Credential>(`/credentials/${enterpriseId}/${id}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteCredential(enterpriseId: string, id: string): Promise<void> {
    await api.delete(`/credentials/${enterpriseId}/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function toggleCredential(enterpriseId: string, id: string): Promise<Credential> {
    const { data } = await api.patch<Credential>(`/credentials/${enterpriseId}/${id}/toggle`, {}, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function refreshCredential(enterpriseId: string, id: string): Promise<Credential> {
    const { data } = await api.post<Credential>(`/credentials/${enterpriseId}/${id}/refresh`, {}, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getKommoAuthUrl(enterpriseId: string): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>(`/credentials/${enterpriseId}/kommo/auth-url`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getRDStationAuthUrl(enterpriseId: string): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>(`/credentials/${enterpriseId}/rdstation/auth-url`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCredentials(enterpriseId: string) {
    return useQuery({
        queryKey: keys.credentials.all(enterpriseId),
        queryFn: () => listCredentials(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useCreateOpenAI() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, name, apiKey }: { enterpriseId: string; name: string; apiKey: string }) =>
            createOpenAI(enterpriseId, { name, apiKey }),
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) })
        },
    })
}

export function useUpdateCredential() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({
            enterpriseId,
            id,
            ...payload
        }: { enterpriseId: string; id: string; name?: string; apiKey?: string }) =>
            updateCredential(enterpriseId, id, payload),
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) })
        },
    })
}

export function useDeleteCredential() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            deleteCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) })
        },
    })
}

export function useToggleCredential() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            toggleCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) })
        },
    })
}

export function useRefreshCredential() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            refreshCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) })
        },
    })
}

export function useKommoAuthUrl(enterpriseId: string) {
    return useMutation({
        mutationFn: () => getKommoAuthUrl(enterpriseId),
    })
}

export function useRDStationAuthUrl(enterpriseId: string) {
    return useMutation({
        mutationFn: () => getRDStationAuthUrl(enterpriseId),
    })
}
