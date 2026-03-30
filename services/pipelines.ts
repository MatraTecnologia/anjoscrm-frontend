'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type PipelineStage = {
    id: string
    pipelineId: string
    name: string
    color: string
    order: number
    description: string | null
    aiInstructions: string | null
    createdAt: string
    _count?: { deals: number }
    followUpConfig?: StageFollowUpConfig | null
}

export type Pipeline = {
    id: string
    enterpriseId: string
    groupId: string | null
    name: string
    description: string | null
    color: string
    order: number
    createdAt: string
    stages: PipelineStage[]
    _count?: { stages: number; deals: number }
    isBilateral?: boolean
    kommoCredentialId?: string | null
    webhookToken?: string | null
}

export type BilateralConfig = {
    isBilateral: boolean
    kommoCredentialId: string | null
    kommoPipelineId: number | null
    webhookToken: string | null
    webhookUrl: string | null
}

export type KommoPipelineStatus = {
    id: number
    name: string
    color: string
}

export type KommoPipelineOption = {
    id: number
    name: string
    statuses: KommoPipelineStatus[]
}

export type PipelineGroup = {
    id: string
    enterpriseId: string
    name: string
    order: number
    createdAt: string
    pipelines: Pipeline[]
}

// ─── API — Groups ──────────────────────────────────────────────────────────────

async function listGroupsFn(enterpriseId: string): Promise<PipelineGroup[]> {
    const { data } = await api.get<PipelineGroup[]>(`/pipelines/groups/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createGroupFn({
    enterpriseId,
    name,
}: {
    enterpriseId: string
    name: string
}): Promise<PipelineGroup> {
    const { data } = await api.post<PipelineGroup>(
        `/pipelines/groups/${enterpriseId}`,
        { name },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function updateGroupFn({
    id,
    enterpriseId,
    name,
}: {
    id: string
    enterpriseId: string
    name?: string
}): Promise<PipelineGroup> {
    const { data } = await api.patch<PipelineGroup>(
        `/pipelines/groups/${id}`,
        { name },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deleteGroupFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/pipelines/groups/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function reorderGroupsFn({
    enterpriseId,
    items,
}: {
    enterpriseId: string
    items: { id: string; order: number }[]
}): Promise<void> {
    await api.patch('/pipelines/groups-reorder', items, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function reorderPipelinesFn({
    enterpriseId,
    items,
}: {
    enterpriseId: string
    items: { id: string; order: number; groupId?: string | null }[]
}): Promise<void> {
    await api.patch('/pipelines/reorder', items, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── API — Pipelines ──────────────────────────────────────────────────────────

async function listPipelinesFn(enterpriseId: string): Promise<Pipeline[]> {
    const { data } = await api.get<Pipeline[]>(`/pipelines/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getPipelineFn(id: string, enterpriseId: string): Promise<Pipeline> {
    const { data } = await api.get<Pipeline>(`/pipelines/detail/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createPipelineFn({
    enterpriseId,
    name,
    color,
    description,
    groupId,
}: {
    enterpriseId: string
    name: string
    color?: string
    description?: string
    groupId?: string | null
}): Promise<Pipeline> {
    const { data } = await api.post<Pipeline>(
        `/pipelines/${enterpriseId}`,
        { name, color, description, groupId },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function updatePipelineFn({
    id,
    enterpriseId,
    name,
    color,
    description,
    groupId,
}: {
    id: string
    enterpriseId: string
    name?: string
    color?: string
    description?: string
    groupId?: string | null
}): Promise<Pipeline> {
    const { data } = await api.patch<Pipeline>(
        `/pipelines/${id}`,
        { name, color, description, groupId },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deletePipelineFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/pipelines/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function migrateKpiStagesFn(enterpriseId: string): Promise<{ message: string; added: number }> {
    const { data } = await api.post<{ message: string; added: number }>(
        `/pipelines/migrate-kpi-stages/${enterpriseId}`,
        {},
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── API — Stages ─────────────────────────────────────────────────────────────

async function createStageFn({
    pipelineId,
    enterpriseId,
    name,
    color,
    description,
    aiInstructions,
    kommoStatusId,
}: {
    pipelineId: string
    enterpriseId: string
    name: string
    color?: string
    description?: string
    aiInstructions?: string
    kommoStatusId?: number
}): Promise<PipelineStage> {
    const { data } = await api.post<PipelineStage>(
        `/pipelines/${pipelineId}/stages`,
        { name, color, description, aiInstructions, kommoStatusId },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function updateStageFn({
    stageId,
    enterpriseId,
    name,
    color,
    order,
    description,
    aiInstructions,
}: {
    stageId: string
    enterpriseId: string
    name?: string
    color?: string
    order?: number
    description?: string | null
    aiInstructions?: string | null
}): Promise<PipelineStage> {
    const { data } = await api.patch<PipelineStage>(
        `/pipelines/stages/${stageId}`,
        { name, color, order, description, aiInstructions },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deleteStageFn({
    stageId,
    enterpriseId,
}: {
    stageId: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/pipelines/stages/${stageId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks — Groups ───────────────────────────────────────────────────────────

export function useListGroups(enterpriseId: string) {
    return useQuery({
        queryKey: keys.pipelines.groups(enterpriseId),
        queryFn: () => listGroupsFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useCreateGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createGroupFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

export function useUpdateGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateGroupFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

export function useDeleteGroup() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteGroupFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
        },
    })
}

export function useReorderGroups() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: reorderGroupsFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

export function useReorderPipelines() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: reorderPipelinesFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

// ─── Hooks — Pipelines ────────────────────────────────────────────────────────

export function useListPipelines(enterpriseId: string) {
    return useQuery({
        queryKey: keys.pipelines.all(enterpriseId),
        queryFn: () => listPipelinesFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useGetPipeline(id: string, enterpriseId: string) {
    return useQuery({
        queryKey: keys.pipelines.detail(id),
        queryFn: () => getPipelineFn(id, enterpriseId),
        enabled: !!id && !!enterpriseId,
    })
}

export function useCreatePipeline() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createPipelineFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

export function useUpdatePipeline() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updatePipelineFn,
        onSuccess: (data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.detail(data.id) })
        },
    })
}

export function useDeletePipeline() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deletePipelineFn,
        onSuccess: (_data, { enterpriseId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

export function useMigrateKpiStages() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: migrateKpiStagesFn,
        onSuccess: (_data, enterpriseId) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.all(enterpriseId) })
            qc.invalidateQueries({ queryKey: keys.pipelines.groups(enterpriseId) })
        },
    })
}

// ─── Hooks — Stages ───────────────────────────────────────────────────────────

export function useCreateStage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createStageFn,
        onSuccess: (_data, { pipelineId }) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.detail(pipelineId) })
        },
    })
}

export function useUpdateStage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateStageFn,
        onSuccess: (data) => {
            qc.invalidateQueries({ queryKey: keys.pipelines.detail(data.pipelineId) })
        },
    })
}

export function useDeleteStage() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteStageFn,
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: ['pipelines'] })
        },
    })
}

// ─── Types — Follow-up Config ─────────────────────────────────────────────────

export type FollowUpActionType = 'SEND_MESSAGE' | 'MOVE_STAGE' | 'ASSIGN' | 'WEBHOOK' | 'CREATE_TASK'

export type FollowUpAction = {
    type: FollowUpActionType
    config: Record<string, unknown>
}

export type FollowUpStep = {
    stepNumber: number
    delayMinutes: number
    label?: string
    actions: FollowUpAction[]
}

export type StageFollowUpConfig = {
    id: string
    stageId: string
    isActive: boolean
    steps: FollowUpStep[]
    createdAt: string
}

export type FollowUpBoardDeal = {
    id: string
    title: string
    lead: { id: string; name: string; phone: string | null }
    stage: { id: string; name: string; color: string }
    followUpCount: number
    totalSteps: number
    nextStepLabel: string
    nextStepActions: string[]
    nextStepDueAt: string
}

export type FollowUpBoardData = {
    overdue: FollowUpBoardDeal[]
    today: FollowUpBoardDeal[]
    tomorrow: FollowUpBoardDeal[]
    this_week: FollowUpBoardDeal[]
    future: FollowUpBoardDeal[]
}

// ─── API — Follow-up Config ───────────────────────────────────────────────────

async function getStageFollowUpConfigFn(stageId: string, enterpriseId: string): Promise<StageFollowUpConfig | null> {
    const { data, status } = await api.get<StageFollowUpConfig>(
        `/pipelines/stages/${stageId}/follow-up-config`,
        { headers: { 'X-Enterprise-Id': enterpriseId }, validateStatus: (s) => s < 500 },
    )
    if (status === 204) return null
    return data
}

async function upsertStageFollowUpConfigFn({
    stageId,
    enterpriseId,
    ...body
}: {
    stageId: string
    enterpriseId: string
    isActive: boolean
    steps: FollowUpStep[]
}): Promise<StageFollowUpConfig> {
    const { data } = await api.put<StageFollowUpConfig>(
        `/pipelines/stages/${stageId}/follow-up-config`,
        body,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function getPipelineFollowUpBoardFn(pipelineId: string, enterpriseId: string): Promise<FollowUpBoardData> {
    const { data } = await api.get<FollowUpBoardData>(
        `/pipelines/${pipelineId}/follow-up/board`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Hooks — Follow-up Config ─────────────────────────────────────────────────

export function useGetStageFollowUpConfig(stageId: string, enterpriseId: string) {
    return useQuery({
        queryKey: ['pipelines', 'stages', stageId, 'follow-up-config'],
        queryFn: () => getStageFollowUpConfigFn(stageId, enterpriseId),
        enabled: !!stageId && !!enterpriseId,
    })
}

export function useUpsertStageFollowUpConfig() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: upsertStageFollowUpConfigFn,
        onSuccess: (_data, { stageId }) => {
            qc.invalidateQueries({ queryKey: ['pipelines', 'stages', stageId, 'follow-up-config'] })
            qc.invalidateQueries({ queryKey: ['pipelines', 'follow-up-board'] })
        },
    })
}

export function useGetPipelineFollowUpBoard(pipelineId: string, enterpriseId: string) {
    return useQuery({
        queryKey: ['pipelines', 'follow-up-board', pipelineId],
        queryFn: () => getPipelineFollowUpBoardFn(pipelineId, enterpriseId),
        enabled: !!pipelineId && !!enterpriseId,
        refetchInterval: 60000, // atualiza a cada minuto
    })
}

// ─── API — Bilateral Kommo ────────────────────────────────────────────────────

async function getBilateralConfigFn(pipelineId: string, enterpriseId: string): Promise<BilateralConfig> {
    const { data } = await api.get<BilateralConfig>(
        `/pipelines/${pipelineId}/bilateral`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function activateBilateralFn({
    pipelineId,
    enterpriseId,
    kommoCredentialId,
    kommoPipelineId,
}: {
    pipelineId: string
    enterpriseId: string
    kommoCredentialId: string
    kommoPipelineId?: number | null
}): Promise<BilateralConfig> {
    const { data } = await api.post<BilateralConfig>(
        `/pipelines/${pipelineId}/bilateral`,
        { kommoCredentialId, ...(kommoPipelineId != null && { kommoPipelineId }) },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function listKommoPipelinesFn(credentialId: string, enterpriseId: string): Promise<KommoPipelineOption[]> {
    const { data } = await api.get<KommoPipelineOption[]>(
        `/pipelines/bilateral/kommo-pipelines?credentialId=${credentialId}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function deactivateBilateralFn({
    pipelineId,
    enterpriseId,
}: {
    pipelineId: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/pipelines/${pipelineId}/bilateral`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Hooks — Bilateral ────────────────────────────────────────────────────────

export function useGetBilateralConfig(pipelineId: string, enterpriseId: string) {
    return useQuery({
        queryKey: ['pipelines', pipelineId, 'bilateral'],
        queryFn: () => getBilateralConfigFn(pipelineId, enterpriseId),
        enabled: !!pipelineId && !!enterpriseId,
    })
}

export function useActivateBilateral() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: activateBilateralFn,
        onSuccess: (_data, { pipelineId }) => {
            qc.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'bilateral'] })
        },
    })
}

export function useDeactivateBilateral() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deactivateBilateralFn,
        onSuccess: (_data, { pipelineId }) => {
            qc.invalidateQueries({ queryKey: ['pipelines', pipelineId, 'bilateral'] })
        },
    })
}

export function useKommoPipelines(credentialId: string | null, enterpriseId: string) {
    return useQuery({
        queryKey: ['kommo-pipelines', credentialId],
        queryFn: () => listKommoPipelinesFn(credentialId!, enterpriseId),
        enabled: !!credentialId && credentialId !== 'none' && !!enterpriseId,
        staleTime: 60_000,
    })
}
