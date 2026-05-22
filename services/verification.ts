'use client'

import { useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type VerificationResult = {
    status: 'aprovado' | 'reprovado'
    score: number
    message: string
}

export type VerificationLink = {
    url: string
    token: string
    expiresAt: string
}

export type VerificationTokenInfo = {
    leadId: string
    leadName: string
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function analyzeFaceFn({
    leadId,
    image,
}: {
    leadId: string
    image: string
}): Promise<VerificationResult> {
    const { data } = await api.post<VerificationResult>(
        `/leads/${leadId}/verification/analyze`,
        { image },
    )
    return data
}

async function generateLinkFn(leadId: string): Promise<VerificationLink> {
    const { data } = await api.post<VerificationLink>(`/leads/${leadId}/verification/link`)
    return data
}

async function getTokenInfoFn(token: string): Promise<VerificationTokenInfo> {
    const { data } = await api.get<VerificationTokenInfo>(`/leads/verification/${token}`)
    return data
}

async function completeVerificationFn({
    token,
    image,
}: {
    token: string
    image: string
}): Promise<VerificationResult> {
    const { data } = await api.post<VerificationResult>(
        `/leads/verification/${token}/complete`,
        { image },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAnalyzeFace(leadId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (image: string) => analyzeFaceFn({ leadId, image }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.leads.detail(leadId) })
        },
    })
}

export function useGenerateVerificationLink(leadId: string) {
    return useMutation({
        mutationFn: () => generateLinkFn(leadId),
    })
}

export function useCompleteVerification(token: string) {
    return useMutation({
        mutationFn: (image: string) => completeVerificationFn({ token, image }),
    })
}

// Função direta para a página pública (sem autenticação)
export async function fetchTokenInfo(token: string): Promise<VerificationTokenInfo> {
    return getTokenInfoFn(token)
}
