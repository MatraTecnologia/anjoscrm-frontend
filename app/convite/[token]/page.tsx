'use client'

import { use, useEffect, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { Loader2, Building2, UserCheck, LogIn, UserPlus, CheckCircle2, XCircle, Clock } from 'lucide-react'
import { toast } from 'sonner'

import { Button } from '@/components/ui/button'
import { AIBackground } from '@/components/ai-background'
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

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ConvitePage({ params }: { params: Promise<{ token: string }> }) {
    const { token } = use(params)
    const router = useRouter()
    const { data: session, isLoading: sessionLoading } = useSession()
    const { mutate: acceptInvite, isPending: accepting } = useAcceptInvite()

    const [state, setState] = useState<InviteState>({ status: 'loading' })

    // Busca informações do convite (endpoint público, sem auth)
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
            onError: (err: Error) => {
                toast.error(err.message)
            },
        })
    }

    function goToLogin() {
        // Salva o token para redirecionar após o login
        sessionStorage.setItem('pending_invite', token)
        router.push(`/login?redirect=/convite/${token}`)
    }

    function goToRegister() {
        sessionStorage.setItem('pending_invite', token)
        router.push(`/register?redirect=/convite/${token}`)
    }

    // Aceita automaticamente se voltou do login com convite pendente
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
        <div className="grid min-h-svh lg:grid-cols-2">
            {/* Esquerda — conteúdo */}
            <div className="flex flex-col gap-4 p-6 md:p-10">
                {/* Logo */}
                <div className="flex justify-center md:justify-start">
                    <a href="/" className="flex items-center gap-2">
                        <Image src="/logo.png" alt="KinarCRM" width={28} height={28} className="w-7 h-7 object-contain" />
                        <span className="font-semibold text-sm">KinarCRM</span>
                    </a>
                </div>

                <div className="flex flex-1 items-center justify-center">
                    <div className="w-full max-w-sm flex flex-col gap-6">

                        {/* Loading */}
                        {isLoading && (
                            <div className="flex flex-col items-center gap-4 py-8">
                                <Loader2 className="size-8 animate-spin text-muted-foreground" />
                                <p className="text-sm text-muted-foreground">Carregando convite...</p>
                            </div>
                        )}

                        {/* Convite válido */}
                        {!isLoading && state.status === 'valid' && (
                            <>
                                {/* Ícone da empresa */}
                                <div className="flex justify-center">
                                    <div className="flex size-16 items-center justify-center rounded-2xl bg-muted overflow-hidden">
                                        {state.invite.enterprise.logo
                                            ? <img src={state.invite.enterprise.logo} alt={state.invite.enterprise.name} className="size-full object-cover" />
                                            : <Building2 className="size-8 text-muted-foreground" />
                                        }
                                    </div>
                                </div>

                                {/* Título */}
                                <div className="text-center flex flex-col gap-1">
                                    <h1 className="text-2xl font-semibold tracking-tight">
                                        Você foi convidado
                                    </h1>
                                    <p className="text-sm text-muted-foreground">
                                        Para entrar na empresa
                                    </p>
                                    <p className="text-lg font-bold mt-1">
                                        {state.invite.enterprise.name}
                                    </p>
                                </div>

                                {/* Detalhes */}
                                <div className="rounded-xl border bg-muted/40 p-4 space-y-3 text-sm">
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Cargo</span>
                                        <span className="font-medium">{state.invite.role.name}</span>
                                    </div>
                                    {state.invite.email && (
                                        <div className="flex items-center justify-between">
                                            <span className="text-muted-foreground">Para</span>
                                            <span className="font-medium">{state.invite.email}</span>
                                        </div>
                                    )}
                                    <div className="flex items-center justify-between">
                                        <span className="text-muted-foreground">Expira em</span>
                                        <span className="font-medium">
                                            {new Date(state.invite.expiresAt).toLocaleDateString('pt-BR', {
                                                day: '2-digit',
                                                month: 'short',
                                                year: 'numeric',
                                            })}
                                        </span>
                                    </div>
                                </div>

                                {/* Ações */}
                                {session ? (
                                    // Usuário logado — pode aceitar diretamente
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-center text-muted-foreground">
                                            Conectado como <strong>{session.user?.name ?? session.user?.email}</strong>
                                        </p>
                                        <Button
                                            onClick={handleAccept}
                                            disabled={accepting}
                                            className="w-full"
                                            size="lg"
                                        >
                                            {accepting
                                                ? <><Loader2 className="size-4 animate-spin" /> Entrando...</>
                                                : <><UserCheck className="size-4" /> Aceitar convite</>
                                            }
                                        </Button>
                                    </div>
                                ) : (
                                    // Não logado — login ou cadastro
                                    <div className="flex flex-col gap-3">
                                        <p className="text-sm text-center text-muted-foreground">
                                            Faça login ou crie uma conta para aceitar o convite
                                        </p>
                                        <Button onClick={goToLogin} className="w-full" size="lg">
                                            <LogIn className="size-4" />
                                            Entrar com conta existente
                                        </Button>
                                        <Button onClick={goToRegister} variant="outline" className="w-full" size="lg">
                                            <UserPlus className="size-4" />
                                            Criar nova conta
                                        </Button>
                                    </div>
                                )}
                            </>
                        )}

                        {/* Aceito com sucesso */}
                        {!isLoading && state.status === 'accepted' && (
                            <div className="flex flex-col items-center gap-4 py-4 text-center">
                                <div className="flex size-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-950">
                                    <CheckCircle2 className="size-8 text-green-600 dark:text-green-400" />
                                </div>
                                <div>
                                    <h2 className="text-xl font-semibold">Bem-vindo!</h2>
                                    <p className="text-sm text-muted-foreground mt-1">
                                        Você entrou na empresa com sucesso. Redirecionando...
                                    </p>
                                </div>
                                <Loader2 className="size-4 animate-spin text-muted-foreground" />
                            </div>
                        )}

                        {/* Convite já utilizado */}
                        {!isLoading && state.status === 'used' && (
                            <InviteError
                                icon={<XCircle className="size-8 text-destructive" />}
                                title="Convite já utilizado"
                                description="Este link de convite já foi aceito por alguém."
                                action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                            />
                        )}

                        {/* Convite expirado */}
                        {!isLoading && state.status === 'expired' && (
                            <InviteError
                                icon={<Clock className="size-8 text-amber-500" />}
                                title="Convite expirado"
                                description="Este link de convite não é mais válido. Peça ao administrador para gerar um novo."
                                action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                            />
                        )}

                        {/* Convite não encontrado */}
                        {!isLoading && state.status === 'not_found' && (
                            <InviteError
                                icon={<XCircle className="size-8 text-destructive" />}
                                title="Convite não encontrado"
                                description="Este link é inválido ou foi removido."
                                action={{ label: 'Ir para o login', onClick: () => router.push('/login') }}
                            />
                        )}

                    </div>
                </div>
            </div>

            {/* Direita — painel animado IA */}
            <AIBackground className="hidden lg:block">
                <div className="flex flex-col items-center justify-center gap-8 p-12 text-center h-full min-h-svh">
                    <img src="/logo.png" alt="KinarCRM" className="w-48 object-contain drop-shadow-2xl" />
                    <div className="flex flex-col gap-3 max-w-sm">
                        <p className="text-3xl font-bold tracking-tight leading-snug" style={{ color: '#D0AB6D' }}>
                            Feche mais negócios.<br />Deixe a IA qualificar.
                        </p>
                        <p className="text-sm leading-relaxed" style={{ color: 'rgba(208,171,109,0.55)' }}>
                            O KinarCRM responde seus leads automaticamente e entrega os melhores para o seu time fechar.
                        </p>
                    </div>
                </div>
            </AIBackground>
        </div>
    )
}

// ─── Error state component ────────────────────────────────────────────────────

function InviteError({
    icon,
    title,
    description,
    action,
}: {
    icon: React.ReactNode
    title: string
    description: string
    action: { label: string; onClick: () => void }
}) {
    return (
        <div className="flex flex-col items-center gap-4 py-4 text-center">
            <div className="flex size-16 items-center justify-center rounded-full bg-muted">
                {icon}
            </div>
            <div>
                <h2 className="text-xl font-semibold">{title}</h2>
                <p className="text-sm text-muted-foreground mt-1 max-w-xs">{description}</p>
            </div>
            <Button variant="outline" onClick={action.onClick}>
                {action.label}
            </Button>
        </div>
    )
}
