'use client'

import { useEffect, useRef, useState, useCallback } from 'react'
import { useParams } from 'next/navigation'
import { Camera, RefreshCw, Loader2, ShieldCheck, ShieldX } from 'lucide-react'
import { fetchTokenInfo, useCompleteVerification } from '@/services/verification'
import type { VerificationResult, VerificationTokenInfo } from '@/services/verification'
import { Button } from '@/components/ui/button'

type PageState = 'loading' | 'error' | 'ready' | 'camera' | 'captured' | 'analyzing' | 'result'

export default function VerificacaoPage() {
    const { token } = useParams<{ token: string }>()

    const [pageState, setPageState] = useState<PageState>('loading')
    const [tokenInfo, setTokenInfo] = useState<VerificationTokenInfo | null>(null)
    const [errorMessage, setErrorMessage] = useState('')
    const [capturedImage, setCapturedImage] = useState<string | null>(null)
    const [result, setResult] = useState<VerificationResult | null>(null)

    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)

    const completeVerification = useCompleteVerification(token)

    useEffect(() => {
        fetchTokenInfo(token)
            .then((info) => { setTokenInfo(info); setPageState('ready') })
            .catch((err) => {
                const msg = err?.response?.data?.error ?? 'Link inválido ou expirado.'
                setErrorMessage(msg)
                setPageState('error')
            })
    }, [token])

    const startCamera = useCallback(async () => {
        try {
            const stream = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'user' } })
            streamRef.current = stream
            if (videoRef.current) videoRef.current.srcObject = stream
            setPageState('camera')
        } catch {
            setErrorMessage('Não foi possível acessar a câmera. Verifique as permissões.')
            setPageState('error')
        }
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
        streamRef.current?.getTracks().forEach(t => t.stop())
        setPageState('captured')
    }, [])

    const sendPhoto = useCallback(() => {
        if (!capturedImage) return
        setPageState('analyzing')
        completeVerification.mutate(capturedImage, {
            onSuccess: (res) => { setResult(res); setPageState('result') },
            onError: (err: any) => {
                const msg = err?.response?.data?.error ?? 'Erro ao analisar imagem.'
                setErrorMessage(msg)
                setPageState('error')
            },
        })
    }, [capturedImage, completeVerification])

    const retry = useCallback(() => {
        setCapturedImage(null)
        setResult(null)
        startCamera()
    }, [startCamera])

    return (
        <div className="min-h-screen bg-background flex flex-col items-center justify-center p-4">
            <div className="w-full max-w-sm flex flex-col gap-6">

                {/* Header */}
                <div className="flex flex-col items-center gap-1 text-center">
                    <div className="size-12 rounded-full bg-orange-500 flex items-center justify-center mb-2">
                        <Camera className="size-6 text-white" />
                    </div>
                    <h1 className="text-xl font-semibold">Verificação de Identidade</h1>
                    {tokenInfo && (
                        <p className="text-sm text-muted-foreground">Olá, <span className="font-medium text-foreground">{tokenInfo.leadName}</span></p>
                    )}
                </div>

                {/* States */}
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

                {pageState === 'ready' && (
                    <div className="flex flex-col items-center gap-4 text-center">
                        <p className="text-sm text-muted-foreground">
                            Tire uma selfie clara, com boa iluminação e seu rosto visível.
                        </p>
                        <Button onClick={startCamera} size="lg" className="gap-2 w-full">
                            <Camera className="size-5" />
                            Abrir câmera
                        </Button>
                    </div>
                )}

                {pageState === 'camera' && (
                    <div className="flex flex-col gap-3">
                        <div className="relative rounded-xl overflow-hidden bg-black aspect-[3/4]">
                            <video ref={videoRef} autoPlay playsInline className="w-full h-full object-cover" />
                            <div className="absolute inset-0 pointer-events-none border-2 border-white/20 rounded-xl" />
                        </div>
                        <Button onClick={capturePhoto} size="lg" className="gap-2 w-full">
                            <Camera className="size-5" />
                            Capturar
                        </Button>
                    </div>
                )}

                {pageState === 'captured' && capturedImage && (
                    <div className="flex flex-col gap-3">
                        <img src={capturedImage} alt="Selfie" className="rounded-xl w-full object-cover" />
                        <div className="flex gap-2">
                            <Button variant="outline" onClick={retry} className="flex-1">Refazer</Button>
                            <Button onClick={sendPhoto} className="flex-1">Enviar</Button>
                        </div>
                    </div>
                )}

                {pageState === 'analyzing' && (
                    <div className="flex flex-col items-center gap-3 py-8">
                        <Loader2 className="size-8 animate-spin text-orange-500" />
                        <p className="text-sm text-muted-foreground">Analisando imagem...</p>
                    </div>
                )}

                {pageState === 'result' && result && (
                    <div className={`flex flex-col items-center gap-4 p-6 rounded-xl border text-center ${result.status === 'aprovado' ? 'border-green-500/40 bg-green-500/10' : 'border-red-500/40 bg-red-500/10'}`}>
                        {result.status === 'aprovado' ? (
                            <ShieldCheck className="size-12 text-green-600" />
                        ) : (
                            <ShieldX className="size-12 text-red-600" />
                        )}
                        <p className={`text-lg font-semibold ${result.status === 'aprovado' ? 'text-green-600' : 'text-red-600'}`}>
                            {result.status === 'aprovado' ? 'Verificado com sucesso!' : 'Verificação não aprovada'}
                        </p>
                        <p className="text-sm text-muted-foreground">{result.message}</p>
                        {result.status === 'reprovado' && (
                            <Button variant="outline" onClick={retry} className="gap-2">
                                <RefreshCw className="size-4" />
                                Tentar novamente
                            </Button>
                        )}
                    </div>
                )}

                <canvas ref={canvasRef} className="hidden" />
            </div>
        </div>
    )
}
