import Link from 'next/link'
import { cn } from '@/lib/utils'

type Variant = 'default' | 'warning' | 'danger' | 'success'

interface StatCardProps {
  title: string
  value: number | string
  sublabel?: string
  href?: string
  variant?: Variant
  icon?: React.ReactNode
  loading?: boolean
}

const variantStyles: Record<Variant, {
  border: string
  iconBg: string
  iconText: string
  value: string
  cardBg: string
}> = {
  default: {
    border:   'border-l-teal-500',
    iconBg:   'bg-teal-50',
    iconText: 'text-teal-600',
    value:    'text-slate-900',
    cardBg:   'bg-white',
  },
  success: {
    border:   'border-l-green-500',
    iconBg:   'bg-green-50',
    iconText: 'text-green-600',
    value:    'text-green-700',
    cardBg:   'bg-white',
  },
  warning: {
    border:   'border-l-amber-500',
    iconBg:   'bg-amber-50',
    iconText: 'text-amber-600',
    value:    'text-amber-700',
    cardBg:   'bg-amber-50/40',
  },
  danger: {
    border:   'border-l-red-500',
    iconBg:   'bg-red-50',
    iconText: 'text-red-600',
    value:    'text-red-700',
    cardBg:   'bg-red-50/40',
  },
}

export function StatCard({
  title,
  value,
  sublabel,
  href,
  variant = 'default',
  icon,
  loading = false,
}: StatCardProps) {
  const s = variantStyles[variant]

  const inner = (
    <div className={cn(
      'rounded-card shadow-card border border-slate-100 border-l-4 p-4 transition-all duration-200',
      s.border,
      s.cardBg,
      href && 'hover:shadow-panel hover:-translate-y-0.5 cursor-pointer',
    )}>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-9 w-14 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between mb-3">
            <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider leading-none mt-0.5">
              {title}
            </p>
            {icon && (
              <span className={cn(
                'flex items-center justify-center w-9 h-9 rounded-xl text-sm flex-shrink-0',
                s.iconBg, s.iconText,
              )}>
                {icon}
              </span>
            )}
          </div>
          <p className={cn('text-4xl font-bold tabular-nums leading-none', s.value)}>
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-400 mt-2">{sublabel}</p>
          )}
        </>
      )}
    </div>
  )

  if (href) return <Link href={href}>{inner}</Link>
  return inner
}
