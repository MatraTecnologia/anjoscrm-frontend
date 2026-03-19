'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2 } from 'lucide-react'

import { useSession } from '@/services/auth'
import { useVerify } from '@/services/enterprises'

export default function RootPage() {
    const router = useRouter()
    const { data: session, isLoading: sessionLoading } = useSession()
    const { data: verify, isLoading: verifyLoading } = useVerify()

    const isLoading = sessionLoading || verifyLoading

    useEffect(() => {
        if (isLoading) return

        if (!session) {
            router.replace('/login')
            return
        }

        if (!session.user.emailVerified) {
            router.replace('/verify')
            return
        }

        if (!verify || verify.enterprises.length === 0) {
            router.replace('/onboarding')
            return
        }

        router.replace('/dashboard')
    }, [isLoading, session, verify, router])

    return (
        <div className="flex min-h-svh items-center justify-center">
            <Loader2 className="size-8 animate-spin text-muted-foreground" />
        </div>
    )
}
