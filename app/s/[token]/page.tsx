'use client'

import { use, useState, useEffect, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Loader2, Clock, CheckCircle2, ChevronLeft, ChevronRight, Send } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { usePublicSimulation, useSubmitSimulation, type SimulationField, type SimulationAnswer } from '@/services/simulations'

// ─── Currency helpers ─────────────────────────────────────────────────────────

function formatCurrency(raw: string): string {
    const digits = raw.replace(/\D/g, '')
    if (!digits) return ''
    const num = parseInt(digits, 10) / 100
    return num.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })
}

function parseCurrencyToNumber(formatted: string): string {
    return formatted.replace(/\./g, '').replace(',', '.')
}

// ─── Individual field inputs ──────────────────────────────────────────────────

function FieldInput({
    field,
    value,
    onChange,
    onEnter,
    error,
}: {
    field: SimulationField
    value: string | string[] | boolean
    onChange: (v: string | string[] | boolean) => void
    onEnter: () => void
    error: boolean
}) {
    const baseInput =
        'w-full bg-white/5 border border-white/20 rounded-xl px-5 py-4 text-xl text-white placeholder:text-white/30 focus:outline-none focus:border-white/50 focus:ring-0 transition-colors'

    function handleKey(e: React.KeyboardEvent) {
        if (e.key === 'Enter' && field.type !== 'TEXTAREA') {
            e.preventDefault()
            onEnter()
        }
    }

    if (field.type === 'INPUT_TEXT') {
        return (
            <input
                autoFocus
                type="text"
                placeholder={field.placeholder ?? 'Digite aqui...'}
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKey}
                className={baseInput}
            />
        )
    }

    if (field.type === 'INPUT_NUMBER') {
        return (
            <input
                autoFocus
                type="number"
                placeholder={field.placeholder ?? '0'}
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKey}
                className={baseInput}
            />
        )
    }

    if (field.type === 'INPUT_CURRENCY') {
        return (
            <div className="relative">
                <span className="absolute left-5 top-1/2 -translate-y-1/2 text-xl text-white/50 pointer-events-none">
                    R$
                </span>
                <input
                    autoFocus
                    type="text"
                    inputMode="numeric"
                    placeholder="0,00"
                    value={value as string}
                    onChange={e => {
                        const formatted = formatCurrency(e.target.value)
                        onChange(formatted)
                    }}
                    onKeyDown={handleKey}
                    className={`${baseInput} pl-14`}
                />
            </div>
        )
    }

    if (field.type === 'INPUT_DATE') {
        return (
            <input
                autoFocus
                type="date"
                value={value as string}
                onChange={e => onChange(e.target.value)}
                onKeyDown={handleKey}
                className={`${baseInput} [color-scheme:dark]`}
            />
        )
    }

    if (field.type === 'TEXTAREA') {
        return (
            <textarea
                autoFocus
                rows={4}
                placeholder={field.placeholder ?? 'Digite aqui...'}
                value={value as string}
                onChange={e => onChange(e.target.value)}
                className={`${baseInput} resize-none`}
            />
        )
    }

    if (field.type === 'CHECKBOX') {
        const checked = value as boolean
        return (
            <button
                type="button"
                onClick={() => onChange(!checked)}
                className={`flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                    checked
                        ? 'border-white/60 bg-white/15 text-white'
                        : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
                }`}
            >
                <div
                    className={`size-6 rounded-md border-2 flex items-center justify-center shrink-0 transition-all ${
                        checked ? 'border-white bg-white' : 'border-white/40'
                    }`}
                >
                    {checked && <CheckCircle2 className="size-4 text-slate-900" />}
                </div>
                <span className="text-lg font-medium">{field.label}</span>
            </button>
        )
    }

    if (field.type === 'CHECKLIST') {
        const selected = (value as string[]) ?? []
        return (
            <div className="flex flex-col gap-3">
                {field.options.map(opt => {
                    const isSelected = selected.includes(opt)
                    return (
                        <button
                            key={opt}
                            type="button"
                            onClick={() => {
                                onChange(
                                    isSelected
                                        ? selected.filter(s => s !== opt)
                                        : [...selected, opt]
                                )
                            }}
                            className={`flex items-center gap-4 px-5 py-4 rounded-xl border text-left transition-all ${
                                isSelected
                                    ? 'border-white/60 bg-white/15 text-white'
                                    : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
                            }`}
                        >
                            <div
                                className={`size-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                    isSelected ? 'border-white bg-white' : 'border-white/40'
                                }`}
                            >
                                {isSelected && <span className="block size-2.5 bg-slate-900 rounded-sm" />}
                            </div>
                            <span className="text-base">{opt}</span>
                        </button>
                    )
                })}
            </div>
        )
    }

    if (field.type === 'RADIO' || field.type === 'SELECT') {
        const selected = value as string
        return (
            <div className="flex flex-col gap-3">
                {field.options.map(opt => (
                    <button
                        key={opt}
                        type="button"
                        onClick={() => onChange(opt)}
                        className={`px-5 py-4 rounded-xl border text-left text-base transition-all ${
                            selected === opt
                                ? 'border-white/70 bg-white/20 text-white font-medium'
                                : 'border-white/20 bg-white/5 text-white/60 hover:border-white/40 hover:bg-white/10'
                        }`}
                    >
                        {opt}
                    </button>
                ))}
            </div>
        )
    }

    if (field.type === 'SECTION') {
        return null
    }

    return null
}

// ─── Main page ────────────────────────────────────────────────────────────────

export default function PublicSimulationPage({
    params,
}: {
    params: Promise<{ token: string }>
}) {
    const { token } = use(params)
    const { data, isLoading, isError } = usePublicSimulation(token)
    const submitMutation = useSubmitSimulation()

    const [currentIndex, setCurrentIndex] = useState(0)
    const [answers, setAnswers] = useState<Record<string, string | string[] | boolean>>({})
    const [direction, setDirection] = useState<1 | -1>(1)
    const [validationError, setValidationError] = useState(false)
    const [submitted, setSubmitted] = useState(false)

    const fields = data?.template?.fields ?? []
    const totalFields = fields.length
    const currentField = fields[currentIndex]

    function getInitialValue(field: SimulationField): string | string[] | boolean {
        if (field.type === 'CHECKBOX') return false
        if (field.type === 'CHECKLIST') return []
        return ''
    }

    function getCurrentValue() {
        if (!currentField) return ''
        const existing = answers[currentField.id]
        if (existing !== undefined) return existing
        return getInitialValue(currentField)
    }

    function setCurrentValue(v: string | string[] | boolean) {
        if (!currentField) return
        setAnswers(prev => ({ ...prev, [currentField.id]: v }))
        setValidationError(false)
    }

    function isValueEmpty(field: SimulationField, val: string | string[] | boolean): boolean {
        if (field.type === 'CHECKBOX') return false
        if (field.type === 'CHECKLIST') return (val as string[]).length === 0
        if (field.type === 'SECTION') return false
        return (val as string).trim() === ''
    }

    function handleNext() {
        if (!currentField) return
        const val = getCurrentValue()
        if (currentField.required && isValueEmpty(currentField, val)) {
            setValidationError(true)
            return
        }
        setValidationError(false)
        if (currentIndex < totalFields - 1) {
            setDirection(1)
            setCurrentIndex(i => i + 1)
        } else {
            handleSubmit()
        }
    }

    function handlePrev() {
        if (currentIndex > 0) {
            setDirection(-1)
            setCurrentIndex(i => i - 1)
            setValidationError(false)
        }
    }

    const handleSubmit = useCallback(() => {
        const builtAnswers: SimulationAnswer[] = fields.map(field => {
            const raw = answers[field.id] ?? getInitialValue(field)
            let value: string | string[] | boolean = raw
            if (field.type === 'INPUT_CURRENCY' && typeof raw === 'string' && raw !== '') {
                value = parseCurrencyToNumber(raw)
            }
            return { fieldId: field.id, label: field.label, value }
        })

        submitMutation.mutate(
            { token, answers: builtAnswers },
            {
                onSuccess: () => setSubmitted(true),
            }
        )
    }, [fields, answers, token, submitMutation])

    useEffect(() => {
        function handleKeydown(e: KeyboardEvent) {
            if (e.key === 'Enter' && currentField?.type !== 'TEXTAREA') {
                handleNext()
            }
        }
        window.addEventListener('keydown', handleKeydown)
        return () => window.removeEventListener('keydown', handleKeydown)
        // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [currentIndex, answers])

    const progress = totalFields > 0 ? ((currentIndex + 1) / totalFields) * 100 : 0

    // ── Loading ──────────────────────────────────────────────────────────────
    if (isLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <Loader2 className="size-8 text-white/50 animate-spin" />
            </div>
        )
    }

    // ── Error ────────────────────────────────────────────────────────────────
    if (isError || !data) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-4 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <div className="size-16 rounded-full bg-white/10 flex items-center justify-center">
                    <span className="text-2xl">🔍</span>
                </div>
                <p className="text-white/70 text-lg">Simulação não encontrada</p>
            </div>
        )
    }

    // ── Expired ──────────────────────────────────────────────────────────────
    if (data.expired) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="size-20 rounded-full bg-amber-500/20 flex items-center justify-center"
                >
                    <Clock className="size-10 text-amber-400" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center"
                >
                    <p className="text-white text-2xl font-semibold">Simulação expirada</p>
                    <p className="text-white/50 mt-2 text-base">O prazo para responder esta simulação já encerrou.</p>
                </motion.div>
            </div>
        )
    }

    // ── Already completed ────────────────────────────────────────────────────
    if (data.completed || submitted) {
        return (
            <div className="min-h-screen flex flex-col items-center justify-center gap-6 bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900 px-4">
                <motion.div
                    initial={{ scale: 0, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ type: 'spring', stiffness: 200, damping: 20 }}
                    className="size-20 rounded-full bg-emerald-500/20 flex items-center justify-center"
                >
                    <CheckCircle2 className="size-10 text-emerald-400" />
                </motion.div>
                <motion.div
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.2 }}
                    className="text-center max-w-sm"
                >
                    <p className="text-white text-2xl font-semibold">Obrigado!</p>
                    <p className="text-white/60 mt-2 text-base leading-relaxed">
                        Entraremos em contato em breve.
                    </p>
                </motion.div>
            </div>
        )
    }

    // ── No template ──────────────────────────────────────────────────────────
    if (!data.template || totalFields === 0) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
                <p className="text-white/50">Formulário sem perguntas.</p>
            </div>
        )
    }

    const isLastStep = currentIndex === totalFields - 1
    const isSectionField = currentField?.type === 'SECTION'

    return (
        <div className="min-h-screen flex flex-col bg-gradient-to-br from-slate-900 via-blue-950 to-slate-900">
            {/* ── Top bar ─────────────────────────────────────────────── */}
            <div className="w-full px-6 pt-6 pb-4 flex items-center gap-4 shrink-0">
                <div className="flex items-center gap-2 mr-auto">
                    <span className="text-2xl">{data.template.emoji}</span>
                    <span className="text-white/70 text-sm font-medium truncate max-w-[180px]">
                        {data.template.name}
                    </span>
                </div>
                <span className="text-white/40 text-sm tabular-nums shrink-0">
                    {currentIndex + 1} / {totalFields}
                </span>
            </div>

            {/* Progress bar */}
            <div className="w-full h-0.5 bg-white/10 shrink-0">
                <motion.div
                    className="h-full bg-white/60 rounded-full"
                    animate={{ width: `${progress}%` }}
                    transition={{ ease: 'easeInOut', duration: 0.4 }}
                />
            </div>

            {/* ── Question area ────────────────────────────────────────── */}
            <div className="flex-1 flex items-center justify-center px-6 py-10">
                <div className="w-full max-w-xl">
                    <AnimatePresence mode="wait" initial={false}>
                        <motion.div
                            key={currentField.id}
                            initial={{ opacity: 0, x: direction * 60 }}
                            animate={{ opacity: 1, x: 0 }}
                            exit={{ opacity: 0, x: direction * -60 }}
                            transition={{ ease: [0.25, 0.46, 0.45, 0.94], duration: 0.3 }}
                            className="flex flex-col gap-6"
                        >
                            {/* Question label */}
                            <div>
                                <div className="flex items-start gap-2 mb-1">
                                    <span className="text-white/40 text-base font-medium tabular-nums shrink-0 mt-0.5">
                                        {currentIndex + 1}.
                                    </span>
                                    <h2 className="text-2xl font-semibold text-white leading-snug">
                                        {currentField.label}
                                        {currentField.required && (
                                            <span className="text-rose-400 ml-1">*</span>
                                        )}
                                    </h2>
                                </div>
                            </div>

                            {/* Field input */}
                            {!isSectionField && (
                                <FieldInput
                                    field={currentField}
                                    value={getCurrentValue()}
                                    onChange={setCurrentValue}
                                    onEnter={handleNext}
                                    error={validationError}
                                />
                            )}

                            {/* Validation error */}
                            {validationError && (
                                <motion.p
                                    initial={{ opacity: 0, y: -4 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    className="text-rose-400 text-sm"
                                >
                                    Por favor, preencha este campo antes de continuar.
                                </motion.p>
                            )}

                            {/* Navigation */}
                            <div className="flex items-center gap-3 pt-2">
                                {currentIndex > 0 && (
                                    <Button
                                        type="button"
                                        variant="ghost"
                                        size="sm"
                                        onClick={handlePrev}
                                        className="text-white/60 hover:text-white hover:bg-white/10 gap-1"
                                    >
                                        <ChevronLeft className="size-4" />
                                        Anterior
                                    </Button>
                                )}

                                <Button
                                    type="button"
                                    onClick={handleNext}
                                    disabled={submitMutation.isPending}
                                    className="ml-auto bg-white text-slate-900 hover:bg-white/90 font-semibold px-6 gap-2 rounded-xl"
                                >
                                    {submitMutation.isPending ? (
                                        <Loader2 className="size-4 animate-spin" />
                                    ) : isLastStep ? (
                                        <>
                                            Enviar simulação
                                            <Send className="size-4" />
                                        </>
                                    ) : (
                                        <>
                                            {isSectionField ? 'Próximo' : 'Próximo'}
                                            <ChevronRight className="size-4" />
                                        </>
                                    )}
                                </Button>
                            </div>
                        </motion.div>
                    </AnimatePresence>
                </div>
            </div>

            {/* ── Footer hint ──────────────────────────────────────────── */}
            <div className="w-full px-6 pb-6 text-center shrink-0">
                <p className="text-white/20 text-xs">
                    Pressione <kbd className="font-mono">Enter</kbd> para avançar
                </p>
            </div>
        </div>
    )
}
