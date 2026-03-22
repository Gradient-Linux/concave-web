import type { Role } from '../types'

const rank: Record<Role, number> = {
  viewer: 0,
  developer: 1,
  operator: 2,
  admin: 3,
}

export function hasRole(role: Role | null | undefined, minRole: Role): boolean {
  if (!role) {
    return false
  }
  return rank[role] >= rank[minRole]
}

export function defaultRouteForRole(role: Role): string {
  if (hasRole(role, 'viewer')) {
    return '/dashboard'
  }
  return '/login'
}
