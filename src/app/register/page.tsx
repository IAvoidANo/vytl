'use client'

import { useState } from 'react'
import Link from 'next/link'
import { signIn } from 'next-auth/react'
import { trpc } from '@/lib/trpc-client'

export default function RegisterPage() {
  const [form, setForm] = useState({ name: '', email: '', password: '', orgName: '' })
  const [honeypot, setHoneypot] = useState('')
  const [error, setError] = useState('')

  const register = trpc.user.register.useMutation({
    onSuccess: async () => {
      const result = await signIn('credentials', {
        email: form.email,
        password: form.password,
        redirect: false,
      })
      if (result?.ok) {
        window.location.href = '/onboarding'
      } else {
        window.location.href = '/login'
      }
    },
    onError: (err) => setError(err.message),
  })

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    register.mutate({ ...form, website: honeypot })
  }

  const set = (field: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [field]: e.target.value }))

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[hsl(210,33%,95%)] py-12 px-4">
      <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-8 w-full max-w-md">
        <div className="text-center mb-8">
          <div className="inline-flex items-center gap-2 mb-3">
            <span className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white font-bold text-sm">V</span>
            <span className="text-xl font-bold text-slate-800">VytlRx</span>
          </div>
          <p className="text-slate-500 text-sm">Start your free trial</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5">
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
              {error}
            </div>
          )}

          {/* Honeypot — hidden from real users, bots fill it in */}
          <div style={{ position: 'absolute', left: '-9999px', opacity: 0, pointerEvents: 'none' }} aria-hidden="true">
            <label htmlFor="website">Website</label>
            <input
              id="website"
              name="website"
              type="text"
              value={honeypot}
              onChange={(e) => setHoneypot(e.target.value)}
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <div>
            <label htmlFor="name" className="block text-sm font-medium text-slate-700 mb-1.5">
              Your Name
            </label>
            <input
              id="name"
              type="text"
              value={form.name}
              onChange={set('name')}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Jane Smith"
              required
              minLength={2}
            />
          </div>

          <div>
            <label htmlFor="orgName" className="block text-sm font-medium text-slate-700 mb-1.5">
              Organisation Name
            </label>
            <input
              id="orgName"
              type="text"
              value={form.orgName}
              onChange={set('orgName')}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Acme Holdings (Pty) Ltd"
              required
              minLength={2}
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-slate-700 mb-1.5">
              Work Email
            </label>
            <input
              id="email"
              type="email"
              value={form.email}
              onChange={set('email')}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="jane@acmeholdings.co.za"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium text-slate-700 mb-1.5">
              Password
            </label>
            <input
              id="password"
              type="password"
              value={form.password}
              onChange={set('password')}
              className="w-full px-4 py-2 bg-white border border-slate-300 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-teal-500"
              placeholder="Min 8 characters"
              required
              minLength={8}
            />
          </div>

          <button
            type="submit"
            disabled={register.isPending || register.isSuccess}
            className="w-full py-3 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg transition-colors disabled:opacity-50 mt-2"
          >
            {register.isSuccess ? 'Signing you in…' : register.isPending ? 'Creating account…' : 'Create Account'}
          </button>
        </form>

        <p className="text-slate-500 text-sm text-center mt-6">
          Already have an account?{' '}
          <Link href="/login" className="text-teal-600 hover:text-teal-700">
            Sign in
          </Link>
        </p>

        <p className="text-slate-400 text-xs text-center mt-3">
          By creating an account you agree to our{' '}
          <Link href="/terms" className="text-slate-500 hover:text-slate-600 underline">Terms of Service</Link>
          {' '}and{' '}
          <Link href="/privacy" className="text-slate-500 hover:text-slate-600 underline">Privacy Policy</Link>.
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
