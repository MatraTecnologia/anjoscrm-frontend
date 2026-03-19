'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type Enterprise = {
    id: string
    name: string
    slug: string
    logo: string | null
    role: string
    maxUsers: number
    maxLeads: number
    maxPipelines: number
    maxConnections: number
}

export type EnterpriseDetail = {
    id: string
    name: string
    logo: string | null
    email: string | null
    niche: string | null
    phone: string | null
    documentType: string | null
    document: string | null
    country: string | null
    zipCode: string | null
    address: string | null
    addressNumber: string | null
    complement: string | null
    neighborhood: string | null
    city: string | null
    state: string | null
    maxUsers: number
    maxLeads: number
    maxPipelines: number
    maxConnections: number
    createdAt: string
    updatedAt: string
}

export type UpdateEnterprisePayload = Partial<Omit<EnterpriseDetail, 'id' | 'maxUsers' | 'maxLeads' | 'maxPipelines' | 'maxConnections' | 'createdAt' | 'updatedAt'>>

export type PendingInvite = {
    token: string
    enterpriseName: string
    invitedBy: string
}

export type VerifyData = {
    enterprises: Enterprise[]
    pendingInvites: PendingInvite[]
}

export type CreateEnterprisePayload = {
    name: string
}

// ─── API (privado) ─────────────────────────────────────────────────────────────

async function verifyFn(): Promise<VerifyData> {
    const { data } = await api.get<VerifyData>('/enterprises/verify')
    return data
}

async function createEnterpriseFn(payload: CreateEnterprisePayload): Promise<Enterprise> {
    const { data } = await api.post<Enterprise>('/enterprises', payload)
    return data
}

async function acceptInviteFn(token: string): Promise<void> {
    await api.post(`/enterprises/invite/${token}/accept`)
}

async function getEnterpriseFn(id: string): Promise<EnterpriseDetail> {
    const { data } = await api.get<EnterpriseDetail>(`/enterprises/${id}`, {
        headers: { 'X-Enterprise-Id': id },
    })
    return data
}

async function updateEnterpriseFn({
    id,
    payload,
}: {
    id: string
    payload: UpdateEnterprisePayload
}): Promise<EnterpriseDetail> {
    const { data } = await api.patch<EnterpriseDetail>(`/enterprises/${id}`, payload, {
        headers: { 'X-Enterprise-Id': id },
    })
    return data
}

async function uploadLogoFn({
    id,
    file,
}: {
    id: string
    file: File
}): Promise<EnterpriseDetail> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<EnterpriseDetail>(`/enterprises/${id}/logo`, form, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-Enterprise-Id': id },
    })
    return data
}

async function uploadAvatarFn(file: File): Promise<{ imageUrl: string }> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<{ imageUrl: string }>('/users/me/avatar', form, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useVerify() {
    return useQuery({
        queryKey: keys.enterprises.verify(),
        queryFn: verifyFn,
        retry: false,
        staleTime: 0,
    })
}

export function useCreateEnterprise() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createEnterpriseFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.verify() })
        },
    })
}

export function useAcceptInvite() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: acceptInviteFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.verify() })
        },
    })
}

export function useEnterpriseDetail(id: string) {
    return useQuery({
        queryKey: keys.enterprises.detail(id),
        queryFn: () => getEnterpriseFn(id),
        enabled: !!id,
    })
}

export function useUpdateEnterprise() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateEnterpriseFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.enterprises.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.enterprises.verify() })
        },
    })
}

export function useUploadLogo() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadLogoFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.enterprises.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.enterprises.verify() })
        },
    })
}

export function useUploadAvatar() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadAvatarFn,
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.auth.session() })
        },
    })
}

// ─── Members & Roles types ────────────────────────────────────────────────────

export type EnterpriseMember = {
    id: string
    userId: string
    enterpriseId: string
    roleId: string
    createdAt: string
    user: {
        id: string
        name: string
        email: string
        image: string | null
        phone: string | null
        createdAt: string
    }
    role: {
        id: string
        name: string
        permissions: string[]
    }
}

export type EnterpriseRole = {
    id: string
    enterpriseId: string
    name: string
    permissions: string[]
    isSystem: boolean
    createdAt: string
    _count: { members: number }
}

export type CreateRolePayload = {
    name: string
    permissions: string[]
}

export type CreateInvitePayload = {
    email?: string | null
    roleId: string
}

export type InviteResponse = {
    id: string
    token: string
    email: string | null
    roleId: string
    enterpriseId: string
    expiresAt: string
    createdAt: string
    inviteUrl: string
}

// ─── Members & Roles API ──────────────────────────────────────────────────────

async function getMembersFn(enterpriseId: string): Promise<EnterpriseMember[]> {
    const { data } = await api.get<EnterpriseMember[]>(`/enterprises/${enterpriseId}/members`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getRolesFn(enterpriseId: string): Promise<EnterpriseRole[]> {
    const { data } = await api.get<EnterpriseRole[]>(`/enterprises/${enterpriseId}/roles`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function createRoleFn({ enterpriseId, payload }: { enterpriseId: string; payload: CreateRolePayload }): Promise<EnterpriseRole> {
    const { data } = await api.post<EnterpriseRole>(`/enterprises/${enterpriseId}/roles`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteRoleFn({ enterpriseId, roleId }: { enterpriseId: string; roleId: string }): Promise<void> {
    await api.delete(`/enterprises/${enterpriseId}/roles/${roleId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function createInviteFn({ enterpriseId, payload }: { enterpriseId: string; payload: CreateInvitePayload }): Promise<InviteResponse> {
    const { data } = await api.post<InviteResponse>(`/enterprises/${enterpriseId}/invites`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function removeMemberFn({ enterpriseId, memberId }: { enterpriseId: string; memberId: string }): Promise<void> {
    await api.delete(`/enterprises/${enterpriseId}/members/${memberId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function updateMemberRoleFn({ enterpriseId, memberId, roleId }: { enterpriseId: string; memberId: string; roleId: string }): Promise<void> {
    await api.patch(`/enterprises/${enterpriseId}/members/${memberId}`, { roleId }, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

// ─── Members & Roles Hooks ────────────────────────────────────────────────────

export function useMembers(enterpriseId: string) {
    return useQuery({
        queryKey: keys.enterprises.members(enterpriseId),
        queryFn: () => getMembersFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useRoles(enterpriseId: string) {
    return useQuery({
        queryKey: keys.enterprises.roles(enterpriseId),
        queryFn: () => getRolesFn(enterpriseId),
        enabled: !!enterpriseId,
    })
}

export function useCreateRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createRoleFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.roles(enterpriseId) })
        },
    })
}

export function useDeleteRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteRoleFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.roles(enterpriseId) })
        },
    })
}

export function useCreateInvite() {
    return useMutation({
        mutationFn: createInviteFn,
    })
}

export function useRemoveMember() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: removeMemberFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.members(enterpriseId) })
        },
    })
}

export function useUpdateMemberRole() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateMemberRoleFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.enterprises.members(enterpriseId) })
        },
    })
}
