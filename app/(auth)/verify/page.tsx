'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { GlassCard } from 'react-glass-ui'
import { motion } from 'framer-motion'
import { toast } from 'sonner'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSession, useResendVerification } from '@/services/auth'

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 32 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
})

const fadeIn = (delay = 0) => ({
    initial: { opacity: 0 },
    animate: { opacity: 1 },
    transition: { duration: 0.8, delay, ease: 'easeOut' as const },
})

export default function VerifyPage() {
    const router = useRouter()
    const { data: session, isLoading } = useSession()
    const { mutate: resend, isPending } = useResendVerification()
    const [sent, setSent] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    useEffect(() => {
        if (!isLoading && session?.user?.emailVerified) {
            router.replace('/')
        }
    }, [session, isLoading, router])

    useEffect(() => {
        if (cooldown <= 0) return
        const timer = setTimeout(() => setCooldown((c) => c - 1), 1000)
        return () => clearTimeout(timer)
    }, [cooldown])

    function handleResend() {
        const email = session?.user?.email
        if (!email) return

        resend(email, {
            onSuccess: () => {
                setSent(true)
                setCooldown(60)
                toast.success('E-mail reenviado! Verifique sua caixa de entrada.')
            },
            onError: (error: Error) => {
                toast.error(error.message)
            },
        })
    }

    if (isLoading) {
        return (
            <div
                className="relative min-h-screen w-full overflow-hidden flex items-center justify-center"
                style={{
                    backgroundImage: 'url(/background.png)',
                    backgroundSize: 'cover',
                    backgroundPosition: 'center',
                    backgroundAttachment: 'fixed',
                }}
            >
                <Loader2 className="size-6 animate-spin text-white/50" />
            </div>
        )
    }

    if (!session) {
        router.replace('/register')
        return null
    }

    const email = session.user.email

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
            {/* Logo 3D flutuando */}
            <motion.div
                className="hidden lg:block absolute select-none pointer-events-none"
                style={{
                    zIndex: 5,
                    top: '55%',
                    right: '100px',
                    translateY: '-52%',
                }}
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
                            style={{
                                filter: 'drop-shadow(0 0 55px rgba(37,99,235,0.75)) drop-shadow(0 0 120px rgba(37,99,235,0.4))',
                            }}
                            priority
                        />
                    </motion.div>
                </motion.div>
            </motion.div>

            {/* Layout principal */}
            <div className="relative min-h-screen flex items-center" style={{ zIndex: 10 }}>
                <div className="w-full max-w-[1280px] mx-auto px-12 flex items-center">

                    {/* Esquerda — logo + tagline */}
                    <div className="hidden lg:flex flex-col gap-6 w-[280px] flex-shrink-0">
                        <motion.div {...fadeUp(0.1)}>
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
                            {...fadeUp(0.25)}
                        >
                            Recuperamos oportunidades.<br />
                            Transformamos dados em{' '}
                            <span style={{ color: '#3b82f6' }}>receita</span>.
                        </motion.p>
                    </div>

                    {/* Centro — card */}
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
                                <div className="flex flex-col gap-6">
                                    {/* Ícone */}
                                    <motion.div className="flex justify-center" {...fadeUp(0.2)}>
                                        <div className="flex size-16 items-center justify-center rounded-full"
                                            style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(120,170,255,0.2)' }}>
                                            {sent
                                                ? <CheckCircle2 className="size-8 text-green-400" />
                                                : <Mail className="size-8 text-blue-400" />
                                            }
                                        </div>
                                    </motion.div>

                                    {/* Texto */}
                                    <motion.div className="flex flex-col gap-1 text-center" {...fadeUp(0.3)}>
                                        <h1 className="text-2xl font-semibold tracking-tight text-white">
                                            {sent ? 'E-mail reenviado!' : 'Verifique seu e-mail'}
                                        </h1>
                                        <p className="text-sm text-white/50 mt-1">
                                            {sent
                                                ? 'Um novo link de verificação foi enviado para'
                                                : 'Enviamos um link de verificação para'
                                            }
                                        </p>
                                        <p className="text-sm font-medium text-white/80">{email}</p>
                                    </motion.div>

                                    {/* Instruções */}
                                    <motion.div
                                        className="rounded-xl p-4 text-sm space-y-1"
                                        style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(120,170,255,0.12)' }}
                                        {...fadeUp(0.4)}
                                    >
                                        <p className="text-white/50">1. Abra o e-mail enviado para o endereço acima.</p>
                                        <p className="text-white/50">2. Clique em <strong className="text-white/70">Verificar e-mail</strong>.</p>
                                        <p className="text-white/50">3. Você será redirecionado automaticamente.</p>
                                    </motion.div>

                                    {/* Reenviar */}
                                    <motion.div className="flex flex-col gap-3" {...fadeUp(0.5)}>
                                        <Button
                                            onClick={handleResend}
                                            disabled={isPending || cooldown > 0}
                                            className="w-full h-11 font-medium"
                                            style={{
                                                background: 'rgba(59,130,246,0.15)',
                                                border: '1px solid rgba(59,130,246,0.4)',
                                                color: '#93c5fd',
                                            }}
                                        >
                                            {isPending
                                                ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                                : cooldown > 0
                                                    ? `Reenviar em ${cooldown}s`
                                                    : 'Reenviar e-mail de verificação'
                                            }
                                        </Button>

                                        <p className="text-center text-sm text-white/30">
                                            Usar outra conta?{' '}
                                            <a
                                                href="/login"
                                                className="text-white/60 hover:text-white transition-colors"
                                            >
                                                Voltar ao login
                                            </a>
                                        </p>
                                    </motion.div>
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Espaçador direito */}
                    <div className="hidden lg:block w-[340px] flex-shrink-0" />
                </div>
            </div>

            {/* Copyright */}
            <motion.p
                className="absolute bottom-6 left-12 text-white/20 text-xs"
                style={{ zIndex: 10 }}
                {...fadeIn(0.8)}
            >
                © 2024 KinarCRM. Todos os direitos reservados.
            </motion.p>
        </div>
    )
}
