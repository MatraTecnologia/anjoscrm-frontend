'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

export type SimulationFieldType =
    | 'INPUT_TEXT' | 'INPUT_NUMBER' | 'INPUT_CURRENCY' | 'INPUT_DATE'
    | 'CHECKBOX' | 'CHECKLIST' | 'SELECT' | 'RADIO' | 'TEXTAREA' | 'SECTION'

export type SimulationField = {
    id: string
    templateId: string
    type: SimulationFieldType
    label: string
    placeholder: string | null
    required: boolean
    order: number
    options: { label: string; score?: number }[]
    config: { min?: number; max?: number; prefix?: string; suffix?: string }
}

export type SimulationTemplate = {
    id: string
    enterpriseId: string
    name: string
    description: string | null
    emoji: string
    color: string
    isActive: boolean
    createdAt: string
    updatedAt: string
    fields: SimulationField[]
    _count?: { responses: number; fields: number }
    config?: {
        scoringEnabled?: boolean
        scoreRanges?: { min: number; max: number; label: string; color: string; message?: string }[]
    }
}

export type SimulationAnswer = {
    fieldId: string
    label: string
    value: string | string[] | boolean
}

export type SimulationResponse = {
    id: string
    templateId: string
    enterpriseId: string
    leadId: string | null
    token: string
    status: 'pending' | 'completed' | 'expired'
    answers: SimulationAnswer[]
    expiresAt: string | null
    completedAt: string | null
    createdAt: string
    template: { id: string; name: string; emoji: string; color: string }
    totalScore: number | null
    maxScore: number | null
    scoreLabel: string | null
    scoreColor: string | null
    scoreMessage: string | null
}

export type PublicSimulation = {
    completed?: boolean
    expired?: boolean
    template?: SimulationTemplate
    responseId?: string
    // score fields (present when completed)
    totalScore?: number | null
    maxScore?: number | null
    scoreLabel?: string | null
    scoreColor?: string | null
    scoreMessage?: string | null
    answers?: { fieldId: string; label: string; value: unknown }[]
}

async function listTemplatesFn(enterpriseId: string): Promise<SimulationTemplate[]> {
    const { data } = await api.get<SimulationTemplate[]>('/simulations', {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getTemplateFn(id: string, enterpriseId: string): Promise<SimulationTemplate> {
    const { data } = await api.get<SimulationTemplate>(`/simulations/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createTemplateFn({ enterpriseId, ...body }: {
    enterpriseId: string; name: string; description?: string; emoji?: string; color?: string
}): Promise<SimulationTemplate> {
    const { data } = await api.post<SimulationTemplate>('/simulations', body, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function updateTemplateFn({ id, enterpriseId, ...body }: {
    id: string; enterpriseId: string; name?: string; description?: string
    emoji?: string; color?: string; isActive?: boolean
}): Promise<SimulationTemplate> {
    const { data } = await api.patch<SimulationTemplate>(`/simulations/${id}`, body, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteTemplateFn({ id, enterpriseId }: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/simulations/${id}`, { headers: { 'X-Enterprise-Id': enterpriseId } })
}

async function saveFieldsFn({ id, enterpriseId, fields }: {
    id: string; enterpriseId: string
    fields: Omit<SimulationField, 'id' | 'templateId'>[]
}): Promise<SimulationTemplate> {
    const { data } = await api.put<SimulationTemplate>(`/simulations/${id}/fields`, { fields }, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createResponseFn({ templateId, enterpriseId, leadId, expiresAt }: {
    templateId: string; enterpriseId: string; leadId?: string; expiresAt?: string
}): Promise<{ id: string; token: string; link: string }> {
    const { data } = await api.post(`/simulations/${templateId}/responses`, { leadId, expiresAt }, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getLeadResponsesFn(leadId: string, enterpriseId: string): Promise<SimulationResponse[]> {
    const { data } = await api.get<SimulationResponse[]>(`/simulations/responses/by-lead/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getPublicSimulationFn(token: string): Promise<PublicSimulation> {
    const { data } = await api.get<PublicSimulation>(`/s/${token}`)
    return data
}

async function submitSimulationFn({ token, answers }: {
    token: string; answers: SimulationAnswer[]
}): Promise<{
    success: boolean
    totalScore?: number
    maxScore?: number
    scoreLabel?: string
    scoreColor?: string
    scoreMessage?: string
}> {
    const { data } = await api.post(`/s/${token}/submit`, { answers })
    return data
}

export function useSimulationTemplates(enterpriseId: string) {
    return useQuery({
        queryKey: keys.simulations.all(enterpriseId),
        queryFn: () => listTemplatesFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useSimulationTemplate(id: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.simulations.detail(id),
        queryFn: () => getTemplateFn(id, enterpriseId),
        enabled: !!id && !!enterpriseId,
    })
}

export function useCreateSimulationTemplate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createTemplateFn,
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: keys.simulations.all(vars.enterpriseId) })
        },
    })
}

export function useUpdateSimulationTemplate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateTemplateFn,
        onSuccess: (data, vars) => {
            qc.invalidateQueries({ queryKey: keys.simulations.all(vars.enterpriseId) })
            qc.setQueryData(keys.simulations.detail(data.id), data)
        },
    })
}

export function useDeleteSimulationTemplate() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteTemplateFn,
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: keys.simulations.all(vars.enterpriseId) })
        },
    })
}

export function useSaveSimulationFields() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: saveFieldsFn,
        onSuccess: (data) => {
            qc.setQueryData(keys.simulations.detail(data.id), data)
        },
    })
}

export function useCreateSimulationResponse() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createResponseFn,
        onSuccess: (_data, vars) => {
            if (vars.leadId) {
                qc.invalidateQueries({ queryKey: keys.simulations.byLead(vars.leadId) })
            }
        },
    })
}

export function useLeadSimulationResponses(leadId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.simulations.byLead(leadId),
        queryFn: () => getLeadResponsesFn(leadId, enterpriseId),
        enabled: !!leadId && !!enterpriseId,
    })
}

export function usePublicSimulation(token: string) {
    return useQuery({
        queryKey: keys.simulations.public(token),
        queryFn: () => getPublicSimulationFn(token),
        enabled: !!token,
        retry: false,
    })
}

export function useSubmitSimulation() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: submitSimulationFn,
        onSuccess: (_data, vars) => {
            qc.invalidateQueries({ queryKey: keys.simulations.public(vars.token) })
        },
    })
}
