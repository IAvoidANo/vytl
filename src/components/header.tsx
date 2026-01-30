'use client'

import { signOut } from 'next-auth/react'
import { LogOut } from 'lucide-react'
import { CommandPalette } from './command-palette'

interface HeaderProps {
  userName?: string | null
  userRole?: string | null
}

export function Header({ userName, userRole }: HeaderProps) {
  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <header className="bg-slate-800 border-b border-slate-700 px-6 py-4">
      <div className="flex items-center justify-between">
        <h1 className="text-xl font-semibold text-white">
          Risk Management
        </h1>
        <div className="flex items-center gap-4">
          <CommandPalette isAdmin={isAdmin} />
          <span className="text-slate-300">{userName}</span>
          <span className="text-xs bg-teal-500/20 text-teal-400 px-2 py-1 rounded">
            {userRole}
          </span>
          <button
            onClick={() => signOut({ callbackUrl: '/login' })}
            className="flex items-center gap-2 px-3 py-2 text-slate-300 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <LogOut className="w-4 h-4" />
            Sign out
          </button>
        </div>
      </div>
    </header>
  )
}
