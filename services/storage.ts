'use client'

import { useQuery } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type StorageCategories = {
    multiatendimento: number
    leads: number
    automacoes: number
    outros: number
}

export type StorageUsage = {
    totalLimitMb: number
    planName: string
    additionalStorageMb: number
    categories: StorageCategories
    totalUsedBytes: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Formata bytes para exibição legível (KB, MB, GB) */
export function formatBytes(bytes: number, decimals = 1): string {
    if (bytes === 0) return '0 GB'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB', 'TB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    const value = bytes / Math.pow(k, i)
    return `${value.toFixed(i >= 3 ? decimals : 0)} ${sizes[i]}`
}

/** Converte bytes para GB */
export function bytesToGb(bytes: number): number {
    return bytes / (1024 * 1024 * 1024)
}

/** Converte MB para bytes */
export function mbToBytes(mb: number): number {
    return mb * 1024 * 1024
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function getStorageUsageFn(enterpriseId: string): Promise<StorageUsage> {
    const { data } = await api.get<StorageUsage>(
        `/storage/${enterpriseId}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useStorageUsage(enterpriseId: string) {
    return useQuery({
        queryKey: keys.storage.usage(enterpriseId),
        queryFn: () => getStorageUsageFn(enterpriseId),
        enabled: !!enterpriseId,
        staleTime: 5 * 60 * 1000, // 5 min cache — S3 listing pode ser lento
    })
}
