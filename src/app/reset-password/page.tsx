'use client'

import { useState, Suspense } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'

function ResetPasswordContent() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const token = searchParams.get('token')

  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(false)

  const { data: tokenData, isLoading: verifying } = trpc.user.verifyResetToken.useQuery(
    { token: token || '' },
    { enabled: !!token }
  )

  const resetPassword = trpc.user.resetPassword.useMutation({
    onSuccess: () => {
      setSuccess(true)
      setTimeout(() => router.push('/login'), 3000)
    },
    onError: (err) => {
      setError(err.message)
    },
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!token) {
      setError('Invalid reset link')
      return
    }

    if (password !== confirmPassword) {
      setError('Passwords do not match')
      return
    }

    if (password.length < 8) {
      setError('Password must be at least 8 characters')
      return
    }

    resetPassword.mutate({ token, password })
  }

  if (!token) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
              <span className="text-xl font-bold text-slate-800">VYTL</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-4">Invalid Link</h1>
          <p className="text-slate-500 mb-4">
            This password reset link is invalid. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700 font-medium">
            Request new reset link
          </Link>
        </div>
      </div>
    )
  }

  if (verifying) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,33%,95%)]">
        <div className="w-8 h-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
      </div>
    )
  }

  if (!tokenData?.valid) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
          <div className="text-center mb-6">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
              <span className="text-xl font-bold text-slate-800">VYTL</span>
            </div>
          </div>
          <h1 className="text-xl font-bold text-red-600 mb-4">Link Expired</h1>
          <p className="text-slate-500 mb-4">
            This password reset link has expired. Please request a new one.
          </p>
          <Link href="/forgot-password" className="text-teal-600 hover:text-teal-700 font-medium">
            Request new reset link
          </Link>
        </div>
      </div>
    )
  }

  if (success) {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
        <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-10 max-w-md w-full text-center">
          <div className="inline-flex items-center gap-2 mb-8">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VYTL</span>
          </div>
          <div className="w-14 h-14 rounded-full bg-teal-50 flex items-center justify-center mx-auto mb-4">
            <svg className="w-7 h-7 text-teal-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mb-2">Password Reset!</h1>
          <p className="text-slate-500 text-sm">
            Your password has been reset. Redirecting to sign in…
          </p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 max-w-md w-full">
        <div className="text-center mb-6">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VYTL</span>
          </div>
          <h1 className="text-xl font-bold text-slate-900 mt-1">Reset Password</h1>
          <p className="text-slate-500 text-sm mt-1">
            Enter a new password for <span className="font-medium text-slate-700">{tokenData.email}</span>
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1">
              New Password
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
              minLength={8}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Enter new password (min 8 characters)"
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-slate-700 mb-1">
              Confirm Password
            </label>
            <input
              id="confirmPassword"
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              required
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Confirm new password"
            />
          </div>

          <button
            type="submit"
            disabled={resetPassword.isPending}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {resetPassword.isPending ? 'Resetting...' : 'Reset Password'}
          </button>
        </form>
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
      <p className="text-xs text-slate-400 mt-3">© {new Date().getFullYear()} VYTL (Pty) Ltd</p>
    </div>
  )
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen flex items-center justify-center bg-[hsl(210,33%,95%)]">
        <div className="w-8 h-8 rounded-full border-4 border-teal-500 border-t-transparent animate-spin"></div>
      </div>
    }>
      <ResetPasswordContent />
    </Suspense>
  )
}
