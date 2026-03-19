import axios from 'axios'

export const api = axios.create({
    baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:3333',
    withCredentials: true, // necessário para cookies de sessão do Better Auth
    headers: { 'Content-Type': 'application/json' },
})

// Interceptor global de erro — extrai mensagem e redireciona em 401
api.interceptors.response.use(
    (response) => response,
    (error) => {
        const status: number | undefined = error?.response?.status
        const url: string = error?.config?.url ?? ''

        // 401 fora dos endpoints de autenticação → sessão expirada, redireciona para login
        if (status === 401 && !url.includes('/auth/')) {
            if (typeof window !== 'undefined') {
                const { pathname } = window.location
                if (pathname !== '/login' && pathname !== '/register') {
                    window.location.replace('/login')
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
