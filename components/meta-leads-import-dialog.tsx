'use client'

import { useState } from 'react'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { Loader2, Download, CheckSquare, Square, RefreshCw, UserCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { cn } from '@/lib/utils'

import {
    useGetMetaFormLeads,
    useImportMetaFormLeads,
    type MetaFormLead,
} from '@/services/meta'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function extractDisplay(lead: MetaFormLead) {
    const f = lead.fields
    const name  = f['full_name'] || f['name'] || f['nome'] || ''
    const email = f['email'] || ''
    const phone = f['phone_number'] || f['phone'] || f['telefone'] || ''
    return { name: name || email || phone || `Lead ${lead.id.slice(-6)}`, email, phone }
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    enterpriseId: string
    pipelineId: string
    formName: string
}

// ─── Component ────────────────────────────────────────────────────────────────

export function MetaLeadsImportDialog({ open, onOpenChange, enterpriseId, pipelineId, formName }: Props) {
    const [selected, setSelected] = useState<Set<string>>(new Set())

    const { data, isFetching, refetch } = useGetMetaFormLeads(enterpriseId, pipelineId, open)
    const importLeads = useImportMetaFormLeads()

    const leads = data?.leads ?? []
    const newLeads = leads.filter(l => !l.isImported)
    const allNewSelected = newLeads.length > 0 && newLeads.every(l => selected.has(l.id))

    function toggleAll() {
        if (allNewSelected) {
            setSelected(new Set())
        } else {
            setSelected(new Set(newLeads.map(l => l.id)))
        }
    }

    function toggle(id: string) {
        setSelected(prev => {
            const next = new Set(prev)
            next.has(id) ? next.delete(id) : next.add(id)
            return next
        })
    }

    function handleImport() {
        const metaLeadIds = [...selected]
        if (!metaLeadIds.length) return

        importLeads.mutate(
            { enterpriseId, pipelineId, metaLeadIds },
            {
                onSuccess: (result) => {
                    const parts = []
                    if (result.imported > 0) parts.push(`${result.imported} importado(s)`)
                    if (result.skipped  > 0) parts.push(`${result.skipped} já importado(s)`)
                    if (result.failed   > 0) parts.push(`${result.failed} falhou`)
                    toast.success(parts.join(' · '))
                    setSelected(new Set())
                    refetch()
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] flex flex-col gap-0 p-0">
                <DialogHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <DialogTitle className="flex items-center gap-2">
                        <Download className="size-4 text-primary" />
                        Importar leads antigos
                    </DialogTitle>
                    <p className="text-xs text-muted-foreground mt-1 truncate">
                        Formulário: <span className="font-medium text-foreground">{formName}</span>
                    </p>
                </DialogHeader>

                {/* Toolbar */}
                <div className="flex items-center justify-between px-6 py-2.5 border-b bg-muted/30 shrink-0">
                    <button
                        onClick={toggleAll}
                        disabled={newLeads.length === 0}
                        className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground disabled:opacity-40 transition-colors"
                    >
                        {allNewSelected
                            ? <CheckSquare className="size-3.5 text-primary" />
                            : <Square className="size-3.5" />
                        }
                        Selecionar todos os novos ({newLeads.length})
                    </button>
                    <button
                        onClick={() => refetch()}
                        disabled={isFetching}
                        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors"
                    >
                        <RefreshCw className={cn('size-3', isFetching && 'animate-spin')} />
                        Atualizar
                    </button>
                </div>

                {/* List */}
                <div className="flex-1 overflow-y-auto min-h-0">
                    {isFetching && leads.length === 0 ? (
                        <div className="flex items-center justify-center py-16">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : leads.length === 0 ? (
                        <div className="flex flex-col items-center justify-center py-16 gap-2 text-center px-6">
                            <p className="text-sm font-medium">Nenhum lead encontrado</p>
                            <p className="text-xs text-muted-foreground">Este formulário ainda não recebeu nenhum preenchimento.</p>
                        </div>
                    ) : (
                        <div className="divide-y">
                            {leads.map(lead => {
                                const { name, email, phone } = extractDisplay(lead)
                                const isSelected = selected.has(lead.id)
                                return (
                                    <button
                                        key={lead.id}
                                        disabled={lead.isImported}
                                        onClick={() => !lead.isImported && toggle(lead.id)}
                                        className={cn(
                                            'w-full flex items-center gap-3 px-6 py-3 text-left transition-colors',
                                            lead.isImported
                                                ? 'opacity-50 cursor-default'
                                                : 'hover:bg-muted/50 cursor-pointer',
                                            isSelected && 'bg-primary/5',
                                        )}
                                    >
                                        {lead.isImported ? (
                                            <UserCheck className="size-4 shrink-0 text-green-500" />
                                        ) : isSelected ? (
                                            <CheckSquare className="size-4 shrink-0 text-primary" />
                                        ) : (
                                            <Square className="size-4 shrink-0 text-muted-foreground" />
                                        )}

                                        <div className="flex-1 min-w-0">
                                            <p className="text-sm font-medium truncate">{name}</p>
                                            <p className="text-xs text-muted-foreground truncate">
                                                {[email, phone].filter(Boolean).join(' · ') || 'Sem contato'}
                                            </p>
                                        </div>

                                        <div className="text-right shrink-0">
                                            {lead.isImported ? (
                                                <span className="text-[10px] font-semibold text-green-600 bg-green-100 dark:bg-green-900/30 px-1.5 py-0.5 rounded">
                                                    Importado
                                                </span>
                                            ) : (
                                                <span className="text-[10px] text-muted-foreground">
                                                    {format(new Date(lead.createdTime), 'dd/MM/yy', { locale: ptBR })}
                                                </span>
                                            )}
                                        </div>
                                    </button>
                                )
                            })}
                        </div>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex items-center justify-between shrink-0">
                    <span className="text-xs text-muted-foreground">
                        {selected.size > 0 ? `${selected.size} selecionado(s)` : 'Nenhum selecionado'}
                    </span>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" onClick={() => onOpenChange(false)}>
                            Fechar
                        </Button>
                        <Button
                            size="sm"
                            onClick={handleImport}
                            disabled={selected.size === 0 || importLeads.isPending}
                            className="gap-1"
                        >
                            {importLeads.isPending
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Download className="size-3.5" />
                            }
                            Importar {selected.size > 0 ? `(${selected.size})` : ''}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}
