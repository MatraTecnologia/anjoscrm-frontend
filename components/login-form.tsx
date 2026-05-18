'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Wand2, KeyRound } from 'lucide-react'
import { cn } from '@/lib/utils'
import {
    useSignIn,
    useResendVerification,
    useSendMagicLink,
    useSendSignInOTP,
    useSignInWithOTP,
} from '@/services/auth'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'

type LoginMode = 'password' | 'magic' | 'otp'
type OTPStep = 'email' | 'code'

// ── Estilos base dark ────────────────────────────────────────────────────────

const inputBase =
    'w-full rounded-lg px-4 py-3 text-sm text-white placeholder:text-white/30 outline-none transition-colors'
const inputStyle: React.CSSProperties = {
    background: 'rgba(255,255,255,0.05)',
    border: '1px solid rgba(255,255,255,0.1)',
}
const inputFocusClass = 'focus:ring-2 focus:ring-blue-500/40 focus:border-blue-500/60'

// ── Componente ───────────────────────────────────────────────────────────────

export function LoginForm({ className }: { className?: string }) {
    const router = useRouter()

    const [mode, setMode] = useState<LoginMode>('password')
    const [email, setEmail] = useState('')

    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    const [otpStep, setOtpStep] = useState<OTPStep>('email')
    const [otp, setOtp] = useState('')
    const [otpCooldown, setOtpCooldown] = useState(0)

    const [magicSent, setMagicSent] = useState(false)
    const [magicCooldown, setMagicCooldown] = useState(0)

    const { mutate: signIn, isPending: signingIn } = useSignIn()
    const { mutate: resend, isPending: resending } = useResendVerification()
    const { mutate: sendMagic, isPending: sendingMagic } = useSendMagicLink()
    const { mutate: sendOTP, isPending: sendingOTP } = useSendSignInOTP()
    const { mutate: verifyOTP, isPending: verifyingOTP } = useSignInWithOTP()

    useEffect(() => {
        if (resendCooldown <= 0) return
        const t = setTimeout(() => setResendCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [resendCooldown])

    useEffect(() => {
        if (otpCooldown <= 0) return
        const t = setTimeout(() => setOtpCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [otpCooldown])

    useEffect(() => {
        if (magicCooldown <= 0) return
        const t = setTimeout(() => setMagicCooldown((c) => c - 1), 1000)
        return () => clearTimeout(t)
    }, [magicCooldown])

    function switchMode(next: LoginMode) {
        setMode(next)
        setEmailNotVerified(false)
        setOtpStep('email')
        setOtp('')
        setMagicSent(false)
    }

    function handlePasswordSubmit(e: React.FormEvent) {
        e.preventDefault()
        setEmailNotVerified(false)
        signIn({ email, password, rememberMe }, {
            onSuccess: () => {
                toast.success('Login realizado com sucesso!')
                router.push('/verify')
            },
            onError: (error: Error) => {
                const msg = error.message.toLowerCase()
                if (msg.includes('not verified') || msg.includes('verificad') || msg.includes('email_not_verified')) {
                    setEmailNotVerified(true)
                } else {
                    toast.error(error.message)
                }
            },
        })
    }

    function handleSendMagic(e: React.FormEvent) {
        e.preventDefault()
        sendMagic(email, {
            onSuccess: () => { setMagicSent(true); setMagicCooldown(60); toast.success('Link de acesso enviado!') },
            onError: (error: Error) => toast.error(error.message),
        })
    }

    function handleSendOTP(e: React.FormEvent) {
        e.preventDefault()
        sendOTP(email, {
            onSuccess: () => { setOtpStep('code'); setOtpCooldown(60); toast.success('Código enviado para ' + email) },
            onError: (error: Error) => toast.error(error.message),
        })
    }

    function handleVerifyOTP(e: React.FormEvent) {
        e.preventDefault()
        verifyOTP({ email, otp }, {
            onSuccess: () => { toast.success('Login realizado com sucesso!'); router.push('/verify') },
            onError: (error: Error) => { toast.error(error.message); setOtp('') },
        })
    }

    return (
        <div className={cn('flex flex-col gap-5', className)}>

            {/* Header */}
            <div className="flex flex-col gap-1 text-center">
                <h1 className="text-2xl font-semibold text-white tracking-tight">
                    Bem-vindo de volta! 👋
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Faça login para acessar sua conta
                </p>
            </div>

            {/* Mode tabs */}
            <div
                className="flex rounded-lg p-1 gap-1"
                style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.07)' }}
            >
                {([
                    { id: 'password', label: 'Senha', icon: <KeyRound className="size-3" /> },
                    { id: 'magic', label: 'Link mágico', icon: <Wand2 className="size-3" /> },
                    { id: 'otp', label: 'Código', icon: <Mail className="size-3" /> },
                ] as { id: LoginMode; label: string; icon: React.ReactNode }[]).map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => switchMode(tab.id)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                            mode === tab.id
                                ? 'text-white'
                                : 'text-white/40 hover:text-white/70',
                        )}
                        style={mode === tab.id ? {
                            background: 'rgba(37,99,235,0.35)',
                            border: '1px solid rgba(37,99,235,0.4)',
                        } : {}}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── SENHA ─────────────────────────────────────────────────────── */}
            {mode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    {/* E-mail */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-white/70">E-mail</label>
                        <div className="relative">
                            <Mail
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                            />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                disabled={signingIn}
                                className={cn(inputBase, inputFocusClass, 'pl-10')}
                                style={inputStyle}
                            />
                        </div>
                    </div>

                    {/* Senha */}
                    <div className="flex flex-col gap-1.5">
                        <label className="text-sm font-medium text-white/70">Senha</label>
                        <div className="relative">
                            <Lock
                                className="absolute left-3 top-1/2 -translate-y-1/2 size-4"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                            />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={signingIn}
                                className={cn(inputBase, inputFocusClass, 'pl-10 pr-10')}
                                style={inputStyle}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                tabIndex={-1}
                            >
                                {showPassword
                                    ? <EyeOff className="size-4" />
                                    : <Eye className="size-4" />
                                }
                            </button>
                        </div>
                    </div>

                    {/* Lembrar + esqueci */}
                    <div className="flex items-center justify-between">
                        <label className="flex items-center gap-2 cursor-pointer group">
                            <div
                                className="relative flex items-center justify-center rounded size-4 cursor-pointer transition-colors"
                                style={{
                                    background: rememberMe ? '#2563eb' : 'rgba(255,255,255,0.06)',
                                    border: rememberMe ? '1px solid #2563eb' : '1px solid rgba(255,255,255,0.15)',
                                }}
                                onClick={() => setRememberMe((v) => !v)}
                            >
                                {rememberMe && (
                                    <svg viewBox="0 0 10 8" className="size-2.5" fill="none">
                                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>
                                Lembrar de mim
                            </span>
                        </label>
                        <a
                            href="/forgot-password"
                            className="text-sm transition-colors"
                            style={{ color: '#60a5fa' }}
                        >
                            Esqueci minha senha
                        </a>
                    </div>

                    {/* Botão entrar */}
                    <button
                        type="submit"
                        disabled={signingIn}
                        className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                        style={{
                            background: signingIn ? '#1d4ed8' : 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: '0 4px 20px rgba(37,99,235,0.4)',
                        }}
                    >
                        {signingIn
                            ? <><Loader2 className="size-4 animate-spin" /> Entrando...</>
                            : <><span>Entrar</span><ArrowRight className="size-4" /></>
                        }
                    </button>

                    {/* E-mail não verificado */}
                    {emailNotVerified && (
                        <div
                            className="rounded-lg p-4 flex flex-col gap-3"
                            style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}
                        >
                            <div className="flex items-start gap-3">
                                <Mail className="size-4 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-medium text-white">E-mail não verificado</p>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                        Verifique sua caixa de entrada para <strong>{email}</strong>.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => resend(email, {
                                    onSuccess: () => { setResendCooldown(60); toast.success('E-mail reenviado!') },
                                    onError: (error: Error) => toast.error(error.message),
                                })}
                                disabled={resending || resendCooldown > 0}
                                className="text-xs rounded-md px-3 py-1.5 text-white/60 hover:text-white transition-colors disabled:opacity-50"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)' }}
                            >
                                {resending ? 'Enviando...' : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar e-mail de verificação'}
                            </button>
                        </div>
                    )}
                </form>
            )}

            {/* ── LINK MÁGICO ───────────────────────────────────────────────── */}
            {mode === 'magic' && (
                <form onSubmit={handleSendMagic} className="flex flex-col gap-4">
                    {magicSent ? (
                        <div className="flex flex-col items-center gap-4 py-6 text-center">
                            <div
                                className="flex size-14 items-center justify-center rounded-full"
                                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
                            >
                                <Mail className="size-6" style={{ color: '#60a5fa' }} />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="font-medium text-white">Verifique seu e-mail</p>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Link enviado para <strong className="text-white/70">{email}</strong>
                                </p>
                            </div>
                            <button
                                type="button"
                                disabled={sendingMagic || magicCooldown > 0}
                                onClick={() => sendMagic(email, {
                                    onSuccess: () => setMagicCooldown(60),
                                    onError: (error: Error) => toast.error(error.message),
                                })}
                                className="text-sm transition-colors disabled:opacity-50"
                                style={{ color: '#60a5fa' }}
                            >
                                {sendingMagic ? 'Enviando...' : magicCooldown > 0 ? `Reenviar em ${magicCooldown}s` : 'Reenviar link'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-white/70">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={sendingMagic}
                                        className={cn(inputBase, inputFocusClass, 'pl-10')}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={sendingMagic}
                                className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
                            >
                                {sendingMagic
                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                    : 'Enviar link de acesso'
                                }
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                Você receberá um link único para entrar sem precisar de senha.
                            </p>
                        </>
                    )}
                </form>
            )}

            {/* ── CÓDIGO OTP ────────────────────────────────────────────────── */}
            {mode === 'otp' && (
                <>
                    {otpStep === 'email' ? (
                        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                                <label className="text-sm font-medium text-white/70">E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <input
                                        type="email"
                                        placeholder="seu@email.com"
                                        autoComplete="email"
                                        required
                                        value={email}
                                        onChange={(e) => setEmail(e.target.value)}
                                        disabled={sendingOTP}
                                        className={cn(inputBase, inputFocusClass, 'pl-10')}
                                        style={inputStyle}
                                    />
                                </div>
                            </div>
                            <button
                                type="submit"
                                disabled={sendingOTP}
                                className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
                            >
                                {sendingOTP ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : 'Enviar código'}
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>
                                Você receberá um código de 6 dígitos por e-mail.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1 text-center">
                                <p className="text-sm font-medium text-white">Código enviado para</p>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>
                            </div>
                            <div className="flex justify-center">
                                <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifyingOTP}>
                                    <InputOTPGroup>
                                        <InputOTPSlot index={0} />
                                        <InputOTPSlot index={1} />
                                        <InputOTPSlot index={2} />
                                        <InputOTPSlot index={3} />
                                        <InputOTPSlot index={4} />
                                        <InputOTPSlot index={5} />
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <button
                                type="submit"
                                disabled={verifyingOTP || otp.length < 6}
                                className="flex items-center justify-center gap-2 w-full rounded-lg py-3 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 20px rgba(37,99,235,0.4)' }}
                            >
                                {verifyingOTP ? <><Loader2 className="size-4 animate-spin" /> Verificando...</> : 'Verificar código'}
                            </button>
                            <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.4)' }}>
                                <button type="button" className="hover:text-white transition-colors" onClick={() => { setOtpStep('email'); setOtp('') }}>
                                    ← Trocar e-mail
                                </button>
                                <button
                                    type="button"
                                    disabled={sendingOTP || otpCooldown > 0}
                                    className="hover:text-white transition-colors disabled:opacity-50"
                                    onClick={() => sendOTP(email, {
                                        onSuccess: () => setOtpCooldown(60),
                                        onError: (error: Error) => toast.error(error.message),
                                    })}
                                >
                                    {sendingOTP ? 'Enviando...' : otpCooldown > 0 ? `Reenviar em ${otpCooldown}s` : 'Reenviar código'}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Rodapé — criar conta */}
            <p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.4)' }}>
                Não tem uma conta?{' '}
                <a href="/register" className="font-medium transition-colors" style={{ color: '#60a5fa' }}>
                    Criar conta
                </a>
            </p>
        </div>
    )
}
