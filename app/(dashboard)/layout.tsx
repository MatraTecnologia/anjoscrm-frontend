'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useState, useEffect } from 'react'
import {
    LayoutDashboard,
    Filter,
    Users,
    Rocket,
    GitBranch,
    MessageCircle,
    Calendar,
    Bell,
    Settings,
    Globe,
    ChevronsLeft,
    ChevronsRight,
    ChevronDown,
    Building2,
    Activity,
} from 'lucide-react'

import { useSession } from '@/services/auth'
import { useVerify } from '@/services/enterprises'
import { cn } from '@/lib/utils'

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pipeline', icon: Filter, label: 'Funil' },
    { href: '/leads', icon: Users, label: 'Leads' },
    { href: '/campaigns', icon: Rocket, label: 'Campanhas' },
    { href: '/integrations', icon: GitBranch, label: 'Integrações' },
    { href: '/chat', icon: MessageCircle, label: 'Chat' },
    { href: '/historico', icon: Activity, label: 'Histórico' },
]

const bottomItems = [
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
    { href: '/notifications', icon: Bell, label: 'Notificações' },
    { href: '/connections', icon: Globe, label: 'Conexões' },
    { href: '/settings', icon: Settings, label: 'Configurações' },
]

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, isLoading: sessionLoading } = useSession()
    const { data: verify } = useVerify()

    useEffect(() => {
        if (!sessionLoading && !session) {
            router.replace('/login')
        }
    }, [session, sessionLoading, router])

    const [expanded, setExpanded] = useState(false)

    // Aguarda sessão — evita renderizar o dashboard sem auth
    if (sessionLoading || !session) return null

    const initials = session?.user.name
        ? session.user.name.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase()
        : 'U'

    const enterprise = verify?.enterprises?.[0]
    const workspaceName = enterprise?.name ?? 'Minha empresa'
    const workspaceInitial = workspaceName[0]?.toUpperCase() ?? 'M'

    return (
        <div className="flex  overflow-hidden bg-background min-h-screen max-h-screen">
            {/* Sidebar */}
            <aside
                className={cn(
                    'flex flex-col shrink-0 border-r bg-background transition-all duration-200 ease-in-out overflow-hidden',
                    expanded ? 'w-52' : 'w-13',
                )}
            >
                {/* ── Workspace ─────────────────────────────────────── */}
                <div className={cn(
                    'flex items-center border-b h-12 shrink-0 px-2 gap-2',
                    expanded ? 'justify-between' : 'justify-center',
                )}>
                    <button className={cn(
                        'flex items-center gap-2 min-w-0 rounded p-1 hover:bg-muted transition-colors',
                        expanded ? 'flex-1' : '',
                    )}>
                        {enterprise?.logo
                            ? <img src={enterprise.logo} alt={workspaceName} className="size-6 rounded object-cover shrink-0" />
                            : (
                                <div className="flex size-6 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-bold">
                                    {workspaceInitial}
                                </div>
                            )
                        }
                        {expanded && (
                            <>
                                <span className="text-sm font-medium truncate flex-1 text-left">{workspaceName}</span>
                                <ChevronDown className="size-3.5 text-muted-foreground shrink-0" />
                            </>
                        )}
                    </button>

                    {expanded && (
                        <button
                            onClick={() => setExpanded(false)}
                            title="Recolher"
                            className="flex size-6 items-center justify-center rounded text-muted-foreground hover:text-foreground hover:bg-muted transition-colors shrink-0"
                        >
                            <ChevronsLeft className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* ── Nav ───────────────────────────────────────────── */}
                <nav className="flex flex-col gap-1 flex-1 p-2">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={expanded ? undefined : label}
                                className={cn(
                                    'relative flex items-center gap-3 rounded px-2.5 py-3 text-sm transition-colors',
                                    'text-muted-foreground hover:text-foreground hover:bg-muted',
                                    isActive && 'text-primary bg-primary/10 font-medium',
                                    !expanded && 'justify-center',
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-primary" />
                                )}
                                <Icon className="size-5 shrink-0" />
                                {expanded && <span className="truncate">{label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* ── Bottom utils ──────────────────────────────────── */}
                <div className="flex flex-col gap-1 px-2 pb-1">
                    {!expanded && (
                        <button
                            onClick={() => setExpanded(true)}
                            title="Expandir"
                            className="flex items-center justify-center rounded py-3 px-2.5 text-muted-foreground hover:text-foreground hover:bg-muted transition-colors"
                        >
                            <ChevronsRight className="size-5" />
                        </button>
                    )}

                    {bottomItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={expanded ? undefined : label}
                                className={cn(
                                    'relative flex items-center gap-3 rounded px-2.5 py-3 text-sm transition-colors',
                                    'text-muted-foreground hover:text-foreground hover:bg-muted',
                                    isActive && 'text-primary bg-primary/10 font-medium',
                                    !expanded && 'justify-center',
                                )}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-6 rounded-r bg-primary" />
                                )}
                                <Icon className="size-5 shrink-0" />
                                {expanded && <span className="truncate">{label}</span>}
                            </Link>
                        )
                    })}
                </div>

                {/* ── Profile ───────────────────────────────────────── */}
                <Link
                    href="/settings/profile"
                    title={expanded ? undefined : session?.user.name ?? 'Perfil'}
                    className={cn(
                        'flex items-center gap-2.5 border-t px-2 py-3 shrink-0 hover:bg-muted transition-colors',
                        !expanded && 'justify-center',
                        pathname.startsWith('/settings') && 'bg-muted',
                    )}
                >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded bg-primary text-primary-foreground text-xs font-semibold overflow-hidden">
                        {session?.user.image
                            ? <img src={session.user.image} alt={session.user.name} className="size-full object-cover" />
                            : initials
                        }
                    </div>
                    {expanded && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-tight">{session?.user.name ?? 'Usuário'}</p>
                            <p className="text-xs text-muted-foreground truncate leading-tight">{session?.user.email ?? ''}</p>
                        </div>
                    )}
                </Link>
            </aside>

            {/* Main */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                {children}
            </div>
        </div>
    )
}
