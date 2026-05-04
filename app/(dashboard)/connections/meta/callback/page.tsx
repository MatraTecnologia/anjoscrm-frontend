'use client'

import { Suspense, useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { toast } from 'sonner'
import { Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useMetaOAuthCallback } from '@/services/meta'

function notify(type: 'META_OAUTH_SUCCESS' | 'META_OAUTH_ERROR', message?: string) {
    if (window.opener && !window.opener.closed) {
        window.opener.postMessage({ type, message }, window.location.origin)
        window.close()
        return true
    }
    return false
}

function CallbackContent() {
    const searchParams = useSearchParams()
    const router = useRouter()
    const [status, setStatus] = useState<'loading' | 'success' | 'error'>('loading')

    const { mutate: handleCallback } = useMetaOAuthCallback()

    useEffect(() => {
        const code = searchParams.get('code')
        const state = searchParams.get('state')
        const error = searchParams.get('error')

        if (error || !code) {
            setStatus('error')
            const isPopup = notify('META_OAUTH_ERROR', error === 'access_denied' ? 'Acesso negado pelo usuário.' : 'Erro ao conectar conta Meta.')
            if (!isPopup) setTimeout(() => router.replace('/connections'), 2500)
            return
        }

        handleCallback({ code, state: state ?? undefined }, {
            onSuccess: () => {
                setStatus('success')
                const isPopup = notify('META_OAUTH_SUCCESS')
                if (!isPopup) {
                    toast.success('Conta Meta conectada com sucesso!')
                    setTimeout(() => router.replace('/connections'), 1500)
                }
            },
            onError: () => {
                setStatus('error')
                const isPopup = notify('META_OAUTH_ERROR', 'Erro ao conectar conta Meta. Tente novamente.')
                if (!isPopup) {
                    toast.error('Erro ao conectar conta Meta. Tente novamente.')
                    setTimeout(() => router.replace('/connections'), 2500)
                }
            },
        })
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    return (
        <div className="flex min-h-screen items-center justify-center">
            <div className="flex flex-col items-center gap-3 text-center">
                {status === 'loading' && (
                    <>
                        <Loader2 className="size-10 animate-spin text-muted-foreground" />
                        <p className="text-sm text-muted-foreground">Conectando conta Meta...</p>
                    </>
                )}
                {status === 'success' && (
                    <>
                        <CheckCircle className="size-10 text-green-500" />
                        <p className="text-sm font-medium">Conta conectada!</p>
                        <p className="text-xs text-muted-foreground">Fechando...</p>
                    </>
                )}
                {status === 'error' && (
                    <>
                        <XCircle className="size-10 text-destructive" />
                        <p className="text-sm font-medium">Não foi possível conectar</p>
                        <p className="text-xs text-muted-foreground">Fechando...</p>
                    </>
                )}
            </div>
        </div>
    )
}

export default function MetaCallbackPage() {
    return (
        <Suspense>
            <CallbackContent />
        </Suspense>
    )
}
