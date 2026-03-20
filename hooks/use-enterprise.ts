import { useVerify } from '@/services/enterprises'

const STORAGE_KEY = 'anjoscrm:active-enterprise'

export function getActiveEnterpriseId(enterprises: { id: string }[]): string {
    if (typeof window === 'undefined') return enterprises[0]?.id ?? ''
    const stored = localStorage.getItem(STORAGE_KEY)
    if (stored && enterprises.some(e => e.id === stored)) return stored
    return enterprises[0]?.id ?? ''
}

export function setActiveEnterpriseId(id: string) {
    localStorage.setItem(STORAGE_KEY, id)
}

export function useEnterprise() {
    const { data: verify, isLoading } = useVerify()
    const enterprises = verify?.enterprises ?? []
    const activeId = getActiveEnterpriseId(enterprises)
    const enterprise = enterprises.find(e => e.id === activeId) ?? enterprises[0] ?? null
    return { enterprise, enterprises, isLoading }
}
