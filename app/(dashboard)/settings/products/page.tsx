'use client'

import { useRef, useState, useEffect, useCallback } from 'react'
import { useQueryClient } from '@tanstack/react-query'
import { toast } from 'sonner'
import {
    Plus, Search, Pencil, Trash2, Loader2, Star, Upload,
    X, ImageIcon, Video, Package, MoreHorizontal, CheckCircle2, AlertCircle, GripVertical,
} from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { Progress } from '@/components/ui/progress'
import {
    Sheet,
    SheetContent,
    SheetDescription,
    SheetHeader,
    SheetTitle,
} from '@/components/ui/sheet'
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select'
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
    DropdownMenu,
    DropdownMenuContent,
    DropdownMenuItem,
    DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'

import { useEnterprise } from '@/hooks/use-enterprise'
import { keys } from '@/lib/keys'
import {
    useListProducts,
    useCreateProduct,
    useUpdateProduct,
    useDeleteProduct,
    useDeleteMedia,
    useSetCover,
    useProduct,
    presignMedia,
    registerMedia,
    reorderMedia,
    uploadFileToS3,
    type Product,
    type MediaItem,
} from '@/services/products'

// ─── Helpers ──────────────────────────────────────────────────────────────────

function formatPrice(price: number) {
    return price.toLocaleString('pt-BR', { style: 'currency', currency: 'BRL' })
}

function coverOf(product: Product): string | null {
    const cover = product.media.find(m => m.isCover && m.type === 'image')
    if (cover) return cover.url
    const first = product.media.find(m => m.type === 'image')
    return first?.url ?? null
}

// ─── Tag input (cores e tags) ─────────────────────────────────────────────────

function TagChipInput({
    label,
    placeholder,
    values,
    onChange,
    colorMode,
}: {
    label: string
    placeholder: string
    values: string[]
    onChange: (v: string[]) => void
    colorMode?: boolean
}) {
    const [draft, setDraft] = useState('')

    function add() {
        const trimmed = draft.trim()
        if (!trimmed || values.includes(trimmed)) { setDraft(''); return }
        onChange([...values, trimmed])
        setDraft('')
    }

    function remove(v: string) {
        onChange(values.filter(x => x !== v))
    }

    return (
        <div className="flex flex-col gap-1.5">
            <Label>{label}</Label>
            <div className="flex flex-wrap gap-1.5 min-h-9 p-1.5 rounded-md border border-input bg-transparent focus-within:ring-3 focus-within:ring-ring/50 focus-within:border-ring">
                {values.map(v => (
                    <span
                        key={v}
                        className="flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-muted"
                        style={colorMode ? { backgroundColor: v, color: '#fff', textShadow: '0 1px 2px rgba(0,0,0,.4)' } : {}}
                    >
                        {colorMode
                            ? <span className="size-3 rounded-full border border-white/30" style={{ background: v }} />
                            : null
                        }
                        {v}
                        <button type="button" onClick={() => remove(v)} className="opacity-60 hover:opacity-100">
                            <X className="size-2.5" />
                        </button>
                    </span>
                ))}
                <input
                    className="flex-1 min-w-24 bg-transparent text-sm outline-none placeholder:text-muted-foreground px-1"
                    placeholder={placeholder}
                    value={draft}
                    onChange={e => setDraft(e.target.value)}
                    onKeyDown={e => {
                        if (e.key === 'Enter' || e.key === ',') { e.preventDefault(); add() }
                        if (e.key === 'Backspace' && !draft && values.length) remove(values[values.length - 1])
                    }}
                    onBlur={add}
                />
            </div>
            <p className="text-xs text-muted-foreground">
                {colorMode ? 'Digite um código hex (ex: #FF5733) e pressione Enter' : 'Pressione Enter ou vírgula para adicionar'}
            </p>
        </div>
    )
}

// ─── Galeria de mídia ─────────────────────────────────────────────────────────

type UploadEntry = {
    id: string
    name: string
    progress: number   // 0-100
    error?: string
    done?: boolean
}

function MediaGallery({
    product,
    enterpriseId,
}: {
    product: Product
    enterpriseId: string
}) {
    const queryClient = useQueryClient()
    const fileRef = useRef<HTMLInputElement>(null)
    const [isDropZoneDragging, setIsDropZoneDragging] = useState(false)
    const [uploads, setUploads] = useState<UploadEntry[]>([])

    // drag-to-reorder
    const [dragFromIdx, setDragFromIdx] = useState<number | null>(null)
    const [dragOverIdx, setDragOverIdx] = useState<number | null>(null)

    const { mutate: deleteMedia, isPending: isDeleting } = useDeleteMedia()
    const { mutate: setCover, isPending: isSettingCover } = useSetCover()
    const [deletingUrl, setDeletingUrl] = useState<string | null>(null)

    async function uploadOne(file: File) {
        const entryId = crypto.randomUUID()

        setUploads(prev => [...prev, { id: entryId, name: file.name, progress: 0 }])

        try {
            // 1. Obter presigned URL do backend
            const { uploadUrl, publicUrl } = await presignMedia({
                id: product.id,
                enterpriseId,
                filename: file.name,
                contentType: file.type,
            })

            // 2. Upload direto para o S3 com progresso real
            await uploadFileToS3(uploadUrl, file, (pct) => {
                setUploads(prev => prev.map(e => e.id === entryId ? { ...e, progress: pct } : e))
            })

            // 3. Registrar no banco de dados
            const updatedProduct = await registerMedia({
                id: product.id,
                enterpriseId,
                url: publicUrl,
                contentType: file.type,
            })

            // 4. Atualizar cache
            queryClient.setQueryData(keys.products.detail(product.id), updatedProduct)
            queryClient.invalidateQueries({ queryKey: keys.products.all(enterpriseId) })

            // 5. Marcar como concluído e remover após 1.5s
            setUploads(prev => prev.map(e => e.id === entryId ? { ...e, progress: 100, done: true } : e))
            setTimeout(() => setUploads(prev => prev.filter(e => e.id !== entryId)), 1500)

        } catch (err) {
            const msg = err instanceof Error ? err.message : 'Erro ao enviar arquivo'
            setUploads(prev => prev.map(e => e.id === entryId ? { ...e, error: msg } : e))
            toast.error(`Falha ao enviar ${file.name}: ${msg}`)
        }
    }

    function handleFiles(files: FileList | null) {
        if (!files) return
        Array.from(files).forEach(uploadOne)
    }

    // ── Reordenação da galeria ────────────────────────────────────────────────

    async function commitReorder(newMedia: MediaItem[]) {
        // optimistic
        queryClient.setQueryData(keys.products.detail(product.id), { ...product, media: newMedia })
        try {
            const updated = await reorderMedia({
                id: product.id,
                enterpriseId,
                urls: newMedia.map(m => m.url),
            })
            queryClient.setQueryData(keys.products.detail(product.id), updated)
            queryClient.invalidateQueries({ queryKey: keys.products.all(enterpriseId) })
        } catch {
            queryClient.setQueryData(keys.products.detail(product.id), product)
            toast.error('Erro ao salvar a nova ordem')
        }
    }

    function handleItemDragStart(e: React.DragEvent, idx: number) {
        e.stopPropagation()
        e.dataTransfer.effectAllowed = 'move'
        e.dataTransfer.setData('text/plain', String(idx))
        setDragFromIdx(idx)
    }

    function handleItemDragOver(e: React.DragEvent, idx: number) {
        e.preventDefault()
        e.stopPropagation()
        e.dataTransfer.dropEffect = 'move'
        setDragOverIdx(idx)
    }

    function handleItemDrop(e: React.DragEvent, toIdx: number) {
        e.preventDefault()
        e.stopPropagation()
        setDragOverIdx(null)
        if (dragFromIdx === null || dragFromIdx === toIdx) { setDragFromIdx(null); return }
        const reordered = [...product.media]
        const [moved] = reordered.splice(dragFromIdx, 1)
        reordered.splice(toIdx, 0, moved)
        setDragFromIdx(null)
        commitReorder(reordered)
    }

    function handleItemDragEnd() {
        setDragFromIdx(null)
        setDragOverIdx(null)
    }

    // ── Drop zone (arquivos) ──────────────────────────────────────────────────

    function handleDropZoneDrop(e: React.DragEvent) {
        e.preventDefault()
        setIsDropZoneDragging(false)
        // ignora se foi um reorder de item
        if (e.dataTransfer.files.length === 0) return
        handleFiles(e.dataTransfer.files)
    }

    function handleSetCover(url: string) {
        setCover(
            { id: product.id, enterpriseId, url },
            {
                onSuccess: () => toast.success('Foto de capa definida!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    function handleDelete(url: string) {
        deleteMedia(
            { id: product.id, enterpriseId, url },
            {
                onSuccess: () => { setDeletingUrl(null); toast.success('Mídia removida.') },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    const isUploading = uploads.some(u => !u.done && !u.error)

    return (
        <div className="flex flex-col gap-3">
            <Label>Galeria de mídia</Label>

            {/* Grid de itens salvos — drag to reorder */}
            {product.media.length > 0 && (
                <div className="grid grid-cols-3 gap-2">
                    {product.media.map((item, idx) => (
                        <div
                            key={item.url}
                            draggable
                            onDragStart={e => handleItemDragStart(e, idx)}
                            onDragOver={e => handleItemDragOver(e, idx)}
                            onDragLeave={() => setDragOverIdx(null)}
                            onDrop={e => handleItemDrop(e, idx)}
                            onDragEnd={handleItemDragEnd}
                            className={[
                                'relative group aspect-square rounded-lg overflow-hidden border bg-muted transition-all cursor-grab active:cursor-grabbing select-none',
                                dragFromIdx === idx ? 'opacity-40 scale-95' : '',
                                dragOverIdx === idx && dragFromIdx !== idx ? 'ring-2 ring-primary ring-offset-1' : '',
                            ].join(' ')}
                        >
                            {item.type === 'video' ? (
                                <video src={item.url} className="size-full object-cover" muted playsInline />
                            ) : (
                                <img src={item.url} alt="" className="size-full object-cover" draggable={false} />
                            )}

                            {/* Handle de arrastar */}
                            <div className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="size-5 rounded bg-black/50 flex items-center justify-center">
                                    <GripVertical className="size-3 text-white" />
                                </div>
                            </div>

                            {/* Overlay ações */}
                            <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-center gap-1.5 pb-2">
                                {item.type === 'image' && (
                                    <button
                                        type="button"
                                        onClick={() => handleSetCover(item.url)}
                                        disabled={isSettingCover}
                                        title="Definir como capa"
                                        className="size-7 rounded-full bg-white/20 hover:bg-white/40 flex items-center justify-center transition-colors"
                                    >
                                        <Star className={`size-3.5 ${item.isCover ? 'fill-yellow-400 text-yellow-400' : 'text-white'}`} />
                                    </button>
                                )}
                                <button
                                    type="button"
                                    onClick={() => setDeletingUrl(item.url)}
                                    disabled={isDeleting}
                                    title="Remover"
                                    className="size-7 rounded-full bg-white/20 hover:bg-red-500/80 flex items-center justify-center transition-colors"
                                >
                                    <Trash2 className="size-3.5 text-white" />
                                </button>
                            </div>

                            {/* Badges */}
                            {item.isCover && (
                                <div className="absolute top-1 left-1">
                                    <span className="text-[10px] bg-yellow-400 text-yellow-900 font-semibold px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <Star className="size-2.5 fill-yellow-900" /> Capa
                                    </span>
                                </div>
                            )}
                            {item.type === 'video' && (
                                <div className="absolute bottom-1 left-1">
                                    <span className="text-[10px] bg-black/60 text-white font-medium px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                                        <Video className="size-2.5" /> Vídeo
                                    </span>
                                </div>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Fila de uploads em andamento */}
            {uploads.length > 0 && (
                <div className="flex flex-col gap-2">
                    {uploads.map(entry => (
                        <div key={entry.id} className="rounded-lg border bg-muted/40 px-3 py-2.5 flex flex-col gap-1.5">
                            <div className="flex items-center justify-between gap-2">
                                <span className="text-xs text-muted-foreground truncate flex-1">{entry.name}</span>
                                {entry.done && <CheckCircle2 className="size-3.5 text-green-500 shrink-0" />}
                                {entry.error && <AlertCircle className="size-3.5 text-destructive shrink-0" />}
                                {!entry.done && !entry.error && (
                                    <span className="text-[11px] text-muted-foreground shrink-0">{entry.progress}%</span>
                                )}
                            </div>
                            {!entry.done && !entry.error && (
                                <Progress value={entry.progress} className="h-1" />
                            )}
                            {entry.error && (
                                <p className="text-[11px] text-destructive">{entry.error}</p>
                            )}
                        </div>
                    ))}
                </div>
            )}

            {/* Zona de upload / drag & drop */}
            <div
                onDragOver={e => {
                    e.preventDefault()
                    // só ativa se vier arquivo, não reorder de item
                    if (e.dataTransfer.types.includes('Files')) setIsDropZoneDragging(true)
                }}
                onDragLeave={() => setIsDropZoneDragging(false)}
                onDrop={handleDropZoneDrop}
                onClick={() => !isUploading && fileRef.current?.click()}
                className={`flex flex-col items-center justify-center gap-2 border-2 border-dashed rounded-lg py-6 transition-colors cursor-pointer text-muted-foreground
                    ${isDropZoneDragging
                        ? 'border-primary bg-primary/5 text-primary'
                        : 'border-muted-foreground/30 hover:border-primary/50 hover:bg-primary/5'
                    }`}
            >
                <Upload className={`size-5 ${isDropZoneDragging ? 'text-primary' : ''}`} />
                <div className="text-center">
                    <p className="text-xs font-medium">
                        {isDropZoneDragging ? 'Solte para enviar' : 'Clique ou arraste arquivos aqui'}
                    </p>
                    <p className="text-xs opacity-70 mt-0.5">Imagens (JPG, PNG, WEBP) e vídeos (MP4, MOV)</p>
                    <p className="text-xs opacity-50 mt-0.5">Upload direto para AWS S3</p>
                </div>
            </div>
            <input
                ref={fileRef}
                type="file"
                multiple
                accept="image/*,video/*"
                className="hidden"
                onChange={e => handleFiles(e.target.files)}
            />

            {/* Confirm delete */}
            <AlertDialog open={!!deletingUrl} onOpenChange={v => { if (!v) setDeletingUrl(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover mídia?</AlertDialogTitle>
                        <AlertDialogDescription>Esta ação não pode ser desfeita. O arquivo também será removido do armazenamento.</AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={() => deletingUrl && handleDelete(deletingUrl)}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Remover'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}

// ─── Formulário de produto (Sheet) ────────────────────────────────────────────

type FormState = {
    name: string
    description: string
    // Preços
    price: string
    priceMin: string
    pricePromo: string
    promoLabel: string
    // Parcelamento
    maxInstallments: string
    installmentsNote: string
    // Identificação
    sku: string
    category: string
    unit: string
    // Estoque e Logística
    stock: string
    warranty: string
    deliveryInfo: string
    externalUrl: string
    // IA
    salesPitch: string
    commonObjections: string
    // Misc
    tags: string[]
    colors: string[]
    status: string
}

const EMPTY_FORM: FormState = {
    name: '', description: '',
    price: '', priceMin: '', pricePromo: '', promoLabel: '',
    maxInstallments: '', installmentsNote: '',
    sku: '', category: '', unit: '',
    stock: '', warranty: '', deliveryInfo: '', externalUrl: '',
    salesPitch: '', commonObjections: '',
    tags: [], colors: [], status: 'active',
}

function parseNum(v: string): number | null {
    if (!v.trim()) return null
    const n = parseFloat(v.replace(',', '.'))
    return isNaN(n) ? null : n
}

function parseIntField(v: string): number | null {
    if (!v.trim()) return null
    const n = parseInt(v, 10)
    return isNaN(n) ? null : n
}

function productToForm(p: Product): FormState {
    return {
        name: p.name,
        description: p.description ?? '',
        price: p.price > 0 ? String(p.price) : '',
        priceMin: p.priceMin != null ? String(p.priceMin) : '',
        pricePromo: p.pricePromo != null ? String(p.pricePromo) : '',
        promoLabel: p.promoLabel ?? '',
        maxInstallments: p.maxInstallments != null ? String(p.maxInstallments) : '',
        installmentsNote: p.installmentsNote ?? '',
        sku: p.sku ?? '',
        category: p.category ?? '',
        unit: p.unit ?? '',
        stock: p.stock != null ? String(p.stock) : '',
        warranty: p.warranty ?? '',
        deliveryInfo: p.deliveryInfo ?? '',
        externalUrl: p.externalUrl ?? '',
        salesPitch: p.salesPitch ?? '',
        commonObjections: p.commonObjections ?? '',
        tags: p.tags,
        colors: p.colors,
        status: p.status,
    }
}

function ProductSheet({
    open,
    onClose,
    editId,
    editProduct: initialProduct,
    enterpriseId,
}: {
    open: boolean
    onClose: () => void
    editId: string | null
    editProduct?: Product | null
    enterpriseId: string
}) {
    const isEdit = !!editId
    // freshProduct atualiza em background; initialProduct (da lista) é usado imediatamente
    const { data: freshProduct } = useProduct(editId ?? '')
    const product = freshProduct ?? initialProduct ?? undefined

    const { mutate: create, isPending: isCreating } = useCreateProduct()
    const { mutate: update, isPending: isUpdating } = useUpdateProduct()
    const isPending = isCreating || isUpdating

    const [form, setForm] = useState<FormState>(EMPTY_FORM)

    useEffect(() => {
        if (isEdit && product) {
            setForm(productToForm(product))
        } else if (!isEdit) {
            setForm(EMPTY_FORM)
        }
    }, [isEdit, product?.id])

    const set = useCallback(<K extends keyof FormState>(key: K, value: FormState[K]) => {
        setForm(f => ({ ...f, [key]: value }))
    }, [])

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        if (!form.name.trim()) return

        const payload = {
            name: form.name.trim(),
            description: form.description.trim() || null,
            price: parseNum(form.price) ?? 0,
            priceMin: parseNum(form.priceMin),
            pricePromo: parseNum(form.pricePromo),
            promoLabel: form.promoLabel.trim() || null,
            maxInstallments: parseIntField(form.maxInstallments),
            installmentsNote: form.installmentsNote.trim() || null,
            sku: form.sku.trim() || null,
            category: form.category.trim() || null,
            unit: form.unit.trim() || null,
            stock: parseIntField(form.stock),
            warranty: form.warranty.trim() || null,
            deliveryInfo: form.deliveryInfo.trim() || null,
            externalUrl: form.externalUrl.trim() || null,
            salesPitch: form.salesPitch.trim() || null,
            commonObjections: form.commonObjections.trim() || null,
            tags: form.tags,
            colors: form.colors,
            status: form.status,
        }

        if (isEdit && editId) {
            update(
                { id: editId, enterpriseId, payload },
                {
                    onSuccess: () => { toast.success('Produto atualizado!') },
                    onError: (err: Error) => toast.error(err.message),
                }
            )
        } else {
            create(
                { enterpriseId, payload },
                {
                    onSuccess: () => { toast.success('Produto criado!'); onClose() },
                    onError: (err: Error) => toast.error(err.message),
                }
            )
        }
    }

    return (
        <Sheet open={open} onOpenChange={v => { if (!v) onClose() }}>
            <SheetContent className="w-full sm:max-w-2xl flex flex-col gap-0 p-0 overflow-hidden">
                <SheetHeader className="px-6 pt-6 pb-4 border-b shrink-0">
                    <SheetTitle>{isEdit ? 'Editar produto' : 'Novo produto'}</SheetTitle>
                    <SheetDescription>
                        {isEdit ? 'Atualize as informações do produto.' : 'Preencha os dados do novo produto.'}
                    </SheetDescription>
                </SheetHeader>

                <div className="flex-1 overflow-y-auto">
                    <form id="product-form" onSubmit={handleSubmit} className="flex flex-col gap-6 p-6">

                        {/* ── Informações básicas ── */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Informações básicas</h3>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-name">Nome do produto *</Label>
                                <Input
                                    id="p-name"
                                    placeholder="Ex: Sofá 3 lugares"
                                    value={form.name}
                                    onChange={e => set('name', e.target.value)}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-sku">SKU / Identificador</Label>
                                    <Input
                                        id="p-sku"
                                        placeholder="Ex: SOF-001"
                                        value={form.sku}
                                        onChange={e => set('sku', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-cat">Categoria</Label>
                                    <Input
                                        id="p-cat"
                                        placeholder="Ex: Sofás, Eletrônicos..."
                                        value={form.category}
                                        onChange={e => set('category', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-unit">Unidade</Label>
                                    <Input
                                        id="p-unit"
                                        placeholder="Ex: un, cx, kg, m²"
                                        value={form.unit}
                                        onChange={e => set('unit', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label>Status</Label>
                                    <Select value={form.status} onValueChange={v => set('status', v)} disabled={isPending}>
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="active">Ativo</SelectItem>
                                            <SelectItem value="inactive">Inativo</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-desc">Descrição</Label>
                                <Textarea
                                    id="p-desc"
                                    placeholder="Descreva o produto, materiais, dimensões, diferenciais..."
                                    value={form.description}
                                    onChange={e => set('description', e.target.value)}
                                    disabled={isPending}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        {/* ── Preços e Parcelamento ── */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Preços e Parcelamento</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-price">Preço (R$)</Label>
                                    <Input
                                        id="p-price"
                                        placeholder="0,00"
                                        value={form.price}
                                        onChange={e => set('price', e.target.value.replace(/[^\d,.]/, ''))}
                                        disabled={isPending}
                                        inputMode="decimal"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-priceMin">Preço mínimo (R$)</Label>
                                    <Input
                                        id="p-priceMin"
                                        placeholder="Negociação mínima"
                                        value={form.priceMin}
                                        onChange={e => set('priceMin', e.target.value.replace(/[^\d,.]/, ''))}
                                        disabled={isPending}
                                        inputMode="decimal"
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-pricePromo">Preço promocional (R$)</Label>
                                    <Input
                                        id="p-pricePromo"
                                        placeholder="0,00"
                                        value={form.pricePromo}
                                        onChange={e => set('pricePromo', e.target.value.replace(/[^\d,.]/, ''))}
                                        disabled={isPending}
                                        inputMode="decimal"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-promoLabel">Label da promoção</Label>
                                    <Input
                                        id="p-promoLabel"
                                        placeholder="Ex: Black Friday, Oferta"
                                        value={form.promoLabel}
                                        onChange={e => set('promoLabel', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-maxInst">Máx. parcelas</Label>
                                    <Input
                                        id="p-maxInst"
                                        placeholder="Ex: 12"
                                        value={form.maxInstallments}
                                        onChange={e => set('maxInstallments', e.target.value.replace(/\D/, ''))}
                                        disabled={isPending}
                                        inputMode="numeric"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-instNote">Condição de parcelamento</Label>
                                    <Input
                                        id="p-instNote"
                                        placeholder="Ex: Sem juros no cartão"
                                        value={form.installmentsNote}
                                        onChange={e => set('installmentsNote', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>
                        </div>

                        {/* ── Logística e Estoque ── */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Logística e Estoque</h3>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-stock">Estoque disponível</Label>
                                    <Input
                                        id="p-stock"
                                        placeholder="Qtd em estoque"
                                        value={form.stock}
                                        onChange={e => set('stock', e.target.value.replace(/\D/, ''))}
                                        disabled={isPending}
                                        inputMode="numeric"
                                    />
                                </div>
                                <div className="flex flex-col gap-1.5">
                                    <Label htmlFor="p-warranty">Garantia</Label>
                                    <Input
                                        id="p-warranty"
                                        placeholder="Ex: 12 meses, 1 ano"
                                        value={form.warranty}
                                        onChange={e => set('warranty', e.target.value)}
                                        disabled={isPending}
                                    />
                                </div>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-delivery">Informações de entrega</Label>
                                <Input
                                    id="p-delivery"
                                    placeholder="Ex: Frete grátis para SP, entrega em 3-5 dias"
                                    value={form.deliveryInfo}
                                    onChange={e => set('deliveryInfo', e.target.value)}
                                    disabled={isPending}
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-url">Link externo</Label>
                                <Input
                                    id="p-url"
                                    placeholder="https://seusite.com.br/produto"
                                    value={form.externalUrl}
                                    onChange={e => set('externalUrl', e.target.value)}
                                    disabled={isPending}
                                    type="url"
                                />
                            </div>
                        </div>

                        {/* ── Contexto para a IA ── */}
                        <div className="flex flex-col gap-4">
                            <div>
                                <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Contexto para a IA</h3>
                                <p className="text-xs text-muted-foreground mt-0.5">Essas informações serão usadas pelo agente de IA para apresentar e vender o produto com mais eficiência.</p>
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-pitch">Argumento de venda (Pitch)</Label>
                                <Textarea
                                    id="p-pitch"
                                    placeholder="Como apresentar este produto? Quais são os principais benefícios e diferenciais que a IA deve destacar?"
                                    value={form.salesPitch}
                                    onChange={e => set('salesPitch', e.target.value)}
                                    disabled={isPending}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>

                            <div className="flex flex-col gap-1.5">
                                <Label htmlFor="p-objections">Objeções comuns e respostas</Label>
                                <Textarea
                                    id="p-objections"
                                    placeholder="Ex: 'É caro?' → Responder que o produto tem garantia estendida e parcelamento sem juros..."
                                    value={form.commonObjections}
                                    onChange={e => set('commonObjections', e.target.value)}
                                    disabled={isPending}
                                    rows={3}
                                    className="resize-none"
                                />
                            </div>
                        </div>

                        {/* ── Tags e Cores ── */}
                        <div className="flex flex-col gap-4">
                            <h3 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">Tags e Cores</h3>

                            <TagChipInput
                                label="Tags"
                                placeholder="Ex: promoção, destaque..."
                                values={form.tags}
                                onChange={v => set('tags', v)}
                            />

                            <TagChipInput
                                label="Cores disponíveis"
                                placeholder="#FF5733 ou vermelho"
                                values={form.colors}
                                onChange={v => set('colors', v)}
                                colorMode
                            />
                        </div>

                        {/* ── Galeria de mídia ── */}
                        {isEdit && product && (
                            <MediaGallery product={product} enterpriseId={enterpriseId} />
                        )}

                        {!isEdit && (
                            <div className="rounded-lg border border-dashed p-4 flex items-center gap-3 text-muted-foreground text-sm">
                                <ImageIcon className="size-5 shrink-0" />
                                <span>Salve o produto primeiro para adicionar imagens e vídeos.</span>
                            </div>
                        )}
                    </form>
                </div>

                {/* Footer */}
                <div className="shrink-0 border-t px-6 py-4 flex justify-end gap-2">
                    <Button type="button" variant="outline" onClick={onClose} disabled={isPending}>
                        Cancelar
                    </Button>
                    <Button type="submit" form="product-form" disabled={isPending || !form.name.trim()}>
                        {isPending
                            ? <><Loader2 className="size-4 animate-spin" /> {isEdit ? 'Salvando...' : 'Criando...'}</>
                            : isEdit ? 'Salvar alterações' : 'Criar produto'
                        }
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function ProductsPage() {
    const { enterprise } = useEnterprise()
    const [q, setQ] = useState('')
    const [debouncedQ, setDebouncedQ] = useState('')
    const [sheetOpen, setSheetOpen] = useState(false)
    const [editId, setEditId] = useState<string | null>(null)
    const [editProduct, setEditProduct] = useState<Product | null>(null)
    const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

    const { data: products = [], isLoading } = useListProducts(enterprise?.id ?? '', {
        q: debouncedQ || undefined,
    })
    const { mutate: deleteProduct, isPending: isDeleting } = useDeleteProduct()

    // debounce search
    useEffect(() => {
        const t = setTimeout(() => setDebouncedQ(q), 400)
        return () => clearTimeout(t)
    }, [q])

    function openCreate() { setEditId(null); setEditProduct(null); setSheetOpen(true) }
    function openEdit(p: Product) { setEditId(p.id); setEditProduct(p); setSheetOpen(true) }

    function handleDelete() {
        if (!deleteTarget || !enterprise) return
        deleteProduct(
            { id: deleteTarget.id, enterpriseId: enterprise.id },
            {
                onSuccess: () => { toast.success('Produto removido.'); setDeleteTarget(null) },
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    if (!enterprise) {
        return (
            <div className="flex items-center justify-center flex-1 py-20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col p-8 gap-6 max-w-5xl mx-auto w-full">
            {/* Header */}
            <div className="flex items-start justify-between gap-4">
                <div>
                    <h1 className="text-xl font-semibold">Produtos</h1>
                    <p className="text-sm text-muted-foreground mt-0.5">Gerencie seu catálogo de produtos</p>
                </div>
                <Button onClick={openCreate}>
                    <Plus className="size-4" />
                    Criar
                </Button>
            </div>

            {/* Search */}
            <div className="relative w-72">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-4 text-muted-foreground" />
                <Input
                    placeholder="Pesquisar..."
                    value={q}
                    onChange={e => setQ(e.target.value)}
                    className="pl-9"
                />
            </div>

            {/* Count */}
            {!isLoading && (
                <p className="text-sm text-muted-foreground -mt-3">
                    {products.length} resultado{products.length !== 1 ? 's' : ''}
                </p>
            )}

            {/* Table */}
            <div className="rounded-lg border bg-card overflow-hidden">
                {/* Header */}
                <div className="grid grid-cols-[2.5rem_1fr_160px_120px_100px_80px_60px] gap-4 px-4 py-2.5 border-b bg-muted/40 text-xs text-muted-foreground font-medium">
                    <span />
                    <span>Produto</span>
                    <span>Identificador (SKU)</span>
                    <span>Categoria</span>
                    <span>Preço</span>
                    <span>Status</span>
                    <span />
                </div>

                {/* Rows */}
                {isLoading ? (
                    <div className="flex items-center justify-center py-16">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : products.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-16 gap-3 text-muted-foreground">
                        <Package className="size-10 opacity-30" />
                        <p className="text-sm">Nenhum produto encontrado</p>
                        <Button variant="outline" size="sm" onClick={openCreate}>
                            <Plus className="size-4" /> Criar produto
                        </Button>
                    </div>
                ) : (
                    products.map(product => {
                        const thumb = coverOf(product)
                        return (
                            <div
                                key={product.id}
                                className="grid grid-cols-[2.5rem_1fr_160px_120px_100px_80px_60px] gap-4 px-4 py-3 border-b last:border-0 items-center hover:bg-muted/30 transition-colors"
                            >
                                {/* Thumbnail */}
                                <div className="size-9 rounded-md border bg-muted overflow-hidden shrink-0 flex items-center justify-center">
                                    {thumb
                                        ? <img src={thumb} alt={product.name} className="size-full object-cover" />
                                        : <Package className="size-4 text-muted-foreground" />
                                    }
                                </div>

                                {/* Name + tags */}
                                <div className="min-w-0">
                                    <p className="text-sm font-medium truncate">{product.name}</p>
                                    {product.tags.length > 0 && (
                                        <div className="flex gap-1 mt-0.5 flex-wrap">
                                            {product.tags.slice(0, 3).map(t => (
                                                <Badge key={t} variant="secondary" className="text-[10px] py-0 px-1.5">{t}</Badge>
                                            ))}
                                            {product.tags.length > 3 && (
                                                <span className="text-[10px] text-muted-foreground">+{product.tags.length - 3}</span>
                                            )}
                                        </div>
                                    )}
                                </div>

                                {/* SKU */}
                                <p className="text-sm text-muted-foreground truncate">{product.sku ?? '—'}</p>

                                {/* Category */}
                                <p className="text-sm text-muted-foreground truncate">{product.category ?? '—'}</p>

                                {/* Price */}
                                <p className="text-sm font-medium">{formatPrice(product.price)}</p>

                                {/* Status */}
                                <Badge
                                    variant={product.status === 'active' ? 'default' : 'secondary'}
                                    className="text-xs w-fit"
                                >
                                    {product.status === 'active' ? 'Ativo' : 'Inativo'}
                                </Badge>

                                {/* Actions */}
                                <DropdownMenu>
                                    <DropdownMenuTrigger asChild>
                                        <Button variant="ghost" size="icon" className="size-8">
                                            <MoreHorizontal className="size-4" />
                                        </Button>
                                    </DropdownMenuTrigger>
                                    <DropdownMenuContent align="end">
                                        <DropdownMenuItem onClick={() => openEdit(product)}>
                                            <Pencil className="size-4" /> Editar
                                        </DropdownMenuItem>
                                        <DropdownMenuItem
                                            className="text-destructive focus:text-destructive"
                                            onClick={() => setDeleteTarget(product)}
                                        >
                                            <Trash2 className="size-4" /> Remover
                                        </DropdownMenuItem>
                                    </DropdownMenuContent>
                                </DropdownMenu>
                            </div>
                        )
                    })
                )}
            </div>

            {/* Sheet de criação/edição */}
            <ProductSheet
                open={sheetOpen}
                onClose={() => setSheetOpen(false)}
                editId={editId}
                editProduct={editProduct}
                enterpriseId={enterprise.id}
            />

            {/* Confirm delete */}
            <AlertDialog open={!!deleteTarget} onOpenChange={v => { if (!v) setDeleteTarget(null) }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Remover produto?</AlertDialogTitle>
                        <AlertDialogDescription>
                            <strong>{deleteTarget?.name}</strong> será removido permanentemente.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={isDeleting}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                        >
                            {isDeleting ? <Loader2 className="size-4 animate-spin" /> : 'Remover'}
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </div>
    )
}
