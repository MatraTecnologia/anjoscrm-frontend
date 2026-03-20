'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type MediaItem = {
    url: string
    type: 'image' | 'video'
    isCover: boolean
}

export type Product = {
    id: string
    enterpriseId: string
    name: string
    description: string | null
    // Preços
    price: number
    priceMin: number | null
    pricePromo: number | null
    promoLabel: string | null
    // Parcelamento
    maxInstallments: number | null
    installmentsNote: string | null
    // Identificação
    sku: string | null
    category: string | null
    unit: string | null
    // Estoque e Logística
    stock: number | null
    warranty: string | null
    deliveryInfo: string | null
    externalUrl: string | null
    // IA
    salesPitch: string | null
    commonObjections: string | null
    // Misc
    tags: string[]
    colors: string[]
    status: string
    media: MediaItem[]
    createdAt: string
    updatedAt: string
}

export type CreateProductPayload = {
    name: string
    description?: string | null
    price?: number
    priceMin?: number | null
    pricePromo?: number | null
    promoLabel?: string | null
    maxInstallments?: number | null
    installmentsNote?: string | null
    sku?: string | null
    category?: string | null
    unit?: string | null
    stock?: number | null
    warranty?: string | null
    deliveryInfo?: string | null
    externalUrl?: string | null
    salesPitch?: string | null
    commonObjections?: string | null
    tags?: string[]
    colors?: string[]
    status?: string
}

export type UpdateProductPayload = Partial<CreateProductPayload>

// ─── API ──────────────────────────────────────────────────────────────────────

async function listProductsFn({
    enterpriseId,
    q,
    category,
    status,
}: {
    enterpriseId: string
    q?: string
    category?: string
    status?: string
}): Promise<Product[]> {
    const params: Record<string, string> = {}
    if (q) params.q = q
    if (category) params.category = category
    if (status) params.status = status

    const { data } = await api.get<Product[]>(`/products/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: Object.keys(params).length ? params : undefined,
    })
    return data
}

async function createProductFn({
    enterpriseId,
    payload,
}: {
    enterpriseId: string
    payload: CreateProductPayload
}): Promise<Product> {
    const { data } = await api.post<Product>(`/products/${enterpriseId}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function getProductFn(id: string): Promise<Product> {
    const { data } = await api.get<Product>(`/products/detail/${id}`)
    return data
}

async function updateProductFn({
    id,
    enterpriseId,
    payload,
}: {
    id: string
    enterpriseId: string
    payload: UpdateProductPayload
}): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}`, payload, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function deleteProductFn({
    id,
    enterpriseId,
}: {
    id: string
    enterpriseId: string
}): Promise<void> {
    await api.delete(`/products/${id}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
}

async function uploadMediaFn({
    id,
    enterpriseId,
    file,
}: {
    id: string
    enterpriseId: string
    file: File
}): Promise<Product> {
    const form = new FormData()
    form.append('file', file)
    const { data } = await api.post<{ product: Product }>(`/products/${id}/media`, form, {
        headers: { 'Content-Type': 'multipart/form-data', 'X-Enterprise-Id': enterpriseId },
    })
    return data.product
}

async function deleteMediaFn({
    id,
    enterpriseId,
    url,
}: {
    id: string
    enterpriseId: string
    url: string
}): Promise<Product> {
    const { data } = await api.delete<Product>(`/products/${id}/media`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        data: { url },
    })
    return data
}

async function setCoverFn({
    id,
    enterpriseId,
    url,
}: {
    id: string
    enterpriseId: string
    url: string
}): Promise<Product> {
    const { data } = await api.patch<Product>(`/products/${id}/cover`, { url }, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

// ─── Reordenação da galeria ───────────────────────────────────────────────────

export async function reorderMedia({
    id,
    enterpriseId,
    urls,
}: {
    id: string
    enterpriseId: string
    urls: string[]
}): Promise<Product> {
    const { data } = await api.patch<Product>(
        `/products/${id}/media/reorder`,
        { urls },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Upload direto ao S3 via presigned URL ────────────────────────────────────

export async function presignMedia({
    id,
    enterpriseId,
    filename,
    contentType,
}: {
    id: string
    enterpriseId: string
    filename: string
    contentType: string
}): Promise<{ uploadUrl: string; publicUrl: string; key: string }> {
    const { data } = await api.post(
        `/products/${id}/media/presign`,
        { filename, contentType },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

export async function registerMedia({
    id,
    enterpriseId,
    url,
    contentType,
}: {
    id: string
    enterpriseId: string
    url: string
    contentType: string
}): Promise<Product> {
    const { data } = await api.post<{ product: Product }>(
        `/products/${id}/media/register`,
        { url, contentType },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data.product
}

/** Upload direto browser → S3 via presigned URL com rastreamento de progresso */
export function uploadFileToS3(
    uploadUrl: string,
    file: File,
    onProgress: (pct: number) => void,
): Promise<void> {
    return new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest()
        xhr.open('PUT', uploadUrl)
        xhr.setRequestHeader('Content-Type', file.type)
        xhr.upload.onprogress = (e) => {
            if (e.lengthComputable) onProgress(Math.round((e.loaded / e.total) * 100))
        }
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) resolve()
            else reject(new Error(`Upload falhou com status ${xhr.status}`))
        }
        xhr.onerror = () => reject(new Error('Erro de rede durante o upload'))
        xhr.send(file)
    })
}

// ─── Import em massa ──────────────────────────────────────────────────────────

export type ImportProductRow = Omit<CreateProductPayload, 'tags' | 'colors'> & {
    tags?: string[]
    colors?: string[]
    imageUrl?: string | null
}

export type ImportResult = {
    created: number
    errors: { row: number; name: string; error: string }[]
}

async function importProductsFn({
    enterpriseId,
    products,
}: {
    enterpriseId: string
    products: ImportProductRow[]
}): Promise<ImportResult> {
    const { data } = await api.post<ImportResult>(
        `/products/${enterpriseId}/import`,
        { products },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

export function useImportProducts() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: importProductsFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.products.all(enterpriseId) })
        },
    })
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useListProducts(
    enterpriseId: string,
    filters?: { q?: string; category?: string; status?: string }
) {
    return useQuery({
        queryKey: [...keys.products.all(enterpriseId), filters],
        queryFn: () => listProductsFn({ enterpriseId, ...filters }),
        enabled: !!enterpriseId,
    })
}

export function useProduct(id: string) {
    return useQuery({
        queryKey: keys.products.detail(id),
        queryFn: () => getProductFn(id),
        enabled: !!id,
    })
}

export function useCreateProduct() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: createProductFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.products.all(enterpriseId) })
        },
    })
}

export function useUpdateProduct() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateProductFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.products.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.products.all(data.enterpriseId) })
        },
    })
}

export function useDeleteProduct() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteProductFn,
        onSuccess: (_, { enterpriseId }) => {
            queryClient.invalidateQueries({ queryKey: keys.products.all(enterpriseId) })
        },
    })
}

export function useUploadMedia() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: uploadMediaFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.products.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.products.all(data.enterpriseId) })
        },
    })
}

export function useDeleteMedia() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteMediaFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.products.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.products.all(data.enterpriseId) })
        },
    })
}

export function useSetCover() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: setCoverFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.products.detail(data.id), data)
            queryClient.invalidateQueries({ queryKey: keys.products.all(data.enterpriseId) })
        },
    })
}

// ─── Scan URL ─────────────────────────────────────────────────────────────────

export type ScannedProduct = {
    name: string
    description?: string | null
    price?: number
    sku?: string | null
    category?: string | null
    imageUrl?: string | null
}

export type ScanUrlResult = {
    products: ScannedProduct[]
    count: number
}

async function scanProductUrlFn({
    enterpriseId,
    url,
    agentId,
}: {
    enterpriseId: string
    url: string
    agentId: string
}): Promise<ScanUrlResult> {
    const { data } = await api.post<ScanUrlResult>(
        `/products/${enterpriseId}/scan-url`,
        { url, agentId },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

export function useScanProductUrl() {
    return useMutation({ mutationFn: scanProductUrlFn })
}
