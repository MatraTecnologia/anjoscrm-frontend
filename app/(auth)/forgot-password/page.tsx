'use client'

import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { motion } from 'framer-motion'
import { useState } from 'react'
import { Mail, ArrowRight, Loader2, ArrowLeft } from 'lucide-react'
import { toast } from 'sonner'
import { useForgotPassword } from '@/services/auth'

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

export default function ForgotPasswordPage() {
    const [email, setEmail] = useState('')
    const [sent, setSent] = useState(false)
    const { mutate: forgotPassword, isPending } = useForgotPassword()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        forgotPassword(email, {
            onSuccess: () => setSent(true),
            onError: (err: Error) => toast.error(err.message),
        })
    }

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
                        <motion.div {...item(0)}>
                            <Image
                                src="/logo.png"
                                alt="KinarCRM"
                                width={185}
                                height={65}
                                className="object-contain object-left"
                                style={{ filter: 'brightness(10)' }}
                            />
                        </motion.div>
                        <motion.p className="text-white/70 text-[15px] leading-relaxed font-light" {...item(0.25)}>
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
                                <div className="flex flex-col" style={{ gap: 28 }}>
                                    <motion.div className="flex flex-col gap-2 text-center" {...item(0)}>
                                        <h1 className="text-2xl font-bold text-white tracking-tight">
                                            Esqueceu sua senha?
                                        </h1>
                                        <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                            {sent
                                                ? 'Verifique seu e-mail para continuar'
                                                : 'Informe seu e-mail e enviaremos um link para redefinição'}
                                        </p>
                                    </motion.div>

                                    {sent ? (
                                        <motion.div className="flex flex-col items-center gap-5 py-6 text-center" {...item(1)}>
                                            <div
                                                className="flex size-16 items-center justify-center rounded-full"
                                                style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
                                            >
                                                <Mail className="size-7" style={{ color: '#60a5fa' }} />
                                            </div>
                                            <div className="flex flex-col gap-1.5">
                                                <p className="font-semibold text-white">E-mail enviado!</p>
                                                <p className="text-sm" style={{ color: 'rgba(255,255,255,0.45)' }}>
                                                    Enviamos as instruções para <strong className="text-white/70">{email}</strong>.<br />
                                                    Verifique também sua caixa de spam.
                                                </p>
                                            </div>
                                            <a
                                                href="/login"
                                                className="flex items-center gap-2 text-sm font-medium transition-colors"
                                                style={{ color: '#60a5fa' }}
                                            >
                                                <ArrowLeft className="size-4" />
                                                Voltar para o login
                                            </a>
                                        </motion.div>
                                    ) : (
                                        <form onSubmit={handleSubmit} className="flex flex-col" style={{ gap: 20 }}>
                                            <motion.div className="flex flex-col gap-2" {...item(1)}>
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
                                                        disabled={isPending}
                                                        className="login-input w-full rounded-xl py-3.5 pl-10 pr-4 text-sm outline-none transition-all"
                                                        style={field}
                                                    />
                                                </div>
                                            </motion.div>

                                            <motion.button
                                                {...item(2)}
                                                type="submit"
                                                disabled={isPending}
                                                className="flex items-center justify-center gap-2 w-full rounded-xl py-3.5 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                                style={{
                                                    background: 'linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)',
                                                    boxShadow: '0 4px 24px rgba(37,99,235,0.45)',
                                                }}
                                            >
                                                {isPending
                                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                                    : <><span>Enviar link</span><ArrowRight className="size-4" /></>
                                                }
                                            </motion.button>

                                            <motion.p className="text-center text-sm" style={{ color: 'rgba(255,255,255,0.38)' }} {...item(3)}>
                                                <a href="/login" className="font-semibold transition-colors" style={{ color: '#60a5fa' }}>
                                                    ← Voltar para o login
                                                </a>
                                            </motion.p>
                                        </form>
                                    )}
                                </div>
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
