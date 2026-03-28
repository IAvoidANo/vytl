'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { AppetiteSettings } from '@/components/appetite-settings'
import { SnapshotSettings } from '@/components/snapshot-settings'
import { getAllTemplates, type IndustryCode } from '@/lib/industry-templates'
import { useRouter } from 'next/navigation'

interface SettingsClientProps {
  isAdmin: boolean
}

type Tab = 'profile' | 'organisation' | 'popia' | 'security' | 'scoring' | 'registers' | 'appetite' | 'snapshots' | 'templates'

const INDUSTRIES = [
  'Financial Services',
  'Healthcare',
  'Manufacturing',
  'Retail',
  'Technology',
  'Mining',
  'Agriculture',
  'Construction',
  'Education',
  'Government',
  'Other',
]

export function SettingsClient({ isAdmin }: SettingsClientProps) {
  const [activeTab, setActiveTab] = useState<Tab>('profile')

  const { data: user, refetch: refetchUser } = trpc.user.me.useQuery()
  const { data: org, refetch: refetchOrg } = trpc.organisation.get.useQuery()

  // Profile state
  const [profileName, setProfileName] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Org state
  const [orgName, setOrgName] = useState('')
  const [orgIndustry, setOrgIndustry] = useState('')
  const [orgEmployees, setOrgEmployees] = useState('')
  const [orgSaved, setOrgSaved] = useState(false)

  // POPIA state
  const [retentionDays, setRetentionDays] = useState('')
  const [consentGiven, setConsentGiven] = useState(false)
  const [popiaSaved, setPopiaSaved] = useState(false)

  // Template state
  const [templateApplied, setTemplateApplied] = useState(false)
  const [showTemplateConfirm, setShowTemplateConfirm] = useState<IndustryCode | null>(null)

  // (Scoring profile/rules/industry UI removed — now read-only methodology panel)

  // Register state
  const [showRegisterForm, setShowRegisterForm] = useState(false)
  const [newRegisterName, setNewRegisterName] = useState('')
  const [newRegisterDescription, setNewRegisterDescription] = useState('')
  const [newRegisterStatus, setNewRegisterStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [editingRegisterId, setEditingRegisterId] = useState<string | null>(null)
  const [editRegisterName, setEditRegisterName] = useState('')
  const [editRegisterDescription, setEditRegisterDescription] = useState('')
  const [editRegisterStatus, setEditRegisterStatus] = useState<'DRAFT' | 'ACTIVE' | 'ARCHIVED'>('ACTIVE')
  const [registerSaved, setRegisterSaved] = useState(false)


  // Initialize state when data loads
  const initProfile = () => {
    if (user && !profileName) {
      setProfileName(user.name || '')
    }
  }

  const initOrg = () => {
    if (org && !orgName) {
      setOrgName(org.name)
      setOrgIndustry(org.industry || '')
      setOrgEmployees(org.employeeCount?.toString() || '')
      setRetentionDays(org.dataRetentionDays.toString())
      setConsentGiven(org.consentGiven)
    }
  }

  // Initialize on render
  initProfile()
  initOrg()

  const updateProfile = trpc.user.updateProfile.useMutation({
    onSuccess: () => {
      setProfileSaved(true)
      refetchUser()
      setTimeout(() => setProfileSaved(false), 3000)
    },
  })

  const changePassword = trpc.user.changePassword.useMutation({
    onSuccess: () => {
      setPasswordSaved(true)
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setTimeout(() => setPasswordSaved(false), 3000)
    },
    onError: (err) => {
      setPasswordError(err.message)
    },
  })

  const updateOrg = trpc.organisation.update.useMutation({
    onSuccess: () => {
      setOrgSaved(true)
      refetchOrg()
      setTimeout(() => setOrgSaved(false), 3000)
    },
  })

  const updatePopia = trpc.organisation.updatePopia.useMutation({
    onSuccess: () => {
      setPopiaSaved(true)
      refetchOrg()
      setTimeout(() => setPopiaSaved(false), 3000)
    },
  })

  // Scoring query (read-only engine status for methodology panel)
  const { data: engineStatus } = trpc.scoring.getEngineStatus.useQuery(
    undefined,
    { enabled: activeTab === 'scoring' }
  )

  // Register queries & mutations
  const { data: registersList, refetch: refetchRegisters } = trpc.register.list.useQuery(
    undefined,
    { enabled: activeTab === 'registers' }
  )

  const createRegister = trpc.register.create.useMutation({
    onSuccess: () => {
      setRegisterSaved(true)
      setShowRegisterForm(false)
      setNewRegisterName('')
      setNewRegisterDescription('')
      setNewRegisterStatus('ACTIVE')
      refetchRegisters()
      setTimeout(() => setRegisterSaved(false), 3000)
    },
  })

  const updateRegister = trpc.register.update.useMutation({
    onSuccess: () => {
      setRegisterSaved(true)
      setEditingRegisterId(null)
      refetchRegisters()
      setTimeout(() => setRegisterSaved(false), 3000)
    },
  })

  const deleteRegister = trpc.register.delete.useMutation({
    onSuccess: () => {
      refetchRegisters()
    },
  })

  const router = useRouter()
  const { data: riskStats } = trpc.risk.stats.useQuery(
    undefined,
    { enabled: activeTab === 'templates' }
  )
  const existingRiskCount = riskStats?.total ?? 0
  const applyTemplate = trpc.template.applyTemplate.useMutation({
    onSuccess: () => {
      setTemplateApplied(true)

      setShowTemplateConfirm(null)
      setTimeout(() => {
        setTemplateApplied(false)
        router.push('/dashboard')
      }, 2000)
    },
  })


  const handleCreateRegister = (e: React.FormEvent) => {
    e.preventDefault()
    createRegister.mutate({
      name: newRegisterName,
      description: newRegisterDescription || undefined,
      status: newRegisterStatus,
    })
  }

  const handleUpdateRegister = (e: React.FormEvent) => {
    e.preventDefault()
    if (!editingRegisterId) return
    updateRegister.mutate({
      id: editingRegisterId,
      name: editRegisterName,
      description: editRegisterDescription || null,
      status: editRegisterStatus,
    })
  }

  const handleDeleteRegister = (registerId: string) => {
    if (confirm('Delete this register? This cannot be undone.')) {
      deleteRegister.mutate({ id: registerId })
    }
  }

  const startEditRegister = (reg: { id: string; name: string; description: string | null; status: string }) => {
    setEditingRegisterId(reg.id)
    setEditRegisterName(reg.name)
    setEditRegisterDescription(reg.description || '')
    setEditRegisterStatus(reg.status as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')
  }

  const handleProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateProfile.mutate({ name: profileName })
  }

  const handlePasswordChange = (e: React.FormEvent) => {
    e.preventDefault()
    setPasswordError('')

    if (newPassword !== confirmPassword) {
      setPasswordError('Passwords do not match')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('Password must be at least 8 characters')
      return
    }

    changePassword.mutate({ currentPassword, newPassword })
  }

  const handleOrgSave = (e: React.FormEvent) => {
    e.preventDefault()
    updateOrg.mutate({
      name: orgName,
      industry: orgIndustry || null,
      employeeCount: orgEmployees ? parseInt(orgEmployees) : null,
    })
  }

  const handlePopiaSave = (e: React.FormEvent) => {
    e.preventDefault()
    updatePopia.mutate({
      dataRetentionDays: parseInt(retentionDays) || 2555,
      consentGiven,
    })
  }

  const tabs: { id: Tab; label: string; adminOnly?: boolean }[] = [
    { id: 'profile', label: 'Profile' },
    { id: 'security', label: 'Security' },
    { id: 'organisation', label: 'Organisation', adminOnly: true },
    { id: 'popia', label: 'POPIA Compliance', adminOnly: true },
    { id: 'scoring', label: 'Methodology', adminOnly: true },
    { id: 'registers', label: 'Registers', adminOnly: true },
    { id: 'appetite', label: 'Risk Appetite', adminOnly: true },
    { id: 'snapshots', label: 'Snapshots', adminOnly: true },
    { id: 'templates', label: 'Industry Templates', adminOnly: true },
  ]

  // Shared input styles
  const inputClass = 'w-full px-3 py-2 bg-slate-700 border border-slate-600 rounded-md text-white focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent'
  const inputDisabledClass = 'w-full px-3 py-2 bg-slate-800 border border-slate-700 rounded-md text-slate-400'
  const labelClass = 'block text-sm font-medium text-teal-400 mb-1'
  const helperClass = 'mt-1 text-sm text-slate-400'
  const btnPrimaryClass = 'px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50 transition-colors'
  const btnSmPrimaryClass = 'px-3 py-1.5 text-sm bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50 transition-colors'

  return (
    <div className="p-6 text-white">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-white">Settings</h1>
        <p className="text-slate-400">Manage your account and organisation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-700 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-teal-400 text-teal-400'
                    : 'border-transparent text-slate-400 hover:text-white'
                }`}
              >
                {tab.label}
              </button>
            )
          })}
        </nav>
      </div>

      {/* Profile Tab */}
      {activeTab === 'profile' && (
        <div className="max-w-lg">
          <form onSubmit={handleProfileSave} className="space-y-4">
            <div>
              <label className={labelClass}>Email</label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className={inputDisabledClass}
              />
              <p className={helperClass}>Email cannot be changed</p>
            </div>

            <div>
              <label className={labelClass}>Full Name</label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Role</label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className={inputDisabledClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={updateProfile.isPending} className={btnPrimaryClass}>
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {profileSaved && (
                <span className="text-green-400 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-lg">
          <h3 className="text-lg font-medium text-white mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-md text-red-400 text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <label className={labelClass}>Current Password</label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>New Password</label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Confirm New Password</label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={changePassword.isPending} className={btnPrimaryClass}>
                {changePassword.isPending ? 'Changing...' : 'Change Password'}
              </button>
              {passwordSaved && (
                <span className="text-green-400 text-sm">Password changed!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Organisation Tab */}
      {activeTab === 'organisation' && isAdmin && (
        <div className="max-w-lg">
          <form onSubmit={handleOrgSave} className="space-y-4">
            <div>
              <label className={labelClass}>Organisation Name</label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className={inputClass}
              />
            </div>

            <div>
              <label className={labelClass}>Industry</label>
              <select
                value={orgIndustry}
                onChange={(e) => setOrgIndustry(e.target.value)}
                className={inputClass}
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className={labelClass}>Number of Employees</label>
              <input
                type="number"
                value={orgEmployees}
                onChange={(e) => setOrgEmployees(e.target.value)}
                min="1"
                className={inputClass}
                placeholder="e.g., 50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button type="submit" disabled={updateOrg.isPending} className={btnPrimaryClass}>
                {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {orgSaved && (
                <span className="text-green-400 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* POPIA Tab */}
      {activeTab === 'popia' && isAdmin && (
        <div className="max-w-lg">
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-md">
            <h4 className="font-medium text-teal-400 mb-1">About POPIA Compliance</h4>
            <p className="text-sm text-slate-300">
              The Protection of Personal Information Act (POPIA) requires South African
              organisations to handle personal data responsibly. Configure your data
              retention settings and consent management here.
            </p>
          </div>

          <form onSubmit={handlePopiaSave} className="space-y-4">
            <div>
              <label className={labelClass}>Data Retention Period (days)</label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                min="365"
                max="3650"
                className={inputClass}
              />
              <p className={helperClass}>
                Minimum 1 year (365 days), maximum 10 years (3650 days). Default is 7 years.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 text-teal-500 border-slate-600 bg-slate-700 rounded focus:ring-teal-500"
              />
              <label htmlFor="consent" className="text-sm text-slate-300">
                <span className="font-medium text-teal-400">Data Processing Consent</span>
                <br />
                I confirm that this organisation has obtained necessary consent from
                data subjects for processing their personal information in accordance
                with POPIA requirements.
              </label>
            </div>

            {org?.consentDate && (
              <p className="text-sm text-slate-400">
                Consent recorded on: {new Date(org.consentDate).toLocaleDateString()}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button type="submit" disabled={updatePopia.isPending} className={btnPrimaryClass}>
                {updatePopia.isPending ? 'Saving...' : 'Save POPIA Settings'}
              </button>
              {popiaSaved && (
                <span className="text-green-400 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Scoring Methodology Tab (read-only) */}
      {activeTab === 'scoring' && isAdmin && (
        <div className="max-w-2xl space-y-6">
          <div className="p-4 bg-teal-500/10 border border-teal-500/30 rounded-md">
            <h4 className="font-medium text-teal-400 mb-1">Risk Scoring Methodology</h4>
            <p className="text-sm text-slate-300">
              VytlRx follows an ISO 31000-aligned, three-tier scoring framework. The methodology
              below is applied consistently across all risks in your organisation.
            </p>
          </div>

          {/* Tier 1: Risk-Level Scoring */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Tier 1 — Risk-Level Scoring</h3>
            <div className="space-y-3">
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">1A. Inherent Risk</span>
                  <span className="text-xs text-slate-500 font-mono">Likelihood × Impact (1–25)</span>
                </div>
                <p className="text-xs text-slate-400">Raw risk before any controls are applied.</p>
              </div>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">1B. Control Effectiveness</span>
                  <span className="text-xs text-slate-500 font-mono">5-point enum</span>
                </div>
                <p className="text-xs text-slate-400">
                  Effective, Partially Effective, Ineffective, Not Tested, Not Applicable.
                </p>
              </div>
              <div className="p-4 bg-teal-500/5 border border-teal-500/20 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-teal-400">1C. Residual Risk (Primary)</span>
                  <span className="text-xs text-teal-500 font-mono">Likelihood × Impact (1–25)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Risk after controls. This is the primary ranking score used across all views.
                </p>
              </div>
              <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-sm font-medium text-white">1D. Value at Risk (VaR)</span>
                  <span className="text-xs text-slate-500 font-mono">Financial Exposure × (L/5)</span>
                </div>
                <p className="text-xs text-slate-400">
                  Monetary impact estimate. Calculated server-side from financial exposure and residual likelihood.
                </p>
              </div>
            </div>
          </div>

          {/* Tier 2: Intelligence Overlays */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Tier 2 — Intelligence Overlays</h3>
            <p className="text-sm text-slate-400 mb-3">
              Available per-risk via the Risk Intelligence tab. These provide additional context
              but do not affect the primary ranking.
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                <p className="text-sm font-medium text-white">Velocity</p>
                <p className="text-xs text-slate-400">Rate of score change over time</p>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                <p className="text-sm font-medium text-white">KRI Alignment</p>
                <p className="text-xs text-slate-400">Status of linked monitoring indicators</p>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                <p className="text-sm font-medium text-white">Correlation</p>
                <p className="text-xs text-slate-400">Connectedness to other high-scoring risks</p>
              </div>
              <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                <p className="text-sm font-medium text-white">Control Quality</p>
                <p className="text-xs text-slate-400">Depth and specificity of documented controls</p>
              </div>
            </div>
          </div>

          {/* Tier 3: Vytl Score */}
          <div>
            <h3 className="text-lg font-medium text-white mb-3">Tier 3 — Vytl Score</h3>
            <div className="p-4 bg-slate-800 border border-slate-700 rounded-md">
              <p className="text-sm text-slate-300 mb-2">
                Organisation-level score (0–100) summarising overall risk posture. Graded A–F.
              </p>
              <p className="text-xs text-slate-400">
                Dimensions: Coverage (25), Control Effectiveness (25), Maturity (25), Trend (25).
                Recalculate from the dashboard Vytl Score widget.
              </p>
            </div>
          </div>

          {/* Engine Status */}
          {engineStatus && (
            <div className="border-t border-slate-700 pt-6">
              <h3 className="text-sm font-medium text-slate-400 mb-3">System Status</h3>
              <div className="grid grid-cols-3 gap-3">
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                  <p className="text-xs text-slate-500">Total Risks</p>
                  <p className="text-sm font-medium text-white">{engineStatus.totalRisks}</p>
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                  <p className="text-xs text-slate-500">Score Snapshots</p>
                  <p className="text-sm font-medium text-white">{engineStatus.scoreSnapshots}</p>
                </div>
                <div className="p-3 bg-slate-800 border border-slate-700 rounded-md">
                  <p className="text-xs text-slate-500">Active KRIs</p>
                  <p className="text-sm font-medium text-white">{engineStatus.activeKris}</p>
                </div>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Registers Tab */}
      {activeTab === 'registers' && isAdmin && (
        <div className="max-w-2xl">
          <div className="mb-6 p-4 bg-teal-500/10 border border-teal-500/30 rounded-md">
            <h4 className="font-medium text-teal-400 mb-1">Risk Registers</h4>
            <p className="text-sm text-slate-300">
              Manage separate risk registers for different business units, projects, or
              compliance frameworks. Each register maintains its own set of risks.
            </p>
          </div>

          {/* Add Register Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-white">Your Registers</h3>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className={btnSmPrimaryClass}
            >
              {showRegisterForm ? 'Cancel' : '+ Add Register'}
            </button>
          </div>

          {registerSaved && (
            <p className="text-green-400 text-sm mb-3">Saved!</p>
          )}

          {/* Inline Create Form */}
          {showRegisterForm && (
            <form onSubmit={handleCreateRegister} className="space-y-3 mb-4 p-4 bg-slate-800 border border-slate-700 rounded-md">
              <div>
                <label className={labelClass}>Name</label>
                <input
                  type="text"
                  value={newRegisterName}
                  onChange={(e) => setNewRegisterName(e.target.value)}
                  required
                  placeholder="e.g. IT Risk Register"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Description</label>
                <input
                  type="text"
                  value={newRegisterDescription}
                  onChange={(e) => setNewRegisterDescription(e.target.value)}
                  placeholder="Optional description..."
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Status</label>
                <select
                  value={newRegisterStatus}
                  onChange={(e) => setNewRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')}
                  className={inputClass}
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createRegister.isPending || !newRegisterName}
                className={btnPrimaryClass}
              >
                {createRegister.isPending ? 'Creating...' : 'Create Register'}
              </button>
              {createRegister.isError && (
                <p className="text-red-400 text-sm">{createRegister.error.message}</p>
              )}
            </form>
          )}

          {/* Register List */}
          {registersList && registersList.length > 0 ? (
            <div className="space-y-3">
              {registersList.map((reg) => (
                <div key={reg.id} className="p-4 bg-slate-800 border border-slate-700 rounded-md">
                  {editingRegisterId === reg.id ? (
                    <form onSubmit={handleUpdateRegister} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editRegisterName}
                          onChange={(e) => setEditRegisterName(e.target.value)}
                          required
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editRegisterDescription}
                          onChange={(e) => setEditRegisterDescription(e.target.value)}
                          placeholder="Description..."
                          className={inputClass}
                        />
                      </div>
                      <div>
                        <select
                          value={editRegisterStatus}
                          onChange={(e) => setEditRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')}
                          className={inputClass}
                        >
                          <option value="DRAFT">Draft</option>
                          <option value="ACTIVE">Active</option>
                          <option value="ARCHIVED">Archived</option>
                        </select>
                      </div>
                      <div className="flex gap-2">
                        <button
                          type="submit"
                          disabled={updateRegister.isPending}
                          className={btnSmPrimaryClass}
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRegisterId(null)}
                          className="px-3 py-1.5 text-sm text-slate-400 hover:text-white transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                      {updateRegister.isError && (
                        <p className="text-red-400 text-sm">{updateRegister.error.message}</p>
                      )}
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-white">{reg.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            reg.status === 'ACTIVE'
                              ? 'bg-green-500/20 text-green-400'
                              : reg.status === 'DRAFT'
                              ? 'bg-yellow-500/20 text-yellow-400'
                              : 'bg-slate-600/20 text-slate-400'
                          }`}>
                            {reg.status}
                          </span>
                          <span className="text-xs text-slate-400">
                            {reg._count.risks} risk{reg._count.risks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {reg.description && (
                          <p className="text-sm text-slate-400 mt-1">{reg.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditRegister(reg)}
                          className="text-sm text-teal-400 hover:text-teal-300 transition-colors"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRegister(reg.id)}
                          disabled={deleteRegister.isPending}
                          className="text-sm text-red-400 hover:text-red-300 disabled:opacity-50 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <p className="text-sm text-slate-400">No registers found.</p>
          )}

          {deleteRegister.isError && (
            <p className="text-red-400 text-sm mt-3">{deleteRegister.error.message}</p>
          )}
        </div>
      )}

      {/* Risk Appetite Tab */}
      {activeTab === 'appetite' && isAdmin && (
        <div className="max-w-2xl">
          <AppetiteSettings />
        </div>
      )}

      {/* Snapshots Tab */}
      {activeTab === 'snapshots' && isAdmin && (
        <div className="max-w-2xl">
          <SnapshotSettings />
        </div>
      )}

      {/* Industry Templates Tab */}
      {activeTab === 'templates' && isAdmin && (
        <div>
          <div className="mb-6 max-w-2xl">
            <h2 className="text-lg font-semibold text-white mb-1">Industry Templates</h2>
            <p className="text-slate-400 text-sm">
              Apply a pre-built SA risk library to your organisation. A new register with 15 pre-scored risks will be created.
            </p>
            {(existingRiskCount ?? 0) > 0 && (
              <div className="mt-3 flex items-start gap-2 bg-amber-500/10 border border-amber-500/30 rounded-lg px-4 py-3">
                <span className="text-amber-400 text-sm">⚠</span>
                <p className="text-amber-300 text-sm">
                  Your organisation already has {existingRiskCount} risk{existingRiskCount !== 1 ? 's' : ''}. Applying a template will <strong>add</strong> 15 new risks alongside your existing data.
                </p>
              </div>
            )}
            {templateApplied && (
              <div className="mt-3 flex items-center gap-2 bg-green-500/10 border border-green-500/30 rounded-lg px-4 py-3">
                <span className="text-green-400 text-sm">✓</span>
                <p className="text-green-300 text-sm">Template applied! Redirecting to dashboard…</p>
              </div>
            )}
            {applyTemplate.isError && (
              <div className="mt-3 bg-red-500/10 border border-red-500/30 rounded-lg px-4 py-3">
                <p className="text-red-300 text-sm">{applyTemplate.error.message}</p>
              </div>
            )}
          </div>

          {/* Confirmation dialog */}
          {showTemplateConfirm && (
            <div className="max-w-md mb-6 bg-slate-800 border border-slate-600 rounded-xl p-5">
              <h3 className="text-white font-semibold mb-2">Confirm template application</h3>
              <p className="text-slate-400 text-sm mb-4">
                This will create a new register and add 15 pre-scored {showTemplateConfirm.replace(/_/g, ' ').toLowerCase()} risks to your organisation.
                {(existingRiskCount ?? 0) > 0 ? ' Your existing risks will not be affected.' : ''}
              </p>
              <div className="flex gap-3">
                <button
                  onClick={() => {

                    applyTemplate.mutate({ industryCode: showTemplateConfirm, force: true })
                    setShowTemplateConfirm(null)
                  }}
                  disabled={applyTemplate.isPending}
                  className="px-4 py-2 bg-teal-500 text-white rounded-md hover:bg-teal-600 disabled:opacity-50 text-sm font-medium"
                >
                  {applyTemplate.isPending ? 'Applying…' : 'Apply Template'}
                </button>
                <button
                  onClick={() => setShowTemplateConfirm(null)}
                  className="px-4 py-2 bg-slate-700 text-slate-300 rounded-md hover:bg-slate-600 text-sm"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          {/* Industry cards */}
          <div className="grid md:grid-cols-3 gap-4 max-w-4xl">
            {getAllTemplates().map((template) => (
              <button
                key={template.code}
                onClick={() => !applyTemplate.isPending && setShowTemplateConfirm(template.code)}
                disabled={applyTemplate.isPending}
                className={`text-left bg-slate-800 border-2 rounded-xl p-5 transition-all hover:border-teal-500 hover:shadow-lg disabled:opacity-50 disabled:cursor-not-allowed ${
                  showTemplateConfirm === template.code
                    ? 'border-teal-500'
                    : 'border-slate-700'
                }`}
              >
                <div className="mb-3">
                  <span className="text-xs font-medium text-teal-400 uppercase tracking-wider">
                    {template.code.replace(/_/g, ' ')}
                  </span>
                </div>
                <h3 className="text-white font-semibold mb-1">{template.name}</h3>
                <p className="text-slate-400 text-sm mb-3">{template.description}</p>
                <div className="flex items-center gap-4 text-xs text-slate-500 mb-3">
                  <span>{template.risks.length} risks</span>
                  <span>Benchmark: {template.benchmarkScore}</span>
                </div>
                <div className="border-t border-slate-700 pt-3 space-y-1">
                  {template.risks.slice(0, 3).map((r, i) => (
                    <div key={i} className="text-xs text-slate-500 flex items-start gap-1.5">
                      <span className="text-teal-600 mt-0.5">•</span>
                      <span className="line-clamp-1">{r.title}</span>
                    </div>
                  ))}
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
