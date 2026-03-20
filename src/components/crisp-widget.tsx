'use client'

import { useEffect } from 'react'
import { useSession } from 'next-auth/react'

declare global {
  interface Window {
    $crisp: unknown[]
    CRISP_WEBSITE_ID: string
  }
}

export function CrispWidget() {
  const websiteId = process.env.NEXT_PUBLIC_CRISP_WEBSITE_ID
  const { data: session } = useSession()

  useEffect(() => {
    if (!websiteId) return

    window.$crisp = []
    window.CRISP_WEBSITE_ID = websiteId

    const script = document.createElement('script')
    script.src = 'https://client.crisp.chat/l.js'
    script.async = true
    document.head.appendChild(script)

    return () => {
      document.head.removeChild(script)
    }
  }, [websiteId])

  // Push user identity to Crisp when session is available
  useEffect(() => {
    if (!websiteId || !session?.user) return
    const user = session.user as { email?: string; name?: string }
    if (window.$crisp && user.email) {
      window.$crisp.push(['set', 'user:email', [user.email]])
      if (user.name) window.$crisp.push(['set', 'user:nickname', [user.name]])
    }
  }, [session, websiteId])

  return null
}
