'use client'

import { useRef, useState, useCallback, useEffect } from 'react'
import { Camera, FlipHorizontal, Sun, ZoomIn, CheckCircle2, AlertCircle, Scan } from 'lucide-react'
import { Button } from '@/components/ui/button'

export type CameraMode = 'document' | 'selfie'

export type DetectionStatus =
    | 'idle'
    | 'too_dark'
    | 'too_bright'
    | 'blurry'
    | 'no_face'
    | 'face_detected'
    | 'doc_detected'
    | 'ready'

type Props = {
    mode: CameraMode
    label: string
    hint: string
    step: number
    totalSteps: number
    onCapture: (dataUrl: string) => void
    onError?: (msg: string) => void
    aspectRatio?: '4/3' | '3/4' | '16/9'
}

declare class FaceDetector {
    constructor(opts?: { fastMode?: boolean; maxDetectedFaces?: number })
    detect(image: CanvasImageSource): Promise<{ boundingBox: DOMRectReadOnly }[]>
}

export function CameraView({ mode, label, hint, step, totalSteps, onCapture, onError, aspectRatio = '4/3' }: Props) {
    const videoRef = useRef<HTMLVideoElement>(null)
    const canvasRef = useRef<HTMLCanvasElement>(null)
    const overlayCanvasRef = useRef<HTMLCanvasElement>(null)
    const streamRef = useRef<MediaStream | null>(null)
    const rafRef = useRef<number>(0)
    const faceDetectorRef = useRef<FaceDetector | null>(null)

    const [facing, setFacing] = useState<'user' | 'environment'>(
        mode === 'selfie' ? 'user' : 'environment',
    )
    const [status, setStatus] = useState<DetectionStatus>('idle')
    const [ready, setReady] = useState(false)

    // Inicializa FaceDetector se disponível
    useEffect(() => {
        if (mode === 'selfie' && typeof FaceDetector !== 'undefined') {
            try {
                faceDetectorRef.current = new FaceDetector({ fastMode: true, maxDetectedFaces: 1 })
            } catch { /* não suportado */ }
        }
    }, [mode])

    const stopCamera = useCallback(() => {
        cancelAnimationFrame(rafRef.current)
        streamRef.current?.getTracks().forEach(t => t.stop())
        streamRef.current = null
        setReady(false)
        setStatus('idle')
    }, [])

    const startCamera = useCallback(async (facingMode: 'user' | 'environment') => {
        stopCamera()
        try {
            const stream = await navigator.mediaDevices.getUserMedia({
                video: {
                    facingMode,
                    width: { ideal: 1280 },
                    height: { ideal: 720 },
                },
            })
            streamRef.current = stream

            const video = videoRef.current
            if (!video) return
            video.srcObject = null
            video.srcObject = stream
            await video.play().catch(() => { })
            setReady(true)
        } catch {
            onError?.('Não foi possível acessar a câmera. Verifique as permissões.')
        }
    }, [stopCamera, onError])

    // Inicia câmera na montagem
    useEffect(() => {
        startCamera(facing)
        return () => stopCamera()
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [])

    // Loop de análise em tempo real
    useEffect(() => {
        if (!ready) return

        let lastFaceCheck = 0

        async function analyze() {
            const video = videoRef.current
            const canvas = canvasRef.current
            if (!video || !canvas || video.readyState < 2) {
                rafRef.current = requestAnimationFrame(analyze)
                return
            }

            const w = video.videoWidth
            const h = video.videoHeight
            if (!w || !h) {
                rafRef.current = requestAnimationFrame(analyze)
                return
            }

            canvas.width = w
            canvas.height = h
            const ctx = canvas.getContext('2d')!
            ctx.drawImage(video, 0, 0, w, h)

            const imageData = ctx.getImageData(0, 0, w, h)
            const { brightness, variance } = analyzePixels(imageData)

            if (brightness < 40) { setStatus('too_dark'); rafRef.current = requestAnimationFrame(analyze); return }
            if (brightness > 220) { setStatus('too_bright'); rafRef.current = requestAnimationFrame(analyze); return }
            if (variance < 20) { setStatus('blurry'); rafRef.current = requestAnimationFrame(analyze); return }

            if (mode === 'selfie') {
                const now = Date.now()
                if (faceDetectorRef.current && now - lastFaceCheck > 400) {
                    lastFaceCheck = now
                    try {
                        const faces = await faceDetectorRef.current.detect(canvas)
                        if (faces.length === 0) {
                            setStatus('no_face')
                        } else {
                            setStatus('face_detected')
                            drawFaceGuide(overlayCanvasRef.current, faces[0].boundingBox, w, h)
                        }
                    } catch {
                        setStatus('face_detected') // fallback: assume ok
                    }
                } else if (!faceDetectorRef.current) {
                    setStatus('face_detected')
                }
            } else {
                setStatus('doc_detected')
            }

            rafRef.current = requestAnimationFrame(analyze)
        }

        rafRef.current = requestAnimationFrame(analyze)
        return () => cancelAnimationFrame(rafRef.current)
    }, [ready, mode])

    const handleFlip = useCallback(() => {
        const next = facing === 'user' ? 'environment' : 'user'
        setFacing(next)
        startCamera(next)
    }, [facing, startCamera])

    const handleCapture = useCallback(() => {
        const video = videoRef.current
        const canvas = canvasRef.current
        if (!video || !canvas) return

        // Reduz para no máximo 800px de largura para não estourar o payload
        const MAX_W = 800
        const scale = Math.min(1, MAX_W / video.videoWidth)
        canvas.width = Math.round(video.videoWidth * scale)
        canvas.height = Math.round(video.videoHeight * scale)

        const ctx = canvas.getContext('2d')!
        if (facing === 'user') {
            ctx.translate(canvas.width, 0)
            ctx.scale(-1, 1)
        }
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height)
        const dataUrl = canvas.toDataURL('image/jpeg', 0.82)
        stopCamera()
        onCapture(dataUrl)
    }, [facing, stopCamera, onCapture])

    const statusInfo = getStatusInfo(status, mode)
    const canCapture = status === 'face_detected' || status === 'doc_detected'

    return (
        <div className="flex flex-col gap-3">
            {/* Progress bar */}
            <div className="flex gap-1.5">
                {Array.from({ length: totalSteps }).map((_, i) => (
                    <div
                        key={i}
                        className={`h-1 flex-1 rounded-full transition-all ${i < step ? 'bg-primary' : 'bg-muted'}`}
                    />
                ))}
            </div>

            <div className="flex items-center justify-between">
                <p className="text-sm font-medium">{label}</p>
                <span className="text-xs text-muted-foreground">{step}/{totalSteps}</span>
            </div>

            {/* Viewfinder */}
            <div className={`relative rounded-xl overflow-hidden bg-black`} style={{ aspectRatio: aspectRatio.replace('/', '/') }}>
                <video
                    ref={videoRef}
                    autoPlay
                    playsInline
                    muted
                    className="w-full h-full object-cover"
                    style={facing === 'user' ? { transform: 'scaleX(-1)' } : undefined}
                />

                {/* Canvas overlay para face guide */}
                <canvas
                    ref={overlayCanvasRef}
                    className="absolute inset-0 w-full h-full pointer-events-none"
                    style={facing === 'user' ? { transform: 'scaleX(-1)' } : undefined}
                />

                {/* Corner guides */}
                <CornerGuides detected={canCapture} />

                {/* Status badge */}
                {ready && (
                    <div className={`absolute top-3 left-1/2 -translate-x-1/2 flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium backdrop-blur-sm transition-all ${statusInfo.bg}`}>
                        <statusInfo.Icon className={`size-3.5 ${statusInfo.color} ${statusInfo.spin ? 'animate-spin' : ''}`} />
                        <span className={statusInfo.color}>{statusInfo.text}</span>
                    </div>
                )}

                {/* Flip button */}
                <button
                    onClick={handleFlip}
                    className="absolute bottom-3 right-3 flex size-9 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm text-white hover:bg-black/70 transition-colors"
                >
                    <FlipHorizontal className="size-4" />
                </button>

                {!ready && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black/60">
                        <div className="size-8 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    </div>
                )}
            </div>

            <p className="text-xs text-muted-foreground text-center">{hint}</p>

            <Button
                onClick={handleCapture}
                disabled={!ready}
                className={`gap-2 transition-all ${canCapture ? 'bg-green-600 hover:bg-green-700 text-white' : ''}`}
                size="lg"
            >
                <Camera className="size-4" />
                {canCapture ? 'Capturar' : 'Aguardando...'}
            </Button>
        </div>
    )
}

// ─── Corner guides ────────────────────────────────────────────────────────────

function CornerGuides({ detected }: { detected: boolean }) {
    const color = detected ? 'border-green-400' : 'border-white/60'
    const corners = [
        'top-3 left-3 border-t-2 border-l-2',
        'top-3 right-3 border-t-2 border-r-2',
        'bottom-3 left-3 border-b-2 border-l-2',
        'bottom-3 right-3 border-b-2 border-r-2',
    ]
    return (
        <>
            {corners.map((pos, i) => (
                <div key={i} className={`absolute ${pos} size-6 rounded-sm ${color} transition-colors pointer-events-none`} />
            ))}
        </>
    )
}

// ─── Pixel analysis ───────────────────────────────────────────────────────────

function analyzePixels(imageData: ImageData): { brightness: number; variance: number } {
    const data = imageData.data
    const step = 16
    let sum = 0
    let count = 0
    const samples: number[] = []

    for (let i = 0; i < data.length; i += step * 4) {
        const r = data[i], g = data[i + 1], b = data[i + 2]
        const lum = 0.299 * r + 0.587 * g + 0.114 * b
        sum += lum
        samples.push(lum)
        count++
    }

    const brightness = sum / count
    const mean = brightness
    const variance = samples.reduce((acc, v) => acc + Math.abs(v - mean), 0) / count

    return { brightness, variance }
}

// ─── Face guide overlay ───────────────────────────────────────────────────────

function drawFaceGuide(
    canvas: HTMLCanvasElement | null,
    box: DOMRectReadOnly,
    vw: number,
    vh: number,
) {
    if (!canvas) return
    canvas.width = vw
    canvas.height = vh
    const ctx = canvas.getContext('2d')!
    ctx.clearRect(0, 0, vw, vh)

    const pad = 20
    const x = box.x - pad
    const y = box.y - pad
    const w = box.width + pad * 2
    const h = box.height + pad * 2

    ctx.strokeStyle = 'rgba(34,197,94,0.8)'
    ctx.lineWidth = 2
    ctx.setLineDash([6, 3])
    ctx.strokeRect(x, y, w, h)
}

// ─── Status info ──────────────────────────────────────────────────────────────

function getStatusInfo(status: DetectionStatus, mode: CameraMode) {
    switch (status) {
        case 'too_dark':
            return { text: 'Muito escuro — melhore a iluminação', color: 'text-yellow-300', bg: 'bg-black/60', Icon: Sun, spin: false }
        case 'too_bright':
            return { text: 'Muito claro — evite reflexos', color: 'text-yellow-300', bg: 'bg-black/60', Icon: Sun, spin: false }
        case 'blurry':
            return { text: 'Imagem borrada — segure firme', color: 'text-yellow-300', bg: 'bg-black/60', Icon: ZoomIn, spin: false }
        case 'no_face':
            return { text: 'Nenhum rosto detectado', color: 'text-red-300', bg: 'bg-black/60', Icon: AlertCircle, spin: false }
        case 'face_detected':
            return { text: 'Rosto detectado ✓', color: 'text-green-300', bg: 'bg-black/60', Icon: CheckCircle2, spin: false }
        case 'doc_detected':
            return { text: mode === 'document' ? 'Documento detectado ✓' : 'Pronto', color: 'text-green-300', bg: 'bg-black/60', Icon: CheckCircle2, spin: false }
        default:
            return { text: 'Analisando...', color: 'text-white/70', bg: 'bg-black/40', Icon: Scan, spin: true }
    }
}
