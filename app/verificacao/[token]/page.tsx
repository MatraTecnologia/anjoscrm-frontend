'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Camera, RefreshCw, Loader2, ShieldCheck, ShieldX, FileText, FlipHorizontal, User, ChevronRight } from 'lucide-react'
import {
    fetchTokenInfo,
    useAnalyzeDocumentByToken,
    type VerificationTokenInfo,
    type DocumentType,
    type DocumentVerificationResult,
    type ExtractedDocumentData,
} from '@/services/verification'
import { Button } from '@/components/ui/button'

type PageState =
    | 'loading'
    | 'error'
    | 'select_doc'
    | 'camera_front'
    | 'camera_back'
    | 'camera_selfie'
    | 'analyzing'
    | 'result'

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
    const [selfieImage, setSelfieImage] = useState<string | null>(null)
    const [result, setResult] = useState<DocumentVerificationResult | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const analyzeDocument = useAnalyzeDocumentByToken(token)

    useEffect(() => {
        fetchTokenInfo(token)
            .then((info) => { setTokenInfo(info); setPageState('select_doc') })
            .catch((err) => {
                setErrorMessage(err?.response?.data?.error ?? 'Link inválido ou expirado.')
                setPageState('error')
            })
    }, [token])

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    const startCamera = useCallback(async (nextState: 'camera_front' | 'camera_back' | 'camera_selfie') => {
        try {
            stopCamera()
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } })
            streamRef.current = stream
            setPageState(nextState)
        } catch {
            setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões.')
            setPageState('error')
        }
    }, [stopCamera])

    useEffect(() => {
        const cameraStates: PageState[] = ['camera_front', 'camera_back', 'camera_selfie']
        if (cameraStates.includes(pageState) && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [pageState])

    const capture = useCallback((): string | null => {
        if (!videoRef.current || !canvasRef.current) return null
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        return canvas.toDataURL('image/jpeg', 0.9)
    }, [])

    const handleCaptureFront = useCallback(() => {
        const img = capture()
        if (!img) return
        setFrontImage(img)
        stopCamera()
        const doc = DOC_OPTIONS.find(d => d.value === selectedDoc)
        if (doc?.hasBack) {
            setPageState('camera_back')
            startCamera('camera_back')
        } else {
            startCamera('camera_selfie')
        }
    }, [capture, stopCamera, selectedDoc, startCamera])

    const handleCaptureBack = useCallback(() => {
        const img = capture()
        if (!img) return
        setBackImage(img)
        stopCamera()
        startCamera('camera_selfie')
    }, [capture, stopCamera, startCamera])

    const handleCaptureSelfie = useCallback(() => {
        const img = capture()
        if (!img) return
        setSelfieImage(img)
        stopCamera()
        setPageState('analyzing')

        analyzeDocument.mutate(
            {
                documentType: selectedDoc!,
                frontImage: frontImage!,
                backImage: backImage ?? undefined,
                selfieImage: img,
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
    }, [capture, stopCamera, analyzeDocument, selectedDoc, frontImage, backImage])

    const retry = useCallback(() => {
        setFrontImage(null)
        setBackImage(null)
        setSelfieImage(null)
        setResult(null)
        setPageState('select_doc')
    }, [])

    const docHasBack = DOC_OPTIONS.find(d => d.value === selectedDoc)?.hasBack ?? false
    const totalSteps = docHasBack ? 3 : 2
    const currentStep = pageState === 'camera_front' ? 1 : pageState === 'camera_back' ? 2 : pageState === 'camera_selfie' ? totalSteps : 0

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

                {/* Loading */}
                {pageState === 'loading' && (
                    <div className="flex justify-center py-8">
                        <Loader2 className="size-6 animate-spin text-muted-foreground" />
                    </div>
                )}

                {/* Error */}
                {pageState === 'error' && (
                    <div className="flex flex-col items-center gap-3 p-6 rounded-lg border border-red-500/40 bg-red-500/10 text-center">
                        <ShieldX className="size-8 text-red-600" />
                        <p className="text-sm text-red-600 font-medium">{errorMessage}</p>
                    </div>
                )}

                {/* Seleção de documento */}
                {pageState === 'select_doc' && (
                    <div className="flex flex-col gap-4">
                        <p className="text-sm text-muted-foreground text-center">
                            Escolha o tipo de documento que você vai usar para verificar sua identidade.
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
                            onClick={() => startCamera('camera_front')}
                            size="lg"
                            className="w-full gap-2 bg-orange-500 hover:bg-orange-600 text-white"
                        >
                            <Camera className="size-5" />
                            Continuar
                        </Button>
                    </div>
                )}

                {/* Camera — frente */}
                {pageState === 'camera_front' && (
                    <CameraCapture
                        label="Frente do documento"
                        hint="Enquadre a frente do documento dentro da área e certifique-se que está legível"
                        step={1}
                        totalSteps={totalSteps}
                        icon={<FileText className="size-5" />}
                        videoRef={videoRef}
                        onCapture={handleCaptureFront}
                    />
                )}

                {/* Camera — verso */}
                {pageState === 'camera_back' && (
                    <CameraCapture
                        label="Verso do documento"
                        hint="Vire o documento e enquadre o verso"
                        step={2}
                        totalSteps={totalSteps}
                        icon={<FlipHorizontal className="size-5" />}
                        videoRef={videoRef}
                        onCapture={handleCaptureBack}
                    />
                )}

                {/* Camera — selfie */}
                {pageState === 'camera_selfie' && (
                    <CameraCapture
                        label="Selfie"
                        hint="Olhe diretamente para a câmera com rosto bem iluminado"
                        step={totalSteps}
                        totalSteps={totalSteps}
                        icon={<User className="size-5" />}
                        videoRef={videoRef}
                        onCapture={handleCaptureSelfie}
                        selfie
                    />
                )}

                {/* Analisando */}
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

                {/* Resultado */}
                {pageState === 'result' && result && (
                    <VerificationResultView result={result} onRetry={retry} />
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    )
}

// ─── Componente câmera ────────────────────────────────────────────────────────

function CameraCapture({
    label,
    hint,
    step,
    totalSteps,
    icon,
    videoRef,
    onCapture,
    selfie = false,
}: {
    label: string
    hint: string
    step: number
    totalSteps: number
    icon: React.ReactNode
    videoRef: React.RefObject<HTMLVideoElement | null>
    onCapture: () => void
    selfie?: boolean
}) {
    return (
        <div className="flex flex-col gap-3">
            {/* Progress */}
            <div className="flex items-center gap-2 mb-1">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-colors ${i < step ? 'bg-orange-500' : 'bg-muted'}`}
                    />
                ))}
            </div>

            <div className="flex items-center gap-2">
                <span className="text-orange-500">{icon}</span>
                <p className="font-medium text-sm">{label}</p>
                <span className="text-xs text-muted-foreground ml-auto">{step}/{totalSteps}</span>
            </div>

            <div className={`relative rounded-xl overflow-hidden bg-black ${selfie ? 'aspect-[3/4]' : 'aspect-[4/3]'}`}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    className="w-full h-full object-cover"
                    style={selfie ? { transform: 'scaleX(-1)' } : undefined}
                />
                {/* Guia de enquadramento */}
                <div className="absolute inset-4 border-2 border-white/40 rounded-lg pointer-events-none" />
                <div className="absolute inset-0 pointer-events-none">
                    {['top-4 left-4', 'top-4 right-4', 'bottom-4 left-4', 'bottom-4 right-4'].map((pos) => (
                        <div key={pos} className={`absolute ${pos} size-5 border-2 border-white rounded-sm`} />
                    ))}
                </div>
            </div>

            <p className="text-xs text-muted-foreground text-center">{hint}</p>

            <Button onClick={onCapture} size="lg" className="gap-2 w-full bg-orange-500 hover:bg-orange-600 text-white">
                <Camera className="size-5" />
                Capturar
            </Button>
        </div>
    )
}

// ─── Componente resultado ─────────────────────────────────────────────────────

function VerificationResultView({
    result,
    onRetry,
}: {
    result: DocumentVerificationResult
    onRetry: () => void
}) {
    const approved = result.overallStatus === 'aprovado'
    const inconclusive = result.overallStatus === 'inconclusivo'

    return (
        <div className="flex flex-col gap-4">
            <div className={`flex flex-col items-center gap-3 p-6 rounded-xl border text-center ${approved
                ? 'border-green-500/40 bg-green-500/10'
                : inconclusive
                    ? 'border-yellow-500/40 bg-yellow-500/10'
                    : 'border-red-500/40 bg-red-500/10'
                }`}>
                {approved
                    ? <ShieldCheck className="size-12 text-green-600" />
                    : <ShieldX className={`size-12 ${inconclusive ? 'text-yellow-600' : 'text-red-600'}`} />
                }
                <p className={`text-lg font-semibold ${approved ? 'text-green-600' : inconclusive ? 'text-yellow-600' : 'text-red-600'}`}>
                    {approved ? 'Identidade verificada!' : inconclusive ? 'Verificação inconclusiva' : 'Verificação não aprovada'}
                </p>
                <p className="text-sm text-muted-foreground">{result.authenticityReason}</p>
            </div>

            {/* Dados extraídos */}
            {result.extractedData && Object.keys(result.extractedData).some(k => result.extractedData[k as keyof ExtractedDocumentData]) && (
                <div className="rounded-xl border p-4 flex flex-col gap-2">
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Dados extraídos</p>
                    {([
                        ['name', 'Nome'],
                        ['cpf', 'CPF'],
                        ['rg', 'RG'],
                        ['birthDate', 'Nascimento'],
                        ['documentNumber', 'Nº Documento'],
                        ['expiresAt', 'Validade'],
                        ['issuedBy', 'Emitido por'],
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

            {/* Pontuações */}
            <div className="rounded-xl border p-4 flex flex-col gap-2">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide">Pontuações</p>
                <ScoreRow label="Autenticidade do documento" score={result.authenticityScore} status={result.authenticityStatus} />
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
