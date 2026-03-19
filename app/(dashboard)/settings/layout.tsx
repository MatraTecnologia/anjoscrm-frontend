'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import {
    User,
    CreditCard,
    Building2,
    Tag,
    Package,
    TrendingDown,
    List,
    LayoutGrid,
    Users,
    UserCheck,
    Clock,
    Activity,
    Plug,
    Wifi,
    ChevronLeft,
    ChevronRight,
} from 'lucide-react'
import { cn } from '@/lib/utils'

const settingsNav = [
    { href: '/settings/profile', icon: User, label: 'Meu perfil' },
    { href: '/settings/billing', icon: CreditCard, label: 'Planos e uso' },
    { href: '/settings/enterprise', icon: Building2, label: 'Empresa' },
    { href: '/settings/atendentes', icon: UserCheck, label: 'Atendentes' },
    { href: '/settings/tags', icon: Tag, label: 'Tags' },
    { href: '/settings/products', icon: Package, label: 'Produtos' },
    { href: '/settings/loss-reasons', icon: TrendingDown, label: 'Motivos de perda' },
    { href: '/settings/lists', icon: List, label: 'Listas' },
    { href: '/settings/custom-fields', icon: LayoutGrid, label: 'Campos adicionais' },
    { href: '/settings/departments', icon: Users, label: 'Departamentos' },
    { href: '/settings/work-hours', icon: Clock, label: 'Horários de trabalho' },
    { href: '/settings/activity-types', icon: Activity, label: 'Tipos de atividades' },
    { href: "/settings/history-all", icon: Activity, label: "Histórico" },
    { href: '/settings/integrations', icon: Plug, label: 'Integrações' },
    { href: '/settings/connections', icon: Wifi, label: 'Conexões' },
]

export default function SettingsLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const [collapsed, setCollapsed] = useState(false)

    return (
        <div className="flex flex-1 min-h-0">
            {/* ── Settings sidebar ───────────────────────────────────────── */}
            <aside
                className={cn(
                    'shrink-0 border-r flex flex-col py-4 transition-all duration-200 relative',
                    collapsed ? 'w-14 px-2' : 'w-56 px-3'
                )}
            >
                {/* Título */}
                {!collapsed && (
                    <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-2 mb-3">
                        Configurações
                    </p>
                )}

                {/* Nav items */}
                <nav className="flex flex-col gap-0.5 flex-1">
                    {settingsNav.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={collapsed ? label : undefined}
                                className={cn(
                                    'flex items-center gap-2.5 px-2 py-2 rounded-md text-sm transition-colors',
                                    isActive
                                        ? 'bg-muted text-foreground font-medium'
                                        : 'text-muted-foreground hover:text-foreground hover:bg-muted/60',
                                    collapsed && 'justify-center px-0'
                                )}
                            >
                                <Icon className="size-4 shrink-0" />
                                {!collapsed && <span className="truncate">{label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* Botão de collapse — flutuando na borda direita */}
                <button
                    type="button"
                    onClick={() => setCollapsed(v => !v)}
                    title={collapsed ? 'Expandir' : 'Recolher'}
                    className="absolute -right-3 top-1/2 -translate-y-1/2 z-10 flex items-center justify-center size-6 rounded-full border bg-background text-muted-foreground hover:text-foreground shadow-sm transition-colors"
                >
                    {collapsed
                        ? <ChevronRight className="size-3" />
                        : <ChevronLeft className="size-3" />
                    }
                </button>
            </aside>

            {/* ── Content ─────────────────────────────────────────────────── */}
            <div className="flex-1 overflow-auto">
                {children}
            </div>
        </div>
    )
}
