'use client'

import { useState } from 'react'
import { Menu } from 'lucide-react'
import { Sidebar } from './sidebar'
import { Header } from './header'
import { AppLayoutV2 } from './app-layout-v2'
import { SampleDataBanner } from './sample-data-banner'
import { USE_TOP_NAV } from '@/lib/feature-flags'

interface AppLayoutProps {
  children: React.ReactNode
  userName?: string | null
  userRole?: string | null
}

export function AppLayout({ children, userName, userRole }: AppLayoutProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  if (USE_TOP_NAV) {
    return <AppLayoutV2>{children}</AppLayoutV2>
  }

  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden on mobile unless open */}
      <div className={`
        fixed inset-y-0 left-0 z-30 md:relative md:z-auto
        transition-transform duration-200
        ${sidebarOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}
      `}>
        <Sidebar onClose={() => setSidebarOpen(false)} />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        <SampleDataBanner />
        {/* Header with mobile hamburger */}
        <header className="bg-slate-800 border-b border-slate-700 px-4 py-2 flex-shrink-0">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSidebarOpen(true)}
                className="md:hidden text-slate-400 hover:text-white p-1"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-lg font-semibold text-white">Risk Management</h1>
            </div>
            <Header userName={userName} userRole={userRole} headerOnly />
          </div>
        </header>
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
        <footer className="py-2 px-4 border-t border-slate-800 flex-shrink-0 flex items-center justify-between">
          <span className="text-[10px] text-slate-600">VytlRx v1.0.0 Beta</span>
          <nav className="hidden sm:flex items-center gap-4">
            {[
              { href: '/legal', label: 'Legal' },
              { href: '/privacy', label: 'Privacy' },
              { href: '/terms', label: 'Terms' },
              { href: '/accessibility', label: 'Accessibility' },
            ].map(({ href, label }) => (
              <a key={href} href={href} target="_blank" rel="noopener noreferrer"
                className="text-[10px] text-slate-600 hover:text-slate-400 transition-colors">
                {label}
              </a>
            ))}
          </nav>
        </footer>
      </div>
    </div>
  )
}
