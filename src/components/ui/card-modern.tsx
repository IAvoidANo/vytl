import { cn } from '@/lib/utils'

interface ModernCardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode
  /** Adds a subtle lift-and-shadow hover effect */
  hover?: boolean
}

/**
 * ModernCard — Phase 1 design refresh card primitive.
 * Uses new radius-card (12px) and shadow-card tokens.
 * Drop-in alongside existing components; existing layout is unaffected.
 */
export function ModernCard({ children, hover = false, className, ...props }: ModernCardProps) {
  return (
    <div
      className={cn(
        'rounded-card shadow-card bg-white dark:bg-slate-800 p-card transition-all duration-200',
        hover && 'hover:shadow-panel hover:-translate-y-0.5 cursor-pointer',
        className
      )}
      {...props}
    >
      {children}
    </div>
  )
}
