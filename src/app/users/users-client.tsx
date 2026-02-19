'use client'

import { useState } from 'react'
import { trpc } from '@/lib/trpc-client'

const ROLE_LABELS: Record<string, string> = {
  OWNER: 'Owner',
  ADMIN: 'Admin',
  RISK_MANAGER: 'Risk Manager',
  EDITOR: 'Editor',
  VIEWER: 'Viewer',
}

const ROLE_COLORS: Record<string, string> = {
  OWNER: 'bg-purple-100 text-purple-800',
  ADMIN: 'bg-blue-100 text-blue-800',
  RISK_MANAGER: 'bg-green-100 text-green-800',
  EDITOR: 'bg-yellow-100 text-yellow-800',
  VIEWER: 'bg-slate-100 text-slate-800',
}

const STATUS_COLORS: Record<string, string> = {
  ACTIVE: 'bg-green-100 text-green-800',
  INVITED: 'bg-amber-100 text-amber-800',
  DISABLED: 'bg-red-100 text-red-800',
}

interface UsersClientProps {
  currentUserRole: string
}

export function UsersClient({ currentUserRole }: UsersClientProps) {
  const [showInviteModal, setShowInviteModal] = useState(false)
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteName, setInviteName] = useState('')
  const [inviteRole, setInviteRole] = useState<'ADMIN' | 'RISK_MANAGER' | 'EDITOR' | 'VIEWER'>('VIEWER')
  const [inviteError, setInviteError] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')

  const utils = trpc.useUtils()
  const { data: users, isLoading } = trpc.user.list.useQuery()

  const inviteUser = trpc.user.invite.useMutation({
    onSuccess: (data) => {
      setInviteUrl(data.inviteUrl)
      utils.user.list.invalidate()
    },
    onError: (err) => {
      setInviteError(err.message)
    },
  })

  const updateRole = trpc.user.updateRole.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate()
    },
  })

  const setStatus = trpc.user.setStatus.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate()
    },
  })

  const deleteUser = trpc.user.delete.useMutation({
    onSuccess: () => {
      utils.user.list.invalidate()
    },
  })

  const resendInvite = trpc.user.resendInvite.useMutation({
    onSuccess: (data) => {
      alert(`Invite link: ${data.inviteUrl}`)
    },
  })

  const handleInvite = (e: React.FormEvent) => {
    e.preventDefault()
    setInviteError('')
    setInviteUrl('')
    inviteUser.mutate({ email: inviteEmail, name: inviteName || undefined, role: inviteRole })
  }

  const closeInviteModal = () => {
    setShowInviteModal(false)
    setInviteEmail('')
    setInviteName('')
    setInviteRole('VIEWER')
    setInviteError('')
    setInviteUrl('')
  }

  const isOwner = currentUserRole === 'OWNER'

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Team Members</h1>
          <p className="text-slate-600">Manage users and their access levels</p>
        </div>
        <button
          onClick={() => setShowInviteModal(true)}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          Invite User
        </button>
      </div>

      {isLoading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      ) : (
        <div className="bg-white rounded-lg shadow overflow-hidden">
          <table className="min-w-full divide-y divide-slate-200">
            <thead className="bg-slate-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-slate-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-slate-200">
              {users?.map((user) => (
                <tr key={user.id} className="hover:bg-slate-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-medium">
                        {user.name?.[0]?.toUpperCase() || user.email[0].toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-900">
                          {user.name || 'Pending'}
                        </div>
                        <div className="text-sm text-slate-500">{user.email}</div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {user.role === 'OWNER' ? (
                      <span className={`px-2 py-1 text-xs font-medium rounded-full ${ROLE_COLORS[user.role]}`}>
                        {ROLE_LABELS[user.role]}
                      </span>
                    ) : (
                      <select
                        value={user.role}
                        onChange={(e) => updateRole.mutate({ id: user.id, role: e.target.value as 'ADMIN' | 'RISK_MANAGER' | 'EDITOR' | 'VIEWER' })}
                        className="text-sm border border-slate-300 rounded-md px-2 py-1 focus:ring-2 focus:ring-blue-500"
                        disabled={updateRole.isPending}
                      >
                        <option value="ADMIN">Admin</option>
                        <option value="RISK_MANAGER">Risk Manager</option>
                        <option value="EDITOR">Editor</option>
                        <option value="VIEWER">Viewer</option>
                      </select>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs font-medium rounded-full ${STATUS_COLORS[user.status]}`}>
                      {user.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-500">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {user.role !== 'OWNER' && (
                      <div className="flex items-center justify-end gap-2">
                        {user.status === 'INVITED' && (
                          <button
                            onClick={() => resendInvite.mutate({ id: user.id })}
                            className="text-blue-600 hover:text-blue-800"
                            title="Resend invite"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                            </svg>
                          </button>
                        )}
                        {user.status === 'ACTIVE' && (
                          <button
                            onClick={() => setStatus.mutate({ id: user.id, status: 'DISABLED' })}
                            className="text-amber-600 hover:text-amber-800"
                            title="Disable user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                            </svg>
                          </button>
                        )}
                        {user.status === 'DISABLED' && (
                          <button
                            onClick={() => setStatus.mutate({ id: user.id, status: 'ACTIVE' })}
                            className="text-green-600 hover:text-green-800"
                            title="Enable user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                            </svg>
                          </button>
                        )}
                        {isOwner && (
                          <button
                            onClick={() => {
                              if (confirm(`Are you sure you want to delete ${user.email}?`)) {
                                deleteUser.mutate({ id: user.id })
                              }
                            }}
                            className="text-red-600 hover:text-red-800"
                            title="Delete user"
                          >
                            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Invite Modal */}
      {showInviteModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4">
            <div className="p-6">
              <h2 className="text-xl font-bold text-slate-900 mb-4">Invite Team Member</h2>

              {inviteUrl ? (
                <div className="space-y-4">
                  <div className="p-4 bg-green-50 border border-green-200 rounded-md">
                    <p className="text-green-800 font-medium mb-2">Invitation created!</p>
                    <p className="text-sm text-green-700 mb-3">
                      Share this link with the user (valid for 7 days):
                    </p>
                    <div className="flex items-center gap-2">
                      <input
                        type="text"
                        readOnly
                        value={inviteUrl}
                        className="flex-1 px-3 py-2 text-sm border border-green-300 rounded-md bg-white"
                      />
                      <button
                        onClick={() => navigator.clipboard.writeText(inviteUrl)}
                        className="px-3 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 text-sm"
                      >
                        Copy
                      </button>
                    </div>
                  </div>
                  <button
                    onClick={closeInviteModal}
                    className="w-full py-2 bg-slate-100 text-slate-700 rounded-md hover:bg-slate-200"
                  >
                    Done
                  </button>
                </div>
              ) : (
                <form onSubmit={handleInvite} className="space-y-4">
                  {inviteError && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-md text-red-700 text-sm">
                      {inviteError}
                    </div>
                  )}

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Email Address *
                    </label>
                    <input
                      type="email"
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      required
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder:text-slate-400"
                      placeholder="colleague@company.com"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Name (optional)
                    </label>
                    <input
                      type="text"
                      value={inviteName}
                      onChange={(e) => setInviteName(e.target.value)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-slate-900 placeholder:text-slate-400"
                      placeholder="John Smith"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-slate-700 mb-1">
                      Role
                    </label>
                    <select
                      value={inviteRole}
                      onChange={(e) => setInviteRole(e.target.value as typeof inviteRole)}
                      className="w-full px-3 py-2 border border-slate-300 rounded-md focus:ring-2 focus:ring-blue-500 bg-white text-slate-900"
                    >
                      <option value="VIEWER">Viewer - Can view risks and reports</option>
                      <option value="EDITOR">Editor - Can create and edit risks</option>
                      <option value="RISK_MANAGER">Risk Manager - Can manage KRIs and run AI analysis</option>
                      <option value="ADMIN">Admin - Can manage users and settings</option>
                    </select>
                  </div>

                  <div className="flex gap-3 pt-2">
                    <button
                      type="button"
                      onClick={closeInviteModal}
                      className="flex-1 py-2 border border-slate-300 text-slate-700 rounded-md hover:bg-slate-50"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={inviteUser.isPending}
                      className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50"
                    >
                      {inviteUser.isPending ? 'Inviting...' : 'Send Invite'}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
