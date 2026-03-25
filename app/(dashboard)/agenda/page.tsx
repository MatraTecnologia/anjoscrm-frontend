'use client'

import { useState, useMemo, useEffect } from 'react'
import {
    format,
    formatISO,
    startOfMonth,
    endOfMonth,
    startOfWeek,
    endOfWeek,
    eachDayOfInterval,
    addMonths,
    subMonths,
    isSameDay,
    isSameMonth,
    isToday,
    parseISO,
    setHours,
    setMinutes,
    addDays,
} from 'date-fns'
import { ptBR } from 'date-fns/locale'
import {
    ChevronLeft,
    ChevronRight,
    Plus,
    Calendar,
    List,
    Check,
    Clock,
    User,
    MoreHorizontal,
    CheckCircle2,
    Circle,
    Pencil,
    Trash2,
    CalendarDays,
    CalendarCheck,
    Loader2,
    ChevronDown,
    AlertCircle,
} from 'lucide-react'

import { useEnterprise } from '@/hooks/use-enterprise'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from '@/components/ui/dialog'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Checkbox } from '@/components/ui/checkbox'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    Popover,
    PopoverContent,
    PopoverTrigger,
} from '@/components/ui/popover'
import { Calendar as CalendarPicker } from '@/components/ui/calendar'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuSeparator,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    Command,
    CommandEmpty,
    CommandGroup,
    CommandInput,
    CommandItem,
    CommandList,
} from '@/components/ui/command'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

import {
    useEnterpriseActivities,
    useCreateActivity,
    useUpdateActivity,
    useDeleteActivity,
    useToggleActivityComplete,
    type Activity,
} from '@/services/activities'
import { useListActivityTypes } from '@/services/activity-types'
import { useLeads, type Lead } from '@/services/leads'

// ─── Types ────────────────────────────────────────────────────────────────────

type ViewMode = 'month' | 'list'

type ActivityFormData = {
    title: string
    leadId: string
    typeId: string
    startDate: Date
    startTime: string
    endDate: Date | null
    endTime: string
    description: string
    isRequired: boolean
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const WEEK_DAYS = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']

function buildDateTimeISO(date: Date, time: string): string {
    const [h, m] = time.split(':').map(Number)
    const d = setMinutes(setHours(date, h || 0), m || 0)
    return formatISO(d)
}

function defaultForm(initial?: Activity | null, date?: Date): ActivityFormData {
    const baseDate = date ?? new Date()
    return {
        title: initial?.title ?? '',
        leadId: initial?.leadId ?? '',
        typeId: initial?.typeId ?? '',
        startDate: initial?.startAt ? parseISO(initial.startAt) : baseDate,
        startTime: initial?.startAt ? format(parseISO(initial.startAt), 'HH:mm') : '09:00',
        endDate: initial?.endAt ? parseISO(initial.endAt) : null,
        endTime: initial?.endAt ? format(parseISO(initial.endAt), 'HH:mm') : '10:00',
        description: initial?.description ?? '',
        isRequired: initial?.isRequired ?? false,
    }
}

// ─── ActivityDialog ───────────────────────────────────────────────────────────

interface ActivityDialogProps {
    open: boolean
    onOpenChange: (o: boolean) => void
    initial?: Activity | null
    initialDate?: Date
    enterpriseId: string
}

function ActivityDialog({
    open,
    onOpenChange,
    initial,
    initialDate,
    enterpriseId,
}: ActivityDialogProps) {
    const { data: activityTypes = [] } = useListActivityTypes(enterpriseId)
    const { data: leads = [] } = useLeads(enterpriseId)
    const { mutate: create, isPending: creating } = useCreateActivity()
    const { mutate: update, isPending: updating } = useUpdateActivity()

    const [form, setForm] = useState<ActivityFormData>(() =>
        defaultForm(initial, initialDate)
    )
    const [leadSearch, setLeadSearch] = useState('')
    const [leadPopoverOpen, setLeadPopoverOpen] = useState(false)
    const [startDateOpen, setStartDateOpen] = useState(false)
    const [endDateOpen, setEndDateOpen] = useState(false)

    useEffect(() => {
        if (!open) return
        setForm(defaultForm(initial, initialDate))
        setLeadSearch('')
    }, [open, initial?.id, initialDate?.getTime()])

    const isPending = creating || updating
    const selectedLead = leads.find((l) => l.id === form.leadId)
    const filteredLeads = useMemo(
        () =>
            leads.filter(
                (l) =>
                    l.name.toLowerCase().includes(leadSearch.toLowerCase()) ||
                    (l.email ?? '').toLowerCase().includes(leadSearch.toLowerCase())
            ),
        [leads, leadSearch]
    )

    function handleSubmit() {
        if (!form.title.trim()) {
            toast.error('Título é obrigatório')
            return
        }
        if (!initial && !form.leadId) {
            toast.error('Selecione um lead')
            return
        }

        const startAt = buildDateTimeISO(form.startDate, form.startTime)
        const endAt = form.endDate
            ? buildDateTimeISO(form.endDate, form.endTime)
            : undefined

        if (initial) {
            update(
                {
                    id: initial.id,
                    enterpriseId,
                    title: form.title,
                    typeId: form.typeId || null,
                    startAt,
                    endAt,
                    description: form.description || null,
                    isRequired: form.isRequired,
                },
                {
                    onSuccess: () => {
                        toast.success('Atividade atualizada!')
                        onOpenChange(false)
                    },
                    onError: () => toast.error('Erro ao atualizar atividade'),
                }
            )
        } else {
            create(
                {
                    enterpriseId,
                    leadId: form.leadId,
                    typeId: form.typeId || null,
                    title: form.title,
                    startAt,
                    endAt,
                    description: form.description || null,
                    isRequired: form.isRequired,
                },
                {
                    onSuccess: () => {
                        toast.success('Atividade criada!')
                        onOpenChange(false)
                    },
                    onError: () => toast.error('Erro ao criar atividade'),
                }
            )
        }
    }

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>
                        {initial ? 'Editar Atividade' : 'Nova Atividade'}
                    </DialogTitle>
                </DialogHeader>

                <div className="flex flex-col gap-4">
                    {/* Título */}
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="title">Título *</Label>
                        <Input
                            id="title"
                            placeholder="Ex: Ligação de follow-up"
                            value={form.title}
                            onChange={(e) =>
                                setForm((f) => ({ ...f, title: e.target.value }))
                            }
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                        />
                    </div>

                    {/* Lead (apenas na criação) */}
                    {!initial && (
                        <div className="flex flex-col gap-1.5">
                            <Label>Lead *</Label>
                            <Popover
                                open={leadPopoverOpen}
                                onOpenChange={setLeadPopoverOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        role="combobox"
                                        className="justify-between font-normal"
                                    >
                                        <span className="truncate">
                                            {selectedLead
                                                ? selectedLead.name
                                                : 'Selecionar lead...'}
                                        </span>
                                        <ChevronDown className="size-4 shrink-0 opacity-50" />
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent
                                    className="p-0 w-[var(--radix-popover-trigger-width)]"
                                    align="start"
                                >
                                    <Command shouldFilter={false}>
                                        <CommandInput
                                            placeholder="Buscar lead..."
                                            value={leadSearch}
                                            onValueChange={setLeadSearch}
                                        />
                                        <CommandList>
                                            <CommandEmpty>
                                                Nenhum lead encontrado
                                            </CommandEmpty>
                                            <CommandGroup>
                                                {filteredLeads
                                                    .slice(0, 50)
                                                    .map((lead) => (
                                                        <CommandItem
                                                            key={lead.id}
                                                            value={lead.id}
                                                            onSelect={() => {
                                                                setForm((f) => ({
                                                                    ...f,
                                                                    leadId: lead.id,
                                                                }))
                                                                setLeadPopoverOpen(
                                                                    false
                                                                )
                                                                setLeadSearch('')
                                                            }}
                                                        >
                                                            <Check
                                                                className={cn(
                                                                    'mr-2 size-4 shrink-0',
                                                                    form.leadId ===
                                                                        lead.id
                                                                        ? 'opacity-100'
                                                                        : 'opacity-0'
                                                                )}
                                                            />
                                                            <div className="min-w-0">
                                                                <p className="text-sm truncate">
                                                                    {lead.name}
                                                                </p>
                                                                {lead.email && (
                                                                    <p className="text-xs text-muted-foreground truncate">
                                                                        {lead.email}
                                                                    </p>
                                                                )}
                                                            </div>
                                                        </CommandItem>
                                                    ))}
                                            </CommandGroup>
                                        </CommandList>
                                    </Command>
                                </PopoverContent>
                            </Popover>
                        </div>
                    )}

                    {/* Tipo */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Tipo de atividade</Label>
                        <Select
                            value={form.typeId}
                            onValueChange={(v) =>
                                setForm((f) => ({
                                    ...f,
                                    typeId: v === '__none' ? '' : v,
                                }))
                            }
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar tipo..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="__none">Nenhum</SelectItem>
                                {activityTypes.map((t) => (
                                    <SelectItem key={t.id} value={t.id}>
                                        <div className="flex items-center gap-2">
                                            <span
                                                className="size-2 rounded-full shrink-0"
                                                style={{
                                                    backgroundColor: t.color,
                                                }}
                                            />
                                            {t.name}
                                        </div>
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    {/* Data e hora de início */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label>Data de início *</Label>
                            <Popover
                                open={startDateOpen}
                                onOpenChange={setStartDateOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className="justify-start font-normal"
                                    >
                                        <Calendar className="size-4 mr-2 shrink-0" />
                                        {format(form.startDate, 'dd/MM/yyyy')}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={form.startDate}
                                        onSelect={(d) => {
                                            if (d) {
                                                setForm((f) => ({
                                                    ...f,
                                                    startDate: d,
                                                }))
                                                setStartDateOpen(false)
                                            }
                                        }}
                                        locale={ptBR}
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Horário de início</Label>
                            <Input
                                type="time"
                                value={form.startTime}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        startTime: e.target.value,
                                    }))
                                }
                            />
                        </div>
                    </div>

                    {/* Data e hora de fim */}
                    <div className="grid grid-cols-2 gap-3">
                        <div className="flex flex-col gap-1.5">
                            <Label>Data de fim</Label>
                            <Popover
                                open={endDateOpen}
                                onOpenChange={setEndDateOpen}
                            >
                                <PopoverTrigger asChild>
                                    <Button
                                        variant="outline"
                                        className={cn(
                                            'justify-start font-normal',
                                            !form.endDate &&
                                                'text-muted-foreground'
                                        )}
                                    >
                                        <Calendar className="size-4 mr-2 shrink-0" />
                                        {form.endDate
                                            ? format(form.endDate, 'dd/MM/yyyy')
                                            : 'Opcional...'}
                                    </Button>
                                </PopoverTrigger>
                                <PopoverContent className="p-0" align="start">
                                    <CalendarPicker
                                        mode="single"
                                        selected={form.endDate ?? undefined}
                                        onSelect={(d) => {
                                            setForm((f) => ({
                                                ...f,
                                                endDate: d ?? null,
                                            }))
                                            setEndDateOpen(false)
                                        }}
                                        locale={ptBR}
                                        disabled={(d) =>
                                            d <
                                            new Date(
                                                form.startDate.setHours(
                                                    0,
                                                    0,
                                                    0,
                                                    0
                                                )
                                            )
                                        }
                                    />
                                </PopoverContent>
                            </Popover>
                        </div>
                        <div className="flex flex-col gap-1.5">
                            <Label>Horário de fim</Label>
                            <Input
                                type="time"
                                value={form.endTime}
                                onChange={(e) =>
                                    setForm((f) => ({
                                        ...f,
                                        endTime: e.target.value,
                                    }))
                                }
                                disabled={!form.endDate}
                            />
                        </div>
                    </div>

                    {/* Limpar data fim */}
                    {form.endDate && (
                        <button
                            type="button"
                            className="text-xs text-muted-foreground underline self-start -mt-2"
                            onClick={() =>
                                setForm((f) => ({ ...f, endDate: null }))
                            }
                        >
                            Remover data de fim
                        </button>
                    )}

                    {/* Descrição */}
                    <div className="flex flex-col gap-1.5">
                        <Label>Descrição</Label>
                        <Textarea
                            placeholder="Notas sobre a atividade..."
                            value={form.description}
                            onChange={(e) =>
                                setForm((f) => ({
                                    ...f,
                                    description: e.target.value,
                                }))
                            }
                            rows={3}
                        />
                    </div>

                    {/* Obrigatória */}
                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="isRequired"
                            checked={form.isRequired}
                            onCheckedChange={(v) =>
                                setForm((f) => ({ ...f, isRequired: !!v }))
                            }
                        />
                        <Label htmlFor="isRequired" className="cursor-pointer">
                            Marcar como obrigatória
                        </Label>
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="outline"
                        onClick={() => onOpenChange(false)}
                    >
                        Cancelar
                    </Button>
                    <Button onClick={handleSubmit} disabled={isPending}>
                        {isPending && (
                            <Loader2 className="size-4 mr-2 animate-spin" />
                        )}
                        {initial ? 'Salvar alterações' : 'Criar atividade'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── ActivityCard ─────────────────────────────────────────────────────────────

interface ActivityCardProps {
    activity: Activity
    lead?: Lead
    enterpriseId: string
    onEdit: (a: Activity) => void
    compact?: boolean
}

function ActivityCard({
    activity,
    lead,
    enterpriseId,
    onEdit,
    compact = false,
}: ActivityCardProps) {
    const { mutate: toggleComplete } = useToggleActivityComplete()
    const { mutate: deleteActivity } = useDeleteActivity()
    const [deleteConfirm, setDeleteConfirm] = useState(false)

    const color = activity.activityType?.color ?? '#004B6A'
    const startDate = parseISO(activity.startAt)

    function handleToggle(e: React.MouseEvent) {
        e.stopPropagation()
        toggleComplete(
            {
                id: activity.id,
                enterpriseId,
                leadId: activity.leadId,
                completed: !activity.completed,
            },
            {
                onSuccess: () =>
                    toast.success(
                        activity.completed
                            ? 'Marcada como pendente'
                            : 'Atividade concluída!'
                    ),
            }
        )
    }

    function handleDelete() {
        deleteActivity(
            { id: activity.id, enterpriseId, leadId: activity.leadId },
            {
                onSuccess: () => toast.success('Atividade removida'),
                onError: () => toast.error('Erro ao remover atividade'),
            }
        )
    }

    if (compact) {
        return (
            <div
                className={cn(
                    'flex items-center gap-1 rounded px-1.5 py-0.5 text-[11px] leading-tight truncate cursor-pointer hover:opacity-80 transition-opacity',
                    activity.completed && 'opacity-60'
                )}
                style={{
                    backgroundColor: color + '18',
                    borderLeft: `2px solid ${color}`,
                }}
                onClick={(e) => {
                    e.stopPropagation()
                    onEdit(activity)
                }}
                title={activity.title}
            >
                {activity.completed ? (
                    <CheckCircle2
                        className="size-2.5 shrink-0"
                        style={{ color }}
                    />
                ) : (
                    <Circle className="size-2.5 shrink-0" style={{ color }} />
                )}
                <span
                    className={cn(
                        'truncate',
                        activity.completed && 'line-through'
                    )}
                >
                    {activity.title}
                </span>
            </div>
        )
    }

    return (
        <>
            <div
                className={cn(
                    'flex items-start gap-3 rounded-lg border p-3 hover:bg-muted/30 transition-colors group',
                    activity.completed && 'opacity-65'
                )}
            >
                {/* Toggle completo */}
                <button
                    onClick={handleToggle}
                    className="mt-0.5 shrink-0 hover:scale-110 transition-transform"
                    title={
                        activity.completed
                            ? 'Marcar como pendente'
                            : 'Marcar como concluída'
                    }
                >
                    {activity.completed ? (
                        <CheckCircle2 className="size-5 text-green-500" />
                    ) : (
                        <Circle className="size-5 text-muted-foreground hover:text-primary" />
                    )}
                </button>

                {/* Indicador de cor */}
                <div
                    className="w-0.5 self-stretch rounded-full shrink-0 mt-0.5"
                    style={{ backgroundColor: color }}
                />

                {/* Conteúdo */}
                <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                            <p
                                className={cn(
                                    'text-sm font-medium',
                                    activity.completed &&
                                        'line-through text-muted-foreground'
                                )}
                            >
                                {activity.title}
                            </p>

                            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 mt-1.5">
                                {/* Hora */}
                                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                    <Clock className="size-3" />
                                    {format(startDate, 'HH:mm')}
                                    {activity.endAt &&
                                        ` – ${format(parseISO(activity.endAt), 'HH:mm')}`}
                                </span>

                                {/* Lead */}
                                {lead && (
                                    <span className="flex items-center gap-1 text-xs text-muted-foreground">
                                        <User className="size-3" />
                                        {lead.name}
                                    </span>
                                )}

                                {/* Tipo */}
                                {activity.activityType && (
                                    <Badge
                                        variant="outline"
                                        className="text-[11px] py-0 px-1.5 h-4 font-normal"
                                        style={{
                                            backgroundColor:
                                                color + '18',
                                            color,
                                            borderColor: color + '40',
                                        }}
                                    >
                                        {activity.activityType.name}
                                    </Badge>
                                )}

                                {/* Obrigatória */}
                                {activity.isRequired && !activity.completed && (
                                    <span className="flex items-center gap-0.5 text-[11px] text-red-500">
                                        <AlertCircle className="size-3" />
                                        Obrigatória
                                    </span>
                                )}
                            </div>

                            {activity.description && (
                                <p className="text-xs text-muted-foreground mt-1.5 line-clamp-2">
                                    {activity.description}
                                </p>
                            )}
                        </div>

                        {/* Ações */}
                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    variant="ghost"
                                    size="icon"
                                    className="size-7 opacity-0 group-hover:opacity-100 transition-opacity shrink-0"
                                    onClick={(e) => e.stopPropagation()}
                                >
                                    <MoreHorizontal className="size-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                    onClick={() => onEdit(activity)}
                                >
                                    <Pencil className="size-4 mr-2" />
                                    Editar
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem
                                    className="text-destructive focus:text-destructive"
                                    onClick={() => setDeleteConfirm(true)}
                                >
                                    <Trash2 className="size-4 mr-2" />
                                    Remover
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>
                </div>
            </div>

            <AlertDialog open={deleteConfirm} onOpenChange={setDeleteConfirm}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover atividade?</AlertDialogTitle>
                        <AlertDialogDescription>
                            Esta ação não pode ser desfeita. A atividade "
                            {activity.title}" será permanentemente removida.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-destructive hover:bg-destructive/90"
                        >
                            Remover
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── MonthView ────────────────────────────────────────────────────────────────

interface MonthViewProps {
    currentDate: Date
    activities: Activity[]
    leads: Lead[]
    enterpriseId: string
    onDayClick: (date: Date) => void
    onActivityClick: (activity: Activity) => void
}

function MonthView({
    currentDate,
    activities,
    leads,
    enterpriseId,
    onDayClick,
    onActivityClick,
}: MonthViewProps) {
    const monthStart = startOfMonth(currentDate)
    const monthEnd = endOfMonth(currentDate)
    const calendarStart = startOfWeek(monthStart, { weekStartsOn: 0 })
    const calendarEnd = endOfWeek(monthEnd, { weekStartsOn: 0 })
    const days = eachDayOfInterval({ start: calendarStart, end: calendarEnd })

    const activitiesByDay = useMemo(() => {
        const map = new Map<string, Activity[]>()
        activities.forEach((a) => {
            const key = format(parseISO(a.startAt), 'yyyy-MM-dd')
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(a)
        })
        return map
    }, [activities])

    const leadsMap = useMemo(() => {
        const map = new Map<string, Lead>()
        leads.forEach((l) => map.set(l.id, l))
        return map
    }, [leads])

    const MAX_SHOW = 3

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* Cabeçalho dos dias da semana */}
            <div className="grid grid-cols-7 border-b shrink-0">
                {WEEK_DAYS.map((d) => (
                    <div
                        key={d}
                        className="py-2 text-center text-xs font-medium text-muted-foreground select-none"
                    >
                        {d}
                    </div>
                ))}
            </div>

            {/* Grade de dias */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto auto-rows-fr">
                {days.map((day) => {
                    const key = format(day, 'yyyy-MM-dd')
                    const dayActivities = (
                        activitiesByDay.get(key) ?? []
                    ).sort(
                        (a, b) =>
                            parseISO(a.startAt).getTime() -
                            parseISO(b.startAt).getTime()
                    )
                    const isCurrentMonth = isSameMonth(day, currentDate)
                    const isCurrentDay = isToday(day)
                    const extra = dayActivities.length - MAX_SHOW

                    return (
                        <div
                            key={key}
                            className={cn(
                                'border-b border-r p-1 flex flex-col gap-0.5 min-h-[110px] cursor-pointer hover:bg-muted/20 transition-colors',
                                !isCurrentMonth && 'bg-muted/10'
                            )}
                            onClick={() => onDayClick(day)}
                        >
                            {/* Número do dia */}
                            <div className="flex justify-end">
                                <span
                                    className={cn(
                                        'flex items-center justify-center text-xs font-medium w-6 h-6 rounded-full select-none',
                                        isCurrentDay &&
                                            'bg-primary text-primary-foreground',
                                        !isCurrentDay &&
                                            !isCurrentMonth &&
                                            'text-muted-foreground/50',
                                        !isCurrentDay &&
                                            isCurrentMonth &&
                                            'text-foreground'
                                    )}
                                >
                                    {format(day, 'd')}
                                </span>
                            </div>

                            {/* Atividades */}
                            <div className="flex flex-col gap-0.5 flex-1">
                                {dayActivities
                                    .slice(0, MAX_SHOW)
                                    .map((a) => (
                                        <ActivityCard
                                            key={a.id}
                                            activity={a}
                                            lead={leadsMap.get(a.leadId)}
                                            enterpriseId={enterpriseId}
                                            onEdit={onActivityClick}
                                            compact
                                        />
                                    ))}
                                {extra > 0 && (
                                    <span className="text-[10px] text-muted-foreground pl-1">
                                        +{extra} mais
                                    </span>
                                )}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── ListView ─────────────────────────────────────────────────────────────────

interface ListViewProps {
    activities: Activity[]
    leads: Lead[]
    enterpriseId: string
    onActivityClick: (activity: Activity) => void
}

function ListView({
    activities,
    leads,
    enterpriseId,
    onActivityClick,
}: ListViewProps) {
    const leadsMap = useMemo(() => {
        const map = new Map<string, Lead>()
        leads.forEach((l) => map.set(l.id, l))
        return map
    }, [leads])

    const grouped = useMemo(() => {
        const map = new Map<string, Activity[]>()
        const sorted = [...activities].sort(
            (a, b) =>
                parseISO(a.startAt).getTime() - parseISO(b.startAt).getTime()
        )
        sorted.forEach((a) => {
            const key = format(parseISO(a.startAt), 'yyyy-MM-dd')
            if (!map.has(key)) map.set(key, [])
            map.get(key)!.push(a)
        })
        return Array.from(map.entries())
    }, [activities])

    if (activities.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center flex-1 gap-3 text-muted-foreground">
                <CalendarCheck className="size-12 opacity-25" />
                <p className="text-sm">Nenhuma atividade neste período</p>
            </div>
        )
    }

    return (
        <div className="flex-1 overflow-y-auto">
            <div className="flex flex-col gap-8 p-4 max-w-3xl mx-auto">
                {grouped.map(([dateKey, dayActivities]) => {
                    const date = parseISO(dateKey)
                    const isThisToday = isToday(date)
                    const label = isThisToday
                        ? 'Hoje'
                        : format(date, "EEEE, d 'de' MMMM", { locale: ptBR })

                    return (
                        <div key={dateKey}>
                            {/* Cabeçalho do dia */}
                            <div className="flex items-center gap-3 mb-3">
                                <div
                                    className={cn(
                                        'flex flex-col items-center justify-center w-10 h-10 rounded-lg shrink-0 border',
                                        isThisToday
                                            ? 'bg-primary text-primary-foreground border-primary'
                                            : 'bg-muted/50 border-border'
                                    )}
                                >
                                    <span className="text-[10px] font-medium leading-none uppercase">
                                        {format(date, 'EEE', { locale: ptBR })}
                                    </span>
                                    <span className="text-base font-bold leading-none mt-0.5">
                                        {format(date, 'd')}
                                    </span>
                                </div>
                                <div>
                                    <p className="text-sm font-semibold capitalize">
                                        {label}
                                    </p>
                                    <p className="text-xs text-muted-foreground">
                                        {format(date, 'MMMM yyyy', {
                                            locale: ptBR,
                                        })}
                                        {' · '}
                                        {dayActivities.length} atividade
                                        {dayActivities.length !== 1 && 's'}
                                    </p>
                                </div>
                            </div>

                            {/* Cards */}
                            <div className="flex flex-col gap-2">
                                {dayActivities.map((a) => (
                                    <ActivityCard
                                        key={a.id}
                                        activity={a}
                                        lead={leadsMap.get(a.leadId)}
                                        enterpriseId={enterpriseId}
                                        onEdit={onActivityClick}
                                    />
                                ))}
                            </div>
                        </div>
                    )
                })}
            </div>
        </div>
    )
}

// ─── AgendaPage ───────────────────────────────────────────────────────────────

export default function AgendaPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [viewMode, setViewMode] = useState<ViewMode>('month')
    const [currentDate, setCurrentDate] = useState(() => new Date())

    // Range de datas para busca
    const { from, to } = useMemo(() => {
        const mStart = startOfMonth(currentDate)
        const mEnd = endOfMonth(currentDate)
        return {
            from: format(startOfWeek(mStart, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
            to: format(endOfWeek(mEnd, { weekStartsOn: 0 }), 'yyyy-MM-dd'),
        }
    }, [currentDate])

    const { data: activities = [], isLoading } = useEnterpriseActivities(
        enterpriseId,
        from,
        to
    )
    const { data: leads = [] } = useLeads(enterpriseId)
    const { data: activityTypes = [] } = useListActivityTypes(enterpriseId)

    // Diálogo
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingActivity, setEditingActivity] = useState<Activity | null>(null)
    const [selectedDate, setSelectedDate] = useState<Date | undefined>(
        undefined
    )

    // Filtros
    const [filterType, setFilterType] = useState<string>('all')
    const [filterStatus, setFilterStatus] = useState<
        'all' | 'pending' | 'completed'
    >('all')

    const filteredActivities = useMemo(() => {
        return activities.filter((a) => {
            if (filterType !== 'all' && a.typeId !== filterType) return false
            if (filterStatus === 'pending' && a.completed) return false
            if (filterStatus === 'completed' && !a.completed) return false
            return true
        })
    }, [activities, filterType, filterStatus])

    const stats = useMemo(() => {
        const total = filteredActivities.length
        const completed = filteredActivities.filter((a) => a.completed).length
        const pending = total - completed
        const required = filteredActivities.filter(
            (a) => a.isRequired && !a.completed
        ).length
        return { total, completed, pending, required }
    }, [filteredActivities])

    function handlePrev() {
        setCurrentDate((d) => subMonths(d, 1))
    }

    function handleNext() {
        setCurrentDate((d) => addMonths(d, 1))
    }

    function handleToday() {
        setCurrentDate(new Date())
    }

    function handleDayClick(date: Date) {
        setEditingActivity(null)
        setSelectedDate(date)
        setDialogOpen(true)
    }

    function handleActivityClick(activity: Activity) {
        setEditingActivity(activity)
        setSelectedDate(undefined)
        setDialogOpen(true)
    }

    function handleCreateNew() {
        setEditingActivity(null)
        setSelectedDate(new Date())
        setDialogOpen(true)
    }

    const title = format(currentDate, "MMMM 'de' yyyy", { locale: ptBR })

    return (
        <div className="flex flex-col flex-1 min-h-0 overflow-hidden">
            {/* ── Cabeçalho ──────────────────────────────────────────────────── */}
            <div className="flex items-center justify-between gap-3 px-5 py-3 border-b shrink-0 flex-wrap gap-y-2">
                <div className="flex items-center gap-2">
                    {/* Toggle de modo */}
                    <div className="flex rounded-md border overflow-hidden shrink-0">
                        <button
                            onClick={() => setViewMode('month')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                                viewMode === 'month'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            <CalendarDays className="size-3.5" />
                            Mês
                        </button>
                        <button
                            onClick={() => setViewMode('list')}
                            className={cn(
                                'flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium transition-colors',
                                viewMode === 'list'
                                    ? 'bg-primary text-primary-foreground'
                                    : 'text-muted-foreground hover:bg-muted'
                            )}
                        >
                            <List className="size-3.5" />
                            Lista
                        </button>
                    </div>

                    {/* Navegação de data */}
                    <div className="flex items-center gap-1 shrink-0">
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={handlePrev}
                        >
                            <ChevronLeft className="size-4" />
                        </Button>
                        <Button
                            variant="outline"
                            size="sm"
                            className="h-8 text-xs px-2.5"
                            onClick={handleToday}
                        >
                            Hoje
                        </Button>
                        <Button
                            variant="outline"
                            size="icon"
                            className="size-8"
                            onClick={handleNext}
                        >
                            <ChevronRight className="size-4" />
                        </Button>
                    </div>

                    {/* Título do período */}
                    <h1 className="text-sm font-semibold capitalize hidden sm:block">
                        {title}
                    </h1>
                </div>

                <div className="flex items-center gap-2">
                    {/* Filtro por tipo */}
                    <Select value={filterType} onValueChange={setFilterType}>
                        <SelectTrigger className="h-8 text-xs w-[150px]">
                            <SelectValue placeholder="Todos os tipos" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos os tipos</SelectItem>
                            {activityTypes.map((t) => (
                                <SelectItem key={t.id} value={t.id}>
                                    <div className="flex items-center gap-2">
                                        <span
                                            className="size-2 rounded-full shrink-0"
                                            style={{
                                                backgroundColor: t.color,
                                            }}
                                        />
                                        {t.name}
                                    </div>
                                </SelectItem>
                            ))}
                        </SelectContent>
                    </Select>

                    {/* Filtro por status */}
                    <Select
                        value={filterStatus}
                        onValueChange={(v) =>
                            setFilterStatus(v as typeof filterStatus)
                        }
                    >
                        <SelectTrigger className="h-8 text-xs w-[120px]">
                            <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="all">Todos</SelectItem>
                            <SelectItem value="pending">Pendentes</SelectItem>
                            <SelectItem value="completed">Concluídas</SelectItem>
                        </SelectContent>
                    </Select>

                    {/* Botão criar */}
                    <Button
                        size="sm"
                        className="h-8 gap-1.5"
                        onClick={handleCreateNew}
                    >
                        <Plus className="size-4" />
                        <span className="hidden sm:inline">Nova atividade</span>
                        <span className="sm:hidden">Nova</span>
                    </Button>
                </div>
            </div>

            {/* ── Barra de estatísticas ───────────────────────────────────────── */}
            <div className="flex items-center gap-5 px-5 py-1.5 border-b bg-muted/20 text-xs shrink-0">
                <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        {stats.total}
                    </span>{' '}
                    total
                </span>
                <span className="text-muted-foreground">
                    <span className="font-semibold text-green-600">
                        {stats.completed}
                    </span>{' '}
                    concluídas
                </span>
                <span className="text-muted-foreground">
                    <span className="font-semibold text-foreground">
                        {stats.pending}
                    </span>{' '}
                    pendentes
                </span>
                {stats.required > 0 && (
                    <span className="flex items-center gap-1 text-red-500">
                        <AlertCircle className="size-3" />
                        <span className="font-semibold">{stats.required}</span>{' '}
                        obrigatória{stats.required !== 1 && 's'} pendente
                        {stats.required !== 1 && 's'}
                    </span>
                )}
            </div>

            {/* ── Conteúdo ─────────────────────────────────────────────────────── */}
            {isLoading ? (
                <div className="flex items-center justify-center flex-1 gap-2 text-muted-foreground">
                    <Loader2 className="size-5 animate-spin" />
                    <span className="text-sm">Carregando atividades...</span>
                </div>
            ) : viewMode === 'month' ? (
                <MonthView
                    currentDate={currentDate}
                    activities={filteredActivities}
                    leads={leads}
                    enterpriseId={enterpriseId}
                    onDayClick={handleDayClick}
                    onActivityClick={handleActivityClick}
                />
            ) : (
                <ListView
                    activities={filteredActivities}
                    leads={leads}
                    enterpriseId={enterpriseId}
                    onActivityClick={handleActivityClick}
                />
            )}

            {/* ── Diálogo ───────────────────────────────────────────────────────── */}
            <ActivityDialog
                key={
                    dialogOpen
                        ? (editingActivity?.id ??
                          `new-${selectedDate?.getTime() ?? 0}`)
                        : 'closed'
                }
                open={dialogOpen}
                onOpenChange={setDialogOpen}
                initial={editingActivity}
                initialDate={selectedDate}
                enterpriseId={enterpriseId}
            />
        </div>
    )
}
