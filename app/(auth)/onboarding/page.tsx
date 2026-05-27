'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Building2, Mail, Check } from 'lucide-react'
import Image from 'next/image'
import { GlassCard } from 'react-glass-ui'
import { motion } from 'framer-motion'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { useSession } from '@/services/auth'
import { useVerify, useCreateEnterprise, useAcceptInvite } from '@/services/enterprises'

type Step = 'loading' | 'photo' | 'enterprise'

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

export default function OnboardingPage() {
    const router = useRouter()
    const [step, setStep] = useState<Step>('loading')
    const [enterpriseName, setEnterpriseName] = useState('')

    const { data: session, isLoading: sessionLoading } = useSession()
    const { data: verify, isLoading: verifyLoading } = useVerify()
    const { mutate: createEnterprise, isPending: creating } = useCreateEnterprise()
    const { mutate: acceptInvite, isPending: accepting } = useAcceptInvite()

    const isLoading = sessionLoading || verifyLoading

    useEffect(() => {
        if (isLoading) return
        if (!session) { router.replace('/login'); return }
        if (!session.user.emailVerified) { router.replace('/verify'); return }
        if (verify && verify.enterprises.length > 0) { router.replace('/dashboard'); return }
        setStep(s => s === 'loading' ? 'photo' : s)
    }, [isLoading, session, verify, router])

    function handleCreateEnterprise(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!enterpriseName.trim()) return
        createEnterprise({ name: enterpriseName.trim() }, {
            onSuccess: () => { toast.success('Empresa criada com sucesso!'); router.replace('/dashboard') },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleAcceptInvite(token: string) {
        acceptInvite(token, {
            onSuccess: () => { toast.success('Convite aceito!'); router.replace('/dashboard') },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    if (step === 'loading' || isLoading) {
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
                <Loader2 className="size-8 animate-spin text-white/40" />
            </div>
        )
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
            {/* Logo 3D flutuante */}
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
                            Quase lá.<br />
                            Vamos configurar{' '}
                            <span style={{ color: '#3b82f6' }}>tudo</span>.
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
                                {/* Stepper */}
                                <div className="flex items-center gap-3 mb-8">
                                    <StepDot active={step === 'photo'} done={step === 'enterprise'} label="Foto" />
                                    <div className="flex-1 h-px bg-white/10" />
                                    <StepDot active={step === 'enterprise'} done={false} label="Empresa" />
                                </div>

                                {/* Step: photo */}
                                {step === 'photo' && (
                                    <AvatarUpload
                                        currentImage={session?.user.image ?? null}
                                        onSuccess={() => setStep('enterprise')}
                                        onSkip={() => setStep('enterprise')}
                                    />
                                )}

                                {/* Step: enterprise */}
                                {step === 'enterprise' && (
                                    <div className="flex flex-col gap-6">
                                        <div>
                                            <h2 className="text-xl font-semibold tracking-tight text-white">Configure sua empresa</h2>
                                            <p className="text-sm text-white/50 mt-1">
                                                Crie uma nova empresa ou aceite um convite pendente.
                                            </p>
                                        </div>

                                        {/* Convites pendentes */}
                                        {verify?.pendingInvites && verify.pendingInvites.length > 0 && (
                                            <div className="flex flex-col gap-3">
                                                <p className="text-sm font-medium text-white/70">Convites recebidos</p>
                                                {verify.pendingInvites.map((invite) => (
                                                    <div
                                                        key={invite.token}
                                                        className="flex items-center justify-between rounded-xl border border-white/10 bg-white/5 p-3 gap-3"
                                                    >
                                                        <div className="flex items-center gap-3 min-w-0">
                                                            <Mail className="size-4 shrink-0 text-white/40" />
                                                            <div className="min-w-0">
                                                                <p className="text-sm font-medium truncate text-white">{invite.enterpriseName}</p>
                                                                <p className="text-xs text-white/40 truncate">Convidado por {invite.invitedBy}</p>
                                                            </div>
                                                        </div>
                                                        <Button size="sm" onClick={() => handleAcceptInvite(invite.token)} disabled={accepting}>
                                                            {accepting ? <Loader2 className="size-3 animate-spin" /> : 'Aceitar'}
                                                        </Button>
                                                    </div>
                                                ))}

                                                <div className="relative my-2">
                                                    <div className="absolute inset-0 flex items-center">
                                                        <span className="w-full border-t border-white/10" />
                                                    </div>
                                                    <div className="relative flex justify-center text-xs uppercase">
                                                        <span className="bg-transparent px-2 text-white/30">ou</span>
                                                    </div>
                                                </div>
                                            </div>
                                        )}

                                        {/* Criar nova empresa */}
                                        <form onSubmit={handleCreateEnterprise} className="flex flex-col gap-4">
                                            <div className="flex flex-col gap-2">
                                                <Label htmlFor="enterprise-name" className="text-white/70">Nome da empresa</Label>
                                                <div className="relative">
                                                    <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-white/30" />
                                                    <Input
                                                        id="enterprise-name"
                                                        placeholder="Minha Empresa Ltda"
                                                        className="pl-9 bg-white/5 border-white/10 text-white placeholder:text-white/20"
                                                        value={enterpriseName}
                                                        onChange={(e) => setEnterpriseName(e.target.value)}
                                                        required
                                                        disabled={creating}
                                                    />
                                                </div>
                                            </div>
                                            <Button type="submit" className="w-full" disabled={creating || !enterpriseName.trim()}>
                                                {creating
                                                    ? <><Loader2 className="size-4 animate-spin" /> Criando...</>
                                                    : 'Criar empresa'
                                                }
                                            </Button>
                                        </form>
                                    </div>
                                )}
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

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1.5">
            <div className={`size-7 rounded-full flex items-center justify-center text-xs font-semibold border-2 transition-all ${
                done
                    ? 'bg-blue-500 border-blue-500 text-white'
                    : active
                        ? 'border-blue-400 text-blue-400 bg-blue-400/10'
                        : 'border-white/20 text-white/30 bg-white/5'
            }`}>
                {done ? <Check className="size-3.5" /> : active ? '●' : '○'}
            </div>
            <span className={`text-xs ${active || done ? 'text-white/80' : 'text-white/30'}`}>{label}</span>
        </div>
    )
}
