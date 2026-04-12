'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import {
  Building2, Users, SlidersHorizontal, LayoutTemplate, ShieldCheck, Bell,
} from 'lucide-react'
import { trpc } from '@/lib/trpc-client'
import { AppetiteSettings } from '@/components/appetite-settings'
import { SnapshotSettings } from '@/components/snapshot-settings'
import { getAllTemplates, type IndustryCode } from '@/lib/industry-templates'
import { SettingsPageShell } from '@/components/settings/settings-page-shell'
import { SettingsSectionCard } from '@/components/settings/settings-section-card'
import { AdminSidebarNav, type AdminSidebarNavItem } from '@/components/settings/admin-sidebar-nav'

const NAV_ITEMS: AdminSidebarNavItem[] = [
  { label: 'Organisation details', href: 'org',           icon: Building2 },
  { label: 'User management',      href: 'users',         icon: Users },
  { label: 'Risk framework',       href: 'framework',     icon: SlidersHorizontal },
  { label: 'Industry template',    href: 'template',      icon: LayoutTemplate },
  { label: 'POPIA / data',         href: 'popia',         icon: ShieldCheck },
  { label: 'Digest & notifications', href: 'notifications', icon: Bell },
]

const INDUSTRIES = [
  'Financial Services', 'Healthcare', 'Manufacturing', 'Retail',
  'Technology', 'Mining', 'Agriculture', 'Construction', 'Education', 'Government', 'Other',
]

// Shared input/label styles using design tokens
const inputCls = 'w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
const labelCls = 'text-sm font-medium text-foreground'
const helperCls = 'text-xs text-muted-foreground mt-1'
const btnPrimaryCls = 'px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors'
const btnSmCls = 'px-3 py-1.5 text-sm bg-primary text-primary-foreground rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors'

interface AdminClientProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

export function AdminClient({ user: _user }: AdminClientProps) {
  const [activeHref, setActiveHref] = useState('org')

  // ── Organisation ──────────────────────────────────────────────────────────
  const { data: org, refetch: refetchOrg } = trpc.organisation.get.useQuery()
  const [orgName, setOrgName]           = useState('')
  const [orgIndustry, setOrgIndustry]   = useState('')
  const [orgEmployees, setOrgEmployees] = useState('')
  const [orgSaved, setOrgSaved]         = useState(false)

  if (org && !orgName) {
    setOrgName(org.name)
    setOrgIndustry(org.industry || '')
    setOrgEmployees(org.employeeCount?.toString() || '')
  }

  const updateOrg = trpc.organisation.update.useMutation({
    onSuccess: () => { setOrgSaved(true); refetchOrg(); setTimeout(() => setOrgSaved(false), 3000) },
  })

  // ── POPIA ─────────────────────────────────────────────────────────────────
  const [retentionDays, setRetentionDays] = useState('')
  const [consentGiven, setConsentGiven]   = useState(false)
  const [popiaSaved, setPopiaSaved]       = useState(false)

  if (org && !retentionDays) {
    setRetentionDays(org.dataRetentionDays.toString())
    setConsentGiven(org.consentGiven)
  }

  const updatePopia = trpc.organisation.updatePopia.useMutation({
    onSuccess: () => { setPopiaSaved(true); refetchOrg(); setTimeout(() => setPopiaSaved(false), 3000) },
  })

  // ── Registers ─────────────────────────────────────────────────────────────
  const { data: registersList, refetch: refetchRegisters } = trpc.register.list.useQuery(
    undefined,
    { enabled: activeHref === 'framework' }
  )
  const [showRegisterForm,      setShowRegisterForm]      = useState(false)
  const [newRegisterName,       setNewRegisterName]       = useState('')
  const [newRegisterDescription,setNewRegisterDescription]= useState('')
  const [newRegisterStatus,     setNewRegisterStatus]     = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [editingRegisterId,     setEditingRegisterId]     = useState<string | null>(null)
  const [editRegisterName,      setEditRegisterName]      = useState('')
  const [editRegisterDescription,setEditRegisterDescription]= useState('')
  const [editRegisterStatus,    setEditRegisterStatus]    = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [registerSaved,         setRegisterSaved]         = useState(false)

  const createRegister = trpc.register.create.useMutation({
    onSuccess: () => {
      setRegisterSaved(true); setShowRegisterForm(false)
      setNewRegisterName(''); setNewRegisterDescription(''); setNewRegisterStatus('ACTIVE')
      refetchRegisters(); setTimeout(() => setRegisterSaved(false), 3000)
    },
  })
  const updateRegister = trpc.register.update.useMutation({
    onSuccess: () => {
      setRegisterSaved(true); setEditingRegisterId(null)
      refetchRegisters(); setTimeout(() => setRegisterSaved(false), 3000)
    },
  })
  const deleteRegister = trpc.register.delete.useMutation({
    onSuccess: () => refetchRegisters(),
  })

  const startEditRegister = (reg: { id: string; name: string; description: string | null; status: string }) => {
    setEditingRegisterId(reg.id)
    setEditRegisterName(reg.name)
    setEditRegisterDescription(reg.description || '')
    setEditRegisterStatus(reg.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')
  }

  // ── Templates ─────────────────────────────────────────────────────────────
  const router = useRouter()
  const { data: riskStats } = trpc.risk.stats.useQuery(
    undefined,
    { enabled: activeHref === 'template' }
  )
  const existingRiskCount = riskStats?.total ?? 0
  const [showTemplateConfirm, setShowTemplateConfirm] = useState<IndustryCode | null>(null)
  const [templateApplied,     setTemplateApplied]     = useState(false)

  const applyTemplate = trpc.template.applyTemplate.useMutation({
    onSuccess: () => {
      setTemplateApplied(true)
      setShowTemplateConfirm(null)
      setTimeout(() => { setTemplateApplied(false); router.push('/dashboard') }, 2000)
    },
  })

  // ── Handlers ──────────────────────────────────────────────────────────────
  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateOrg.mutate({ name: orgName, industry: orgIndustry || null, employeeCount: orgEmployees ? parseInt(orgEmployees) : null })
  }

  const handlePopiaSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePopia.mutate({ dataRetentionDays: parseInt(retentionDays) || 2555, consentGiven })
  }

  const handleCreateRegister = (e: React.FormEvent) => {
    e.preventDefault()
    createRegister.mutate({ name: newRegisterName, description: newRegisterDescription || undefined, status: newRegisterStatus })
  }

  const handleUpdateRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRegisterId) return
    updateRegister.mutate({ id: editingRegisterId, name: editRegisterName, description: editRegisterDescription || null, status: editRegisterStatus })
  }

  const handleDeleteRegister = (id: string) => {
    if (confirm('Delete this register? This cannot be undone.')) deleteRegister.mutate({ id })
  }

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      <SettingsPageShell
        title="Organisation admin"
        description="Configure your organisation's risk framework, users, and compliance settings."
      >
        <div className="flex gap-8 items-start">
          <AdminSidebarNav items={NAV_ITEMS} activeHref={activeHref} onSelect={setActiveHref} />

          <div className="flex-1 min-w-0 space-y-6">

            {/* ── Organisation details ───────────────────────────────────── */}
            {activeHref === 'org' && (
              <>
                <SettingsSectionCard title="Organisation details" badge="Admin only">
                  {/* Plan badge */}
                  {org && (
                    <div className="flex items-center justify-between p-4 rounded-lg border border-border bg-muted/40 mb-2">
                      <div>
                        <p className="text-xs text-muted-foreground mb-0.5">Current plan</p>
                        <p className="text-sm font-semibold text-foreground">
                          {(org as { plan?: string }).plan === 'PRO' ? 'Professional'
                            : (org as { plan?: string }).plan === 'ENTERPRISE' ? 'Enterprise'
                            : 'Free'}
                        </p>
                      </div>
                      {(org as { plan?: string }).plan === 'FREE' && (
                        <a
                          href="mailto:hello@vytlrx.app?subject=Upgrade%20to%20Professional"
                          className="px-4 py-2 bg-primary text-primary-foreground text-xs font-semibold rounded-lg hover:bg-primary-hover transition-colors"
                        >
                          Upgrade →
                        </a>
                      )}
                    </div>
                  )}
                  <form onSubmit={handleOrgSave} className="space-y-4">
                    <div>
                      <label className={labelCls}>Organisation name</label>
                      <input type="text" value={orgName} onChange={(e) => setOrgName(e.target.value)} required className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Industry</label>
                      <select value={orgIndustry} onChange={(e) => setOrgIndustry(e.target.value)} className={inputCls}>
                        <option value="">Select industry…</option>
                        {INDUSTRIES.map((ind) => <option key={ind} value={ind}>{ind}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className={labelCls}>Number of employees</label>
                      <input type="number" value={orgEmployees} onChange={(e) => setOrgEmployees(e.target.value)} min="1" placeholder="e.g. 50" className={inputCls} />
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {orgSaved && <span className="text-sm text-green-500">Saved!</span>}
                      <button type="submit" disabled={updateOrg.isPending} className={btnPrimaryCls}>
                        {updateOrg.isPending ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </SettingsSectionCard>

                <SettingsSectionCard title="Branding" badge="Admin only" description="Logo upload will be available in a future update." >
                  <p className="text-sm text-muted-foreground">Organisation branding customisation is coming soon.</p>
                </SettingsSectionCard>
              </>
            )}

            {/* ── User management ───────────────────────────────────────── */}
            {activeHref === 'users' && (
              <SettingsSectionCard
                title="Team members"
                badge="Admin only"
                description="Invite users, assign roles, and manage access from the team members page."
              >
                <a
                  href="/users"
                  className="inline-flex items-center gap-2 px-4 py-2 border border-border rounded-md text-sm text-foreground hover:bg-muted transition-colors"
                >
                  <Users className="w-4 h-4" />
                  Go to Team members page
                </a>
              </SettingsSectionCard>
            )}

            {/* ── Risk framework ────────────────────────────────────────── */}
            {activeHref === 'framework' && (
              <>
                {/* Risk appetite */}
                <SettingsSectionCard title="Risk appetite" badge="Admin only">
                  <AppetiteSettings />
                </SettingsSectionCard>

                {/* Score snapshots */}
                <SettingsSectionCard title="Score snapshots" badge="Admin only">
                  <SnapshotSettings />
                </SettingsSectionCard>

                {/* Risk registers */}
                <SettingsSectionCard title="Risk registers" badge="Admin only" description="Manage separate risk registers for different business units, projects, or compliance frameworks.">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-foreground">Your registers</span>
                    <button onClick={() => setShowRegisterForm(!showRegisterForm)} className={btnSmCls}>
                      {showRegisterForm ? 'Cancel' : '+ Add register'}
                    </button>
                  </div>

                  {registerSaved && <p className="text-sm text-green-500 mb-2">Saved!</p>}

                  {showRegisterForm && (
                    <form onSubmit={handleCreateRegister} className="space-y-3 mb-4 p-4 bg-muted/40 border border-border rounded-md">
                      <div>
                        <label className={labelCls}>Name</label>
                        <input type="text" value={newRegisterName} onChange={(e) => setNewRegisterName(e.target.value)} required placeholder="e.g. IT Risk Register" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Description</label>
                        <input type="text" value={newRegisterDescription} onChange={(e) => setNewRegisterDescription(e.target.value)} placeholder="Optional description…" className={inputCls} />
                      </div>
                      <div>
                        <label className={labelCls}>Status</label>
                        <select value={newRegisterStatus} onChange={(e) => setNewRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')} className={inputCls}>
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                      <button type="submit" disabled={createRegister.isPending || !newRegisterName} className={btnPrimaryCls}>
                        {createRegister.isPending ? 'Creating…' : 'Save changes'}
                      </button>
                      {createRegister.isError && <p className="text-destructive text-sm">{createRegister.error.message}</p>}
                    </form>
                  )}

                  {registersList && registersList.length > 0 ? (
                    <div className="space-y-2">
                      {registersList.map((reg) => (
                        <div key={reg.id} className="p-4 bg-muted/40 border border-border rounded-md">
                          {editingRegisterId === reg.id ? (
                            <form onSubmit={handleUpdateRegister} className="space-y-3">
                              <input type="text" value={editRegisterName} onChange={(e) => setEditRegisterName(e.target.value)} required className={inputCls} />
                              <input type="text" value={editRegisterDescription} onChange={(e) => setEditRegisterDescription(e.target.value)} placeholder="Description…" className={inputCls} />
                              <select value={editRegisterStatus} onChange={(e) => setEditRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')} className={inputCls}>
                                <option value="DRAFT">Draft</option>
                                <option value="ACTIVE">Active</option>
                                <option value="ARCHIVED">Archived</option>
                              </select>
                              <div className="flex gap-2">
                                <button type="submit" disabled={updateRegister.isPending} className={btnSmCls}>
                                  {updateRegister.isPending ? 'Saving…' : 'Save changes'}
                                </button>
                                <button type="button" onClick={() => setEditingRegisterId(null)} className="px-3 py-1.5 text-sm text-muted-foreground hover:text-foreground transition-colors">
                                  Cancel
                                </button>
                              </div>
                              {updateRegister.isError && <p className="text-destructive text-sm">{updateRegister.error.message}</p>}
                            </form>
                          ) : (
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium text-foreground">{reg.name}</p>
                                  <span className={`text-xs px-2 py-0.5 rounded ${
                                    reg.status === 'ACTIVE' ? 'bg-green-500/20 text-green-500'
                                    : reg.status === 'DRAFT' ? 'bg-amber-500/20 text-amber-500'
                                    : 'bg-muted text-muted-foreground'
                                  }`}>{reg.status}</span>
                                  <span className="text-xs text-muted-foreground">{reg._count.risks} risk{reg._count.risks !== 1 ? 's' : ''}</span>
                                </div>
                                {reg.description && <p className="text-xs text-muted-foreground mt-0.5">{reg.description}</p>}
                              </div>
                              <div className="flex items-center gap-3">
                                <button onClick={() => startEditRegister(reg)} className="text-xs text-primary hover:underline">Edit</button>
                                <button onClick={() => handleDeleteRegister(reg.id)} disabled={deleteRegister.isPending} className="text-xs text-destructive hover:underline disabled:opacity-50">Delete</button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground">No registers found.</p>
                  )}
                  {deleteRegister.isError && <p className="text-destructive text-sm mt-2">{deleteRegister.error.message}</p>}
                </SettingsSectionCard>
              </>
            )}

            {/* ── Industry template ─────────────────────────────────────── */}
            {activeHref === 'template' && (
              <SettingsSectionCard title="Industry template" badge="Admin only" description="Apply a pre-built SA risk library to your organisation. A new register with 15 pre-scored risks will be created.">
                {existingRiskCount > 0 && (
                  <div className="flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                    <span className="text-amber-500 text-sm">⚠</span>
                    <p className="text-amber-500 text-sm">
                      Your organisation already has {existingRiskCount} risk{existingRiskCount !== 1 ? 's' : ''}. Applying a template will <strong>add</strong> 15 new risks alongside your existing data.
                    </p>
                  </div>
                )}
                {templateApplied && (
                  <div className="flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                    <span className="text-green-500 text-sm">✓</span>
                    <p className="text-green-500 text-sm">Template applied! Redirecting to dashboard…</p>
                  </div>
                )}
                {applyTemplate.isError && (
                  <div className="bg-destructive/10 border border-destructive/30 rounded-lg px-4 py-3">
                    <p className="text-destructive text-sm">{applyTemplate.error.message}</p>
                  </div>
                )}

                {/* Confirmation dialog */}
                {showTemplateConfirm && (
                  <div className="bg-muted/40 border border-border rounded-xl p-5 mb-4">
                    <h3 className="text-sm font-semibold text-foreground mb-2">Confirm template application</h3>
                    <p className="text-sm text-muted-foreground mb-4">
                      This will create a new register and add 15 pre-scored {showTemplateConfirm.replace(/_/g, ' ').toLowerCase()} risks.
                      {existingRiskCount > 0 ? ' Your existing risks will not be affected.' : ''}
                    </p>
                    <div className="flex gap-3">
                      <button
                        onClick={() => { applyTemplate.mutate({ industryCode: showTemplateConfirm, force: true }); setShowTemplateConfirm(null) }}
                        disabled={applyTemplate.isPending}
                        className={btnPrimaryCls}
                      >
                        {applyTemplate.isPending ? 'Applying…' : 'Apply template'}
                      </button>
                      <button onClick={() => setShowTemplateConfirm(null)} className="px-4 py-2 border border-border text-sm text-muted-foreground rounded-md hover:bg-muted transition-colors">
                        Cancel
                      </button>
                    </div>
                  </div>
                )}

                {/* Template cards */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {getAllTemplates().map((template) => (
                    <button
                      key={template.code}
                      onClick={() => !applyTemplate.isPending && setShowTemplateConfirm(template.code)}
                      disabled={applyTemplate.isPending}
                      className={`text-left bg-muted/40 border-2 rounded-xl p-4 transition-all hover:border-primary disabled:opacity-50 disabled:cursor-not-allowed ${
                        showTemplateConfirm === template.code ? 'border-primary' : 'border-border'
                      }`}
                    >
                      <span className="text-xs font-medium text-primary uppercase tracking-wider">{template.code.replace(/_/g, ' ')}</span>
                      <h3 className="text-sm font-semibold text-foreground mt-1 mb-1">{template.name}</h3>
                      <p className="text-xs text-muted-foreground mb-2">{template.description}</p>
                      <div className="flex items-center gap-3 text-xs text-muted-foreground mb-2">
                        <span>{template.risks.length} risks</span>
                        <span>Benchmark: {template.benchmarkScore}</span>
                      </div>
                      <div className="border-t border-border pt-2 space-y-1">
                        {template.risks.slice(0, 3).map((r, i) => (
                          <div key={i} className="text-xs text-muted-foreground flex items-start gap-1.5">
                            <span className="text-primary mt-0.5">•</span>
                            <span className="line-clamp-1">{r.title}</span>
                          </div>
                        ))}
                      </div>
                    </button>
                  ))}
                </div>
              </SettingsSectionCard>
            )}

            {/* ── POPIA / data governance ───────────────────────────────── */}
            {activeHref === 'popia' && (
              <>
                <SettingsSectionCard title="Data retention" badge="Admin only" description="The Protection of Personal Information Act (POPIA) requires South African organisations to handle personal data responsibly.">
                  <form onSubmit={handlePopiaSave} className="space-y-4">
                    <div>
                      <label className={labelCls}>Data retention period (days)</label>
                      <input
                        type="number"
                        value={retentionDays}
                        onChange={(e) => setRetentionDays(e.target.value)}
                        min="365"
                        max="3650"
                        className={inputCls}
                      />
                      <p className={helperCls}>Minimum 1 year (365 days), maximum 10 years (3650 days). Default is 7 years.</p>
                    </div>
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {popiaSaved && <span className="text-sm text-green-500">Saved!</span>}
                      <button type="submit" disabled={updatePopia.isPending} className={btnPrimaryCls}>
                        {updatePopia.isPending ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </SettingsSectionCard>

                <SettingsSectionCard title="Consent management" badge="Admin only">
                  <form onSubmit={handlePopiaSave} className="space-y-4">
                    <div className="flex items-start gap-3">
                      <input
                        type="checkbox"
                        id="consent"
                        checked={consentGiven}
                        onChange={(e) => setConsentGiven(e.target.checked)}
                        className="mt-1 h-4 w-4 rounded border-border accent-primary"
                      />
                      <label htmlFor="consent" className="text-sm text-foreground">
                        <span className="font-medium">Data Processing Consent</span>
                        <br />
                        <span className="text-muted-foreground">
                          I confirm that this organisation has obtained necessary consent from data subjects for processing their personal information in accordance with POPIA requirements.
                        </span>
                      </label>
                    </div>
                    {org?.consentDate && (
                      <p className={helperCls}>Consent recorded on: {new Date(org.consentDate).toLocaleDateString()}</p>
                    )}
                    <div className="flex items-center justify-end gap-3 pt-2">
                      {popiaSaved && <span className="text-sm text-green-500">Saved!</span>}
                      <button type="submit" disabled={updatePopia.isPending} className={btnPrimaryCls}>
                        {updatePopia.isPending ? 'Saving…' : 'Save changes'}
                      </button>
                    </div>
                  </form>
                </SettingsSectionCard>
              </>
            )}

            {/* ── Digest & notifications ────────────────────────────────── */}
            {/* No digest config existed in the old settings; placeholder for future implementation */}
            {activeHref === 'notifications' && (
              <SettingsSectionCard
                title="Weekly digest"
                badge="Admin only"
                description="Configure who receives the organisation's weekly risk digest and how often it is sent."
              >
                <p className="text-sm text-muted-foreground">
                  Organisation-level digest configuration will be available in a future update.
                </p>
              </SettingsSectionCard>
            )}

          </div>
        </div>
      </SettingsPageShell>
    </div>
  )
}
