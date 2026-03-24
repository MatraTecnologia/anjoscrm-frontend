'use client'

import { Info, Loader2 } from 'lucide-react'
import Link from 'next/link'

import { Button } from '@/components/ui/button'
import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useStorageUsage, formatBytes, mbToBytes,
    type StorageCategories,
} from '@/services/storage'

// ─── Category config ──────────────────────────────────────────────────────────

const CATEGORIES: {
    key: keyof StorageCategories
    label: string
    color: string
}[] = [
    { key: 'multiatendimento', label: 'Multiatendimento', color: '#3b82f6' },
    { key: 'leads',            label: 'Leads',            color: '#22c55e' },
    { key: 'automacoes',       label: 'Automações',       color: '#f97316' },
    { key: 'outros',           label: 'Outros',           color: '#a855f7' },
]

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function StorageSettingsPage() {
    const { enterprise } = useEnterprise()
    const { data, isLoading } = useStorageUsage(enterprise?.id ?? '')

    const totalLimitBytes = data ? mbToBytes(data.totalLimitMb) : 0
    const totalUsed = data?.totalUsedBytes ?? 0
    const usedPct = totalLimitBytes > 0 ? Math.min((totalUsed / totalLimitBytes) * 100, 100) : 0
    const additionalBytes = data ? mbToBytes(data.additionalStorageMb) : 0

    return (
        <div className="flex flex-col p-8 gap-6 max-w-3xl mx-auto w-full">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div>
                <h1 className="text-xl font-semibold">Armazenamento</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Gerencie o armazenamento da sua conta e contrate armazenamento extra quando necessário
                </p>
            </div>

            {isLoading && (
                <div className="flex items-center justify-center py-20">
                    <Loader2 className="size-6 animate-spin text-muted-foreground" />
                </div>
            )}

            {data && (
                <>
                    {/* ── Card 1: Plano e Limites ───────────────────────────── */}
                    <div className="rounded-lg border bg-card">
                        {/* Top row */}
                        <div className="flex items-center justify-between px-6 py-4 border-b">
                            <div className="flex items-baseline gap-2">
                                <span className="text-sm text-muted-foreground">Total de armazenamento</span>
                                <span className="text-xl font-semibold text-blue-600 dark:text-blue-400">
                                    {formatBytes(totalLimitBytes, 0)}
                                </span>
                            </div>
                            <Link href="/settings/billing">
                                <Button variant="outline" size="sm">
                                    Gerenciar planos e uso
                                </Button>
                            </Link>
                        </div>

                        {/* Bottom row: Plan vs Additional */}
                        <div className="grid grid-cols-2 divide-x">
                            <div className="px-6 py-4">
                                <p className="text-sm font-medium mb-3">Armazenamento do plano</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Plano contratado</p>
                                        <p className="text-sm font-semibold mt-0.5">{data.planName}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Limite do plano</p>
                                        <p className="text-sm font-semibold mt-0.5">{formatBytes(totalLimitBytes, 0)}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="px-6 py-4">
                                <p className="text-sm font-medium mb-3">Armazenamento adicional</p>
                                <div className="grid grid-cols-2 gap-4">
                                    <div>
                                        <p className="text-xs text-muted-foreground">Adicional contratado</p>
                                        <p className="text-sm font-semibold mt-0.5">{formatBytes(additionalBytes, 0)}</p>
                                    </div>
                                    <div>
                                        <p className="text-xs text-muted-foreground">Frequência</p>
                                        <p className="text-sm font-semibold mt-0.5">-</p>
                                    </div>
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* ── Card 2: Consumo por categoria ─────────────────────── */}
                    <div className="rounded-lg border bg-card px-6 py-5">
                        {/* Header */}
                        <div className="flex items-center justify-between mb-4">
                            <p className="text-sm font-medium">Consumo por categoria</p>
                            <span className="text-sm text-muted-foreground">
                                {formatBytes(totalUsed)} / {formatBytes(totalLimitBytes, 0)}
                            </span>
                        </div>

                        {/* Progress bar */}
                        <div className="h-3 rounded-full bg-muted overflow-hidden mb-5">
                            {usedPct > 0 && (
                                <div className="h-full rounded-full bg-gradient-to-r from-blue-500 via-green-500 to-orange-500 transition-all duration-500"
                                    style={{
                                        width: `${Math.max(usedPct, 1)}%`,
                                    }}
                                />
                            )}
                        </div>

                        {/* Categories */}
                        <div className="flex flex-col gap-3">
                            {CATEGORIES.map(({ key, label, color }) => {
                                const bytes = data.categories[key]
                                const pct = totalLimitBytes > 0 ? (bytes / totalLimitBytes) * 100 : 0

                                return (
                                    <div key={key} className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2.5 rounded-full shrink-0"
                                                style={{ backgroundColor: color }}
                                            />
                                            <span className="text-sm">{label}</span>
                                        </div>
                                        <span className="text-sm text-muted-foreground">
                                            {formatBytes(bytes)} • {pct.toFixed(1)}%
                                        </span>
                                    </div>
                                )
                            })}
                        </div>
                    </div>

                    {/* ── Footer note ────────────────────────────────────────── */}
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                        <Info className="size-4 shrink-0" />
                        <span>Em breve você poderá gerenciar o armazenamento e efetuar limpeza.</span>
                    </div>
                </>
            )}
        </div>
    )
}
