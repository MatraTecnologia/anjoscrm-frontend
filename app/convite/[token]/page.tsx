'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { motion } from 'framer-motion'
import { GlassCard } from 'react-glass-ui'
import { Loader2, Building2, UserCheck, LogIn, UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { useSession } from '@/services/auth'
import { useAcceptInvite } from '@/services/enterprises'
import { api } from '@/lib/api'

// ─── Types ────────────────────────────────────────────────────────────────────

type InviteInfo = {
    token: string
    email: string | null
    expiresAt: string
    enterprise: { id: string; name: string; logo: string | null }
    role: { id: string; name: string }
}

type InviteState =
    | { status: 'loading' }
    | { status: 'valid'; invite: InviteInfo }
    | { status: 'used' }
    | { status: 'expired' }
    | { status: 'not_found' }
    | { status: 'accepted' }

// ─── Animation helpers ────────────────────────────────────────────────────────

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1]

const fadeUp = (delay = 0) => ({
    initial: { opacity: 0, y: 24 },
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.6, delay, ease: EASE },
})

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const router = useRouter()
    const { data: session, isLoading: sessionLoading } = useSession()
    const { mutate: acceptInvite, isPending: accepting } = useAcceptInvite()

    const [state, setState] = useState<InviteState>({ status: 'loading' })

    useEffect(() => {
        api.get<InviteInfo>(`/enterprises/invite/${token}`)
            .then(({ data }) => setState({ status: 'valid', invite: data }))
            .catch((err: Error) => {
                const msg = err.message ?? ''
                if (msg.includes('utilizado')) setState({ status: 'used' })
                else if (msg.includes('expirou')) setState({ status: 'expired' })
                else setState({ status: 'not_found' })
            })
    }, [token])

    function handleAccept() {
        acceptInvite(token, {
            onSuccess: () => {
                setState({ status: 'accepted' })
                toast.success('Você entrou na empresa com sucesso!')
                setTimeout(() => router.replace('/'), 2000)
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function goToLogin() {
        sessionStorage.setItem('pending_invite', token)
        router.push(`/login?redirect=/convite/${token}`)
    }

    function goToRegister() {
        sessionStorage.setItem('pending_invite', token)
        router.push(`/register?redirect=/convite/${token}`)
    }

    useEffect(() => {
        if (!session || sessionLoading || state.status !== 'valid') return
        const pending = sessionStorage.getItem('pending_invite')
        if (pending === token) {
            sessionStorage.removeItem('pending_invite')
            handleAccept()
        }
    }, [session, sessionLoading, state.status]) // eslint-disable-line react-hooks/exhaustive-deps

    const isLoading = state.status === 'loading' || sessionLoading

    return (
        <div
            className="relative min-h-screen w-full overflow-hidden"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundColor: '#060d1c',
            }}
        >
            {/* Logo 3D flutuante — atrás do card */}
            <motion.div
                className="hidden lg:block absolute select-none pointer-events-none"
                style={{ zIndex: 5, top: '50%', right: '80px', translateY: '-50%' }}
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
                            className="w-[480px] h-auto"
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
                            Você foi convidado para<br />
                            fazer parte de um <span style={{ color: '#3b82f6' }}>workspace</span>.
                        </motion.p>
                    </div>

                    {/* Centro — card */}
                    <div className="flex-1 flex items-center justify-center">
                        <motion.div
                            style={{ width: 460 }}
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
                                    {/* Loading */}
                                    {isLoading && (
                                        <div className="flex flex-col items-center gap-4 py-8">
                                            <Loader2 className="size-8 animate-spin text-blue-400" />
                                            <p className="text-sm text-white/50">Carregando convite...</p>
                                        </div>
                                    )}

                                    {/* Convite válido */}
                                    {!isLoading && state.status === 'valid' && (
                                        <motion.div className="flex flex-col gap-6" {...fadeUp(0.05)}>
                                            {/* Logo da empresa */}
                                            <div className="flex justify-center">
                                                <div
                                                    className="flex size-16 items-center justify-center rounded-2xl overflow-hidden"
                                                    style={{ background: 'rgba(37,99,235,0.15)', border: '1px solid rgba(37,99,235,0.3)' }}
                                                >
                                                    {state.invite.enterprise.logo
                                                        ? <img src={state.invite.enterprise.logo} alt={state.invite.enterprise.name} className="size-full object-cover" />
                                                        : <Building2 className="size-8 text-blue-400" />
                                                    }
                                                </div>
                                            </div>

                                            {/* Título */}
                                            <div className="text-center flex flex-col gap-1">
                                                <h1 className="text-2xl font-semibold tracking-tight text-white">
                                                    Você foi convidado
                                                </h1>
                                                <p className="text-sm text-white/50">Para entrar na empresa</p>
                                                <p className="text-lg font-bold mt-1 text-white">
                                                    {state.invite.enterprise.name}
                                                </p>
                                            </div>

                                            {/* Detalhes */}
                                            <div
                                                className="rounded-xl p-4 space-y-3 text-sm"
                                                style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.08)' }}
                                            >
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/40">Cargo</span>
                                                    <span className="font-medium text-white/85">{state.invite.role.name}</span>
                                                </div>
                                                {state.invite.email && (
                                                    <div className="flex items-center justify-between">
                                                        <span className="text-white/40">Para</span>
                                                        <span className="font-medium text-white/85">{state.invite.email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center justify-between">
                                                    <span className="text-white/40">Expira em</span>
                                                    <span className="font-medium text-white/85">
                                                        {new Date(state.invite.expiresAt).toLocaleDateString('pt-BR', {
                                                            day: '2-digit', month: 'short', year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                            </div>

                                            {/* Ações */}
                                            {session ? (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-sm text-center text-white/40">
                                                        Conectado como{' '}
                                                        <strong className="text-white/70">{session.user?.name ?? session.user?.email}</strong>
                                                    </p>
                                                    <button
                                                        onClick={handleAccept}
                                                        disabled={accepting}
                                                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all disabled:opacity-60"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                                            boxShadow: '0 0 20px rgba(37,99,235,0.5)',
                                                        }}
                                                    >
                                                        {accepting
                                                            ? <><Loader2 className="size-4 animate-spin" /> Entrando...</>
                                                            : <><UserCheck className="size-4" /> Aceitar convite</>
                                                        }
                                                    </button>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col gap-3">
                                                    <p className="text-sm text-center text-white/40">
                                                        Faça login ou crie uma conta para aceitar
                                                    </p>
                                                    <button
                                                        onClick={goToLogin}
                                                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold text-white transition-all"
                                                        style={{
                                                            background: 'linear-gradient(135deg, #2563eb, #1d4ed8)',
                                                            boxShadow: '0 0 20px rgba(37,99,235,0.5)',
                                                        }}
                                                    >
                                                        <LogIn className="size-4" />
                                                        Entrar com conta existente
                                                    </button>
                                                    <button
                                                        onClick={goToRegister}
                                                        className="w-full h-11 rounded-xl flex items-center justify-center gap-2 text-sm font-medium text-white/70 transition-all hover:text-white"
                                                        style={{
                                                            background: 'rgba(255,255,255,0.06)',
                                                            border: '1px solid rgba(255,255,255,0.1)',
                                                        }}
                                                    >
                                                        <UserPlus className="size-4" />
                                                        Criar nova conta
                                                    </button>
                                                </div>
                                            )}
                                        </motion.div>
                                    )}

                                    {/* Aceito com sucesso */}
                                    {!isLoading && state.status === 'accepted' && (
                                        <motion.div className="flex flex-col items-center gap-5 py-4 text-center" {...fadeUp(0)}>
                                            <div
                                                className="flex size-16 items-center justify-center rounded-full"
                                                style={{ background: 'rgba(34,197,94,0.15)', border: '1px solid rgba(34,197,94,0.3)' }}
                                            >
                                                <CheckCircle2 className="size-8 text-green-400" />
                                            </div>
                                            <div>
                                                <h2 className="text-xl font-semibold text-white">Bem-vindo!</h2>
                                                <p className="text-sm text-white/50 mt-1">
                                                    Você entrou na empresa com sucesso. Redirecionando...
                                                </p>
                                            </div>
                                            <Loader2 className="size-4 animate-spin text-white/30" />
                                        </motion.div>
                                    )}

                                    {/* Estados de erro */}
                                    {!isLoading && state.status === 'used' && (
                                        <InviteError
                                            icon={<XCircle className="size-8 text-red-400" />}
                                            iconBg="rgba(239,68,68,0.12)"
                                            iconBorder="rgba(239,68,68,0.25)"
                                            title="Convite já utilizado"
                                            description="Este link de convite já foi aceito por alguém."
                                            action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                                        />
                                    )}
                                    {!isLoading && state.status === 'expired' && (
                                        <InviteError
                                            icon={<Clock className="size-8 text-amber-400" />}
                                            iconBg="rgba(245,158,11,0.12)"
                                            iconBorder="rgba(245,158,11,0.25)"
                                            title="Convite expirado"
                                            description="Este link não é mais válido. Peça ao administrador para gerar um novo."
                                            action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                                        />
                                    )}
                                    {!isLoading && state.status === 'not_found' && (
                                        <InviteError
                                            icon={<XCircle className="size-8 text-red-400" />}
                                            iconBg="rgba(239,68,68,0.12)"
                                            iconBorder="rgba(239,68,68,0.25)"
                                            title="Convite não encontrado"
                                            description="Este link é inválido ou foi removido."
                                            action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                                        />
                                    )}
                                </div>
                            </GlassCard>
                        </motion.div>
                    </div>

                    {/* Espaçador direito */}
                    <div className="hidden lg:block w-[320px] flex-shrink-0" />
                </div>
            </div>

            {/* Copyright */}
            <motion.p
                className="absolute bottom-6 left-12 text-white/20 text-xs"
                style={{ zIndex: 10 }}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ duration: 0.8, delay: 0.8 }}
            >
                © 2024 KinarCRM. Todos os direitos reservados.
            </motion.p>
        </div>
    )
}

// ─── Error state component ────────────────────────────────────────────────────

function InviteError({
    icon, iconBg, iconBorder, title, description, action,
}: {
    icon: React.ReactNode
    iconBg: string
    iconBorder: string
    title: string
    description: string
    action: { label: string; onClick: () => void }
}) {
    return (
        <motion.div className="flex flex-col items-center gap-5 py-4 text-center" initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.4 }}>
            <div
                className="flex size-16 items-center justify-center rounded-full"
                style={{ background: iconBg, border: `1px solid ${iconBorder}` }}
            >
                {icon}
            </div>
            <div>
                <h2 className="text-xl font-semibold text-white">{title}</h2>
                <p className="text-sm text-white/50 mt-1 max-w-xs">{description}</p>
            </div>
            <button
                onClick={action.onClick}
                className="h-10 px-6 rounded-xl text-sm font-medium text-white/70 hover:text-white transition-all"
                style={{ background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)' }}
            >
                {action.label}
            </button>
        </motion.div>
    )
}
