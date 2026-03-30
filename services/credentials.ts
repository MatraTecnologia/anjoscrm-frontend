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
    maskedKey?: string        // OpenAI
    maskedToken?: string      // Kommo / RD Station
    subdomain?: string        // Kommo
    expiresAt?: string | null
    lastRefreshedAt?: string | null
    createdAt: string
    updatedAt: string
}

// ─── API functions ────────────────────────────────────────────────────────────

const h = (enterpriseId: string) => ({ headers: { 'X-Enterprise-Id': enterpriseId } })

async function listCredentials(enterpriseId: string): Promise<Credential[]> {
    const { data } = await api.get<Credential[]>(`/credentials/${enterpriseId}`, h(enterpriseId))
    return data
}

async function saveOpenAI(enterpriseId: string, payload: { name?: string; apiKey: string }): Promise<Credential> {
    const { data } = await api.post<Credential>(`/credentials/${enterpriseId}/openai`, payload, h(enterpriseId))
    return data
}

async function saveKommo(
    enterpriseId: string,
    payload: { subdomain: string; accessToken: string; name?: string; expiresAt?: string }
): Promise<Credential> {
    const { data } = await api.post<Credential>(`/credentials/${enterpriseId}/kommo`, payload, h(enterpriseId))
    return data
}

async function saveRDStation(
    enterpriseId: string,
    payload: { accessToken: string; name?: string; expiresAt?: string }
): Promise<Credential> {
    const { data } = await api.post<Credential>(`/credentials/${enterpriseId}/rdstation`, payload, h(enterpriseId))
    return data
}

async function deleteCredential(enterpriseId: string, id: string): Promise<void> {
    await api.delete(`/credentials/${enterpriseId}/${id}`, h(enterpriseId))
}

async function toggleCredential(enterpriseId: string, id: string): Promise<Credential> {
    const { data } = await api.patch<Credential>(`/credentials/${enterpriseId}/${id}/toggle`, {}, h(enterpriseId))
    return data
}

async function renewCredential(enterpriseId: string, id: string): Promise<Credential> {
    const { data } = await api.patch<Credential>(`/credentials/${enterpriseId}/${id}/renew`, {}, h(enterpriseId))
    return data
}

async function updateCredential(
    enterpriseId: string,
    id: string,
    payload: { name?: string; apiKey?: string; accessToken?: string; subdomain?: string; expiresAt?: string | null }
): Promise<Credential> {
    const { data } = await api.patch<Credential>(`/credentials/${enterpriseId}/${id}`, payload, h(enterpriseId))
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

export function useSaveOpenAI() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, ...rest }: { enterpriseId: string; name?: string; apiKey: string }) =>
            saveOpenAI(enterpriseId, rest),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useSaveKommo() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            enterpriseId,
            ...rest
        }: { enterpriseId: string; subdomain: string; accessToken: string; name?: string; expiresAt?: string }) =>
            saveKommo(enterpriseId, rest),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useSaveRDStation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            enterpriseId,
            ...rest
        }: { enterpriseId: string; accessToken: string; name?: string; expiresAt?: string }) =>
            saveRDStation(enterpriseId, rest),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useDeleteCredential() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            deleteCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useToggleCredential() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            toggleCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useRenewCredential() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({ enterpriseId, id }: { enterpriseId: string; id: string }) =>
            renewCredential(enterpriseId, id),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}

export function useUpdateCredential() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: ({
            enterpriseId,
            id,
            ...rest
        }: {
            enterpriseId: string
            id: string
            name?: string
            apiKey?: string
            accessToken?: string
            subdomain?: string
            expiresAt?: string | null
        }) => updateCredential(enterpriseId, id, rest),
        onSuccess: (_, { enterpriseId }) =>
            qc.invalidateQueries({ queryKey: keys.credentials.all(enterpriseId) }),
    })
}
