'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { toast } from 'sonner'
import { Eye, EyeOff, Loader2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { PhoneInput } from '@/components/ui/phone-input'
import { cn } from '@/lib/utils'
import { useSignUp } from '@/services/auth'

export function RegisterForm({ className }: { className?: string }) {
    const router = useRouter()
    const [name, setName] = useState('')
    const [email, setEmail] = useState('')
    const [phone, setPhone] = useState('')
    const [password, setPassword] = useState('')
    const [showPassword, setShowPassword] = useState(false)

    const { mutate, isPending } = useSignUp()

    function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
        e.preventDefault()
        mutate(
            { name, email, password, ...(phone ? { phone } : {}) },
            {
                onSuccess: () => {
                    toast.success('Conta criada com sucesso!')
                    router.push('/verify')
                },
                onError: (error: Error) => {
                    toast.error(error.message)
                },
            },
        )
    }

    return (
        <form
            onSubmit={handleSubmit}
            className={cn('flex flex-col gap-6', className)}
        >
            <div className="flex flex-col gap-1">
                <h1 className="text-2xl font-semibold tracking-tight">Criar conta</h1>
                <p className="text-sm text-muted-foreground">
                    Preencha os dados abaixo para começar.
                </p>
            </div>

            <div className="flex flex-col gap-4">
                {/* Nome */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="name">Nome completo</Label>
                    <Input
                        id="name"
                        type="text"
                        placeholder="Seu nome"
                        autoComplete="name"
                        required
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                        disabled={isPending}
                    />
                </div>

                {/* E-mail */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="email">E-mail</Label>
                    <Input
                        id="email"
                        type="email"
                        placeholder="voce@empresa.com"
                        autoComplete="email"
                        required
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                        disabled={isPending}
                    />
                </div>

                {/* Telefone (opcional) */}
                <div className="flex flex-col gap-2">
                    <div className="flex items-center justify-between">
                        <Label htmlFor="phone">Telefone</Label>
                        <span className="text-xs text-muted-foreground">Opcional</span>
                    </div>
                    <PhoneInput
                        id="phone"
                        placeholder="+55 (11) 99999-9999"
                        value={phone}
                        onChange={setPhone}
                        disabled={isPending}
                    />
                </div>

                {/* Senha */}
                <div className="flex flex-col gap-2">
                    <Label htmlFor="password">Senha</Label>
                    <div className="relative">
                        <Input
                            id="password"
                            type={showPassword ? 'text' : 'password'}
                            placeholder="Mínimo 8 caracteres"
                            autoComplete="new-password"
                            required
                            minLength={8}
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            disabled={isPending}
                            className="pr-10"
                        />
                        <button
                            type="button"
                            onClick={() => setShowPassword((v) => !v)}
                            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground transition-colors"
                            tabIndex={-1}
                            aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                        >
                            {showPassword
                                ? <EyeOff className="size-4" />
                                : <Eye className="size-4" />
                            }
                        </button>
                    </div>
                </div>

                <Button type="submit" className="w-full" disabled={isPending}>
                    {isPending
                        ? <><Loader2 className="size-4 animate-spin" /> Criando conta...</>
                        : 'Criar conta'
                    }
                </Button>
            </div>

            <p className="text-center text-sm text-muted-foreground">
                Já tem uma conta?{' '}
                <a
                    href="/login"
                    className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                    Entrar
                </a>
            </p>
        </form>
    )
}
