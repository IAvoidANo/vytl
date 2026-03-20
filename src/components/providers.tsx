'use client'

import { useState, Suspense } from 'react'
import { SessionProvider } from 'next-auth/react'
import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { httpBatchLink } from '@trpc/client'
import { trpc } from '@/lib/trpc-client'
import { Toaster } from 'sonner'
import { ErrorBoundary } from './error-boundary'
import { ThemeProvider } from '@/lib/theme-context'
import { CrispWidget } from './crisp-widget'
import { PostHogProvider } from './posthog-provider'

function getBaseUrl() {
  if (typeof window !== 'undefined') return ''
  return `http://localhost:${process.env.PORT ?? 3000}`
}

export function Providers({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(() => new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 5 * 1000,
        refetchOnWindowFocus: false,
      },
    },
  }))

  const [trpcClient] = useState(() =>
    trpc.createClient({
      links: [
        httpBatchLink({
          url: `${getBaseUrl()}/api/trpc`,
        }),
      ],
    })
  )

  return (
    <ErrorBoundary>
      <trpc.Provider client={trpcClient} queryClient={queryClient}>
        <QueryClientProvider client={queryClient}>
          <SessionProvider>
            <ThemeProvider>
              {children}
              <Suspense fallback={null}><PostHogProvider /></Suspense>
              <CrispWidget />
              <Toaster
                position="bottom-right"
                richColors
                closeButton
                toastOptions={{
                  duration: 4000,
                }}
              />
            </ThemeProvider>
          </SessionProvider>
        </QueryClientProvider>
      </trpc.Provider>
    </ErrorBoundary>
  )
}
