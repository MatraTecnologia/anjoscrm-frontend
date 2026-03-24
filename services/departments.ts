'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type DepartmentWorkSchedule = {
    id: string
    name: string
}

export type Department = {
    id: string
    enterpriseId: string
    name: string
    color: string
    workScheduleId: string | null
    workSchedule: DepartmentWorkSchedule | null
    createdAt: string
    updatedAt: string
    _count: { members: number }
}

export type DepartmentMemberUser = {
    id: string
    name: string
    email: string
    image: string | null
}

export type DepartmentMember = {
    id: string
    departmentId: string
    userId: string
    createdAt: string
    user: DepartmentMemberUser
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listDepartmentsFn(enterpriseId: string, search?: string): Promise<Department[]> {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const qs = params.toString() ? `?${params}` : ''
    const { data } = await api.get<Department[]>(
        `/departments/${enterpriseId}${qs}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function createDepartmentFn(payload: {
    enterpriseId: string
    name: string
    color?: string
    workScheduleId?: string | null
}): Promise<Department> {
    const { data } = await api.post<Department>('/departments', payload, {
        headers: { 'X-Enterprise-Id': payload.enterpriseId },
    })
    return data
}

async function updateDepartmentFn(payload: {
    id: string
    enterpriseId: string
    name?: string
    color?: string
    workScheduleId?: string | null
}): Promise<Department> {
    const { id, enterpriseId, ...body } = payload
    const { data } = await api.put<Department>(`/departments/${id}`, body, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteDepartmentFn(payload: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/departments/${payload.id}`, {
        headers: { 'X-Enterprise-Id': payload.enterpriseId },
    })
}

async function listDepartmentMembersFn(
    enterpriseId: string,
    departmentId: string,
): Promise<DepartmentMember[]> {
    const { data } = await api.get<DepartmentMember[]>(
        `/departments/${enterpriseId}/${departmentId}/members`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function addDepartmentMemberFn(payload: {
    enterpriseId: string
    departmentId: string
    userId: string
}): Promise<DepartmentMember> {
    const { data } = await api.post<DepartmentMember>(
        `/departments/${payload.departmentId}/members`,
        { userId: payload.userId },
        { headers: { 'X-Enterprise-Id': payload.enterpriseId } },
    )
    return data
}

async function removeDepartmentMemberFn(payload: {
    enterpriseId: string
    departmentId: string
    userId: string
}): Promise<void> {
    await api.delete(`/departments/${payload.departmentId}/members/${payload.userId}`, {
        headers: { 'X-Enterprise-Id': payload.enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListDepartments(enterpriseId: string, search?: string) {
    return useQuery({
        queryKey: [...(keys.departments?.all?.(enterpriseId) ?? ['departments', enterpriseId]), search],
        queryFn: () => listDepartmentsFn(enterpriseId, search),
        enabled: !!enterpriseId,
    })
}

export function useCreateDepartment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createDepartmentFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId] })
        },
    })
}

export function useUpdateDepartment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateDepartmentFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId] })
        },
    })
}

export function useDeleteDepartment() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteDepartmentFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId] })
        },
    })
}

export function useListDepartmentMembers(enterpriseId: string, departmentId: string) {
    return useQuery({
        queryKey: ['departments', enterpriseId, departmentId, 'members'],
        queryFn: () => listDepartmentMembersFn(enterpriseId, departmentId),
        enabled: !!enterpriseId && !!departmentId,
    })
}

export function useAddDepartmentMember() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: addDepartmentMemberFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId, vars.departmentId, 'members'] })
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId] })
        },
    })
}

export function useRemoveDepartmentMember() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: removeDepartmentMemberFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId, vars.departmentId, 'members'] })
            qc.invalidateQueries({ queryKey: ['departments', vars.enterpriseId] })
        },
    })
}
