'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { useState, useEffect, useRef } from 'react'
import { useSession, signOut } from 'next-auth/react'
import {
  LayoutDashboard, Columns3, AlertTriangle, Activity,
  FileBarChart, CheckSquare, Search, User, Building2, LogOut, Menu, X, Shield, Users,
} from 'lucide-react'
import { ThemeToggle } from './theme-toggle'
import { cn } from '@/lib/utils'

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/risks',     label: 'Risks',     icon: AlertTriangle },
  { href: '/kris',      label: 'Monitor',   icon: Activity },
  { href: '/workspace', label: 'Workspace', icon: Columns3 },
  { href: '/actions',   label: 'Actions',   icon: CheckSquare },
  { href: '/reports',   label: 'Reports',   icon: FileBarChart },
]

export function TopNav() {
  const pathname = usePathname()
  const { data: session } = useSession()
  const [mobileOpen, setMobileOpen]   = useState(false)
  const [userMenuOpen, setUserMenuOpen] = useState(false)
  const userMenuRef = useRef<HTMLDivElement>(null)

  const userRole   = (session?.user as { role?: string })?.role
  const isAdmin    = userRole === 'OWNER' || userRole === 'ADMIN'
  const userName   = session?.user?.name ?? session?.user?.email ?? ''
  const userEmail  = session?.user?.email ?? ''
  const userInitials = (session?.user?.name ?? userEmail)
    .split(' ')
    .map((n: string) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2) || '?'

  // Close user dropdown on outside click or Escape key
  useEffect(() => {
    function onOutside(e: MouseEvent) {
      if (userMenuRef.current && !userMenuRef.current.contains(e.target as Node)) {
        setUserMenuOpen(false)
      }
    }
    function onKeyDown(e: KeyboardEvent) {
      if (e.key === 'Escape') {
        setUserMenuOpen(false)
        setMobileOpen(false)
      }
    }
    document.addEventListener('mousedown', onOutside)
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('mousedown', onOutside)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  // Close mobile menu on route change
  useEffect(() => { setMobileOpen(false) }, [pathname])

  function triggerCommandPalette() {
    document.dispatchEvent(
      new KeyboardEvent('keydown', { key: 'k', metaKey: true, ctrlKey: true, bubbles: true })
    )
  }

  const linkBase = 'flex items-center gap-2 px-3 py-2 text-sm font-medium rounded-lg transition-colors'
  const linkActive = 'bg-teal-500/10 text-teal-600 dark:text-teal-400'
  const linkInactive = 'text-slate-600 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white'
  const iconBtn = 'p-2 rounded-lg text-slate-500 dark:text-slate-400 hover:bg-slate-100 dark:hover:bg-slate-800 hover:text-slate-900 dark:hover:text-white transition-colors'

  return (
    <header className="sticky top-0 z-50 w-full border-b border-slate-200 dark:border-slate-700 bg-white/95 dark:bg-slate-900/95 backdrop-blur supports-[backdrop-filter]:bg-white/60 dark:supports-[backdrop-filter]:bg-slate-900/60 h-nav">
      <div className="mx-auto flex h-full max-w-content items-center justify-between px-6">

        {/* Logo */}
        <Link href="/dashboard" className="flex items-center gap-2.5 flex-shrink-0 group">
          <div className="w-8 h-8 rounded-xl bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center shadow-card">
            <Shield className="w-4 h-4 text-white" />
          </div>
          <div>
            <span className="text-lg font-bold text-slate-900 dark:text-white tracking-tight">VytlRx</span>
            <p className="text-[9px] text-slate-500 dark:text-slate-500 uppercase tracking-wider -mt-0.5 leading-none">Risk Intelligence</p>
          </div>
        </Link>

        {/* Desktop nav */}
        <nav className="hidden md:flex items-center gap-0.5">
          {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
            const isActive = pathname === href || pathname.startsWith(`${href}/`)
            return (
              <Link key={href} href={href} className={cn(linkBase, isActive ? linkActive : linkInactive)}>
                <Icon className="w-4 h-4" />
                {label}
              </Link>
            )
          })}
        </nav>

        {/* Right-side actions */}
        <div className="flex items-center gap-1">

          {/* Search → command palette */}
          <button
            onClick={triggerCommandPalette}
            className={cn('hidden md:flex', iconBtn)}
            title="Search (⌘K)"
          >
            <Search className="w-5 h-5" />
          </button>

          <ThemeToggle />

          {/* User menu */}
          <div className="relative ml-1" ref={userMenuRef}>
            <button
              onClick={() => setUserMenuOpen(v => !v)}
              aria-expanded={userMenuOpen}
              aria-haspopup="menu"
              className="flex items-center gap-2 pl-2 pr-1 py-1 rounded-lg hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              <div className="w-8 h-8 rounded-full bg-teal-500/15 text-teal-600 dark:text-teal-400 flex items-center justify-center text-xs font-semibold flex-shrink-0">
                {userInitials}
              </div>
              <span className="hidden lg:block text-sm text-slate-700 dark:text-slate-300 max-w-[120px] truncate">
                {userName}
              </span>
            </button>

            {userMenuOpen && (
              <div className="absolute right-0 mt-1 w-56 bg-white dark:bg-slate-800 border border-slate-200 dark:border-slate-700 rounded-card shadow-modal py-1 z-50">
                <div className="px-3 py-2.5 border-b border-slate-100 dark:border-slate-700">
                  <p className="text-sm font-medium text-slate-900 dark:text-white truncate">{userName}</p>
                  <p className="text-xs text-slate-500 dark:text-slate-400 truncate">{userEmail}</p>
                </div>

                <Link
                  href="/account"
                  onClick={() => setUserMenuOpen(false)}
                  className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                >
                  <User className="w-4 h-4" />
                  My account
                </Link>

                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Building2 className="w-4 h-4" />
                    Organisation admin
                  </Link>
                )}

                {isAdmin && (
                  <Link
                    href="/users"
                    onClick={() => setUserMenuOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-slate-700 dark:text-slate-300 hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors"
                  >
                    <Users className="w-4 h-4" />
                    Team
                  </Link>
                )}

                <div className="border-t border-slate-100 dark:border-slate-700 mt-1 pt-1">
                  <button
                    onClick={() => signOut({ callbackUrl: '/login' })}
                    className="flex items-center gap-2 px-3 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 w-full text-left transition-colors"
                  >
                    <LogOut className="w-4 h-4" />
                    Sign out
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* Mobile hamburger */}
          <button
            onClick={() => setMobileOpen(v => !v)}
            className={cn('md:hidden ml-1', iconBtn)}
            aria-label="Toggle menu"
          >
            {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile drawer */}
      {mobileOpen && (
        <nav className="md:hidden border-t border-slate-200 dark:border-slate-700 bg-white dark:bg-slate-900 px-4 py-3">
          <div className="flex flex-col gap-1">
            {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
              const isActive = pathname === href || pathname.startsWith(`${href}/`)
              return (
                <Link
                  key={href}
                  href={href}
                  className={cn(
                    'flex items-center gap-3 px-3 py-3 text-base font-medium rounded-lg transition-colors',
                    isActive ? linkActive : linkInactive
                  )}
                >
                  <Icon className="w-5 h-5" />
                  {label}
                </Link>
              )
            })}
          </div>
        </nav>
      )}
    </header>
  )
}
