'use client'

import { useState, useCallback } from 'react'
import Cropper from 'react-easy-crop'
import { toast } from 'sonner'
import { Upload, Loader2, Check } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { getCroppedImg, type Area } from '@/lib/crop-image'
import { useUploadAvatar } from '@/services/enterprises'
import { cn } from '@/lib/utils'

interface AvatarUploadProps {
    onSuccess?: (imageUrl: string) => void
    onSkip?: () => void
    currentImage?: string | null
}

export function AvatarUpload({ onSuccess, onSkip, currentImage }: AvatarUploadProps) {
    const [imageSrc, setImageSrc] = useState<string | null>(null)
    const [crop, setCrop] = useState({ x: 0, y: 0 })
    const [zoom, setZoom] = useState(1)
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null)
    const [uploaded, setUploaded] = useState(false)
    const [uploadedUrl, setUploadedUrl] = useState<string | null>(currentImage ?? null)

    const { mutate: upload, isPending } = useUploadAvatar()

    function openFilePicker() {
        const input = document.createElement('input')
        input.type = 'file'
        input.accept = 'image/*'
        input.onchange = (e) => {
            const file = (e.target as HTMLInputElement).files?.[0]
            if (!file) return
            const reader = new FileReader()
            reader.onload = () => setImageSrc(reader.result as string)
            reader.readAsDataURL(file)
        }
        input.click()
    }

    const onCropComplete = useCallback((_: Area, pixels: Area) => {
        setCroppedAreaPixels(pixels)
    }, [])

    async function handleSave() {
        if (!imageSrc || !croppedAreaPixels) return
        try {
            const file = await getCroppedImg(imageSrc, croppedAreaPixels)
            upload(file, {
                onSuccess: ({ imageUrl }) => {
                    setUploadedUrl(imageUrl)
                    setUploaded(true)
                    setImageSrc(null)
                    toast.success('Foto salva!')
                    onSuccess?.(imageUrl)
                },
                onError: (err: Error) => toast.error(err.message),
            })
        } catch {
            toast.error('Erro ao processar imagem.')
        }
    }

    // ── Crop view ──────────────────────────────────────────────────────────────
    if (imageSrc) {
        return (
            <div className="flex flex-col gap-6 w-full max-w-sm">
                <div>
                    <h2 className="text-xl font-semibold tracking-tight">Ajuste sua foto</h2>
                    <p className="text-sm text-muted-foreground mt-1">Arraste e use o zoom para enquadrar.</p>
                </div>

                <div className="relative w-full rounded-xl overflow-hidden bg-muted" style={{ height: 280 }}>
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={setCrop}
                        onZoomChange={setZoom}
                        onCropComplete={onCropComplete}
                    />
                </div>

                <div className="flex flex-col gap-2">
                    <label className="text-xs text-muted-foreground">Zoom</label>
                    <input
                        type="range"
                        min={1}
                        max={3}
                        step={0.05}
                        value={zoom}
                        onChange={(e) => setZoom(Number(e.target.value))}
                        className="w-full accent-primary"
                    />
                </div>

                <div className="flex gap-3">
                    <Button variant="outline" className="flex-1" onClick={() => setImageSrc(null)}>
                        Cancelar
                    </Button>
                    <Button className="flex-1" onClick={handleSave} disabled={isPending}>
                        {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar foto'}
                    </Button>
                </div>
            </div>
        )
    }

    // ── Preview / pick view ───────────────────────────────────────────────────
    return (
        <div className="flex flex-col gap-6 w-full max-w-sm">
            <div>
                <h2 className="text-xl font-semibold tracking-tight">Adicione sua foto</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Uma foto ajuda as pessoas a reconhecerem você. Opcional.
                </p>
            </div>

            <div className="flex flex-col items-center gap-4">
                <button
                    type="button"
                    onClick={openFilePicker}
                    className={cn(
                        'relative size-32 rounded-full border-2 border-dashed border-border',
                        'flex items-center justify-center overflow-hidden',
                        'hover:border-primary transition-colors group',
                        uploaded && 'border-primary',
                    )}
                >
                    {uploadedUrl ? (
                        <>
                            <img src={uploadedUrl} alt="Avatar" className="size-full object-cover" />
                            {uploaded && (
                                <div className="absolute inset-0 bg-black/40 flex items-center justify-center">
                                    <Check className="size-8 text-white" />
                                </div>
                            )}
                        </>
                    ) : (
                        <Upload className="size-7 text-muted-foreground group-hover:text-primary transition-colors" />
                    )}
                </button>

                <Button variant="outline" size="sm" onClick={openFilePicker}>
                    {uploadedUrl ? 'Trocar foto' : 'Escolher foto'}
                </Button>
            </div>

            <div className="flex gap-3 mt-2">
                <Button variant="ghost" className="flex-1 text-muted-foreground" onClick={onSkip}>
                    Pular por enquanto
                </Button>
                {uploaded && (
                    <Button className="flex-1" onClick={() => onSuccess?.(uploadedUrl!)}>
                        Continuar
                    </Button>
                )}
            </div>
        </div>
    )
}
