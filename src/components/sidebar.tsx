'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import { LayoutDashboard, AlertTriangle, Activity, Users, Settings } from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/risks', label: 'Risks', icon: AlertTriangle },
  { href: '/kris', label: 'KRIs', icon: Activity },
  { href: '/users', label: 'Team', icon: Users, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

export function Sidebar() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role

  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 min-h-screen">
      <div className="p-6">
        <Link href="/dashboard" className="text-2xl font-bold text-teal-400">
          Vytl
        </Link>
      </div>

      <nav className="px-4">
        {navItems.map((item) => {
          // Skip admin-only items for non-admins
          if (item.adminOnly && !isAdmin) return null

          const isActive = pathname === item.href
          const Icon = item.icon

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg mb-1 transition-colors ${
                isActive
                  ? 'bg-teal-500/20 text-teal-400'
                  : 'text-slate-300 hover:bg-slate-700 hover:text-white'
              }`}
            >
              <Icon className="w-5 h-5" />
              {item.label}
            </Link>
          )
        })}
      </nav>
    </aside>
  )
}
