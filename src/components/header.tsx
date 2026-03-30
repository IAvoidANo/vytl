'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { CommandPalette } from './command-palette'
import { ThemeToggle } from './theme-toggle'
import { NotificationBell } from './notification-bell'

interface HeaderProps {
  userName?: string | null
  userRole?: string | null
  /** When true, renders only the right-side controls (used inside AppLayout's own header row) */
  headerOnly?: boolean
}

export function Header({ userName, userRole, headerOnly }: HeaderProps) {
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  const controls = (
    <div className="flex items-center gap-3">
      <CommandPalette isAdmin={isAdmin} />
      <NotificationBell />
      <ThemeToggle />
      <span className="hidden sm:block text-sm text-slate-300">{userName}</span>
      <span className="hidden sm:block text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded">
        {userRole}
      </span>
      <button
        onClick={() => signOut({ callbackUrl: '/login' })}
        className="flex items-center gap-1.5 px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
      >
        <LogOut className="w-3.5 h-3.5" />
        <span className="hidden sm:block">Sign out</span>
      </button>
    </div>
  )

  if (headerOnly) return controls

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">Risk Management</h1>
        {controls}
      </div>
    </header>
  )
}
