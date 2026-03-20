'use client'

import { useState, useRef, useEffect } from 'react'
import {
    CheckIcon,
    PlusIcon,
    ChevronDownIcon,
    ChevronUpIcon,
    Loader2Icon,
    Building2Icon,
} from 'lucide-react'
import { useCreateEnterprise, type Enterprise } from '@/services/enterprises'
import { setActiveEnterpriseId } from '@/hooks/use-enterprise'
import { cn } from '@/lib/utils'
import { toast } from 'sonner'

interface EnterpriseSwitcherProps {
    enterprises: Enterprise[]
    activeId: string
    /** Whether the sidebar is expanded (shows label text) */
    expanded: boolean
}

export function EnterpriseSwitcher({ enterprises, activeId, expanded }: EnterpriseSwitcherProps) {
    const [open, setOpen] = useState(false)
    const [createMode, setCreateMode] = useState(false)
    const [name, setName] = useState('')
    const ref = useRef<HTMLDivElement>(null)
    const inputRef = useRef<HTMLInputElement>(null)

    const { mutateAsync: createEnterprise, isPending } = useCreateEnterprise()

    const active = enterprises.find(e => e.id === activeId) ?? enterprises[0]
    const workspaceName = active?.name ?? 'Minha empresa'
    const workspaceInitial = workspaceName[0]?.toUpperCase() ?? 'M'

    // Close on click outside
    useEffect(() => {
        function handleDown(e: MouseEvent) {
            if (ref.current && !ref.current.contains(e.target as Node)) {
                setOpen(false)
                setCreateMode(false)
                setName('')
            }
        }
        document.addEventListener('mousedown', handleDown)
        return () => document.removeEventListener('mousedown', handleDown)
    }, [])

    // Focus the input when create mode is activated
    useEffect(() => {
        if (createMode && inputRef.current) {
            setTimeout(() => inputRef.current?.focus(), 50)
        }
    }, [createMode])

    function handleSwitch(id: string) {
        if (id === activeId) { setOpen(false); return }
        setActiveEnterpriseId(id)
        setOpen(false)
        window.location.reload()
    }

    async function handleCreate(e: React.FormEvent) {
        e.preventDefault()
        const trimmed = name.trim()
        if (!trimmed) return
        try {
            const created = await createEnterprise({ name: trimmed })
            toast.success(`Empresa "${created.name}" criada`)
            setActiveEnterpriseId(created.id)
            setOpen(false)
            setCreateMode(false)
            setName('')
            window.location.reload()
        } catch {
            toast.error('Erro ao criar empresa')
        }
    }

    return (
        <div ref={ref} className="relative w-full">
            {/* Trigger button */}
            <button
                onClick={() => { setOpen(v => !v); setCreateMode(false); setName('') }}
                className={cn(
                    'flex items-center gap-2 min-w-0 rounded p-1 hover:bg-muted transition-colors',
                    expanded ? 'w-full' : '',
                    open && 'bg-muted',
                )}
            >
                {active?.logo
                    ? <img src={active.logo} alt={workspaceName} className="size-6 rounded object-cover shrink-0" />
                    : (
                        <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                            {workspaceInitial}
                        </div>
                    )
                }
                {expanded && (
                    <>
                        <span className="text-sm font-medium truncate flex-1 text-left">{workspaceName}</span>
                        {open
                            ? <ChevronUpIcon className="size-3.5 text-muted-foreground shrink-0" />
                            : <ChevronDownIcon className="size-3.5 text-muted-foreground shrink-0" />
                        }
                    </>
                )}
            </button>

            {/* Dropdown */}
            {open && (
                <div className={cn(
                    'absolute top-full mt-1.5 z-[100] bg-popover border border-border rounded-xl shadow-xl overflow-hidden',
                    expanded ? 'left-0 right-0 min-w-[200px]' : 'left-full ml-2 w-[230px]',
                )}>
                    {/* Enterprise list */}
                    <div className="p-1.5">
                        <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-2 pt-1 pb-1.5">
                            Suas empresas
                        </p>
                        {enterprises.length === 0 && (
                            <p className="text-xs text-muted-foreground px-2 py-1.5">Nenhuma empresa</p>
                        )}
                        {enterprises.map(ent => (
                            <button
                                key={ent.id}
                                onClick={() => handleSwitch(ent.id)}
                                className={cn(
                                    'flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm transition-colors',
                                    ent.id === activeId
                                        ? 'bg-primary/10 text-primary font-medium'
                                        : 'hover:bg-muted text-foreground',
                                )}
                            >
                                {ent.logo
                                    ? <img src={ent.logo} alt={ent.name} className="size-5 rounded object-cover shrink-0" />
                                    : (
                                        <div className={cn(
                                            'flex size-5 shrink-0 items-center justify-center rounded text-[10px] font-bold',
                                            ent.id === activeId
                                                ? 'bg-primary/20 text-primary'
                                                : 'bg-muted-foreground/15 text-muted-foreground',
                                        )}>
                                            {ent.name[0]?.toUpperCase()}
                                        </div>
                                    )
                                }
                                <span className="flex-1 truncate text-left">{ent.name}</span>
                                {ent.id === activeId && <CheckIcon className="size-3.5 shrink-0 text-primary" />}
                            </button>
                        ))}
                    </div>

                    <div className="mx-2 border-t border-border" />

                    {/* Create section */}
                    {createMode ? (
                        <form onSubmit={handleCreate} className="p-2">
                            <p className="text-[10px] font-medium text-muted-foreground/60 uppercase tracking-wider px-1 pb-1.5">
                                Nova empresa
                            </p>
                            <div className="flex gap-1.5">
                                <input
                                    ref={inputRef}
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                    placeholder="Nome da empresa"
                                    className="flex-1 h-7 rounded-md border border-border bg-background px-2 text-xs focus:outline-none focus:ring-1 focus:ring-primary"
                                    disabled={isPending}
                                />
                                <button
                                    type="submit"
                                    disabled={!name.trim() || isPending}
                                    className="flex items-center justify-center h-7 w-7 rounded-md bg-primary text-primary-foreground disabled:opacity-40 shrink-0 transition-opacity"
                                >
                                    {isPending
                                        ? <Loader2Icon size={12} className="animate-spin" />
                                        : <CheckIcon size={12} />
                                    }
                                </button>
                            </div>
                            <button
                                type="button"
                                onClick={() => { setCreateMode(false); setName('') }}
                                className="w-full text-xs text-muted-foreground hover:text-foreground mt-1.5 py-0.5 transition-colors"
                            >
                                Cancelar
                            </button>
                        </form>
                    ) : (
                        <div className="p-1.5">
                            <button
                                onClick={() => setCreateMode(true)}
                                className="flex items-center gap-2.5 w-full px-2 py-2 rounded-lg text-sm text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                            >
                                <div className="flex size-5 shrink-0 items-center justify-center rounded border border-dashed border-muted-foreground/40">
                                    <PlusIcon size={10} />
                                </div>
                                Criar nova empresa
                            </button>
                        </div>
                    )}
                </div>
            )}
        </div>
    )
}
