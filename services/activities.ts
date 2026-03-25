'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'
import type { ActivityType } from './activity-types'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Activity = {
    id: string
    enterpriseId: string
    leadId: string
    dealId: string | null
    userId: string
    typeId: string | null
    title: string
    description: string | null
    startAt: string
    endAt: string | null
    linkedToStage: boolean
    isRequired: boolean
    completed: boolean
    completedAt: string | null
    createdAt: string
    updatedAt: string
    user: { id: string; name: string; image: string | null }
    activityType: ActivityType | null
    deal: { id: string; title: string } | null
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listActivitiesByLeadFn({
    leadId,
    enterpriseId,
}: {
    leadId: string
    enterpriseId: string
}): Promise<Activity[]> {
    const { data } = await api.get<Activity[]>(`/activities/lead/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createActivityFn({
    enterpriseId,
    ...body
}: {
    enterpriseId: string
    leadId: string
    dealId?: string | null
    typeId?: string | null
    title: string
    description?: string | null
    startAt: string
    endAt?: string | null
    linkedToStage?: boolean
    isRequired?: boolean
}): Promise<Activity> {
    const { data } = await api.post<Activity>(
        `/activities`,
        { ...body },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function updateActivityFn({
    id,
    enterpriseId,
    ...body
}: {
    id: string
    enterpriseId: string
    typeId?: string | null
    title?: string
    description?: string | null
    startAt?: string
    endAt?: string | null
    linkedToStage?: boolean
    isRequired?: boolean
    completed?: boolean
}): Promise<Activity> {
    const { data } = await api.patch<Activity>(
        `/activities/${id}`,
        { ...body },
        { headers: { 'X-Enterprise-Id': enterpriseId } }
    )
    return data
}

async function deleteActivityFn({ id, enterpriseId }: { id: string; enterpriseId: string; leadId: string }): Promise<void> {
    await api.delete(`/activities/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useLeadActivities(leadId: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.activities.byLead(leadId),
        queryFn: () => listActivitiesByLeadFn({ leadId, enterpriseId }),
        enabled: !!leadId && !!enterpriseId,
    })
}

export function useCreateActivity() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createActivityFn,
        onSuccess: (_data, { leadId }) => {
            queryClient.invalidateQueries({ queryKey: keys.activities.byLead(leadId) })
        },
    })
}

export function useUpdateActivity() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateActivityFn,
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: keys.activities.byLead(data.leadId) })
        },
    })
}

export function useDeleteActivity() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteActivityFn,
        onSuccess: (_data, { leadId }) => {
            queryClient.invalidateQueries({ queryKey: keys.activities.byLead(leadId) })
        },
    })
}

export function useToggleActivityComplete() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: ({ id, enterpriseId, completed }: { id: string; enterpriseId: string; leadId: string; completed: boolean }) =>
            updateActivityFn({ id, enterpriseId, completed }),
        onSuccess: (data) => {
            queryClient.invalidateQueries({ queryKey: keys.activities.byLead(data.leadId) })
        },
    })
}
