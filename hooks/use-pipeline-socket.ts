'use client'

import { useEffect } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { getSocket } from '@/lib/socket'
import { keys } from '@/lib/keys'

type PipelineDealEvent = {
    dealId?: string
    stageId?: string
    fromStageId?: string
    toStageId?: string
    pipelineId?: string
}

export function usePipelineSocket(pipelineId: string, enterpriseId: string) {
    const qc = useQueryClient()

    useEffect(() => {
        if (!pipelineId || !enterpriseId) return

        const socket = getSocket()
        socket.emit('join-pipeline', pipelineId)

        function onDealCreated(data: PipelineDealEvent) {
            if (data.stageId) {
                qc.invalidateQueries({ queryKey: keys.deals.byStage(data.stageId) })
            }
        }

        function onDealUpdated(data: PipelineDealEvent) {
            if (data.fromStageId) {
                qc.invalidateQueries({ queryKey: keys.deals.byStage(data.fromStageId) })
            }
            if (data.toStageId && data.toStageId !== data.fromStageId) {
                qc.invalidateQueries({ queryKey: keys.deals.byStage(data.toStageId) })
            }
        }

        function onDealDeleted(data: PipelineDealEvent) {
            if (data.stageId) {
                qc.invalidateQueries({ queryKey: keys.deals.byStage(data.stageId) })
            }
        }

        socket.on('deal:created', onDealCreated)
        socket.on('deal:updated', onDealUpdated)
        socket.on('deal:deleted', onDealDeleted)

        return () => {
            socket.emit('leave-pipeline', pipelineId)
            socket.off('deal:created', onDealCreated)
            socket.off('deal:updated', onDealUpdated)
            socket.off('deal:deleted', onDealDeleted)
        }
    }, [pipelineId, enterpriseId, qc])
}
