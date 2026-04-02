'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, Building2, Mail } from 'lucide-react'
import Image from 'next/image'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AvatarUpload } from '@/components/avatar-upload'
import { useSession } from '@/services/auth'
import { useVerify, useCreateEnterprise, useAcceptInvite } from '@/services/enterprises'

type Step = 'loading' | 'photo' | 'enterprise'

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

        // Já tem empresa → vai pro dashboard
        if (verify && verify.enterprises.length > 0) {
            router.replace('/dashboard')
            return
        }

        setStep('photo')
    }, [isLoading, session, verify, router])

    function handleCreateEnterprise(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        if (!enterpriseName.trim()) return
        createEnterprise({ name: enterpriseName.trim() }, {
            onSuccess: () => {
                toast.success('Empresa criada com sucesso!')
                router.replace('/dashboard')
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleAcceptInvite(token: string) {
        acceptInvite(token, {
            onSuccess: () => {
                toast.success('Convite aceito!')
                router.replace('/dashboard')
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    if (step === 'loading' || isLoading) {
        return (
            <div className="flex min-h-svh items-center justify-center">
                <Loader2 className="size-8 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Esquerda */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center md:justify-start">
                    <a href="#" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="KinarCRM" width={28} height={28} className="w-7 h-7 object-contain" />
                        <span className="font-semibold text-sm">KinarCRM</span>
                    </a>
                </div>

                {/* Indicador de etapas */}
                <div className="flex justify-center md:justify-start gap-2 px-1">
                    <StepDot active={step === 'photo'} done={step === 'enterprise'} label="Foto" />
                    <div className="flex-1 max-w-8 flex items-center">
                        <div className="h-px w-full bg-border" />
                    </div>
                    <StepDot active={step === 'enterprise'} done={false} label="Empresa" />
                </div>

                <div className="flex flex-1 items-center justify-center">
                    {/* ── Step: photo ── */}
                    {step === 'photo' && (
                        <AvatarUpload
                            currentImage={session?.user.image ?? null}
                            onSuccess={() => setStep('enterprise')}
                            onSkip={() => setStep('enterprise')}
                        />
                    )}

                    {/* ── Step: enterprise ── */}
                    {step === 'enterprise' && (
                        <div className="flex flex-col gap-6 w-full max-w-sm">
                            <div>
                                <h2 className="text-xl font-semibold tracking-tight">Configure sua empresa</h2>
                                <p className="text-sm text-muted-foreground mt-1">
                                    Crie uma nova empresa ou aceite um convite pendente.
                                </p>
                            </div>

                            {/* Convites pendentes */}
                            {verify?.pendingInvites && verify.pendingInvites.length > 0 && (
                                <div className="flex flex-col gap-3">
                                    <p className="text-sm font-medium">Convites recebidos</p>
                                    {verify.pendingInvites.map((invite) => (
                                        <div
                                            key={invite.token}
                                            className="flex items-center justify-between rounded-lg border p-3 gap-3"
                                        >
                                            <div className="flex items-center gap-3 min-w-0">
                                                <Mail className="size-4 shrink-0 text-muted-foreground" />
                                                <div className="min-w-0">
                                                    <p className="text-sm font-medium truncate">{invite.enterpriseName}</p>
                                                    <p className="text-xs text-muted-foreground truncate">
                                                        Convidado por {invite.invitedBy}
                                                    </p>
                                                </div>
                                            </div>
                                            <Button
                                                size="sm"
                                                onClick={() => handleAcceptInvite(invite.token)}
                                                disabled={accepting}
                                            >
                                                {accepting
                                                    ? <Loader2 className="size-3 animate-spin" />
                                                    : 'Aceitar'
                                                }
                                            </Button>
                                        </div>
                                    ))}

                                    <div className="relative my-2">
                                        <div className="absolute inset-0 flex items-center">
                                            <span className="w-full border-t" />
                                        </div>
                                        <div className="relative flex justify-center text-xs uppercase">
                                            <span className="bg-background px-2 text-muted-foreground">ou</span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            {/* Criar nova empresa */}
                            <form onSubmit={handleCreateEnterprise} className="flex flex-col gap-4">
                                <div className="flex flex-col gap-2">
                                    <Label htmlFor="enterprise-name">Nome da empresa</Label>
                                    <div className="relative">
                                        <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                                        <Input
                                            id="enterprise-name"
                                            placeholder="Minha Empresa Ltda"
                                            className="pl-9"
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
                </div>
            </div>

            {/* Direita — painel de marca */}
            <div
                className="hidden lg:flex flex-col items-center justify-center gap-8 p-12 text-center"
                style={{ backgroundColor: '#004B6A' }}
            >
                <img src="/logo.png" alt="KinarCRM" className="w-48 object-contain" />
                <div className="flex flex-col gap-3 max-w-sm">
                    <p className="text-3xl font-bold tracking-tight leading-snug" style={{ color: '#D0AB6D' }}>
                        Quase lá.<br />Vamos configurar tudo.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(208,171,109,0.6)' }}>
                        Adicione sua foto e configure sua empresa para começar a usar o KinarCRM.
                    </p>
                </div>
            </div>
        </div>
    )
}

function StepDot({ active, done, label }: { active: boolean; done: boolean; label: string }) {
    return (
        <div className="flex flex-col items-center gap-1">
            <div className={`size-6 rounded-full flex items-center justify-center text-xs font-medium border-2 transition-colors ${done
                ? 'bg-primary border-primary text-primary-foreground'
                : active
                    ? 'border-primary text-primary bg-background'
                    : 'border-muted-foreground/30 text-muted-foreground bg-background'
                }`}>
                {done ? '✓' : active ? '●' : '○'}
            </div>
            <span className={`text-xs ${active || done ? 'text-foreground' : 'text-muted-foreground'}`}>{label}</span>
        </div>
    )
}
