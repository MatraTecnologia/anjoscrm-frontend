'use client'

import { useState, useCallback, useRef, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
    DndContext, DragOverlay, PointerSensor, useSensor, useSensors,
    type DragStartEvent, type DragEndEvent,
} from '@dnd-kit/core'
import {
    SortableContext, sortableKeyboardCoordinates, useSortable,
    verticalListSortingStrategy, arrayMove,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import {
    ArrowLeft, Save, Eye, EyeOff, Share2, Loader2,
    GripVertical, Trash2, Plus, Type, Hash, DollarSign,
    Calendar, CheckSquare, ListChecks, ChevronDown, CircleDot,
    AlignLeft, Minus, X, Check, Link2, Pencil,
    ChevronLeft, ChevronRight, Zap,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'

import { api } from '@/lib/api'
import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useSimulationTemplate, useUpdateSimulationTemplate, useSaveSimulationFields,
    useCreateSimulationResponse,
    type SimulationTemplate, type SimulationField, type SimulationFieldType,
} from '@/services/simulations'

// ─── Field type meta ──────────────────────────────────────────────────────────

type FieldMeta = {
    type: SimulationFieldType
    label: string
    icon: React.ReactNode
    shortLabel: string
}

const FIELD_TYPES: FieldMeta[] = [
    { type: 'INPUT_TEXT',     label: 'Texto',       shortLabel: 'Tt',  icon: <Type className="h-4 w-4" /> },
    { type: 'INPUT_NUMBER',   label: 'Número',      shortLabel: '#',   icon: <Hash className="h-4 w-4" /> },
    { type: 'INPUT_CURRENCY', label: 'Moeda',       shortLabel: 'R$',  icon: <DollarSign className="h-4 w-4" /> },
    { type: 'INPUT_DATE',     label: 'Data',        shortLabel: '📅',  icon: <Calendar className="h-4 w-4" /> },
    { type: 'CHECKBOX',       label: 'Checkbox',    shortLabel: '☑',   icon: <CheckSquare className="h-4 w-4" /> },
    { type: 'CHECKLIST',      label: 'Checklist',   shortLabel: '≡',   icon: <ListChecks className="h-4 w-4" /> },
    { type: 'RADIO',          label: 'Radio',       shortLabel: '◉',   icon: <CircleDot className="h-4 w-4" /> },
    { type: 'SELECT',         label: 'Seleção',     shortLabel: '▾',   icon: <ChevronDown className="h-4 w-4" /> },
    { type: 'TEXTAREA',       label: 'Texto longo', shortLabel: '¶',   icon: <AlignLeft className="h-4 w-4" /> },
    { type: 'SECTION',        label: 'Seção',       shortLabel: '—',   icon: <Minus className="h-4 w-4" /> },
]

function getFieldMeta(type: SimulationFieldType): FieldMeta {
    return FIELD_TYPES.find(f => f.type === type) ?? FIELD_TYPES[0]
}

function hasOptions(type: SimulationFieldType) {
    return ['CHECKLIST', 'SELECT', 'RADIO'].includes(type)
}

function hasPlaceholder(type: SimulationFieldType) {
    return ['INPUT_TEXT', 'INPUT_NUMBER', 'INPUT_CURRENCY', 'INPUT_DATE', 'TEXTAREA'].includes(type)
}

function hasMinMax(type: SimulationFieldType) {
    return ['INPUT_NUMBER', 'INPUT_CURRENCY'].includes(type)
}

// ─── Local field type ─────────────────────────────────────────────────────────

type FieldOption = { label: string; score?: number }

type LocalField = Omit<SimulationField, 'templateId' | 'options'> & {
    _tmp?: boolean
    options: FieldOption[]
}

type ScoreRange = { min: number; max: number; label: string; color: string; message?: string }

function newField(type: SimulationFieldType, order: number): LocalField {
    return {
        id: `tmp_${Date.now()}_${Math.random()}`,
        type,
        label: getFieldMeta(type).label,
        placeholder: null,
        required: false,
        order,
        options: hasOptions(type) ? [{ label: 'Opção 1', score: 0 }] : [],
        config: {},
        _tmp: true,
    }
}

// ─── Sortable field row ───────────────────────────────────────────────────────

interface SortableFieldRowProps {
    field: LocalField
    isSelected: boolean
    onSelect: () => void
    onDelete: () => void
}

function SortableFieldRow({ field, isSelected, onSelect, onDelete }: SortableFieldRowProps) {
    const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: field.id })
    const meta = getFieldMeta(field.type)

    return (
        <div
            ref={setNodeRef}
            style={{ transform: CSS.Transform.toString(transform), transition, opacity: isDragging ? 0.4 : 1 }}
            onClick={onSelect}
            className={cn(
                'flex items-center gap-2 px-3 py-2.5 rounded-lg cursor-pointer group transition-all',
                isSelected
                    ? 'bg-blue-600/20 border border-blue-500/40'
                    : 'hover:bg-white/5 border border-transparent',
            )}
        >
            <button
                {...attributes}
                {...listeners}
                onClick={(e) => e.stopPropagation()}
                className="text-white/20 hover:text-white/50 cursor-grab active:cursor-grabbing touch-none"
            >
                <GripVertical className="h-4 w-4" />
            </button>

            <div className={cn(
                'flex h-7 w-7 items-center justify-center rounded-md text-xs shrink-0',
                isSelected ? 'bg-blue-500/30 text-blue-300' : 'bg-white/8 text-white/50',
            )}>
                {meta.icon}
            </div>

            <span className="flex-1 text-sm text-white/80 truncate">{field.label}</span>

            {field.type === 'SECTION' && null}
            {field.required && (
                <span className="text-xs text-red-400/70">*</span>
            )}

            <button
                onClick={(e) => { e.stopPropagation(); onDelete() }}
                className="h-6 w-6 flex items-center justify-center rounded text-white/20 hover:text-red-400 hover:bg-red-400/10 opacity-0 group-hover:opacity-100 transition-all"
            >
                <Trash2 className="h-3.5 w-3.5" />
            </button>
        </div>
    )
}

// ─── Field Config Panel ───────────────────────────────────────────────────────

interface FieldConfigPanelProps {
    field: LocalField
    onChange: (updates: Partial<LocalField>) => void
    onDelete: () => void
    scoringEnabled: boolean
}

function FieldConfigPanel({ field, onChange, onDelete, scoringEnabled }: FieldConfigPanelProps) {
    function addOption() {
        onChange({ options: [...field.options, { label: `Opção ${field.options.length + 1}`, score: 0 }] })
    }

    function updateOption(i: number, val: FieldOption) {
        const opts = [...field.options]
        opts[i] = val
        onChange({ options: opts })
    }

    function removeOption(i: number) {
        onChange({ options: field.options.filter((_, idx) => idx !== i) })
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-blue-500/20 flex items-center justify-center text-blue-300">
                        {getFieldMeta(field.type).icon}
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Configurar campo</p>
                        <p className="text-xs text-white/40">{getFieldMeta(field.type).label}</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                {/* Label */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-white/60 uppercase tracking-wide">Rótulo</Label>
                    <Input
                        value={field.label}
                        onChange={(e) => onChange({ label: e.target.value })}
                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-9"
                    />
                </div>

                {/* Type selector */}
                <div className="space-y-1.5">
                    <Label className="text-xs text-white/60 uppercase tracking-wide">Tipo</Label>
                    <Select
                        value={field.type}
                        onValueChange={(v) => {
                            const t = v as SimulationFieldType
                            onChange({
                                type: t,
                                options: hasOptions(t) ? (field.options.length ? field.options : [{ label: 'Opção 1', score: 0 }]) : [],
                                placeholder: hasPlaceholder(t) ? field.placeholder : null,
                            })
                        }}
                    >
                        <SelectTrigger className="bg-white/5 border-white/10 text-white h-9">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent className="bg-[#0f1623] border-white/10 text-white">
                            {FIELD_TYPES.map(ft => (
                                <SelectItem
                                    key={ft.type}
                                    value={ft.type}
                                    className="hover:bg-white/5 focus:bg-white/5"
                                >
                                    <span className="flex items-center gap-2">
                                        {ft.icon}
                                        {ft.label}
                                    </span>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                </div>

                {/* Placeholder */}
                {hasPlaceholder(field.type) && (
                    <div className="space-y-1.5">
                        <Label className="text-xs text-white/60 uppercase tracking-wide">Placeholder</Label>
                        <Input
                            value={field.placeholder ?? ''}
                            onChange={(e) => onChange({ placeholder: e.target.value || null })}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-9"
                            placeholder="Texto de exemplo..."
                        />
                    </div>
                )}

                {/* Min/Max */}
                {hasMinMax(field.type) && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-white/60 uppercase tracking-wide">Mínimo</Label>
                            <Input
                                type="number"
                                value={field.config?.min ?? ''}
                                onChange={(e) => onChange({ config: { ...field.config, min: e.target.value ? Number(e.target.value) : undefined } })}
                                className="bg-white/5 border-white/10 text-white h-9"
                            />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-white/60 uppercase tracking-wide">Máximo</Label>
                            <Input
                                type="number"
                                value={field.config?.max ?? ''}
                                onChange={(e) => onChange({ config: { ...field.config, max: e.target.value ? Number(e.target.value) : undefined } })}
                                className="bg-white/5 border-white/10 text-white h-9"
                            />
                        </div>
                    </div>
                )}

                {/* Required toggle */}
                {field.type !== 'SECTION' && (
                    <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                        <div>
                            <p className="text-sm text-white">Obrigatório</p>
                            <p className="text-xs text-white/40">O usuário deve preencher este campo</p>
                        </div>
                        <Switch
                            checked={field.required}
                            onCheckedChange={(v) => onChange({ required: v })}
                        />
                    </div>
                )}

                {/* Options editor */}
                {hasOptions(field.type) && (
                    <div className="space-y-2">
                        <Label className="text-xs text-white/60 uppercase tracking-wide">Opções</Label>
                        <div className="space-y-2">
                            {field.options.map((opt, i) => (
                                <div key={i} className="flex items-center gap-2">
                                    <Input
                                        value={opt.label}
                                        onChange={(e) => updateOption(i, { ...opt, label: e.target.value })}
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-8 text-sm flex-1"
                                    />
                                    {scoringEnabled && (
                                        <div className="flex items-center gap-1 shrink-0">
                                            <Input
                                                type="number"
                                                value={opt.score ?? 0}
                                                onChange={(e) => updateOption(i, { ...opt, score: Number(e.target.value) })}
                                                className="bg-white/5 border-white/10 text-white h-8 text-sm w-16 text-center"
                                            />
                                            <span className="text-xs text-white/30 shrink-0">pts</span>
                                        </div>
                                    )}
                                    <button onClick={() => removeOption(i)} disabled={field.options.length <= 1}
                                        className="h-8 w-8 flex items-center justify-center text-white/30 hover:text-red-400 hover:bg-red-400/10 rounded disabled:opacity-30 transition-colors">
                                        <X className="h-3.5 w-3.5" />
                                    </button>
                                </div>
                            ))}
                            <Button
                                size="sm"
                                variant="ghost"
                                onClick={addOption}
                                className="h-8 w-full text-xs text-white/50 hover:text-white hover:bg-white/5 border border-dashed border-white/10"
                            >
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar opção
                            </Button>
                        </div>
                    </div>
                )}

                {/* Checkbox score config */}
                {field.type === 'CHECKBOX' && scoringEnabled && (
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <Label className="text-xs text-white/60 uppercase tracking-wide">Pts se marcado</Label>
                            <Input type="number" value={(field.config as any)?.scoreIfTrue ?? 0}
                                onChange={(e) => onChange({ config: { ...(field.config as any), scoreIfTrue: Number(e.target.value) } as any })}
                                className="bg-white/5 border-white/10 text-white h-9" />
                        </div>
                        <div className="space-y-1.5">
                            <Label className="text-xs text-white/60 uppercase tracking-wide">Pts se desmarcado</Label>
                            <Input type="number" value={(field.config as any)?.scoreIfFalse ?? 0}
                                onChange={(e) => onChange({ config: { ...(field.config as any), scoreIfFalse: Number(e.target.value) } as any })}
                                className="bg-white/5 border-white/10 text-white h-9" />
                        </div>
                    </div>
                )}

                {/* Numeric/currency score ranges */}
                {hasMinMax(field.type) && scoringEnabled && (
                    <div className="space-y-2">
                        <Label className="text-xs text-white/60 uppercase tracking-wide">Faixas de pontuação</Label>
                        {((field.config as any)?.scoreRanges ?? []).map((r: any, i: number) => (
                            <div key={i} className="flex items-center gap-2">
                                <Input type="number" placeholder="Min" value={r.min ?? ''}
                                    onChange={e => { const sr = [...((field.config as any)?.scoreRanges ?? [])]; sr[i] = {...r, min: Number(e.target.value)}; onChange({ config: { ...(field.config as any), scoreRanges: sr } as any }) }}
                                    className="bg-white/5 border-white/10 text-white h-8 text-sm w-20" />
                                <span className="text-white/30 text-xs">–</span>
                                <Input type="number" placeholder="Max" value={r.max ?? ''}
                                    onChange={e => { const sr = [...((field.config as any)?.scoreRanges ?? [])]; sr[i] = {...r, max: Number(e.target.value)}; onChange({ config: { ...(field.config as any), scoreRanges: sr } as any }) }}
                                    className="bg-white/5 border-white/10 text-white h-8 text-sm w-20" />
                                <Input type="number" placeholder="Pts" value={r.points ?? ''}
                                    onChange={e => { const sr = [...((field.config as any)?.scoreRanges ?? [])]; sr[i] = {...r, points: Number(e.target.value)}; onChange({ config: { ...(field.config as any), scoreRanges: sr } as any }) }}
                                    className="bg-white/5 border-white/10 text-white h-8 text-sm w-16" />
                                <span className="text-xs text-white/30">pts</span>
                                <button onClick={() => { const sr = ((field.config as any)?.scoreRanges ?? []).filter((_:any,j:number)=>j!==i); onChange({ config: { ...(field.config as any), scoreRanges: sr } as any }) }}
                                    className="h-8 w-8 flex items-center justify-center text-white/30 hover:text-red-400 rounded">
                                    <X className="h-3.5 w-3.5" />
                                </button>
                            </div>
                        ))}
                        <Button size="sm" variant="ghost" onClick={() => { const sr = [...((field.config as any)?.scoreRanges ?? []), { min: 0, max: 0, points: 0 }]; onChange({ config: { ...(field.config as any), scoreRanges: sr } as any }) }}
                            className="h-8 w-full text-xs text-white/50 hover:text-white hover:bg-white/5 border border-dashed border-white/10">
                            <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar faixa
                        </Button>
                    </div>
                )}
            </div>

            {/* Delete */}
            <div className="p-5 border-t border-white/10">
                <Button
                    variant="ghost"
                    onClick={onDelete}
                    className="w-full h-9 text-red-400 hover:text-red-300 hover:bg-red-500/10 border border-red-500/20"
                >
                    <Trash2 className="mr-2 h-4 w-4" />
                    Remover campo
                </Button>
            </div>
        </div>
    )
}

// ─── Score Config Panel ───────────────────────────────────────────────────────

const SCORE_COLORS = [
    { value: '#ef4444', label: 'Vermelho' },
    { value: '#f59e0b', label: 'Amarelo' },
    { value: '#10b981', label: 'Verde' },
    { value: '#3b82f6', label: 'Azul' },
    { value: '#8b5cf6', label: 'Roxo' },
]

function ScoreConfigPanel({ scoringEnabled, onToggle, scoreRanges, onChange, onSave, saving }: {
    scoringEnabled: boolean
    onToggle: (v: boolean) => void
    scoreRanges: ScoreRange[]
    onChange: (ranges: ScoreRange[]) => void
    onSave: () => void
    saving: boolean
}) {
    function addRange() {
        const last = scoreRanges[scoreRanges.length - 1]
        onChange([...scoreRanges, {
            min: last ? last.max + 1 : 0,
            max: last ? last.max + 20 : 20,
            label: 'Novo resultado',
            color: '#10b981',
            message: '',
        }])
    }

    function updateRange(i: number, updates: Partial<ScoreRange>) {
        onChange(scoreRanges.map((r, idx) => idx === i ? { ...r, ...updates } : r))
    }

    function removeRange(i: number) {
        onChange(scoreRanges.filter((_, idx) => idx !== i))
    }

    return (
        <div className="flex flex-col h-full overflow-y-auto">
            <div className="p-5 border-b border-white/10">
                <div className="flex items-center gap-2">
                    <div className="h-8 w-8 rounded-lg bg-amber-500/20 flex items-center justify-center text-amber-300">
                        <Zap className="h-4 w-4" />
                    </div>
                    <div>
                        <p className="text-sm font-semibold text-white">Pontuação</p>
                        <p className="text-xs text-white/40">Configure o sistema de scoring</p>
                    </div>
                </div>
            </div>

            <div className="flex-1 p-5 space-y-5 overflow-y-auto">
                {/* Enable toggle */}
                <div className="flex items-center justify-between p-3 rounded-lg bg-white/5">
                    <div>
                        <p className="text-sm text-white">Ativar pontuação</p>
                        <p className="text-xs text-white/40">Campos passam a ter pontos nas opções</p>
                    </div>
                    <Switch checked={scoringEnabled} onCheckedChange={onToggle} />
                </div>

                {scoringEnabled && (
                    <>
                        <div className="space-y-2">
                            <Label className="text-xs text-white/60 uppercase tracking-wide">Faixas de resultado</Label>
                            <p className="text-xs text-white/40">Defina intervalos de pontos e seus rótulos</p>
                        </div>

                        <div className="space-y-3">
                            {scoreRanges.map((range, i) => (
                                <div key={i} className="rounded-xl border border-white/10 bg-white/5 p-3 space-y-3">
                                    {/* Min - Max */}
                                    <div className="flex items-center gap-2">
                                        <Input type="number" value={range.min}
                                            onChange={e => updateRange(i, { min: Number(e.target.value) })}
                                            className="bg-white/5 border-white/10 text-white h-8 text-sm w-20" />
                                        <span className="text-white/30 text-xs shrink-0">pts até</span>
                                        <Input type="number" value={range.max}
                                            onChange={e => updateRange(i, { max: Number(e.target.value) })}
                                            className="bg-white/5 border-white/10 text-white h-8 text-sm w-20" />
                                        <span className="text-white/30 text-xs shrink-0">pts</span>
                                        <button onClick={() => removeRange(i)}
                                            className="ml-auto h-7 w-7 flex items-center justify-center text-white/20 hover:text-red-400 hover:bg-red-400/10 rounded">
                                            <X className="h-3.5 w-3.5" />
                                        </button>
                                    </div>

                                    {/* Label */}
                                    <Input value={range.label}
                                        onChange={e => updateRange(i, { label: e.target.value })}
                                        placeholder="Ex: Alto potencial"
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 h-8 text-sm" />

                                    {/* Color + preview */}
                                    <div className="flex items-center gap-2">
                                        <div className="flex gap-1.5">
                                            {SCORE_COLORS.map(c => (
                                                <button key={c.value} onClick={() => updateRange(i, { color: c.value })}
                                                    className={cn('h-6 w-6 rounded-full border-2 transition-all',
                                                        range.color === c.value ? 'border-white scale-110' : 'border-transparent opacity-60 hover:opacity-100'
                                                    )}
                                                    style={{ backgroundColor: c.value }}
                                                    title={c.label}
                                                />
                                            ))}
                                        </div>
                                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full font-medium"
                                            style={{ backgroundColor: range.color + '25', color: range.color }}>
                                            {range.label || 'Rótulo'}
                                        </span>
                                    </div>

                                    {/* Message */}
                                    <Textarea value={range.message ?? ''}
                                        onChange={e => updateRange(i, { message: e.target.value })}
                                        placeholder="Mensagem exibida ao cliente ao final..."
                                        className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-blue-500 text-sm resize-none h-16" />
                                </div>
                            ))}

                            <Button size="sm" variant="ghost" onClick={addRange}
                                className="h-9 w-full text-xs text-white/50 hover:text-white hover:bg-white/5 border border-dashed border-white/10">
                                <Plus className="mr-1.5 h-3.5 w-3.5" /> Adicionar faixa
                            </Button>
                        </div>
                    </>
                )}
            </div>

            <div className="p-4 border-t border-white/10">
                <Button onClick={onSave} disabled={saving} className="w-full h-9 bg-blue-600 hover:bg-blue-700 text-white text-sm gap-2">
                    {saving ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Save className="h-3.5 w-3.5" />}
                    Salvar pontuação
                </Button>
            </div>
        </div>
    )
}

// ─── Preview Panel ────────────────────────────────────────────────────────────

interface PreviewPanelProps {
    template: SimulationTemplate | undefined
    fields: LocalField[]
}

function PreviewFieldInput({ field }: { field: LocalField }) {
    if (field.type === 'SECTION') {
        return (
            <div className="py-2 border-b border-white/20">
                <p className="text-xs font-bold uppercase tracking-widest text-white/40">{field.label}</p>
            </div>
        )
    }

    if (field.type === 'CHECKBOX') {
        return (
            <div className="flex items-center gap-3 p-3 rounded-xl bg-white/5">
                <div className="h-5 w-5 rounded border-2 border-white/30 flex-shrink-0" />
                <span className="text-sm text-white/80">{field.label}</span>
            </div>
        )
    }

    if (field.type === 'CHECKLIST' || field.type === 'RADIO') {
        return (
            <div className="space-y-2">
                {(field.options.length ? field.options : [{ label: 'Opção 1' }]).map((opt, i) => (
                    <div key={i} className="flex items-center gap-3 p-3 rounded-xl bg-white/5 hover:bg-white/8 transition-colors">
                        <div className={cn(
                            'h-4 w-4 flex-shrink-0 border-2 border-white/30',
                            field.type === 'RADIO' ? 'rounded-full' : 'rounded',
                        )} />
                        <span className="text-sm text-white/70">{opt.label}</span>
                    </div>
                ))}
            </div>
        )
    }

    if (field.type === 'SELECT') {
        return (
            <div className="flex items-center justify-between p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm text-white/40">{field.placeholder || 'Selecione uma opção...'}</span>
                <ChevronDown className="h-4 w-4 text-white/30" />
            </div>
        )
    }

    if (field.type === 'TEXTAREA') {
        return (
            <div className="min-h-[80px] p-3 rounded-xl bg-white/5 border border-white/10">
                <span className="text-sm text-white/30">{field.placeholder || 'Digite aqui...'}</span>
            </div>
        )
    }

    if (field.type === 'INPUT_DATE') {
        return (
            <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
                <Calendar className="h-4 w-4 text-white/30" />
                <span className="text-sm text-white/40">{field.placeholder || 'dd/mm/aaaa'}</span>
            </div>
        )
    }

    return (
        <div className="flex items-center gap-2 p-3 rounded-xl bg-white/5 border border-white/10">
            {field.type === 'INPUT_CURRENCY' && <span className="text-sm text-white/40 font-mono">R$</span>}
            {field.type === 'INPUT_NUMBER' && <Hash className="h-4 w-4 text-white/30" />}
            <span className="text-sm text-white/40">{field.placeholder || 'Digite aqui...'}</span>
        </div>
    )
}

function PreviewPanel({ template, fields }: PreviewPanelProps) {
    const visibleFields = fields.filter(f => f.type !== 'SECTION')
    const [currentIdx, setCurrentIdx] = useState(0)
    const current = visibleFields[currentIdx]
    const progress = visibleFields.length > 0 ? ((currentIdx + 1) / visibleFields.length) * 100 : 0

    useEffect(() => { setCurrentIdx(0) }, [fields.length])

    if (fields.length === 0) {
        return (
            <div className="flex-1 flex items-center justify-center text-center p-8">
                <div>
                    <div className="h-16 w-16 rounded-2xl bg-white/5 flex items-center justify-center mx-auto mb-4">
                        <AlignLeft className="h-8 w-8 text-white/20" />
                    </div>
                    <p className="text-white/30 text-sm">
                        Adicione campos ao formulário para visualizar o preview
                    </p>
                </div>
            </div>
        )
    }

    return (
        <div className="flex-1 flex items-center justify-center p-6 overflow-auto">
            {/* Phone-ish mockup */}
            <div className="w-full max-w-sm">
                <div className="rounded-2xl border border-white/10 bg-[#0a1120] overflow-hidden shadow-2xl shadow-black/60">
                    {/* Top bar */}
                    <div className="px-5 pt-5 pb-3">
                        <div className="flex items-center justify-between mb-3">
                            <span className="text-xs text-white/40">
                                {currentIdx + 1} / {visibleFields.length}
                            </span>
                            <span className="text-xs text-white/40">
                                {template?.emoji} {template?.name}
                            </span>
                        </div>
                        {/* Progress bar */}
                        <div className="h-1.5 w-full rounded-full bg-white/10">
                            <motion.div
                                className="h-full rounded-full bg-blue-500"
                                animate={{ width: `${progress}%` }}
                                transition={{ type: 'spring', stiffness: 200, damping: 30 }}
                            />
                        </div>
                    </div>

                    {/* Current field */}
                    <AnimatePresence mode="wait">
                        {current && (
                            <motion.div
                                key={current.id}
                                initial={{ opacity: 0, x: 20 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -20 }}
                                transition={{ duration: 0.2 }}
                                className="px-5 py-4 min-h-[180px] flex flex-col justify-center gap-3"
                            >
                                <div>
                                    <p className="text-sm font-semibold text-white mb-0.5">
                                        {current.label}
                                        {current.required && <span className="text-red-400 ml-1">*</span>}
                                    </p>
                                </div>
                                <PreviewFieldInput field={current} />
                            </motion.div>
                        )}
                    </AnimatePresence>

                    {/* Navigation */}
                    <div className="px-5 pb-5 flex items-center justify-between">
                        <Button
                            size="sm"
                            variant="ghost"
                            disabled={currentIdx === 0}
                            onClick={() => setCurrentIdx(i => Math.max(0, i - 1))}
                            className="h-9 px-3 text-white/50 hover:text-white hover:bg-white/5 disabled:opacity-20"
                        >
                            <ChevronLeft className="mr-1 h-4 w-4" />
                            Anterior
                        </Button>

                        {currentIdx < visibleFields.length - 1 ? (
                            <Button
                                size="sm"
                                onClick={() => setCurrentIdx(i => Math.min(visibleFields.length - 1, i + 1))}
                                className="h-9 px-4 bg-blue-600 hover:bg-blue-700 text-white text-sm"
                            >
                                Próximo
                                <ChevronRight className="ml-1 h-4 w-4" />
                            </Button>
                        ) : (
                            <Button
                                size="sm"
                                className="h-9 px-4 bg-emerald-600 hover:bg-emerald-700 text-white text-sm"
                            >
                                <Check className="mr-1 h-4 w-4" />
                                Enviar
                            </Button>
                        )}
                    </div>
                </div>

                <p className="text-center text-xs text-white/20 mt-3">Preview — não interativo</p>
            </div>
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimulacaoEditorPage() {
    const params = useParams()
    const router = useRouter()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''
    const templateId = params.id as string

    const { data: template, isLoading } = useSimulationTemplate(templateId, enterpriseId)
    const updateTemplate = useUpdateSimulationTemplate()
    const saveFields = useSaveSimulationFields()
    const createResponse = useCreateSimulationResponse()

    // Local state
    const [fields, setFields] = useState<LocalField[]>([])
    const [isDirty, setIsDirty] = useState(false)
    const [selectedFieldId, setSelectedFieldId] = useState<string | null>(null)
    const [showPreview, setShowPreview] = useState(true)
    const [showScoreConfig, setShowScoreConfig] = useState(false)
    const [scoringEnabled, setScoringEnabled] = useState(false)
    const [scoreRanges, setScoreRanges] = useState<ScoreRange[]>([])
    const [savingScore, setSavingScore] = useState(false)
    const [editingName, setEditingName] = useState(false)
    const [nameVal, setNameVal] = useState('')
    const [activeId, setActiveId] = useState<string | null>(null)
    const nameInputRef = useRef<HTMLInputElement>(null)

    // Sync fields from server
    useEffect(() => {
        if (template && !isDirty) {
            setFields(template.fields.map(f => ({
                ...f,
                _tmp: false,
                options: Array.isArray(f.options)
                    ? f.options.map((o: any) => typeof o === 'string' ? { label: o, score: 0 } : o)
                    : [],
            })).sort((a, b) => a.order - b.order))
            setNameVal(template.name)
            setScoringEnabled((template.config as any)?.scoringEnabled ?? false)
            setScoreRanges((template.config as any)?.scoreRanges ?? [])
        }
    }, [template, isDirty])

    const sensors = useSensors(useSensor(PointerSensor, { activationConstraint: { distance: 5 } }))

    const selectedField = fields.find(f => f.id === selectedFieldId) ?? null

    // ── Handlers ────────────────────────────────────────────────────────────

    function addField(type: SimulationFieldType) {
        const field = newField(type, fields.length)
        setFields(prev => [...prev, field])
        setSelectedFieldId(field.id)
        setShowPreview(false)
        setIsDirty(true)
    }

    function updateField(id: string, updates: Partial<LocalField>) {
        setFields(prev => prev.map(f => f.id === id ? { ...f, ...updates } : f))
        setIsDirty(true)
    }

    function deleteField(id: string) {
        setFields(prev => prev.filter(f => f.id !== id))
        if (selectedFieldId === id) { setSelectedFieldId(null); setShowPreview(true) }
        setIsDirty(true)
    }

    function handleDragStart(event: DragStartEvent) {
        setActiveId(event.active.id as string)
    }

    function handleDragEnd(event: DragEndEvent) {
        setActiveId(null)
        const { active, over } = event
        if (!over || active.id === over.id) return
        setFields(prev => {
            const oldIdx = prev.findIndex(f => f.id === active.id)
            const newIdx = prev.findIndex(f => f.id === over.id)
            const reordered = arrayMove(prev, oldIdx, newIdx)
            return reordered.map((f, i) => ({ ...f, order: i }))
        })
        setIsDirty(true)
    }

    function handleSave() {
        const payload = fields.map((f, i) => ({
            type: f.type,
            label: f.label,
            placeholder: f.placeholder,
            required: f.required,
            order: i,
            options: f.options,
            config: f.config,
        }))
        saveFields.mutate(
            { id: templateId, enterpriseId, fields: payload },
            {
                onSuccess: (tpl) => {
                    setFields(tpl.fields.map(f => ({ ...f, _tmp: false })).sort((a, b) => a.order - b.order))
                    setIsDirty(false)
                    toast.success('Formulário salvo!')
                },
                onError: () => toast.error('Erro ao salvar'),
            },
        )
    }

    function handleSaveName() {
        if (!nameVal.trim() || nameVal === template?.name) { setEditingName(false); return }
        updateTemplate.mutate(
            { id: templateId, enterpriseId, name: nameVal.trim() },
            {
                onSuccess: () => { toast.success('Nome atualizado'); setEditingName(false) },
                onError: () => toast.error('Erro ao renomear'),
            },
        )
    }

    function handleGenerateLink() {
        createResponse.mutate(
            { templateId, enterpriseId },
            {
                onSuccess: (res) => {
                    const url = `${window.location.origin}/s/${res.token}`
                    navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
                },
                onError: () => toast.error('Erro ao gerar link'),
            },
        )
    }

    async function handleSaveScoreConfig() {
        setSavingScore(true)
        try {
            await api.patch(`/simulations/${templateId}/score-config`,
                { scoringEnabled, scoreRanges },
                { headers: { 'X-Enterprise-Id': enterpriseId } }
            )
            toast.success('Configuração de pontuação salva!')
        } catch {
            toast.error('Erro ao salvar pontuação')
        } finally {
            setSavingScore(false)
        }
    }

    if (isLoading) {
        return (
            <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
                <Loader2 className="h-8 w-8 text-blue-400 animate-spin" />
            </div>
        )
    }

    if (!template) {
        return (
            <div className="min-h-screen bg-[#080d1a] flex items-center justify-center">
                <p className="text-white/40">Simulação não encontrada</p>
            </div>
        )
    }

    const activeField = activeId ? fields.find(f => f.id === activeId) : null

    return (
        <div className="min-h-screen bg-[#080d1a] text-white flex flex-col">
            {/* ── Top Bar ── */}
            <div className="shrink-0 border-b border-white/10 bg-[#080d1a]/95 backdrop-blur-sm z-20">
                <div className="flex items-center gap-3 px-4 h-14">
                    <Button
                        size="icon"
                        variant="ghost"
                        onClick={() => router.push('/simulacoes')}
                        className="h-9 w-9 text-white/50 hover:text-white hover:bg-white/5"
                    >
                        <ArrowLeft className="h-4 w-4" />
                    </Button>

                    {/* Template name */}
                    <div className="flex items-center gap-2 flex-1 min-w-0">
                        <span className="text-lg">{template.emoji}</span>
                        {editingName ? (
                            <input
                                ref={nameInputRef}
                                value={nameVal}
                                onChange={(e) => setNameVal(e.target.value)}
                                onBlur={handleSaveName}
                                onKeyDown={(e) => { if (e.key === 'Enter') handleSaveName(); if (e.key === 'Escape') setEditingName(false) }}
                                className="bg-white/10 text-white font-semibold text-sm rounded-md px-2 py-1 border border-blue-500/50 outline-none w-64 max-w-full"
                                autoFocus
                            />
                        ) : (
                            <button
                                onClick={() => { setEditingName(true); setNameVal(template.name) }}
                                className="flex items-center gap-1.5 group text-left"
                            >
                                <span className="font-semibold text-sm text-white truncate max-w-[220px]">{template.name}</span>
                                <Pencil className="h-3 w-3 text-white/20 group-hover:text-white/50 transition-colors" />
                            </button>
                        )}

                        {isDirty && (
                            <Badge className="bg-amber-500/20 text-amber-400 border-0 text-xs px-1.5 py-0.5">
                                Não salvo
                            </Badge>
                        )}
                    </div>

                    <div className="flex items-center gap-2">
                        {/* Preview toggle */}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setShowPreview(v => !v); if (!showPreview) setSelectedFieldId(null); setShowScoreConfig(false) }}
                            className={cn(
                                'h-8 gap-1.5 text-xs',
                                showPreview
                                    ? 'text-blue-300 bg-blue-500/15'
                                    : 'text-white/50 hover:text-white hover:bg-white/5',
                            )}
                        >
                            {showPreview ? <Eye className="h-3.5 w-3.5" /> : <EyeOff className="h-3.5 w-3.5" />}
                            Preview
                        </Button>

                        {/* Scoring toggle */}
                        <Button size="sm" variant="ghost"
                            onClick={() => { setShowScoreConfig(v => !v); setSelectedFieldId(null); setShowPreview(false) }}
                            className={cn('h-8 gap-1.5 text-xs',
                                showScoreConfig ? 'text-amber-300 bg-amber-500/15' : 'text-white/50 hover:text-white hover:bg-white/5'
                            )}>
                            <Zap className="h-3.5 w-3.5" />
                            Pontuação
                        </Button>

                        {/* Generate link */}
                        <Button
                            size="sm"
                            variant="ghost"
                            onClick={handleGenerateLink}
                            disabled={createResponse.isPending}
                            className="h-8 gap-1.5 text-xs text-white/50 hover:text-white hover:bg-white/5"
                        >
                            {createResponse.isPending
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Link2 className="h-3.5 w-3.5" />
                            }
                            Gerar link
                        </Button>

                        {/* Save */}
                        <Button
                            size="sm"
                            onClick={handleSave}
                            disabled={!isDirty || saveFields.isPending}
                            className={cn(
                                'h-8 gap-1.5 text-xs',
                                isDirty
                                    ? 'bg-blue-600 hover:bg-blue-700 text-white'
                                    : 'bg-white/5 text-white/30 cursor-not-allowed',
                            )}
                        >
                            {saveFields.isPending
                                ? <Loader2 className="h-3.5 w-3.5 animate-spin" />
                                : <Save className="h-3.5 w-3.5" />
                            }
                            Salvar
                        </Button>
                    </div>
                </div>
            </div>

            {/* ── Main Layout ── */}
            <div className="flex flex-1 min-h-0 overflow-hidden">
                {/* ── LEFT PANEL ── */}
                <div className="w-72 shrink-0 border-r border-white/10 flex flex-col bg-[#080d1a] overflow-hidden">

                    {/* Field palette */}
                    <div className="p-4 border-b border-white/10">
                        <p className="text-xs font-semibold text-white/40 uppercase tracking-wider mb-3">
                            Adicionar campo
                        </p>
                        <div className="grid grid-cols-2 gap-1.5">
                            {FIELD_TYPES.map((ft) => (
                                <button
                                    key={ft.type}
                                    onClick={() => addField(ft.type)}
                                    className="flex items-center gap-2 px-2.5 py-2 rounded-lg bg-white/5 hover:bg-white/10 text-white/60 hover:text-white transition-all text-xs group"
                                >
                                    <span className="text-white/40 group-hover:text-blue-400 transition-colors shrink-0">
                                        {ft.icon}
                                    </span>
                                    <span className="truncate">{ft.label}</span>
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Field list */}
                    <div className="flex-1 overflow-y-auto p-3">
                        <div className="flex items-center justify-between mb-2 px-1">
                            <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                                Campos do formulário
                            </p>
                            <Badge className="bg-white/8 text-white/40 border-0 text-xs px-1.5 py-0">
                                {fields.length}
                            </Badge>
                        </div>

                        {fields.length === 0 ? (
                            <div className="text-center py-10">
                                <p className="text-xs text-white/25">
                                    Nenhum campo adicionado ainda
                                </p>
                            </div>
                        ) : (
                            <DndContext
                                sensors={sensors}
                                onDragStart={handleDragStart}
                                onDragEnd={handleDragEnd}
                            >
                                <SortableContext items={fields.map(f => f.id)} strategy={verticalListSortingStrategy}>
                                    <div className="space-y-1">
                                        {fields.map((f) => (
                                            <SortableFieldRow
                                                key={f.id}
                                                field={f}
                                                isSelected={selectedFieldId === f.id}
                                                onSelect={() => {
                                                    setSelectedFieldId(f.id)
                                                    setShowPreview(false)
                                                }}
                                                onDelete={() => deleteField(f.id)}
                                            />
                                        ))}
                                    </div>
                                </SortableContext>

                                <DragOverlay>
                                    {activeField && (
                                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg bg-[#0f1623] border border-blue-500/40 shadow-lg shadow-blue-500/10">
                                            <GripVertical className="h-4 w-4 text-white/30" />
                                            <div className="h-7 w-7 rounded-md bg-blue-500/20 flex items-center justify-center text-blue-300">
                                                {getFieldMeta(activeField.type).icon}
                                            </div>
                                            <span className="text-sm text-white/80">{activeField.label}</span>
                                        </div>
                                    )}
                                </DragOverlay>
                            </DndContext>
                        )}
                    </div>
                </div>

                {/* ── RIGHT PANEL ── */}
                <div className="flex-1 min-w-0 flex flex-col overflow-hidden">
                    <AnimatePresence mode="wait">
                        {showScoreConfig ? (
                            <motion.div
                                key="score"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <ScoreConfigPanel
                                    scoringEnabled={scoringEnabled}
                                    onToggle={setScoringEnabled}
                                    scoreRanges={scoreRanges}
                                    onChange={setScoreRanges}
                                    onSave={handleSaveScoreConfig}
                                    saving={savingScore}
                                />
                            </motion.div>
                        ) : !showPreview && selectedField ? (
                            <motion.div
                                key="config"
                                initial={{ opacity: 0, x: 10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: -10 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <FieldConfigPanel
                                    field={selectedField}
                                    onChange={(updates) => updateField(selectedField.id, updates)}
                                    onDelete={() => deleteField(selectedField.id)}
                                    scoringEnabled={scoringEnabled}
                                />
                            </motion.div>
                        ) : (
                            <motion.div
                                key="preview"
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                exit={{ opacity: 0, x: 10 }}
                                transition={{ duration: 0.15 }}
                                className="flex-1 flex flex-col overflow-hidden"
                            >
                                <div className="p-4 border-b border-white/10 flex items-center gap-2">
                                    <Eye className="h-4 w-4 text-blue-400" />
                                    <p className="text-sm font-semibold text-white/60">Preview do formulário</p>
                                </div>
                                <PreviewPanel template={template} fields={fields} />
                            </motion.div>
                        )}
                    </AnimatePresence>
                </div>
            </div>
        </div>
    )
}
