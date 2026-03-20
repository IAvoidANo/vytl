import Link from 'next/link'

export function PublicFooter() {
  const currentYear = new Date().getFullYear()

  return (
    <footer className="bg-[hsl(210,33%,94%)] border-t border-[hsl(210,20%,87%)]">
      <div className="max-w-6xl mx-auto px-6 py-8">
        {/* Top row: copyright + region */}
        <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4 mb-6">
          <p className="text-sm text-slate-600 max-w-sm leading-relaxed">
            © {currentYear} VYTL (Pty) Ltd. All rights reserved. &ldquo;VYTL&rdquo; and &ldquo;Intelligent Risk, Simplified&rdquo; are trademarks of VYTL (Pty) Ltd.
          </p>
          <div className="flex items-center gap-2 text-sm text-slate-600 shrink-0">
            <span className="text-lg">🇿🇦</span>
            <span>Region</span>
            <span className="text-[hsl(210,80%,45%)] font-semibold">South Africa (RAND)</span>
          </div>
        </div>

        {/* Bottom row: legal links + social icons */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <nav className="flex flex-wrap gap-x-6 gap-y-2">
            {[
              { href: '/legal', label: 'Legal' },
              { href: '/privacy', label: 'Privacy notice' },
              { href: '/sitemap', label: 'Sitemap' },
              { href: '/accessibility', label: 'Accessibility' },
            ].map(({ href, label }) => (
              <Link
                key={href}
                href={href}
                className="text-sm text-[hsl(210,80%,45%)] hover:text-[hsl(210,80%,35%)] underline underline-offset-2 transition-colors"
              >
                {label}
              </Link>
            ))}
          </nav>

          <div className="flex items-center gap-4">
            {/* LinkedIn */}
            <a href="https://linkedin.com/company/vytl" target="_blank" rel="noopener noreferrer" aria-label="LinkedIn" className="text-slate-500 hover:text-[hsl(210,80%,45%)] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
              </svg>
            </a>
            {/* X / Twitter */}
            <a href="https://x.com/vytl_app" target="_blank" rel="noopener noreferrer" aria-label="X (Twitter)" className="text-slate-500 hover:text-[hsl(210,80%,45%)] transition-colors">
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.74l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z"/>
              </svg>
            </a>
          </div>
        </div>
      </div>
    </footer>
  )
}
