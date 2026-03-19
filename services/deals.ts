'use client'

import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'
import type { Tag } from '@/services/tags'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DealLead = {
    id: string
    name: string
    email: string | null
    phone: string | null
    image: string | null
    tags: Tag[]
    assignee: { id: string; name: string; image: string | null } | null
}

export type Deal = {
    id: string
    leadId: string
    pipelineId: string
    stageId: string
    title: string
    value: string | null
    createdAt: string
    updatedAt: string
    lead: DealLead
}

export type PipelineStage = {
    id: string
    name: string
    order: number
    color: string | null
    pipelineId: string
}

export type DealWithPipeline = Deal & {
    stage: PipelineStage
    pipeline: {
        id: string
        name: string
        stages: PipelineStage[]
    }
}

export type DealProduct = {
    id: string
    dealId: string
    productId: string
    quantity: number
    unitPrice: number
    product: {
        id: string
        name: string
        price: number
        sku: string | null
        media: { url: string; type: string; isCover: boolean }[]
    }
}

export type StageDealsPage = {
    deals: Deal[]
    total: number
    totalValue: number
    skip: number
    take: number
}

export const PAGE_SIZE = 500

// ─── API ──────────────────────────────────────────────────────────────────────

async function fetchStageDealsFn({
    stageId,
    skip,
    take,
    sort,
    enterpriseId,
}: {
    stageId: string
    skip: number
    take: number
    sort: string
    enterpriseId: string
}): Promise<StageDealsPage> {
    const { data } = await api.get<StageDealsPage>(`/deals/by-stage/${stageId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: { skip, take, sort },
    })
    return data
}

async function createDealFn({
    leadId,
    pipelineId,
    stageId,
    title,
    value,
    enterpriseId,
}: {
    leadId: string
    pipelineId: string
    stageId: string
    title: string
    value?: number | null
    enterpriseId: string
}): Promise<Deal> {
    const { data } = await api.post<Deal>(
        '/deals',
        { leadId, pipelineId, stageId, title, value },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function updateDealFn({
    id,
    enterpriseId,
    title,
    value,
    stageId,
}: {
    id: string
    enterpriseId: string
    title?: string
    value?: number | null
    stageId?: string
}): Promise<Deal> {
    const { data } = await api.patch<Deal>(
        `/deals/${id}`,
        { title, value, stageId },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deleteDealFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/deals/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useStageDeals(
    stageId: string,
    enterpriseId: string,
    sort = 'recent',
) {
    return useInfiniteQuery({
        queryKey: [...keys.deals.byStage(stageId), sort],
        queryFn: ({ pageParam = 0 }) =>
            fetchStageDealsFn({ stageId, skip: pageParam, take: PAGE_SIZE, sort, enterpriseId }),
        getNextPageParam: (lastPage) => {
            const loaded = lastPage.skip + lastPage.deals.length
            if (lastPage.deals.length < PAGE_SIZE) return undefined
            return loaded
        },
        initialPageParam: 0,
        enabled: !!stageId && !!enterpriseId,
    })
}

export function useCreateDeal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createDealFn,
        onSuccess: (_data, { stageId }) => {
            qc.invalidateQueries({ queryKey: keys.deals.byStage(stageId) })
        },
    })
}

export function useUpdateDeal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateDealFn,
        onSuccess: (data, vars) => {
            // Invalida stage original e nova (caso tenha movido)
            qc.invalidateQueries({ queryKey: keys.deals.byStage(data.stageId) })
            if (vars.stageId && vars.stageId !== data.stageId) {
                qc.invalidateQueries({ queryKey: keys.deals.byStage(vars.stageId) })
            }
        },
    })
}

async function fetchLeadDealsFn(leadId: string, enterpriseId: string): Promise<DealWithPipeline[]> {
    const { data } = await api.get<DealWithPipeline[]>(`/deals/by-lead/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

export function useLeadDeals(leadId: string, enterpriseId: string) {
    return useQuery({
        queryKey: ['leads', leadId, 'deals'],
        queryFn: () => fetchLeadDealsFn(leadId, enterpriseId),
        enabled: !!leadId && !!enterpriseId,
    })
}

export function useDeleteDeal() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteDealFn,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['stages'] })
        },
    })
}

// ─── Deal Products ─────────────────────────────────────────────────────────────

async function listDealProductsFn(dealId: string): Promise<DealProduct[]> {
    const { data } = await api.get<DealProduct[]>(`/deals/${dealId}/products`)
    return data
}

async function addDealProductFn({
    dealId,
    productId,
    quantity,
}: {
    dealId: string
    productId: string
    quantity?: number
}): Promise<DealProduct> {
    const { data } = await api.post<DealProduct>(`/deals/${dealId}/products`, { productId, quantity })
    return data
}

async function updateDealProductFn({
    dealId,
    productId,
    quantity,
}: {
    dealId: string
    productId: string
    quantity: number
}): Promise<DealProduct> {
    const { data } = await api.patch<DealProduct>(`/deals/${dealId}/products/${productId}`, { quantity })
    return data
}

async function removeDealProductFn({
    dealId,
    productId,
}: {
    dealId: string
    productId: string
}): Promise<void> {
    await api.delete(`/deals/${dealId}/products/${productId}`)
}

export function useListDealProducts(dealId: string) {
    return useQuery({
        queryKey: keys.deals.products(dealId),
        queryFn: () => listDealProductsFn(dealId),
        enabled: !!dealId,
    })
}

export function useAddDealProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: addDealProductFn,
        onSuccess: (_data, { dealId }) => {
            qc.invalidateQueries({ queryKey: keys.deals.products(dealId) })
        },
    })
}

export function useUpdateDealProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateDealProductFn,
        onSuccess: (_data, { dealId }) => {
            qc.invalidateQueries({ queryKey: keys.deals.products(dealId) })
        },
    })
}

export function useRemoveDealProduct() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: removeDealProductFn,
        onSuccess: (_data, { dealId }) => {
            qc.invalidateQueries({ queryKey: keys.deals.products(dealId) })
        },
    })
}
