'use client'

import { Sidebar } from './sidebar'
import { Header } from './header'

interface AppLayoutProps {
  children: React.ReactNode
  userName?: string | null
  userRole?: string | null
}

export function AppLayout({ children, userName, userRole }: AppLayoutProps) {
  return (
    <div className="flex h-screen bg-slate-900 overflow-hidden">
      <Sidebar />
      <div className="flex-1 flex flex-col min-w-0">
        <Header userName={userName} userRole={userRole} />
        <main className="flex-1 p-4 overflow-auto">
          {children}
        </main>
        <footer className="py-1.5 text-center text-[10px] text-slate-600 border-t border-slate-800 flex-shrink-0">
          Vytl v1.0.0 Beta
        </footer>
      </div>
    </div>
  )
}
