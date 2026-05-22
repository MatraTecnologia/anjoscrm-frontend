'use client'

import { useState, useCallback } from 'react'
import { Copy, Check, Loader2, Link2, FileText, ChevronRight, RefreshCw } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import {
    useAnalyzeDocument,
    useGenerateVerificationLink,
    type DocumentType,
    type DocumentVerificationResult,
    type ExtractedDocumentData,
} from '@/services/verification'
import { CameraView } from '@/components/camera-view'

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
    const [step, setStep] = useState<Step>('select_doc')
    const [selectedDoc, setSelectedDoc] = useState<DocumentType>('RG')
    const [frontImage, setFrontImage] = useState<string | null>(null)
    const [backImage, setBackImage] = useState<string | null>(null)
    const [result, setResult] = useState<DocumentVerificationResult | null>(null)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const analyzeDocument = useAnalyzeDocument(leadId, enterpriseId)
    const generateLink = useGenerateVerificationLink(leadId, enterpriseId)

    const docHasBack = DOC_OPTIONS.find(d => d.value === selectedDoc)?.hasBack ?? false
    const totalSteps = docHasBack ? 3 : 2

    const reset = useCallback(() => {
        setStep('select_doc')
        setFrontImage(null)
        setBackImage(null)
        setResult(null)
    }, [])

    const handleOpenChange = useCallback((v: boolean) => {
        if (!v) reset()
        onOpenChange(v)
    }, [reset, onOpenChange])

    const handleCaptureFront = useCallback((img: string) => {
        setFrontImage(img)
        const doc = DOC_OPTIONS.find(d => d.value === selectedDoc)
        setStep(doc?.hasBack ? 'camera_back' : 'camera_selfie')
    }, [selectedDoc])

    const handleCaptureBack = useCallback((img: string) => {
        setBackImage(img)
        setStep('camera_selfie')
    }, [])

    const handleCaptureSelfie = useCallback((selfie: string) => {
        setStep('analyzing')
        analyzeDocument.mutate(
            { documentType: selectedDoc, frontImage: frontImage!, backImage: backImage ?? undefined, selfieImage: selfie },
            {
                onSuccess: (res) => { setResult(res); setStep('result') },
                onError: (err: unknown) => {
                    toast.error((err as Error).message ?? 'Erro ao analisar.')
                    setStep('select_doc')
                },
            },
        )
    }, [analyzeDocument, selectedDoc, frontImage, backImage])

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

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Verificação de Identidade</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="document" onValueChange={() => { reset(); setGeneratedLink(null) }}>
                    <TabsList className="w-full">
                        <TabsTrigger value="document" className="flex-1">Câmera</TabsTrigger>
                        <TabsTrigger value="link" className="flex-1">Link para o lead</TabsTrigger>
                    </TabsList>

                    {/* ── Tab câmera ── */}
                    <TabsContent value="document" className="mt-4 flex flex-col gap-4">

                        {step === 'select_doc' && (
                            <div className="flex flex-col gap-3">
                                <p className="text-sm text-muted-foreground">Escolha o tipo de documento do lead.</p>
                                <div className="flex flex-col gap-1.5">
                                    {DOC_OPTIONS.map(doc => (
                                        <button
                                            key={doc.value}
                                            onClick={() => setSelectedDoc(doc.value)}
                                            className={`flex items-center justify-between p-3 rounded-lg border transition-colors text-left ${selectedDoc === doc.value ? 'border-primary bg-primary/5' : 'border-border hover:border-muted-foreground'}`}
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
                                <Button onClick={() => setStep('camera_front')} className="gap-2">
                                    Iniciar verificação
                                </Button>
                            </div>
                        )}

                        {step === 'camera_front' && (
                            <CameraView
                                mode="document"
                                label="Frente do documento"
                                hint="Enquadre a frente — sem reflexos, todo o documento visível"
                                step={1}
                                totalSteps={totalSteps}
                                onCapture={handleCaptureFront}
                                onError={(msg) => toast.error(msg)}
                                aspectRatio="4/3"
                            />
                        )}

                        {step === 'camera_back' && (
                            <CameraView
                                mode="document"
                                label="Verso do documento"
                                hint="Vire o documento e enquadre o verso completamente"
                                step={2}
                                totalSteps={totalSteps}
                                onCapture={handleCaptureBack}
                                onError={(msg) => toast.error(msg)}
                                aspectRatio="4/3"
                            />
                        )}

                        {step === 'camera_selfie' && (
                            <CameraView
                                mode="selfie"
                                label="Selfie"
                                hint="Olhe diretamente para a câmera com rosto bem iluminado"
                                step={totalSteps}
                                totalSteps={totalSteps}
                                onCapture={handleCaptureSelfie}
                                onError={(msg) => toast.error(msg)}
                                aspectRatio="3/4"
                            />
                        )}

                        {step === 'analyzing' && (
                            <div className="flex flex-col items-center gap-3 py-8">
                                <Loader2 className="size-8 animate-spin text-primary" />
                                <p className="text-sm text-muted-foreground">Verificando com IA...</p>
                            </div>
                        )}

                        {step === 'result' && result && (
                            <div className="flex flex-col gap-3">
                                <div className={`flex flex-col items-center gap-2 p-4 rounded-lg border text-center ${result.overallStatus === 'aprovado' ? 'border-green-500/40 bg-green-500/10' : result.overallStatus === 'inconclusivo' ? 'border-yellow-500/40 bg-yellow-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                                    <p className={`text-base font-semibold ${result.overallStatus === 'aprovado' ? 'text-green-600' : result.overallStatus === 'inconclusivo' ? 'text-yellow-600' : 'text-red-600'}`}>
                                        {result.overallStatus === 'aprovado' ? '✓ Identidade verificada' : result.overallStatus === 'inconclusivo' ? '⚠ Inconclusivo' : '✗ Não aprovado'}
                                    </p>
                                    <p className="text-xs text-muted-foreground">{result.authenticityReason}</p>
                                </div>

                                {result.extractedData && Object.values(result.extractedData).some(Boolean) && (
                                    <div className="rounded-lg border p-3 flex flex-col gap-1.5">
                                        <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wide mb-1">Dados do documento</p>
                                        {([
                                            ['name', 'Nome'], ['cpf', 'CPF'], ['rg', 'RG'],
                                            ['birthDate', 'Nascimento'], ['documentNumber', 'Nº Documento'], ['expiresAt', 'Validade'],
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
                    </TabsContent>

                    {/* ── Tab link ── */}
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
