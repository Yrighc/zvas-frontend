export const PERMISSIONS = {
  assetRead: 'asset:read',
  assetSearch: 'asset:search',
  assetImport: 'asset:import',
  assetUpdate: 'asset:update',
  taskRead: 'task:read',
  taskCreate: 'task:create',
  taskUpdate: 'task:update',
  findingRead: 'finding:read',
  reportRead: 'report:read',
  reportExport: 'report:export',
  userRead: 'user:read',
  userManage: 'user:manage',
  roleRead: 'role:read',
  roleManage: 'role:manage',
  auditRead: 'audit:read',
  settingsManage: 'settings:manage',
} as const

export function hasPermission(permissions: string[] | undefined, permission: string) {
  if (!permission) {
    return true
  }
  return Boolean(permissions?.includes(permission))
}

export function hasAnyPermission(permissions: string[] | undefined, requiredPermissions: string[] | undefined) {
  if (!requiredPermissions || requiredPermissions.length === 0) {
    return true
  }
  return requiredPermissions.some((permission) => hasPermission(permissions, permission))
}
