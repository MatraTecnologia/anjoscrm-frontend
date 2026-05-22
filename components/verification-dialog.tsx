'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Copy, Check, RefreshCw, Loader2, Link2, FileText, FlipHorizontal, User, ChevronRight } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalyzeDocument, useGenerateVerificationLink, type DocumentType, type DocumentVerificationResult, type ExtractedDocumentData } from '@/services/verification'

type Props = {
    leadId: string
    enterpriseId: string
    open: boolean
    onOpenChange: (v: boolean) => void
}

type Step = 'select_doc' | 'camera_front' | 'camera_back' | 'camera_selfie' | 'analyzing' | 'result'

const DOC_OPTIONS: { value: DocumentType; label: string; hasBack: boolean }[] = [
    { value: 'RG', label: 'RG', hasBack: true },
    { value: 'CNH', label: 'CNH', hasBack: true },
    { value: 'PASSAPORTE', label: 'Passaporte', hasBack: false },
    { value: 'RNE', label: 'RNE / CIN', hasBack: true },
]

export function VerificationDialog({ leadId, enterpriseId, open, onOpenChange }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [step, setStep] = useState<Step>('select_doc')
    const [selectedDoc, setSelectedDoc] = useState<DocumentType>('RG')
    const [frontImage, setFrontImage] = useState<string | null>(null)
    const [backImage, setBackImage] = useState<string | null>(null)
    const [result, setResult] = useState<DocumentVerificationResult | null>(null)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const analyzeDocument = useAnalyzeDocument(leadId, enterpriseId)
    const generateLink = useGenerateVerificationLink(leadId, enterpriseId)

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
    }, [])

    const startCamera = useCallback(async (nextStep: 'camera_front' | 'camera_back' | 'camera_selfie') => {
        try {
            stopCamera()
            const facingMode = nextStep === 'camera_selfie' ? 'user' : 'environment'
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode } })
            streamRef.current = stream
            setStep(nextStep)
        } catch {
            toast.error('Não foi possível acessar a câmera.')
        }
    }, [stopCamera])

    useEffect(() => {
        const cameraSteps: Step[] = ['camera_front', 'camera_back', 'camera_selfie']
        if (cameraSteps.includes(step) && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [step])

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
        startCamera(doc?.hasBack ? 'camera_back' : 'camera_selfie')
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
        stopCamera()
        setStep('analyzing')

        analyzeDocument.mutate(
            { documentType: selectedDoc, frontImage: frontImage!, backImage: backImage ?? undefined, selfieImage: img },
            {
                onSuccess: (res) => { setResult(res); setStep('result') },
                onError: (err: unknown) => {
                    const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error ?? 'Erro ao analisar.'
                    toast.error(msg)
                    setStep('select_doc')
                },
            },
        )
    }, [capture, stopCamera, analyzeDocument, selectedDoc, frontImage, backImage])

    const reset = useCallback(() => {
        stopCamera()
        setStep('select_doc')
        setFrontImage(null)
        setBackImage(null)
        setResult(null)
    }, [stopCamera])

    const handleOpenChange = useCallback((v: boolean) => {
        if (!v) reset()
        onOpenChange(v)
    }, [reset, onOpenChange])

    const handleGenerateLink = useCallback(() => {
        generateLink.mutate(undefined, {
            onSuccess: (res) => setGeneratedLink(res.url),
            onError: () => toast.error('Erro ao gerar link.'),
        })
    }, [generateLink])

    const copyLink = useCallback(() => {
        if (!generatedLink) return
        navigator.clipboard.writeText(generatedLink).then(() => {
            setCopied(true)
            setTimeout(() => setCopied(false), 2000)
        })
    }, [generatedLink])

    const docHasBack = DOC_OPTIONS.find(d => d.value === selectedDoc)?.hasBack ?? false
    const totalSteps = docHasBack ? 3 : 2
    const currentStep = step === 'camera_front' ? 1 : step === 'camera_back' ? 2 : step === 'camera_selfie' ? totalSteps : 0

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Verificação de Identidade</DialogTitle>
                </DialogHeader>

                <Tabs
                    defaultValue="document"
                    onValueChange={() => { reset(); setGeneratedLink(null) }}
                >
                    <TabsList className="w-full">
                        <TabsTrigger value="document" className="flex-1">Câmera</TabsTrigger>
                        <TabsTrigger value="link" className="flex-1">Link para o lead</TabsTrigger>
                    </TabsList>

                    {/* Tab documento + selfie */}
                    <TabsContent value="document" className="mt-4 flex flex-col gap-4">

                        {/* Seleção de documento */}
                        {step === 'select_doc' && (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm text-muted-foreground">Escolha o tipo de documento do lead.</p>
                                <div className="flex flex-col gap-1.5">
                                    {DOC_OPTIONS.map(doc => (
                                        <button
                                            key={doc.value}
                                            onClick={() => setSelectedDoc(doc.value)}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${selectedDoc === doc.value
                                                ? 'border-primary bg-primary/5'
                                                : 'border-border hover:border-muted-foreground'
                                                }`}
                                        >
                                            <div className="flex items-center gap-2.5">
                                                <FileText className={`size-4 ${selectedDoc === doc.value ? 'text-primary' : 'text-muted-foreground'}`} />
                                                <div>
                                                    <p className="text-sm font-medium">{doc.label}</p>
                                                    <p className="text-xs text-muted-foreground">{doc.hasBack ? 'Frente e verso' : 'Apenas frente'}</p>
                                                </div>
                                            </div>
                                            {selectedDoc === doc.value && <ChevronRight className="size-4 text-primary" />}
                                        </button>
                                    ))}
                                </div>
                                <Button onClick={() => startCamera('camera_front')} className="gap-2">
                                    <Camera className="size-4" />
                                    Iniciar verificação
                                </Button>
                            </div>
                        )}

                        {/* Câmeras */}
                        {(step === 'camera_front' || step === 'camera_back' || step === 'camera_selfie') && (
                            <div className="flex flex-col gap-3">
                                {/* Barra de progresso */}
                                <div className="flex gap-1.5">
                                    {Array.from({ length: totalSteps }).map((_, i) => (
                                        <div key={i} className={`h-1 flex-1 rounded-full ${i < currentStep ? 'bg-primary' : 'bg-muted'}`} />
                                    ))}
                                </div>

                                <div className="flex items-center gap-2">
                                    {step === 'camera_front' && <><FileText className="size-4 text-primary" /><span className="text-sm font-medium">Frente do documento</span></>}
                                    {step === 'camera_back' && <><FlipHorizontal className="size-4 text-primary" /><span className="text-sm font-medium">Verso do documento</span></>}
                                    {step === 'camera_selfie' && <><User className="size-4 text-primary" /><span className="text-sm font-medium">Selfie</span></>}
                                    <span className="text-xs text-muted-foreground ml-auto">{currentStep}/{totalSteps}</span>
                                </div>

                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                    <video
                                        ref={videoRef}
                                        autoPlay
                                        playsInline
                                        className="w-full h-full object-cover"
                                        style={step === 'camera_selfie' ? { transform: 'scaleX(-1)' } : undefined}
                                    />
                                    <div className="absolute inset-3 border border-white/30 rounded pointer-events-none" />
                                </div>

                                <p className="text-xs text-muted-foreground text-center">
                                    {step === 'camera_front' && 'Enquadre a frente do documento — garanta boa iluminação e sem reflexos'}
                                    {step === 'camera_back' && 'Vire o documento e enquadre o verso'}
                                    {step === 'camera_selfie' && 'Olhe diretamente para a câmera com rosto bem iluminado'}
                                </p>

                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={reset} className="flex-shrink-0">
                                        Cancelar
                                    </Button>
                                    <Button
                                        className="flex-1 gap-2"
                                        onClick={step === 'camera_front' ? handleCaptureFront : step === 'camera_back' ? handleCaptureBack : handleCaptureSelfie}
                                    >
                                        <Camera className="size-4" />
                                        Capturar
                                    </Button>
                                </div>
                            </div>
                        )}

                        {/* Analisando */}
                        {step === 'analyzing' && (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Verificando documentos com IA...</p>
                            </div>
                        )}

                        {/* Resultado */}
                        {step === 'result' && result && (
                            <div className="flex flex-col gap-3">
                                <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center ${result.overallStatus === 'aprovado'
                                    ? 'border-green-500/40 bg-green-500/10'
                                    : result.overallStatus === 'inconclusivo'
                                        ? 'border-yellow-500/40 bg-yellow-500/10'
                                        : 'border-red-500/40 bg-red-500/10'
                                    }`}>
                                    <p className={`text-base font-semibold ${result.overallStatus === 'aprovado' ? 'text-green-600' : result.overallStatus === 'inconclusivo' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {result.overallStatus === 'aprovado' ? '✓ Identidade verificada' : result.overallStatus === 'inconclusivo' ? '⚠ Inconclusivo' : '✗ Não aprovado'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{result.authenticityReason}</p>
                                </div>

                                {/* Dados extraídos */}
                                {result.extractedData && Object.values(result.extractedData).some(Boolean) && (
                                    <div className="rounded-lg border p-3 flex flex-col gap-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Dados do documento</p>
                                        {([
                                            ['name', 'Nome'],
                                            ['cpf', 'CPF'],
                                            ['rg', 'RG'],
                                            ['birthDate', 'Nascimento'],
                                            ['documentNumber', 'Nº Documento'],
                                            ['expiresAt', 'Validade'],
                                        ] as [keyof ExtractedDocumentData, string][]).map(([key, label]) => {
                                            const val = result.extractedData[key]
                                            if (!val) return null
                                            return (
                                                <div key={key} className="flex justify-between gap-2">
                                                    <span className="text-xs text-muted-foreground">{label}</span>
                                                    <span className="text-xs font-medium">{val}</span>
                                                </div>
                                            )
                                        })}
                                    </div>
                                )}

                                {/* Pontuações */}
                                <div className="rounded-lg border p-3 flex flex-col gap-1.5">
                                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Pontuações</p>
                                    <ScoreRow label="Autenticidade" score={result.authenticityScore} status={result.authenticityStatus} />
                                    {result.faceMatchScore != null && (
                                        <ScoreRow label="Correspondência facial" score={result.faceMatchScore} status={result.faceMatchStatus!} />
                                    )}
                                </div>

                                <Button variant="outline" size="sm" onClick={reset} className="gap-1.5">
                                    <RefreshCw className="size-3.5" />
                                    Nova verificação
                                </Button>
                            </div>
                        )}

                        <canvas ref={canvasRef} className="hidden" />
                    </TabsContent>

                    {/* Tab link */}
                    <TabsContent value="link" className="mt-4 flex flex-col gap-4">
                        <div className="flex flex-col items-center gap-4 py-4">
                            <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                                <Link2 className="size-8 text-muted-foreground" />
                            </div>
                            <p className="text-sm text-muted-foreground text-center">
                                Gere um link único para o lead realizar a verificação pelo próprio celular. Válido por 24 horas.
                            </p>

                            {generatedLink ? (
                                <div className="w-full flex flex-col gap-2">
                                    <div className="flex gap-2 items-center p-3 rounded-lg border bg-muted/30 break-all">
                                        <p className="text-xs text-muted-foreground flex-1 min-w-0">{generatedLink}</p>
                                        <button onClick={copyLink} className="shrink-0 flex size-7 items-center justify-center rounded border border-border hover:bg-muted transition-colors">
                                            {copied ? <Check className="size-3.5 text-green-500" /> : <Copy className="size-3.5 text-muted-foreground" />}
                                        </button>
                                    </div>
                                    <Button variant="outline" size="sm" onClick={handleGenerateLink} disabled={generateLink.isPending} className="gap-1.5">
                                        {generateLink.isPending && <Loader2 className="size-3.5 animate-spin" />}
                                        Gerar novo link
                                    </Button>
                                </div>
                            ) : (
                                <Button onClick={handleGenerateLink} disabled={generateLink.isPending} className="gap-1.5">
                                    {generateLink.isPending && <Loader2 className="size-3.5 animate-spin" />}
                                    Gerar link de verificação
                                </Button>
                            )}
                        </div>
                    </TabsContent>
                </Tabs>
            </DialogContent>
        </Dialog>
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
