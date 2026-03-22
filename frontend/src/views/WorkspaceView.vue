<script setup lang="ts">
import { onMounted, ref } from 'vue'

import { api, pollJob } from '../lib/api'
import { formatBytes } from '../lib/format'
import type { JobSnapshot, WorkspacePayload } from '../types'

const workspace = ref<WorkspacePayload | null>(null)
const job = ref<JobSnapshot | null>(null)
const error = ref('')

async function load() {
  try {
    workspace.value = await api<WorkspacePayload>('/api/v1/workspace')
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load workspace'
  }
}

async function run(action: 'backup' | 'clean') {
  try {
    const accepted = await api<{ job_id: string }>(`/api/v1/workspace/${action}`, { method: 'POST', body: '{}' })
    job.value = await pollJob(accepted.job_id, (snapshot) => {
      job.value = snapshot
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
    <article class="surface-panel hero-panel" v-if="workspace">
      <p class="eyebrow">Workspace</p>
      <h2>{{ workspace.root }}</h2>
      <p class="muted-copy">
        {{ formatBytes(workspace.free) }} free of {{ formatBytes(workspace.total) }}
      </p>
      <div class="action-row">
        <button class="primary-button" type="button" @click="run('backup')">Backup</button>
        <button class="ghost-button" type="button" @click="run('clean')">Clean outputs</button>
      </div>
    </article>

    <article class="surface-panel" v-if="workspace">
      <p class="eyebrow">Usage</p>
      <div class="stack-list">
        <div v-for="(value, key) in workspace.usages" :key="key" class="row-line">
          <span>{{ key }}</span>
          <strong>{{ formatBytes(value) }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel" v-if="job">
      <p class="eyebrow">Job</p>
      <h2>{{ job.name }}</h2>
      <pre class="console-block">{{ job.lines.join('\n') || 'waiting…' }}</pre>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
