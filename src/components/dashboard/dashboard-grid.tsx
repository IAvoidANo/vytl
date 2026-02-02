'use client'

import { ReactNode } from 'react'

interface GridItemProps {
  id: string
  title?: string
  children: ReactNode
  className?: string
}

interface GridProps {
  children: ReactNode
}

export function DashboardGrid({ children }: GridProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 auto-rows-max">
      {children}
    </div>
  )
}

export function GridItem({ id, title, children, className }: GridItemProps) {
  return (
    <div
      className={`
        bg-slate-800 rounded-lg border border-slate-700 p-4
        ${className || 'col-span-1 md:col-span-2 lg:col-span-2'}
      `}
      data-grid-id={id}
    >
      {title && <h3 className="text-sm font-semibold text-slate-200 mb-3">{title}</h3>}
      {children}
    </div>
  )
}
