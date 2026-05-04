'use client'

import { useState, useEffect } from 'react'
import { toast } from 'sonner'
import {
    ChevronRight, ChevronLeft, Loader2, Check, Trash2,
    Zap, Facebook, FileText, LayoutList, ArrowRight, Copy, Globe,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Sheet, SheetContent, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Badge } from '@/components/ui/badge'
import { Separator } from '@/components/ui/separator'

import { useConnections, type Connection } from '@/services/connections'
import {
    useGetMetaForms,
    useGetMetaFormFields,
    useGetPipelineMetaIntegration,
    useUpsertPipelineMetaIntegration,
    useDeletePipelineMetaIntegration,
    type MetaPage,
    type MetaForm,
    type FieldMapping,
} from '@/services/meta'
import type { PipelineStage } from '@/services/pipelines'

// ─── Target field options ─────────────────────────────────────────────────────

type TargetOption = {
    value: string
    label: string
    targetType: 'lead' | 'deal'
    targetField: string
}

const TARGET_OPTIONS: TargetOption[] = [
    { value: 'lead.name',   label: 'Lead · Nome completo', targetType: 'lead', targetField: 'name'  },
    { value: 'lead.phone',  label: 'Lead · Telefone',      targetType: 'lead', targetField: 'phone' },
    { value: 'lead.email',  label: 'Lead · E-mail',        targetType: 'lead', targetField: 'email' },
    { value: 'deal.title',  label: 'Negócio · Título',     targetType: 'deal', targetField: 'title' },
    { value: 'deal.value',  label: 'Negócio · Valor',      targetType: 'deal', targetField: 'value' },
]

// ─── Webhook URL Box ──────────────────────────────────────────────────────────

function WebhookUrlBox() {
    const [copied, setCopied] = useState(false)
    const backendUrl = (process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333').replace(/\/$/, '')
    const webhookUrl = `${backendUrl}/meta/webhook`

    function copy() {
        navigator.clipboard.writeText(webhookUrl)
        setCopied(true)
        setTimeout(() => setCopied(false), 2000)
    }

    return (
        <div className="space-y-1.5">
            <div className="flex items-center gap-1.5">
                <Globe className="size-3.5 text-muted-foreground" />
                <p className="text-sm font-medium">URL do Webhook</p>
            </div>
            <p className="text-xs text-muted-foreground">
                Configure esta URL no <strong>Meta for Developers</strong> em
                {' '}Webhooks → Assinar → campo <code className="bg-muted px-1 rounded">leadgen</code>.
            </p>
            <div className="flex items-center gap-2 rounded-lg border bg-muted/40 px-3 py-2">
                <code className="flex-1 text-xs truncate text-foreground">{webhookUrl}</code>
                <button
                    onClick={copy}
                    className="shrink-0 text-muted-foreground hover:text-foreground transition-colors"
                    title="Copiar URL"
                >
                    {copied
                        ? <Check className="size-3.5 text-green-500" />
                        : <Copy className="size-3.5" />
                    }
                </button>
            </div>
            <p className="text-[11px] text-muted-foreground">
                Token de verificação: configure <code className="bg-muted px-1 rounded">META_WEBHOOK_VERIFY_TOKEN</code> no backend e use o mesmo valor no Meta.
            </p>
        </div>
    )
}

// ─── Props ────────────────────────────────────────────────────────────────────

type Props = {
    open: boolean
    onOpenChange: (open: boolean) => void
    enterpriseId: string
    pipelineId: string
    stages: PipelineStage[]
}

// ─── Step indicator ───────────────────────────────────────────────────────────

const STEPS = ['Conexão', 'Página', 'Formulário', 'Campos']

function StepIndicator({ current }: { current: number }) {
    return (
        <div className="flex items-center gap-1 pb-4">
            {STEPS.map((label, i) => (
                <div key={i} className="flex items-center gap-1">
                    <div className={cn(
                        'flex size-5 items-center justify-center rounded-full text-[10px] font-semibold transition-colors',
                        i < current  && 'bg-primary text-primary-foreground',
                        i === current && 'bg-primary text-primary-foreground ring-2 ring-primary/30',
                        i > current  && 'bg-muted text-muted-foreground',
                    )}>
                        {i < current ? <Check className="size-3" /> : i + 1}
                    </div>
                    <span className={cn(
                        'text-xs hidden sm:inline',
                        i === current ? 'text-foreground font-medium' : 'text-muted-foreground',
                    )}>{label}</span>
                    {i < STEPS.length - 1 && (
                        <div className={cn('h-px w-4 mx-1', i < current ? 'bg-primary' : 'bg-border')} />
                    )}
                </div>
            ))}
        </div>
    )
}

// ─── Main component ───────────────────────────────────────────────────────────

export function PipelineMetaIntegrationSheet({ open, onOpenChange, enterpriseId, pipelineId, stages }: Props) {
    const [step, setStep] = useState(0)

    // Selected values
    const [selectedConnection, setSelectedConnection] = useState<Connection | null>(null)
    const [selectedPage, setSelectedPage] = useState<MetaPage | null>(null)
    const [selectedForm, setSelectedForm] = useState<MetaForm | null>(null)
    const [initialStageId, setInitialStageId] = useState<string>('')
    const [mappings, setMappings] = useState<Record<string, string>>({}) // formField → 'lead.name' etc.

    // Data fetching
    const { data: connections = [] } = useConnections(enterpriseId)
    const metaConnections = connections.filter(c => c.type === 'META')

    const formsEnabled = open && !!selectedConnection && step >= 1
    const { data: formsData, isFetching: formsFetching } = useGetMetaForms(
        enterpriseId,
        selectedConnection?.id ?? '',
        formsEnabled,
    )

    const fieldsEnabled = open && !!selectedConnection && !!selectedForm && step === 3
    const { data: fieldsData, isFetching: fieldsFetching } = useGetMetaFormFields(
        enterpriseId,
        selectedConnection?.id ?? '',
        selectedForm?.id ?? '',
        fieldsEnabled,
    )

    // Existing integration
    const { data: existing, isLoading: existingLoading } = useGetPipelineMetaIntegration(
        enterpriseId,
        pipelineId,
        open,
    )

    const upsert = useUpsertPipelineMetaIntegration()
    const remove = useDeletePipelineMetaIntegration()

    // Populate from existing integration when sheet opens
    useEffect(() => {
        if (!open) return
        if (existingLoading) return
        if (!existing) {
            // Auto-select if only one META connection
            if (metaConnections.length === 1) {
                setSelectedConnection(metaConnections[0])
                setStep(1)
            } else {
                setStep(0)
            }
            return
        }

        const conn = connections.find(c => c.id === existing.connectionId) ?? null
        setSelectedConnection(conn)
        // Restore page/form as stub objects — formsData loads lazily
        setSelectedPage({ pageId: existing.pageId, pageName: existing.pageName, forms: [] })
        setSelectedForm({ id: existing.formId, name: existing.formName, leadsCount: 0, status: '' })
        setInitialStageId(existing.initialStageId ?? '')

        const mappingRecord: Record<string, string> = {}
        existing.fieldMappings.forEach(m => {
            mappingRecord[m.formField] = `${m.targetType}.${m.targetField}`
        })
        setMappings(mappingRecord)
        setStep(3) // jump straight to mappings step
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [open, existingLoading])

    // When formsData loads, refresh selected page/form objects with full data
    useEffect(() => {
        if (!formsData) return
        if (selectedPage) {
            const fullPage = formsData.pages.find(p => p.pageId === selectedPage.pageId)
            if (fullPage) setSelectedPage(fullPage)
        }
        if (selectedPage && selectedForm) {
            const fullPage = formsData.pages.find(p => p.pageId === selectedPage.pageId)
            const fullForm = fullPage?.forms.find(f => f.id === selectedForm.id)
            if (fullForm) setSelectedForm(fullForm)
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [formsData])

    function handleClose() {
        onOpenChange(false)
    }

    function resetAndClose() {
        setStep(0)
        setSelectedConnection(null)
        setSelectedPage(null)
        setSelectedForm(null)
        setInitialStageId('')
        setMappings({})
        onOpenChange(false)
    }

    function handleSave() {
        if (!selectedConnection || !selectedPage || !selectedForm) return

        const fieldMappings: FieldMapping[] = Object.entries(mappings)
            .filter(([, v]) => !!v)
            .map(([formField, targetCombo]) => {
                const field = fieldsData?.fields.find(f => f.key === formField)
                const opt = TARGET_OPTIONS.find(o => o.value === targetCombo)!
                return {
                    formField,
                    formFieldLabel: field?.label ?? formField,
                    targetType: opt.targetType,
                    targetField: opt.targetField,
                }
            })

        upsert.mutate(
            {
                enterpriseId,
                pipelineId,
                connectionId: selectedConnection.id,
                pageId: selectedPage.pageId,
                pageName: selectedPage.pageName,
                formId: selectedForm.id,
                formName: selectedForm.name,
                initialStageId: initialStageId || null,
                fieldMappings,
            },
            {
                onSuccess: () => {
                    toast.success('Integração Meta salva.')
                    resetAndClose()
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function handleRemove() {
        remove.mutate(
            { enterpriseId, pipelineId },
            {
                onSuccess: () => {
                    toast.success('Integração removida.')
                    resetAndClose()
                },
                onError: (e) => toast.error(e.message),
            },
        )
    }

    function setMapping(formField: string, value: string) {
        setMappings(prev => ({ ...prev, [formField]: value }))
    }

    const hasExisting = !!existing

    // ── Render steps ──────────────────────────────────────────────────────────

    function renderStep0() {
        if (metaConnections.length === 0) {
            return (
                <div className="flex flex-col items-center justify-center py-12 gap-3 text-center">
                    <Facebook className="size-10 text-muted-foreground" />
                    <p className="text-sm font-medium">Nenhuma conexão Meta</p>
                    <p className="text-xs text-muted-foreground max-w-xs">
                        Crie uma conexão Meta em <strong>Conexões</strong> antes de configurar a integração.
                    </p>
                </div>
            )
        }

        return (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Selecione a conta Meta a usar:</p>
                {metaConnections.map(conn => (
                    <button
                        key={conn.id}
                        onClick={() => { setSelectedConnection(conn); setStep(1) }}
                        className={cn(
                            'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted',
                            selectedConnection?.id === conn.id && 'border-primary bg-primary/5',
                        )}
                    >
                        <Facebook className="size-5 shrink-0 text-blue-500" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{conn.name}</p>
                            <p className="text-xs text-muted-foreground">Meta Lead Ads</p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                ))}
            </div>
        )
    }

    function renderStep1() {
        if (formsFetching) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
            )
        }

        const pages = formsData?.pages ?? []

        if (pages.length === 0) {
            return (
                <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhuma página encontrada nesta conta.
                </p>
            )
        }

        return (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Selecione a página do Facebook:</p>
                {pages.map(page => (
                    <button
                        key={page.pageId}
                        onClick={() => { setSelectedPage(page); setStep(2) }}
                        className={cn(
                            'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted',
                            selectedPage?.pageId === page.pageId && 'border-primary bg-primary/5',
                        )}
                    >
                        <LayoutList className="size-5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{page.pageName}</p>
                            <p className="text-xs text-muted-foreground">{page.forms.length} formulário(s)</p>
                        </div>
                        <ArrowRight className="size-4 text-muted-foreground" />
                    </button>
                ))}
            </div>
        )
    }

    function renderStep2() {
        const forms = selectedPage?.forms ?? []

        if (forms.length === 0) {
            return (
                <p className="text-sm text-muted-foreground py-8 text-center">
                    Nenhum formulário de Lead Ads encontrado nesta página.
                </p>
            )
        }

        return (
            <div className="space-y-2">
                <p className="text-sm text-muted-foreground mb-3">Selecione o formulário:</p>
                {forms.map(form => (
                    <button
                        key={form.id}
                        onClick={() => { setSelectedForm(form); setStep(3) }}
                        className={cn(
                            'w-full flex items-center gap-3 rounded-lg border px-4 py-3 text-left transition-colors hover:bg-muted',
                            selectedForm?.id === form.id && 'border-primary bg-primary/5',
                        )}
                    >
                        <FileText className="size-5 shrink-0 text-muted-foreground" />
                        <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium truncate">{form.name}</p>
                            <p className="text-xs text-muted-foreground">{form.leadsCount} lead(s) capturado(s)</p>
                        </div>
                        <Badge variant={form.status === 'ACTIVE' ? 'default' : 'secondary'} className="text-[10px] shrink-0">
                            {form.status === 'ACTIVE' ? 'Ativo' : form.status}
                        </Badge>
                    </button>
                ))}
            </div>
        )
    }

    function renderStep3() {
        if (fieldsFetching) {
            return (
                <div className="flex items-center justify-center py-12">
                    <Loader2 className="size-5 animate-spin text-muted-foreground" />
                </div>
            )
        }

        const fields = fieldsData?.fields ?? []

        return (
            <div className="space-y-5">
                {/* Summary */}
                <div className="rounded-lg border bg-muted/40 px-4 py-3 space-y-1">
                    <p className="text-xs text-muted-foreground">Conexão</p>
                    <p className="text-sm font-medium">{selectedConnection?.name}</p>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground">Página · Formulário</p>
                    <p className="text-sm font-medium">{selectedPage?.pageName} · {selectedForm?.name}</p>
                </div>

                {/* Webhook URL */}
                <WebhookUrlBox />

                {/* Initial stage */}
                <div className="space-y-1.5">
                    <p className="text-sm font-medium">Estágio inicial</p>
                    <p className="text-xs text-muted-foreground">Onde os leads capturados entrarão no funil.</p>
                    <Select value={initialStageId} onValueChange={setInitialStageId}>
                        <SelectTrigger>
                            <SelectValue placeholder="Primeiro estágio do funil" />
                        </SelectTrigger>
                        <SelectContent>
                            {stages.map(s => (
                                <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Field mappings */}
                <div className="space-y-2">
                    <p className="text-sm font-medium">Mapeamento de campos</p>
                    <p className="text-xs text-muted-foreground">Associe cada campo do formulário a um campo da plataforma.</p>

                    {fields.length === 0 ? (
                        <p className="text-xs text-muted-foreground py-4 text-center">
                            Não foi possível carregar os campos do formulário.
                        </p>
                    ) : (
                        <div className="space-y-2 rounded-lg border divide-y">
                            {fields.map(field => (
                                <div key={field.key} className="flex items-center gap-3 px-3 py-2.5">
                                    <div className="flex-1 min-w-0">
                                        <p className="text-xs font-medium truncate">{field.label}</p>
                                        <p className="text-[10px] text-muted-foreground">{field.key}</p>
                                    </div>
                                    <ChevronRight className="size-3.5 text-muted-foreground shrink-0" />
                                    <Select
                                        value={mappings[field.key] || '__ignore__'}
                                        onValueChange={v => setMapping(field.key, v === '__ignore__' ? '' : v)}
                                    >
                                        <SelectTrigger className="w-44 h-8 text-xs">
                                            <SelectValue placeholder="Ignorar" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="__ignore__">Ignorar</SelectItem>
                                            {TARGET_OPTIONS.map(opt => (
                                                <SelectItem key={opt.value} value={opt.value}>
                                                    {opt.label}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </div>
        )
    }

    return (
        <Sheet open={open} onOpenChange={handleClose}>
            <SheetContent className="sm:max-w-xl flex flex-col gap-0 p-0">
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <SheetTitle className="flex items-center gap-2">
                        <Zap className="size-4 text-primary" />
                        Integração Meta Lead Ads
                    </SheetTitle>
                    <StepIndicator current={step} />
                </SheetHeader>

                {/* Content */}
                <div className="flex-1 overflow-y-auto px-6 py-4">
                    {existingLoading ? (
                        <div className="flex items-center justify-center py-12">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : (
                        <>
                            {step === 0 && renderStep0()}
                            {step === 1 && renderStep1()}
                            {step === 2 && renderStep2()}
                            {step === 3 && renderStep3()}
                        </>
                    )}
                </div>

                {/* Footer */}
                <div className="border-t px-6 py-4 flex items-center gap-2 shrink-0">
                    {step > 0 && (
                        <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setStep(s => s - 1)}
                            className="gap-1"
                        >
                            <ChevronLeft className="size-3.5" /> Voltar
                        </Button>
                    )}

                    <div className="flex-1" />

                    {hasExisting && (
                        <Button
                            variant="ghost"
                            size="sm"
                            className="text-red-600 hover:text-red-600 hover:bg-red-50 gap-1"
                            onClick={handleRemove}
                            disabled={remove.isPending}
                        >
                            {remove.isPending
                                ? <Loader2 className="size-3.5 animate-spin" />
                                : <Trash2 className="size-3.5" />
                            }
                            Remover
                        </Button>
                    )}

                    {step === 3 && (
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={upsert.isPending || !selectedConnection || !selectedPage || !selectedForm}
                            className="gap-1"
                        >
                            {upsert.isPending ? <Loader2 className="size-3.5 animate-spin" /> : <Check className="size-3.5" />}
                            Salvar
                        </Button>
                    )}
                </div>
            </SheetContent>
        </Sheet>
    )
}
