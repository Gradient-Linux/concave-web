<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import AppIcon from '../components/AppIcon.vue'
import { api } from '../lib/api'
import { useUIStore } from '../stores/ui'
import type { WebSettings } from '../types'

const ui = useUIStore()
const form = reactive<WebSettings>({
  api_base_url: '',
  bind_addr: '',
  port: 8080,
  prometheus_url: '',
  grafana_url: '',
})

const error = ref('')
const saved = ref('')

async function load() {
  try {
    const settings = await api<WebSettings>('/settings')
    Object.assign(form, settings)
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load settings'
  }
}

async function save() {
  try {
    await api<WebSettings>('/settings', {
      method: 'POST',
      body: JSON.stringify(form),
    })
    saved.value = 'Saved'
    error.value = ''
    window.setTimeout(() => {
      saved.value = ''
    }, 2000)
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to save settings'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel settings-hero">
      <p class="eyebrow">Settings</p>
      <h2>Control plane preferences</h2>
      <p class="muted-copy">Adjust the web shell look and the local proxy connection without leaving the browser.</p>
    </article>

    <article class="surface-panel">
      <div class="settings-section-header">
        <div class="settings-icon-shell">
          <AppIcon name="server" />
        </div>
        <div>
          <p class="eyebrow">Connection</p>
          <h3>Proxy configuration</h3>
        </div>
      </div>
      <form class="form-stack" @submit.prevent="save">
        <label>
          <span>API base URL</span>
          <input v-model="form.api_base_url" type="url" required />
        </label>
        <label>
          <span>Bind address</span>
          <input v-model="form.bind_addr" type="text" required />
        </label>
        <label>
          <span>Port</span>
          <input v-model.number="form.port" type="number" min="1" max="65535" required />
        </label>
        <div class="section-divider"></div>
        <label>
          <span>Prometheus URL</span>
          <input v-model="form.prometheus_url" type="url" placeholder="http://127.0.0.1:9090" />
        </label>
        <label>
          <span>Grafana URL</span>
          <input v-model="form.grafana_url" type="url" placeholder="http://127.0.0.1:3000" />
        </label>
        <p class="muted-copy">
          Leave Prometheus or Grafana blank to disable the corresponding
          <code class="mono-copy">/monitoring/*</code> proxy route on the next restart.
        </p>
        <div class="action-row">
          <button class="primary-button" type="submit">Save</button>
          <span class="success-copy" v-if="saved">{{ saved }}</span>
        </div>
      </form>
    </article>

    <article class="surface-panel">
      <div class="settings-section-header">
        <div class="settings-icon-shell">
          <AppIcon name="palette" />
        </div>
        <div>
          <p class="eyebrow">Appearance</p>
          <h3>Shell preferences</h3>
        </div>
      </div>

      <div class="settings-option">
        <div>
          <strong>Theme</strong>
          <p class="muted-copy">Switch between the darker operations surface and a lighter fallback theme.</p>
        </div>
        <div class="segmented-toggle">
          <button class="toggle-pill" :class="{ 'is-active': ui.theme === 'dark' }" type="button" @click="ui.setTheme('dark')">
            <AppIcon name="moon" />
            <span>Dark</span>
          </button>
          <button class="toggle-pill" :class="{ 'is-active': ui.theme === 'light' }" type="button" @click="ui.setTheme('light')">
            <AppIcon name="sun" />
            <span>Light</span>
          </button>
        </div>
      </div>

      <div class="settings-option">
        <div>
          <strong>Sidebar</strong>
          <p class="muted-copy">Keep the left rail expanded for labels or collapse it down to icon-only navigation.</p>
        </div>
        <div class="segmented-toggle">
          <button class="toggle-pill" :class="{ 'is-active': !ui.sidebarCollapsed }" type="button" @click="ui.setSidebarCollapsed(false)">
            <AppIcon name="expand" />
            <span>Expanded</span>
          </button>
          <button class="toggle-pill" :class="{ 'is-active': ui.sidebarCollapsed }" type="button" @click="ui.setSidebarCollapsed(true)">
            <AppIcon name="collapse" />
            <span>Collapsed</span>
          </button>
        </div>
      </div>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
