<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import TerminalPane from '../components/terminal/TerminalPane.vue'
import { api, pollJob } from '../lib/api'
import { useAuthStore } from '../stores/auth'
import type { JobSnapshot, SuiteSummary, SuitesResponse } from '../types'

const auth = useAuthStore()
const suites = ref<SuiteSummary[]>([])
const selectedName = ref('boosting')
const job = ref<JobSnapshot | null>(null)
const error = ref('')
const terminalEndpoint = ref('')
const terminalTitle = ref('')
const terminalOpen = ref(false)
const labURL = ref('')

const selected = computed(() => suites.value.find((suite) => suite.name === selectedName.value) ?? suites.value[0] ?? null)

async function load() {
  try {
    const response = await api<SuitesResponse>('/api/v1/suites')
    suites.value = response.suites
    if (!selected.value && suites.value.length > 0) {
      selectedName.value = suites.value[0].name
    }
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load suites'
  }
}

async function runAction(action: 'install' | 'remove' | 'start' | 'stop' | 'update' | 'rollback') {
  if (!selected.value) {
    return
  }
  try {
    const accepted = await api<{ job_id: string }>(`/api/v1/suites/${selected.value.name}/${action}`, {
      method: 'POST',
      body: '{}',
    })
    job.value = await pollJob(accepted.job_id, (snapshot) => {
      job.value = snapshot
    })
    await load()
  } catch (err) {
    error.value = err instanceof Error ? err.message : `Failed to ${action}`
  }
}

async function openLab() {
  if (!selected.value) {
    return
  }
  try {
    const response = await api<{ url: string }>(`/api/v1/suites/${selected.value.name}/lab`)
    labURL.value = response.url
    window.open(response.url, '_blank', 'noopener,noreferrer')
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to open lab'
  }
}

function openTerminal(container: string) {
  if (!selected.value) {
    return
  }
  terminalEndpoint.value = `/api/v1/terminal/container/${selected.value.name}/${container}`
  terminalTitle.value = `${selected.value.name} · ${container}`
  terminalOpen.value = true
}

const canDevelop = computed(() => auth.can('developer'))
const canOperate = computed(() => auth.can('operator'))

onMounted(load)
</script>

<template>
  <section class="two-column-layout">
    <article class="surface-panel">
      <p class="eyebrow">Suites</p>
      <div class="stack-list">
        <button
          v-for="suite in suites"
          :key="suite.name"
          class="list-button"
          :class="{ 'is-selected': suite.name === selectedName }"
          type="button"
          @click="selectedName = suite.name"
        >
          <div>
            <strong>{{ suite.name }}</strong>
            <p class="muted-copy">{{ suite.current || 'not installed' }}</p>
          </div>
          <StatusBadge :value="suite.state" />
        </button>
      </div>
    </article>

    <article class="surface-panel" v-if="selected">
      <div class="row-line">
        <div>
          <p class="eyebrow">Selected suite</p>
          <h2>{{ selected.name }}</h2>
        </div>
        <StatusBadge :value="selected.state" />
      </div>

      <p class="muted-copy" v-if="selected.error">{{ selected.error }}</p>
      <p class="muted-copy" v-else>{{ selected.current || 'No recorded version yet' }}</p>

      <div class="action-row">
        <button v-if="canOperate" class="primary-button" type="button" @click="runAction('install')">Install</button>
        <button v-if="canOperate" class="ghost-button" type="button" @click="runAction('remove')">Remove</button>
        <button v-if="canOperate" class="ghost-button" type="button" @click="runAction('start')">Start</button>
        <button v-if="canOperate" class="ghost-button" type="button" @click="runAction('stop')">Stop</button>
        <button v-if="canOperate" class="ghost-button" type="button" @click="runAction('update')">Update</button>
        <button v-if="canOperate" class="ghost-button" type="button" @click="runAction('rollback')">Rollback</button>
        <button v-if="canDevelop" class="ghost-button" type="button" @click="openLab">Lab</button>
      </div>

      <div class="section-divider"></div>

      <p class="eyebrow">Containers</p>
      <div class="stack-list">
        <div v-for="container in selected.containers" :key="container.name" class="table-row">
          <div>
            <strong>{{ container.name }}</strong>
            <p class="mono-copy">{{ container.image }}</p>
          </div>
          <div class="table-actions">
            <StatusBadge :value="container.status" />
            <button v-if="canDevelop" class="ghost-button" type="button" @click="openTerminal(container.name)">Terminal</button>
          </div>
        </div>
      </div>

      <div class="section-divider"></div>

      <p class="eyebrow">Ports</p>
      <div class="stack-list">
        <div v-for="port in selected.ports" :key="`${port.host}-${port.container}`" class="row-line">
          <span>{{ port.description || 'Port mapping' }}</span>
          <strong>{{ port.host }} → {{ port.container }}</strong>
        </div>
      </div>

      <div class="section-divider" v-if="job || labURL"></div>

      <div v-if="labURL">
        <p class="eyebrow">Lab URL</p>
        <p class="mono-copy">{{ labURL }}</p>
      </div>

      <div v-if="job">
        <p class="eyebrow">Job</p>
        <pre class="console-block">{{ job.lines.join('\n') || 'waiting…' }}</pre>
      </div>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>

    <TerminalPane
      v-model="terminalOpen"
      :endpoint="terminalEndpoint"
      :title="terminalTitle"
    />
  </section>
</template>
