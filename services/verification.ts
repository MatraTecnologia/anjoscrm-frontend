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

export type DocumentType = 'RG' | 'CNH' | 'PASSAPORTE' | 'RNE'

export type ExtractedDocumentData = {
    name?: string
    cpf?: string
    rg?: string
    birthDate?: string
    expiresAt?: string
    documentNumber?: string
    fatherName?: string
    motherName?: string
    nationality?: string
    issuedBy?: string
    issuedAt?: string
}

export type DocumentVerificationResult = {
    authenticityStatus: 'aprovado' | 'reprovado' | 'inconclusivo'
    authenticityScore: number
    authenticityReason: string
    extractedData: ExtractedDocumentData
    faceMatchStatus?: 'aprovado' | 'reprovado' | 'inconclusivo'
    faceMatchScore?: number
    faceMatchReason?: string
    overallStatus: 'aprovado' | 'reprovado' | 'inconclusivo'
}

// ─── API ─────────────────────────────────────────────────────────────────────

async function analyzeFaceFn({
    leadId,
    enterpriseId,
    image,
}: {
    leadId: string
    enterpriseId: string
    image: string
}): Promise<VerificationResult> {
    const { data } = await api.post<VerificationResult>(
        `/leads/${leadId}/verification/analyze`,
        { image },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function generateLinkFn(leadId: string, enterpriseId: string): Promise<VerificationLink> {
    const { data } = await api.post<VerificationLink>(
        `/leads/${leadId}/verification/link`,
        undefined,
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
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

async function analyzeDocumentFn({
    leadId,
    enterpriseId,
    documentType,
    frontImage,
    backImage,
    selfieImage,
}: {
    leadId: string
    enterpriseId: string
    documentType: DocumentType
    frontImage: string
    backImage?: string
    selfieImage?: string
}): Promise<DocumentVerificationResult> {
    const { data } = await api.post<DocumentVerificationResult>(
        `/leads/${leadId}/verification/document`,
        { documentType, frontImage, backImage, selfieImage },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

async function analyzeDocumentByTokenFn({
    token,
    documentType,
    frontImage,
    backImage,
    selfieImage,
}: {
    token: string
    documentType: DocumentType
    frontImage: string
    backImage?: string
    selfieImage?: string
}): Promise<DocumentVerificationResult> {
    const { data } = await api.post<DocumentVerificationResult>(
        `/leads/verification/${token}/document`,
        { documentType, frontImage, backImage, selfieImage },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useAnalyzeFace(leadId: string, enterpriseId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (image: string) => analyzeFaceFn({ leadId, enterpriseId, image }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.leads.detail(leadId) })
        },
    })
}

export function useGenerateVerificationLink(leadId: string, enterpriseId: string) {
    return useMutation({
        mutationFn: () => generateLinkFn(leadId, enterpriseId),
    })
}

export function useCompleteVerification(token: string) {
    return useMutation({
        mutationFn: (image: string) => completeVerificationFn({ token, image }),
    })
}

export function useAnalyzeDocument(leadId: string, enterpriseId: string) {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: (payload: { documentType: DocumentType; frontImage: string; backImage?: string; selfieImage?: string }) =>
            analyzeDocumentFn({ leadId, enterpriseId, ...payload }),
        onSuccess: () => {
            queryClient.invalidateQueries({ queryKey: keys.leads.detail(leadId) })
        },
    })
}

export function useAnalyzeDocumentByToken(token: string) {
    return useMutation({
        mutationFn: (payload: { documentType: DocumentType; frontImage: string; backImage?: string; selfieImage?: string }) =>
            analyzeDocumentByTokenFn({ token, ...payload }),
    })
}

// Função direta para a página pública (sem autenticação)
export async function fetchTokenInfo(token: string): Promise<VerificationTokenInfo> {
    return getTokenInfoFn(token)
}
