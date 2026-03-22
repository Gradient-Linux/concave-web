<script setup lang="ts">
import { onMounted, reactive, ref } from 'vue'

import { api } from '../lib/api'
import type { WebSettings } from '../types'

const form = reactive<WebSettings>({
  api_base_url: '',
  bind_addr: '',
  port: 8080,
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
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Settings</p>
      <h2>Proxy configuration</h2>
      <p class="muted-copy">concave-web persists its own bind address and upstream API target.</p>
    </article>

    <article class="surface-panel">
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
        <div class="action-row">
          <button class="primary-button" type="submit">Save</button>
          <span class="success-copy" v-if="saved">{{ saved }}</span>
        </div>
      </form>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
