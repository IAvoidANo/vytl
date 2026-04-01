import { auth } from '@/lib/auth'
import { redirect } from 'next/navigation'
import Link from 'next/link'
import { PublicFooter } from '@/components/public-footer'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'VytlRx — Intelligent Risk Management for South African Business',
  description:
    'VytlRx is the risk management platform built for South African enterprises. King IV, POPIA and ISO 31000 compliant. Start free in minutes.',
}

export default async function HomePage() {
  const session = await auth()
  if (session?.user) redirect('/dashboard')

  return (
    <div className="min-h-screen flex flex-col bg-[hsl(210,33%,95%)]">
      {/* ── Nav ─────────────────────────────────────────────── */}
      <header className="bg-white border-b border-[hsl(210,20%,87%)] sticky top-0 z-20">
        <div className="max-w-6xl mx-auto px-6 h-14 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-2 font-bold text-lg text-slate-800">
            <span className="w-7 h-7 rounded-md bg-gradient-to-br from-teal-500 to-teal-600 flex items-center justify-center text-white text-xs font-bold">
              V
            </span>
            VytlRx
          </Link>
          <nav className="hidden md:flex items-center gap-8 text-sm text-slate-600">
            <a href="#features" className="hover:text-slate-900 transition-colors">Features</a>
            <a href="#how-it-works" className="hover:text-slate-900 transition-colors">How it works</a>
            <a href="#compliance" className="hover:text-slate-900 transition-colors">Compliance</a>
            <a href="#pricing" className="hover:text-slate-900 transition-colors">Pricing</a>
          </nav>
          <div className="flex items-center gap-3 text-sm">
            <Link href="/login" className="text-slate-600 hover:text-slate-900 transition-colors">
              Sign in
            </Link>
            <Link
              href="/register"
              className="px-4 py-2 bg-teal-500 hover:bg-teal-600 text-white rounded-md font-semibold transition-colors"
            >
              Start free
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">

        {/* ── Hero ────────────────────────────────────────────── */}
        <section className="pt-20 pb-24 px-6">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-50 border border-teal-200 text-teal-700 text-xs font-medium mb-8">
              <span className="w-1.5 h-1.5 rounded-full bg-teal-500"></span>
              Built for South African enterprises · King IV · POPIA · ISO 31000
            </div>

            <h1 className="text-5xl md:text-6xl font-extrabold text-slate-900 leading-tight tracking-tight mb-6">
              Intelligent risk,
              <br />
              <span className="text-teal-500">simplified.</span>
            </h1>

            <p className="text-xl text-slate-600 max-w-2xl mx-auto leading-relaxed mb-10">
              VYTL gives risk and compliance teams one place to identify, score, monitor and
              report on risk — with built-in King IV, POPIA and ISO 31000 alignment. Ready in
              minutes, not months.
            </p>

            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link
                href="/register"
                className="px-8 py-3.5 bg-teal-500 hover:bg-teal-600 text-white font-semibold rounded-lg text-base transition-colors shadow-sm"
              >
                Start free — no credit card required
              </Link>
              <a
                href="#how-it-works"
                className="px-8 py-3.5 bg-white hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-base border border-slate-200 transition-colors"
              >
                See how it works
              </a>
            </div>

            <p className="text-sm text-slate-400 mt-5">
              Set up in under 5 minutes · Your data stays in South Africa
            </p>
          </div>

          {/* Dashboard preview card */}
          <div className="max-w-5xl mx-auto mt-16">
            <div className="bg-white rounded-2xl shadow-xl border border-slate-200 overflow-hidden">
              <div className="bg-slate-800 px-4 py-3 flex items-center gap-2">
                <span className="w-3 h-3 rounded-full bg-red-400"></span>
                <span className="w-3 h-3 rounded-full bg-yellow-400"></span>
                <span className="w-3 h-3 rounded-full bg-green-400"></span>
                <span className="ml-3 text-slate-400 text-xs">vytlrx.app/dashboard</span>
              </div>
              <div className="p-6 bg-[hsl(210,33%,96%)]">
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                  {[
                    { label: 'VytlRx Score', value: 'B+', sub: '71 / 100', color: 'text-teal-600' },
                    { label: 'Active Risks', value: '47', sub: '3 critical', color: 'text-red-500' },
                    { label: 'Open Actions', value: '12', sub: '4 overdue', color: 'text-amber-600' },
                    { label: 'KRIs Monitored', value: '18', sub: '2 in breach', color: 'text-slate-700' },
                  ].map((s) => (
                    <div key={s.label} className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm">
                      <p className="text-xs text-slate-500 mb-1">{s.label}</p>
                      <p className={`text-2xl font-bold ${s.color}`}>{s.value}</p>
                      <p className="text-xs text-slate-400 mt-0.5">{s.sub}</p>
                    </div>
                  ))}
                </div>
                <div className="grid grid-cols-3 gap-4">
                  <div className="col-span-2 bg-white rounded-xl p-4 border border-slate-100 shadow-sm h-32 flex flex-col justify-between">
                    <p className="text-xs font-medium text-slate-600">Risk Heatmap</p>
                    <div className="grid grid-cols-5 gap-1 flex-1 mt-2">
                      {[
                        'bg-green-100','bg-green-100','bg-amber-100','bg-amber-100','bg-red-200',
                        'bg-green-100','bg-amber-100','bg-amber-100','bg-red-200','bg-red-400',
                        'bg-amber-100','bg-amber-100','bg-red-200','bg-red-400','bg-red-600',
                        'bg-amber-100','bg-red-200','bg-red-400','bg-red-600','bg-red-600',
                        'bg-red-200','bg-red-400','bg-red-600','bg-red-600','bg-red-700',
                      ].map((c, i) => (
                        <div key={i} className={`rounded-sm ${c} opacity-80`}></div>
                      ))}
                    </div>
                  </div>
                  <div className="bg-white rounded-xl p-4 border border-slate-100 shadow-sm h-32">
                    <p className="text-xs font-medium text-slate-600 mb-2">Top Risks</p>
                    <div className="space-y-1.5">
                      {['Cyber Incident', 'POPIA Breach', 'Load Shedding'].map((r, i) => (
                        <div key={r} className="flex items-center gap-2">
                          <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${i === 0 ? 'bg-red-500' : i === 1 ? 'bg-amber-500' : 'bg-amber-400'}`}></span>
                          <span className="text-xs text-slate-600 truncate">{r}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ── Trust bar ───────────────────────────────────────── */}
        <section className="py-10 bg-white border-y border-slate-200">
          <div className="max-w-4xl mx-auto px-6 text-center">
            <p className="text-sm text-slate-400 mb-6 uppercase tracking-widest font-medium">
              Trusted by risk teams across South Africa
            </p>
            <div className="flex flex-wrap items-center justify-center gap-x-12 gap-y-4">
              {['Financial Services', 'Mining & Resources', 'Healthcare', 'Manufacturing', 'Retail', 'Technology'].map((industry) => (
                <span key={industry} className="text-slate-400 font-semibold text-sm">{industry}</span>
              ))}
            </div>
          </div>
        </section>

        {/* ── Features ────────────────────────────────────────── */}
        <section id="features" className="py-24 px-6">
          <div className="max-w-6xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Everything your risk team needs
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                From first risk entry to board presentation — VytlRx covers the full risk management
                lifecycle without the complexity of legacy GRC tools.
              </p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  icon: '🎯',
                  title: 'AI-Powered Risk Scoring',
                  desc: 'Five-dimension composite scoring across Base Risk, Control Quality, Velocity, Correlation and KRI Alignment. Automatic Value-at-Risk (VaR) calculated per risk.',
                },
                {
                  icon: '📋',
                  title: 'Regulatory Compliance',
                  desc: 'Built-in mapping to King IV (35 principles), ISO 31000:2018 (16 requirements), POPIA, FICA and B-BBEE. Track your coverage percentage per framework.',
                },
                {
                  icon: '📊',
                  title: 'Board-Ready Reports',
                  desc: 'Generate multi-page PDF board packs in one click — heatmap, top-10 risks, VaR table, KRI status and trend analysis included.',
                },
                {
                  icon: '⚡',
                  title: 'Industry Templates',
                  desc: 'Start instantly with 15 pre-built, SA-contextual risks for Manufacturing, Financial Services or Retail. Customise from day one.',
                },
                {
                  icon: '🔔',
                  title: 'KRI Monitoring & Alerts',
                  desc: 'Define key risk indicators with green/amber/red thresholds. Automatic email alerts when KRIs breach, with a weekly digest for leadership.',
                },
                {
                  icon: '👥',
                  title: 'Team Collaboration',
                  desc: 'Role-based access (Owner, Admin, Risk Manager, Editor, Viewer). Kanban workflow, treatment action tracking, and full audit trail.',
                },
                {
                  icon: '📈',
                  title: 'Movement & Trends',
                  desc: 'Weekly portfolio snapshots show which risks improved or deteriorated. Period-over-period comparison for quarterly risk reviews.',
                },
                {
                  icon: '🔒',
                  title: 'POPIA Compliant by Design',
                  desc: 'Configurable data retention, consent tracking, information officer designation, and right-to-erasure support built into the platform.',
                },
                {
                  icon: '📥',
                  title: 'Bulk Import',
                  desc: 'Upload Excel, CSV, PDF or Word files. AI extracts and maps risk data automatically, with smart header detection and enum normalisation.',
                },
              ].map((f) => (
                <div key={f.title} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm hover:shadow-md transition-shadow">
                  <div className="text-3xl mb-4">{f.icon}</div>
                  <h3 className="font-semibold text-slate-900 mb-2">{f.title}</h3>
                  <p className="text-sm text-slate-600 leading-relaxed">{f.desc}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── How it works ────────────────────────────────────── */}
        <section id="how-it-works" className="py-24 px-6 bg-white border-y border-slate-200">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Up and running in minutes
              </h2>
              <p className="text-lg text-slate-600">
                No implementation project. No consultant. Just sign up and go.
              </p>
            </div>

            <div className="relative">
              <div className="hidden md:block absolute left-[calc(50%-1px)] top-8 bottom-8 w-0.5 bg-slate-200"></div>
              <div className="space-y-12">
                {[
                  {
                    step: '01',
                    title: 'Create your account',
                    desc: 'Register with your name, organisation and email. Choose your industry — Manufacturing, Financial Services or Retail — and VytlRx loads 15 SA-contextual risks instantly. Or start with a blank register.',
                    side: 'left',
                  },
                  {
                    step: '02',
                    title: 'Score and monitor your risks',
                    desc: 'Rate each risk on likelihood and impact. VytlRx calculates your VytlRx Score, flags appetite breaches, tracks KRIs and suggests AI-driven improvements. Link incidents, map to regulations, assign treatment actions.',
                    side: 'right',
                  },
                  {
                    step: '03',
                    title: 'Report with confidence',
                    desc: 'Generate your board risk report in one click — a professional PDF with heatmap, top-10 risks, VaR table and trend commentary. Export for audit, regulators or exco.',
                    side: 'left',
                  },
                ].map((s) => (
                  <div key={s.step} className={`flex gap-8 items-start ${s.side === 'right' ? 'md:flex-row-reverse' : ''}`}>
                    <div className="flex-1 bg-[hsl(210,33%,96%)] rounded-xl p-6 border border-slate-200">
                      <div className="text-5xl font-black text-slate-100 mb-3 leading-none">{s.step}</div>
                      <h3 className="text-xl font-bold text-slate-900 mb-2">{s.title}</h3>
                      <p className="text-slate-600 leading-relaxed text-sm">{s.desc}</p>
                    </div>
                    <div className="hidden md:flex w-8 items-start justify-center pt-8 flex-shrink-0">
                      <div className="w-4 h-4 rounded-full bg-teal-500 border-4 border-white shadow-sm ring-1 ring-teal-300"></div>
                    </div>
                    <div className="flex-1 hidden md:block"></div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ── Compliance ──────────────────────────────────────── */}
        <section id="compliance" className="py-24 px-6">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Built for the South African regulatory landscape
              </h2>
              <p className="text-lg text-slate-600 max-w-2xl mx-auto">
                VytlRx is designed from the ground up for SA compliance requirements — not retrofitted
                from an international tool.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6">
              {[
                {
                  badge: 'King IV',
                  title: 'King IV Report on Corporate Governance',
                  desc: 'Map every risk to King IV\'s 35 governance principles across all 17 sectors. Track coverage percentage and report to your audit and risk committee with confidence.',
                  color: 'bg-blue-50 border-blue-200 text-blue-700',
                },
                {
                  badge: 'POPIA',
                  title: 'Protection of Personal Information Act',
                  desc: 'POPIA-compliant data architecture with configurable retention periods, consent tracking, data subject rights management, and Information Officer designation.',
                  color: 'bg-teal-50 border-teal-200 text-teal-700',
                },
                {
                  badge: 'ISO 31000',
                  title: 'ISO 31000:2018 Risk Management',
                  desc: 'Align your risk register to all 16 ISO 31000 requirements. Built-in framework mapping helps demonstrate compliance during audits and certification reviews.',
                  color: 'bg-purple-50 border-purple-200 text-purple-700',
                },
                {
                  badge: 'FICA & B-BBEE',
                  title: 'FICA, B-BBEE, NCA & More',
                  desc: 'Regulatory risk categories covering FICA/AML, B-BBEE compliance, NCA obligations, FSCA requirements and OHS Act — with pre-built risk examples for each.',
                  color: 'bg-amber-50 border-amber-200 text-amber-700',
                },
              ].map((c) => (
                <div key={c.badge} className="bg-white rounded-xl p-6 border border-slate-200 shadow-sm flex gap-4">
                  <div className={`shrink-0 px-2.5 py-1 rounded-md border text-xs font-bold h-fit ${c.color}`}>
                    {c.badge}
                  </div>
                  <div>
                    <h3 className="font-semibold text-slate-900 mb-1.5">{c.title}</h3>
                    <p className="text-sm text-slate-600 leading-relaxed">{c.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Testimonials ────────────────────────────────────── */}
        <section className="py-24 px-6 bg-white border-y border-slate-200">
          <div className="max-w-5xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl font-bold text-slate-900 mb-4">
                What risk professionals say
              </h2>
            </div>

            <div className="grid md:grid-cols-3 gap-6">
              {[
                {
                  quote: 'We went from a spreadsheet-based risk register to a fully mapped King IV framework in one afternoon. The board report alone saves us two days every quarter.',
                  name: 'Chief Risk Officer',
                  org: 'JSE-listed Financial Services Group',
                },
                {
                  quote: 'The industry template gave us 15 risks we\'d actually identified ourselves — load shedding, POPIA, OHS Act. It felt like the platform understood our business from day one.',
                  name: 'Risk Manager',
                  org: 'Large Manufacturing Company, Gauteng',
                },
                {
                  quote: 'Our external auditors were impressed by the audit trail and regulatory mapping. VytlRx made our ISO 31000 certification review significantly easier to evidence.',
                  name: 'Head of Compliance',
                  org: 'Healthcare Group, Western Cape',
                },
              ].map((t) => (
                <div key={t.name} className="bg-[hsl(210,33%,96%)] rounded-xl p-6 border border-slate-200">
                  <p className="text-slate-700 text-sm leading-relaxed mb-6 italic">
                    &ldquo;{t.quote}&rdquo;
                  </p>
                  <div>
                    <p className="text-sm font-semibold text-slate-800">{t.name}</p>
                    <p className="text-xs text-slate-500">{t.org}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Pricing ─────────────────────────────────────────── */}
        <section id="pricing" className="py-24 px-6">
          <div className="max-w-4xl mx-auto">
            <div className="text-center mb-16">
              <h2 className="text-3xl md:text-4xl font-bold text-slate-900 mb-4">
                Simple, transparent pricing
              </h2>
              <p className="text-lg text-slate-600">
                Start free. Scale as your team grows.
              </p>
            </div>

            <div className="grid md:grid-cols-2 gap-6 max-w-3xl mx-auto">
              {[
                {
                  name: 'Starter',
                  price: 'Free',
                  period: 'forever',
                  desc: 'Perfect for small teams getting started with risk management.',
                  features: [
                    'Up to 25 risks',
                    '3 users',
                    'Industry templates',
                    'Basic reporting',
                    'King IV & ISO 31000 mapping',
                    'Email support',
                  ],
                  cta: 'Start free',
                  href: '/register',
                  highlight: false,
                },
                {
                  name: 'Professional',
                  price: 'Contact us',
                  period: 'per month',
                  desc: 'For growing risk teams that need unlimited registers and advanced reporting.',
                  features: [
                    'Unlimited risks & registers',
                    'Unlimited users',
                    'AI-powered scoring',
                    'Board report PDF export',
                    'VaR calculations',
                    'Movement & trend analysis',
                    'Priority support',
                    'Custom onboarding',
                  ],
                  cta: 'Get in touch',
                  href: 'mailto:hello@vytlrx.app',
                  highlight: true,
                },
              ].map((plan) => (
                <div
                  key={plan.name}
                  className={`rounded-xl p-8 border ${
                    plan.highlight
                      ? 'bg-teal-500 border-teal-400 text-white'
                      : 'bg-white border-slate-200 text-slate-900'
                  } shadow-sm`}
                >
                  <h3 className={`font-bold text-xl mb-1 ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline gap-1 mb-2">
                    <span className={`text-3xl font-extrabold ${plan.highlight ? 'text-white' : 'text-slate-900'}`}>
                      {plan.price}
                    </span>
                    {plan.price !== 'Contact us' && (
                      <span className={`text-sm ${plan.highlight ? 'text-teal-100' : 'text-slate-500'}`}>
                        / {plan.period}
                      </span>
                    )}
                  </div>
                  <p className={`text-sm mb-6 ${plan.highlight ? 'text-teal-100' : 'text-slate-500'}`}>
                    {plan.desc}
                  </p>
                  <ul className="space-y-2.5 mb-8">
                    {plan.features.map((f) => (
                      <li key={f} className="flex items-start gap-2 text-sm">
                        <svg className={`w-4 h-4 mt-0.5 flex-shrink-0 ${plan.highlight ? 'text-teal-100' : 'text-teal-500'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                        <span className={plan.highlight ? 'text-teal-50' : 'text-slate-600'}>{f}</span>
                      </li>
                    ))}
                  </ul>
                  <a
                    href={plan.href}
                    className={`block text-center py-2.5 rounded-lg font-semibold text-sm transition-colors ${
                      plan.highlight
                        ? 'bg-white text-teal-600 hover:bg-teal-50'
                        : 'bg-teal-500 text-white hover:bg-teal-600'
                    }`}
                  >
                    {plan.cta}
                  </a>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ── Final CTA ───────────────────────────────────────── */}
        <section className="py-24 px-6 bg-slate-900">
          <div className="max-w-2xl mx-auto text-center">
            <h2 className="text-3xl md:text-4xl font-bold text-white mb-4">
              Ready to simplify your risk management?
            </h2>
            <p className="text-slate-400 text-lg mb-10">
              Join SA risk teams already using VytlRx to meet their King IV, POPIA and ISO 31000
              obligations — without the spreadsheet chaos.
            </p>
            <Link
              href="/register"
              className="inline-block px-10 py-4 bg-teal-500 hover:bg-teal-400 text-white font-bold rounded-lg text-base transition-colors shadow-lg"
            >
              Start free today
            </Link>
            <p className="text-slate-500 text-sm mt-5">No credit card · Set up in 5 minutes · Cancel anytime</p>
          </div>
        </section>
      </main>

      <PublicFooter />
    </div>
  )
}
