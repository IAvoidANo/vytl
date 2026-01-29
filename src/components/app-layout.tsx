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
    <div className="flex min-h-screen bg-slate-900">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header userName={userName} userRole={userRole} />
        <main className="flex-1 p-6">
          {children}
        </main>
        <footer className="py-2 text-center text-xs text-slate-500">
          Vytl Risk Management
        </footer>
      </div>
    </div>
  )
}
