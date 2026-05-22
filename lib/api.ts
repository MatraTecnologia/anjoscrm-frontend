import axios from 'axios'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    withCredentials: true,
    timeout: 120_000, // 2min — GPT-4o Vision pode demorar com imagens grandes
    headers: {
        'Content-Type': 'application/json',
        'ngrok-skip-browser-warning': 'true',
    },
})

// Interceptor global de erro — extrai mensagem e redireciona em 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status: number | undefined = error?.response?.status
        const url: string = error?.config?.url ?? ''

        // 401 fora dos endpoints de autenticação → sessão expirada, redireciona para login após breve delay
        if (status === 401 && !url.includes('/auth/')) {
            if (typeof window !== 'undefined') {
                const { pathname } = window.location
                if (pathname !== '/login' && pathname !== '/register') {
                    // Delay para permitir que o toast de erro seja exibido antes do redirect
                    setTimeout(() => window.location.replace('/login'), 1500)
                }
            }
        }

        const message =
            error?.response?.data?.error ??
            error?.response?.data?.message ??
            'Erro inesperado. Tente novamente.'
        return Promise.reject(new Error(message))
    },
)
