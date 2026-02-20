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

const variantStyles: Record<Variant, { value: string; badge: string }> = {
  default:  { value: 'text-slate-900',  badge: '' },
  success:  { value: 'text-green-600',  badge: 'text-green-600 bg-green-50 border-green-200' },
  warning:  { value: 'text-amber-600',  badge: 'text-amber-600 bg-amber-50 border-amber-200' },
  danger:   { value: 'text-red-600',    badge: 'text-red-600 bg-red-50 border-red-200' },
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
  const styles = variantStyles[variant]

  const inner = (
    <div className={cn(
      'bg-white rounded-card shadow-card border border-slate-100 p-5 transition-all duration-200',
      href && 'hover:shadow-panel hover:-translate-y-0.5 cursor-pointer',
    )}>
      {loading ? (
        <div className="animate-pulse space-y-2">
          <div className="h-3 w-20 bg-slate-100 rounded" />
          <div className="h-9 w-14 bg-slate-100 rounded" />
        </div>
      ) : (
        <>
          <div className="flex items-start justify-between">
            <p className="text-xs font-medium text-slate-500 uppercase tracking-wider">{title}</p>
            {icon && (
              <span className={cn(
                'flex items-center justify-center w-7 h-7 rounded-lg text-sm',
                variant === 'default' ? 'bg-teal-50 text-teal-600' :
                variant === 'success' ? 'bg-green-50 text-green-600' :
                variant === 'warning' ? 'bg-amber-50 text-amber-600' :
                'bg-red-50 text-red-600',
              )}>
                {icon}
              </span>
            )}
          </div>
          <p className={cn('text-4xl font-bold mt-2 tabular-nums leading-none', styles.value)}>
            {value}
          </p>
          {sublabel && (
            <p className="text-xs text-slate-400 mt-1.5">{sublabel}</p>
          )}
        </>
      )}
    </div>
  )

  if (href) {
    return <Link href={href}>{inner}</Link>
  }
  return inner
}
