'use client'

import * as React from 'react'
import { X, Plus, ChevronDown } from 'lucide-react'

import { cn } from '@/lib/utils'
import { Command, CommandGroup, CommandItem, CommandList } from '@/components/ui/command'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import type { Tag } from '@/services/tags'

interface TagSelectorProps {
    allTags: Tag[]
    value: Tag[]
    onChange: (tags: Tag[]) => void
    onCreateTag: (name: string) => Promise<Tag>
    isCreating?: boolean
    disabled?: boolean
    placeholder?: string
}

export function TagSelector({
    allTags,
    value,
    onChange,
    onCreateTag,
    isCreating,
    disabled,
    placeholder = 'Adicionar tag...',
}: TagSelectorProps) {
    const [open, setOpen] = React.useState(false)
    const [inputValue, setInputValue] = React.useState('')

    const selectedIds = React.useMemo(() => new Set(value.map(t => t.id)), [value])

    const filteredTags = React.useMemo(
        () => allTags.filter(t => t.name.toLowerCase().includes(inputValue.toLowerCase())),
        [allTags, inputValue]
    )

    const exactMatch = allTags.some(
        t => t.name.toLowerCase() === inputValue.trim().toLowerCase()
    )
    const showCreate = inputValue.trim().length > 0 && !exactMatch

    function toggle(tag: Tag) {
        if (selectedIds.has(tag.id)) {
            onChange(value.filter(t => t.id !== tag.id))
        } else {
            onChange([...value, tag])
        }
        setInputValue('')
    }

    async function handleCreate() {
        const name = inputValue.trim()
        if (!name || isCreating) return
        const tag = await onCreateTag(name)
        onChange([...value, tag])
        setInputValue('')
    }

    return (
        <div className="flex flex-col gap-2">

            {/* ── Chips das tags selecionadas ────────────────────────────── */}
            {value.length > 0 && (
                <div className="flex flex-wrap gap-1.5">
                    {value.map(tag => (
                        <span
                            key={tag.id}
                            className="inline-flex items-center gap-1 rounded-sm px-2 py-0.5 text-xs font-medium text-white"
                            style={{ backgroundColor: tag.color }}
                        >
                            {tag.name}
                            {!disabled && (
                                <button
                                    type="button"
                                    onClick={() => onChange(value.filter(t => t.id !== tag.id))}
                                    className="opacity-70 hover:opacity-100 leading-none"
                                    tabIndex={-1}
                                >
                                    <X className="size-3" />
                                </button>
                            )}
                        </span>
                    ))}
                </div>
            )}

            {/* ── Trigger ───────────────────────────────────────────────── */}
            <Popover open={open} onOpenChange={setOpen}>
                <PopoverTrigger asChild>
                    <button
                        type="button"
                        disabled={disabled}
                        className={cn(
                            'flex h-9 w-full items-center justify-between rounded-md border border-input bg-transparent px-3 py-2 text-sm shadow-xs',
                            'text-muted-foreground hover:border-ring/50',
                            'focus:outline-none focus:border-ring focus:ring-3 focus:ring-ring/50',
                            'disabled:cursor-not-allowed disabled:opacity-50',
                        )}
                    >
                        <span className="truncate">{placeholder}</span>
                        <ChevronDown className="size-3.5 shrink-0 opacity-50" />
                    </button>
                </PopoverTrigger>

                {/* ── Dropdown ──────────────────────────────────────────── */}
                <PopoverContent
                    className="w-(--radix-popover-trigger-width) p-0"
                    align="start"
                    onOpenAutoFocus={e => e.preventDefault()}
                >
                    <Command shouldFilter={false}>
                        {/* Input de busca embutido */}
                        <div className="flex items-center border-b px-3">
                            <input
                                autoFocus
                                value={inputValue}
                                onChange={e => setInputValue(e.target.value)}
                                placeholder="Buscar tags..."
                                className="flex h-9 w-full bg-transparent py-2 text-sm outline-none placeholder:text-muted-foreground"
                            />
                        </div>

                        <CommandList className="max-h-44">
                            <CommandGroup>
                                {filteredTags.map(tag => (
                                    <CommandItem
                                        key={tag.id}
                                        value={tag.id}
                                        onSelect={() => toggle(tag)}
                                        data-checked={selectedIds.has(tag.id)}
                                    >
                                        <span
                                            className="mr-2 size-2.5 shrink-0 rounded-full"
                                            style={{ backgroundColor: tag.color }}
                                        />
                                        {tag.name}
                                    </CommandItem>
                                ))}

                                {showCreate && (
                                    <CommandItem
                                        value={`__create__${inputValue}`}
                                        onSelect={handleCreate}
                                        disabled={isCreating}
                                    >
                                        <Plus className="mr-1.5 size-3.5 shrink-0 text-muted-foreground" />
                                        Criar{' '}
                                        <strong className="ml-1">"{inputValue.trim()}"</strong>
                                    </CommandItem>
                                )}

                                {filteredTags.length === 0 && !showCreate && (
                                    <div className="py-4 text-center text-xs text-muted-foreground">
                                        {inputValue
                                            ? 'Nenhuma tag encontrada.'
                                            : 'Nenhuma tag cadastrada ainda.'}
                                    </div>
                                )}
                            </CommandGroup>
                        </CommandList>
                    </Command>
                </PopoverContent>
            </Popover>
        </div>
    )
}
