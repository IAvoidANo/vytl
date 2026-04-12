'use client'

import { type LucideIcon } from 'lucide-react'
import { cn } from '@/lib/utils'

export interface AdminSidebarNavItem {
  label: string
  href: string
  icon: LucideIcon
}

interface AdminSidebarNavProps {
  items: AdminSidebarNavItem[]
  activeHref: string
  onSelect: (href: string) => void
}

export function AdminSidebarNav({ items, activeHref, onSelect }: AdminSidebarNavProps) {
  return (
    <>
      {/* Desktop: vertical sidebar */}
      <nav className="hidden md:flex flex-col w-56 shrink-0 gap-0.5">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = activeHref === item.href
          return (
            <button
              key={item.href}
              onClick={() => onSelect(item.href)}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md text-sm w-full text-left',
                isActive
                  ? 'bg-primary/10 text-primary font-medium'
                  : 'text-muted-foreground hover:bg-accent hover:text-foreground'
              )}
            >
              <Icon className="w-4 h-4 text-current shrink-0" />
              {item.label}
            </button>
          )
        })}
      </nav>

      {/* Mobile: horizontal scrollable pill strip */}
      <div className="md:hidden -mx-6 px-6 overflow-x-auto mb-6">
        <div className="flex gap-2 pb-2">
          {items.map((item) => {
            const isActive = activeHref === item.href
            return (
              <button
                key={item.href}
                onClick={() => onSelect(item.href)}
                className={cn(
                  'shrink-0 px-3 py-1.5 rounded-full text-sm whitespace-nowrap',
                  isActive
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-muted-foreground hover:bg-accent hover:text-foreground'
                )}
              >
                {item.label}
              </button>
            )
          })}
        </div>
      </div>
    </>
  )
}
