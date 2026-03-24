'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { Search, Pencil, Trash2, Loader2, Plus, X, ChevronDown } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useListWorkSchedules, useCreateWorkSchedule, useUpdateWorkSchedule, useDeleteWorkSchedule,
    summarizeDays, summarizeHours, calcDailyAverage,
    DAY_KEYS, DAY_LABELS, DEFAULT_HOURS, TIMEZONES,
    type WorkSchedule, type WorkScheduleHours, type DaySchedule, type TimeRange,
} from '@/services/work-schedules'

// ─── Time input ───────────────────────────────────────────────────────────────

function TimeInput({ value, onChange, disabled }: { value: string; onChange: (v: string) => void; disabled?: boolean }) {
    return (
        <input
            type="time"
            value={value}
            onChange={e => onChange(e.target.value)}
            disabled={disabled}
            className="h-8 w-24 rounded-md border border-input bg-background px-2 text-sm focus:outline-none focus:ring-2 focus:ring-ring disabled:opacity-50"
        />
    )
}

// ─── Day Row ──────────────────────────────────────────────────────────────────

function DayRow({ dayKey, day, onChange, disabled }: {
    dayKey: string; day: DaySchedule; onChange: (d: DaySchedule) => void; disabled?: boolean
}) {
    const [expanded, setExpanded] = useState(false)

    function updateRange(i: number, field: keyof TimeRange, value: string) {
        const ranges = day.ranges.map((r, idx) => idx === i ? { ...r, [field]: value } : r)
        onChange({ ...day, ranges })
    }

    const rangeLabel = day.enabled && day.ranges.length > 0
        ? day.ranges.map(r => `${r.start} - ${r.end}`).join(', ')
        : ''

    return (
        <div className="border-b last:border-b-0">
            <div
                className="flex items-center gap-3 px-4 py-3 cursor-pointer select-none"
                onClick={() => day.enabled && setExpanded(v => !v)}
            >
                <Switch
                    checked={day.enabled}
                    onCheckedChange={v => onChange({ ...day, enabled: v })}
                    disabled={disabled}
                    onClick={e => e.stopPropagation()}
                />
                <span className="text-sm font-medium w-36">{DAY_LABELS[dayKey]}</span>
                {day.enabled && rangeLabel && (
                    <span className="text-sm text-blue-600 dark:text-blue-400 flex-1">{rangeLabel}</span>
                )}
                {day.enabled && (
                    <ChevronDown className={`size-4 text-muted-foreground ml-auto transition-transform ${expanded ? 'rotate-180' : ''}`} />
                )}
            </div>

            {expanded && day.enabled && (
                <div className="px-4 pb-3 flex flex-col gap-2 bg-muted/20">
                    {day.ranges.map((range, i) => (
                        <div key={i} className="flex items-center gap-2">
                            <TimeInput value={range.start} onChange={v => updateRange(i, 'start', v)} disabled={disabled} />
                            <span className="text-sm text-muted-foreground">–</span>
                            <TimeInput value={range.end} onChange={v => updateRange(i, 'end', v)} disabled={disabled} />
                            {day.ranges.length > 1 && (
                                <button
                                    type="button"
                                    onClick={() => onChange({ ...day, ranges: day.ranges.filter((_, idx) => idx !== i) })}
                                    className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive"
                                >
                                    <X className="size-3.5" />
                                </button>
                            )}
                        </div>
                    ))}
                    <button
                        type="button"
                        onClick={() => onChange({ ...day, ranges: [...day.ranges, { start: '09:00', end: '17:00' }] })}
                        disabled={disabled}
                        className="flex items-center gap-1 text-xs text-blue-600 dark:text-blue-400 hover:underline w-fit mt-1"
                    >
                        <Plus className="size-3" /> Adicionar intervalo
                    </button>
                </div>
            )}
        </div>
    )
}

// ─── Dialog ───────────────────────────────────────────────────────────────────

function WorkScheduleDialog({ open, onOpenChange, initial, enterpriseId }: {
    open: boolean; onOpenChange: (v: boolean) => void; initial?: WorkSchedule; enterpriseId: string
}) {
    const isEdit = !!initial
    const [name, setName] = useState(initial?.name ?? '')
    const [timezone, setTimezone] = useState(initial?.timezone ?? 'America/Sao_Paulo')
    const [hours, setHours] = useState<WorkScheduleHours>(initial?.hours ?? DEFAULT_HOURS)

    const { mutate: create, isPending: creating } = useCreateWorkSchedule()
    const { mutate: update, isPending: updating } = useUpdateWorkSchedule()
    const isPending = creating || updating

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return
        if (isEdit) {
            update({ id: initial.id, enterpriseId, name: name.trim(), timezone, hours }, {
                onSuccess: () => { toast.success('Horário atualizado!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({ enterpriseId, name: name.trim(), timezone, hours }, {
                onSuccess: () => { toast.success('Horário criado!'); onOpenChange(false) },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>{isEdit ? 'Editar horário de trabalho' : 'Criar horário de trabalho'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="flex flex-col gap-4 py-1">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ws-name">Nome</Label>
                        <Input
                            id="ws-name" placeholder="Nome" required
                            value={name} onChange={e => setName(e.target.value)}
                            disabled={isPending} autoFocus
                        />
                    </div>

                    <div className="flex flex-col gap-1.5">
                        <Label>Fuso horário</Label>
                        <Select value={timezone} onValueChange={setTimezone} disabled={isPending}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map(tz => (
                                    <SelectItem key={tz} value={tz}>
                                        {tz} ({new Intl.DateTimeFormat('pt-BR', { timeZone: tz, timeZoneName: 'short' })
                                            .formatToParts(new Date()).find(p => p.type === 'timeZoneName')?.value ?? ''})
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="rounded-lg border overflow-hidden">
                        {DAY_KEYS.map(key => (
                            <DayRow
                                key={key} dayKey={key} day={hours[key]}
                                onChange={day => setHours(prev => ({ ...prev, [key]: day }))}
                                disabled={isPending}
                            />
                        ))}
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function WorkHoursSettingsPage() {
    const { enterprise } = useEnterprise()
    const [search, setSearch] = useState('')
    const [query, setQuery] = useState('')
    const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)
    const [createOpen, setCreateOpen] = useState(false)
    const [editSchedule, setEditSchedule] = useState<WorkSchedule | null>(null)
    const [deleteSchedule, setDeleteSchedule] = useState<WorkSchedule | null>(null)

    const { data: schedules = [], isLoading } = useListWorkSchedules(enterprise?.id ?? '', query || undefined)
    const { mutate: remove, isPending: deleting } = useDeleteWorkSchedule()

    function handleSearch(value: string) {
        setSearch(value)
        if (debounceRef.current) clearTimeout(debounceRef.current)
        debounceRef.current = setTimeout(() => setQuery(value), 400)
    }

    function confirmDelete() {
        if (!deleteSchedule || !enterprise) return
        remove({ id: deleteSchedule.id, enterpriseId: enterprise.id }, {
            onSuccess: () => { toast.success('Horário excluído.'); setDeleteSchedule(null) },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-4xl mx-auto w-full">
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Horários de trabalho</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Organize os horários de trabalho dos seus colaboradores e departamentos
                    </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!enterprise}>Criar</Button>
            </div>

            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Pesquisar..." value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-8 h-8 w-52 text-sm"
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {isLoading ? '...' : `${schedules.length} resultado${schedules.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="w-10 px-4 py-2.5 text-left"><Checkbox disabled /></th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nome</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Dias</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Horários</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Média diária</th>
                            <th className="w-20" />
                        </tr>
                    </thead>
                    <tbody>
                        {isLoading && (
                            <tr><td colSpan={6} className="py-16 text-center">
                                <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
                            </td></tr>
                        )}
                        {!isLoading && schedules.length === 0 && (
                            <tr><td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                                {query ? 'Nenhum horário encontrado.' : 'Nenhum horário criado ainda. Clique em "Criar" para começar.'}
                            </td></tr>
                        )}
                        {schedules.map(schedule => {
                            const avg = calcDailyAverage(schedule.hours)
                            return (
                                <tr key={schedule.id} className="border-t hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3"><Checkbox /></td>
                                    <td className="px-4 py-3 font-medium">{schedule.name}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{summarizeDays(schedule.hours)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{summarizeHours(schedule.hours)}</td>
                                    <td className="px-4 py-3 text-muted-foreground">{avg > 0 ? `${avg.toFixed(1)} h/dia` : '—'}</td>
                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button type="button" onClick={() => setEditSchedule(schedule)}
                                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors">
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button type="button" onClick={() => setDeleteSchedule(schedule)}
                                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors">
                                                <Trash2 className="size-3.5" />
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            )
                        })}
                    </tbody>
                </table>
            </div>

            {enterprise && createOpen && (
                <WorkScheduleDialog open onOpenChange={v => { if (!v) setCreateOpen(false) }} enterpriseId={enterprise.id} />
            )}
            {enterprise && editSchedule && (
                <WorkScheduleDialog open onOpenChange={v => { if (!v) setEditSchedule(null) }} initial={editSchedule} enterpriseId={enterprise.id} />
            )}

            <AlertDialog open={!!deleteSchedule} onOpenChange={v => { if (!v) setDeleteSchedule(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir <strong>"{deleteSchedule?.name}"</strong>? Esta ação não pode ser desfeita.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction onClick={confirmDelete} disabled={deleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
                            {deleting ? <><Loader2 className="size-4 animate-spin" /> Excluindo...</> : 'Excluir'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
