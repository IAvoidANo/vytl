'use client'

import { useSession } from 'next-auth/react'
import { TopNav } from './top-nav'
import { CommandPalette } from './command-palette'

interface AppLayoutV2Props {
  children: React.ReactNode
}

export function AppLayoutV2({ children }: AppLayoutV2Props) {
  const { data: session } = useSession()
  const userRole = (session?.user as { role?: string })?.role
  const isAdmin  = userRole === 'OWNER' || userRole === 'ADMIN'

  return (
    <div className="min-h-screen bg-slate-50 dark:bg-slate-900">
      <TopNav />
      <main className="mx-auto max-w-content px-6 py-5">
        {children}
      </main>
      <CommandPalette isAdmin={isAdmin} hideTrigger />
    </div>
  )
}
