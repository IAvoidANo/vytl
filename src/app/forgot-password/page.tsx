'use client'

import { useState } from 'react'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [resetUrl, setResetUrl] = useState('')

  const requestReset = trpc.user.requestPasswordReset.useMutation({
    onSuccess: (data) => {
      setSubmitted(true)
      // Temporary: show reset URL until email is set up
      if ('resetUrl' in data && data.resetUrl) {
        setResetUrl(data.resetUrl)
      }
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    requestReset.mutate({ email })
  }

  if (submitted) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full text-center">
          <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-slate-900 mb-2">Check Your Email</h1>
          <p className="text-slate-600 mb-4">
            If an account exists with that email, we&apos;ve sent password reset instructions.
          </p>

          {/* Temporary: show reset URL until email is set up */}
          {resetUrl && (
            <div className="mt-4 p-4 bg-amber-50 border border-amber-200 rounded-md text-left">
              <p className="text-amber-800 text-sm font-medium mb-2">
                (Dev mode: Email not configured)
              </p>
              <p className="text-amber-700 text-sm mb-2">Reset link:</p>
              <a
                href={resetUrl}
                className="text-blue-600 hover:underline text-sm break-all"
              >
                {resetUrl}
              </a>
            </div>
          )}

          <Link
            href="/login"
            className="inline-block mt-6 text-blue-600 hover:text-blue-800"
          >
            Back to login
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-50 px-4">
      <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
        <div className="text-center mb-6">
          <h1 className="text-2xl font-bold text-slate-900">Forgot Password</h1>
          <p className="text-slate-600 mt-2">
            Enter your email and we&apos;ll send you a reset link.
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1">
              Email Address
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="you@company.com"
            />
          </div>

          <button
            type="submit"
            disabled={requestReset.isPending}
            className="w-full py-2 px-4 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-md disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {requestReset.isPending ? 'Sending...' : 'Send Reset Link'}
          </button>
        </form>

        <p className="mt-6 text-center text-sm text-slate-600">
          Remember your password?{' '}
          <Link href="/login" className="text-blue-600 hover:text-blue-800">
            Sign in
          </Link>
        </p>
      </div>
    </div>
  )
}
