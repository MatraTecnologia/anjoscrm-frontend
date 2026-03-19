'use client'

import { useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type AuditUser = {
    id: string
    name: string
    email: string
    image: string | null
}

export type AuditLog = {
    id: string
    action: string       // "deal.created", "lead.deleted", etc.
    entity: string       // "Deal", "Lead", "Pipeline", etc.
    entityId: string | null
    entityName: string | null
    metadata: Record<string, unknown> | null
    createdAt: string
    user: AuditUser
}

type AuditPage = {
    logs: AuditLog[]
    nextCursor: string | null
}

// ─── Labels ───────────────────────────────────────────────────────────────────

export const ACTION_LABELS: Record<string, string> = {
    'lead.created':    'criou o lead',
    'lead.updated':    'atualizou o lead',
    'lead.deleted':    'excluiu o lead',
    'deal.created':    'criou o negócio',
    'deal.updated':    'editou o negócio',
    'deal.moved':      'moveu o negócio',
    'deal.deleted':    'excluiu o negócio',
    'pipeline.created':'criou o pipeline',
    'pipeline.updated':'atualizou o pipeline',
    'pipeline.deleted':'excluiu o pipeline',
    'stage.created':   'criou a etapa',
    'stage.deleted':   'excluiu a etapa',
    'group.created':   'criou o grupo',
    'group.updated':   'renomeou o grupo',
    'group.deleted':   'excluiu o grupo',
    'member.invited':  'convidou',
    'member.removed':  'removeu o membro',
    'member.joined':   'entrou na empresa',
    'comment.added':   'comentou',
}

export const ENTITY_LABELS: Record<string, string> = {
    Lead:             'Lead',
    Deal:             'Negócio',
    Pipeline:         'Pipeline',
    PipelineStage:    'Etapa',
    PipelineGroup:    'Grupo',
    EnterpriseMember: 'Membro',
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listAuditLogsFn(
    enterpriseId: string,
    cursor?: string,
    entity?: string,
): Promise<AuditPage> {
    const params = new URLSearchParams({ limit: '50' })
    if (cursor) params.set('cursor', cursor)
    if (entity) params.set('entity', entity)

    const { data } = await api.get<AuditPage>(
        `/audit/${enterpriseId}?${params}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListAuditLogs(enterpriseId: string, entity?: string) {
    return useInfiniteQuery({
        queryKey: [...keys.audit.all(enterpriseId), entity],
        queryFn: ({ pageParam }) =>
            listAuditLogsFn(enterpriseId, pageParam as string | undefined, entity),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: !!enterpriseId,
    })
}

async function listLeadAuditLogsFn(
    leadId: string,
    enterpriseId: string,
    cursor?: string,
): Promise<AuditPage> {
    const params = new URLSearchParams({ limit: '30' })
    if (cursor) params.set('cursor', cursor)

    const { data } = await api.get<AuditPage>(
        `/audit/lead/${leadId}?${params}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

export function useListLeadAuditLogs(leadId: string, enterpriseId: string) {
    return useInfiniteQuery({
        queryKey: ['leads', leadId, 'audit'],
        queryFn: ({ pageParam }) =>
            listLeadAuditLogsFn(leadId, enterpriseId, pageParam as string | undefined),
        initialPageParam: undefined as string | undefined,
        getNextPageParam: (last) => last.nextCursor ?? undefined,
        enabled: !!leadId && !!enterpriseId,
    })
}

async function addLeadCommentFn(params: {
    leadId: string
    enterpriseId: string
    comment: string
}): Promise<AuditLog> {
    const { data } = await api.post<AuditLog>(
        `/audit/lead/${params.leadId}/comment`,
        { comment: params.comment, enterpriseId: params.enterpriseId },
        { headers: { 'X-Enterprise-Id': params.enterpriseId } },
    )
    return data
}

export function useAddLeadComment(leadId: string, enterpriseId: string) {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: (comment: string) =>
            addLeadCommentFn({ leadId, enterpriseId, comment }),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['leads', leadId, 'audit'] })
        },
    })
}
