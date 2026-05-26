'use client'

import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { motion } from 'framer-motion'
import { useState, Suspense } from 'react'
import { Lock, Eye, EyeOff, ArrowRight, Loader2, CheckCircle } from 'lucide-react'
import { toast } from 'sonner'
import { useSearchParams, useRouter } from 'next/navigation'
import { useResetPassword } from '@/services/auth'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]
const item = (i: number) => ({
    initial: { opacity: 0, y: 20 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.45, delay: 0.35 + i * 0.08, ease: EASE },
})

const field: React.CSSProperties = {
    background: 'rgba(8, 18, 48, 0.55)',
    border: '1px solid rgba(255,255,255,0.12)',
    color: 'rgba(255,255,255,0.9)',
    caretColor: 'white',
    backdropFilter: 'blur(8px)',
}

function ResetPasswordForm() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const token = searchParams.get('token') ?? ''

    const [password, setPassword] = useState('')
    const [confirm, setConfirm] = useState('')
    const [showPassword, setShowPassword] = useState(false)
    const [showConfirm, setShowConfirm] = useState(false)
    const [done, setDone] = useState(false)
    const { mutate: resetPassword, isPending } = useResetPassword()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (password !== confirm) {
            toast.error('As senhas não coincidem')
            return
        }
        if (password.length < 8) {
            toast.error('A senha deve ter pelo menos 8 caracteres')
            return
        }
        if (!token) {
            toast.error('Token inválido. Solicite um novo link.')
            return
        }
        resetPassword({ token, newPassword: password }, {
            onSuccess: () => setDone(true),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    if (!token) {
        return (
            <div className="flex flex-col items-center gap-5 py-6 text-center">
                <p className="font-semibold text-white">Link inválido</p>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    Este link de redefinição é inválido ou expirou.
                </p>
                <a href="/forgot-password" className="text-sm font-semibold" style={{ color: '#60a5fa' }}>
                    Solicitar novo link
                </a>
            </div>
        )
    }

    return (
        <div className="flex flex-col" style={{ gap: 28 }}>
            <motion.div className="flex flex-col gap-2 text-center" {...item(0)}>
                <h1 className="text-2xl font-bold text-white tracking-tight">
                    Redefinir senha
                </h1>
                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                    {done ? 'Senha atualizada com sucesso!' : 'Escolha uma nova senha segura para sua conta'}
                </p>
            </motion.div>

            {done ? (
                <motion.div className="flex flex-col items-center gap-5 py-6 text-center" {...item(1)}>
                    <div
                        className="flex size-16 items-center justify-center rounded-full"
                        style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
                    >
                        <CheckCircle className="size-7" style={{ color: '#4ade80' }} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <p className="font-semibold text-white">Senha redefinida!</p>
                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                            Sua senha foi atualizada. Faça login para continuar.
                        </p>
                    </div>
                    <button
                        type="button"
                        onClick={() => router.push('/login')}
                        className="flex items-center gap-2 rounded-xl px-6 py-3 text-sm font-semibold text-white transition-all"
                        style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                        }}
                    >
                        Ir para o login <ArrowRight className="size-4" />
                    </button>
                </motion.div>
            ) : (
                <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 20 }}>
                    <motion.div className="flex flex-col gap-2" {...item(1)}>
                        <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Nova senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type={showPassword ? 'text' : 'password'}
                                placeholder="Mínimo 8 caracteres"
                                autoComplete="new-password"
                                required
                                minLength={8}
                                value={password}
                                onChange={e => setPassword(e.target.value)}
                                disabled={isPending}
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

                    <motion.div className="flex flex-col gap-2" {...item(2)}>
                        <label className="text-sm font-medium" style={{ color: 'rgba(255,255,255,0.65)' }}>
                            Confirmar senha
                        </label>
                        <div className="relative">
                            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 size-4" style={{ color: 'rgba(255,255,255,0.3)' }} />
                            <input
                                type={showConfirm ? 'text' : 'password'}
                                placeholder="Repita a nova senha"
                                autoComplete="new-password"
                                required
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                disabled={isPending}
                                className="login-input w-full rounded-xl py-3.5 pl-10 pr-11 text-sm outline-none transition-all"
                                style={field}
                            />
                            <button
                                type="button"
                                onClick={() => setShowConfirm(v => !v)}
                                className="absolute right-3.5 top-1/2 -translate-y-1/2 transition-colors"
                                style={{ color: 'rgba(255,255,255,0.3)' }}
                                tabIndex={-1}
                            >
                                {showConfirm ? <EyeOff className="size-4" /> : <Eye className="size-4" />}
                            </button>
                        </div>
                    </motion.div>

                    <motion.button
                        {...item(3)}
                        type="submit"
                        disabled={isPending}
                        className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60 mt-1"
                        style={{
                            background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                            boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                        }}
                    >
                        {isPending
                            ? <><Loader2 className="size-4 animate-spin" /> Salvando...</>
                            : <><span>Redefinir senha</span><ArrowRight className="size-4" /></>
                        }
                    </motion.button>

                    <motion.p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }} {...item(4)}>
                        <a href="/forgot-password" className="font-semibold transition-colors" style={{ color: '#60a5fa' }}>
                            ← Solicitar novo link
                        </a>
                    </motion.p>
                </form>
            )}
        </div>
    )
}

export default function ResetPasswordPage() {
    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
            }}
        >
            <motion.div
                className="hidden lg:block absolute select-none pointer-events-none"
                style={{ zIndex: 5, top: '55%', right: '100px', translateY: '-52%' }}
                initial={{ opacity: 0, x: 80, scale: 0.85 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ duration: 1, delay: 0.3, ease: EASE }}
            >
                <motion.div
                    animate={{ y: [0, -18, 0], rotate: [0, 1.5, -1.5, 0] }}
                    transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                >
                    <motion.div
                        animate={{ opacity: [0.7, 1, 0.7] }}
                        transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
                    >
                        <Image
                            src="/logo-3d.png"
                            alt=""
                            width={750}
                            height={750}
                            className="w-[500px] h-auto"
                            style={{ filter: 'drop-shadow(0 0 55px rgba(37,99,235,0.75)) drop-shadow(0 0 120px rgba(37,99,235,0.4))' }}
                            priority
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            <div className="relative min-h-screen flex items-center" style={{ zIndex: 10 }}>
                <div className="w-full max-w-[1280px] mx-auto px-12 flex items-center">
                    <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">
                        <motion.div
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.1, ease: EASE }}
                        >
                            <Image
                                src="/logo.png"
                                alt="KinarCRM"
                                width={185}
                                height={65}
                                className="object-contain object-left"
                                style={{ filter: 'brightness(10)' }}
                            />
                        </motion.div>
                        <motion.p
                            className="text-white/70 text-[15px] leading-relaxed font-light"
                            initial={{ opacity: 0, y: 32 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.6, delay: 0.25, ease: EASE }}
                        >
                            Recuperamos oportunidades.<br />
                            Transformamos dados em{' '}
                            <span style={{ color: '#3b82f6' }}>receita</span>.
                        </motion.p>
                    </div>

                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            style={{ width: 480, display: 'flex', flexDirection: 'column' }}
                            initial={{ opacity: 0, y: 48, scale: 0.97 }}
                            animate={{ opacity: 1, y: 0, scale: 1 }}
                            transition={{ duration: 0.7, delay: 0.15, ease: EASE }}
                        >
                            <GlassCard
                                blur={28}
                                distortion={60}
                                chromaticAberration={0}
                                borderRadius={22}
                                borderSize={1}
                                borderColor="rgba(120,170,255,0.35)"
                                borderOpacity={1}
                                backgroundColor="#0b1836"
                                backgroundOpacity={0.15}
                                innerLightBlur={80}
                                innerLightSpread={4}
                                innerLightColor="rgba(80,130,255,0.18)"
                                innerLightOpacity={0.7}
                                outerLightBlur={90}
                                outerLightSpread={8}
                                outerLightColor="rgba(37,99,235,0.4)"
                                outerLightOpacity={0.65}
                                padding="44px 36px"
                            >
                                <Suspense fallback={null}>
                                    <ResetPasswordForm />
                                </Suspense>
                            </GlassCard>
                        </motion.div>
                    </div>

                    <div className="hidden lg:block w-[340px] flex-shrink-0" />
                </div>
            </div>

            <motion.p
                className="absolute bottom-6 left-12 text-white/20 text-xs"
                style={{ zIndex: 10 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8, ease: 'easeOut' }}
            >
                © 2024 KinarCRM. Todos os direitos reservados.
            </motion.p>
        </div>
    )
}
