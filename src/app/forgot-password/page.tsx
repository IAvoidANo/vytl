'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const requestReset = trpc.user.requestPasswordReset.useMutation({
    onSuccess: () => setSubmitted(true),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestReset.mutate({ email })
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VytlRx</span>
          </div>
          <div className="w-14 h-14 bg-teal-50 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Check your email</h1>
          <p className="text-slate-500 text-sm mb-6">
            If an account exists for <strong className="text-slate-700">{email}</strong>, we&apos;ve sent a
            password reset link. It expires in 1 hour.
          </p>
          <Link href="/login" className="text-teal-600 hover:text-teal-700 text-sm font-medium">
            Back to sign in
          </Link>
        </div>

        <nav className="flex items-center gap-5 mt-8">
          {[
            { href: '/legal', label: 'Legal' },
            { href: '/privacy', label: 'Privacy notice' },
            { href: '/terms', label: 'Terms' },
            { href: '/accessibility', label: 'Accessibility' },
          ].map(({ href, label }) => (
            <Link key={href} href={href}
              className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
              {label}
            </Link>
          ))}
        </nav>
        <p className="text-xs text-slate-400 mt-3">© {new Date().getFullYear()} VytlRx (Pty) Ltd</p>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VytlRx</span>
          </div>
          <p className="text-slate-500 text-sm">Reset your password</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {requestReset.isError && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              Something went wrong. Please try again.
            </div>
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="you@company.com"
            />
          </div>

          <button
            type="submit"
            disabled={requestReset.isPending}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {requestReset.isPending ? 'Sending…' : 'Send Reset Link'}
          </button>
        </form>

        <p className="text-slate-500 text-sm text-center mt-6">
          Remember your password?{' '}
          <Link href="/login" className="text-teal-600 hover:text-teal-700">
            Sign in
          </Link>
        </p>
      </div>

      <nav className="flex items-center gap-5 mt-8">
        {[
          { href: '/legal', label: 'Legal' },
          { href: '/privacy', label: 'Privacy notice' },
          { href: '/terms', label: 'Terms' },
          { href: '/accessibility', label: 'Accessibility' },
        ].map(({ href, label }) => (
          <Link key={href} href={href}
            className="text-xs text-slate-400 hover:text-slate-600 transition-colors">
            {label}
          </Link>
        ))}
      </nav>
      <p className="text-xs text-slate-400 mt-3">© {new Date().getFullYear()} VytlRx (Pty) Ltd</p>
    </div>
  )
}
