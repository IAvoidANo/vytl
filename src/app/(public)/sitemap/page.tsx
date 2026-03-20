import type { Metadata } from 'next'
import Link from 'next/link'

export const metadata: Metadata = {
  title: 'Sitemap | VYTL',
  description: 'HTML sitemap for the VYTL risk management platform — navigate all pages and application sections.',
}

const sitemapGroups = [
  {
    title: 'Getting Started',
    description: 'Create an account and get your organisation set up with VYTL.',
    links: [
      { href: '/register', label: 'Create account', description: 'Sign up for a free VYTL account for your organisation' },
      { href: '/login', label: 'Sign in', description: 'Log in to your existing VYTL account' },
      { href: '/onboarding', label: 'Onboarding wizard', description: 'Set up your risk register with an industry template' },
      { href: '/forgot-password', label: 'Forgot password', description: 'Request a password reset link' },
      { href: '/accept-invite', label: 'Accept invitation', description: 'Accept a team invitation to join an organisation' },
    ],
  },
  {
    title: 'Application',
    description: 'Core platform features available after signing in.',
    links: [
      { href: '/dashboard', label: 'Dashboard', description: 'Organisation risk overview, Vytl Score, and key widgets' },
      { href: '/risks', label: 'Risk Register', description: 'View, create, and manage all risks in your organisation' },
      { href: '/workspace', label: 'Risk Workspace', description: 'Kanban board for managing risk workflow (Inbox → Triage → Assigned → Approved)' },
      { href: '/reports', label: 'Reports', description: 'Board governance reports, heatmaps, category trends, and movement analysis' },
      { href: '/actions', label: 'Actions Register', description: 'Organisation-wide view of all treatment action items' },
      { href: '/kris', label: 'KRI Monitoring', description: 'Key Risk Indicator dashboard with thresholds and status tracking' },
      { href: '/users', label: 'Team Management', description: 'Invite users, manage roles, and control access (Admin and above)' },
      { href: '/settings', label: 'Settings', description: 'Profile, security, organisation, POPIA compliance, methodology, registers, risk appetite, and snapshots' },
    ],
  },
  {
    title: 'Legal & Company',
    description: 'Legal notices, policies, and information about VYTL (Pty) Ltd.',
    links: [
      { href: '/legal', label: 'Legal notice', description: 'Intellectual property, disclaimers, limitation of liability, and governing law' },
      { href: '/privacy', label: 'Privacy notice', description: 'POPIA-compliant privacy notice — how we collect, use, and protect your personal information' },
      { href: '/terms', label: 'Terms of service', description: 'Subscription terms, acceptable use, data ownership, and governing law' },
      { href: '/accessibility', label: 'Accessibility statement', description: 'Our WCAG 2.1 AA commitment, conformance status, and how to report barriers' },
      { href: '/sitemap', label: 'Sitemap', description: 'This page — an overview of all pages on the VYTL platform' },
    ],
  },
]

export default function SitemapPage() {
  return (
    <div className="max-w-3xl mx-auto px-6 py-12">
      <h1 className="text-3xl font-bold text-slate-900 mb-2">Sitemap</h1>
      <p className="text-sm text-slate-500 mb-10">Last updated: March 2026</p>

      <div className="space-y-10">

        {sitemapGroups.map((group) => (
          <section key={group.title}>
            <h2 className="text-xl font-semibold text-slate-800 mb-1">{group.title}</h2>
            <p className="text-sm text-slate-500 mb-4">{group.description}</p>
            <ul className="divide-y divide-slate-200 border border-slate-200 rounded-lg overflow-hidden">
              {group.links.map((link) => (
                <li key={link.href} className="bg-white hover:bg-slate-50 transition-colors">
                  <Link href={link.href} className="flex flex-col sm:flex-row sm:items-center gap-1 sm:gap-4 px-5 py-4 group">
                    <span className="text-[hsl(210,80%,45%)] font-medium group-hover:underline underline-offset-2 shrink-0 w-44">
                      {link.label}
                    </span>
                    <span className="text-sm text-slate-500 leading-relaxed">{link.description}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        ))}

      </div>
    </div>
  )
}
