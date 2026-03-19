'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type CustomFieldDef = {
    id: string
    enterpriseId: string
    name: string
    description: string | null
    group: string | null
    entity: string          // "lead" | "deal"
    fieldType: string       // "text" | "textarea" | "number" | "currency" | "date" | "datetime" | "select" | "multiselect" | "checkbox" | "url" | "phone" | "email"
    required: boolean
    isPublic: boolean
    alwaysVisible: boolean
    order: number
    options: string[] | null
    createdAt: string
    updatedAt: string
}

export type CustomFieldWithValue = CustomFieldDef & {
    value: unknown
}

export type CustomFieldPayload = {
    name: string
    description?: string | null
    group?: string | null
    entity?: string
    fieldType: string
    required?: boolean
    isPublic?: boolean
    alwaysVisible?: boolean
    order?: number
    options?: string[] | null
}

// ─── API helpers ──────────────────────────────────────────────────────────────

async function listFieldsFn(enterpriseId: string, entity?: string): Promise<CustomFieldDef[]> {
    const { data } = await api.get<CustomFieldDef[]>(`/custom-fields/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: entity ? { entity } : undefined,
    })
    return data
}

async function createFieldFn({ enterpriseId, payload }: { enterpriseId: string; payload: CustomFieldPayload }): Promise<CustomFieldDef> {
    const { data } = await api.post<CustomFieldDef>(
        `/custom-fields/${enterpriseId}`,
        payload,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function updateFieldFn({ id, enterpriseId, payload }: { id: string; enterpriseId: string; payload: Partial<CustomFieldPayload> }): Promise<CustomFieldDef> {
    const { data } = await api.patch<CustomFieldDef>(
        `/custom-fields/${id}`,
        payload,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deleteFieldFn({ id, enterpriseId }: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/custom-fields/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function reorderFieldsFn({ enterpriseId, ids }: { enterpriseId: string; ids: string[] }): Promise<void> {
    await api.patch(
        `/custom-fields/${enterpriseId}/reorder`,
        { ids },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
}

async function getLeadValuesFn(leadId: string, enterpriseId: string): Promise<CustomFieldWithValue[]> {
    const { data } = await api.get<CustomFieldWithValue[]>(`/custom-fields/values/lead/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function saveLeadValuesFn({ leadId, enterpriseId, items }: {
    leadId: string
    enterpriseId: string
    items: { fieldId: string; value: unknown }[]
}): Promise<void> {
    await api.put(`/custom-fields/values/lead/${leadId}`, items, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function getDealValuesFn(dealId: string, enterpriseId: string): Promise<CustomFieldWithValue[]> {
    const { data } = await api.get<CustomFieldWithValue[]>(`/custom-fields/values/deal/${dealId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function saveDealValuesFn({ dealId, enterpriseId, items }: {
    dealId: string
    enterpriseId: string
    items: { fieldId: string; value: unknown }[]
}): Promise<void> {
    await api.put(`/custom-fields/values/deal/${dealId}`, items, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useCustomFields(enterpriseId: string, entity?: string) {
    return useQuery({
        queryKey: entity
            ? keys.customFields.byEntity(enterpriseId, entity)
            : keys.customFields.all(enterpriseId),
        queryFn: () => listFieldsFn(enterpriseId, entity),
        enabled: !!enterpriseId,
    })
}

export function useCreateCustomField() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createFieldFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.all(enterpriseId) })
        },
    })
}

export function useUpdateCustomField() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateFieldFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.all(enterpriseId) })
        },
    })
}

export function useDeleteCustomField() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteFieldFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.all(enterpriseId) })
        },
    })
}

export function useReorderCustomFields() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: reorderFieldsFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.all(enterpriseId) })
        },
    })
}

export function useLeadCustomFieldValues(leadId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.customFields.leadValues(leadId),
        queryFn: () => getLeadValuesFn(leadId, enterpriseId),
        enabled: !!leadId && !!enterpriseId,
    })
}

export function useSaveLeadCustomFieldValues() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: saveLeadValuesFn,
        onSuccess: (_data, { leadId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.leadValues(leadId) })
        },
    })
}

export function useDealCustomFieldValues(dealId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.customFields.dealValues(dealId),
        queryFn: () => getDealValuesFn(dealId, enterpriseId),
        enabled: !!dealId && !!enterpriseId,
    })
}

export function useSaveDealCustomFieldValues() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: saveDealValuesFn,
        onSuccess: (_data, { dealId }) => {
            queryClient.invalidateQueries({ queryKey: keys.customFields.dealValues(dealId) })
        },
    })
}
