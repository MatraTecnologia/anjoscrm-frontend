'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ActivityType = {
    id: string
    enterpriseId: string
    name: string
    color: string
    createdAt: string
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listActivityTypesFn({ enterpriseId }: { enterpriseId: string }): Promise<ActivityType[]> {
    const { data } = await api.get<ActivityType[]>(`/activity-types/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createActivityTypeFn({
    enterpriseId,
    name,
    color,
}: {
    enterpriseId: string
    name: string
    color?: string
}): Promise<ActivityType> {
    const { data } = await api.post<ActivityType>(
        `/activity-types/${enterpriseId}`,
        { name, color },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function updateActivityTypeFn({
    id,
    enterpriseId,
    name,
    color,
}: {
    id: string
    enterpriseId: string
    name?: string
    color?: string
}): Promise<ActivityType> {
    const { data } = await api.patch<ActivityType>(
        `/activity-types/${id}`,
        { name, color },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function deleteActivityTypeFn({ id, enterpriseId }: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/activity-types/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListActivityTypes(enterpriseId: string) {
    return useQuery({
        queryKey: keys.activityTypes.all(enterpriseId),
        queryFn: () => listActivityTypesFn({ enterpriseId }),
        enabled: !!enterpriseId,
    })
}

export function useCreateActivityType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createActivityTypeFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.activityTypes.all(enterpriseId) })
        },
    })
}

export function useUpdateActivityType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateActivityTypeFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.activityTypes.all(enterpriseId) })
        },
    })
}

export function useDeleteActivityType() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteActivityTypeFn,
        onSuccess: (_data, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.activityTypes.all(enterpriseId) })
        },
    })
}
