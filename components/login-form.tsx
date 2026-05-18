'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, Lock, ArrowRight, Wand2, KeyRound } from 'lucide-react'
import { motion } from 'framer-motion'
import { cn } from '@/lib/utils'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const item = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.35 + i * 0.08, ease: EASE },
})
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

const field: React.CSSProperties = {
    background: 'rgba(8, 18, 48, 0.55)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.9)',
    caretColor: 'white',
    backdropFilter: 'blur(8px)',
}

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
        const t = setTimeout(() => setResendCooldown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [resendCooldown])

    useEffect(() => {
        if (otpCooldown <= 0) return
        const t = setTimeout(() => setOtpCooldown(c => c - 1), 1000)
        return () => clearTimeout(t)
    }, [otpCooldown])

    useEffect(() => {
        if (magicCooldown <= 0) return
        const t = setTimeout(() => setMagicCooldown(c => c - 1), 1000)
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
            onSuccess: () => { toast.success('Login realizado com sucesso!'); router.push('/verify') },
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
            onSuccess: () => { setMagicSent(true); setMagicCooldown(60); toast.success('Link enviado!') },
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
            onSuccess: () => { toast.success('Login realizado!'); router.push('/verify') },
            onError: (error: Error) => { toast.error(error.message); setOtp('') },
        })
    }

    const tabs = [
        { id: 'password' as LoginMode, label: 'Senha', icon: <KeyRound className="size-3.5" /> },
        { id: 'magic' as LoginMode, label: 'Link mágico', icon: <Wand2 className="size-3.5" /> },
        { id: 'otp' as LoginMode, label: 'Código', icon: <Mail className="size-3.5" /> },
    ]

    return (
        <div className={cn('flex flex-col', className)} style={{ gap: 28 }}>

            {/* Cabeçalho */}
            <motion.div className="flex flex-col gap-2 text-center" {...item(0)}>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Bem-vindo de volta! 👋
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Faça login para acessar sua conta
                </p>
            </motion.div>

            {/* Tabs */}
            <motion.div className="flex items-center justify-center gap-1" {...item(1)} style={{
                borderBottom: '1px solid rgba(255,255,255,0.08)',
                paddingBottom: 0,
            }}>
                {tabs.map(tab => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => switchMode(tab.id)}
                        className="relative flex items-center gap-1.5 px-4 pb-3 text-xs font-medium transition-all"
                        style={{
                            color: mode === tab.id ? 'rgba(255,255,255,0.95)' : 'rgba(255,255,255,0.35)',
                        }}
                    >
                        {tab.icon}
                        {tab.label}
                        {/* Indicador ativo */}
                        {mode === tab.id && (
                            <span
                                className="absolute bottom-0 left-0 right-0 h-[2px] rounded-full"
                                style={{ background: 'linear-gradient(90deg, #3b82f6, #60a5fa)' }}
                            />
                        )}
                    </button>
                ))}
            </motion.div>

            {/* ── SENHA ─────────────────────────────────────────────────────── */}
            {mode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="flex flex-col" style={{ gap: 20 }}>

                    {/* E-mail */}
                    <motion.div className="flex flex-col gap-2" {...item(2)}>
                        <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            E-mail
                        </label>
                        <div className="relative">
                            <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type="email"
                                placeholder="seu@email.com"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={e => setEmail(e.target.value)}
                                disabled={signingIn}
                                className="login-input w-full rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                                style={field}
                            />
                        </div>
                    </motion.div>

                    {/* Senha */}
                    <motion.div className="flex flex-col gap-2" {...item(3)}>
                        <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={signingIn}
                                className="login-input w-full rounded-xl py-3.5 pl-10 pr-11 text-sm outline-none transition-all"
                                style={field}
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                tabIndex={-1}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </motion.div>

                    {/* Lembrar + Esqueci */}
                    <motion.div className="flex items-center justify-between" {...item(4)}>
                        <label className="flex items-center gap-2.5 cursor-pointer">
                            <div
                                className="flex items-center justify-center rounded size-[18px] flex-shrink-0 cursor-pointer transition-all"
                                style={{
                                    background: rememberMe ? '#2563eb' : 'rgba(255,255,255,0.06)',
                                    border: rememberMe ? '1.5px solid #3b82f6' : '1.5px solid rgba(255,255,255,0.18)',
                                }}
                                onClick={() => setRememberMe(v => !v)}
                            >
                                {rememberMe && (
                                    <svg viewBox="0 0 10 8" className="size-2.5" fill="none">
                                        <path d="M1 4l3 3 5-6" stroke="white" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round" />
                                    </svg>
                                )}
                            </div>
                            <span className="text-sm" style={{ color: 'rgba(255,255,255,0.55)' }}>Lembrar de mim</span>
                        </label>
                        <a href="/forgot-password" className="text-sm font-medium transition-colors" style={{ color: '#60a5fa' }}>
                            Esqueci minha senha
                        </a>
                    </motion.div>

                    {/* Botão entrar */}
                    <motion.button {...item(5)}
                        type="submit"
                        disabled={signingIn}
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60 mt-1"
                        style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                        }}
                    >
                        {signingIn
                            ? <><Loader2 className="size-4 animate-spin" /> Entrando...</>
                            : <><span>Entrar</span><ArrowRight className="size-4" /></>
                        }
                    </motion.button>

                    {emailNotVerified && (
                        <div className="rounded-xl p-4 flex flex-col gap-3" style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.08)' }}>
                            <div className="flex items-start gap-3">
                                <Mail className="size-4 mt-0.5 shrink-0" style={{ color: 'rgba(255,255,255,0.4)' }} />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-medium text-white">E-mail não verificado</p>
                                    <p className="text-xs" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                        Verifique sua caixa para <strong>{email}</strong>.
                                    </p>
                                </div>
                            </div>
                            <button
                                type="button"
                                onClick={() => resend(email, {
                                    onSuccess: () => { setResendCooldown(60); toast.success('E-mail reenviado!') },
                                    onError: (e: Error) => toast.error(e.message),
                                })}
                                disabled={resending || resendCooldown > 0}
                                className="text-xs rounded-lg px-3 py-1.5 transition-colors disabled:opacity-50"
                                style={{ background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(255,255,255,0.1)', color: 'rgba(255,255,255,0.6)' }}
                            >
                                {resending ? 'Enviando...' : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar verificação'}
                            </button>
                        </div>
                    )}
                </form>
            )}

            {/* ── LINK MÁGICO ───────────────────────────────────────────────── */}
            {mode === 'magic' && (
                <form onSubmit={handleSendMagic} className="flex flex-col" style={{ gap: 20 }}>
                    {magicSent ? (
                        <div className="flex flex-col items-center gap-5 py-6 text-center">
                            <div className="flex size-16 items-center justify-center rounded-full" style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}>
                                <Mail className="size-7" style={{ color: '#60a5fa' }} />
                            </div>
                            <div className="flex flex-col gap-1.5">
                                <p className="font-semibold text-white">Verifique seu e-mail</p>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                    Link enviado para <strong className="text-white/70">{email}</strong>
                                </p>
                            </div>
                            <button type="button" disabled={sendingMagic || magicCooldown > 0} onClick={() => sendMagic(email, { onSuccess: () => setMagicCooldown(60), onError: (e: Error) => toast.error(e.message) })} className="text-sm transition-colors disabled:opacity-50" style={{ color: '#60a5fa' }}>
                                {sendingMagic ? 'Enviando...' : magicCooldown > 0 ? `Reenviar em ${magicCooldown}s` : 'Reenviar link'}
                            </button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <input type="email" placeholder="seu@email.com" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={sendingMagic} className="login-input w-full rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all" style={field} />
                                </div>
                            </div>
                            <button type="submit" disabled={sendingMagic} className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.45)' }}>
                                {sendingMagic ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : 'Enviar link de acesso'}
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Link único para entrar sem senha.</p>
                        </>
                    )}
                </form>
            )}

            {/* ── CÓDIGO OTP ────────────────────────────────────────────────── */}
            {mode === 'otp' && (
                <>
                    {otpStep === 'email' ? (
                        <form onSubmit={handleSendOTP} className="flex flex-col" style={{ gap: 20 }}>
                            <div className="flex flex-col gap-2">
                                <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>E-mail</label>
                                <div className="relative">
                                    <Mail className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                                    <input type="email" placeholder="seu@email.com" autoComplete="email" required value={email} onChange={e => setEmail(e.target.value)} disabled={sendingOTP} className="login-input w-full rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all" style={field} />
                                </div>
                            </div>
                            <button type="submit" disabled={sendingOTP} className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.45)' }}>
                                {sendingOTP ? <><Loader2 className="size-4 animate-spin" /> Enviando...</> : 'Enviar código'}
                            </button>
                            <p className="text-xs text-center" style={{ color: 'rgba(255,255,255,0.35)' }}>Código de 6 dígitos enviado por e-mail.</p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="flex flex-col" style={{ gap: 20 }}>
                            <div className="flex flex-col gap-1.5 text-center">
                                <p className="text-sm font-medium text-white">Código enviado para</p>
                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>{email}</p>
                            </div>
                            <div className="flex justify-center">
                                <InputOTP maxLength={6} value={otp} onChange={setOtp} disabled={verifyingOTP}>
                                    <InputOTPGroup>
                                        {[0,1,2,3,4,5].map(i => <InputOTPSlot key={i} index={i} />)}
                                    </InputOTPGroup>
                                </InputOTP>
                            </div>
                            <button type="submit" disabled={verifyingOTP || otp.length < 6} className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60" style={{ background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)', boxShadow: '0 4px 24px rgba(37,99,235,0.45)' }}>
                                {verifyingOTP ? <><Loader2 className="size-4 animate-spin" /> Verificando...</> : 'Verificar código'}
                            </button>
                            <div className="flex items-center justify-between text-xs" style={{ color: 'rgba(255,255,255,0.38)' }}>
                                <button type="button" className="hover:text-white transition-colors" onClick={() => { setOtpStep('email'); setOtp('') }}>← Trocar e-mail</button>
                                <button type="button" disabled={sendingOTP || otpCooldown > 0} className="hover:text-white transition-colors disabled:opacity-50" onClick={() => sendOTP(email, { onSuccess: () => setOtpCooldown(60), onError: (e: Error) => toast.error(e.message) })}>
                                    {sendingOTP ? 'Enviando...' : otpCooldown > 0 ? `Reenviar em ${otpCooldown}s` : 'Reenviar código'}
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            {/* Rodapé */}
            <motion.p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }} {...item(6)}>
                Não tem uma conta?{' '}
                <a href="/register" className="font-semibold transition-colors" style={{ color: '#60a5fa' }}>
                    Criar conta
                </a>
            </motion.p>
        </div>
    )
}
