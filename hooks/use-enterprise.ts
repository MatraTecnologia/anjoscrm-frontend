import { useVerify } from '@/services/enterprises'

export function useEnterprise() {
    const { data: verify, isLoading } = useVerify()
    const enterprise = verify?.enterprises?.[0] ?? null
    return { enterprise, isLoading }
}
