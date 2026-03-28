import type { ReactNode } from 'react'
import Link from 'next/link'
import { PublicFooter } from '@/components/public-footer'

export default function PublicLayout({ children }: { children: ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210,33%,95%)]">
      {/* Simple top nav */}
      <header className="bg-white border-b border-[hsl(210,20%,87%)] sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <span className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">V</span>
            VytlRx
          </Link>
          <div className="flex items-center gap-4 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">Sign in</Link>
            <Link href="/register" className="px-4 py-1.5 bg-teal-500 hover:bg-teal-600 text-white rounded-md font-medium transition-colors">Get started</Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {children}
      </main>

      <PublicFooter />
    </div>
  )
}
