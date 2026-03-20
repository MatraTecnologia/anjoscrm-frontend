"use client"

import { cn } from "@/lib/utils"

interface NodeStats {
  success?: number
  warnings?: number
  errors?: number
}

interface BaseNodeProps {
  children: React.ReactNode
  selected?: boolean
  className?: string
  stats?: NodeStats
  showStats?: boolean
  accentColor?: string
}

export function BaseNode({
  children,
  selected,
  className,
  stats,
  showStats = true,
  accentColor = "bg-slate-400",
}: BaseNodeProps) {
  return (
    <div
      className={cn(
        "relative bg-card rounded-2xl overflow-hidden w-[300px] select-none transition-all duration-150",
        "border border-dashed",
        selected
          ? "border-indigo-400 shadow-lg shadow-indigo-500/10 ring-2 ring-indigo-400/20"
          : "border-border hover:border-slate-400 shadow-sm",
        className,
      )}
    >
      {/* Accent bar at top */}
      <div className={cn("absolute inset-x-0 top-0 h-0.5", accentColor)} />

      {children}

      {showStats && (
        <div className="flex items-center justify-between px-4 py-2 border-t border-border/60 bg-muted/30">
          <span className="flex items-center gap-1 text-[10px] text-emerald-600 dark:text-emerald-400 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-emerald-500" />
            {stats?.success ?? 0} Sucessos
          </span>
          <span className="flex items-center gap-1 text-[10px] text-amber-600 dark:text-amber-400 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-amber-500" />
            {stats?.warnings ?? 0} Alertas
          </span>
          <span className="flex items-center gap-1 text-[10px] text-red-600 dark:text-red-400 font-medium tabular-nums">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-red-500" />
            {stats?.errors ?? 0} Erros
          </span>
        </div>
      )}
    </div>
  )
}

interface NodeHeaderProps {
  icon: React.ReactNode
  title: string
  iconBg?: string
  iconColor?: string
  subtitle?: string
  badge?: string
}

export function NodeHeader({
  icon,
  title,
  iconBg = "bg-muted",
  iconColor = "text-muted-foreground",
  subtitle,
}: NodeHeaderProps) {
  return (
    <div className="flex items-center gap-3 px-4 pt-4 pb-2.5">
      <div className={cn(
        "flex items-center justify-center w-8 h-8 rounded-xl shrink-0 shadow-sm",
        iconBg,
      )}>
        <span className={cn("flex items-center justify-center", iconColor)}>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-[13px] font-semibold text-foreground leading-none truncate">{title}</p>
        {subtitle && (
          <p className="text-[10px] text-muted-foreground mt-0.5 truncate">{subtitle}</p>
        )}
      </div>
    </div>
  )
}

interface NodeBodyProps {
  children: React.ReactNode
  className?: string
}

export function NodeBody({ children, className }: NodeBodyProps) {
  return (
    <div className={cn("px-4 pb-3.5 text-[11px] text-muted-foreground leading-relaxed min-h-[36px]", className)}>
      {children}
    </div>
  )
}

export function NodePlaceholder({ text = "Clique para configurar" }: { text?: string }) {
  return (
    <span className="italic text-muted-foreground/50 text-[11px]">{text}</span>
  )
}

export function NodeDivider() {
  return <div className="mx-4 border-t border-border/50 mb-2" />
}
