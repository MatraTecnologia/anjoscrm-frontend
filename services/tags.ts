'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Tag = {
    id: string
    enterpriseId: string
    name: string
    color: string
    createdAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listTagsFn({
    enterpriseId,
    q,
}: {
    enterpriseId: string
    q?: string
}): Promise<Tag[]> {
    const { data } = await api.get<Tag[]>(`/tags/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: q ? { q } : undefined,
    })
    return data
}

async function createTagFn({
    enterpriseId,
    name,
    color,
}: {
    enterpriseId: string
    name: string
    color?: string
}): Promise<Tag> {
    const { data } = await api.post<Tag>(
        `/tags/${enterpriseId}`,
        { name, color },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListTags(enterpriseId: string, q?: string) {
    return useQuery({
        queryKey: [...keys.tags.all(enterpriseId), q],
        queryFn: () => listTagsFn({ enterpriseId, q }),
        enabled: !!enterpriseId,
    })
}

async function updateTagFn({
    id,
    enterpriseId,
    name,
    color,
}: {
    id: string
    enterpriseId: string
    name?: string
    color?: string
}): Promise<Tag> {
    const { data } = await api.patch<Tag>(
        `/tags/${id}`,
        { name, color },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function deleteTagFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/tags/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

export function useCreateTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createTagFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.tags.all(enterpriseId) })
        },
    })
}

export function useUpdateTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateTagFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.tags.all(enterpriseId) })
        },
    })
}

export function useDeleteTag() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteTagFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.tags.all(enterpriseId) })
        },
    })
}
