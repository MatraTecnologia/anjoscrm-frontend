'use client'

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { api } from '@/lib/api'
import { keys } from '@/lib/keys'

// ─── Types ────────────────────────────────────────────────────────────────────

export type SignInPayload = {
    email: string
    password: string
    rememberMe?: boolean
}

export type SignUpPayload = {
    name: string
    email: string
    password: string
    phone?: string
}

export type Session = {
    user: {
        id: string
        name: string
        email: string
        image: string | null
        phone: string | null
        emailVerified: boolean
        role: string | null
        createdAt: string
    }
    session: {
        id: string
        token: string
        expiresAt: string
    }
}

// ─── API (privado) ─────────────────────────────────────────────────────────────

async function signInFn(payload: SignInPayload): Promise<Session> {
    const { data } = await api.post<Session>('/auth/sign-in/email', payload)
    return data
}

async function signUpFn(payload: SignUpPayload): Promise<Session> {
    const { data } = await api.post<Session>('/auth/sign-up/email', payload)
    return data
}

async function signOutFn(): Promise<void> {
    await api.post('/auth/sign-out')
}

async function getSessionFn(): Promise<Session | null> {
    const { data } = await api.get<Session>('/auth/get-session')
    return data
}

// ─── Hooks ────────────────────────────────────────────────────────────────────

export function useSession() {
    return useQuery({
        queryKey: keys.auth.session(),
        queryFn: getSessionFn,
        retry: false,
        staleTime: 1000 * 60 * 5, // 5 min
    })
}

export function useSignIn() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: signInFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.auth.session(), data)
        },
    })
}

export function useSignUp() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: signUpFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.auth.session(), data)
        },
    })
}

export function useSignOut() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: signOutFn,
        onSuccess: () => {
            queryClient.setQueryData(keys.auth.session(), null)
            queryClient.clear()
        },
    })
}

async function resendVerificationEmailFn(email: string): Promise<void> {
    await api.post('/auth/send-verification-email', { email })
}

async function sendMagicLinkFn(email: string): Promise<void> {
    await api.post('/auth/sign-in/magic-link', { email })
}

async function sendSignInOTPFn(email: string): Promise<void> {
    await api.post('/auth/email-otp/send-verification-otp', { email, type: 'sign-in' })
}

async function signInWithOTPFn({ email, otp }: { email: string; otp: string }): Promise<Session> {
    const { data } = await api.post<Session>('/auth/sign-in/email-otp', { email, otp })
    return data
}

export function useResendVerification() {
    return useMutation({
        mutationFn: resendVerificationEmailFn,
    })
}

export function useSendMagicLink() {
    return useMutation({
        mutationFn: sendMagicLinkFn,
    })
}

export function useSendSignInOTP() {
    return useMutation({
        mutationFn: sendSignInOTPFn,
    })
}

export function useSignInWithOTP() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: signInWithOTPFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.auth.session(), data)
        },
    })
}

async function updateProfileFn(payload: { name?: string; phone?: string | null }): Promise<Session> {
    const { data } = await api.patch<Session>('/users/me', payload)
    return data
}

async function deleteAccountFn(): Promise<void> {
    await api.delete('/users/me')
}

async function changePasswordFn(payload: { currentPassword: string; newPassword: string }): Promise<void> {
    await api.post('/auth/change-password', payload)
}

export function useUpdateProfile() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: updateProfileFn,
        onSuccess: (data) => {
            queryClient.setQueryData(keys.auth.session(), data)
        },
    })
}

export function useDeleteAccount() {
    const queryClient = useQueryClient()
    return useMutation({
        mutationFn: deleteAccountFn,
        onSuccess: () => {
            queryClient.clear()
        },
    })
}

export function useChangePassword() {
    return useMutation({ mutationFn: changePasswordFn })
}
