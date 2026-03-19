'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { useEffect } from 'react'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'
import { getSocket } from '@/lib/socket'

// ─── Types ────────────────────────────────────────────────────────────────────

export type ChatMessage = {
    id: string
    connectionId: string
    leadId: string
    content: string
    direction: 'INBOUND' | 'OUTBOUND'
    isRead: boolean
    sentAt: string
    createdAt: string
    mediaType?: string | null   // image | video | audio | ptt | ptv | document | sticker
    mediaUrl?: string | null    // URL pública do arquivo (após download pela uazapiGO)
    externalId?: string | null  // ID da mensagem no uazapiGO
}

export type Conversation = {
    connectionId: string
    leadId: string
    lead: { id: string; name: string; phone: string | null; image: string | null }
    connection: { id: string; name: string; type: string; status: string }
    lastMessage: {
        content: string
        direction: 'INBOUND' | 'OUTBOUND'
        sentAt: string
        isRead: boolean
    }
    unreadCount: number
}

// ─── API ──────────────────────────────────────────────────────────────────────

async function listConversationsFn(enterpriseId: string, q?: string): Promise<Conversation[]> {
    const { data } = await api.get<Conversation[]>(`/chat/${enterpriseId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
        params: q ? { q } : undefined,
    })
    return data
}

async function getMessagesFn(enterpriseId: string, connectionId: string, leadId: string): Promise<ChatMessage[]> {
    const { data } = await api.get<ChatMessage[]>(`/chat/${enterpriseId}/${connectionId}/${leadId}`, {
        headers: { 'X-Enterprise-Id': enterpriseId },
    })
    return data
}

async function sendMessageFn({
    enterpriseId,
    connectionId,
    leadId,
    content,
}: {
    enterpriseId: string
    connectionId: string
    leadId: string
    content: string
}): Promise<ChatMessage> {
    const { data } = await api.post<ChatMessage>(
        `/chat/${enterpriseId}/${connectionId}/${leadId}`,
        { content },
        { headers: { 'X-Enterprise-Id': enterpriseId } },
    )
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useConversations(enterpriseId: string, q?: string) {
    return useQuery({
        queryKey: [...keys.chat.messages('all', enterpriseId), q],
        queryFn: () => listConversationsFn(enterpriseId, q),
        enabled: !!enterpriseId,
        refetchInterval: 10000, // fallback polling se socket não conectar
    })
}

export function useMessages(enterpriseId: string, connectionId: string, leadId: string) {
    return useQuery({
        queryKey: keys.chat.messages(connectionId, leadId),
        queryFn: () => getMessagesFn(enterpriseId, connectionId, leadId),
        enabled: !!enterpriseId && !!connectionId && !!leadId,
    })
}

export function useSendMessage() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: sendMessageFn,
        onSuccess: (data, { enterpriseId, connectionId, leadId }) => {
            // Adicionar mensagem otimisticamente ao cache
            queryClient.setQueryData<ChatMessage[]>(
                keys.chat.messages(connectionId, leadId),
                (old = []) => [...old, data],
            )
            // Invalidar lista de conversas para atualizar last message
            queryClient.invalidateQueries({
                queryKey: keys.chat.messages('all', enterpriseId),
            })
        },
    })
}

// Hook de socket para receber mensagens em tempo real
export function useChatSocket(enterpriseId: string) {
    const queryClient = useQueryClient()

    useEffect(() => {
        if (!enterpriseId) return

        const socket = getSocket()
        socket.emit('join-enterprise', enterpriseId)

        function onChatMessage(data: {
            connectionId: string
            leadId: string
            message: ChatMessage
        }) {
            // Adicionar ao cache de mensagens da conversa ativa
            queryClient.setQueryData<ChatMessage[]>(
                keys.chat.messages(data.connectionId, data.leadId),
                (old = []) => {
                    // Evitar duplicatas
                    if (old.some(m => m.id === data.message.id)) return old
                    return [...old, data.message]
                },
            )
            // Invalidar lista de conversas (unread count + last message)
            queryClient.invalidateQueries({
                queryKey: keys.chat.messages('all', enterpriseId),
            })
        }

        socket.on('chat:message', onChatMessage)

        return () => {
            socket.off('chat:message', onChatMessage)
            socket.emit('leave-enterprise', enterpriseId)
        }
    }, [enterpriseId, queryClient])
}
