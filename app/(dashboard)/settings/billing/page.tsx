'use client'

import { CreditCard, Users, Database, Zap, GitBranch, Bot, Wifi, Loader2 } from 'lucide-react'

import { useEnterprise } from '@/hooks/use-enterprise'
import { useEnterpriseUsage } from '@/services/enterprises'
import { Skeleton } from '@/components/ui/skeleton'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function UsageBar({ used, max, color = 'bg-blue-500' }: { used: number; max: number; color?: string }) {
    const pct = max > 0 ? Math.min((used / max) * 100, 100) : 0
    const isWarning = pct >= 80 && pct < 95
    const isDanger = pct >= 95

    const barColor = isDanger ? 'bg-red-500' : isWarning ? 'bg-amber-500' : color

    return (
        <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
            <div
                className={`h-full rounded-full transition-all duration-500 ${barColor}`}
                style={{ width: `${Math.max(pct, pct > 0 ? 2 : 0)}%` }}
            />
        </div>
    )
}

function UsageRow({
    icon: Icon,
    label,
    used,
    max,
    unlimited = false,
    color,
}: {
    icon: React.ElementType
    label: string
    used: number
    max?: number
    unlimited?: boolean
    color?: string
}) {
    const pct = max && max > 0 ? Math.min((used / max) * 100, 100) : 0
    const isWarning = pct >= 80 && pct < 95
    const isDanger = pct >= 95

    return (
        <div className="flex flex-col gap-1.5 py-3 border-b last:border-b-0">
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Icon className="size-4 text-muted-foreground shrink-0" />
                    <span className="text-sm font-medium">{label}</span>
                </div>
                <div className="flex items-center gap-2">
                    {isDanger && <span className="text-xs text-red-500 font-medium">Limite atingido</span>}
                    {isWarning && <span className="text-xs text-amber-500 font-medium">Quase no limite</span>}
                    <span className="text-sm text-muted-foreground tabular-nums">
                        {unlimited
                            ? <><strong className="text-foreground">{used.toLocaleString('pt-BR')}</strong> / ilimitado</>
                            : <><strong className="text-foreground">{used.toLocaleString('pt-BR')}</strong> / {max?.toLocaleString('pt-BR')}</>
                        }
                    </span>
                </div>
            </div>
            {!unlimited && max !== undefined && (
                <UsageBar used={used} max={max} color={color} />
            )}
        </div>
    )
}

// ─── Skeleton ──────────────────────────────────────────────────────────────────

function BillingSkeleton() {
    return (
        <div className="flex flex-col gap-6">
            <div className="rounded-lg border bg-card p-6 flex flex-col gap-4">
                <Skeleton className="h-5 w-32" />
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                    {Array.from({ length: 4 }).map((_, i) => (
                        <div key={i} className="flex flex-col gap-1.5">
                            <Skeleton className="h-3 w-20" />
                            <Skeleton className="h-6 w-16" />
                        </div>
                    ))}
                </div>
            </div>
            <div className="rounded-lg border bg-card px-6">
                {Array.from({ length: 6 }).map((_, i) => (
                    <div key={i} className="flex items-center justify-between py-3 border-b last:border-b-0">
                        <Skeleton className="h-4 w-28" />
                        <Skeleton className="h-4 w-20" />
                    </div>
                ))}
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function BillingPage() {
    const { enterprise, isLoading: loadingEnt } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const { data: usageData, isLoading: loadingUsage } = useEnterpriseUsage(enterpriseId)

    const isLoading = loadingEnt || loadingUsage

    return (
        <div className="flex flex-col p-8 gap-6 max-w-3xl mx-auto w-full">

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Planos e uso</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Acompanhe o consumo dos recursos do seu plano
                    </p>
                </div>
            </div>

            {isLoading && <BillingSkeleton />}

            {!isLoading && usageData && (
                <>
                    {/* ── Plano atual ──────────────────────────────────── */}
                    <div className="rounded-lg border bg-card p-6">
                        <div className="flex items-center gap-2 mb-4">
                            <CreditCard className="size-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Plano atual</p>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-x-6 gap-y-4">
                            <div>
                                <p className="text-xs text-muted-foreground">Leads</p>
                                <p className="text-lg font-bold mt-0.5">{usageData.limits.maxLeads.toLocaleString('pt-BR')}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Usuários</p>
                                <p className="text-lg font-bold mt-0.5">{usageData.limits.maxUsers}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Conexões</p>
                                <p className="text-lg font-bold mt-0.5">{usageData.limits.maxConnections}</p>
                            </div>
                            <div>
                                <p className="text-xs text-muted-foreground">Pipelines</p>
                                <p className="text-lg font-bold mt-0.5">{usageData.limits.maxPipelines}</p>
                            </div>
                        </div>
                    </div>

                    {/* ── Uso de recursos ──────────────────────────────── */}
                    <div className="rounded-lg border bg-card px-6">
                        <div className="flex items-center gap-2 py-4 border-b">
                            <Database className="size-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Uso de recursos</p>
                        </div>

                        <UsageRow
                            icon={Users}
                            label="Leads"
                            used={usageData.usage.leads}
                            max={usageData.limits.maxLeads}
                            color="bg-blue-500"
                        />
                        <UsageRow
                            icon={Users}
                            label="Usuários"
                            used={usageData.usage.members}
                            max={usageData.limits.maxUsers}
                            color="bg-violet-500"
                        />
                        <UsageRow
                            icon={Wifi}
                            label="Conexões"
                            used={usageData.usage.connections}
                            max={usageData.limits.maxConnections}
                            color="bg-emerald-500"
                        />
                        <UsageRow
                            icon={GitBranch}
                            label="Pipelines"
                            used={usageData.usage.pipelines}
                            max={usageData.limits.maxPipelines}
                            color="bg-amber-500"
                        />
                        <UsageRow
                            icon={Zap}
                            label="Automações"
                            used={usageData.usage.automations}
                            unlimited
                        />
                        <UsageRow
                            icon={Bot}
                            label="Agentes de IA"
                            used={usageData.usage.aiAgents}
                            unlimited
                        />
                    </div>

                    {/* ── Histórico de pagamentos (placeholder) ─────────── */}
                    <div className="rounded-lg border bg-card px-6">
                        <div className="flex items-center gap-2 py-4 border-b">
                            <CreditCard className="size-4 text-muted-foreground" />
                            <p className="text-sm font-semibold">Histórico de pagamentos</p>
                        </div>
                        <div className="flex flex-col items-center gap-2 py-12 text-muted-foreground">
                            <CreditCard className="size-10 opacity-20" />
                            <p className="text-sm">Nenhum pagamento registrado ainda.</p>
                        </div>
                    </div>
                </>
            )}
        </div>
    )
}
