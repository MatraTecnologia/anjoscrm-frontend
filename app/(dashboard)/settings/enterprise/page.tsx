'use client'

import { useRef, useState, useEffect } from 'react'
import { toast } from 'sonner'
import { Loader2, Building2, Upload, Trash2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
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

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useEnterpriseDetail,
    useUpdateEnterprise,
    useUploadLogo,
    type EnterpriseDetail,
} from '@/services/enterprises'

// ─── Máscaras ─────────────────────────────────────────────────────────────────

function maskCEP(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 8)
    return d.length > 5 ? `${d.slice(0, 5)}-${d.slice(5)}` : d
}

function maskCPF(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 11)
    return d
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d{1,2})$/, '$1-$2')
}

function maskCNPJ(v: string) {
    const d = v.replace(/\D/g, '').slice(0, 14)
    return d
        .replace(/(\d{2})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1.$2')
        .replace(/(\d{3})(\d)/, '$1/$2')
        .replace(/(\d{4})(\d{1,2})$/, '$1-$2')
}

// ─── Section wrapper ──────────────────────────────────────────────────────────

function Section({ title, description, children }: {
    title: string
    description?: string
    children: React.ReactNode
}) {
    return (
        <div className="rounded-lg border bg-card p-6 flex flex-col gap-5">
            <div>
                <h2 className="text-sm font-semibold">{title}</h2>
                {description && (
                    <p className="text-xs text-muted-foreground mt-0.5">{description}</p>
                )}
            </div>
            {children}
        </div>
    )
}

// ─── Informações ──────────────────────────────────────────────────────────────

function InfoSection({ ent }: { ent: EnterpriseDetail }) {
    const [form, setForm] = useState({
        name: ent.name ?? '',
        email: ent.email ?? '',
        niche: ent.niche ?? '',
        phone: ent.phone ?? '',
    })

    useEffect(() => {
        setForm({
            name: ent.name ?? '',
            email: ent.email ?? '',
            niche: ent.niche ?? '',
            phone: ent.phone ?? '',
        })
    }, [ent.id])

    const { mutate: update, isPending } = useUpdateEnterprise()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        update(
            { id: ent.id, payload: { name: form.name, email: form.email || null, niche: form.niche || null, phone: form.phone || null } },
            {
                onSuccess: () => toast.success('Informações salvas!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    return (
        <Section title="Informações" description="Dados básicos da sua empresa">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-name">Nome da empresa</Label>
                        <Input
                            id="ent-name"
                            placeholder="Nome da empresa"
                            value={form.name}
                            onChange={e => setForm(f => ({ ...f, name: e.target.value }))}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-email">E-mail da empresa</Label>
                        <Input
                            id="ent-email"
                            type="email"
                            placeholder="email@empresa.com"
                            value={form.email}
                            onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-niche">Nicho</Label>
                        <Input
                            id="ent-niche"
                            placeholder="Ex: E-commerce, Saúde, Educação..."
                            value={form.niche}
                            onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}
                            disabled={isPending}
                        />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label>Telefone</Label>
                        <PhoneInput
                            value={form.phone}
                            onChange={v => setForm(f => ({ ...f, phone: v }))}
                            disabled={isPending}
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isPending || !form.name.trim()}>
                        {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Section>
    )
}

// ─── Logo ─────────────────────────────────────────────────────────────────────

function LogoSection({ ent }: { ent: EnterpriseDetail }) {
    const fileRef = useRef<HTMLInputElement>(null)
    const { mutate: upload, isPending } = useUploadLogo()

    function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        upload(
            { id: ent.id, file },
            {
                onSuccess: () => toast.success('Logo atualizado!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
        e.target.value = ''
    }

    return (
        <Section title="Logo da empresa" description="Imagem exibida para identificar sua empresa">
            <div className="flex items-center gap-5">
                {/* Preview */}
                <div className="size-20 rounded-xl border bg-muted flex items-center justify-center shrink-0 overflow-hidden">
                    {ent.logo
                        ? <img src={ent.logo} alt="Logo" className="size-full object-cover" />
                        : <Building2 className="size-8 text-muted-foreground" />
                    }
                </div>

                <div className="flex flex-col gap-2">
                    <p className="text-xs text-muted-foreground">
                        Formatos aceitos: JPG, PNG, WEBP. Tamanho máximo: 2 MB.
                    </p>
                    <div className="flex items-center gap-2">
                        <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => fileRef.current?.click()}
                            disabled={isPending}
                        >
                            {isPending
                                ? <><Loader2 className="size-4 animate-spin" /> Enviando...</>
                                : <><Upload className="size-4" /> Enviar logo</>
                            }
                        </Button>
                    </div>
                    <input
                        ref={fileRef}
                        type="file"
                        accept="image/*"
                        className="hidden"
                        onChange={handleFile}
                    />
                </div>
            </div>
        </Section>
    )
}

// ─── Documentos ───────────────────────────────────────────────────────────────

function DocumentsSection({ ent }: { ent: EnterpriseDetail }) {
    const [docType, setDocType] = useState(ent.documentType ?? 'pj')
    const [doc, setDoc] = useState(ent.document ?? '')
    const { mutate: update, isPending } = useUpdateEnterprise()

    useEffect(() => {
        setDocType(ent.documentType ?? 'pj')
        setDoc(ent.document ?? '')
    }, [ent.id])

    function handleDocTypeChange(v: string) {
        setDocType(v)
        setDoc('') // limpa ao trocar tipo
    }

    function handleDocChange(e: React.ChangeEvent<HTMLInputElement>) {
        const masked = docType === 'pf' ? maskCPF(e.target.value) : maskCNPJ(e.target.value)
        setDoc(masked)
    }

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        update(
            { id: ent.id, payload: { documentType: docType, document: doc || null } },
            {
                onSuccess: () => toast.success('Documentos salvos!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    return (
        <Section title="Documentos" description="Informações fiscais da empresa">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label>Tipo de pessoa</Label>
                        <Select value={docType} onValueChange={handleDocTypeChange} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Selecionar..." />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="pf">Pessoa Física</SelectItem>
                                <SelectItem value="pj">Pessoa Jurídica</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-doc">
                            {docType === 'pf' ? 'CPF' : 'CNPJ'}
                        </Label>
                        <Input
                            id="ent-doc"
                            placeholder={docType === 'pf' ? '000.000.000-00' : '00.000.000/0000-00'}
                            value={doc}
                            onChange={handleDocChange}
                            disabled={isPending}
                            inputMode="numeric"
                        />
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isPending}>
                        {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Section>
    )
}

// ─── Endereço ─────────────────────────────────────────────────────────────────

const BR_STATES = [
    'AC','AL','AP','AM','BA','CE','DF','ES','GO','MA','MT','MS','MG',
    'PA','PB','PR','PE','PI','RJ','RN','RS','RO','RR','SC','SP','SE','TO',
]

function AddressSection({ ent }: { ent: EnterpriseDetail }) {
    const [form, setForm] = useState({
        country: ent.country ?? 'Brasil',
        zipCode: ent.zipCode ?? '',
        address: ent.address ?? '',
        addressNumber: ent.addressNumber ?? '',
        complement: ent.complement ?? '',
        neighborhood: ent.neighborhood ?? '',
        city: ent.city ?? '',
        state: ent.state ?? '',
    })

    useEffect(() => {
        setForm({
            country: ent.country ?? 'Brasil',
            zipCode: ent.zipCode ?? '',
            address: ent.address ?? '',
            addressNumber: ent.addressNumber ?? '',
            complement: ent.complement ?? '',
            neighborhood: ent.neighborhood ?? '',
            city: ent.city ?? '',
            state: ent.state ?? '',
        })
    }, [ent.id])

    const { mutate: update, isPending } = useUpdateEnterprise()

    function handleSubmit(e: React.FormEvent) {
        e.preventDefault()
        update(
            {
                id: ent.id,
                payload: {
                    country: form.country || null,
                    zipCode: form.zipCode || null,
                    address: form.address || null,
                    addressNumber: form.addressNumber || null,
                    complement: form.complement || null,
                    neighborhood: form.neighborhood || null,
                    city: form.city || null,
                    state: form.state || null,
                },
            },
            {
                onSuccess: () => toast.success('Endereço salvo!'),
                onError: (err: Error) => toast.error(err.message),
            }
        )
    }

    const f = (key: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, [key]: e.target.value }))

    const handleZip = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, zipCode: maskCEP(e.target.value) }))

    const handleNumber = (e: React.ChangeEvent<HTMLInputElement>) =>
        setForm(prev => ({ ...prev, addressNumber: e.target.value.replace(/\D/g, '') }))

    return (
        <Section title="Endereço" description="Localização da sua empresa">
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-country">País</Label>
                        <Input id="ent-country" placeholder="Brasil" value={form.country} onChange={f('country')} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-zip">CEP</Label>
                        <Input id="ent-zip" placeholder="00000-000" value={form.zipCode} onChange={handleZip} disabled={isPending} inputMode="numeric" />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <Label htmlFor="ent-addr">Endereço</Label>
                        <Input id="ent-addr" placeholder="Rua, Avenida..." value={form.address} onChange={f('address')} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-num">Número</Label>
                        <Input id="ent-num" placeholder="123" value={form.addressNumber} onChange={handleNumber} disabled={isPending} inputMode="numeric" />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-compl">Complemento</Label>
                        <Input id="ent-compl" placeholder="Apto, Sala..." value={form.complement} onChange={f('complement')} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-hood">Bairro</Label>
                        <Input id="ent-hood" placeholder="Bairro" value={form.neighborhood} onChange={f('neighborhood')} disabled={isPending} />
                    </div>
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="ent-city">Cidade</Label>
                        <Input id="ent-city" placeholder="Cidade" value={form.city} onChange={f('city')} disabled={isPending} />
                    </div>
                    <div className="col-span-2 flex flex-col gap-1.5">
                        <Label>UF</Label>
                        <Select value={form.state} onValueChange={v => setForm(p => ({ ...p, state: v }))} disabled={isPending}>
                            <SelectTrigger>
                                <SelectValue placeholder="Estado" />
                            </SelectTrigger>
                            <SelectContent>
                                {BR_STATES.map(s => (
                                    <SelectItem key={s} value={s}>{s}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>
                </div>
                <div className="flex justify-end">
                    <Button type="submit" size="sm" disabled={isPending}>
                        {isPending ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                    </Button>
                </div>
            </form>
        </Section>
    )
}

// ─── Danger Zone ──────────────────────────────────────────────────────────────

function DangerSection({ ent }: { ent: EnterpriseDetail }) {
    const [open, setOpen] = useState(false)
    const [confirm, setConfirm] = useState('')

    function handleDelete() {
        // delete enterprise — redirecionar para /verify após
        toast.error('Funcionalidade ainda não disponível.')
        setOpen(false)
    }

    return (
        <Section title="Excluir empresa" description="Esta ação é irreversível. Todos os dados serão perdidos permanentemente.">
            <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground max-w-sm">
                    Ao excluir a empresa, todos os leads, pipelines, conexões e automações serão deletados.
                </p>
                <Button
                    type="button"
                    variant="destructive"
                    size="sm"
                    onClick={() => setOpen(true)}
                >
                    <Trash2 className="size-4" />
                    Excluir empresa
                </Button>
            </div>

            <AlertDialog open={open} onOpenChange={v => { if (!v) { setOpen(false); setConfirm('') } }}>
                <AlertDialogContent>
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir empresa?</AlertDialogTitle>
                        <AlertDialogDescription className="flex flex-col gap-3">
                            <span>
                                Esta ação não pode ser desfeita. Todos os dados da empresa{' '}
                                <strong>"{ent.name}"</strong> serão permanentemente excluídos.
                            </span>
                            <span>
                                Digite <strong>{ent.name}</strong> para confirmar:
                            </span>
                            <Input
                                placeholder={ent.name}
                                value={confirm}
                                onChange={e => setConfirm(e.target.value)}
                                autoFocus
                            />
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel>Cancelar</AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            disabled={confirm !== ent.name}
                            className="bg-destructive text-destructive-foreground hover:bg-destructive/90 disabled:opacity-40"
                        >
                            Excluir permanentemente
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </Section>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function EnterpriseSettingsPage() {
    const { enterprise } = useEnterprise()
    const { data: ent, isLoading } = useEnterpriseDetail(enterprise?.id ?? '')

    if (isLoading || !enterprise) {
        return (
            <div className="flex items-center justify-center flex-1 py-20">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    if (!ent) return null

    return (
        <div className="flex flex-col p-8 gap-6 max-w-3xl mx-auto w-full">
            <div>
                <h1 className="text-xl font-semibold">Empresa</h1>
                <p className="text-sm text-muted-foreground mt-0.5">
                    Gerencie as informações da sua empresa
                </p>
            </div>

            <InfoSection ent={ent} />
            <LogoSection ent={ent} />
            <DocumentsSection ent={ent} />
            <AddressSection ent={ent} />
            <DangerSection ent={ent} />
        </div>
    )
}
