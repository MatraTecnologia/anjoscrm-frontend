'use client'

import { useState, useRef, useEffect } from 'react'
import dynamic from 'next/dynamic'
import { format, subDays, subMonths, startOfDay, endOfDay } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import type { DateRange } from 'react-day-picker'
import {
    CalendarDays, TrendingUp, TrendingDown, Activity, BarChart2,
    ChevronLeft, ChevronRight, Loader2, MessageSquare, CheckCheck,
    Clock, Users,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Calendar } from '@/components/ui/calendar'
import { useEnterprise } from '@/hooks/use-enterprise'
import { useDashNegocios, useDashMessages } from '@/services/dashboard'

// Debug helper — exibir erros de API no console
function useDebugError(label: string, error: unknown) {
    useEffect(() => {
        if (error) console.error(`[Dashboard] ${label}:`, error)
    }, [error, label])
}

const ReactApexChart = dynamic(() => import('react-apexcharts'), { ssr: false })

// ─── Types ────────────────────────────────────────────────────────────────────

type Tab = 'negocios' | 'multiatendimento' | 'atividades'

const TABS: { id: Tab; label: string }[] = [
    { id: 'negocios', label: 'Negócios' },
    { id: 'multiatendimento', label: 'Multiatendimento' },
    { id: 'atividades', label: 'Atividades' },
]

type DateRangeState = { from: Date; to: Date }

// ─── Date helpers ─────────────────────────────────────────────────────────────

function defaultRange(): DateRangeState {
    return { from: subMonths(new Date(), 12), to: new Date() }
}

function fmtDate(d: Date) { return format(d, 'MMM d, yyyy', { locale: ptBR }) }
function toISO(d: Date)   { return format(d, 'yyyy-MM-dd') }

// ─── DateRangePicker ──────────────────────────────────────────────────────────

const PRESETS = [
    { label: 'Hoje',           range: () => ({ from: startOfDay(new Date()), to: endOfDay(new Date()) }) },
    { label: 'Últimos 7 dias', range: () => ({ from: subDays(new Date(), 7), to: new Date() }) },
    { label: 'Últimos 15 dias',range: () => ({ from: subDays(new Date(), 15), to: new Date() }) },
    { label: 'Últimos 3 meses',range: () => ({ from: subMonths(new Date(), 3), to: new Date() }) },
    { label: 'Último ano',     range: () => ({ from: subMonths(new Date(), 12), to: new Date() }) },
]

function DateRangePicker({
    value,
    onChange,
}: {
    value: DateRangeState
    onChange: (r: DateRangeState) => void
}) {
    const [open, setOpen] = useState(false)
    const [picking, setPicking] = useState<DateRange>({ from: value.from, to: value.to })
    const ref = useRef<HTMLDivElement>(null)

    useEffect(() => {
        function onClickOutside(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
        }
        document.addEventListener('mousedown', onClickOutside)
        return () => document.removeEventListener('mousedown', onClickOutside)
    }, [])

    function applyPreset(r: DateRangeState) {
        onChange(r)
        setPicking({ from: r.from, to: r.to })
        setOpen(false)
    }

    function handleSelect(range: DateRange | undefined) {
        if (!range) return
        setPicking(range)
        if (range.from && range.to) {
            onChange({ from: range.from, to: range.to })
            setOpen(false)
        }
    }

    return (
        <div className="relative" ref={ref}>
            <button
                onClick={() => setOpen(v => !v)}
                className="flex items-center gap-2 rounded-lg border px-3 py-2 text-sm text-muted-foreground hover:bg-muted transition-colors"
            >
                <CalendarDays className="size-4 shrink-0" />
                <span>{fmtDate(value.from)} - {fmtDate(value.to)}</span>
            </button>

            {open && (
                <div className="absolute right-0 top-[calc(100%+6px)] z-50 flex rounded-xl border bg-popover shadow-lg">
                    {/* Presets */}
                    <div className="flex flex-col border-r py-3 px-2 min-w-36">
                        <p className="px-2 pb-1 text-xs font-medium text-muted-foreground">Selecione</p>
                        {PRESETS.map(p => (
                            <button
                                key={p.label}
                                onClick={() => applyPreset(p.range())}
                                className="rounded-md px-3 py-2 text-left text-sm hover:bg-muted transition-colors"
                            >
                                {p.label}
                            </button>
                        ))}
                    </div>

                    {/* Dual-month calendar */}
                    <div className="p-3">
                        <Calendar
                            mode="range"
                            numberOfMonths={2}
                            selected={picking}
                            onSelect={handleSelect}
                            locale={ptBR}
                        />
                    </div>
                </div>
            )}
        </div>
    )
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function fmtBRL(v: number) {
    return v.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function monthLabel(key: string) {
    const [y, m] = key.split('-')
    return `${m}/${String(y).slice(2)}`
}

function LeadInitials({ name, image, size = 6 }: { name: string; image?: string | null; size?: number }) {
    const initials = name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
    if (image) return (
        <img src={image} alt={name} className={`size-${size} rounded-full object-cover shrink-0`} />
    )
    const hue = name.split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360
    return (
        <div
            className={`flex size-${size} shrink-0 items-center justify-center rounded-full text-xs font-bold text-white`}
            style={{ backgroundColor: `hsl(${hue}, 55%, 48%)` }}
        >
            {initials}
        </div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function DashboardPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''

    const [activeTab, setActiveTab] = useState<Tab>('negocios')

    // ── Estados independentes por aba ──────────────────────────────────────────
    const [negRangeState, setNegRangeState]   = useState<DateRangeState>(defaultRange)
    const [chatRangeState, setChatRangeState] = useState<DateRangeState>(defaultRange)
    const [negMetric, setNegMetric]           = useState<'Valor' | 'Quantidade'>('Valor')
    const [kpiPage, setKpiPage]               = useState(0)

    const negFrom = toISO(negRangeState.from)
    const negTo   = toISO(negRangeState.to)
    const chatFrom = toISO(chatRangeState.from)
    const chatTo   = toISO(chatRangeState.to)

    const { data: negData, isLoading: negLoading, error: negError } = useDashNegocios(enterpriseId, negFrom, negTo)
    const { data: chatData, isLoading: chatLoading, error: chatError } = useDashMessages(enterpriseId, chatFrom, chatTo)

    useDebugError('negócios', negError)
    useDebugError('messages', chatError)

    // ── KPI cards de negócios ──────────────────────────────────────────────────
    const negKpiCards = negData ? [
        {
            label: 'Total negócios',
            value: fmtBRL(negData.kpis.total.value),
            count: `${negData.kpis.total.count} negócio${negData.kpis.total.count !== 1 ? 's' : ''}`,
            change: '0%', positive: true, icon: BarChart2, color: 'text-blue-500',
        },
        {
            label: 'Total ganhos',
            value: fmtBRL(negData.kpis.ganhos.value),
            count: `${negData.kpis.ganhos.count} negócio${negData.kpis.ganhos.count !== 1 ? 's' : ''}`,
            change: '0%', positive: true, icon: TrendingUp, color: 'text-emerald-500',
        },
        {
            label: 'Total perdidos',
            value: fmtBRL(negData.kpis.perdidos.value),
            count: `${negData.kpis.perdidos.count} negócio${negData.kpis.perdidos.count !== 1 ? 's' : ''}`,
            change: '0%', positive: false, icon: TrendingDown, color: 'text-red-500',
        },
        {
            label: 'Total em aberto',
            value: fmtBRL(negData.kpis.emAberto.value),
            count: `${negData.kpis.emAberto.count} negócio${negData.kpis.emAberto.count !== 1 ? 's' : ''}`,
            change: '0%', positive: true, icon: Activity, color: 'text-violet-500',
        },
    ] : []

    const cardsPerPage = 4
    const visibleCards = negKpiCards.slice(kpiPage * cardsPerPage, (kpiPage + 1) * cardsPerPage)
    const canPrev = kpiPage > 0
    const canNext = (kpiPage + 1) * cardsPerPage < negKpiCards.length

    // ── Chart configs ──────────────────────────────────────────────────────────
    const barCategories = negData?.monthly.map(m => monthLabel(m.month)) ?? []
    const barValues     = negData?.monthly.map(m => negMetric === 'Valor' ? m.value : m.count) ?? []

    const barOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        dataLabels: { enabled: false },
        grid: {
            borderColor: 'var(--border)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
            yaxis: { lines: { show: true } },
        },
        xaxis: {
            categories: barCategories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '10px', colors: 'var(--muted-foreground)' } },
        },
        yaxis: {
            labels: {
                style: { fontSize: '10px', colors: 'var(--muted-foreground)' },
                formatter: negMetric === 'Valor' ? (v) => `R$ ${Number(v).toFixed(0)}` : (v) => String(Math.round(Number(v))),
            },
        },
        tooltip: {
            y: { formatter: negMetric === 'Valor' ? (v) => fmtBRL(Number(v)) : (v) => String(v) },
            theme: 'light',
        },
        colors: ['#1535C8'],
    }

    // Donut
    const donutLabels  = negData?.byAssignee.map(a => a.name) ?? []
    const donutValues  = negData?.byAssignee.map(a => negMetric === 'Valor' ? a.value : a.count) ?? []
    const hasDonut     = donutValues.some(v => v > 0)

    const donutOptions: ApexCharts.ApexOptions = {
        chart: { type: 'donut', background: 'transparent', fontFamily: 'inherit' },
        labels: donutLabels,
        dataLabels: { enabled: false },
        legend: { show: false },
        colors: ['#1535C8', '#2a4fd6', '#4067e0', '#6685e8', '#99aaee'],
        plotOptions: {
            pie: { donut: { size: '68%', labels: { show: false } } },
        },
        tooltip: {
            y: { formatter: negMetric === 'Valor' ? (v) => fmtBRL(Number(v)) : (v) => `${v} negócio${Number(v) !== 1 ? 's' : ''}` },
        },
    }

    // Messages bar chart
    const chatBarCategories = chatData?.monthly.map(m => monthLabel(m.month)) ?? []
    const chatBarValues     = chatData?.monthly.map(m => m.count) ?? []
    const chatBarOptions: ApexCharts.ApexOptions = {
        chart: { type: 'bar', toolbar: { show: false }, fontFamily: 'inherit', background: 'transparent' },
        plotOptions: { bar: { borderRadius: 4, columnWidth: '40%' } },
        dataLabels: { enabled: false },
        grid: {
            borderColor: 'var(--border)',
            strokeDashArray: 4,
            xaxis: { lines: { show: false } },
        },
        xaxis: {
            categories: chatBarCategories,
            axisBorder: { show: false },
            axisTicks: { show: false },
            labels: { style: { fontSize: '10px', colors: 'var(--muted-foreground)' } },
        },
        yaxis: {
            labels: {
                style: { fontSize: '10px', colors: 'var(--muted-foreground)' },
                formatter: (v) => String(Math.round(Number(v))),
            },
        },
        colors: ['#f97316'],
        tooltip: { theme: 'light' },
    }

    // Heatmap days/hours
    const DAYS    = ['Dom', 'Seg', 'Ter', 'Qua', 'Qui', 'Sex', 'Sáb']
    const HOURS   = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
    const heatmap = chatData?.heatmap ?? {}
    const heatMax = Math.max(1, ...Object.values(heatmap))

    const currentRange: DateRangeState = activeTab === 'multiatendimento' ? chatRangeState : negRangeState
    const setCurrentRange = activeTab === 'multiatendimento' ? setChatRangeState : setNegRangeState

    return (
        <div className="flex flex-col flex-1 min-h-0">
            {/* ── Header ───────────────────────────────────────────────────────── */}
            <div className="flex items-start justify-between gap-4 px-6 pt-6 pb-4 border-b">
                <div>
                    <h1 className="text-2xl font-semibold tracking-tight">Dashboard</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Visão geral do seu desempenho e atividades</p>
                </div>

                <div className="flex items-center gap-3">
                    <DateRangePicker value={currentRange} onChange={setCurrentRange} />

                    <div className="flex items-center rounded-lg border bg-muted/40 p-0.5 gap-0.5">
                        {TABS.map(tab => (
                            <button
                                key={tab.id}
                                onClick={() => setActiveTab(tab.id)}
                                className={cn(
                                    'px-4 py-1.5 rounded-md text-sm font-medium transition-colors',
                                    activeTab === tab.id
                                        ? 'bg-background text-primary shadow-sm'
                                        : 'text-muted-foreground hover:text-foreground',
                                )}
                            >
                                {tab.label}
                            </button>
                        ))}
                    </div>
                </div>
            </div>

            {/* ── Content ──────────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto p-6 flex flex-col gap-6">

                {/* ════════════════ ABA NEGÓCIOS ════════════════ */}
                {activeTab === 'negocios' && (
                    <>
                        {/* KPI cards */}
                        <div className="relative">
                            {negLoading ? (
                                <div className="grid grid-cols-4 gap-4">
                                    {Array.from({ length: 4 }).map((_, i) => (
                                        <div key={i} className="rounded-xl border bg-card p-4 h-28 flex items-center justify-center">
                                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <div className="grid grid-cols-4 gap-4">
                                    {visibleCards.map(card => {
                                        const Icon = card.icon
                                        return (
                                            <div key={card.label} className="rounded-xl border bg-card p-4 flex flex-col gap-3">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-sm text-muted-foreground">{card.label}</span>
                                                    <span className={cn(
                                                        'text-xs font-medium px-2 py-0.5 rounded-full',
                                                        card.positive ? 'bg-emerald-500/10 text-emerald-600' : 'bg-red-500/10 text-red-600',
                                                    )}>
                                                        {card.change}
                                                    </span>
                                                </div>
                                                <div>
                                                    <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                                                    <p className="text-xs text-muted-foreground mt-0.5">{card.count}</p>
                                                </div>
                                                <Icon className={cn('size-5 self-end', card.color)} />
                                            </div>
                                        )
                                    })}
                                </div>
                            )}
                            {canPrev && (
                                <button
                                    onClick={() => setKpiPage(p => p - 1)}
                                    className="absolute -left-4 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                                >
                                    <ChevronLeft className="size-4" />
                                </button>
                            )}
                            {canNext && (
                                <button
                                    onClick={() => setKpiPage(p => p + 1)}
                                    className="absolute -right-4 top-1/2 -translate-y-1/2 flex size-7 items-center justify-center rounded-full border bg-background shadow-sm hover:bg-muted"
                                >
                                    <ChevronRight className="size-4" />
                                </button>
                            )}
                        </div>

                        {/* Charts row */}
                        <div className="grid grid-cols-3 gap-4">
                            {/* Dados mensais */}
                            <div className="col-span-2 rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Dados mensais</p>
                                        <p className="text-xs text-muted-foreground">
                                            Visualização por {negMetric === 'Valor' ? 'valor' : 'quantidade'} dos negócios
                                        </p>
                                    </div>
                                    <MetricSelect value={negMetric} onChange={setNegMetric} />
                                </div>

                                {negLoading ? (
                                    <div className="h-52 flex items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="h-52 -mx-2">
                                        <ReactApexChart
                                            key={`neg-bar-${negFrom}-${negTo}-${negMetric}`}
                                            type="bar"
                                            options={barOptions}
                                            series={[{ name: negMetric, data: barValues }]}
                                            height="100%"
                                            width="100%"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Percentual por atendente */}
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <div className="flex items-center justify-between">
                                    <div>
                                        <p className="font-medium">Percentual por atendente</p>
                                        <p className="text-xs text-muted-foreground">
                                            Visualização por {negMetric === 'Valor' ? 'valor' : 'quantidade'}
                                        </p>
                                    </div>
                                    <MetricSelect value={negMetric} onChange={setNegMetric} />
                                </div>

                                {negLoading ? (
                                    <div className="h-52 flex items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : hasDonut ? (
                                    <div className="flex flex-col gap-3">
                                        <div className="flex justify-center">
                                            <ReactApexChart
                                                type="donut"
                                                options={donutOptions}
                                                series={donutValues}
                                                height={140}
                                                width={140}
                                            />
                                        </div>
                                        <div className="flex flex-col gap-1.5 max-h-24 overflow-auto">
                                            {negData!.byAssignee.map((a, i) => (
                                                <div key={a.id} className="flex items-center gap-2 text-xs">
                                                    <span
                                                        className="size-2 rounded-full shrink-0"
                                                        style={{ backgroundColor: ['#1535C8','#2a4fd6','#4067e0','#6685e8','#99aaee'][i % 5] }}
                                                    />
                                                    <span className="flex-1 truncate text-muted-foreground">{a.name}</span>
                                                    <span className="font-medium">
                                                        {negMetric === 'Valor' ? fmtBRL(a.value) : `${a.count}`}
                                                    </span>
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                ) : (
                                    <div className="flex flex-1 flex-col items-center justify-center h-40 gap-2">
                                        <ReactApexChart
                                            type="donut"
                                            options={{ ...donutOptions, colors: ['var(--muted)'], tooltip: { enabled: false }, states: { hover: { filter: { type: 'none' } }, active: { filter: { type: 'none' } } } }}
                                            series={[1]}
                                            height={110}
                                            width={110}
                                        />
                                        <p className="text-xs text-muted-foreground">Nenhum dado disponível</p>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Atendentes + Produtos */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Atendentes com mais negócios */}
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <p className="font-medium">Atendentes com mais negócios</p>
                                {negLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (negData?.byAssignee ?? []).length === 0 ? (
                                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                        Não há dados
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-2">
                                        {negData!.byAssignee.map(a => (
                                            <div key={a.id} className="flex items-center gap-3 text-sm">
                                                <LeadInitials name={a.name} image={a.image} size={7} />
                                                <span className="flex-1 text-primary font-medium truncate">{a.name}</span>
                                                <div className="flex flex-col items-end text-xs text-muted-foreground">
                                                    <span>{a.count} negócio{a.count !== 1 ? 's' : ''}</span>
                                                    <span className="text-foreground font-medium">{fmtBRL(a.value)}</span>
                                                </div>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Produtos com mais negócios */}
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <p className="font-medium">Produtos com mais negócios</p>
                                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                    Não há dados
                                </div>
                            </div>
                        </div>

                        {/* Recent deals table */}
                        {(negData?.recentDeals ?? []).length > 0 && (
                            <div className="rounded-xl border bg-card overflow-hidden">
                                <table className="w-full text-sm">
                                    <thead className="border-b bg-muted/30">
                                        <tr>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Lead</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Negócio</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Atendente</th>
                                            <th className="text-left px-4 py-3 text-xs font-medium text-muted-foreground">Etapa</th>
                                            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Valor</th>
                                            <th className="text-right px-4 py-3 text-xs font-medium text-muted-foreground">Dias</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {negData!.recentDeals.map((d, i) => (
                                            <tr key={d.id} className={cn('border-t hover:bg-muted/20 transition-colors', i === 0 && 'border-t-0')}>
                                                <td className="px-4 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <LeadInitials name={d.lead.name} image={d.lead.image} size={6} />
                                                        <div>
                                                            <p className="font-medium text-primary truncate max-w-28">{d.lead.name}</p>
                                                            <p className="text-xs text-muted-foreground">{d.pipeline.name}</p>
                                                        </div>
                                                    </div>
                                                </td>
                                                <td className="px-4 py-2.5 max-w-36 truncate">{d.title}</td>
                                                <td className="px-4 py-2.5">
                                                    {d.assignee ? (
                                                        <div className="flex items-center gap-1.5">
                                                            <LeadInitials name={d.assignee.name} image={d.assignee.image} size={5} />
                                                            <span className="text-xs text-muted-foreground truncate max-w-20">{d.assignee.name}</span>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">Sem atendente</span>
                                                    )}
                                                </td>
                                                <td className="px-4 py-2.5">
                                                    <span className="inline-flex items-center rounded-full bg-muted px-2 py-0.5 text-xs">
                                                        {d.stage.name}
                                                    </span>
                                                </td>
                                                <td className="px-4 py-2.5 text-right font-medium">
                                                    {d.value > 0 ? fmtBRL(d.value) : '—'}
                                                </td>
                                                <td className="px-4 py-2.5 text-right text-muted-foreground">{d.daysOpen}d</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        )}
                    </>
                )}

                {/* ════════════════ ABA MULTIATENDIMENTO ════════════════ */}
                {activeTab === 'multiatendimento' && (
                    <>
                        {/* KPI cards */}
                        <div className="grid grid-cols-4 gap-4">
                            {chatLoading
                                ? Array.from({ length: 4 }).map((_, i) => (
                                    <div key={i} className="rounded-xl border bg-card p-4 h-28 flex items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ))
                                : [
                                    { label: 'Total de atendimentos', value: chatData?.kpis.total.count ?? 0,         icon: MessageSquare, color: 'text-blue-500' },
                                    { label: 'Mensagens enviadas',     value: chatData?.kpis.outbound.count ?? 0,      icon: CheckCheck,    color: 'text-emerald-500' },
                                    { label: 'Mensagens recebidas',    value: chatData?.kpis.inbound.count ?? 0,       icon: Clock,         color: 'text-orange-500' },
                                    { label: 'Conversas únicas',       value: chatData?.kpis.conversations.count ?? 0, icon: Users,         color: 'text-violet-500' },
                                ].map(card => {
                                    const Icon = card.icon
                                    return (
                                        <div key={card.label} className="rounded-xl border bg-card p-4 flex flex-col gap-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm text-muted-foreground">{card.label}</span>
                                                <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-600">0%</span>
                                            </div>
                                            <div>
                                                <p className="text-2xl font-bold tracking-tight">{card.value}</p>
                                                <p className="text-xs text-muted-foreground mt-0.5">Atendimentos</p>
                                            </div>
                                            <Icon className={cn('size-5 self-end', card.color)} />
                                        </div>
                                    )
                                })
                            }
                        </div>

                        {/* Charts row */}
                        <div className="grid grid-cols-2 gap-4">
                            {/* Volume de mensagens */}
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <div>
                                    <p className="font-medium">Atendimentos</p>
                                    <p className="text-xs text-muted-foreground">Mensagens iniciadas no período</p>
                                </div>
                                {chatLoading ? (
                                    <div className="h-52 flex items-center justify-center">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="h-52 -mx-2">
                                        <ReactApexChart
                                            key={`chat-bar-${chatFrom}-${chatTo}`}
                                            type="bar"
                                            options={chatBarOptions}
                                            series={[{ name: 'Mensagens', data: chatBarValues }]}
                                            height="100%"
                                            width="100%"
                                        />
                                    </div>
                                )}
                            </div>

                            {/* Heatmap por hora */}
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-3">
                                <div>
                                    <p className="font-medium">Atendimentos iniciados por hora</p>
                                    <p className="text-xs text-muted-foreground">Média de atendimentos iniciados por hora no período</p>
                                </div>

                                {chatLoading ? (
                                    <div className="flex items-center justify-center h-40">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (
                                    <div className="overflow-auto">
                                        <div className="flex gap-0.5" style={{ minWidth: 480 }}>
                                            {/* Day labels */}
                                            <div className="flex flex-col gap-0.5 pr-1">
                                                <div className="h-4" />
                                                {DAYS.map(d => (
                                                    <div key={d} className="h-4 flex items-center text-[9px] text-muted-foreground w-7">{d}</div>
                                                ))}
                                            </div>

                                            {/* Hour columns */}
                                            {HOURS.map(h => (
                                                <div key={h} className="flex flex-col gap-0.5">
                                                    <div className="h-4 flex items-center justify-center text-[9px] text-muted-foreground">{h}</div>
                                                    {DAYS.map((_, dow) => {
                                                        const val = heatmap[`${dow}-${Number(h)}`] ?? 0
                                                        const opacity = val > 0 ? 0.15 + (val / heatMax) * 0.85 : 0.06
                                                        return (
                                                            <div
                                                                key={dow}
                                                                title={`${DAYS[dow]} ${h}h: ${val}`}
                                                                className="size-4 rounded-[2px] bg-primary"
                                                                style={{ opacity }}
                                                            />
                                                        )
                                                    })}
                                                </div>
                                            ))}
                                        </div>
                                    </div>
                                )}
                            </div>
                        </div>

                        {/* Bottom row */}
                        <div className="grid grid-cols-2 gap-4">
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <p className="font-medium">Atendimentos por departamento</p>
                                <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                    Ainda não possui dados
                                </div>
                            </div>
                            <div className="rounded-xl border bg-card p-5 flex flex-col gap-4">
                                <p className="font-medium">Atendimentos por atendentes</p>
                                {chatLoading ? (
                                    <div className="flex items-center justify-center py-10">
                                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                                    </div>
                                ) : (chatData?.byAssignee ?? []).filter(a => a.id !== '__none__').length === 0 ? (
                                    <div className="flex items-center justify-center py-10 text-sm text-muted-foreground">
                                        Ainda não possui dados
                                    </div>
                                ) : (
                                    <div className="flex flex-col gap-3">
                                        {(chatData?.byAssignee ?? []).filter(a => a.id !== '__none__').map(a => {
                                            const maxCount = Math.max(...(chatData?.byAssignee ?? []).map(x => x.count), 1)
                                            const pct = Math.round((a.count / maxCount) * 100)
                                            return (
                                                <div key={a.id} className="flex items-center gap-3 text-sm">
                                                    <LeadInitials name={a.name} image={a.image} size={7} />
                                                    <div className="flex-1 min-w-0">
                                                        <div className="flex items-center justify-between mb-1">
                                                            <span className="font-medium truncate max-w-32">{a.name}</span>
                                                            <span className="text-xs text-muted-foreground shrink-0 ml-2">
                                                                {a.count} msg · {a.conversations} conv.
                                                            </span>
                                                        </div>
                                                        <div className="h-1.5 rounded-full bg-muted overflow-hidden">
                                                            <div
                                                                className="h-full rounded-full bg-primary transition-all"
                                                                style={{ width: `${pct}%` }}
                                                            />
                                                        </div>
                                                        <div className="flex gap-3 mt-1 text-[10px] text-muted-foreground">
                                                            <span>↓ {a.inbound} rec.</span>
                                                            <span>↑ {a.outbound} env.</span>
                                                        </div>
                                                    </div>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}
                            </div>
                        </div>
                    </>
                )}

                {/* ════════════════ ABA ATIVIDADES ════════════════ */}
                {activeTab === 'atividades' && (
                    <div className="flex flex-col items-center justify-center h-52 gap-3 text-muted-foreground">
                        <Activity className="size-10 opacity-20" />
                        <p className="text-sm">Relatório de atividades em breve</p>
                    </div>
                )}
            </div>
        </div>
    )
}

// ─── Sub-componentes ──────────────────────────────────────────────────────────

function MetricSelect({
    value,
    onChange,
}: {
    value: string
    onChange: (v: 'Valor' | 'Quantidade') => void
}) {
    return (
        <select
            value={value}
            onChange={e => onChange(e.target.value as 'Valor' | 'Quantidade')}
            className="text-xs rounded-md border px-2 py-1 bg-background text-foreground cursor-pointer"
        >
            <option value="Valor">Valor</option>
            <option value="Quantidade">Quantidade</option>
        </select>
    )
}
