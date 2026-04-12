'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'
import { SettingsPageShell } from '@/components/settings/settings-page-shell'
import { SettingsSectionCard } from '@/components/settings/settings-section-card'
import { cn } from '@/lib/utils'

type AccountTab = 'profile' | 'security' | 'notifications'

const TABS: { id: AccountTab; label: string }[] = [
  { id: 'profile', label: 'Profile' },
  { id: 'security', label: 'Security' },
  { id: 'notifications', label: 'Notifications' },
]

interface AccountClientProps {
  user: { name?: string | null; email?: string | null; role?: string }
}

// Shared input styles matching the app's dark-mode design tokens
const inputCls = 'w-full mt-1.5 px-3 py-2 bg-background border border-border rounded-md text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-primary/40'
const inputDisabledCls = 'w-full mt-1.5 px-3 py-2 bg-muted border border-border rounded-md text-sm text-muted-foreground cursor-not-allowed'
const labelCls = 'text-sm font-medium text-foreground'
const helperCls = 'text-xs text-muted-foreground mt-1'
const btnPrimaryCls = 'px-4 py-2 bg-primary text-primary-foreground text-sm font-medium rounded-md hover:bg-primary-hover disabled:opacity-50 transition-colors'

export function AccountClient({ user: _user }: AccountClientProps) {
  const [activeTab, setActiveTab] = useState<AccountTab>('profile')

  const { data: user, refetch: refetchUser } = trpc.user.me.useQuery()

  // Profile state
  const [profileName, setProfileName] = useState('')
  const [profileSaved, setProfileSaved] = useState(false)

  // Password state
  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordSaved, setPasswordSaved] = useState(false)

  // Initialize profile name from loaded data
  if (user && !profileName) setProfileName(user.name || '')

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
    onError: (err) => setPasswordError(err.message),
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

  return (
    <div className="max-w-3xl mx-auto px-6 py-8">
      <SettingsPageShell
        title="My account"
        description="Manage your personal profile and security settings."
      >
        {/* Tab bar */}
        <div className="flex gap-1 border-b border-border mb-6">
          {TABS.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                'px-4 py-2 text-sm font-medium -mb-px border-b-2 transition-colors',
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Profile tab */}
        {activeTab === 'profile' && (
          <SettingsSectionCard title="Personal details">
            <form onSubmit={handleProfileSave} className="space-y-4">
              <div>
                <label className={labelCls}>Email</label>
                <input type="email" value={user?.email || ''} disabled className={inputDisabledCls} />
                <p className={helperCls}>Email cannot be changed here.</p>
              </div>
              <div>
                <label className={labelCls}>Full name</label>
                <input
                  type="text"
                  value={profileName}
                  onChange={(e) => setProfileName(e.target.value)}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Role</label>
                <input type="text" value={user?.role || ''} disabled className={inputDisabledCls} />
                <p className={helperCls}>This field cannot be changed here.</p>
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                {profileSaved && <span className="text-sm text-green-500">Saved!</span>}
                <button type="submit" disabled={updateProfile.isPending} className={btnPrimaryCls}>
                  {updateProfile.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </SettingsSectionCard>
        )}

        {/* Security tab */}
        {activeTab === 'security' && (
          <SettingsSectionCard title="Change password">
            <form onSubmit={handlePasswordChange} className="space-y-4">
              {passwordError && (
                <div className="p-3 bg-destructive/10 border border-destructive/30 rounded-md text-destructive text-sm">
                  {passwordError}
                </div>
              )}
              <div>
                <label className={labelCls}>Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={(e) => setCurrentPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  required
                  minLength={8}
                  className={inputCls}
                />
              </div>
              <div>
                <label className={labelCls}>Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  required
                  className={inputCls}
                />
              </div>
              <div className="flex items-center justify-end gap-3 pt-2">
                {passwordSaved && <span className="text-sm text-green-500">Password changed!</span>}
                <button type="submit" disabled={changePassword.isPending} className={btnPrimaryCls}>
                  {changePassword.isPending ? 'Saving…' : 'Save changes'}
                </button>
              </div>
            </form>
          </SettingsSectionCard>
        )}

        {/* Notifications tab — no user-level preferences exist yet */}
        {activeTab === 'notifications' && (
          <SettingsSectionCard
            title="Notification preferences"
            description="Individual notification preferences will be available in a future update."
          >
            <p className="text-sm text-muted-foreground">
              Organisation-level digest settings are managed by your administrator under Organisation admin.
            </p>
          </SettingsSectionCard>
        )}
      </SettingsPageShell>
    </div>
  )
}
