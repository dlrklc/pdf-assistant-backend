import type { Permission, Role } from '../services/user.service';

/**
 * Central RBAC mapping
 */
export const ROLE_PERMISSIONS: Record<Role, readonly Permission[]> = {
  Admin: ['documents:upload', 'documents:delete', 'documents:reindex', 'rag:query'],
  Editor: ['documents:upload', 'documents:reindex', 'rag:query'],
  Viewer: ['rag:query'],
} as const;

export function resolvePermissions(roles: Role[]): Permission[] {
  const perms = new Set<Permission>();
  for (const role of roles) {
    for (const p of ROLE_PERMISSIONS[role] ?? []) perms.add(p);
  }
  return [...perms];
}

export function hasPermission(permissions: Permission[], required: Permission): boolean {
  return permissions.includes(required);
}

