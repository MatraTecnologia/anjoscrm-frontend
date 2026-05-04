'use client'

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MetaTokenVerification = {
    valid: boolean
    accountId: string
    accountName: string
    permissions: string[]
    hasLeadsAccess: boolean
}

export type MetaForm = {
    id: string
    name: string
    leadsCount: number
    status: string
}

export type MetaPage = {
    pageId: string
    pageName: string
    forms: MetaForm[]
}

export type MetaFormField = {
    key: string
    label: string
    type: string
}

export type FieldMapping = {
    formField: string
    formFieldLabel: string
    targetType: 'lead' | 'deal'
    targetField: string
}

export type PipelineMetaIntegration = {
    id: string
    pipelineId: string
    enterpriseId: string
    connectionId: string
    pageId: string
    pageName: string
    formId: string
    formName: string
    initialStageId: string | null
    fieldMappings: FieldMapping[]
    isActive: boolean
    createdAt: string
    updatedAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function getMetaAuthUrlFn(enterpriseId: string): Promise<{ url: string }> {
    const { data } = await api.get<{ url: string }>('/meta/auth-url', {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function verifyMetaTokenFn({
    enterpriseId,
    accessToken,
}: {
    enterpriseId: string
    accessToken: string
}): Promise<MetaTokenVerification> {
    const { data } = await api.post<MetaTokenVerification>(
        '/meta/verify-token',
        { accessToken },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function createMetaConnectionFn({
    enterpriseId,
    name,
    accessToken,
    accountId,
    accountName,
}: {
    enterpriseId: string
    name: string
    accessToken: string
    accountId: string
    accountName: string
}): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>(
        '/meta/connections',
        { name, accessToken, accountId, accountName },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function handleOAuthCallbackFn({
    code,
    state,
}: {
    code: string
    state?: string
}): Promise<{ id: string }> {
    const { data } = await api.post<{ id: string }>('/meta/callback', { code, state })
    return data
}

async function deleteMetaConnectionFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/meta/connections/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function getMetaFormsFn({
    enterpriseId,
    connectionId,
}: {
    enterpriseId: string
    connectionId: string
}): Promise<{ pages: MetaPage[] }> {
    const { data } = await api.get<{ pages: MetaPage[] }>(
        `/meta/connections/${connectionId}/forms`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function getMetaFormFieldsFn({
    enterpriseId,
    connectionId,
    formId,
}: {
    enterpriseId: string
    connectionId: string
    formId: string
}): Promise<{ formName: string; fields: MetaFormField[] }> {
    const { data } = await api.get<{ formName: string; fields: MetaFormField[] }>(
        `/meta/connections/${connectionId}/forms/${formId}/fields`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function getPipelineMetaIntegrationFn({
    enterpriseId,
    pipelineId,
}: {
    enterpriseId: string
    pipelineId: string
}): Promise<PipelineMetaIntegration> {
    const { data } = await api.get<PipelineMetaIntegration>(
        `/meta/pipeline-integrations/${pipelineId}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function upsertPipelineMetaIntegrationFn({
    enterpriseId,
    pipelineId,
    ...body
}: {
    enterpriseId: string
    pipelineId: string
    connectionId: string
    pageId: string
    pageName: string
    formId: string
    formName: string
    initialStageId?: string | null
    fieldMappings: FieldMapping[]
}): Promise<PipelineMetaIntegration> {
    const { data } = await api.put<PipelineMetaIntegration>(
        `/meta/pipeline-integrations/${pipelineId}`,
        body,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deletePipelineMetaIntegrationFn({
    enterpriseId,
    pipelineId,
}: {
    enterpriseId: string
    pipelineId: string
}): Promise<void> {
    await api.delete(`/meta/pipeline-integrations/${pipelineId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useGetMetaAuthUrl() {
    return useMutation({ mutationFn: getMetaAuthUrlFn })
}

export function useVerifyMetaToken() {
    return useMutation({ mutationFn: verifyMetaTokenFn })
}

export function useCreateMetaConnection() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createMetaConnectionFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}

export function useMetaOAuthCallback() {
    return useMutation({ mutationFn: handleOAuthCallbackFn })
}

export function useDeleteMetaConnection() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteMetaConnectionFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.connections.all(enterpriseId) })
        },
    })
}

export function useGetMetaForms(enterpriseId: string, connectionId: string, enabled = false) {
    return useQuery({
        queryKey: ['meta', 'forms', connectionId],
        queryFn: () => getMetaFormsFn({ enterpriseId, connectionId }),
        enabled: !!enterpriseId && !!connectionId && enabled,
        staleTime: 60_000,
    })
}

export function useGetMetaFormFields(enterpriseId: string, connectionId: string, formId: string, enabled = false) {
    return useQuery({
        queryKey: ['meta', 'form-fields', connectionId, formId],
        queryFn: () => getMetaFormFieldsFn({ enterpriseId, connectionId, formId }),
        enabled: !!enterpriseId && !!connectionId && !!formId && enabled,
        staleTime: 60_000,
    })
}

export function useGetPipelineMetaIntegration(enterpriseId: string, pipelineId: string, enabled = true) {
    return useQuery({
        queryKey: ['meta', 'pipeline-integration', pipelineId],
        queryFn: () => getPipelineMetaIntegrationFn({ enterpriseId, pipelineId }),
        enabled: !!enterpriseId && !!pipelineId && enabled,
        retry: false,
        staleTime: 30_000,
    })
}

export function useUpsertPipelineMetaIntegration() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: upsertPipelineMetaIntegrationFn,
        onSuccess: (_data, { pipelineId }) => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'pipeline-integration', pipelineId] })
        },
    })
}

export function useDeletePipelineMetaIntegration() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deletePipelineMetaIntegrationFn,
        onSuccess: (_data, { pipelineId }) => {
            queryClient.invalidateQueries({ queryKey: ['meta', 'pipeline-integration', pipelineId] })
        },
    })
}
