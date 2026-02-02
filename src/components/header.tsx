'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { CommandPalette } from './command-palette'
import { ThemeToggle } from './theme-toggle'

interface HeaderProps {
  userName?: string | null
  userRole?: string | null
}

export function Header({ userName, userRole }: HeaderProps) {
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
      <div className="flex items-center justify-between">
        <h1 className="text-lg font-semibold text-white">
          Risk Management
        </h1>
        <div className="flex items-center gap-3">
          <CommandPalette isAdmin={isAdmin} />
          <ThemeToggle />
          <span className="text-sm text-slate-300 dark:text-slate-300 light:text-slate-700">{userName}</span>
          <span className="text-[10px] bg-teal-500/20 text-teal-400 px-1.5 py-0.5 rounded">
            {userRole}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-1.5 px-2 py-1.5 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors text-sm"
          >
            <LogOut className="w-3.5 h-3.5" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
