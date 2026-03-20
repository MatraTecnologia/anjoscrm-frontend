'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AiAgentProduct = {
    product: {
        id: string
        name: string
        price: number
        status: string
    }
}

export type AiDocument = {
    id: string
    name: string
    status: string
    chunkCount: number
    createdAt: string
}

export type AiFollowupRule = {
    id: string
    triggerAfterMinutes: number
    message: string
    order: number
    isActive: boolean
}

export type AiLeadState = {
    id: string
    agentId: string
    leadId: string
    isPaused: boolean
    pauseReason: string | null
    followupCount: number
    lastMessageAt: string | null
    conversationSummary: string | null
    currentStage: string
}

export type AiAgent = {
    id: string
    enterpriseId: string
    name: string
    description: string | null
    role: string
    tone: string
    provider: string
    model: string
    hasApiKey: boolean
    apiKeyHint: string | null
    temperature: number
    ticketAverage: number | null
    canGiveDiscount: boolean
    maxDiscountPct: number | null
    mainDifferential: string | null
    strategyMode: string
    maxFollowups: number
    systemPrompt: string | null
    customRules: string | null
    isActive: boolean
    fallbackToHuman: boolean
    connectionId: string | null
    pipelineId: string | null
    createdAt: string
    updatedAt: string
    // relações
    connection: { id: string; name: string; type: string; status: string } | null
    pipeline: { id: string; name: string; color: string } | null
    products: AiAgentProduct[]
    documents: AiDocument[]
    followupRules: AiFollowupRule[]
    _count: { leadStates: number }
}

export type CreateAgentPayload = {
    name: string
    description?: string | null
    role?: string
    tone?: string
    provider?: string
    model?: string
    apiKey?: string | null
    temperature?: number
    ticketAverage?: number | null
    canGiveDiscount?: boolean
    maxDiscountPct?: number | null
    mainDifferential?: string | null
    strategyMode?: string
    maxFollowups?: number
    systemPrompt?: string | null
    customRules?: string | null
    isActive?: boolean
    fallbackToHuman?: boolean
    connectionId?: string | null
    pipelineId?: string | null
    productIds?: string[]
}

export type UpdateAgentPayload = Partial<CreateAgentPayload>

export type FollowupRuleInput = {
    triggerAfterMinutes: number
    message: string
    order?: number
    isActive?: boolean
}

// ─── API fns ──────────────────────────────────────────────────────────────────

async function listAgentsFn(enterpriseId: string): Promise<AiAgent[]> {
    const { data } = await api.get<AiAgent[]>(`/ai-agents/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getAgentFn(id: string, enterpriseId: string): Promise<AiAgent> {
    const { data } = await api.get<AiAgent>(`/ai-agents/detail/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createAgentFn({
    enterpriseId,
    payload,
}: {
    enterpriseId: string
    payload: CreateAgentPayload
}): Promise<AiAgent> {
    const { data } = await api.post<AiAgent>(`/ai-agents/${enterpriseId}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function updateAgentFn({
    id,
    enterpriseId,
    payload,
}: {
    id: string
    enterpriseId: string
    payload: UpdateAgentPayload
}): Promise<AiAgent> {
    const { data } = await api.patch<AiAgent>(`/ai-agents/${id}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteAgentFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/ai-agents/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function toggleAgentFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<AiAgent> {
    const { data } = await api.post<AiAgent>(`/ai-agents/${id}/toggle`, {}, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function saveFollowupRulesFn({
    id,
    enterpriseId,
    rules,
}: {
    id: string
    enterpriseId: string
    rules: FollowupRuleInput[]
}): Promise<AiFollowupRule[]> {
    const { data } = await api.put<AiFollowupRule[]>(`/ai-agents/${id}/followup-rules`, { rules }, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function uploadDocumentFn({
    id,
    enterpriseId,
    file,
}: {
    id: string
    enterpriseId: string
    file: File
}): Promise<AiDocument> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<AiDocument>(`/ai-agents/${id}/documents`, form, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteDocumentFn({
    id,
    docId,
    enterpriseId,
}: {
    id: string
    docId: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/ai-agents/${id}/documents/${docId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function pauseLeadFn({
    agentId,
    leadId,
    reason,
    enterpriseId,
}: {
    agentId: string
    leadId: string
    reason?: string
    enterpriseId: string
}): Promise<AiLeadState> {
    const { data } = await api.post<AiLeadState>(
        `/ai-agents/${agentId}/lead-states/${leadId}/pause`,
        { reason },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function resumeLeadFn({
    agentId,
    leadId,
    enterpriseId,
}: {
    agentId: string
    leadId: string
    enterpriseId: string
}): Promise<{ updated: number }> {
    const { data } = await api.post<{ updated: number }>(
        `/ai-agents/${agentId}/lead-states/${leadId}/resume`,
        {},
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListAiAgents(enterpriseId: string) {
    return useQuery({
        queryKey: keys.aiAgents.all(enterpriseId),
        queryFn: () => listAgentsFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useAiAgent(id: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.aiAgents.detail(id),
        queryFn: () => getAgentFn(id, enterpriseId),
        enabled: !!id && !!enterpriseId,
    })
}

export function useCreateAiAgent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createAgentFn,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.all(data.enterpriseId) })
        },
    })
}

export function useUpdateAiAgent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateAgentFn,
        onSuccess: (data) => {
            // Invalida o detalhe (não usa setQueryData pois o PATCH retorna sem relações)
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.detail(data.id) })
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.all(data.enterpriseId) })
        },
    })
}

export function useDeleteAiAgent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteAgentFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.all(enterpriseId) })
        },
    })
}

export function useToggleAiAgent() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: toggleAgentFn,
        onSuccess: (data) => {
            // Invalida o detalhe (não usa setQueryData pois o toggle retorna sem relações)
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.detail(data.id) })
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.all(data.enterpriseId) })
        },
    })
}

export function useSaveFollowupRules() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: saveFollowupRulesFn,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.detail(id) })
        },
    })
}

export function useUploadDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadDocumentFn,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.detail(id) })
        },
    })
}

export function useDeleteDocument() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteDocumentFn,
        onSuccess: (_, { id }) => {
            queryClient.invalidateQueries({ queryKey: keys.aiAgents.detail(id) })
        },
    })
}

export function usePauseLead() {
    return useMutation({ mutationFn: pauseLeadFn })
}

export function useResumeLead() {
    return useMutation({ mutationFn: resumeLeadFn })
}

// ─── Chat de teste ────────────────────────────────────────────────────────────

export type ChatMessage = {
    role: 'user' | 'assistant'
    content: string
}

async function chatWithAgentFn({
    id,
    enterpriseId,
    message,
    history,
}: {
    id: string
    enterpriseId: string
    message: string
    history: ChatMessage[]
}): Promise<{ text: string }> {
    const { data } = await api.post<{ text: string }>(
        `/ai-agents/${id}/chat`,
        { message, history },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

export function useChatWithAgent() {
    return useMutation({ mutationFn: chatWithAgentFn })
}
