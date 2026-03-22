<script setup lang="ts">
import { computed } from 'vue'
import { RouterLink, useRoute, useRouter } from 'vue-router'
import { storeToRefs } from 'pinia'

import { hasRole } from '../../lib/roles'
import { useAuthStore } from '../../stores/auth'
import type { Role } from '../../types'

const auth = useAuthStore()
const { role, username } = storeToRefs(auth)
const route = useRoute()
const router = useRouter()

type NavItem = {
  label: string
  to: string
  minRole: Role
}

const items: NavItem[] = [
  { label: 'Dashboard', to: '/dashboard', minRole: 'viewer' },
  { label: 'Suites', to: '/suites', minRole: 'viewer' },
  { label: 'Logs', to: '/logs', minRole: 'viewer' },
  { label: 'Workspace', to: '/workspace', minRole: 'viewer' },
  { label: 'Doctor', to: '/doctor', minRole: 'viewer' },
  { label: 'Users', to: '/users', minRole: 'admin' },
  { label: 'System', to: '/system', minRole: 'admin' },
  { label: 'Settings', to: '/settings', minRole: 'viewer' },
]

const visibleItems = computed(() => items.filter((item) => hasRole(role.value, item.minRole)))

async function logout() {
  await auth.logout()
  await router.push('/login')
}
</script>

<template>
  <div class="app-shell">
    <aside class="app-sidebar">
      <div class="brand-lockup">
        <p class="brand-mark">gradient</p>
        <p class="brand-subtitle">concave web</p>
      </div>

      <nav class="nav-stack" aria-label="Primary">
        <RouterLink
          v-for="item in visibleItems"
          :key="item.to"
          :to="item.to"
          class="nav-link"
          :class="{ 'is-active': route.path === item.to }"
        >
          {{ item.label }}
        </RouterLink>
      </nav>

      <div class="sidebar-footer">
        <p class="sidebar-user">{{ username }}</p>
        <p class="sidebar-role">{{ role }}</p>
        <button class="ghost-button" type="button" @click="logout">Sign out</button>
      </div>
    </aside>

    <div class="app-main">
      <header class="topbar">
        <div>
          <p class="eyebrow">Control plane</p>
          <h1>{{ route.meta.title }}</h1>
        </div>
      </header>
      <main class="page-shell">
        <slot />
      </main>
    </div>
  </div>
</template>
