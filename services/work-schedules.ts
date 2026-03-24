'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

export type TimeRange = {
    start: string  // "09:00"
    end: string    // "17:00"
}

export type DaySchedule = {
    enabled: boolean
    ranges: TimeRange[]
}

export type WorkScheduleHours = {
    sunday: DaySchedule
    monday: DaySchedule
    tuesday: DaySchedule
    wednesday: DaySchedule
    thursday: DaySchedule
    friday: DaySchedule
    saturday: DaySchedule
}

export type WorkSchedule = {
    id: string
    enterpriseId: string
    name: string
    timezone: string
    hours: WorkScheduleHours
    createdAt: string
    updatedAt: string
}

export const DAY_KEYS = [
    'sunday', 'monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday',
] as const

export const DAY_LABELS: Record<string, string> = {
    sunday: 'Domingo',
    monday: 'Segunda-feira',
    tuesday: 'Terça-feira',
    wednesday: 'Quarta-feira',
    thursday: 'Quinta-feira',
    friday: 'Sexta-feira',
    saturday: 'Sábado',
}

export const DEFAULT_HOURS: WorkScheduleHours = {
    sunday:    { enabled: false, ranges: [{ start: '09:00', end: '17:00' }] },
    monday:    { enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
    tuesday:   { enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
    wednesday: { enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
    thursday:  { enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
    friday:    { enabled: true,  ranges: [{ start: '09:00', end: '17:00' }] },
    saturday:  { enabled: false, ranges: [{ start: '09:00', end: '17:00' }] },
}

export const TIMEZONES = [
    'America/Sao_Paulo',
    'America/Manaus',
    'America/Belem',
    'America/Fortaleza',
    'America/Recife',
    'America/Bahia',
    'America/Cuiaba',
    'America/Porto_Velho',
    'America/Boa_Vista',
    'America/Rio_Branco',
    'America/Noronha',
    'UTC',
]

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Calcula média diária em horas dos dias ativos */
export function calcDailyAverage(hours: WorkScheduleHours): number {
    let total = 0
    let activeDays = 0
    for (const key of DAY_KEYS) {
        const day = hours[key]
        if (!day.enabled) continue
        activeDays++
        for (const range of day.ranges) {
            const [sh, sm] = range.start.split(':').map(Number)
            const [eh, em] = range.end.split(':').map(Number)
            total += (eh * 60 + em - sh * 60 - sm) / 60
        }
    }
    return activeDays > 0 ? total / activeDays : 0
}

/** Resumo dos dias ativos: "Segunda-feira - Sexta-feira" ou lista */
export function summarizeDays(hours: WorkScheduleHours): string {
    const active = DAY_KEYS.filter(k => hours[k].enabled)
    if (active.length === 0) return 'Nenhum dia'
    if (active.length === 7) return 'Todos os dias'

    const weekdays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday']
    const isFullWeek = weekdays.every(d => active.includes(d as typeof DAY_KEYS[number]))

    if (isFullWeek && active.length === 5) return 'Segunda-feira - Sexta-feira'
    if (isFullWeek && active.includes('saturday') && active.length === 6) return 'Segunda-feira - Sábado'

    if (active.length <= 3) return active.map(k => DAY_LABELS[k].split('-')[0].trim()).join(', ')
    return `${active.length} dias`
}

/** Resumo dos horários do primeiro dia ativo */
export function summarizeHours(hours: WorkScheduleHours): string {
    const active = DAY_KEYS.filter(k => hours[k].enabled)
    if (active.length === 0) return '—'

    const allSame = active.every(k => {
        const r0 = hours[active[0]].ranges[0]
        const rk = hours[k].ranges[0]
        return hours[k].ranges.length === 1 && r0.start === rk.start && r0.end === rk.end
    })

    if (allSame && active.length > 0) {
        const r = hours[active[0]].ranges[0]
        return `${r.start} - ${r.end}`
    }
    return 'Vários horários'
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listWorkSchedulesFn(enterpriseId: string, search?: string): Promise<WorkSchedule[]> {
    const params = new URLSearchParams()
    if (search) params.set('search', search)
    const qs = params.toString() ? `?${params}` : ''
    const { data } = await api.get<WorkSchedule[]>(
        `/work-schedules/${enterpriseId}${qs}`,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function createWorkScheduleFn(payload: {
    enterpriseId: string
    name: string
    timezone: string
    hours: WorkScheduleHours
}): Promise<WorkSchedule> {
    const { data } = await api.post<WorkSchedule>('/work-schedules', payload, {
        headers: { 'X-Enterprise-Id': payload.enterpriseId },
    })
    return data
}

async function updateWorkScheduleFn(payload: {
    id: string
    enterpriseId: string
    name?: string
    timezone?: string
    hours?: WorkScheduleHours
}): Promise<WorkSchedule> {
    const { id, enterpriseId, ...body } = payload
    const { data } = await api.put<WorkSchedule>(`/work-schedules/${id}`, body, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteWorkScheduleFn(payload: { id: string; enterpriseId: string }): Promise<void> {
    await api.delete(`/work-schedules/${payload.id}`, {
        headers: { 'X-Enterprise-Id': payload.enterpriseId },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListWorkSchedules(enterpriseId: string, search?: string) {
    return useQuery({
        queryKey: ['work-schedules', enterpriseId, search],
        queryFn: () => listWorkSchedulesFn(enterpriseId, search),
        enabled: !!enterpriseId,
    })
}

export function useCreateWorkSchedule() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: createWorkScheduleFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['work-schedules', vars.enterpriseId] })
        },
    })
}

export function useUpdateWorkSchedule() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: updateWorkScheduleFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['work-schedules', vars.enterpriseId] })
        },
    })
}

export function useDeleteWorkSchedule() {
    const qc = useQueryClient()
    return useMutation({
        mutationFn: deleteWorkScheduleFn,
        onSuccess: (_, vars) => {
            qc.invalidateQueries({ queryKey: ['work-schedules', vars.enterpriseId] })
        },
    })
}
