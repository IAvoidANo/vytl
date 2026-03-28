'use client'

import { useEffect, useState } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'

function VerifyEmailContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')
  const [status, setStatus] = useState<'verifying' | 'success' | 'error' | 'no-token'>('verifying')
  const [email, setEmail] = useState('')

  const verify = trpc.user.verifyEmail.useMutation({
    onSuccess: (data) => {
      setEmail(data.email)
      setStatus('success')
      setTimeout(() => router.push('/login'), 4000)
    },
    onError: () => setStatus('error'),
  })

  useEffect(() => {
    if (!token) { setStatus('no-token'); return }
    verify.mutate({ token })
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token])

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 w-full max-w-md text-center">
        <div className="inline-flex items-center gap-2 mb-8">
          <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
          <span className="text-xl font-bold text-slate-800">VytlRx</span>
        </div>

        {status === 'verifying' && (
          <>
            <div className="w-12 h-12 rounded-full border-4 border-teal-500 border-t-transparent animate-spin mx-auto mb-4"></div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Verifying your email…</h1>
            <p className="text-slate-500 text-sm">Just a moment.</p>
          </>
        )}

        {status === 'success' && (
          <>
            <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Email verified!</h1>
            <p className="text-slate-500 text-sm mb-6">
              {email && <><strong className="text-slate-700">{email}</strong> is confirmed.</>} Redirecting you to sign in…
            </p>
            <Link href="/login" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              Sign in now →
            </Link>
          </>
        )}

        {status === 'error' && (
          <>
            <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto mb-4">
              <svg className="w-7 h-7 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </div>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Link expired or invalid</h1>
            <p className="text-slate-500 text-sm mb-6">This verification link has expired (24 hours) or has already been used.</p>
            <Link href="/login" className="inline-block px-5 py-2.5 bg-teal-500 hover:bg-teal-600 text-white rounded-lg text-sm font-semibold transition-colors">
              Back to sign in
            </Link>
          </>
        )}

        {status === 'no-token' && (
          <>
            <h1 className="text-xl font-bold text-slate-900 mb-2">Check your inbox</h1>
            <p className="text-slate-500 text-sm mb-6">We sent a verification link to your email. Click the link to activate your account.</p>
            <Link href="/login" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
              Back to sign in
            </Link>
          </>
        )}
      </div>

      <nav className="flex items-center gap-5 mt-8">
        {[
          { href: '/legal', label: 'Legal' },
          { href: '/privacy', label: 'Privacy' },
          { href: '/terms', label: 'Terms' },
          { href: '/accessibility', label: 'Accessibility' },
        ].map(({ href, label }) => (
          <Link key={href} href={href} className="text-xs text-slate-400 hover:text-slate-600 transition-colors">{label}</Link>
        ))}
      </nav>
    </div>
  )
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,33%,95%)]">
        <div className="w-8 h-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <VerifyEmailContent />
    </Suspense>
  )
}
