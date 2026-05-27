'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import { toast } from 'sonner'
import {
    Plus, Pencil, Trash2, Share2, MoreHorizontal,
    FileText, Loader2, ClipboardList, ToggleLeft, ToggleRight,
} from 'lucide-react'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import {
    Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from '@/components/ui/dialog'
import {
    DropdownMenu, DropdownMenuContent, DropdownMenuItem,
    DropdownMenuSeparator, DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import {
    AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
    AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useSimulationTemplates, useCreateSimulationTemplate,
    useDeleteSimulationTemplate, useUpdateSimulationTemplate,
    type SimulationTemplate,
} from '@/services/simulations'

// ─── Constants ────────────────────────────────────────────────────────────────

const EMOJI_OPTIONS = ['📋', '🏠', '🚗', '💰', '📊', '🏢', '📝', '🎯', '⚡', '🔧']

const CARD_COLORS = [
    '#6366f1', '#3b82f6', '#10b981', '#f59e0b',
    '#ef4444', '#8b5cf6', '#14b8a6', '#f97316',
]

// ─── Skeleton ─────────────────────────────────────────────────────────────────

function TemplateSkeleton() {
    return (
        <div className="rounded-xl border border-white/10 bg-white/5 p-5 animate-pulse">
            <div className="flex items-start gap-3">
                <div className="h-10 w-10 rounded-lg bg-white/10" />
                <div className="flex-1 space-y-2">
                    <div className="h-4 w-32 rounded bg-white/10" />
                    <div className="h-3 w-48 rounded bg-white/10" />
                </div>
            </div>
            <div className="mt-4 flex gap-2">
                <div className="h-5 w-16 rounded-full bg-white/10" />
                <div className="h-5 w-20 rounded-full bg-white/10" />
            </div>
        </div>
    )
}

// ─── New Template Dialog ───────────────────────────────────────────────────────

interface NewTemplateDialogProps {
    open: boolean
    onClose: () => void
    onCreated: (id: string) => void
    enterpriseId: string
}

function NewTemplateDialog({ open, onClose, onCreated, enterpriseId }: NewTemplateDialogProps) {
    const [name, setName] = useState('')
    const [description, setDescription] = useState('')
    const [emoji, setEmoji] = useState('📋')

    const createTemplate = useCreateSimulationTemplate()

    function handleSubmit() {
        if (!name.trim()) return
        createTemplate.mutate(
            { enterpriseId, name: name.trim(), description: description.trim() || undefined, emoji },
            {
                onSuccess: (tpl) => {
                    toast.success('Simulação criada!')
                    setName('')
                    setDescription('')
                    setEmoji('📋')
                    onClose()
                    onCreated(tpl.id)
                },
                onError: () => toast.error('Erro ao criar simulação'),
            },
        )
    }

    return (
        <Dialog open={open} onOpenChange={(v) => !v && onClose()}>
            <DialogContent className="bg-[#0f1623] border-white/10 text-white sm:max-w-md">
                <DialogHeader>
                    <DialogTitle className="text-lg font-semibold">Nova simulação</DialogTitle>
                </DialogHeader>

                <div className="space-y-4 py-2">
                    {/* Emoji picker */}
                    <div className="space-y-2">
                        <Label className="text-sm text-white/60">Ícone</Label>
                        <div className="flex flex-wrap gap-2">
                            {EMOJI_OPTIONS.map((e) => (
                                <button
                                    key={e}
                                    onClick={() => setEmoji(e)}
                                    className={cn(
                                        'h-10 w-10 rounded-lg text-xl flex items-center justify-center transition-all',
                                        emoji === e
                                            ? 'bg-violet-500/30 ring-2 ring-violet-500'
                                            : 'bg-white/5 hover:bg-white/10',
                                    )}
                                >
                                    {e}
                                </button>
                            ))}
                        </div>
                    </div>

                    {/* Name */}
                    <div className="space-y-2">
                        <Label htmlFor="sim-name" className="text-sm text-white/60">Nome *</Label>
                        <Input
                            id="sim-name"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            placeholder="Ex: Simulação de Financiamento"
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleSubmit()}
                            autoFocus
                        />
                    </div>

                    {/* Description */}
                    <div className="space-y-2">
                        <Label htmlFor="sim-desc" className="text-sm text-white/60">Descrição (opcional)</Label>
                        <Textarea
                            id="sim-desc"
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            placeholder="Descreva o objetivo desta simulação..."
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500 resize-none"
                            rows={3}
                        />
                    </div>
                </div>

                <DialogFooter>
                    <Button
                        variant="ghost"
                        onClick={onClose}
                        className="text-white/60 hover:text-white hover:bg-white/5"
                    >
                        Cancelar
                    </Button>
                    <Button
                        onClick={handleSubmit}
                        disabled={!name.trim() || createTemplate.isPending}
                        className="bg-violet-600 hover:bg-violet-700 text-white"
                    >
                        {createTemplate.isPending ? (
                            <><Loader2 className="mr-2 h-4 w-4 animate-spin" /> Criando...</>
                        ) : 'Criar e editar'}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    )
}

// ─── Template Card ─────────────────────────────────────────────────────────────

interface TemplateCardProps {
    template: SimulationTemplate
    enterpriseId: string
    onEdit: () => void
}

function TemplateCard({ template, enterpriseId, onEdit }: TemplateCardProps) {
    const router = useRouter()
    const updateTemplate = useUpdateSimulationTemplate()
    const deleteTemplate = useDeleteSimulationTemplate()
    const [deleteOpen, setDeleteOpen] = useState(false)
    const [renameOpen, setRenameOpen] = useState(false)
    const [newName, setNewName] = useState(template.name)

    const color = template.color || CARD_COLORS[0]
    const fieldCount = template._count?.fields ?? template.fields?.length ?? 0
    const responseCount = template._count?.responses ?? 0

    function copyShareLink() {
        const url = `${window.location.origin}/s/preview/${template.id}`
        navigator.clipboard.writeText(url).then(() => toast.success('Link copiado!'))
    }

    function toggleActive() {
        updateTemplate.mutate(
            { id: template.id, enterpriseId, isActive: !template.isActive },
            {
                onSuccess: () => toast.success(template.isActive ? 'Simulação desativada' : 'Simulação ativada'),
                onError: () => toast.error('Erro ao atualizar simulação'),
            },
        )
    }

    function handleRename() {
        if (!newName.trim()) return
        updateTemplate.mutate(
            { id: template.id, enterpriseId, name: newName.trim() },
            {
                onSuccess: () => { toast.success('Nome atualizado'); setRenameOpen(false) },
                onError: () => toast.error('Erro ao renomear'),
            },
        )
    }

    function handleDelete() {
        deleteTemplate.mutate(
            { id: template.id, enterpriseId },
            {
                onSuccess: () => toast.success('Simulação excluída'),
                onError: () => toast.error('Erro ao excluir'),
            },
        )
    }

    return (
        <>
            <motion.div
                initial={{ opacity: 0, y: 12 }}
                animate={{ opacity: 1, y: 0 }}
                className="group relative rounded-xl border border-white/10 bg-white/5 overflow-hidden hover:border-white/20 hover:bg-white/[0.07] transition-all"
            >
                {/* Color left border */}
                <div className="absolute left-0 top-0 h-full w-1 rounded-l-xl" style={{ background: color }} />

                <div className="p-5 pl-6">
                    {/* Header */}
                    <div className="flex items-start justify-between gap-3">
                        <div className="flex items-start gap-3">
                            <div
                                className="flex h-11 w-11 items-center justify-center rounded-xl text-2xl shrink-0"
                                style={{ background: `${color}22` }}
                            >
                                {template.emoji || '📋'}
                            </div>
                            <div className="min-w-0">
                                <h3 className="font-semibold text-white text-sm leading-tight truncate max-w-[180px]">
                                    {template.name}
                                </h3>
                                {template.description && (
                                    <p className="text-xs text-white/40 mt-0.5 line-clamp-2">{template.description}</p>
                                )}
                            </div>
                        </div>

                        <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                                <Button
                                    size="icon"
                                    variant="ghost"
                                    className="h-7 w-7 text-white/40 hover:text-white hover:bg-white/10 shrink-0"
                                >
                                    <MoreHorizontal className="h-4 w-4" />
                                </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent
                                align="end"
                                className="bg-[#0f1623] border-white/10 text-white min-w-[160px]"
                            >
                                <DropdownMenuItem
                                    className="hover:bg-white/5 cursor-pointer gap-2"
                                    onClick={() => { setNewName(template.name); setRenameOpen(true) }}
                                >
                                    <Pencil className="h-4 w-4 text-white/40" /> Renomear
                                </DropdownMenuItem>
                                <DropdownMenuItem
                                    className="hover:bg-white/5 cursor-pointer gap-2"
                                    onClick={toggleActive}
                                >
                                    {template.isActive
                                        ? <><ToggleRight className="h-4 w-4 text-white/40" /> Desativar</>
                                        : <><ToggleLeft className="h-4 w-4 text-white/40" /> Ativar</>
                                    }
                                </DropdownMenuItem>
                                <DropdownMenuSeparator className="bg-white/10" />
                                <DropdownMenuItem
                                    className="hover:bg-red-500/10 text-red-400 cursor-pointer gap-2"
                                    onClick={() => setDeleteOpen(true)}
                                >
                                    <Trash2 className="h-4 w-4" /> Excluir
                                </DropdownMenuItem>
                            </DropdownMenuContent>
                        </DropdownMenu>
                    </div>

                    {/* Badges */}
                    <div className="mt-4 flex items-center flex-wrap gap-1.5">
                        <Badge
                            variant="secondary"
                            className="bg-white/8 text-white/60 border-0 text-xs px-2 py-0.5"
                        >
                            {fieldCount} {fieldCount === 1 ? 'campo' : 'campos'}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className="bg-white/8 text-white/60 border-0 text-xs px-2 py-0.5"
                        >
                            {responseCount} {responseCount === 1 ? 'resposta' : 'respostas'}
                        </Badge>
                        <Badge
                            variant="secondary"
                            className={cn(
                                'border-0 text-xs px-2 py-0.5',
                                template.isActive
                                    ? 'bg-emerald-500/15 text-emerald-400'
                                    : 'bg-white/8 text-white/40',
                            )}
                        >
                            {template.isActive ? 'Ativo' : 'Inativo'}
                        </Badge>
                    </div>

                    {/* Actions */}
                    <div className="mt-4 flex items-center gap-2">
                        <Button
                            size="sm"
                            onClick={onEdit}
                            className="flex-1 h-8 bg-violet-600/20 hover:bg-violet-600/30 text-violet-300 border border-violet-500/30 text-xs"
                        >
                            <Pencil className="mr-1.5 h-3.5 w-3.5" />
                            Editar
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            onClick={copyShareLink}
                            className="h-8 w-8 text-white/40 hover:text-white hover:bg-white/10"
                            title="Copiar link de compartilhamento"
                        >
                            <Share2 className="h-3.5 w-3.5" />
                        </Button>
                    </div>
                </div>
            </motion.div>

            {/* Rename dialog */}
            <Dialog open={renameOpen} onOpenChange={(v) => !v && setRenameOpen(false)}>
                <DialogContent className="bg-[#0f1623] border-white/10 text-white sm:max-w-sm">
                    <DialogHeader>
                        <DialogTitle>Renomear simulação</DialogTitle>
                    </DialogHeader>
                    <div className="py-2">
                        <Input
                            value={newName}
                            onChange={(e) => setNewName(e.target.value)}
                            className="bg-white/5 border-white/10 text-white placeholder:text-white/30 focus:border-violet-500"
                            onKeyDown={(e) => e.key === 'Enter' && handleRename()}
                            autoFocus
                        />
                    </div>
                    <DialogFooter>
                        <Button
                            variant="ghost"
                            onClick={() => setRenameOpen(false)}
                            className="text-white/60 hover:text-white hover:bg-white/5"
                        >
                            Cancelar
                        </Button>
                        <Button
                            onClick={handleRename}
                            disabled={!newName.trim() || updateTemplate.isPending}
                            className="bg-violet-600 hover:bg-violet-700 text-white"
                        >
                            {updateTemplate.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : 'Salvar'}
                        </Button>
                    </DialogFooter>
                </DialogContent>
            </Dialog>

            {/* Delete confirm */}
            <AlertDialog open={deleteOpen} onOpenChange={setDeleteOpen}>
                <AlertDialogContent className="bg-[#0f1623] border-white/10 text-white">
                    <AlertDialogHeader>
                        <AlertDialogTitle>Excluir simulação?</AlertDialogTitle>
                        <AlertDialogDescription className="text-white/50">
                            Esta ação não pode ser desfeita. Todas as respostas associadas também serão excluídas.
                        </AlertDialogDescription>
                    </AlertDialogHeader>
                    <AlertDialogFooter>
                        <AlertDialogCancel className="bg-white/5 border-white/10 text-white hover:bg-white/10">
                            Cancelar
                        </AlertDialogCancel>
                        <AlertDialogAction
                            onClick={handleDelete}
                            className="bg-red-600 hover:bg-red-700 text-white"
                        >
                            Excluir
                        </AlertDialogAction>
                    </AlertDialogFooter>
                </AlertDialogContent>
            </AlertDialog>
        </>
    )
}

// ─── Empty State ──────────────────────────────────────────────────────────────

function EmptyState({ onNew }: { onNew: () => void }) {
    return (
        <motion.div
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            className="flex flex-col items-center justify-center py-24 text-center"
        >
            <div className="relative mb-6">
                <div className="h-20 w-20 rounded-2xl bg-violet-500/10 flex items-center justify-center">
                    <ClipboardList className="h-10 w-10 text-violet-400" />
                </div>
                <div className="absolute -right-1 -top-1 h-6 w-6 rounded-full bg-violet-600 flex items-center justify-center">
                    <Plus className="h-3.5 w-3.5 text-white" />
                </div>
            </div>
            <h3 className="text-lg font-semibold text-white mb-2">Nenhuma simulação ainda</h3>
            <p className="text-sm text-white/40 max-w-xs mb-6">
                Crie formulários interativos para coletar informações de forma estruturada.
            </p>
            <Button
                onClick={onNew}
                className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
            >
                <Plus className="h-4 w-4" />
                Crie sua primeira simulação
            </Button>
        </motion.div>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

export default function SimulacoesPage() {
    const router = useRouter()
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''
    const { data: templates, isLoading } = useSimulationTemplates(enterpriseId)
    const [newOpen, setNewOpen] = useState(false)

    function handleCreated(id: string) {
        router.push(`/simulacoes/${id}`)
    }

    return (
        <div className="min-h-screen bg-[#080e1a] text-white">
            {/* Top bar */}
            <div className="sticky top-0 z-10 border-b border-white/8 bg-[#080e1a]/80 backdrop-blur-sm">
                <div className="mx-auto max-w-7xl px-6 py-4 flex items-center justify-between">
                    <div>
                        <h1 className="text-xl font-bold text-white">Simulações</h1>
                        <p className="text-xs text-white/40 mt-0.5">
                            Formulários interativos para coleta de dados
                        </p>
                    </div>
                    <Button
                        onClick={() => setNewOpen(true)}
                        className="bg-violet-600 hover:bg-violet-700 text-white gap-2"
                    >
                        <Plus className="h-4 w-4" />
                        Nova simulação
                    </Button>
                </div>
            </div>

            {/* Content */}
            <div className="mx-auto max-w-7xl px-6 py-8">
                {isLoading ? (
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                        {Array.from({ length: 6 }).map((_, i) => <TemplateSkeleton key={i} />)}
                    </div>
                ) : !templates?.length ? (
                    <EmptyState onNew={() => setNewOpen(true)} />
                ) : (
                    <AnimatePresence>
                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                            {templates.map((tpl) => (
                                <TemplateCard
                                    key={tpl.id}
                                    template={tpl}
                                    enterpriseId={enterpriseId}
                                    onEdit={() => router.push(`/simulacoes/${tpl.id}`)}
                                />
                            ))}
                        </div>
                    </AnimatePresence>
                )}
            </div>

            <NewTemplateDialog
                open={newOpen}
                onClose={() => setNewOpen(false)}
                onCreated={handleCreated}
                enterpriseId={enterpriseId}
            />
        </div>
    )
}
