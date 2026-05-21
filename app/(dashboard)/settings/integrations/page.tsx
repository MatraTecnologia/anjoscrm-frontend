'use client'

import { Plug } from 'lucide-react'

export default function IntegracoesPag() {
    return (
        <div className="flex flex-col items-center justify-center flex-1 py-20 gap-3 text-muted-foreground">
            <Plug className="size-10 opacity-30" />
            <p className="text-sm">Integrações em breve.</p>
        </div>
    )
}
