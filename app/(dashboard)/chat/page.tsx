'use client'

import { useState, useRef, useEffect, useCallback } from 'react'
import {
    Search, Filter, MessageCircle, Send, Loader2,
    Check, CheckCheck, Wifi, WifiOff,
    Phone, MoreVertical, X, User,
    ImageIcon, VideoIcon, FileIcon, MicIcon,
    Eye, EyeOff, ArrowUpDown, Clock, SortDesc,
    Users, MessageSquare, Inbox,
} from 'lucide-react'
import { formatDistanceToNow, format, isToday, isYesterday, startOfDay, subDays } from 'date-fns'
import { ptBR } from 'date-fns/locale'
import { toast } from 'sonner'
import { useQueryClient } from '@tanstack/react-query'

import { cn } from '@/lib/utils'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Checkbox } from '@/components/ui/checkbox'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import { Separator } from '@/components/ui/separator'
import { ScrollArea } from '@/components/ui/scroll-area'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import {
    Sheet, SheetContent, SheetHeader, SheetTitle,
} from '@/components/ui/sheet'
import {
    ContextMenu,
    ContextMenuContent,
    ContextMenuItem,
    ContextMenuSeparator,
    ContextMenuTrigger,
} from '@/components/ui/context-menu'

import { useEnterprise } from '@/hooks/use-enterprise'
import {
    useConversations, useMessages, useSendMessage, useChatSocket,
    type Conversation, type ChatMessage,
} from '@/services/chat'
import { useConnections } from '@/services/connections'
import { useLead } from '@/services/leads'
import { LeadSheet } from '@/components/lead-sheet'
import { keys } from '@/lib/keys'

// ─── Helpers ──────────────────────────────────────────────────────────────────

const AVATAR_COLORS = [
    'bg-violet-500', 'bg-blue-500', 'bg-green-500', 'bg-orange-500',
    'bg-pink-500', 'bg-teal-500', 'bg-amber-500', 'bg-rose-500',
]

function getAvatarColor(name: string) {
    let h = 0
    for (let i = 0; i < name.length; i++) h = name.charCodeAt(i) + ((h << 5) - h)
    return AVATAR_COLORS[Math.abs(h) % AVATAR_COLORS.length]
}

function getInitials(name: string) {
    return name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
}

function formatTime(dateStr: string) {
    const date = new Date(dateStr)
    if (isToday(date)) return format(date, 'HH:mm')
    if (isYesterday(date)) return 'Ontem'
    return format(date, 'dd/MM/yy')
}

function formatMessageTime(dateStr: string) {
    return format(new Date(dateStr), "HH:mm")
}

// ─── WhatsApp icon ────────────────────────────────────────────────────────────

function WhatsAppIcon({ className }: { className?: string }) {
    return (
        <svg viewBox="0 0 32 32" className={className} fill="currentColor" aria-hidden>
            <path d="M16 3C9.37 3 4 8.37 4 15c0 2.55.8 4.92 2.16 6.88L4 29l7.31-2.13A11.93 11.93 0 0 0 16 28c6.63 0 12-5.37 12-12S22.63 3 16 3zm0 2c5.52 0 10 4.48 10 10s-4.48 10-10 10a9.94 9.94 0 0 1-5.04-1.36l-.36-.22-4.33 1.27 1.27-4.22-.24-.38A9.94 9.94 0 0 1 6 15c0-5.52 4.48-10 10-10zm-2.5 5.5c-.28 0-.73.1-1.11.52-.38.42-1.45 1.42-1.45 3.46s1.49 4.01 1.7 4.29c.21.28 2.9 4.64 7.14 6.3.99.4 1.77.64 2.37.82.99.3 1.9.26 2.62.16.8-.12 2.47-1.01 2.82-1.99.35-.98.35-1.82.25-1.99-.1-.17-.38-.28-.8-.49-.42-.21-2.47-1.22-2.85-1.36-.38-.14-.66-.21-.94.21-.28.42-1.08 1.36-1.32 1.64-.24.28-.49.32-.91.1-.42-.21-1.77-.65-3.37-2.08-1.25-1.11-2.09-2.48-2.33-2.9-.24-.42-.03-.65.18-.86.19-.19.42-.49.63-.74.21-.25.28-.42.42-.7.14-.28.07-.52-.04-.73-.11-.21-.94-2.27-1.29-3.1-.34-.81-.69-.7-.94-.71l-.8-.01z" />
        </svg>
    )
}

// ─── Conversation item ────────────────────────────────────────────────────────

function ConversationItem({
    conv,
    isActive,
    onClick,
    isSelected,
    onSelect,
    selectionMode,
    onOpenLead,
    onMarkRead,
    onMarkUnread,
}: {
    conv: Conversation
    isActive: boolean
    onClick: () => void
    isSelected: boolean
    onSelect: () => void
    selectionMode: boolean
    onOpenLead: () => void
    onMarkRead: () => void
    onMarkUnread: () => void
}) {
    const isInbound = conv.lastMessage.direction === 'INBOUND'
    const isWhatsApp = conv.connection.type === 'WHATSAPP'

    return (
        <ContextMenu>
            <ContextMenuTrigger asChild>
                <div
                    className={cn(
                        'group relative w-full flex items-center gap-2 px-3 py-3 text-left transition-colors border-b border-border/40 cursor-pointer select-none',
                        'hover:bg-muted/60',
                        isActive && 'bg-primary/5 border-l-2 border-l-primary',
                        isSelected && 'bg-primary/10',
                    )}
                    onClick={onClick}
                >
                    {/* Checkbox de seleção */}
                    <div
                        className={cn(
                            'shrink-0 transition-all duration-150',
                            selectionMode ? 'w-5 opacity-100' : 'w-0 opacity-0 overflow-hidden group-hover:w-5 group-hover:opacity-100',
                        )}
                        onClick={e => { e.stopPropagation(); onSelect() }}
                    >
                        <Checkbox
                            checked={isSelected}
                            className="size-4"
                            onCheckedChange={() => onSelect()}
                        />
                    </div>

                    {/* Avatar */}
                    <div className="relative shrink-0">
                        {conv.lead.image ? (
                            <img src={conv.lead.image} alt={conv.lead.name} className="size-10 rounded-full object-cover" />
                        ) : (
                            <div className={cn(
                                'flex size-10 items-center justify-center rounded-full text-white text-xs font-semibold',
                                getAvatarColor(conv.lead.name),
                            )}>
                                {getInitials(conv.lead.name)}
                            </div>
                        )}
                        {isWhatsApp && (
                            <div className="absolute -bottom-0.5 -right-0.5 flex size-4 items-center justify-center rounded-full bg-green-500 ring-1 ring-background">
                                <WhatsAppIcon className="size-2.5 text-white" />
                            </div>
                        )}
                    </div>

                    {/* Content */}
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1 mb-0.5">
                            <span className={cn(
                                'text-sm truncate',
                                conv.unreadCount > 0 ? 'font-semibold' : 'font-medium',
                            )}>
                                {conv.lead.name}
                            </span>
                            <span className="text-[11px] text-muted-foreground shrink-0">
                                {formatTime(conv.lastMessage.sentAt)}
                            </span>
                        </div>
                        <div className="flex items-center justify-between gap-1">
                            <p className={cn(
                                'text-xs truncate flex-1',
                                conv.unreadCount > 0 ? 'text-foreground' : 'text-muted-foreground',
                            )}>
                                {!isInbound && (
                                    <span className="mr-1 text-muted-foreground">
                                        {conv.lastMessage.isRead ? <CheckCheck className="inline size-3 text-blue-500" /> : <Check className="inline size-3" />}
                                    </span>
                                )}
                                {conv.lastMessage.content
                                    ? (conv.lastMessage.content.length > 40
                                        ? conv.lastMessage.content.slice(0, 40) + '...'
                                        : conv.lastMessage.content)
                                    : <span className="italic opacity-60">Mídia</span>
                                }
                            </p>
                            {conv.unreadCount > 0 && (
                                <Badge className="h-4 min-w-4 px-1 text-[10px] shrink-0 bg-green-500 hover:bg-green-500 text-white rounded-full">
                                    {conv.unreadCount > 99 ? '99+' : conv.unreadCount}
                                </Badge>
                            )}
                        </div>
                    </div>
                </div>
            </ContextMenuTrigger>

            <ContextMenuContent className="w-52">
                <ContextMenuItem onClick={onClick}>
                    <MessageSquare className="size-4 mr-2" />
                    Abrir conversa
                </ContextMenuItem>
                <ContextMenuItem onClick={onOpenLead}>
                    <User className="size-4 mr-2" />
                    Ver dados do lead
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={onMarkRead}>
                    <Eye className="size-4 mr-2" />
                    Marcar como lido
                </ContextMenuItem>
                <ContextMenuItem onClick={onMarkUnread}>
                    <EyeOff className="size-4 mr-2" />
                    Marcar como não lido
                </ContextMenuItem>
                <ContextMenuSeparator />
                <ContextMenuItem onClick={() => { onSelect() }}>
                    <Users className="size-4 mr-2" />
                    {isSelected ? 'Desmarcar' : 'Selecionar'}
                </ContextMenuItem>
            </ContextMenuContent>
        </ContextMenu>
    )
}

// ─── Media content ────────────────────────────────────────────────────────────

function MediaContent({ mediaType, mediaUrl, content }: {
    mediaType: string
    mediaUrl: string | null | undefined
    content: string
}) {
    if (mediaType === 'image' || mediaType === 'sticker') {
        return mediaUrl ? (
            <a href={mediaUrl} target="_blank" rel="noopener noreferrer" className="block">
                <img
                    src={mediaUrl}
                    alt={content || 'Imagem'}
                    className="max-w-full rounded-xl object-cover"
                    style={{ maxHeight: 260 }}
                    onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                />
            </a>
        ) : (
            <div className="flex items-center gap-2 text-sm opacity-70">
                <ImageIcon className="size-4 shrink-0" />
                <span>{mediaType === 'sticker' ? 'Sticker' : 'Imagem'}</span>
            </div>
        )
    }

    if (mediaType === 'video' || mediaType === 'ptv') {
        return mediaUrl ? (
            <video
                src={mediaUrl}
                controls
                className="max-w-full rounded-xl"
                style={{ maxHeight: 260 }}
            />
        ) : (
            <div className="flex items-center gap-2 text-sm opacity-70">
                <VideoIcon className="size-4 shrink-0" />
                <span>Vídeo</span>
            </div>
        )
    }

    if (mediaType === 'audio' || mediaType === 'ptt') {
        return mediaUrl ? (
            <audio src={mediaUrl} controls className="w-full max-w-[260px]" />
        ) : (
            <div className="flex items-center gap-2 text-sm opacity-70">
                <MicIcon className="size-4 shrink-0" />
                <span>{mediaType === 'ptt' ? 'Áudio (PTT)' : 'Áudio'}</span>
            </div>
        )
    }

    if (mediaType === 'document') {
        return mediaUrl ? (
            <a
                href={mediaUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-2 px-1 py-0.5 rounded-lg hover:opacity-80 transition-opacity"
            >
                <div className="flex size-9 items-center justify-center rounded-lg bg-white/20 shrink-0">
                    <FileIcon className="size-4" />
                </div>
                <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{content || 'Documento'}</p>
                    <p className="text-xs opacity-60">Toque para abrir</p>
                </div>
            </a>
        ) : (
            <div className="flex items-center gap-2 text-sm opacity-70">
                <FileIcon className="size-4 shrink-0" />
                <span>{content || 'Documento'}</span>
            </div>
        )
    }

    return null
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({ msg, isFirst, isLast }: {
    msg: ChatMessage
    isFirst: boolean
    isLast: boolean
}) {
    const isOut = msg.direction === 'OUTBOUND'
    const hasMedia = !!msg.mediaType

    return (
        <div className={cn(
            'flex',
            isOut ? 'justify-end' : 'justify-start',
            isFirst ? 'mt-3' : 'mt-0.5',
        )}>
            <div className={cn(
                'max-w-[72%] text-sm rounded-2xl overflow-hidden',
                hasMedia ? 'px-2 pt-2 pb-1.5' : 'px-3 py-2',
                isOut
                    ? 'bg-primary text-primary-foreground rounded-br-sm'
                    : 'bg-muted text-foreground rounded-bl-sm',
                !isFirst && isOut && 'rounded-tr-lg',
                !isFirst && !isOut && 'rounded-tl-lg',
            )}>
                {hasMedia && (
                    <div className="mb-1">
                        <MediaContent
                            mediaType={msg.mediaType!}
                            mediaUrl={msg.mediaUrl}
                            content={msg.content}
                        />
                    </div>
                )}

                {msg.content && (
                    <p className="break-words leading-relaxed whitespace-pre-wrap px-1">{msg.content}</p>
                )}

                <div className={cn(
                    'flex items-center justify-end gap-1 mt-0.5 px-1',
                    isOut ? 'text-primary-foreground/70' : 'text-muted-foreground',
                )}>
                    <span className="text-[10px]">{formatMessageTime(msg.sentAt)}</span>
                    {isOut && (
                        msg.isRead
                            ? <CheckCheck className="size-3 text-blue-300" />
                            : <Check className="size-3" />
                    )}
                </div>
            </div>
        </div>
    )
}

// ─── Date separator ───────────────────────────────────────────────────────────

function DateSeparator({ date }: { date: string }) {
    const d = new Date(date)
    const label = isToday(d) ? 'Hoje'
        : isYesterday(d) ? 'Ontem'
            : format(d, "d 'de' MMMM 'de' yyyy", { locale: ptBR })

    return (
        <div className="flex items-center gap-3 my-4 px-4">
            <div className="flex-1 h-px bg-border" />
            <span className="text-xs text-muted-foreground shrink-0 bg-background px-2">{label}</span>
            <div className="flex-1 h-px bg-border" />
        </div>
    )
}

// ─── Chat window ──────────────────────────────────────────────────────────────

function ChatWindow({
    conv,
    enterpriseId,
}: {
    conv: Conversation
    enterpriseId: string
}) {
    const [input, setInput] = useState('')
    const [leadSheetOpen, setLeadSheetOpen] = useState(false)
    const messagesEndRef = useRef<HTMLDivElement>(null)
    const textareaRef = useRef<HTMLTextAreaElement>(null)

    const { data: messages = [], isLoading } = useMessages(enterpriseId, conv.connectionId, conv.leadId)
    const { mutate: send, isPending: sending } = useSendMessage()
    const { data: fullLead } = useLead(enterpriseId, conv.leadId, leadSheetOpen)

    useEffect(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
    }, [messages.length])

    useEffect(() => {
        const el = textareaRef.current
        if (!el) return
        el.style.height = 'auto'
        el.style.height = Math.min(el.scrollHeight, 120) + 'px'
    }, [input])

    function handleSend() {
        const content = input.trim()
        if (!content || sending) return

        send({
            enterpriseId,
            connectionId: conv.connectionId,
            leadId: conv.leadId,
            content,
        }, {
            onSuccess: () => setInput(''),
            onError: (err: unknown) => {
                const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error
                toast.error(msg ?? 'Falha ao enviar mensagem.')
            },
        })
    }

    function handleKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
        if (e.key === 'Enter' && !e.shiftKey) {
            e.preventDefault()
            handleSend()
        }
    }

    const grouped: { date: string; msgs: (ChatMessage & { isFirst: boolean; isLast: boolean })[] }[] = []

    messages.forEach((msg, i) => {
        const dateKey = format(new Date(msg.sentAt), 'yyyy-MM-dd')
        const prev = messages[i - 1]
        const next = messages[i + 1]
        const isFirst = !prev || prev.direction !== msg.direction || format(new Date(prev.sentAt), 'yyyy-MM-dd') !== dateKey
        const isLast = !next || next.direction !== msg.direction || format(new Date(next.sentAt), 'yyyy-MM-dd') !== dateKey

        const group = grouped.find(g => g.date === dateKey)
        if (group) {
            group.msgs.push({ ...msg, isFirst, isLast })
        } else {
            grouped.push({ date: dateKey, msgs: [{ ...msg, isFirst, isLast }] })
        }
    })

    const isConnected = conv.connection.status === 'CONNECTED'

    return (
        <div className="flex flex-col h-full">
            {/* Header */}
            <div className="flex items-center gap-3 px-4 py-3 border-b bg-background shrink-0">
                <div className="relative">
                    {conv.lead.image ? (
                        <img src={conv.lead.image} alt={conv.lead.name} className="size-9 rounded-full object-cover" />
                    ) : (
                        <div className={cn(
                            'flex size-9 items-center justify-center rounded-full text-white text-xs font-semibold',
                            getAvatarColor(conv.lead.name),
                        )}>
                            {getInitials(conv.lead.name)}
                        </div>
                    )}
                    {conv.connection.type === 'WHATSAPP' && (
                        <div className="absolute -bottom-0.5 -right-0.5 flex size-3.5 items-center justify-center rounded-full bg-green-500 ring-1 ring-background">
                            <WhatsAppIcon className="size-2 text-white" />
                        </div>
                    )}
                </div>

                <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold leading-tight truncate">{conv.lead.name}</p>
                    <p className="text-xs text-muted-foreground leading-tight flex items-center gap-1.5">
                        {conv.connection.name}
                        {isConnected
                            ? <span className="flex items-center gap-0.5 text-green-500"><Wifi className="size-3" /> Conectado</span>
                            : <span className="flex items-center gap-0.5 text-muted-foreground"><WifiOff className="size-3" /> Desconectado</span>
                        }
                    </p>
                </div>

                {conv.lead.phone && (
                    <Button size="icon" variant="ghost" className="size-8 text-muted-foreground">
                        <Phone className="size-4" />
                    </Button>
                )}
                <Button
                    size="icon"
                    variant="ghost"
                    className="size-8 text-muted-foreground"
                    onClick={() => setLeadSheetOpen(true)}
                    title="Ver dados do lead"
                >
                    <User className="size-4" />
                </Button>
                <Button size="icon" variant="ghost" className="size-8 text-muted-foreground">
                    <MoreVertical className="size-4" />
                </Button>
            </div>

            {/* Messages */}
            <div
                className="flex-1 overflow-y-auto px-4 py-2"
                style={{ backgroundImage: 'radial-gradient(circle, hsl(var(--muted)) 1px, transparent 1px)', backgroundSize: '24px 24px', backgroundPosition: '0 0' }}
            >
                {isLoading ? (
                    <div className="flex items-center justify-center h-full">
                        <Loader2 className="size-5 animate-spin text-muted-foreground" />
                    </div>
                ) : messages.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full gap-2 text-center">
                        <MessageCircle className="size-8 text-muted-foreground/50" />
                        <p className="text-sm text-muted-foreground">Nenhuma mensagem ainda</p>
                        <p className="text-xs text-muted-foreground/70">
                            Inicie a conversa enviando uma mensagem
                        </p>
                    </div>
                ) : (
                    grouped.map(({ date, msgs }) => (
                        <div key={date}>
                            <DateSeparator date={date} />
                            {msgs.map(msg => (
                                <MessageBubble key={msg.id} msg={msg} isFirst={msg.isFirst} isLast={msg.isLast} />
                            ))}
                        </div>
                    ))
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="border-t bg-background px-4 py-3 shrink-0">
                {!isConnected && (
                    <div className="flex items-center gap-2 mb-2 text-xs text-amber-600 bg-amber-500/10 rounded-lg px-3 py-2">
                        <WifiOff className="size-3.5 shrink-0" />
                        Conexão desconectada. Reconecte em Configurações → Conexões para enviar mensagens.
                    </div>
                )}
                <div className="flex items-end gap-2">
                    <textarea
                        ref={textareaRef}
                        value={input}
                        onChange={e => setInput(e.target.value)}
                        onKeyDown={handleKeyDown}
                        placeholder={isConnected ? 'Digite uma mensagem... (Enter para enviar)' : 'Conexão desconectada'}
                        disabled={!isConnected || sending}
                        rows={1}
                        className={cn(
                            'flex-1 resize-none rounded-xl border bg-muted/50 px-4 py-2.5 text-sm',
                            'placeholder:text-muted-foreground focus:outline-none focus:ring-1 focus:ring-ring',
                            'disabled:opacity-50 disabled:cursor-not-allowed',
                            'min-h-[40px] max-h-[120px] overflow-y-auto',
                        )}
                    />
                    <Button
                        size="icon"
                        className="rounded-xl size-10 shrink-0"
                        onClick={handleSend}
                        disabled={!input.trim() || !isConnected || sending}
                    >
                        {sending
                            ? <Loader2 className="size-4 animate-spin" />
                            : <Send className="size-4" />
                        }
                    </Button>
                </div>
                <p className="text-[10px] text-muted-foreground/60 mt-1.5 px-1">
                    Shift + Enter para quebrar linha
                </p>
            </div>

            <LeadSheet
                lead={fullLead ?? null}
                enterpriseId={enterpriseId}
                open={leadSheetOpen}
                onOpenChange={setLeadSheetOpen}
                onEdit={() => setLeadSheetOpen(false)}
            />
        </div>
    )
}

// ─── Empty state ──────────────────────────────────────────────────────────────

function EmptyState() {
    return (
        <div className="flex flex-col items-center justify-center h-full gap-4 text-center p-8">
            <div className="relative">
                <div className="flex size-20 items-center justify-center rounded-full bg-muted">
                    <MessageCircle className="size-10 text-muted-foreground/50" />
                </div>
                <div className="absolute -bottom-1 -right-1 flex size-8 items-center justify-center rounded-full bg-green-500/10">
                    <WhatsAppIcon className="size-5 text-green-500" />
                </div>
            </div>
            <div>
                <h2 className="text-base font-semibold">Conversas</h2>
                <p className="text-sm text-muted-foreground mt-1">
                    Acompanhe as conversas com seus leads
                </p>
            </div>
            <p className="text-xs text-muted-foreground/70 max-w-xs">
                Selecione uma conversa ao lado ou aguarde novas mensagens chegarem via WhatsApp
            </p>
        </div>
    )
}

// ─── Filter types ─────────────────────────────────────────────────────────────

type SortOrder = 'recent' | 'oldest' | 'unread_first'
type FilterPeriod = 'all' | 'today' | '7d' | '30d'

// ─── Filter panel ─────────────────────────────────────────────────────────────

function FilterPanel({
    open,
    onClose,
    connections,
    // Instâncias
    selectedConnections,
    onConnectionChange,
    filterConnectedOnly,
    onFilterConnectedOnlyChange,
    // Mensagens
    filterUnread,
    onFilterUnreadChange,
    filterWaiting,
    onFilterWaitingChange,
    // Período
    filterPeriod,
    onFilterPeriodChange,
    // Ordenação
    sortOrder,
    onSortOrderChange,
    // Limpar
    onClear,
    activeFilters,
}: {
    open: boolean
    onClose: () => void
    connections: { id: string; name: string; type: string; status: string }[]
    selectedConnections: string[]
    onConnectionChange: (id: string) => void
    filterConnectedOnly: boolean
    onFilterConnectedOnlyChange: (v: boolean) => void
    filterUnread: boolean
    onFilterUnreadChange: (v: boolean) => void
    filterWaiting: boolean
    onFilterWaitingChange: (v: boolean) => void
    filterPeriod: FilterPeriod
    onFilterPeriodChange: (v: FilterPeriod) => void
    sortOrder: SortOrder
    onSortOrderChange: (v: SortOrder) => void
    onClear: () => void
    activeFilters: number
}) {
    return (
        <Sheet open={open} onOpenChange={onClose}>
            <SheetContent side="left" className="w-80 flex flex-col p-0 gap-0">
                {/* Header */}
                <SheetHeader className="px-5 py-4 border-b shrink-0">
                    <div className="flex items-center justify-between">
                        <SheetTitle className="text-base">Filtros</SheetTitle>
                        {activeFilters > 0 && (
                            <Badge variant="secondary" className="text-xs px-2">
                                {activeFilters} {activeFilters === 1 ? 'ativo' : 'ativos'}
                            </Badge>
                        )}
                    </div>
                </SheetHeader>

                {/* Body com scroll */}
                <ScrollArea className="flex-1">
                    <div className="px-5 py-5 flex flex-col gap-6">

                        {/* ── Ordenação ─────────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <ArrowUpDown className="size-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Ordenação</p>
                            </div>
                            <RadioGroup
                                value={sortOrder}
                                onValueChange={v => onSortOrderChange(v as SortOrder)}
                                className="flex flex-col gap-1.5"
                            >
                                {[
                                    { value: 'recent', label: 'Mais recente' },
                                    { value: 'oldest', label: 'Mais antigo' },
                                    { value: 'unread_first', label: 'Não lidos primeiro' },
                                ].map(opt => (
                                    <div key={opt.value} className="flex items-center gap-2.5 py-1">
                                        <RadioGroupItem value={opt.value} id={`sort-${opt.value}`} />
                                        <Label htmlFor={`sort-${opt.value}`} className="text-sm cursor-pointer font-normal">
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <Separator />

                        {/* ── Período ───────────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Clock className="size-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Período</p>
                            </div>
                            <RadioGroup
                                value={filterPeriod}
                                onValueChange={v => onFilterPeriodChange(v as FilterPeriod)}
                                className="flex flex-col gap-1.5"
                            >
                                {[
                                    { value: 'all', label: 'Todos' },
                                    { value: 'today', label: 'Hoje' },
                                    { value: '7d', label: 'Últimos 7 dias' },
                                    { value: '30d', label: 'Últimos 30 dias' },
                                ].map(opt => (
                                    <div key={opt.value} className="flex items-center gap-2.5 py-1">
                                        <RadioGroupItem value={opt.value} id={`period-${opt.value}`} />
                                        <Label htmlFor={`period-${opt.value}`} className="text-sm cursor-pointer font-normal">
                                            {opt.label}
                                        </Label>
                                    </div>
                                ))}
                            </RadioGroup>
                        </div>

                        <Separator />

                        {/* ── Mensagens ─────────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <MessageCircle className="size-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Mensagens</p>
                            </div>
                            <div className="flex flex-col gap-3">
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="filter-unread" className="text-sm cursor-pointer font-normal">
                                        Apenas não lidas
                                    </Label>
                                    <Switch
                                        id="filter-unread"
                                        checked={filterUnread}
                                        onCheckedChange={onFilterUnreadChange}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <Label htmlFor="filter-waiting" className="text-sm cursor-pointer font-normal">
                                        Aguardando resposta
                                    </Label>
                                    <Switch
                                        id="filter-waiting"
                                        checked={filterWaiting}
                                        onCheckedChange={onFilterWaitingChange}
                                    />
                                </div>
                            </div>
                        </div>

                        <Separator />

                        {/* ── Instâncias ────────────────────────────────── */}
                        <div>
                            <div className="flex items-center gap-2 mb-3">
                                <Inbox className="size-3.5 text-muted-foreground" />
                                <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Instâncias</p>
                            </div>

                            {/* Somente conectadas */}
                            <div className="flex items-center justify-between mb-3">
                                <Label htmlFor="filter-connected" className="text-sm cursor-pointer font-normal">
                                    Somente conectadas
                                </Label>
                                <Switch
                                    id="filter-connected"
                                    checked={filterConnectedOnly}
                                    onCheckedChange={onFilterConnectedOnlyChange}
                                />
                            </div>

                            {connections.length === 0 ? (
                                <p className="text-xs text-muted-foreground">Nenhuma conexão ativa</p>
                            ) : (
                                <div className="flex flex-col gap-1">
                                    {connections.map(c => (
                                        <label
                                            key={c.id}
                                            className="flex items-center gap-2.5 cursor-pointer py-1.5 rounded-md px-1 hover:bg-muted/50 transition-colors"
                                        >
                                            <Checkbox
                                                checked={selectedConnections.includes(c.id)}
                                                onCheckedChange={() => onConnectionChange(c.id)}
                                                className="size-4"
                                            />
                                            <div className="flex items-center gap-2 flex-1 min-w-0">
                                                {c.type === 'WHATSAPP' && (
                                                    <WhatsAppIcon className="size-4 text-green-500 shrink-0" />
                                                )}
                                                <span className="text-sm truncate">{c.name}</span>
                                            </div>
                                            <span className={cn(
                                                'text-[10px] px-1.5 py-0.5 rounded-full font-medium shrink-0',
                                                c.status === 'CONNECTED'
                                                    ? 'bg-green-500/10 text-green-600'
                                                    : 'bg-muted text-muted-foreground',
                                            )}>
                                                {c.status === 'CONNECTED' ? 'ativo' : 'inativo'}
                                            </span>
                                        </label>
                                    ))}
                                </div>
                            )}
                        </div>
                    </div>
                </ScrollArea>

                {/* Footer */}
                <div className="px-5 py-4 border-t flex gap-2 shrink-0">
                    <Button
                        variant="outline"
                        className="flex-1"
                        onClick={onClear}
                        disabled={activeFilters === 0}
                    >
                        Limpar filtros
                    </Button>
                    <Button className="flex-1" onClick={onClose}>
                        Aplicar
                    </Button>
                </div>
            </SheetContent>
        </Sheet>
    )
}

// ─── Page ─────────────────────────────────────────────────────────────────────

type Tab = 'all' | 'unread' | 'waiting'

export default function ChatPage() {
    const { enterprise } = useEnterprise()
    const enterpriseId = enterprise?.id ?? ''
    const queryClient = useQueryClient()

    // UI state
    const [search, setSearch] = useState('')
    const [tab, setTab] = useState<Tab>('all')
    const [selectedConv, setSelectedConv] = useState<Conversation | null>(null)
    const [filterOpen, setFilterOpen] = useState(false)

    // Seleção em massa
    const [selected, setSelected] = useState<Set<string>>(new Set())
    const selectionMode = selected.size > 0

    // Filtros
    const [selectedConnections, setSelectedConnections] = useState<string[]>([])
    const [filterUnread, setFilterUnread] = useState(false)
    const [filterWaiting, setFilterWaiting] = useState(false)
    const [filterConnectedOnly, setFilterConnectedOnly] = useState(false)
    const [filterPeriod, setFilterPeriod] = useState<FilterPeriod>('all')
    const [sortOrder, setSortOrder] = useState<SortOrder>('recent')

    // Lead sheet aberto via context menu
    const [ctxLeadConv, setCtxLeadConv] = useState<Conversation | null>(null)
    const { data: ctxLead } = useLead(enterpriseId, ctxLeadConv?.leadId ?? '', !!ctxLeadConv)

    const { data: conversations = [], isLoading } = useConversations(enterpriseId, search || undefined)
    const { data: connections = [] } = useConnections(enterpriseId)

    useChatSocket(enterpriseId)

    // ── Filtros locais ──────────────────────────────────────────────────────

    const filtered = conversations
        .filter(c => {
            if (tab === 'unread' && c.unreadCount === 0) return false
            if (tab === 'waiting' && c.lastMessage.direction !== 'INBOUND') return false
            if (filterUnread && c.unreadCount === 0) return false
            if (filterWaiting && c.lastMessage.direction !== 'INBOUND') return false
            if (filterConnectedOnly && c.connection.status !== 'CONNECTED') return false
            if (selectedConnections.length > 0 && !selectedConnections.includes(c.connectionId)) return false
            if (filterPeriod !== 'all') {
                const cutoff = filterPeriod === 'today' ? startOfDay(new Date())
                    : filterPeriod === '7d' ? subDays(new Date(), 7)
                        : subDays(new Date(), 30)
                if (new Date(c.lastMessage.sentAt) < cutoff) return false
            }
            return true
        })
        .sort((a, b) => {
            if (sortOrder === 'unread_first') {
                if (b.unreadCount !== a.unreadCount) return b.unreadCount - a.unreadCount
            }
            if (sortOrder === 'oldest') {
                return new Date(a.lastMessage.sentAt).getTime() - new Date(b.lastMessage.sentAt).getTime()
            }
            return new Date(b.lastMessage.sentAt).getTime() - new Date(a.lastMessage.sentAt).getTime()
        })

    // ── Helpers ─────────────────────────────────────────────────────────────

    function convKey(conv: Conversation) {
        return `${conv.connectionId}:${conv.leadId}`
    }

    function toggleConnection(id: string) {
        setSelectedConnections(prev =>
            prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id],
        )
    }

    function toggleSelect(conv: Conversation) {
        const key = convKey(conv)
        setSelected(prev => {
            const next = new Set(prev)
            if (next.has(key)) next.delete(key)
            else next.add(key)
            return next
        })
    }

    // Marca como lido otimisticamente no cache
    // Usa setQueriesData com prefixo para cobrir qualquer variante da query (com/sem q)
    function markRead(convs: Conversation[]) {
        queryClient.setQueriesData<Conversation[]>(
            { queryKey: keys.chat.messages('all', enterpriseId) },
            (old = []) => old.map(c =>
                convs.some(x => convKey(x) === convKey(c))
                    ? { ...c, unreadCount: 0, lastMessage: { ...c.lastMessage, isRead: true } }
                    : c,
            ),
        )
    }

    function markUnread(convs: Conversation[]) {
        queryClient.setQueriesData<Conversation[]>(
            { queryKey: keys.chat.messages('all', enterpriseId) },
            (old = []) => old.map(c =>
                convs.some(x => convKey(x) === convKey(c))
                    ? { ...c, unreadCount: 1, lastMessage: { ...c.lastMessage, isRead: false } }
                    : c,
            ),
        )
    }

    function handleMarkSelectedRead() {
        const convs = filtered.filter(c => selected.has(convKey(c)))
        markRead(convs)
        setSelected(new Set())
    }

    function handleMarkSelectedUnread() {
        const convs = filtered.filter(c => selected.has(convKey(c)))
        markUnread(convs)
        setSelected(new Set())
    }

    function clearFilters() {
        setSelectedConnections([])
        setFilterUnread(false)
        setFilterWaiting(false)
        setFilterConnectedOnly(false)
        setFilterPeriod('all')
        setSortOrder('recent')
    }

    const totalUnread = conversations.reduce((acc, c) => acc + c.unreadCount, 0)
    const waitingCount = conversations.filter(c => c.lastMessage.direction === 'INBOUND' && c.unreadCount > 0).length
    const activeFilters = selectedConnections.length
        + (filterUnread ? 1 : 0)
        + (filterWaiting ? 1 : 0)
        + (filterConnectedOnly ? 1 : 0)
        + (filterPeriod !== 'all' ? 1 : 0)
        + (sortOrder !== 'recent' ? 1 : 0)

    return (
        <div className="flex h-full overflow-hidden">
            {/* ── Left panel ─────────────────────────────────────────────── */}
            <div className="flex flex-col w-[300px] shrink-0 border-r bg-background">

                {/* Search + filter */}
                <div className="flex items-center gap-2 px-3 py-3 border-b shrink-0">
                    <div className="relative flex-1">
                        <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 size-3.5 text-muted-foreground pointer-events-none" />
                        <Input
                            placeholder="Pesquisar..."
                            value={search}
                            onChange={e => setSearch(e.target.value)}
                            className="pl-8 h-8 text-sm"
                        />
                        {search && (
                            <button
                                onClick={() => setSearch('')}
                                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                            >
                                <X className="size-3.5" />
                            </button>
                        )}
                    </div>
                    <Button
                        size="icon"
                        variant="outline"
                        className={cn('size-8 shrink-0 relative', activeFilters > 0 && 'border-primary text-primary')}
                        onClick={() => setFilterOpen(true)}
                    >
                        <Filter className="size-3.5" />
                        {activeFilters > 0 && (
                            <span className="absolute -top-1 -right-1 flex size-4 items-center justify-center rounded-full bg-primary text-primary-foreground text-[9px] font-bold">
                                {activeFilters}
                            </span>
                        )}
                    </Button>
                </div>

                {/* Status tabs */}
                <div className="flex border-b shrink-0">
                    {([
                        { id: 'all' as Tab, label: 'Todos', count: conversations.length },
                        { id: 'unread' as Tab, label: 'Não lidos', count: totalUnread },
                        { id: 'waiting' as Tab, label: 'Aguardando', count: waitingCount },
                    ]).map(t => (
                        <button
                            key={t.id}
                            onClick={() => setTab(t.id)}
                            className={cn(
                                'flex-1 flex items-center justify-center gap-1.5 py-2.5 text-xs font-medium transition-colors border-b-2',
                                tab === t.id
                                    ? 'text-primary border-primary'
                                    : 'text-muted-foreground border-transparent hover:text-foreground',
                            )}
                        >
                            {t.label}
                            {t.count > 0 && (
                                <span className={cn(
                                    'px-1.5 py-0.5 rounded-full text-[10px]',
                                    tab === t.id ? 'bg-primary/10 text-primary' : 'bg-muted text-muted-foreground',
                                )}>
                                    {t.count}
                                </span>
                            )}
                        </button>
                    ))}
                </div>

                {/* Toolbar de seleção em massa */}
                {selectionMode && (
                    <div className="flex items-center gap-1.5 px-3 py-2 bg-primary/5 border-b shrink-0">
                        <span className="flex-1 text-xs font-medium text-primary">
                            {selected.size} {selected.size === 1 ? 'selecionado' : 'selecionados'}
                        </span>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={handleMarkSelectedRead}
                            title="Marcar como lido"
                        >
                            <Eye className="size-3.5" />
                            Lido
                        </Button>
                        <Button
                            size="sm"
                            variant="ghost"
                            className="h-7 px-2 text-xs gap-1"
                            onClick={handleMarkSelectedUnread}
                            title="Marcar como não lido"
                        >
                            <EyeOff className="size-3.5" />
                            Não lido
                        </Button>
                        <Button
                            size="icon"
                            variant="ghost"
                            className="size-7"
                            onClick={() => setSelected(new Set())}
                            title="Cancelar seleção"
                        >
                            <X className="size-3.5" />
                        </Button>
                    </div>
                )}

                {/* Conversation list */}
                <div className="flex-1 overflow-y-auto">
                    {isLoading ? (
                        <div className="flex items-center justify-center h-24">
                            <Loader2 className="size-5 animate-spin text-muted-foreground" />
                        </div>
                    ) : filtered.length === 0 ? (
                        <div className="flex flex-col items-center justify-center h-40 gap-2 text-center px-4">
                            <MessageCircle className="size-8 text-muted-foreground/40" />
                            <p className="text-sm text-muted-foreground">
                                {conversations.length === 0
                                    ? 'Sem conversas iniciadas'
                                    : 'Nenhuma conversa com esses filtros'
                                }
                            </p>
                        </div>
                    ) : (
                        filtered.map(conv => (
                            <ConversationItem
                                key={convKey(conv)}
                                conv={conv}
                                isActive={
                                    selectedConv?.connectionId === conv.connectionId &&
                                    selectedConv?.leadId === conv.leadId
                                }
                                onClick={() => {
                                    if (selectionMode) { toggleSelect(conv); return }
                                    setSelectedConv(conv)
                                }}
                                isSelected={selected.has(convKey(conv))}
                                onSelect={() => toggleSelect(conv)}
                                selectionMode={selectionMode}
                                onOpenLead={() => setCtxLeadConv(conv)}
                                onMarkRead={() => markRead([conv])}
                                onMarkUnread={() => markUnread([conv])}
                            />
                        ))
                    )}
                </div>
            </div>

            {/* ── Right panel ────────────────────────────────────────────── */}
            <div className="flex-1 min-w-0">
                {selectedConv
                    ? <ChatWindow conv={selectedConv} enterpriseId={enterpriseId} />
                    : <EmptyState />
                }
            </div>

            {/* Filter panel */}
            <FilterPanel
                open={filterOpen}
                onClose={() => setFilterOpen(false)}
                connections={connections}
                selectedConnections={selectedConnections}
                onConnectionChange={toggleConnection}
                filterConnectedOnly={filterConnectedOnly}
                onFilterConnectedOnlyChange={setFilterConnectedOnly}
                filterUnread={filterUnread}
                onFilterUnreadChange={setFilterUnread}
                filterWaiting={filterWaiting}
                onFilterWaitingChange={setFilterWaiting}
                filterPeriod={filterPeriod}
                onFilterPeriodChange={setFilterPeriod}
                sortOrder={sortOrder}
                onSortOrderChange={setSortOrder}
                onClear={clearFilters}
                activeFilters={activeFilters}
            />

            {/* Lead sheet aberto via context menu */}
            <LeadSheet
                lead={ctxLead ?? null}
                enterpriseId={enterpriseId}
                open={!!ctxLeadConv}
                onOpenChange={open => { if (!open) setCtxLeadConv(null) }}
                onEdit={() => setCtxLeadConv(null)}
            />
        </div>
    )
}
