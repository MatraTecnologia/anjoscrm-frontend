'use client'

import { useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Loader2, GitBranch } from 'lucide-react'
import { useEnterprise } from '@/hooks/use-enterprise'
import { useListPipelines } from '@/services/pipelines'

export default function PipelineIndexPage() {
    const router = useRouter()
    const { enterprise, isLoading: entLoading } = useEnterprise()
    const { data: pipelines = [], isLoading } = useListPipelines(enterprise?.id ?? '')

    useEffect(() => {
        if (isLoading || entLoading) return
        if (pipelines.length > 0) {
            router.replace(`/pipeline/${pipelines[0].id}`)
        }
    }, [isLoading, entLoading, pipelines, router])

    if (isLoading || entLoading || pipelines.length > 0) {
        return (
            <div className="flex flex-1 items-center justify-center">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-1 flex-col items-center justify-center gap-3 text-muted-foreground">
            <GitBranch className="size-10 opacity-30" />
            <p className="text-sm">Nenhuma pipeline criada ainda.</p>
            <p className="text-xs">Clique em "Nova pipeline" para começar.</p>
        </div>
    )
}
