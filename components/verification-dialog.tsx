'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, Copy, Check, RefreshCw, Loader2, Link2 } from 'lucide-react'
import { toast } from 'sonner'

import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { useAnalyzeFace, useGenerateVerificationLink } from '@/services/verification'
import type { VerificationResult } from '@/services/verification'

type Props = {
    leadId: string
    enterpriseId: string
    open: boolean
    onOpenChange: (v: boolean) => void
}

export function VerificationDialog({ leadId, enterpriseId, open, onOpenChange }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const [cameraActive, setCameraActive] = useState(false)
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [result, setResult] = useState<VerificationResult | null>(null)
    const [generatedLink, setGeneratedLink] = useState<string | null>(null)
    const [copied, setCopied] = useState(false)

    const analyzeFace = useAnalyzeFace(leadId, enterpriseId)
    const generateLink = useGenerateVerificationLink(leadId, enterpriseId)

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            setCameraActive(true)
        } catch {
            toast.error('Não foi possível acessar a câmera.')
        }
    }, [])

    useEffect(() => {
        if (cameraActive && videoRef.current && streamRef.current) {
            videoRef.current.srcObject = streamRef.current
        }
    }, [cameraActive])

    const stopCamera = useCallback(() => {
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setCameraActive(false)
    }, [])

    const capturePhoto = useCallback(() => {
        if (!videoRef.current || !canvasRef.current) return
        const video = videoRef.current
        const canvas = canvasRef.current
        canvas.width = video.videoWidth
        canvas.height = video.videoHeight
        canvas.getContext('2d')?.drawImage(video, 0, 0)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.85)
        setCapturedImage(dataUrl)
        stopCamera()
    }, [stopCamera])

    const sendAnalysis = useCallback(() => {
        if (!capturedImage) return
        analyzeFace.mutate(capturedImage, {
            onSuccess: (res) => setResult(res),
            onError: () => toast.error('Erro ao analisar imagem.'),
        })
    }, [capturedImage, analyzeFace])

    const resetCamera = useCallback(() => {
        setCapturedImage(null)
        setResult(null)
        startCamera()
    }, [startCamera])

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

    const handleOpenChange = useCallback((v: boolean) => {
        if (!v) {
            stopCamera()
            setCapturedImage(null)
            setResult(null)
        }
        onOpenChange(v)
    }, [stopCamera, onOpenChange])

    return (
        <Dialog open={open} onOpenChange={handleOpenChange}>
            <DialogContent className="max-w-md">
                <DialogHeader>
                    <DialogTitle>Verificação de Identidade</DialogTitle>
                </DialogHeader>

                <Tabs defaultValue="camera" onValueChange={() => { stopCamera(); setCapturedImage(null); setResult(null) }}>
                    <TabsList className="w-full">
                        <TabsTrigger value="camera" className="flex-1">Câmera</TabsTrigger>
                        <TabsTrigger value="link" className="flex-1">Link para o lead</TabsTrigger>
                    </TabsList>

                    {/* Tab câmera */}
                    <TabsContent value="camera" className="mt-4 flex flex-col gap-4">
                        {result ? (
                            <div className={`flex flex-col items-center gap-3 p-6 rounded-lg border ${result.status === 'aprovado' ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                                <p className={`text-lg font-semibold ${result.status === 'aprovado' ? 'text-green-600' : 'text-red-600'}`}>
                                    {result.status === 'aprovado' ? '✓ Verificado' : '✗ Reprovado'}
                                </p>
                                <p className="text-sm text-muted-foreground text-center">{result.message}</p>
                                {result.score > 0 && (
                                    <p className="text-xs text-muted-foreground">Confiança: {result.score.toFixed(1)}%</p>
                                )}
                                <Button variant="outline" size="sm" onClick={resetCamera} className="gap-1.5">
                                    <RefreshCw className="size-3.5" />
                                    Tentar novamente
                                </Button>
                            </div>
                        ) : capturedImage ? (
                            <div className="flex flex-col gap-3">
                                <img src={capturedImage} alt="Selfie capturada" className="rounded-lg w-full object-cover" />
                                <div className="flex gap-2">
                                    <Button variant="outline" size="sm" onClick={resetCamera} className="flex-1">
                                        Recapturar
                                    </Button>
                                    <Button size="sm" onClick={sendAnalysis} disabled={analyzeFace.isPending} className="flex-1 gap-1.5">
                                        {analyzeFace.isPending && <Loader2 className="size-3.5 animate-spin" />}
                                        Enviar para análise
                                    </Button>
                                </div>
                            </div>
                        ) : cameraActive ? (
                            <div className="flex flex-col gap-3">
                                <div className="relative rounded-lg overflow-hidden bg-black aspect-video">
                                    <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                                </div>
                                <Button onClick={capturePhoto} className="gap-1.5">
                                    <Camera className="size-4" />
                                    Capturar selfie
                                </Button>
                            </div>
                        ) : (
                            <div className="flex flex-col items-center gap-4 py-6">
                                <div className="size-16 rounded-full bg-muted flex items-center justify-center">
                                    <Camera className="size-8 text-muted-foreground" />
                                </div>
                                <p className="text-sm text-muted-foreground text-center">
                                    Ative a câmera para capturar uma selfie do lead e verificar sua identidade.
                                </p>
                                <Button onClick={startCamera} className="gap-1.5">
                                    <Camera className="size-4" />
                                    Ativar câmera
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
