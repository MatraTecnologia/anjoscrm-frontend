'use client'

import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2, Mail, KeyRound, Wand2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { InputOTP, InputOTPGroup, InputOTPSlot } from '@/components/ui/input-otp'
import { cn } from '@/lib/utils'
import {
    useSignIn,
    useResendVerification,
    useSendMagicLink,
    useSendSignInOTP,
    useSignInWithOTP,
} from '@/services/auth'

type LoginMode = 'password' | 'magic' | 'otp'
type OTPStep = 'email' | 'code'

export function LoginForm({ className }: { className?: string }) {
    const router = useRouter()

    const [mode, setMode] = useState<LoginMode>('password')
    const [email, setEmail] = useState('')

    // senha
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [rememberMe, setRememberMe] = useState(false)
    const [emailNotVerified, setEmailNotVerified] = useState(false)
    const [resendCooldown, setResendCooldown] = useState(0)

    // OTP
    const [otpStep, setOtpStep] = useState<OTPStep>('email')
    const [otp, setOtp] = useState('')
    const [otpCooldown, setOtpCooldown] = useState(0)

    // magic link
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
            onSuccess: () => {
                setMagicSent(true)
                setMagicCooldown(60)
                toast.success('Link de acesso enviado!')
            },
            onError: (error: Error) => toast.error(error.message),
        })
    }

    function handleSendOTP(e: React.FormEvent) {
        e.preventDefault()
        sendOTP(email, {
            onSuccess: () => {
                setOtpStep('code')
                setOtpCooldown(60)
                toast.success('Código enviado para ' + email)
            },
            onError: (error: Error) => toast.error(error.message),
        })
    }

    function handleVerifyOTP(e: React.FormEvent) {
        e.preventDefault()
        verifyOTP({ email, otp }, {
            onSuccess: () => {
                toast.success('Login realizado com sucesso!')
                router.push('/verify')
            },
            onError: (error: Error) => {
                toast.error(error.message)
                setOtp('')
            },
        })
    }

    const tabs: { id: LoginMode; label: string; icon: React.ReactNode }[] = [
        { id: 'password', label: 'Senha', icon: <KeyRound className="size-3.5" /> },
        { id: 'magic', label: 'Link mágico', icon: <Wand2 className="size-3.5" /> },
        { id: 'otp', label: 'Código', icon: <Mail className="size-3.5" /> },
    ]

    return (
        <div className={cn('flex flex-col gap-6', className)}>
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Bem-vindo de volta</h1>
                <p className="text-sm text-muted-foreground">
                    Escolha como deseja entrar na sua conta.
                </p>
            </div>

            {/* Seletor de modo */}
            <div className="flex rounded-lg border bg-muted/40 p-1 gap-1">
                {tabs.map((tab) => (
                    <button
                        key={tab.id}
                        type="button"
                        onClick={() => switchMode(tab.id)}
                        className={cn(
                            'flex flex-1 items-center justify-center gap-1.5 rounded-md px-2 py-1.5 text-xs font-medium transition-all',
                            mode === tab.id
                                ? 'bg-background shadow-sm text-foreground'
                                : 'text-muted-foreground hover:text-foreground',
                        )}
                    >
                        {tab.icon}
                        {tab.label}
                    </button>
                ))}
            </div>

            {/* ── SENHA ──────────────────────────────────────────────────────── */}
            {mode === 'password' && (
                <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4">
                    <div className="flex flex-col gap-2">
                        <Label htmlFor="pw-email">E-mail</Label>
                        <Input
                            id="pw-email"
                            type="email"
                            placeholder="voce@empresa.com"
                            autoComplete="email"
                            required
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            disabled={signingIn}
                        />
                    </div>

                    <div className="flex flex-col gap-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="pw-password">Senha</Label>
                            <a href="/forgot-password" className="text-xs text-muted-foreground underline-offset-4 hover:underline">
                                Esqueceu a senha?
                            </a>
                        </div>
                        <div className="relative">
                            <Input
                                id="pw-password"
                                type={showPassword ? 'text' : 'password'}
                                placeholder="••••••••"
                                autoComplete="current-password"
                                required
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                disabled={signingIn}
                                className="pr-10"
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword((v) => !v)}
                                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                                tabIndex={-1}
                                aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                            >
                                {showPassword ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </div>

                    <div className="flex items-center gap-2">
                        <Checkbox
                            id="remember"
                            checked={rememberMe}
                            onCheckedChange={(v) => setRememberMe(v === true)}
                            disabled={signingIn}
                        />
                        <Label htmlFor="remember" className="text-sm font-normal text-muted-foreground cursor-pointer">
                            Lembrar de mim
                        </Label>
                    </div>

                    <Button type="submit" className="w-full" disabled={signingIn}>
                        {signingIn ? <><Loader2 className="size-4 animate-spin" /> Entrando...</> : 'Entrar'}
                    </Button>

                    {emailNotVerified && (
                        <div className="rounded-lg border bg-muted/40 p-4 flex flex-col gap-3">
                            <div className="flex items-start gap-3">
                                <Mail className="size-4 mt-0.5 shrink-0 text-muted-foreground" />
                                <div className="flex flex-col gap-0.5">
                                    <p className="text-sm font-medium">E-mail não verificado</p>
                                    <p className="text-xs text-muted-foreground">
                                        Verifique sua caixa de entrada e clique no link enviado para <strong>{email}</strong>.
                                    </p>
                                </div>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                onClick={() => resend(email, {
                                    onSuccess: () => { setResendCooldown(60); toast.success('E-mail de verificação reenviado!') },
                                    onError: (error: Error) => toast.error(error.message),
                                })}
                                disabled={resending || resendCooldown > 0}
                            >
                                {resending
                                    ? <><Loader2 className="size-3 animate-spin" /> Enviando...</>
                                    : resendCooldown > 0 ? `Reenviar em ${resendCooldown}s` : 'Reenviar e-mail de verificação'
                                }
                            </Button>
                        </div>
                    )}
                </form>
            )}

            {/* ── LINK MÁGICO ────────────────────────────────────────────────── */}
            {mode === 'magic' && (
                <form onSubmit={handleSendMagic} className="flex flex-col gap-4">
                    {magicSent ? (
                        <div className="flex flex-col items-center gap-4 py-4 text-center">
                            <div className="flex size-14 items-center justify-center rounded-full bg-muted">
                                <Mail className="size-7 text-muted-foreground" />
                            </div>
                            <div className="flex flex-col gap-1">
                                <p className="font-medium">Verifique seu e-mail</p>
                                <p className="text-sm text-muted-foreground">
                                    Enviamos um link de acesso para <strong>{email}</strong>. Clique nele para entrar.
                                </p>
                            </div>
                            <Button
                                type="button"
                                variant="outline"
                                size="sm"
                                disabled={sendingMagic || magicCooldown > 0}
                                onClick={() => sendMagic(email, {
                                    onSuccess: () => setMagicCooldown(60),
                                    onError: (error: Error) => toast.error(error.message),
                                })}
                            >
                                {sendingMagic
                                    ? <><Loader2 className="size-3 animate-spin" /> Enviando...</>
                                    : magicCooldown > 0 ? `Reenviar em ${magicCooldown}s` : 'Reenviar link'
                                }
                            </Button>
                        </div>
                    ) : (
                        <>
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="magic-email">E-mail</Label>
                                <Input
                                    id="magic-email"
                                    type="email"
                                    placeholder="voce@empresa.com"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={sendingMagic}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={sendingMagic}>
                                {sendingMagic
                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                    : 'Enviar link de acesso'
                                }
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Você receberá um link único para entrar sem precisar de senha.
                            </p>
                        </>
                    )}
                </form>
            )}

            {/* ── CÓDIGO OTP ─────────────────────────────────────────────────── */}
            {mode === 'otp' && (
                <>
                    {otpStep === 'email' ? (
                        <form onSubmit={handleSendOTP} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-2">
                                <Label htmlFor="otp-email">E-mail</Label>
                                <Input
                                    id="otp-email"
                                    type="email"
                                    placeholder="voce@empresa.com"
                                    autoComplete="email"
                                    required
                                    value={email}
                                    onChange={(e) => setEmail(e.target.value)}
                                    disabled={sendingOTP}
                                />
                            </div>
                            <Button type="submit" className="w-full" disabled={sendingOTP}>
                                {sendingOTP
                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                    : 'Enviar código'
                                }
                            </Button>
                            <p className="text-xs text-muted-foreground text-center">
                                Você receberá um código de 6 dígitos por e-mail.
                            </p>
                        </form>
                    ) : (
                        <form onSubmit={handleVerifyOTP} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1 text-center">
                                <p className="text-sm font-medium">Código enviado para</p>
                                <p className="text-sm text-muted-foreground">{email}</p>
                            </div>

                            <div className="flex justify-center">
                                <InputOTP
                                    maxLength={6}
                                    value={otp}
                                    onChange={setOtp}
                                    disabled={verifyingOTP}
                                >
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

                            <Button type="submit" className="w-full" disabled={verifyingOTP || otp.length < 6}>
                                {verifyingOTP
                                    ? <><Loader2 className="size-4 animate-spin" /> Verificando...</>
                                    : 'Verificar código'
                                }
                            </Button>

                            <div className="flex items-center justify-between text-xs text-muted-foreground">
                                <button
                                    type="button"
                                    className="hover:text-foreground transition-colors"
                                    onClick={() => { setOtpStep('email'); setOtp('') }}
                                >
                                    ← Trocar e-mail
                                </button>
                                <button
                                    type="button"
                                    disabled={sendingOTP || otpCooldown > 0}
                                    className="hover:text-foreground transition-colors disabled:opacity-50"
                                    onClick={() => sendOTP(email, {
                                        onSuccess: () => setOtpCooldown(60),
                                        onError: (error: Error) => toast.error(error.message),
                                    })}
                                >
                                    {sendingOTP
                                        ? 'Enviando...'
                                        : otpCooldown > 0 ? `Reenviar em ${otpCooldown}s` : 'Reenviar código'
                                    }
                                </button>
                            </div>
                        </form>
                    )}
                </>
            )}

            <p className="text-center text-sm text-muted-foreground">
                Não tem uma conta?{' '}
                <a href="/register" className="font-medium text-foreground underline-offset-4 hover:underline">
                    Criar conta
                </a>
            </p>
        </div>
    )
}
