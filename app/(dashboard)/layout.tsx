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
    Activity,
    Bot,
    Zap,
} from 'lucide-react'

import { AnimatePresence, motion } from 'framer-motion'
import { useSession } from '@/services/auth'
import { useEnterprise } from '@/hooks/use-enterprise'
import { EnterpriseSwitcher } from '@/components/enterprise-switcher'
import { cn } from '@/lib/utils'
import { VoipStoreProvider, useVoipStore } from '@/stores/voip-store'
import { VoipCallPanel } from '@/components/voip-call-panel'

const navItems = [
    { href: '/dashboard', icon: LayoutDashboard, label: 'Dashboard' },
    { href: '/pipeline', icon: Filter, label: 'Funil' },
    { href: '/leads', icon: Users, label: 'Leads' },
    { href: '/chat', icon: MessageCircle, label: 'Chat' },
    { href: '/ia', icon: Bot, label: 'Minhas IAs' }]

const bottomItems = [
    { href: '/agenda', icon: Calendar, label: 'Agenda' },
    { href: '/notifications', icon: Bell, label: 'Notificações' },
    { href: '/connections', icon: Globe, label: 'Conexões' },
    { href: '/settings', icon: Settings, label: 'Configurações' },
]

function GlobalVoipPanel() {
    const { activeCall, endCall } = useVoipStore()
    if (!activeCall) return null
    return (
        <VoipCallPanel
            phone={activeCall.phone}
            leadName={activeCall.leadName}
            enterpriseId={activeCall.enterpriseId}
            onClose={endCall}
        />
    )
}

function DashboardLayoutInner({ children }: { children: React.ReactNode }) {
    const pathname = usePathname()
    const router = useRouter()
    const { data: session, isLoading: sessionLoading } = useSession()
    const { enterprise, enterprises } = useEnterprise()

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

    return (
        <div
            className="flex overflow-hidden min-h-screen max-h-screen"
            style={{
                backgroundImage: 'url(/background.png)',
                backgroundSize: 'cover',
                backgroundPosition: 'center',
                backgroundAttachment: 'fixed',
                backgroundColor: '#060d1c',
            }}
        >
            {/* Sidebar */}
            <aside
                className={cn(
                    'relative flex flex-col shrink-0 border-r transition-all duration-200 ease-in-out overflow-hidden z-20',
                    expanded ? 'w-52' : 'w-13',
                )}
                style={{
                    background: 'rgba(4, 8, 20, 0.85)',
                    backdropFilter: 'blur(20px)',
                    borderRight: '1px solid rgba(255,255,255,0.07)',
                }}
            >
                {/* ── Workspace ─────────────────────────────────────── */}
                <div className={cn(
                    'flex items-center h-12 shrink-0 px-2 gap-2',
                    expanded ? 'justify-between' : 'justify-center',
                )}
                    style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <EnterpriseSwitcher
                        enterprises={enterprises}
                        activeId={enterprise?.id ?? ''}
                        expanded={expanded}
                    />
                    {expanded && (
                        <button
                            onClick={() => setExpanded(false)}
                            title="Recolher"
                            className="flex size-6 items-center justify-center rounded text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors shrink-0"
                        >
                            <ChevronsLeft className="size-3.5" />
                        </button>
                    )}
                </div>

                {/* ── Nav ───────────────────────────────────────────── */}
                <nav className="flex flex-col gap-0.5 flex-1 p-2">
                    {navItems.map(({ href, icon: Icon, label }) => {
                        const isActive = pathname === href || pathname.startsWith(href + '/')
                        return (
                            <Link
                                key={href}
                                href={href}
                                title={expanded ? undefined : label}
                                className={cn(
                                    'relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-all',
                                    isActive
                                        ? 'text-white font-medium'
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                                    !expanded && 'justify-center',
                                )}
                                style={isActive ? {
                                    background: 'rgba(37,99,235,0.18)',
                                    boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.25)',
                                } : {}}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                                        style={{ background: 'linear-gradient(180deg, #60a5fa, #2563eb)' }} />
                                )}
                                <Icon className={cn('size-4 shrink-0', isActive ? 'text-blue-400' : '')} />
                                {expanded && <span className="truncate">{label}</span>}
                            </Link>
                        )
                    })}
                </nav>

                {/* ── Bottom utils ──────────────────────────────────── */}
                <div className="flex flex-col gap-0.5 px-2 pb-1">
                    {!expanded && (
                        <button
                            onClick={() => setExpanded(true)}
                            title="Expandir"
                            className="flex items-center justify-center rounded-lg py-2.5 px-2.5 text-white/30 hover:text-white/70 hover:bg-white/5 transition-colors"
                        >
                            <ChevronsRight className="size-4" />
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
                                    'relative flex items-center gap-3 rounded-lg px-2.5 py-2.5 text-sm transition-all',
                                    isActive
                                        ? 'text-white font-medium'
                                        : 'text-white/40 hover:text-white/80 hover:bg-white/5',
                                    !expanded && 'justify-center',
                                )}
                                style={isActive ? {
                                    background: 'rgba(37,99,235,0.18)',
                                    boxShadow: 'inset 0 0 0 1px rgba(37,99,235,0.25)',
                                } : {}}
                            >
                                {isActive && (
                                    <span className="absolute left-0 top-1/2 -translate-y-1/2 w-0.5 h-5 rounded-r"
                                        style={{ background: 'linear-gradient(180deg, #60a5fa, #2563eb)' }} />
                                )}
                                <Icon className={cn('size-4 shrink-0', isActive ? 'text-blue-400' : '')} />
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
                        'flex items-center gap-2.5 px-2 py-3 shrink-0 hover:bg-white/5 transition-colors',
                        !expanded && 'justify-center',
                    )}
                    style={{ borderTop: '1px solid rgba(255,255,255,0.06)' }}
                >
                    <div className="flex size-7 shrink-0 items-center justify-center rounded-lg text-xs font-semibold overflow-hidden"
                        style={{ background: 'linear-gradient(135deg, #2563eb, #1d4ed8)', boxShadow: '0 0 10px rgba(37,99,235,0.4)' }}
                    >
                        {session?.user.image
                            ? <img src={session.user.image} alt={session.user.name} className="size-full object-cover" />
                            : <span className="text-white">{initials}</span>
                        }
                    </div>
                    {expanded && (
                        <div className="min-w-0 flex-1">
                            <p className="text-xs font-medium truncate leading-tight text-white/85">{session?.user.name ?? 'Usuário'}</p>
                            <p className="text-xs truncate leading-tight text-white/35">{session?.user.email ?? ''}</p>
                        </div>
                    )}
                </Link>
            </aside>

            {/* Main — fundo semi-transparente para o background aparecer */}
            <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
                <AnimatePresence mode="wait" initial={false}>
                    <motion.div
                        key={pathname}
                        className="flex flex-col flex-1 min-w-0 min-h-0 overflow-hidden"
                        initial={{ opacity: 0, y: 6 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0, y: -6 }}
                        transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
                    >
                        {children}
                    </motion.div>
                </AnimatePresence>
            </div>

            {/* VoIP flutuante — persiste entre navegações */}
            <GlobalVoipPanel />
        </div>
    )
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
    return (
        <VoipStoreProvider>
            <DashboardLayoutInner>{children}</DashboardLayoutInner>
        </VoipStoreProvider>
    )
}
