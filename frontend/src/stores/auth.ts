import { defineStore } from 'pinia'

import { api, APIError } from '../lib/api'
import { defaultRouteForRole, hasRole } from '../lib/roles'
import type { Role, Session } from '../types'

type LoginPayload = {
  username: string
  password: string
}

export const useAuthStore = defineStore('auth', {
  state: () => ({
    session: null as Session | null,
    ready: false,
    loading: false,
    error: '',
  }),

  getters: {
    role: (state): Role | null => state.session?.role ?? null,
    username: (state): string => state.session?.username ?? '',
    isAuthenticated: (state): boolean => Boolean(state.session),
  },

  actions: {
    async bootstrap(force = false) {
      if (this.ready && !force) {
        return
      }
      this.loading = true
      try {
        this.session = await api<Session>('/api/v1/auth/me')
        this.error = ''
      } catch (error) {
        if (!(error instanceof APIError) || error.status !== 401) {
          this.error = error instanceof Error ? error.message : 'Failed to load session'
        }
        this.session = null
      } finally {
        this.loading = false
        this.ready = true
      }
    },

    async login(payload: LoginPayload) {
      this.loading = true
      this.error = ''
      try {
        this.session = await api<Session>('/api/v1/auth/login', {
          method: 'POST',
          body: JSON.stringify(payload),
        })
        this.ready = true
      } catch (error) {
        this.session = null
        this.error = error instanceof Error ? error.message : 'Login failed'
        throw error
      } finally {
        this.loading = false
      }
    },

    async logout() {
      try {
        await api('/api/v1/auth/logout', { method: 'POST' })
      } finally {
        this.session = null
        this.ready = true
        this.error = ''
      }
    },

    can(minRole: Role) {
      return hasRole(this.role, minRole)
    },

    homeRoute() {
      return this.role ? defaultRouteForRole(this.role) : '/login'
    },
  },
})
