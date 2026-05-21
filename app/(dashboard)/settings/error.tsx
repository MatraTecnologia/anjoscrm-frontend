'use client'

import { useEffect } from 'react'
import { Button } from '@/components/ui/button'

export default function SettingsError({
    error,
    reset,
}: {
    error: Error & { digest?: string }
    reset: () => void
}) {
    useEffect(() => {
        console.error(error)
    }, [error])

    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 gap-4">
            <p className="text-sm text-muted-foreground">Algo deu errado ao carregar esta página.</p>
            <p className="text-xs text-destructive font-mono max-w-xl text-center break-all">{error.message}</p>
            <Button size="sm" variant="outline" onClick={reset}>
                Tentar novamente
            </Button>
        </div>
    )
}
