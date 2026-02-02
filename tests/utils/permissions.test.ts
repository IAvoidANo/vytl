import { describe, it, expect } from 'vitest'

/**
 * Role-Based Access Control (RBAC) Tests
 *
 * Role hierarchy (highest to lowest):
 * OWNER > ADMIN > RISK_MANAGER > EDITOR > VIEWER
 *
 * Each role inherits permissions from roles below it.
 */

// ============================================
// Types and Interfaces
// ============================================

type Role = 'OWNER' | 'ADMIN' | 'RISK_MANAGER' | 'EDITOR' | 'VIEWER'

type Permission =
  // Read permissions
  | 'READ_RISKS'
  | 'READ_DASHBOARD'
  | 'READ_REPORTS'
  | 'READ_KRIS'
  | 'READ_AUDIT_LOGS'
  // Risk management
  | 'CREATE_RISK'
  | 'UPDATE_RISK'
  | 'DELETE_RISK'
  | 'IMPORT_RISKS'
  // KRI management
  | 'CREATE_KRI'
  | 'UPDATE_KRI'
  | 'DELETE_KRI'
  // AI features
  | 'RUN_AI_ANALYSIS'
  // User management
  | 'INVITE_USER'
  | 'UPDATE_USER_ROLE'
  | 'DISABLE_USER'
  | 'DELETE_USER'
  // Organisation management
  | 'UPDATE_ORG_SETTINGS'
  | 'MANAGE_POPIA'
  // Approval workflows
  | 'APPROVE_TREATMENT'
  | 'REJECT_TREATMENT'
  // Owner-only
  | 'ACCESS_BILLING'
  | 'DELETE_ORGANISATION'
  | 'TRANSFER_OWNERSHIP'

interface User {
  id: string
  role: Role
  orgId: string
  isActive: boolean
}

// ============================================
// Permission Configuration
// ============================================

const ROLE_HIERARCHY: Record<Role, number> = {
  VIEWER: 1,
  EDITOR: 2,
  RISK_MANAGER: 3,
  ADMIN: 4,
  OWNER: 5,
}

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  VIEWER: [
    'READ_RISKS',
    'READ_DASHBOARD',
    'READ_REPORTS',
    'READ_KRIS',
  ],
  EDITOR: [
    // Inherits VIEWER
    'READ_RISKS',
    'READ_DASHBOARD',
    'READ_REPORTS',
    'READ_KRIS',
    // Additional
    'CREATE_RISK',
    'UPDATE_RISK',
    'IMPORT_RISKS',
    'CREATE_KRI',
    'UPDATE_KRI',
  ],
  RISK_MANAGER: [
    // Inherits EDITOR
    'READ_RISKS',
    'READ_DASHBOARD',
    'READ_REPORTS',
    'READ_KRIS',
    'CREATE_RISK',
    'UPDATE_RISK',
    'IMPORT_RISKS',
    'CREATE_KRI',
    'UPDATE_KRI',
    // Additional
    'DELETE_RISK',
    'DELETE_KRI',
    'RUN_AI_ANALYSIS',
    'READ_AUDIT_LOGS',
  ],
  ADMIN: [
    // Inherits RISK_MANAGER
    'READ_RISKS',
    'READ_DASHBOARD',
    'READ_REPORTS',
    'READ_KRIS',
    'CREATE_RISK',
    'UPDATE_RISK',
    'IMPORT_RISKS',
    'CREATE_KRI',
    'UPDATE_KRI',
    'DELETE_RISK',
    'DELETE_KRI',
    'RUN_AI_ANALYSIS',
    'READ_AUDIT_LOGS',
    // Additional
    'INVITE_USER',
    'UPDATE_USER_ROLE',
    'DISABLE_USER',
    'UPDATE_ORG_SETTINGS',
    'MANAGE_POPIA',
    'APPROVE_TREATMENT',
    'REJECT_TREATMENT',
  ],
  OWNER: [
    // Inherits ADMIN
    'READ_RISKS',
    'READ_DASHBOARD',
    'READ_REPORTS',
    'READ_KRIS',
    'CREATE_RISK',
    'UPDATE_RISK',
    'IMPORT_RISKS',
    'CREATE_KRI',
    'UPDATE_KRI',
    'DELETE_RISK',
    'DELETE_KRI',
    'RUN_AI_ANALYSIS',
    'READ_AUDIT_LOGS',
    'INVITE_USER',
    'UPDATE_USER_ROLE',
    'DISABLE_USER',
    'UPDATE_ORG_SETTINGS',
    'MANAGE_POPIA',
    'APPROVE_TREATMENT',
    'REJECT_TREATMENT',
    // Additional (OWNER-only)
    'DELETE_USER',
    'ACCESS_BILLING',
    'DELETE_ORGANISATION',
    'TRANSFER_OWNERSHIP',
  ],
}

// ============================================
// Permission Helper Functions
// ============================================

// Check if user has a specific permission
function hasPermission(user: User, permission: Permission): boolean {
  if (!user.isActive) return false
  return ROLE_PERMISSIONS[user.role].includes(permission)
}

// Check if user has minimum role level
function hasMinimumRole(user: User, minRole: Role): boolean {
  if (!user.isActive) return false
  return ROLE_HIERARCHY[user.role] >= ROLE_HIERARCHY[minRole]
}

// Check if user can modify another user's role
function canModifyUserRole(actor: User, target: User, newRole: Role): boolean {
  if (!actor.isActive) return false

  // Must have UPDATE_USER_ROLE permission
  if (!hasPermission(actor, 'UPDATE_USER_ROLE')) return false

  // Cannot modify yourself
  if (actor.id === target.id) return false

  // Cannot promote to equal or higher role than self
  if (ROLE_HIERARCHY[newRole] >= ROLE_HIERARCHY[actor.role]) return false

  // Cannot modify users with equal or higher role
  if (ROLE_HIERARCHY[target.role] >= ROLE_HIERARCHY[actor.role]) return false

  return true
}

// Check if user can delete another user
function canDeleteUser(actor: User, target: User): boolean {
  if (!actor.isActive) return false

  // Only OWNER can delete users
  if (!hasPermission(actor, 'DELETE_USER')) return false

  // Cannot delete yourself
  if (actor.id === target.id) return false

  // Cannot delete another OWNER
  if (target.role === 'OWNER') return false

  return true
}

// Simulate role change enforcement
function enforceRoleChange(user: User, newRole: Role): User {
  return { ...user, role: newRole }
}

// Get all permissions for a role
function getPermissionsForRole(role: Role): Permission[] {
  return [...ROLE_PERMISSIONS[role]]
}

// Check multiple permissions at once
function hasAllPermissions(user: User, permissions: Permission[]): boolean {
  return permissions.every((p) => hasPermission(user, p))
}

// Check if has any of the permissions
function hasAnyPermission(user: User, permissions: Permission[]): boolean {
  return permissions.some((p) => hasPermission(user, p))
}

// ============================================
// Test Data
// ============================================

const createUser = (role: Role, id = 'user-1'): User => ({
  id,
  role,
  orgId: 'org-1',
  isActive: true,
})

// ============================================
// TESTS
// ============================================

describe('Role-Based Access Control', () => {
  // ----------------------------------------
  // VIEWER Role Tests
  // ----------------------------------------
  describe('VIEWER Role', () => {
    const viewer = createUser('VIEWER')

    it('should allow reading risks', () => {
      expect(hasPermission(viewer, 'READ_RISKS')).toBe(true)
    })

    it('should allow reading dashboard', () => {
      expect(hasPermission(viewer, 'READ_DASHBOARD')).toBe(true)
    })

    it('should allow reading reports', () => {
      expect(hasPermission(viewer, 'READ_REPORTS')).toBe(true)
    })

    it('should allow reading KRIs', () => {
      expect(hasPermission(viewer, 'READ_KRIS')).toBe(true)
    })

    it('should NOT allow creating risks', () => {
      expect(hasPermission(viewer, 'CREATE_RISK')).toBe(false)
    })

    it('should NOT allow updating risks', () => {
      expect(hasPermission(viewer, 'UPDATE_RISK')).toBe(false)
    })

    it('should NOT allow deleting risks', () => {
      expect(hasPermission(viewer, 'DELETE_RISK')).toBe(false)
    })

    it('should NOT allow importing risks', () => {
      expect(hasPermission(viewer, 'IMPORT_RISKS')).toBe(false)
    })

    it('should NOT allow managing users', () => {
      expect(hasPermission(viewer, 'INVITE_USER')).toBe(false)
      expect(hasPermission(viewer, 'UPDATE_USER_ROLE')).toBe(false)
    })

    it('should NOT allow accessing billing', () => {
      expect(hasPermission(viewer, 'ACCESS_BILLING')).toBe(false)
    })
  })

  // ----------------------------------------
  // EDITOR Role Tests
  // ----------------------------------------
  describe('EDITOR Role', () => {
    const editor = createUser('EDITOR')

    it('should inherit all VIEWER permissions', () => {
      expect(hasPermission(editor, 'READ_RISKS')).toBe(true)
      expect(hasPermission(editor, 'READ_DASHBOARD')).toBe(true)
      expect(hasPermission(editor, 'READ_REPORTS')).toBe(true)
      expect(hasPermission(editor, 'READ_KRIS')).toBe(true)
    })

    it('should allow creating risks', () => {
      expect(hasPermission(editor, 'CREATE_RISK')).toBe(true)
    })

    it('should allow updating risks', () => {
      expect(hasPermission(editor, 'UPDATE_RISK')).toBe(true)
    })

    it('should allow importing risks', () => {
      expect(hasPermission(editor, 'IMPORT_RISKS')).toBe(true)
    })

    it('should allow creating and updating KRIs', () => {
      expect(hasPermission(editor, 'CREATE_KRI')).toBe(true)
      expect(hasPermission(editor, 'UPDATE_KRI')).toBe(true)
    })

    it('should NOT allow deleting risks', () => {
      expect(hasPermission(editor, 'DELETE_RISK')).toBe(false)
    })

    it('should NOT allow running AI analysis', () => {
      expect(hasPermission(editor, 'RUN_AI_ANALYSIS')).toBe(false)
    })

    it('should NOT allow managing users', () => {
      expect(hasPermission(editor, 'INVITE_USER')).toBe(false)
    })
  })

  // ----------------------------------------
  // RISK_MANAGER Role Tests
  // ----------------------------------------
  describe('RISK_MANAGER Role', () => {
    const riskManager = createUser('RISK_MANAGER')

    it('should inherit all EDITOR permissions', () => {
      expect(hasPermission(riskManager, 'CREATE_RISK')).toBe(true)
      expect(hasPermission(riskManager, 'UPDATE_RISK')).toBe(true)
      expect(hasPermission(riskManager, 'IMPORT_RISKS')).toBe(true)
    })

    it('should allow deleting risks', () => {
      expect(hasPermission(riskManager, 'DELETE_RISK')).toBe(true)
    })

    it('should allow deleting KRIs', () => {
      expect(hasPermission(riskManager, 'DELETE_KRI')).toBe(true)
    })

    it('should allow running AI analysis', () => {
      expect(hasPermission(riskManager, 'RUN_AI_ANALYSIS')).toBe(true)
    })

    it('should allow reading audit logs', () => {
      expect(hasPermission(riskManager, 'READ_AUDIT_LOGS')).toBe(true)
    })

    it('should NOT allow managing users', () => {
      expect(hasPermission(riskManager, 'INVITE_USER')).toBe(false)
      expect(hasPermission(riskManager, 'UPDATE_USER_ROLE')).toBe(false)
    })

    it('should NOT allow approving treatments', () => {
      expect(hasPermission(riskManager, 'APPROVE_TREATMENT')).toBe(false)
    })
  })

  // ----------------------------------------
  // ADMIN Role Tests
  // ----------------------------------------
  describe('ADMIN Role', () => {
    const admin = createUser('ADMIN')

    it('should inherit all RISK_MANAGER permissions', () => {
      expect(hasPermission(admin, 'DELETE_RISK')).toBe(true)
      expect(hasPermission(admin, 'RUN_AI_ANALYSIS')).toBe(true)
      expect(hasPermission(admin, 'READ_AUDIT_LOGS')).toBe(true)
    })

    it('should allow inviting users', () => {
      expect(hasPermission(admin, 'INVITE_USER')).toBe(true)
    })

    it('should allow updating user roles', () => {
      expect(hasPermission(admin, 'UPDATE_USER_ROLE')).toBe(true)
    })

    it('should allow disabling users', () => {
      expect(hasPermission(admin, 'DISABLE_USER')).toBe(true)
    })

    it('should allow updating organisation settings', () => {
      expect(hasPermission(admin, 'UPDATE_ORG_SETTINGS')).toBe(true)
    })

    it('should allow managing POPIA settings', () => {
      expect(hasPermission(admin, 'MANAGE_POPIA')).toBe(true)
    })

    it('should allow approving treatments', () => {
      expect(hasPermission(admin, 'APPROVE_TREATMENT')).toBe(true)
    })

    it('should allow rejecting treatments', () => {
      expect(hasPermission(admin, 'REJECT_TREATMENT')).toBe(true)
    })

    it('should NOT allow deleting users', () => {
      expect(hasPermission(admin, 'DELETE_USER')).toBe(false)
    })

    it('should NOT allow accessing billing', () => {
      expect(hasPermission(admin, 'ACCESS_BILLING')).toBe(false)
    })

    it('should NOT allow deleting organisation', () => {
      expect(hasPermission(admin, 'DELETE_ORGANISATION')).toBe(false)
    })
  })

  // ----------------------------------------
  // OWNER Role Tests
  // ----------------------------------------
  describe('OWNER Role', () => {
    const owner = createUser('OWNER')

    it('should inherit all ADMIN permissions', () => {
      expect(hasPermission(owner, 'INVITE_USER')).toBe(true)
      expect(hasPermission(owner, 'UPDATE_USER_ROLE')).toBe(true)
      expect(hasPermission(owner, 'APPROVE_TREATMENT')).toBe(true)
    })

    it('should allow deleting users', () => {
      expect(hasPermission(owner, 'DELETE_USER')).toBe(true)
    })

    it('should allow accessing billing', () => {
      expect(hasPermission(owner, 'ACCESS_BILLING')).toBe(true)
    })

    it('should allow deleting organisation', () => {
      expect(hasPermission(owner, 'DELETE_ORGANISATION')).toBe(true)
    })

    it('should allow transferring ownership', () => {
      expect(hasPermission(owner, 'TRANSFER_OWNERSHIP')).toBe(true)
    })

    it('should have all permissions', () => {
      const ownerPermissions = getPermissionsForRole('OWNER')
      expect(ownerPermissions.length).toBeGreaterThan(20)
    })
  })

  // ----------------------------------------
  // Role Hierarchy Tests
  // ----------------------------------------
  describe('Role Hierarchy', () => {
    it('should rank OWNER highest', () => {
      expect(ROLE_HIERARCHY['OWNER']).toBe(5)
    })

    it('should rank VIEWER lowest', () => {
      expect(ROLE_HIERARCHY['VIEWER']).toBe(1)
    })

    it('should have correct hierarchy order', () => {
      expect(ROLE_HIERARCHY['OWNER']).toBeGreaterThan(ROLE_HIERARCHY['ADMIN'])
      expect(ROLE_HIERARCHY['ADMIN']).toBeGreaterThan(ROLE_HIERARCHY['RISK_MANAGER'])
      expect(ROLE_HIERARCHY['RISK_MANAGER']).toBeGreaterThan(ROLE_HIERARCHY['EDITOR'])
      expect(ROLE_HIERARCHY['EDITOR']).toBeGreaterThan(ROLE_HIERARCHY['VIEWER'])
    })

    it('should check minimum role correctly', () => {
      const editor = createUser('EDITOR')
      expect(hasMinimumRole(editor, 'VIEWER')).toBe(true)
      expect(hasMinimumRole(editor, 'EDITOR')).toBe(true)
      expect(hasMinimumRole(editor, 'RISK_MANAGER')).toBe(false)
      expect(hasMinimumRole(editor, 'ADMIN')).toBe(false)
    })
  })

  // ----------------------------------------
  // User Management Permission Tests
  // ----------------------------------------
  describe('User Management Permissions', () => {
    const owner = createUser('OWNER', 'owner-1')
    const admin = createUser('ADMIN', 'admin-1')
    const editor = createUser('EDITOR', 'editor-1')
    const viewer = createUser('VIEWER', 'viewer-1')

    it('should allow ADMIN to change EDITOR to VIEWER', () => {
      expect(canModifyUserRole(admin, editor, 'VIEWER')).toBe(true)
    })

    it('should allow ADMIN to change VIEWER to EDITOR', () => {
      expect(canModifyUserRole(admin, viewer, 'EDITOR')).toBe(true)
    })

    it('should NOT allow ADMIN to promote to ADMIN', () => {
      expect(canModifyUserRole(admin, editor, 'ADMIN')).toBe(false)
    })

    it('should NOT allow ADMIN to promote to OWNER', () => {
      expect(canModifyUserRole(admin, editor, 'OWNER')).toBe(false)
    })

    it('should NOT allow ADMIN to modify another ADMIN', () => {
      const admin2 = createUser('ADMIN', 'admin-2')
      expect(canModifyUserRole(admin, admin2, 'EDITOR')).toBe(false)
    })

    it('should allow OWNER to change ADMIN to EDITOR', () => {
      expect(canModifyUserRole(owner, admin, 'EDITOR')).toBe(true)
    })

    it('should NOT allow user to modify their own role', () => {
      expect(canModifyUserRole(admin, admin, 'OWNER')).toBe(false)
    })

    it('should NOT allow EDITOR to modify any roles', () => {
      expect(canModifyUserRole(editor, viewer, 'EDITOR')).toBe(false)
    })
  })

  // ----------------------------------------
  // User Deletion Permission Tests
  // ----------------------------------------
  describe('User Deletion Permissions', () => {
    const owner = createUser('OWNER', 'owner-1')
    const admin = createUser('ADMIN', 'admin-1')
    const editor = createUser('EDITOR', 'editor-1')

    it('should allow OWNER to delete ADMIN', () => {
      expect(canDeleteUser(owner, admin)).toBe(true)
    })

    it('should allow OWNER to delete EDITOR', () => {
      expect(canDeleteUser(owner, editor)).toBe(true)
    })

    it('should NOT allow OWNER to delete themselves', () => {
      expect(canDeleteUser(owner, owner)).toBe(false)
    })

    it('should NOT allow OWNER to delete another OWNER', () => {
      const owner2 = createUser('OWNER', 'owner-2')
      expect(canDeleteUser(owner, owner2)).toBe(false)
    })

    it('should NOT allow ADMIN to delete users', () => {
      expect(canDeleteUser(admin, editor)).toBe(false)
    })
  })

  // ----------------------------------------
  // Inactive User Tests
  // ----------------------------------------
  describe('Inactive User Handling', () => {
    it('should deny all permissions for inactive user', () => {
      const inactiveAdmin: User = {
        id: 'user-1',
        role: 'ADMIN',
        orgId: 'org-1',
        isActive: false,
      }

      expect(hasPermission(inactiveAdmin, 'READ_RISKS')).toBe(false)
      expect(hasPermission(inactiveAdmin, 'CREATE_RISK')).toBe(false)
      expect(hasPermission(inactiveAdmin, 'INVITE_USER')).toBe(false)
    })

    it('should deny minimum role check for inactive user', () => {
      const inactiveOwner: User = {
        id: 'user-1',
        role: 'OWNER',
        orgId: 'org-1',
        isActive: false,
      }

      expect(hasMinimumRole(inactiveOwner, 'VIEWER')).toBe(false)
    })

    it('should deny role modification by inactive user', () => {
      const inactiveAdmin: User = {
        id: 'admin-1',
        role: 'ADMIN',
        orgId: 'org-1',
        isActive: false,
      }
      const viewer = createUser('VIEWER', 'viewer-1')

      expect(canModifyUserRole(inactiveAdmin, viewer, 'EDITOR')).toBe(false)
    })
  })

  // ----------------------------------------
  // Role Change Enforcement Tests
  // ----------------------------------------
  describe('Role Change Enforcement', () => {
    it('should enforce role change immediately', () => {
      const user = createUser('ADMIN')

      // User has ADMIN permissions
      expect(hasPermission(user, 'INVITE_USER')).toBe(true)

      // Role is changed to EDITOR
      const demotedUser = enforceRoleChange(user, 'EDITOR')

      // Permissions are immediately updated
      expect(hasPermission(demotedUser, 'INVITE_USER')).toBe(false)
      expect(hasPermission(demotedUser, 'CREATE_RISK')).toBe(true)
    })

    it('should grant new permissions on promotion', () => {
      const user = createUser('VIEWER')

      expect(hasPermission(user, 'CREATE_RISK')).toBe(false)

      const promotedUser = enforceRoleChange(user, 'EDITOR')

      expect(hasPermission(promotedUser, 'CREATE_RISK')).toBe(true)
    })

    it('should revoke permissions on demotion', () => {
      const user = createUser('RISK_MANAGER')

      expect(hasPermission(user, 'DELETE_RISK')).toBe(true)

      const demotedUser = enforceRoleChange(user, 'EDITOR')

      expect(hasPermission(demotedUser, 'DELETE_RISK')).toBe(false)
    })
  })

  // ----------------------------------------
  // Multiple Permission Checks
  // ----------------------------------------
  describe('Multiple Permission Checks', () => {
    it('should check all permissions are present', () => {
      const admin = createUser('ADMIN')
      const requiredPermissions: Permission[] = [
        'READ_RISKS',
        'CREATE_RISK',
        'INVITE_USER',
      ]

      expect(hasAllPermissions(admin, requiredPermissions)).toBe(true)
    })

    it('should fail if any permission is missing', () => {
      const editor = createUser('EDITOR')
      const requiredPermissions: Permission[] = [
        'READ_RISKS',
        'CREATE_RISK',
        'INVITE_USER', // Editor doesn't have this
      ]

      expect(hasAllPermissions(editor, requiredPermissions)).toBe(false)
    })

    it('should check if any permission is present', () => {
      const viewer = createUser('VIEWER')
      const permissions: Permission[] = [
        'CREATE_RISK',
        'DELETE_RISK',
        'READ_RISKS', // Viewer has this
      ]

      expect(hasAnyPermission(viewer, permissions)).toBe(true)
    })

    it('should fail if no permission is present', () => {
      const viewer = createUser('VIEWER')
      const permissions: Permission[] = [
        'CREATE_RISK',
        'DELETE_RISK',
        'INVITE_USER',
      ]

      expect(hasAnyPermission(viewer, permissions)).toBe(false)
    })
  })

  // ----------------------------------------
  // Edge Cases
  // ----------------------------------------
  describe('Edge Cases', () => {
    it('should handle permission count per role', () => {
      expect(getPermissionsForRole('VIEWER').length).toBe(4)
      expect(getPermissionsForRole('EDITOR').length).toBe(9)
      expect(getPermissionsForRole('RISK_MANAGER').length).toBe(13)
      expect(getPermissionsForRole('ADMIN').length).toBe(20)
      expect(getPermissionsForRole('OWNER').length).toBe(24)
    })

    it('should return new array for permissions (no mutation)', () => {
      const perms1 = getPermissionsForRole('ADMIN')
      const perms2 = getPermissionsForRole('ADMIN')

      expect(perms1).not.toBe(perms2) // Different array instances
      expect(perms1).toEqual(perms2) // Same contents
    })
  })
})
