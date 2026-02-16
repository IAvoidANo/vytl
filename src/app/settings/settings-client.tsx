'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'

interface SettingsClientProps {
  isAdmin: boolean
}

type Tab = 'profile' | 'organisation' | 'popia' | 'security' | 'scoring' | 'registers'

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

  // Scoring state
  const [scoringWeightBase, setScoringWeightBase] = useState(40)
  const [scoringWeightControlQuality, setScoringWeightControlQuality] = useState(20)
  const [scoringWeightVelocity, setScoringWeightVelocity] = useState(15)
  const [scoringWeightCorrelation, setScoringWeightCorrelation] = useState(15)
  const [scoringWeightKriAlignment, setScoringWeightKriAlignment] = useState(10)
  const [scoringThresholdLow, setScoringThresholdLow] = useState(25)
  const [scoringThresholdMedium, setScoringThresholdMedium] = useState(50)
  const [scoringThresholdHigh, setScoringThresholdHigh] = useState(75)
  const [scoringProfileSaved, setScoringProfileSaved] = useState(false)
  const [scoringProfileInitialized, setScoringProfileInitialized] = useState(false)

  // Industry preset state
  const [selectedIndustryId, setSelectedIndustryId] = useState('')
  const [industrySaved, setIndustrySaved] = useState(false)

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

  // Custom rules state
  const [showRuleForm, setShowRuleForm] = useState(false)
  const [newRuleName, setNewRuleName] = useState('')
  const [newRuleConditionField, setNewRuleConditionField] = useState('category')
  const [newRuleConditionOperator, setNewRuleConditionOperator] = useState('equals')
  const [newRuleConditionValue, setNewRuleConditionValue] = useState('')
  const [newRuleScoreModifier, setNewRuleScoreModifier] = useState(0)
  const [newRuleModifierType, setNewRuleModifierType] = useState<'absolute' | 'percentage'>('absolute')
  const [ruleSaved, setRuleSaved] = useState(false)

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

  // Scoring queries & mutations
  const { data: scoringProfile, refetch: refetchProfile } = trpc.scoring.getProfile.useQuery(
    undefined,
    { enabled: activeTab === 'scoring' }
  )
  const { data: industryProfiles } = trpc.scoring.listIndustryProfiles.useQuery(
    undefined,
    { enabled: activeTab === 'scoring' }
  )
  const { data: scoringRules, refetch: refetchRules } = trpc.scoring.getRules.useQuery(
    undefined,
    { enabled: activeTab === 'scoring' }
  )
  const { data: engineStatus } = trpc.scoring.getEngineStatus.useQuery(
    undefined,
    { enabled: activeTab === 'scoring' }
  )

  const updateScoringProfile = trpc.scoring.updateProfile.useMutation({
    onSuccess: () => {
      setScoringProfileSaved(true)
      refetchProfile()
      setTimeout(() => setScoringProfileSaved(false), 3000)
    },
  })

  const applyIndustryProfile = trpc.scoring.applyIndustryProfile.useMutation({
    onSuccess: () => {
      setIndustrySaved(true)
      refetchProfile()
      setTimeout(() => setIndustrySaved(false), 3000)
    },
  })

  const createRule = trpc.scoring.createRule.useMutation({
    onSuccess: () => {
      setRuleSaved(true)
      setShowRuleForm(false)
      setNewRuleName('')
      setNewRuleConditionValue('')
      setNewRuleScoreModifier(0)
      refetchRules()
      setTimeout(() => setRuleSaved(false), 3000)
    },
  })

  const deleteRule = trpc.scoring.deleteRule.useMutation({
    onSuccess: () => {
      refetchRules()
    },
  })

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

  // Initialize scoring profile state when data loads
  if (scoringProfile && !scoringProfileInitialized) {
    setScoringWeightBase(scoringProfile.weightBase)
    setScoringWeightControlQuality(scoringProfile.weightControlQuality)
    setScoringWeightVelocity(scoringProfile.weightVelocity)
    setScoringWeightCorrelation(scoringProfile.weightCorrelation)
    setScoringWeightKriAlignment(scoringProfile.weightKriAlignment)
    setScoringThresholdLow(scoringProfile.thresholdLow)
    setScoringThresholdMedium(scoringProfile.thresholdMedium)
    setScoringThresholdHigh(scoringProfile.thresholdHigh)
    setScoringProfileInitialized(true)
  }

  const scoringWeightTotal = scoringWeightBase + scoringWeightControlQuality + scoringWeightVelocity + scoringWeightCorrelation + scoringWeightKriAlignment

  const handleScoringProfileSave = (e: React.FormEvent) => {
    e.preventDefault()
    if (!scoringProfile) return
    updateScoringProfile.mutate({
      profileId: scoringProfile.id,
      data: {
        weightBase: scoringWeightBase,
        weightControlQuality: scoringWeightControlQuality,
        weightVelocity: scoringWeightVelocity,
        weightCorrelation: scoringWeightCorrelation,
        weightKriAlignment: scoringWeightKriAlignment,
        thresholdLow: scoringThresholdLow,
        thresholdMedium: scoringThresholdMedium,
        thresholdHigh: scoringThresholdHigh,
      },
    })
  }

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

  const handleApplyIndustry = () => {
    if (!selectedIndustryId) return
    applyIndustryProfile.mutate({ industryId: selectedIndustryId })
  }

  const handleCreateRule = (e: React.FormEvent) => {
    e.preventDefault()
    createRule.mutate({
      name: newRuleName,
      conditionField: newRuleConditionField,
      conditionOperator: newRuleConditionOperator,
      conditionValue: newRuleConditionValue,
      scoreModifier: newRuleScoreModifier,
      modifierType: newRuleModifierType,
    })
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
    { id: 'scoring', label: 'Scoring', adminOnly: true },
    { id: 'registers', label: 'Registers', adminOnly: true },
  ]

  return (
    <div className="p-6">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-slate-900">Settings</h1>
        <p className="text-slate-600">Manage your account and organisation</p>
      </div>

      {/* Tabs */}
      <div className="border-b border-slate-200 mb-6">
        <nav className="flex gap-4">
          {tabs.map((tab) => {
            if (tab.adminOnly && !isAdmin) return null
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`pb-3 px-1 text-sm font-medium border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent text-slate-500 hover:text-slate-700'
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={user?.email || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
              />
              <p className="mt-1 text-sm text-slate-500">Email cannot be changed</p>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Full Name
              </label>
              <input
                type="text"
                value={profileName}
                onChange={(e) => setProfileName(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Role
              </label>
              <input
                type="text"
                value={user?.role || ''}
                disabled
                className="w-full px-3 py-2 border border-slate-300 rounded-md bg-slate-50 text-slate-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateProfile.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateProfile.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {profileSaved && (
                <span className="text-green-600 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Security Tab */}
      {activeTab === 'security' && (
        <div className="max-w-lg">
          <h3 className="text-lg font-medium text-slate-900 mb-4">Change Password</h3>
          <form onSubmit={handlePasswordChange} className="space-y-4">
            {passwordError && (
              <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                {passwordError}
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Current Password
              </label>
              <input
                type="password"
                value={currentPassword}
                onChange={(e) => setCurrentPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                New Password
              </label>
              <input
                type="password"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
                required
                minLength={8}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Confirm New Password
              </label>
              <input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={changePassword.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {changePassword.isPending ? 'Changing...' : 'Change Password'}
              </button>
              {passwordSaved && (
                <span className="text-green-600 text-sm">Password changed!</span>
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
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Organisation Name
              </label>
              <input
                type="text"
                value={orgName}
                onChange={(e) => setOrgName(e.target.value)}
                required
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Industry
              </label>
              <select
                value={orgIndustry}
                onChange={(e) => setOrgIndustry(e.target.value)}
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry...</option>
                {INDUSTRIES.map((ind) => (
                  <option key={ind} value={ind}>{ind}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Number of Employees
              </label>
              <input
                type="number"
                value={orgEmployees}
                onChange={(e) => setOrgEmployees(e.target.value)}
                min="1"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                placeholder="e.g., 50"
              />
            </div>

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updateOrg.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updateOrg.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              {orgSaved && (
                <span className="text-green-600 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* POPIA Tab */}
      {activeTab === 'popia' && isAdmin && (
        <div className="max-w-lg">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-1">About POPIA Compliance</h4>
            <p className="text-sm text-blue-700">
              The Protection of Personal Information Act (POPIA) requires South African
              organisations to handle personal data responsibly. Configure your data
              retention settings and consent management here.
            </p>
          </div>

          <form onSubmit={handlePopiaSave} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">
                Data Retention Period (days)
              </label>
              <input
                type="number"
                value={retentionDays}
                onChange={(e) => setRetentionDays(e.target.value)}
                min="365"
                max="3650"
                className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              />
              <p className="mt-1 text-sm text-slate-500">
                Minimum 1 year (365 days), maximum 10 years (3650 days). Default is 7 years.
              </p>
            </div>

            <div className="flex items-start gap-3">
              <input
                type="checkbox"
                id="consent"
                checked={consentGiven}
                onChange={(e) => setConsentGiven(e.target.checked)}
                className="mt-1 h-4 w-4 text-blue-600 border-slate-300 rounded focus:ring-blue-500"
              />
              <label htmlFor="consent" className="text-sm text-slate-700">
                <span className="font-medium">Data Processing Consent</span>
                <br />
                I confirm that this organisation has obtained necessary consent from
                data subjects for processing their personal information in accordance
                with POPIA requirements.
              </label>
            </div>

            {org?.consentDate && (
              <p className="text-sm text-slate-500">
                Consent recorded on: {new Date(org.consentDate).toLocaleDateString()}
              </p>
            )}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={updatePopia.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {updatePopia.isPending ? 'Saving...' : 'Save POPIA Settings'}
              </button>
              {popiaSaved && (
                <span className="text-green-600 text-sm">Saved!</span>
              )}
            </div>
          </form>
        </div>
      )}

      {/* Scoring Tab */}
      {activeTab === 'scoring' && isAdmin && (
        <div className="space-y-8">
          {/* Profile Configuration */}
          <div className="max-w-lg">
            <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-md">
              <h4 className="font-medium text-blue-900 mb-1">Scoring Engine Configuration</h4>
              <p className="text-sm text-blue-700">
                Configure how composite risk scores are calculated. The five dimension
                weights must sum to exactly 100.
              </p>
            </div>

            <form onSubmit={handleScoringProfileSave} className="space-y-4">
              <h3 className="text-lg font-medium text-slate-900">Dimension Weights</h3>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Base Score (L&times;I) &mdash; {scoringWeightBase}%
                </label>
                <input
                  type="number"
                  value={scoringWeightBase}
                  onChange={(e) => setScoringWeightBase(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Control Quality &mdash; {scoringWeightControlQuality}%
                </label>
                <input
                  type="number"
                  value={scoringWeightControlQuality}
                  onChange={(e) => setScoringWeightControlQuality(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Velocity &mdash; {scoringWeightVelocity}%
                </label>
                <input
                  type="number"
                  value={scoringWeightVelocity}
                  onChange={(e) => setScoringWeightVelocity(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Correlation &mdash; {scoringWeightCorrelation}%
                </label>
                <input
                  type="number"
                  value={scoringWeightCorrelation}
                  onChange={(e) => setScoringWeightCorrelation(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  KRI Alignment &mdash; {scoringWeightKriAlignment}%
                </label>
                <input
                  type="number"
                  value={scoringWeightKriAlignment}
                  onChange={(e) => setScoringWeightKriAlignment(parseInt(e.target.value) || 0)}
                  min="0"
                  max="100"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div className={`text-sm font-medium ${scoringWeightTotal === 100 ? 'text-green-600' : 'text-red-600'}`}>
                Total: {scoringWeightTotal}% {scoringWeightTotal !== 100 && '(must equal 100)'}
              </div>

              <h3 className="text-lg font-medium text-slate-900 pt-4">Score Thresholds</h3>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Low</label>
                  <input
                    type="number"
                    value={scoringThresholdLow}
                    onChange={(e) => setScoringThresholdLow(parseInt(e.target.value) || 0)}
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Medium</label>
                  <input
                    type="number"
                    value={scoringThresholdMedium}
                    onChange={(e) => setScoringThresholdMedium(parseInt(e.target.value) || 0)}
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">High</label>
                  <input
                    type="number"
                    value={scoringThresholdHigh}
                    onChange={(e) => setScoringThresholdHigh(parseInt(e.target.value) || 0)}
                    min="1"
                    max="99"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              </div>

              <div className="flex items-center gap-3">
                <button
                  type="submit"
                  disabled={updateScoringProfile.isPending || scoringWeightTotal !== 100}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {updateScoringProfile.isPending ? 'Saving...' : 'Save Profile'}
                </button>
                {scoringProfileSaved && (
                  <span className="text-green-600 text-sm">Saved!</span>
                )}
                {updateScoringProfile.isError && (
                  <span className="text-red-600 text-sm">{updateScoringProfile.error.message}</span>
                )}
              </div>
            </form>
          </div>

          {/* Industry Presets */}
          <div className="max-w-lg border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Industry Presets</h3>
            <p className="text-sm text-slate-600 mb-3">
              Apply a pre-configured scoring profile optimised for your industry.
              This will overwrite current weights and thresholds.
            </p>
            <div className="flex gap-3">
              <select
                value={selectedIndustryId}
                onChange={(e) => setSelectedIndustryId(e.target.value)}
                className="flex-1 px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select industry...</option>
                {industryProfiles?.map((profile) => (
                  <option key={profile.id} value={profile.id}>
                    {profile.name}
                  </option>
                ))}
              </select>
              <button
                onClick={handleApplyIndustry}
                disabled={!selectedIndustryId || applyIndustryProfile.isPending}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {applyIndustryProfile.isPending ? 'Applying...' : 'Apply'}
              </button>
            </div>
            {industrySaved && (
              <span className="text-green-600 text-sm mt-2 block">Industry profile applied! Reload to see updated weights.</span>
            )}
          </div>

          {/* Custom Rules */}
          <div className="max-w-lg border-t border-slate-200 pt-6">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-lg font-medium text-slate-900">Custom Scoring Rules</h3>
              <button
                onClick={() => setShowRuleForm(!showRuleForm)}
                className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
              >
                {showRuleForm ? 'Cancel' : '+ Add Rule'}
              </button>
            </div>

            {showRuleForm && (
              <form onSubmit={handleCreateRule} className="space-y-3 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Rule Name</label>
                  <input
                    type="text"
                    value={newRuleName}
                    onChange={(e) => setNewRuleName(e.target.value)}
                    required
                    placeholder="e.g. Compliance bonus"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Field</label>
                    <select
                      value={newRuleConditionField}
                      onChange={(e) => setNewRuleConditionField(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="category">Category</option>
                      <option value="status">Status</option>
                      <option value="residualScore">Residual Score</option>
                      <option value="inherentScore">Inherent Score</option>
                      <option value="controls">Controls</option>
                      <option value="rootCause">Root Cause</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Operator</label>
                    <select
                      value={newRuleConditionOperator}
                      onChange={(e) => setNewRuleConditionOperator(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="equals">Equals</option>
                      <option value="notEquals">Not Equals</option>
                      <option value="greaterThan">Greater Than</option>
                      <option value="lessThan">Less Than</option>
                      <option value="contains">Contains</option>
                      <option value="isEmpty">Is Empty</option>
                      <option value="isNotEmpty">Is Not Empty</option>
                    </select>
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">Value</label>
                  <input
                    type="text"
                    value={newRuleConditionValue}
                    onChange={(e) => setNewRuleConditionValue(e.target.value)}
                    placeholder="e.g. COMPLIANCE"
                    className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Score Modifier</label>
                    <input
                      type="number"
                      value={newRuleScoreModifier}
                      onChange={(e) => setNewRuleScoreModifier(parseInt(e.target.value) || 0)}
                      min="-25"
                      max="25"
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">Type</label>
                    <select
                      value={newRuleModifierType}
                      onChange={(e) => setNewRuleModifierType(e.target.value as 'absolute' | 'percentage')}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                    >
                      <option value="absolute">Absolute</option>
                      <option value="percentage">Percentage</option>
                    </select>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={createRule.isPending || !newRuleName}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {createRule.isPending ? 'Creating...' : 'Create Rule'}
                </button>
              </form>
            )}

            {ruleSaved && (
              <p className="text-green-600 text-sm mb-3">Rule created!</p>
            )}

            {scoringRules && scoringRules.length > 0 ? (
              <div className="space-y-2">
                {scoringRules.map((rule) => (
                  <div key={rule.id} className="flex items-center justify-between p-3 bg-white border border-slate-200 rounded-md">
                    <div>
                      <p className="text-sm font-medium text-slate-900">{rule.name}</p>
                      <p className="text-xs text-slate-500">
                        {rule.conditionField} {rule.conditionOperator} {rule.conditionValue} &rarr;{' '}
                        {rule.scoreModifier > 0 ? '+' : ''}{rule.scoreModifier}
                        {rule.modifierType === 'percentage' ? '%' : ' pts'}
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        if (confirm('Delete this rule?')) {
                          deleteRule.mutate({ ruleId: rule.id })
                        }
                      }}
                      disabled={deleteRule.isPending}
                      className="text-red-500 hover:text-red-700 text-sm disabled:opacity-50"
                    >
                      Delete
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-sm text-slate-500">No custom rules configured.</p>
            )}
          </div>

          {/* Engine Status */}
          <div className="max-w-lg border-t border-slate-200 pt-6">
            <h3 className="text-lg font-medium text-slate-900 mb-4">Engine Status</h3>
            {engineStatus ? (
              <div className="grid grid-cols-2 gap-4">
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Profile</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.profileName || 'None'}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Active Rules</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.activeRules}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Total Risks</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.totalRisks}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Score Snapshots</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.scoreSnapshots}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Active KRIs</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.activeKris}</p>
                </div>
                <div className="p-3 bg-slate-50 border border-slate-200 rounded-md">
                  <p className="text-xs text-slate-500">Engine Version</p>
                  <p className="text-sm font-medium text-slate-900">{engineStatus.engineVersion}</p>
                </div>
              </div>
            ) : (
              <p className="text-sm text-slate-500">Loading engine status...</p>
            )}
          </div>
        </div>
      )}

      {/* Registers Tab */}
      {activeTab === 'registers' && isAdmin && (
        <div className="max-w-2xl">
          <div className="mb-6 p-4 bg-blue-50 border border-blue-200 rounded-md">
            <h4 className="font-medium text-blue-900 mb-1">Risk Registers</h4>
            <p className="text-sm text-blue-700">
              Manage separate risk registers for different business units, projects, or
              compliance frameworks. Each register maintains its own set of risks.
            </p>
          </div>

          {/* Add Register Button */}
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-slate-900">Your Registers</h3>
            <button
              onClick={() => setShowRegisterForm(!showRegisterForm)}
              className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700"
            >
              {showRegisterForm ? 'Cancel' : '+ Add Register'}
            </button>
          </div>

          {registerSaved && (
            <p className="text-green-600 text-sm mb-3">Saved!</p>
          )}

          {/* Inline Create Form */}
          {showRegisterForm && (
            <form onSubmit={handleCreateRegister} className="space-y-3 mb-4 p-4 bg-slate-50 border border-slate-200 rounded-md">
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Name</label>
                <input
                  type="text"
                  value={newRegisterName}
                  onChange={(e) => setNewRegisterName(e.target.value)}
                  required
                  placeholder="e.g. IT Risk Register"
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
                <input
                  type="text"
                  value={newRegisterDescription}
                  onChange={(e) => setNewRegisterDescription(e.target.value)}
                  placeholder="Optional description..."
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-slate-700 mb-1">Status</label>
                <select
                  value={newRegisterStatus}
                  onChange={(e) => setNewRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')}
                  className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                >
                  <option value="DRAFT">Draft</option>
                  <option value="ACTIVE">Active</option>
                  <option value="ARCHIVED">Archived</option>
                </select>
              </div>
              <button
                type="submit"
                disabled={createRegister.isPending || !newRegisterName}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
              >
                {createRegister.isPending ? 'Creating...' : 'Create Register'}
              </button>
              {createRegister.isError && (
                <p className="text-red-600 text-sm">{createRegister.error.message}</p>
              )}
            </form>
          )}

          {/* Register List */}
          {registersList && registersList.length > 0 ? (
            <div className="space-y-3">
              {registersList.map((reg) => (
                <div key={reg.id} className="p-4 bg-white border border-slate-200 rounded-md">
                  {editingRegisterId === reg.id ? (
                    <form onSubmit={handleUpdateRegister} className="space-y-3">
                      <div>
                        <input
                          type="text"
                          value={editRegisterName}
                          onChange={(e) => setEditRegisterName(e.target.value)}
                          required
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <input
                          type="text"
                          value={editRegisterDescription}
                          onChange={(e) => setEditRegisterDescription(e.target.value)}
                          placeholder="Description..."
                          className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
                        />
                      </div>
                      <div>
                        <select
                          value={editRegisterStatus}
                          onChange={(e) => setEditRegisterStatus(e.target.value as 'DRAFT' | 'ACTIVE' | 'ARCHIVED')}
                          className="px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500"
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
                          className="px-3 py-1.5 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingRegisterId(null)}
                          className="px-3 py-1.5 text-sm text-slate-600 hover:text-slate-900"
                        >
                          Cancel
                        </button>
                      </div>
                      {updateRegister.isError && (
                        <p className="text-red-600 text-sm">{updateRegister.error.message}</p>
                      )}
                    </form>
                  ) : (
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2">
                          <p className="font-medium text-slate-900">{reg.name}</p>
                          <span className={`text-xs px-2 py-0.5 rounded ${
                            reg.status === 'ACTIVE'
                              ? 'bg-green-100 text-green-700'
                              : reg.status === 'DRAFT'
                              ? 'bg-yellow-100 text-yellow-700'
                              : 'bg-slate-100 text-slate-600'
                          }`}>
                            {reg.status}
                          </span>
                          <span className="text-xs text-slate-500">
                            {reg._count.risks} risk{reg._count.risks !== 1 ? 's' : ''}
                          </span>
                        </div>
                        {reg.description && (
                          <p className="text-sm text-slate-500 mt-1">{reg.description}</p>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => startEditRegister(reg)}
                          className="text-sm text-blue-600 hover:text-blue-800"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteRegister(reg.id)}
                          disabled={deleteRegister.isPending}
                          className="text-sm text-red-500 hover:text-red-700 disabled:opacity-50"
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
            <p className="text-sm text-slate-500">No registers found.</p>
          )}

          {deleteRegister.isError && (
            <p className="text-red-600 text-sm mt-3">{deleteRegister.error.message}</p>
          )}
        </div>
      )}
    </div>
  )
}
