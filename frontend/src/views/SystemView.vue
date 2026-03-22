<script setup lang="ts">
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import TerminalPane from '../components/terminal/TerminalPane.vue'
import { api } from '../lib/api'
import type { SystemInfo } from '../types'

const info = ref<SystemInfo | null>(null)
const error = ref('')
const hostTerminalOpen = ref(false)

async function load() {
  try {
    info.value = await api<SystemInfo>('/api/v1/system/info')
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load system info'
  }
}

async function control(action: 'reboot' | 'shutdown' | 'restart-docker') {
  if (!window.confirm(`Confirm ${action.replace('-', ' ')}?`)) {
    return
  }
  try {
    await api(`/api/v1/system/${action}`, {
      method: 'POST',
      body: JSON.stringify({ confirm: true }),
    })
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : `Failed to ${action}`
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel" v-if="info">
      <p class="eyebrow">System</p>
      <h2>{{ info.hostname }}</h2>
      <p class="muted-copy">{{ info.os }} · {{ info.kernel }} · uptime {{ info.uptime }}</p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="hostTerminalOpen = true">Host terminal</button>
        <button class="ghost-button" type="button" @click="control('restart-docker')">Restart Docker</button>
        <button class="ghost-button" type="button" @click="control('reboot')">Reboot</button>
        <button class="ghost-button danger" type="button" @click="control('shutdown')">Shutdown</button>
      </div>
    </article>

    <article class="surface-panel" v-if="info">
      <p class="eyebrow">Services</p>
      <ul class="stack-list">
        <li v-for="service in info.services" :key="service.name" class="row-line">
          <div>
            <strong>{{ service.name }}</strong>
            <p class="muted-copy">{{ service.user || 'system' }}</p>
          </div>
          <StatusBadge :value="service.status" />
        </li>
      </ul>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>

    <TerminalPane v-model="hostTerminalOpen" endpoint="/api/v1/terminal/host" title="Host shell" />
  </section>
</template>
