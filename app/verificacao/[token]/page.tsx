'use client'

import { useEffect, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Loader2, ShieldCheck, ShieldX, FileText, ChevronRight, RefreshCw } from 'lucide-react'
import {
    fetchTokenInfo,
    useAnalyzeDocumentByToken,
    type VerificationTokenInfo,
    type DocumentType,
    type DocumentVerificationResult,
    type ExtractedDocumentData,
} from '@/services/verification'
import { Button } from '@/components/ui/button'
import { CameraView } from '@/components/camera-view'

type PageState = 'loading' | 'error' | 'select_doc' | 'camera_front' | 'camera_back' | 'camera_selfie' | 'analyzing' | 'result'

const DOC_OPTIONS: { value: DocumentType; label: string; hasBack: boolean }[] = [
    { value: 'RG', label: 'RG', hasBack: true },
    { value: 'CNH', label: 'CNH', hasBack: true },
    { value: 'PASSAPORTE', label: 'Passaporte', hasBack: false },
    { value: 'RNE', label: 'RNE / CIN', hasBack: true },
]

export default function VerificacaoPage() {
    const { token } = useParams<{ token: string }>()

    const [pageState, setPageState] = useState<PageState>('loading')
    const [tokenInfo, setTokenInfo] = useState<VerificationTokenInfo | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [selectedDoc, setSelectedDoc] = useState<DocumentType | null>(null)
    const [frontImage, setFrontImage] = useState<string | null>(null)
    const [backImage, setBackImage] = useState<string | null>(null)
    const [result, setResult] = useState<DocumentVerificationResult | null>(null)

    const analyzeDocument = useAnalyzeDocumentByToken(token)

    useEffect(() => {
        fetchTokenInfo(token)
            .then((info) => { setTokenInfo(info); setPageState('select_doc') })
            .catch((err) => {
                setErrorMessage(err?.response?.data?.error ?? 'Link inválido ou expirado.')
                setPageState('error')
            })
    }, [token])

    const docHasBack = DOC_OPTIONS.find(d => d.value === selectedDoc)?.hasBack ?? false
    const totalSteps = docHasBack ? 3 : 2

    const handleCaptureFront = useCallback((img: string) => {
        setFrontImage(img)
        const doc = DOC_OPTIONS.find(d => d.value === selectedDoc)
        setPageState(doc?.hasBack ? 'camera_back' : 'camera_selfie')
    }, [selectedDoc])

    const handleCaptureBack = useCallback((img: string) => {
        setBackImage(img)
        setPageState('camera_selfie')
    }, [])

    const handleCaptureSelfie = useCallback((selfie: string) => {
        setPageState('analyzing')
        analyzeDocument.mutate(
            {
                documentType: selectedDoc!,
                frontImage: frontImage!,
                backImage: backImage ?? undefined,
                selfieImage: selfie,
            },
            {
                onSuccess: (res) => { setResult(res); setPageState('result') },
                onError: (err: unknown) => {
                    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao analisar documentos.'
                    setErrorMessage(msg)
                    setPageState('error')
                },
            },
        )
    }, [analyzeDocument, selectedDoc, frontImage, backImage])

    const retry = useCallback(() => {
        setFrontImage(null)
        setBackImage(null)
        setResult(null)
        setPageState('select_doc')
    }, [])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center mb-2">
                        <ShieldCheck className="size-6 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold">Verificação de Identidade</h1>
                    {tokenInfo && (
                        <p className="text-sm text-muted-foreground">Olá, <span className="font-medium text-foreground">{tokenInfo.leadName}</span></p>
                    )}
                </div>

                {pageState === 'loading' && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {pageState === 'error' && (
                    <div className="flex flex-col items-center gap-3 p-6 rounded-lg border border-red-500/40 bg-red-500/10 text-center">
                        <ShieldX className="size-8 text-red-600" />
                        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                    </div>
                )}

                {pageState === 'select_doc' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Escolha o tipo de documento para verificar sua identidade.
                        </p>
                        <div className="flex flex-col gap-2">
                            {DOC_OPTIONS.map(doc => (
                                <button
                                    key={doc.value}
                                    onClick={() => setSelectedDoc(doc.value)}
                                    className={`flex items-center justify-between p-4 rounded-xl border transition-colors text-left ${selectedDoc === doc.value
                                        ? 'border-orange-500 bg-orange-500/10'
                                        : 'border-border hover:border-muted-foreground'
                                        }`}
                                >
                                    <div className="flex items-center gap-3">
                                        <FileText className={`size-5 ${selectedDoc === doc.value ? 'text-orange-500' : 'text-muted-foreground'}`} />
                                        <div>
                                            <p className="font-medium text-sm">{doc.label}</p>
                                            <p className="text-xs text-muted-foreground">{doc.hasBack ? 'Frente e verso' : 'Apenas frente'}</p>
                                        </div>
                                    </div>
                                    {selectedDoc === doc.value && <ChevronRight className="size-4 text-orange-500" />}
                                </button>
                            ))}
                        </div>
                        <Button
                            disabled={!selectedDoc}
                            onClick={() => setPageState('camera_front')}
                            size="lg"
                            className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            Continuar
                        </Button>
                    </div>
                )}

                {pageState === 'camera_front' && (
                    <CameraView
                        mode="document"
                        label="Frente do documento"
                        hint="Enquadre a frente do documento — sem reflexos e completamente visível"
                        step={1}
                        totalSteps={totalSteps}
                        onCapture={handleCaptureFront}
                        onError={(msg) => { setErrorMessage(msg); setPageState('error') }}
                        aspectRatio="4/3"
                    />
                )}

                {pageState === 'camera_back' && (
                    <CameraView
                        mode="document"
                        label="Verso do documento"
                        hint="Vire o documento e enquadre o verso completamente"
                        step={2}
                        totalSteps={totalSteps}
                        onCapture={handleCaptureBack}
                        onError={(msg) => { setErrorMessage(msg); setPageState('error') }}
                        aspectRatio="4/3"
                    />
                )}

                {pageState === 'camera_selfie' && (
                    <CameraView
                        mode="selfie"
                        label="Selfie"
                        hint="Olhe diretamente para a câmera com rosto bem iluminado"
                        step={totalSteps}
                        totalSteps={totalSteps}
                        onCapture={handleCaptureSelfie}
                        onError={(msg) => { setErrorMessage(msg); setPageState('error') }}
                        aspectRatio="3/4"
                    />
                )}

                {pageState === 'analyzing' && (
                    <div className="flex flex-col items-center gap-4 py-8">
                        <div className="relative">
                            <div className="size-16 rounded-full bg-orange-500/10 flex items-center justify-center">
                                <ShieldCheck className="size-8 text-orange-500" />
                            </div>
                            <Loader2 className="size-6 animate-spin text-orange-500 absolute -bottom-1 -right-1" />
                        </div>
                        <div className="text-center">
                            <p className="font-medium">Verificando documentos...</p>
                            <p className="text-sm text-muted-foreground mt-1">Aguarde, isso pode levar alguns segundos</p>
                        </div>
                    </div>
                )}

                {pageState === 'result' && result && (
                    <VerificationResultView result={result} onRetry={retry} />
                )}
            </div>
        </div>
    )
}

function VerificationResultView({ result, onRetry }: { result: DocumentVerificationResult; onRetry: () => void }) {
    const approved = result.overallStatus === 'aprovado'
    const inconclusive = result.overallStatus === 'inconclusivo'

    return (
        <div className="flex flex-col gap-4">
            <div className={`flex flex-col items-center gap-3 p-6 rounded-xl border text-center ${approved ? 'border-green-500/40 bg-green-500/10' : inconclusive ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                {approved
                    ? <ShieldCheck className="size-12 text-green-600" />
                    : <ShieldX className={`size-12 ${inconclusive ? 'text-yellow-600' : 'text-red-600'}`} />
                }
                <p className={`text-lg font-semibold ${approved ? 'text-green-600' : inconclusive ? 'text-yellow-600' : 'text-red-600'}`}>
                    {approved ? 'Identidade verificada!' : inconclusive ? 'Verificação inconclusiva' : 'Verificação não aprovada'}
                </p>
                <p className="text-sm text-muted-foreground">{result.authenticityReason}</p>
            </div>

            {result.extractedData && Object.keys(result.extractedData).some(k => result.extractedData[k as keyof ExtractedDocumentData]) && (
                <div className="rounded-xl border p-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados extraídos</p>
                    {([
                        ['name', 'Nome'], ['cpf', 'CPF'], ['rg', 'RG'],
                        ['birthDate', 'Nascimento'], ['documentNumber', 'Nº Documento'],
                        ['expiresAt', 'Validade'], ['issuedBy', 'Emitido por'],
                    ] as [keyof ExtractedDocumentData, string][]).map(([key, label]) => {
                        const val = result.extractedData[key]
                        if (!val) return null
                        return (
                            <div key={key} className="flex justify-between gap-2">
                                <span className="text-xs text-muted-foreground">{label}</span>
                                <span className="text-xs font-medium text-right">{val}</span>
                            </div>
                        )
                    })}
                </div>
            )}

            <div className="rounded-xl border p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pontuações</p>
                <ScoreRow label="Autenticidade" score={result.authenticityScore} status={result.authenticityStatus} />
                {result.faceMatchScore != null && (
                    <ScoreRow label="Correspondência facial" score={result.faceMatchScore} status={result.faceMatchStatus!} />
                )}
            </div>

            {result.overallStatus !== 'aprovado' && (
                <Button variant="outline" onClick={onRetry} className="gap-2">
                    <RefreshCw className="size-4" />
                    Tentar novamente
                </Button>
            )}
        </div>
    )
}

function ScoreRow({ label, score, status }: { label: string; score: number; status: string }) {
    const color = status === 'aprovado' ? 'text-green-600' : status === 'reprovado' ? 'text-red-600' : 'text-yellow-600'
    return (
        <div className="flex items-center justify-between gap-2">
            <span className="text-xs text-muted-foreground">{label}</span>
            <span className={`text-xs font-semibold ${color}`}>{score.toFixed(0)}%</span>
        </div>
    )
}
