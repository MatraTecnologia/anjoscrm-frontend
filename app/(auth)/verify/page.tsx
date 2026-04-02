'use client'

import Image from 'next/image'
import { useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Mail, Loader2, CheckCircle2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { useSession, useResendVerification } from '@/services/auth'

export default function VerifyPage() {
    const router = useRouter()
    const { data: session, isLoading } = useSession()
    const { mutate: resend, isPending } = useResendVerification()
    const [sent, setSent] = useState(false)
    const [cooldown, setCooldown] = useState(0)

    // Se email já verificado, redireciona pro fluxo de onboarding/dashboard
    useEffect(() => {
        if (!isLoading && session?.user?.emailVerified) {
            router.replace('/')
        }
    }, [session, isLoading, router])

    // Cooldown countdown
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
            <div className="flex min-h-svh items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    // Sem sessão → redireciona pro cadastro
    if (!session) {
        router.replace('/register')
        return null
    }

    const email = session.user.email

    return (
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Esquerda — conteúdo */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                <div className="flex justify-center md:justify-start">
                    <a href="#" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="KinarCRM" width={28} height={28} className="w-7 h-7 object-contain" />
                        <span className="font-semibold text-sm">KinarCRM</span>
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-xs flex flex-col gap-6">
                        {/* Ícone */}
                        <div className="flex justify-center">
                            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                                {sent
                                    ? <CheckCircle2 className="size-8 text-green-500" />
                                    : <Mail className="size-8 text-muted-foreground" />
                                }
                            </div>
                        </div>

                        {/* Texto */}
                        <div className="flex flex-col gap-1 text-center">
                            <h1 className="text-2xl font-semibold tracking-tight">
                                {sent ? 'E-mail reenviado!' : 'Verifique seu e-mail'}
                            </h1>
                            <p className="text-sm text-muted-foreground">
                                {sent
                                    ? 'Um novo link de verificação foi enviado para'
                                    : 'Enviamos um link de verificação para'
                                }
                            </p>
                            <p className="text-sm font-medium">{email}</p>
                        </div>

                        {/* Instruções */}
                        <div className="rounded-lg border bg-muted/40 p-4 text-sm text-muted-foreground space-y-1">
                            <p>1. Abra o e-mail enviado para o endereço acima.</p>
                            <p>2. Clique em <strong>Verificar e-mail</strong>.</p>
                            <p>3. Você será redirecionado automaticamente.</p>
                        </div>

                        {/* Reenviar */}
                        <div className="flex flex-col gap-3">
                            <Button
                                onClick={handleResend}
                                disabled={isPending || cooldown > 0}
                                variant="outline"
                                className="w-full"
                            >
                                {isPending
                                    ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                    : cooldown > 0
                                        ? `Reenviar em ${cooldown}s`
                                        : 'Reenviar e-mail de verificação'
                                }
                            </Button>

                            <p className="text-center text-sm text-muted-foreground">
                                Usar outra conta?{' '}
                                <a
                                    href="/login"
                                    className="font-medium text-foreground underline-offset-4 hover:underline"
                                >
                                    Voltar ao login
                                </a>
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Direita — painel de marca */}
            <div className="hidden lg:flex flex-col items-center justify-center gap-8 p-12 text-center" style={{ backgroundColor: '#004B6A' }}>
                <img src="/logo.png" alt="KinarCRM" className="w-48 object-contain" />
                <div className="flex flex-col gap-3 max-w-sm">
                    <p className="text-3xl font-bold tracking-tight leading-snug" style={{ color: '#D0AB6D' }}>
                        Feche mais negócios.<br />Deixe a IA qualificar.
                    </p>
                    <p className="text-sm leading-relaxed" style={{ color: 'rgba(208,171,109,0.6)' }}>
                        O KinarCRM responde seus leads automaticamente e entrega os melhores para o seu time fechar.
                    </p>
                </div>
            </div>
        </div>
    )
}
