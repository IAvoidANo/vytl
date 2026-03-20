'use client'

import { useEffect, useRef } from 'react'
import { usePathname, useSearchParams } from 'next/navigation'
import posthog from 'posthog-js'
import { useSession } from 'next-auth/react'

let initialized = false

export function PostHogProvider() {
  const key = process.env.NEXT_PUBLIC_POSTHOG_KEY
  const host = process.env.NEXT_PUBLIC_POSTHOG_HOST ?? 'https://eu.i.posthog.com'
  const pathname = usePathname()
  const searchParams = useSearchParams()
  const { data: session } = useSession()
  const identified = useRef(false)

  // Initialise once
  useEffect(() => {
    if (!key || initialized) return
    posthog.init(key, {
      api_host: host,
      capture_pageview: false,   // we track manually below
      capture_pageleave: true,
      persistence: 'localStorage',
      autocapture: false,        // keep it lightweight — explicit events only
    })
    initialized = true
  }, [key, host])

  // Track page views on route change
  useEffect(() => {
    if (!key || !initialized) return
    const url = pathname + (searchParams.toString() ? `?${searchParams.toString()}` : '')
    posthog.capture('$pageview', { $current_url: url })
  }, [key, pathname, searchParams])

  // Identify user when session is available
  useEffect(() => {
    if (!key || !initialized || !session?.user || identified.current) return
    const user = session.user as { id?: string; email?: string; name?: string; orgId?: string; role?: string }
    if (user.id) {
      posthog.identify(user.id, {
        email: user.email,
        name: user.name,
        orgId: user.orgId,
        role: user.role,
      })
      identified.current = true
    }
  }, [key, session])

  return null
}
