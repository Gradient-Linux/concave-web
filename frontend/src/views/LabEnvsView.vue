<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { APIError } from '../lib/api'
import {
  archiveLabEnv,
  extendLabEnv,
  fetchLabEnvs,
  formatCountdown,
  launchLabEnv,
  remainingSeconds,
  setActiveDriver,
  updateLabStorage,
} from '../lib/labEnvs'
import { useAuthStore } from '../stores/auth'
import type { LabEnv, LabEnvsResponse, LabStorage } from '../types'

const auth = useAuthStore()

const envs = ref<LabEnv[]>([])
const storage = ref<LabStorage>({ hot_tier: '', cold_tier: '' })
const drivers = ref<string[]>([])
const activeDriver = ref('')
const error = ref('')
const busy = ref(false)
const tick = ref(0)

const form = ref({
  image: 'jupyter/datascience-notebook:latest',
  display_name: '',
  driver: '',
  gpus: 0,
  cpu_request: '',
  mem_request: '',
  ttl_hours: 2,
})

const storageForm = ref<LabStorage>({ hot_tier: '', cold_tier: '' })
const activeDriverForm = ref('')

const canLaunch = computed(() => auth.can('developer'))
const canArchive = computed(() => auth.can('operator'))
const canConfigure = computed(() => auth.can('admin'))

let pollHandle: number | null = null
let tickHandle: number | null = null

async function refresh() {
  try {
    const payload: LabEnvsResponse = await fetchLabEnvs()
    envs.value = payload.envs ?? []
    storage.value = payload.storage
    drivers.value = payload.drivers ?? []
    activeDriver.value = payload.active ?? ''
    storageForm.value = { ...payload.storage }
    activeDriverForm.value = payload.active ?? ''
    error.value = ''
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Failed to load lab envs'
  }
}

function envRemaining(env: LabEnv): string {
  void tick.value
  return formatCountdown(remainingSeconds(env.expires_at))
}

async function onLaunch() {
  if (!canLaunch.value || busy.value) return
  busy.value = true
  try {
    await launchLabEnv({
      image: form.value.image,
      display_name: form.value.display_name || undefined,
      driver: form.value.driver || undefined,
      gpus: form.value.gpus || undefined,
      cpu_request: form.value.cpu_request || undefined,
      mem_request: form.value.mem_request || undefined,
      ttl_seconds: Math.max(60, Math.round(form.value.ttl_hours * 3600)),
    })
    await refresh()
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Launch failed'
  } finally {
    busy.value = false
  }
}

async function onExtend(env: LabEnv) {
  if (!canLaunch.value) return
  try {
    await extendLabEnv(env.id, 3600)
    await refresh()
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Extend failed'
  }
}

async function onArchive(env: LabEnv) {
  if (!canArchive.value) return
  if (!window.confirm(`Archive ${env.id}? The hot-tier workspace will be moved to ${env.cold_tier_path}.`)) {
    return
  }
  try {
    await archiveLabEnv(env.id)
    await refresh()
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Archive failed'
  }
}

async function onSaveStorage() {
  if (!canConfigure.value) return
  try {
    await updateLabStorage(storageForm.value)
    await refresh()
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Storage update failed'
  }
}

async function onSaveDriver() {
  if (!canConfigure.value) return
  try {
    await setActiveDriver(activeDriverForm.value)
    await refresh()
  } catch (err) {
    error.value = err instanceof APIError ? err.message : 'Driver update failed'
  }
}

onMounted(() => {
  void refresh()
  pollHandle = window.setInterval(() => void refresh(), 15_000)
  tickHandle = window.setInterval(() => {
    tick.value += 1
  }, 1_000)
})

onBeforeUnmount(() => {
  if (pollHandle !== null) window.clearInterval(pollHandle)
  if (tickHandle !== null) window.clearInterval(tickHandle)
})
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Lab environments</p>
      <h2>Ephemeral JupyterLab with TTL and cold-tier archive</h2>
      <p class="muted-copy">
        Launch a per-session Jupyter environment on the active driver
        (<strong>{{ activeDriver || 'docker' }}</strong>). When the TTL expires the
        environment is archived to the cold tier and the container is torn down.
        Archives carry a mesh-addressable peer id so they can be restored on any
        Gradient node.
      </p>
      <div class="summary-strip">
        <div>
          <span class="summary-label">Active driver</span>
          <StatusBadge :value="activeDriver || 'unknown'" />
        </div>
        <div>
          <span class="summary-label">Hot tier</span>
          <code>{{ storage.hot_tier || '—' }}</code>
        </div>
        <div>
          <span class="summary-label">Cold tier</span>
          <code>{{ storage.cold_tier || '—' }}</code>
        </div>
      </div>
    </article>

    <article v-if="error" class="surface-panel">
      <p class="error-copy">{{ error }}</p>
    </article>

    <article v-if="canLaunch" class="surface-panel">
      <h3>Launch a new env</h3>
      <form class="lab-form" @submit.prevent="onLaunch">
        <label>
          <span>Image</span>
          <input v-model="form.image" required />
        </label>
        <label>
          <span>Display name</span>
          <input v-model="form.display_name" placeholder="optional" />
        </label>
        <label>
          <span>Driver</span>
          <select v-model="form.driver">
            <option value="">active ({{ activeDriver || 'docker' }})</option>
            <option v-for="name in drivers" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <label>
          <span>TTL (hours)</span>
          <input v-model.number="form.ttl_hours" type="number" min="0.1" step="0.5" required />
        </label>
        <label>
          <span>GPUs</span>
          <input v-model.number="form.gpus" type="number" min="0" step="1" />
        </label>
        <label>
          <span>CPU (docker --cpus)</span>
          <input v-model="form.cpu_request" placeholder="e.g. 2" />
        </label>
        <label>
          <span>Memory</span>
          <input v-model="form.mem_request" placeholder="e.g. 8g" />
        </label>
        <button type="submit" :disabled="busy">Launch</button>
      </form>
    </article>

    <article class="surface-panel">
      <h3>Active envs</h3>
      <p v-if="!envs.length" class="muted-copy">No lab envs yet.</p>
      <ul v-else class="env-list">
        <li v-for="env in envs" :key="env.id" class="env-row">
          <div class="env-head">
            <code>{{ env.id }}</code>
            <StatusBadge :value="env.status" />
            <span class="env-driver">{{ env.driver }}</span>
          </div>
          <div class="env-meta">
            <span>{{ env.owner }}</span>
            <span>{{ env.image }}</span>
            <span class="env-countdown">TTL {{ envRemaining(env) }}</span>
          </div>
          <div v-if="env.jupyter_url" class="env-actions">
            <a :href="env.jupyter_url" target="_blank" rel="noopener">Open Jupyter</a>
            <button v-if="canLaunch" type="button" @click="onExtend(env)">+1h TTL</button>
            <button v-if="canArchive" type="button" @click="onArchive(env)">Archive now</button>
          </div>
          <p v-if="env.last_error" class="error-copy">{{ env.last_error }}</p>
        </li>
      </ul>
    </article>

    <article v-if="canConfigure" class="surface-panel">
      <h3>Storage tiers</h3>
      <form class="lab-form" @submit.prevent="onSaveStorage">
        <label>
          <span>Hot tier</span>
          <input v-model="storageForm.hot_tier" required />
        </label>
        <label>
          <span>Cold tier</span>
          <input v-model="storageForm.cold_tier" required />
        </label>
        <button type="submit">Save</button>
      </form>
    </article>

    <article v-if="canConfigure" class="surface-panel">
      <h3>Active driver</h3>
      <form class="lab-form" @submit.prevent="onSaveDriver">
        <label>
          <span>Driver</span>
          <select v-model="activeDriverForm">
            <option v-for="name in drivers" :key="name" :value="name">{{ name }}</option>
          </select>
        </label>
        <button type="submit">Set active</button>
      </form>
    </article>
  </section>
</template>

<style scoped>
.lab-form {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(160px, 1fr));
  gap: 0.75rem 1rem;
  align-items: end;
}

.lab-form label {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
}

.lab-form input,
.lab-form select {
  padding: 0.45rem 0.6rem;
  border-radius: 6px;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.1));
  background: var(--color-surface-deep, rgba(0, 0, 0, 0.25));
  color: inherit;
}

.lab-form button {
  padding: 0.55rem 1rem;
  border-radius: 6px;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
  background: var(--color-accent, rgba(80, 140, 255, 0.25));
  color: inherit;
  cursor: pointer;
}

.lab-form button:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.env-list {
  list-style: none;
  padding: 0;
  margin: 0;
  display: grid;
  gap: 0.75rem;
}

.env-row {
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.08));
  border-radius: 8px;
  padding: 0.75rem 1rem;
  display: grid;
  gap: 0.25rem;
}

.env-head {
  display: flex;
  gap: 0.75rem;
  align-items: center;
}

.env-meta {
  display: flex;
  gap: 1rem;
  font-size: 0.85rem;
  color: var(--color-muted, rgba(255, 255, 255, 0.6));
}

.env-countdown {
  font-variant-numeric: tabular-nums;
}

.env-actions {
  display: flex;
  gap: 0.5rem;
  margin-top: 0.35rem;
}

.env-actions button,
.env-actions a {
  padding: 0.35rem 0.7rem;
  border-radius: 6px;
  border: 1px solid var(--color-border, rgba(255, 255, 255, 0.15));
  background: transparent;
  color: inherit;
  text-decoration: none;
  cursor: pointer;
}

.error-copy {
  color: var(--color-error, #f87171);
}
</style>
