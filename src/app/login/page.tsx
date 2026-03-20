'use client'

import { useState } from 'react'
import { signIn } from 'next-auth/react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { trpc } from '@/lib/trpc-client'

function ResendButton({ email }: { email: string }) {
  const [sent, setSent] = useState(false)
  const resend = trpc.user.resendVerification.useMutation({ onSuccess: () => setSent(true) })
  if (sent) return <p className="text-amber-700 text-xs">Verification email sent!</p>
  return (
    <button onClick={() => resend.mutate({ email })} disabled={resend.isPending}
      className="text-xs text-amber-800 underline hover:no-underline disabled:opacity-50">
      {resend.isPending ? 'Sending…' : 'Resend verification email'}
    </button>
  )
}

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const router = useRouter()

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      const result = await signIn('credentials', {
        email,
        password,
        redirect: false,
      })

      if (result?.error) {
        if (result.error === 'EMAIL_NOT_VERIFIED' || result.code === 'EMAIL_NOT_VERIFIED') {
          setError('EMAIL_NOT_VERIFIED:' + email)
        } else {
          setError('Invalid email or password')
        }
      } else {
        router.push('/dashboard')
      }
    } catch {
      setError('Something went wrong')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VYTL</span>
          </div>
          <p className="text-slate-500 text-sm">Sign in to your account</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            error.startsWith('EMAIL_NOT_VERIFIED:') ? (
              <div className="bg-amber-50 border border-amber-200 text-amber-800 px-4 py-3 rounded-lg text-sm">
                <p className="font-medium mb-1">Please verify your email</p>
                <p className="text-amber-700 mb-2">Check your inbox for a verification link.</p>
                <ResendButton email={error.split(':')[1]} />
              </div>
            ) : (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
                {error}
              </div>
            )
          )}

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-2">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="admin@acme.com"
              required
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-sm font-medium text-slate-700">
                Password
              </label>
              <Link href="/forgot-password" className="text-sm text-teal-600 hover:text-teal-700">
                Forgot password?
              </Link>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50"
          >
            {loading ? 'Signing in...' : 'Sign In'}
          </button>
        </form>

        <p className="text-slate-500 text-sm text-center mt-6">
          Don&apos;t have an account?{' '}
          <Link href="/register" className="text-teal-600 hover:text-teal-700">
            Create one free
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
      <p className="text-xs text-slate-400 mt-3">© {new Date().getFullYear()} VYTL (Pty) Ltd</p>
    </div>
  )
}
