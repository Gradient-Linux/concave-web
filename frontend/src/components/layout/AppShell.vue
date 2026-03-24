<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import AppIcon from '../AppIcon.vue'
import { hasRole } from '../../lib/roles'
import { useAuthStore } from '../../stores/auth'
import { useUIStore } from '../../stores/ui'
import type { Role } from '../../types'

const auth = useAuthStore()
const ui = useUIStore()
const { role, username } = storeToRefs(auth)
const { theme, sidebarCollapsed } = storeToRefs(ui)
const route = useRoute()
const router = useRouter()

type NavItem = {
  label: string
  to: string
  minRole: Role
  icon: string
}

const items: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', minRole: 'viewer', icon: 'dashboard' },
  { label: 'Environment', to: '/environment', minRole: 'viewer', icon: 'environment' },
  { label: 'Fleet', to: '/fleet', minRole: 'viewer', icon: 'fleet' },
  { label: 'Suites', to: '/suites', minRole: 'viewer', icon: 'suites' },
  { label: 'Logs', to: '/logs', minRole: 'viewer', icon: 'logs' },
  { label: 'Workspace', to: '/workspace', minRole: 'viewer', icon: 'workspace' },
  { label: 'Doctor', to: '/doctor', minRole: 'viewer', icon: 'doctor' },
  { label: 'Teams', to: '/teams', minRole: 'admin', icon: 'teams' },
  { label: 'Users', to: '/users', minRole: 'admin', icon: 'users' },
  { label: 'System', to: '/system', minRole: 'admin', icon: 'system' },
  { label: 'Settings', to: '/settings', minRole: 'viewer', icon: 'settings' },
]

const visibleItems = computed(() => items.filter((item) => hasRole(role.value, item.minRole)))

async function logout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="app-shell" :class="{ 'is-collapsed': sidebarCollapsed }">
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <div class="brand-heading" :class="{ 'is-collapsed': sidebarCollapsed }">
          <div v-if="!sidebarCollapsed" class="brand-copy">
            <p class="brand-mark">Concave</p>
            <p class="brand-subtitle">Dashboard</p>
          </div>
          <button
            class="icon-button sidebar-toggle"
            type="button"
            @click="ui.toggleSidebar()"
            :title="sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'"
          >
            <AppIcon :name="sidebarCollapsed ? 'expand' : 'collapse'" />
          </button>
        </div>
      </div>

      <nav class="nav-stack" aria-label="Primary">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': route.path === item.to }"
          :title="item.label"
        >
          <AppIcon :name="item.icon" />
          <span v-if="!sidebarCollapsed">{{ item.label }}</span>
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <div v-if="!sidebarCollapsed">
          <p class="sidebar-user">{{ username }}</p>
          <p class="sidebar-role">{{ role }}</p>
        </div>
        <div class="sidebar-actions">
          <button class="icon-button" type="button" @click="ui.toggleTheme()" :title="theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'">
            <AppIcon :name="theme === 'dark' ? 'sun' : 'moon'" />
          </button>
          <button class="icon-button" type="button" @click="logout" title="Sign out">
            <AppIcon name="logout" />
          </button>
        </div>
      </div>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div>
          <p class="eyebrow">Control plane</p>
          <h1>{{ route.meta.title }}</h1>
        </div>
        <div class="topbar-meta">
          <span class="muted-copy">concave-web</span>
          <span class="topbar-dot"></span>
          <span class="muted-copy">{{ theme }}</span>
        </div>
      </header>
      <main class="page-shell">
        <slot />
      </main>
    </div>
  </div>
</template>
