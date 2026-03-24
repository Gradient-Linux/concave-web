import { defineStore } from 'pinia'

export type ThemeMode = 'dark' | 'light'

const THEME_KEY = 'concave-web-theme'
const SIDEBAR_KEY = 'concave-web-sidebar-collapsed-v2'

function readTheme(): ThemeMode {
  const value = window.localStorage.getItem(THEME_KEY)
  return value === 'light' ? 'light' : 'dark'
}

function readSidebar(): boolean {
  const value = window.localStorage.getItem(SIDEBAR_KEY)
  if (value === null) {
    return true
  }
  return value === 'true'
}

function applyTheme(theme: ThemeMode) {
  document.documentElement.dataset.theme = theme
}

export const useUIStore = defineStore('ui', {
  state: () => ({
    theme: 'dark' as ThemeMode,
    sidebarCollapsed: true,
    ready: false,
  }),

  actions: {
    hydrate() {
      if (this.ready) {
        applyTheme(this.theme)
        return
      }
      this.theme = readTheme()
      this.sidebarCollapsed = readSidebar()
      applyTheme(this.theme)
      this.ready = true
    },

    setTheme(theme: ThemeMode) {
      this.theme = theme
      window.localStorage.setItem(THEME_KEY, theme)
      applyTheme(theme)
    },

    toggleTheme() {
      this.setTheme(this.theme === 'dark' ? 'light' : 'dark')
    },

    setSidebarCollapsed(value: boolean) {
      this.sidebarCollapsed = value
      window.localStorage.setItem(SIDEBAR_KEY, String(value))
    },

    toggleSidebar() {
      this.setSidebarCollapsed(!this.sidebarCollapsed)
    },
  },
})
