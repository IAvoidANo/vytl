'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'

interface SettingsClientProps {
  isAdmin: boolean
}

type Tab = 'profile' | 'organisation' | 'popia' | 'security'

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
    </div>
  )
}
