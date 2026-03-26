import { createRouter, createWebHistory } from 'vue-router'

import { defaultRouteForRole, hasRole } from '../lib/roles'
import { useAuthStore } from '../stores/auth'
import { pinia } from '../stores'
import type { Role } from '../types'
import DashboardView from '../views/DashboardView.vue'
import EnvironmentView from '../views/EnvironmentView.vue'
import FleetView from '../views/FleetView.vue'
import CheckView from '../views/CheckView.vue'
import LabView from '../views/LabView.vue'
import LoginView from '../views/LoginView.vue'
import LogsView from '../views/LogsView.vue'
import SettingsView from '../views/SettingsView.vue'
import SuitesView from '../views/SuitesView.vue'
import SystemView from '../views/SystemView.vue'
import TeamsView from '../views/TeamsView.vue'
import UsersView from '../views/UsersView.vue'
import WorkspaceView from '../views/WorkspaceView.vue'

declare module 'vue-router' {
  interface RouteMeta {
    public?: boolean
    minRole?: Role
    title?: string
  }
}

export const router = createRouter({
  history: createWebHistory(),
  routes: [
    { path: '/', redirect: '/dashboard' },
    { path: '/login', component: LoginView, meta: { public: true, title: 'Login' } },
    { path: '/dashboard', component: DashboardView, meta: { minRole: 'viewer', title: 'Dashboard' } },
    { path: '/environment', component: EnvironmentView, meta: { minRole: 'viewer', title: 'Environment' } },
    { path: '/fleet', component: FleetView, meta: { minRole: 'viewer', title: 'Fleet' } },
    { path: '/suites', component: SuitesView, meta: { minRole: 'viewer', title: 'Suites' } },
    { path: '/logs', component: LogsView, meta: { minRole: 'viewer', title: 'Logs' } },
    { path: '/workspace', component: WorkspaceView, meta: { minRole: 'viewer', title: 'Workspace' } },
    { path: '/check', component: CheckView, meta: { minRole: 'viewer', title: 'Check' } },
    { path: '/doctor', redirect: '/check' },
    { path: '/lab', component: LabView, meta: { minRole: 'viewer', title: 'Gradient Lab' } },
    { path: '/teams', component: TeamsView, meta: { minRole: 'admin', title: 'Teams' } },
    { path: '/users', component: UsersView, meta: { minRole: 'admin', title: 'Users' } },
    { path: '/system', component: SystemView, meta: { minRole: 'admin', title: 'System' } },
    { path: '/settings', component: SettingsView, meta: { minRole: 'viewer', title: 'Settings' } },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore(pinia)
  await auth.bootstrap()

  if (to.meta.public) {
    if (auth.isAuthenticated) {
      return auth.homeRoute()
    }
    return true
  }

  if (!auth.isAuthenticated) {
    return '/login'
  }

  if (to.meta.minRole && !hasRole(auth.role, to.meta.minRole)) {
    return defaultRouteForRole(auth.role!)
  }

  return true
})
