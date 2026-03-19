'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'
import type { Tag } from '@/services/tags'

// ─── Types ────────────────────────────────────────────────────────────────────

export type LeadAssignee = {
    id: string
    name: string
    email: string
    image: string | null
}

export type Lead = {
    id: string
    enterpriseId: string
    name: string
    email: string | null
    phone: string | null
    // Responsável
    assigneeId: string | null
    assignee: LeadAssignee | null
    // Dados adicionais
    empresa: string | null
    documento: string | null
    origem: string | null
    site: string | null
    image: string | null
    // Endereço
    cep: string | null
    logradouro: string | null
    numero: string | null
    complemento: string | null
    bairro: string | null
    cidade: string | null
    uf: string | null
    pais: string | null
    tags: Tag[]
    createdAt: string
    updatedAt: string
    _count?: {
        deals: number
        messages: number
    }
}

export type CreateLeadPayload = {
    name: string
    email?: string | null
    phone?: string | null
    assigneeId?: string | null
    empresa?: string | null
    documento?: string | null
    origem?: string | null
    site?: string | null
    tagIds?: string[]
}

export type UpdateLeadPayload = {
    name?: string
    email?: string | null
    phone?: string | null
    assigneeId?: string | null
    empresa?: string | null
    documento?: string | null
    origem?: string | null
    site?: string | null
    image?: string | null
    cep?: string | null
    logradouro?: string | null
    numero?: string | null
    complemento?: string | null
    bairro?: string | null
    cidade?: string | null
    uf?: string | null
    pais?: string | null
    tagIds?: string[]
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listLeadsFn({
    enterpriseId,
    q,
}: {
    enterpriseId: string
    q?: string
}): Promise<Lead[]> {
    const { data } = await api.get<Lead[]>(`/leads/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: q ? { q } : undefined,
    })
    return data
}

async function createLeadFn({
    enterpriseId,
    payload,
}: {
    enterpriseId: string
    payload: CreateLeadPayload
}): Promise<Lead> {
    const { data } = await api.post<Lead>(`/leads/${enterpriseId}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function updateLeadFn({
    id,
    enterpriseId,
    payload,
}: {
    id: string
    enterpriseId: string
    payload: UpdateLeadPayload
}): Promise<Lead> {
    const { data } = await api.patch<Lead>(`/leads/${id}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteLeadFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/leads/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function getLeadFn(enterpriseId: string, leadId: string): Promise<Lead> {
    const { data } = await api.get<Lead>(`/leads/detail/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLead(enterpriseId: string, leadId: string, enabled = true) {
    return useQuery({
        queryKey: keys.leads.detail(leadId),
        queryFn: () => getLeadFn(enterpriseId, leadId),
        enabled: enabled && !!enterpriseId && !!leadId,
    })
}

export function useLeads(enterpriseId: string, q?: string) {
    return useQuery({
        queryKey: [...keys.leads.all(enterpriseId), q],
        queryFn: () => listLeadsFn({ enterpriseId, q }),
        enabled: !!enterpriseId,
    })
}

export function useCreateLead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createLeadFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.leads.all(enterpriseId) })
        },
    })
}

export function useUpdateLead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateLeadFn,
        onSuccess: (data, { enterpriseId }) => {
            queryClient.setQueryData(keys.leads.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.leads.all(enterpriseId) })
        },
    })
}

export function useDeleteLead() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteLeadFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.leads.all(enterpriseId) })
        },
    })
}
