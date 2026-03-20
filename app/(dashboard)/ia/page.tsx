'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import {
    Plus, Bot, Trash2, Loader2, Power, MessageSquare,
    Plug, GitBranch, ChevronRight,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useListAiAgents, useDeleteAiAgent, useToggleAiAgent,
    type AiAgent,
} from '@/services/ai-agents'
import { cn } from '@/lib/utils'

// ─── Provider badge ───────────────────────────────────────────────────────────

function ProviderBadge({ provider }: { provider: string }) {
    const map: Record<string, string> = {
        openai: 'OpenAI',
        anthropic: 'Anthropic',
        google: 'Google',
    }
    return (
        <Badge variant="outline" className="text-xs font-normal">
            {map[provider] ?? provider}
        </Badge>
    )
}

// ─── Agent card ───────────────────────────────────────────────────────────────

function AgentCard({
    agent,
    enterpriseId,
    onDelete,
}: {
    agent: AiAgent
    enterpriseId: string
    onDelete: (a: AiAgent) => void
}) {
    const router = useRouter()
    const { mutate: toggle, isPending: toggling } = useToggleAiAgent()

    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation()
        toggle({ id: agent.id, enterpriseId }, {
            onSuccess: (updated) => toast.success(updated.isActive ? 'IA ativada' : 'IA pausada'),
            onError: () => toast.error('Erro ao alterar status da IA'),
        })
    }

    return (
        <div
            className="flex items-center gap-4 rounded-lg border bg-card p-4 hover:bg-muted/20 transition-colors cursor-pointer group"
            onClick={() => router.push(`/ia/${agent.id}`)}
        >
            {/* Ícone */}
            <div className={cn(
                'flex size-10 shrink-0 items-center justify-center rounded-lg',
                agent.isActive ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
            )}>
                <Bot className="size-5" />
            </div>

            {/* Info */}
            <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap">
                    <p className="text-sm font-medium truncate">{agent.name}</p>
                    <ProviderBadge provider={agent.provider} />
                    {agent.isActive ? (
                        <Badge className="gap-1 bg-green-500/10 text-green-600 border-green-500/20 hover:bg-green-500/10 text-xs">
                            <span className="size-1.5 rounded-full bg-green-500 animate-pulse" />
                            Ativo
                        </Badge>
                    ) : (
                        <Badge variant="secondary" className="text-xs">Pausado</Badge>
                    )}
                </div>
                <div className="flex items-center gap-3 mt-1 flex-wrap">
                    {agent.connection && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <Plug className="size-3" />
                            {agent.connection.name}
                        </span>
                    )}
                    {agent.pipeline && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <GitBranch className="size-3" />
                            {agent.pipeline.name}
                        </span>
                    )}
                    {agent._count.leadStates > 0 && (
                        <span className="flex items-center gap-1 text-xs text-muted-foreground">
                            <MessageSquare className="size-3" />
                            {agent._count.leadStates} lead{agent._count.leadStates !== 1 ? 's' : ''}
                        </span>
                    )}
                </div>
            </div>

            {/* Ações */}
            <div className="flex items-center gap-1.5 shrink-0">
                <Button
                    size="sm"
                    variant="outline"
                    className={cn('h-7 text-xs gap-1.5', agent.isActive ? 'text-amber-600 border-amber-300 hover:bg-amber-50' : '')}
                    onClick={handleToggle}
                    disabled={toggling || !agent.hasApiKey}
                    title={!agent.hasApiKey ? 'Configure a API Key primeiro' : undefined}
                >
                    {toggling
                        ? <Loader2 className="size-3.5 animate-spin" />
                        : <Power className="size-3.5" />
                    }
                    {agent.isActive ? 'Pausar' : 'Ativar'}
                </Button>

                <Button
                    size="icon"
                    variant="ghost"
                    className="size-7 text-muted-foreground hover:text-destructive"
                    onClick={e => { e.stopPropagation(); onDelete(agent) }}
                >
                    <Trash2 className="size-3.5" />
                </Button>

                <ChevronRight className="size-4 text-muted-foreground/50 group-hover:text-muted-foreground transition-colors" />
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function IaPage() {
    const router = useRouter()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [deleteTarget, setDeleteTarget] = useState<AiAgent | null>(null)

    const { data: agents = [], isLoading } = useListAiAgents(enterpriseId)
    const { mutate: remove, isPending: deleting } = useDeleteAiAgent()

    function confirmDelete() {
        if (!deleteTarget) return
        remove({ id: deleteTarget.id, enterpriseId }, {
            onSuccess: () => { toast.success('IA removida.'); setDeleteTarget(null) },
            onError: () => toast.error('Erro ao remover IA.'),
        })
    }

    return (
        <div className="flex flex-col h-full">

            {/* ── Header ─────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-6 py-4 border-b shrink-0">
                <div>
                    <h1 className="text-xl font-semibold">Minhas IAs</h1>
                    <p className="text-sm text-muted-foreground">
                        Agentes de IA para qualificação e atendimento automático
                    </p>
                </div>
                <Button onClick={() => router.push('/ia/criar')} className="gap-1.5">
                    <Plus className="size-4" />
                    Novo agente
                </Button>
            </div>

            {/* ── Stats ──────────────────────────────────────────────────── */}
            {!isLoading && agents.length > 0 && (
                <div className="flex items-center gap-4 px-6 py-3 border-b shrink-0">
                    <span className="text-sm text-muted-foreground">
                        {agents.length} agente{agents.length !== 1 ? 's' : ''}
                    </span>
                    <div className="flex items-center gap-3">
                        <span className="flex items-center gap-1.5 text-xs text-green-600">
                            <span className="size-1.5 rounded-full bg-green-500" />
                            {agents.filter(a => a.isActive).length} ativo{agents.filter(a => a.isActive).length !== 1 ? 's' : ''}
                        </span>
                        <span className="text-xs text-muted-foreground">
                            {agents.filter(a => !a.isActive).length} pausado{agents.filter(a => !a.isActive).length !== 1 ? 's' : ''}
                        </span>
                    </div>
                </div>
            )}

            {/* ── Content ────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6">
                {isLoading ? (
                    <div className="flex items-center justify-center h-40">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : agents.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-52 gap-4 text-center">
                        <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                            <Bot className="size-6 text-muted-foreground" />
                        </div>
                        <div>
                            <p className="text-sm font-medium">Nenhum agente IA ainda</p>
                            <p className="text-sm text-muted-foreground mt-1">
                                Crie seu primeiro agente para automatizar o atendimento via WhatsApp
                            </p>
                        </div>
                        <Button onClick={() => router.push('/ia/criar')} className="gap-1.5">
                            <Plus className="size-4" />
                            Novo agente
                        </Button>
                    </div>
                ) : (
                    <div className="grid gap-3 max-w-2xl">
                        {agents.map(agent => (
                            <AgentCard
                                key={agent.id}
                                agent={agent}
                                enterpriseId={enterpriseId}
                                onDelete={setDeleteTarget}
                            />
                        ))}
                    </div>
                )}
            </div>

            {/* ── Delete dialog ──────────────────────────────────────────── */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover agente IA?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja remover <strong>{deleteTarget?.name}</strong>?
                            {' '}Todos os documentos, regras e histórico de leads serão excluídos.
                            Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={confirmDelete}
                            disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {deleting
                                ? <><Loader2 className="size-4 animate-spin mr-1" /> Removendo...</>
                                : 'Remover'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
