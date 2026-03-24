'use client'

import { useRef, useState } from 'react'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    Plus, Search, Pencil, Trash2, Loader2, Clock, X,
} from 'lucide-react'

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
    type WorkSchedule, type WorkScheduleHours, type DaySchedule,
    DAY_KEYS, DAY_LABELS, DEFAULT_HOURS, TIMEZONES,
    calcDailyAverage, summarizeDays, summarizeHours,
} from '@/services/work-schedules'

// ─── Schedule Dialog ──────────────────────────────────────────────────────────

function ScheduleDialog({
    open,
    onOpenChange,
    initial,
    enterpriseId,
}: {
    open: boolean
    onOpenChange: (v: boolean) => void
    initial?: WorkSchedule
    enterpriseId: string
}) {
    const isEdit = !!initial

    const [name, setName] = useState(initial?.name ?? '')
    const [timezone, setTimezone] = useState(initial?.timezone ?? 'America/Sao_Paulo')
    const [hours, setHours] = useState<WorkScheduleHours>(
        initial?.hours ?? { ...DEFAULT_HOURS },
    )

    const { mutate: create, isPending: creating } = useCreateWorkSchedule()
    const { mutate: update, isPending: updating } = useUpdateWorkSchedule()

    const isPending = creating || updating

    function updateDay(day: string, patch: Partial<DaySchedule>) {
        setHours(prev => ({
            ...prev,
            [day]: { ...prev[day as keyof WorkScheduleHours], ...patch },
        }))
    }

    function updateRange(day: string, rangeIdx: number, field: 'start' | 'end', value: string) {
        setHours(prev => {
            const d = prev[day as keyof WorkScheduleHours]
            const newRanges = d.ranges.map((r, i) => i === rangeIdx ? { ...r, [field]: value } : r)
            return { ...prev, [day]: { ...d, ranges: newRanges } }
        })
    }

    function addRange(day: string) {
        setHours(prev => {
            const d = prev[day as keyof WorkScheduleHours]
            return {
                ...prev,
                [day]: { ...d, ranges: [...d.ranges, { start: '13:00', end: '17:00' }] },
            }
        })
    }

    function removeRange(day: string, rangeIdx: number) {
        setHours(prev => {
            const d = prev[day as keyof WorkScheduleHours]
            if (d.ranges.length <= 1) return prev
            return {
                ...prev,
                [day]: { ...d, ranges: d.ranges.filter((_, i) => i !== rangeIdx) },
            }
        })
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!name.trim()) return

        if (isEdit && initial) {
            update({
                id: initial.id, enterpriseId,
                name: name.trim(), timezone, hours,
            }, {
                onSuccess: () => {
                    toast.success('Horário atualizado!')
                    onOpenChange(false)
                },
                onError: (err: Error) => toast.error(err.message),
            })
        } else {
            create({
                enterpriseId,
                name: name.trim(), timezone, hours,
            }, {
                onSuccess: () => {
                    toast.success('Horário criado!')
                    onOpenChange(false)
                },
                onError: (err: Error) => toast.error(err.message),
            })
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {isEdit ? 'Editar horário' : 'Criar horário de trabalho'}
                    </DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5 py-1">
                    {/* Nome */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="schedule-name">Nome</Label>
                        <Input
                            id="schedule-name"
                            placeholder="Ex: Horário comercial"
                            required
                            value={name}
                            onChange={e => setName(e.target.value)}
                            disabled={isPending}
                            autoFocus
                        />
                    </div>

                    {/* Timezone */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Fuso horário</Label>
                        <Select value={timezone} onValueChange={setTimezone} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                                {TIMEZONES.map(tz => (
                                    <SelectItem key={tz} value={tz}>{tz.replace(/_/g, ' ')}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Days */}
                    <div className="flex flex-col gap-3">
                        <Label>Dias e horários</Label>

                        {DAY_KEYS.map(day => {
                            const d = hours[day]
                            return (
                                <div
                                    key={day}
                                    className="flex flex-col gap-2 rounded-lg border p-3"
                                >
                                    <div className="flex items-center justify-between">
                                        <div className="flex items-center gap-2">
                                            <Switch
                                                checked={d.enabled}
                                                onCheckedChange={v => updateDay(day, { enabled: v })}
                                                disabled={isPending}
                                            />
                                            <span className={`text-sm font-medium ${!d.enabled ? 'text-muted-foreground' : ''}`}>
                                                {DAY_LABELS[day]}
                                            </span>
                                        </div>

                                        {d.enabled && d.ranges.length < 3 && (
                                            <button
                                                type="button"
                                                onClick={() => addRange(day)}
                                                className="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                                                disabled={isPending}
                                            >
                                                + Intervalo
                                            </button>
                                        )}
                                    </div>

                                    {d.enabled && (
                                        <div className="flex flex-col gap-1.5 pl-10">
                                            {d.ranges.map((range, ri) => (
                                                <div key={ri} className="flex items-center gap-2">
                                                    <Input
                                                        type="time"
                                                        value={range.start}
                                                        onChange={e => updateRange(day, ri, 'start', e.target.value)}
                                                        className="w-28 h-8 text-sm"
                                                        disabled={isPending}
                                                    />
                                                    <span className="text-xs text-muted-foreground">até</span>
                                                    <Input
                                                        type="time"
                                                        value={range.end}
                                                        onChange={e => updateRange(day, ri, 'end', e.target.value)}
                                                        className="w-28 h-8 text-sm"
                                                        disabled={isPending}
                                                    />
                                                    {d.ranges.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeRange(day, ri)}
                                                            className="p-1 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                                            disabled={isPending}
                                                        >
                                                            <X className="size-3.5" />
                                                        </button>
                                                    )}
                                                </div>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            )
                        })}
                    </div>

                    <DialogFooter className="pt-1">
                        <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={isPending}>
                            Cancelar
                        </Button>
                        <Button type="submit" disabled={isPending}>
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                                : isEdit ? 'Salvar' : 'Criar'
                            }
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

            {/* ── Header ────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Horários de trabalho</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">
                        Defina os horários de funcionamento dos seus departamentos
                    </p>
                </div>
                <Button size="sm" onClick={() => setCreateOpen(true)} disabled={!enterprise}>
                    Criar
                </Button>
            </div>

            {/* ── Search ────────────────────────────────────────────────── */}
            <div className="flex items-center gap-3">
                <div className="relative">
                    <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                    <Input
                        placeholder="Pesquisar..."
                        value={search}
                        onChange={e => handleSearch(e.target.value)}
                        className="pl-8 h-8 w-52 text-sm"
                    />
                </div>
                <span className="text-sm text-muted-foreground">
                    {isLoading ? '...' : `${schedules.length} resultado${schedules.length !== 1 ? 's' : ''}`}
                </span>
            </div>

            {/* ── Table ─────────────────────────────────────────────────── */}
            <div className="rounded-lg border overflow-hidden">
                <table className="w-full text-sm border-collapse">
                    <thead className="bg-muted/40">
                        <tr>
                            <th className="w-10 px-4 py-2.5 text-left">
                                <Checkbox disabled />
                            </th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Nome</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Dias</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Horário</th>
                            <th className="px-4 py-2.5 text-left text-xs font-medium text-muted-foreground">Média diária</th>
                            <th className="w-20" />
                        </tr>
                    </thead>

                    <tbody>
                        {isLoading && (
                            <tr>
                                <td colSpan={6} className="py-16 text-center">
                                    <Loader2 className="size-5 animate-spin mx-auto text-muted-foreground" />
                                </td>
                            </tr>
                        )}

                        {!isLoading && schedules.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-16 text-center text-sm text-muted-foreground">
                                    {query
                                        ? 'Nenhum horário encontrado para essa busca.'
                                        : 'Nenhum horário criado ainda. Clique em "Criar" para começar.'
                                    }
                                </td>
                            </tr>
                        )}

                        {schedules.map(schedule => {
                            const h = schedule.hours as WorkScheduleHours
                            const avg = calcDailyAverage(h)

                            return (
                                <tr key={schedule.id} className="border-t hover:bg-muted/20 transition-colors">
                                    <td className="px-4 py-3"><Checkbox /></td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center gap-2">
                                            <Clock className="size-3.5 text-muted-foreground shrink-0" />
                                            <span className="font-medium">{schedule.name}</span>
                                        </div>
                                    </td>

                                    <td className="px-4 py-3 text-muted-foreground">
                                        {summarizeDays(h)}
                                    </td>

                                    <td className="px-4 py-3 text-muted-foreground">
                                        {summarizeHours(h)}
                                    </td>

                                    <td className="px-4 py-3 text-muted-foreground">
                                        {avg > 0 ? `${avg.toFixed(1)}h` : '—'}
                                    </td>

                                    <td className="px-4 py-3">
                                        <div className="flex items-center justify-end gap-1">
                                            <button
                                                type="button"
                                                onClick={() => setEditSchedule(schedule)}
                                                className="p-1.5 rounded hover:bg-muted text-muted-foreground hover:text-foreground transition-colors"
                                            >
                                                <Pencil className="size-3.5" />
                                            </button>
                                            <button
                                                type="button"
                                                onClick={() => setDeleteSchedule(schedule)}
                                                className="p-1.5 rounded hover:bg-destructive/10 text-muted-foreground hover:text-destructive transition-colors"
                                            >
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

            {/* ── Dialogs ───────────────────────────────────────────────── */}
            {enterprise && createOpen && (
                <ScheduleDialog
                    open
                    onOpenChange={v => { if (!v) setCreateOpen(false) }}
                    enterpriseId={enterprise.id}
                />
            )}
            {enterprise && editSchedule && (
                <ScheduleDialog
                    open
                    onOpenChange={v => { if (!v) setEditSchedule(null) }}
                    initial={editSchedule}
                    enterpriseId={enterprise.id}
                />
            )}

            <AlertDialog open={!!deleteSchedule} onOpenChange={v => { if (!v) setDeleteSchedule(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir horário?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Tem certeza que deseja excluir o horário{' '}
                            <strong>&quot;{deleteSchedule?.name}&quot;</strong>?
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
                                ? <><Loader2 className="size-4 animate-spin" /> Excluindo...</>
                                : 'Excluir'
                            }
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
