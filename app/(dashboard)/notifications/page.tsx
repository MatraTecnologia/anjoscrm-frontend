'use client'

import { useState } from 'react'
import { formatDistanceToNow } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Bell, Filter } from 'lucide-react'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useListAuditLogs,
    ACTION_LABELS,
    ENTITY_LABELS,
    type AuditLog,
} from '@/services/audit'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Skeleton } from '@/components/ui/skeleton'
import { Separator } from '@/components/ui/separator'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function getInitials(name: string) {
    return name
        .split(' ')
        .slice(0, 2)
        .map((n) => n[0])
        .join('')
        .toUpperCase()
}

function formatAction(log: AuditLog): string {
    const verb = ACTION_LABELS[log.action] ?? log.action
    const name = log.entityName ? `"${log.entityName}"` : ''
    return [verb, name].filter(Boolean).join(' ')
}

const ENTITY_OPTIONS = [
    { value: 'all', label: 'Todas as ações' },
    { value: 'Lead', label: 'Leads' },
    { value: 'Deal', label: 'Negócios' },
    { value: 'Pipeline', label: 'Pipelines' },
    { value: 'PipelineStage', label: 'Etapas' },
    { value: 'PipelineGroup', label: 'Grupos' },
    { value: 'EnterpriseMember', label: 'Membros' },
]

const ENTITY_COLORS: Record<string, string> = {
    Lead: 'bg-blue-500/10 text-blue-600 dark:text-blue-400',
    Deal: 'bg-violet-500/10 text-violet-600 dark:text-violet-400',
    Pipeline: 'bg-amber-500/10 text-amber-600 dark:text-amber-400',
    PipelineStage: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    PipelineGroup: 'bg-orange-500/10 text-orange-600 dark:text-orange-400',
    EnterpriseMember: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400',
}

// ─── Item ─────────────────────────────────────────────────────────────────────

function NotificationItem({ log }: { log: AuditLog }) {
    const entityLabel = ENTITY_LABELS[log.entity] ?? log.entity
    const entityColor = ENTITY_COLORS[log.entity] ?? 'bg-muted text-muted-foreground'

    const isComment = log.action === 'comment.added'
    const commentPreview =
        isComment && typeof log.metadata?.comment === 'string'
            ? log.metadata.comment.slice(0, 100)
            : null

    return (
        <div className="flex gap-3 py-3">
            <Avatar className="size-8 shrink-0 mt-0.5">
                <AvatarImage src={log.user.image ?? undefined} />
                <AvatarFallback className="text-xs">{getInitials(log.user.name)}</AvatarFallback>
            </Avatar>

            <div className="flex flex-col gap-0.5 min-w-0">
                <p className="text-sm leading-snug">
                    <span className="font-medium">{log.user.name}</span>
                    {' '}
                    <span className="text-muted-foreground">{formatAction(log)}</span>
                </p>
                {commentPreview && (
                    <p className="text-xs text-muted-foreground italic truncate max-w-md">
                        {commentPreview}
                    </p>
                )}
                <div className="flex items-center gap-2 mt-0.5">
                    <span className={`text-[11px] px-1.5 py-0.5 rounded font-medium ${entityColor}`}>
                        {entityLabel}
                    </span>
                    <span className="text-xs text-muted-foreground">
                        {formatDistanceToNow(new Date(log.createdAt), { addSuffix: true, locale: ptBR })}
                    </span>
                </div>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function NotificationsPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [entity, setEntity] = useState<string>('all')
    const entityFilter = entity === 'all' ? undefined : entity

    const {
        data,
        isLoading,
        isFetchingNextPage,
        hasNextPage,
        fetchNextPage,
    } = useListAuditLogs(enterpriseId, entityFilter)

    const logs = data?.pages.flatMap((p) => p.logs) ?? []

    return (
        <div className="flex flex-col gap-6 p-6 max-w-2xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                    <Bell className="size-5 text-muted-foreground" />
                    <h1 className="text-xl font-semibold">Notificações</h1>
                </div>

                <div className="flex items-center gap-2">
                    <Filter className="size-4 text-muted-foreground" />
                    <Select value={entity} onValueChange={setEntity}>
                        <SelectTrigger className="w-44 h-8 text-sm">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            {ENTITY_OPTIONS.map((opt) => (
                                <SelectItem key={opt.value} value={opt.value}>
                                    {opt.label}
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>
            </div>

            <Separator />

            {/* Lista */}
            {isLoading ? (
                <div className="flex flex-col gap-3">
                    {Array.from({ length: 8 }).map((_, i) => (
                        <div key={i} className="flex gap-3 py-2">
                            <Skeleton className="size-8 rounded-full shrink-0" />
                            <div className="flex flex-col gap-2 flex-1">
                                <Skeleton className="h-4 w-3/4" />
                                <Skeleton className="h-3 w-1/3" />
                            </div>
                        </div>
                    ))}
                </div>
            ) : logs.length === 0 ? (
                <div className="flex flex-col items-center gap-2 py-16 text-muted-foreground">
                    <Bell className="size-10 opacity-30" />
                    <p className="text-sm">Nenhuma atividade registrada ainda.</p>
                </div>
            ) : (
                <div className="flex flex-col divide-y divide-border/50">
                    {logs.map((log) => (
                        <NotificationItem key={log.id} log={log} />
                    ))}
                </div>
            )}

            {/* Carregar mais */}
            {hasNextPage && (
                <div className="flex justify-center pt-2">
                    <Button
                        variant="outline"
                        size="sm"
                        onClick={() => fetchNextPage()}
                        disabled={isFetchingNextPage}
                    >
                        {isFetchingNextPage ? 'Carregando...' : 'Carregar mais'}
                    </Button>
                </div>
            )}
        </div>
    )
}
