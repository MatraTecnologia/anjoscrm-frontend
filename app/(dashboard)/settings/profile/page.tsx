'use client'

import { useState, useRef } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { useTheme } from 'next-themes'
import { Loader2, LogOut, Trash2, ChevronRight, BadgeCheck } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { useSession, useSignOut, useUpdateProfile, useDeleteAccount } from '@/services/auth'
import { useVerify, useUploadAvatar } from '@/services/enterprises'

export default function ProfilePage() {
    const router = useRouter()
    const { data: session, isLoading } = useSession()
    const { data: verify } = useVerify()
    const { mutate: signOut, isPending: signingOut } = useSignOut()
    const { mutate: updateProfile, isPending: updatingProfile } = useUpdateProfile()
    const { mutate: deleteAccount, isPending: deletingAccount } = useDeleteAccount()
    const { mutate: uploadAvatar, isPending: uploadingAvatar } = useUploadAvatar()
    const { theme, setTheme } = useTheme()

    const fileInputRef = useRef<HTMLInputElement>(null)

    const [name, setName] = useState(session?.user.name ?? '')
    const [phone, setPhone] = useState(session?.user.phone ?? '')
    const [avatarPreview, setAvatarPreview] = useState<string | null>(null)
    const [pendingFile, setPendingFile] = useState<File | null>(null)
    const [confirmDelete, setConfirmDelete] = useState(false)

    // Sincroniza campos com a sessão ao carregar
    if (!isLoading && session && name === '' && session.user.name) {
        setName(session.user.name)
        setPhone(session.user.phone ?? '')
    }

    function handleSignOut() {
        signOut(undefined, {
            onSuccess: () => router.replace('/login'),
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleSaveInfo(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        updateProfile(
            { name: name.trim(), phone: phone || null },
            {
                onSuccess: () => toast.success('Perfil atualizado!'),
                onError: (err: Error) => toast.error(err.message),
            },
        )
    }

    function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0]
        if (!file) return
        setPendingFile(file)
        setAvatarPreview(URL.createObjectURL(file))
    }

    function handleSaveAvatar() {
        if (!pendingFile) return
        uploadAvatar(pendingFile, {
            onSuccess: () => {
                toast.success('Foto de perfil atualizada!')
                setPendingFile(null)
            },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    function handleDeleteAccount() {
        if (!confirmDelete) { setConfirmDelete(true); return }
        deleteAccount(undefined, {
            onSuccess: () => { toast.success('Conta excluída.'); router.replace('/register') },
            onError: (err: Error) => toast.error(err.message),
        })
    }

    const avatarSrc = avatarPreview ?? session?.user.image ?? null
    const initials = session?.user.name
        ? session.user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U'
    const joinedAt = session?.user.createdAt
        ? format(new Date(session.user.createdAt), "dd 'de' MMMM 'de' yyyy", { locale: ptBR })
        : ''

    if (isLoading) {
        return (
            <div className="flex items-center justify-center h-full">
                <Loader2 className="size-6 animate-spin text-muted-foreground" />
            </div>
        )
    }

    return (
        <div className="flex flex-col max-w-3xl mx-auto w-full">
            {/* ── Header do perfil ───────────────────────────────────────────── */}
            <div className="flex items-center justify-between px-8 py-6 border-b">
                <div className="flex items-center gap-4">
                    {/* Avatar grande */}
                    <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 text-2xl font-bold overflow-hidden">
                        {avatarSrc
                            ? <img src={avatarSrc} alt={session?.user.name} className="size-full object-cover" />
                            : initials
                        }
                    </div>

                    <div className="flex flex-col gap-0.5">
                        <div className="flex items-center gap-2">
                            <h1 className="text-lg font-semibold">{session?.user.name}</h1>
                            {session?.user.emailVerified && (
                                <BadgeCheck className="size-4 text-blue-500" />
                            )}
                        </div>
                        <p className="text-sm text-muted-foreground">{session?.user.email}</p>
                        {joinedAt && (
                            <p className="text-xs text-muted-foreground flex items-center gap-1">
                                <span>📅</span> {joinedAt}
                            </p>
                        )}
                    </div>
                </div>

                <Button variant="outline" size="sm" onClick={handleSignOut} disabled={signingOut}>
                    {signingOut
                        ? <Loader2 className="size-4 animate-spin" />
                        : <><LogOut className="size-4" /> Sair</>
                    }
                </Button>
            </div>

            <div className="flex flex-col gap-6 p-8 max-w-2xl">
                {/* ── Informações ──────────────────────────────────────────────── */}
                <Section title="Informações" description="Suas informações de cadastro e login">
                    <form onSubmit={handleSaveInfo} className="flex flex-col gap-4">
                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="name">Nome</Label>
                            <Input
                                id="name"
                                value={name}
                                onChange={e => setName(e.target.value)}
                                placeholder="Seu nome completo"
                                disabled={updatingProfile}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label htmlFor="phone">Telefone</Label>
                            <PhoneInput
                                id="phone"
                                value={phone}
                                onChange={setPhone}
                                disabled={updatingProfile}
                            />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Email</Label>
                            <Input value={session?.user.email ?? ''} disabled className="text-muted-foreground" />
                        </div>

                        <div className="flex flex-col gap-1.5">
                            <Label>Senha</Label>
                            <button
                                type="button"
                                onClick={() => toast.info('Em breve: alterar senha')}
                                className="text-sm text-primary hover:underline text-left"
                            >
                                Alterar senha
                            </button>
                        </div>

                        <div className="flex justify-end">
                            <Button type="submit" disabled={updatingProfile} size="sm">
                                {updatingProfile ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                            </Button>
                        </div>
                    </form>
                </Section>

                {/* ── Imagem de perfil ─────────────────────────────────────────── */}
                <Section title="Imagem de perfil" description="Faça o upload da sua imagem de perfil aqui">
                    <div className="flex items-center gap-4">
                        <div className="flex size-16 shrink-0 items-center justify-center rounded-full bg-rose-200 text-rose-700 text-2xl font-bold overflow-hidden">
                            {avatarSrc
                                ? <img src={avatarSrc} alt="Preview" className="size-full object-cover" />
                                : initials
                            }
                        </div>

                        <div className="flex flex-col gap-2 flex-1">
                            <input
                                ref={fileInputRef}
                                type="file"
                                accept="image/*"
                                className="hidden"
                                onChange={handleFileChange}
                            />
                            <Button
                                variant="outline"
                                size="sm"
                                type="button"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                Escolher arquivo
                            </Button>
                            {pendingFile && (
                                <p className="text-xs text-muted-foreground truncate">{pendingFile.name}</p>
                            )}
                        </div>
                    </div>

                    {pendingFile && (
                        <div className="flex justify-end mt-3">
                            <Button size="sm" onClick={handleSaveAvatar} disabled={uploadingAvatar}>
                                {uploadingAvatar ? <><Loader2 className="size-4 animate-spin" /> Salvando...</> : 'Salvar'}
                            </Button>
                        </div>
                    )}
                </Section>

                {/* ── Preferências ─────────────────────────────────────────────── */}
                <Section title="Preferências" description="Personalize a aparência do app selecionando o tema">
                    <div className="flex flex-col gap-1.5">
                        <Label htmlFor="theme">Tema <span className="text-xs text-muted-foreground ml-1">Beta</span></Label>
                        <select
                            id="theme"
                            value={theme}
                            onChange={e => setTheme(e.target.value)}
                            className="h-9 w-full rounded-md border bg-background px-3 text-sm"
                        >
                            <option value="light">Claro</option>
                            <option value="dark">Escuro</option>
                            <option value="system">Sistema</option>
                        </select>
                    </div>
                </Section>

                {/* ── Empresas ─────────────────────────────────────────────────── */}
                <Section title="Empresas" description="Empresas que você possui ou participa">
                    <div className="flex flex-col gap-2">
                        <Input placeholder="Pesquisar..." className="h-8 text-sm" />

                        <div className="rounded-md border overflow-hidden">
                            <table className="w-full text-sm">
                                <thead className="bg-muted/50">
                                    <tr>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Nome</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Nicho</th>
                                        <th className="text-left px-3 py-2 text-xs font-medium text-muted-foreground">Data de criação</th>
                                        <th className="w-8" />
                                    </tr>
                                </thead>
                                <tbody>
                                    {verify?.enterprises && verify.enterprises.length > 0 ? (
                                        verify.enterprises.map((enterprise) => (
                                            <tr key={enterprise.id} className="border-t hover:bg-muted/30 transition-colors">
                                                <td className="px-3 py-2.5">
                                                    <div className="flex items-center gap-2">
                                                        <div className="flex size-5 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                                                            {enterprise.name[0]?.toUpperCase()}
                                                        </div>
                                                        <span className="font-medium text-primary">{enterprise.name}</span>
                                                    </div>
                                                </td>
                                                <td className="px-3 py-2.5 text-muted-foreground">—</td>
                                                <td className="px-3 py-2.5 text-muted-foreground">
                                                    {format(new Date(), 'dd/MM/yyyy')}
                                                </td>
                                                <td className="px-3 py-2.5">
                                                    <ChevronRight className="size-4 text-muted-foreground" />
                                                </td>
                                            </tr>
                                        ))
                                    ) : (
                                        <tr>
                                            <td colSpan={4} className="px-3 py-6 text-center text-sm text-muted-foreground">
                                                Nenhuma empresa encontrada
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </Section>

                {/* ── Excluir conta ─────────────────────────────────────────────── */}
                <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 flex items-center justify-between gap-4">
                    <div className="flex flex-col gap-1">
                        <p className="font-medium text-sm">Excluir conta</p>
                        <p className="text-xs text-muted-foreground">
                            Você tem um prazo de 30 dias para poder restaurar sua conta.
                        </p>
                        <p className="text-xs text-destructive">
                            Atenção, você é o único usuário ativo dessa empresa.
                        </p>
                    </div>
                    <Button
                        variant="destructive"
                        size="sm"
                        onClick={handleDeleteAccount}
                        disabled={deletingAccount}
                        className="shrink-0"
                    >
                        {deletingAccount
                            ? <Loader2 className="size-4 animate-spin" />
                            : <><Trash2 className="size-4" /> {confirmDelete ? 'Confirmar exclusão' : 'Excluir conta'}</>
                        }
                    </Button>
                </div>
            </div>
        </div>
    )
}

function Section({ title, description, children }: { title: string; description: string; children: React.ReactNode }) {
    return (
        <div className="rounded-lg border p-6 flex flex-col gap-4">
            <div>
                <p className="font-medium">{title}</p>
                <p className="text-sm text-muted-foreground">{description}</p>
            </div>
            {children}
        </div>
    )
}
