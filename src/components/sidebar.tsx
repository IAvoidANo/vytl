'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useSession } from 'next-auth/react'
import {
  LayoutDashboard,
  Columns3,
  AlertTriangle,
  CheckSquare,
  Activity,
  FileBarChart,
  Users,
  Settings,
  Shield,
} from 'lucide-react'

const navItems = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/workspace', label: 'Workspace', icon: Columns3 },
  { href: '/risks', label: 'Risks', icon: AlertTriangle },
  { href: '/actions', label: 'Actions', icon: CheckSquare },
  { href: '/kris', label: 'KRIs', icon: Activity },
  { href: '/reports', label: 'Reports', icon: FileBarChart },
  { href: '/users', label: 'Team', icon: Users, adminOnly: true },
  { href: '/settings', label: 'Settings', icon: Settings },
]

interface SidebarProps {
  onClose?: () => void
}

export function Sidebar({ onClose }: SidebarProps) {
  const pathname = usePathname()
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role

  const isAdmin = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <aside className="w-64 bg-slate-800 border-r border-slate-700 h-full min-h-screen flex flex-col">
      {/* Logo Section */}
      <div className="p-5 border-b border-slate-700/50">
        <Link href="/dashboard" className="flex items-center gap-3 group">
          <div className="relative">
            {/* Logo Icon with animated background */}
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-lg shadow-teal-500/20 group-hover:shadow-teal-500/40 transition-shadow">
              <Shield className="w-5 h-5 text-white" />
            </div>
            {/* Pulse effect on hover */}
            <div className="absolute inset-0 w-10 h-10 rounded-xl bg-teal-500 opacity-0 group-hover:opacity-20 group-hover:animate-ping" />
          </div>
          <div>
            <span className="text-xl font-bold text-white tracking-tight">VytlRx</span>
            <p className="text-[10px] text-slate-500 uppercase tracking-wider -mt-0.5">Risk Intelligence</p>
          </div>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-4">
        <div className="space-y-1">
          {navItems.map((item) => {
            // Skip admin-only items for non-admins
            if (item.adminOnly && !isAdmin) return null

            const isActive = pathname === item.href
            const Icon = item.icon

            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={onClose}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-200 group ${
                  isActive
                    ? 'bg-teal-500/15 text-teal-400 shadow-sm'
                    : 'text-slate-400 hover:bg-slate-700/50 hover:text-white'
                }`}
              >
                <Icon
                  className={`w-5 h-5 transition-transform group-hover:scale-110 ${
                    isActive ? 'text-teal-400' : ''
                  }`}
                />
                <span className="font-medium text-sm">{item.label}</span>
                {isActive && (
                  <div className="ml-auto w-1.5 h-1.5 rounded-full bg-teal-400" />
                )}
              </Link>
            )
          })}
        </div>
      </nav>

      {/* Footer Section */}
      <div className="p-4 border-t border-slate-700/50">
        <div className="px-3 py-2 rounded-lg bg-slate-700/30">
          <div className="flex items-center gap-2 mb-1">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-xs text-slate-400">System Status</span>
          </div>
          <p className="text-[10px] text-slate-500">All systems operational</p>
        </div>
        <p className="text-[10px] text-slate-600 text-center mt-3">
          VytlRx v1.0.0 Beta
        </p>
      </div>
    </aside>
  )
}
