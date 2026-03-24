<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import { api, pollJob } from '../lib/api'
import { formatBytes } from '../lib/format'
import type { JobSnapshot, WorkspacePayload } from '../types'

const workspace = ref<WorkspacePayload | null>(null)
const job = ref<JobSnapshot | null>(null)
const error = ref('')

const usageEntries = computed(() => {
  if (!workspace.value?.usages) {
    return []
  }

  const preferredOrder = ['backups', 'compose', 'config', 'dags', 'data', 'mlruns', 'models', 'notebooks', 'outputs']
  const ranking = new Map(preferredOrder.map((name, index) => [name, index]))

  return Object.entries(workspace.value.usages)
    .sort(([left], [right]) => {
      const leftRank = ranking.get(left) ?? preferredOrder.length + 1
      const rightRank = ranking.get(right) ?? preferredOrder.length + 1
      if (leftRank !== rightRank) {
        return leftRank - rightRank
      }
      return left.localeCompare(right)
    })
    .map(([name, value]) => ({
      name,
      value,
      percent: workspace.value?.total ? Math.max(0, Math.min(100, (value / workspace.value.total) * 100)) : 0,
    }))
})

const workspaceUsagePercent = computed(() => {
  if (!workspace.value?.total) {
    return 0
  }
  return Math.max(0, Math.min(100, (workspace.value.used / workspace.value.total) * 100))
})

function usageTone(value: number): string {
  if (value >= 80) {
    return 'var(--color-gold)'
  }
  if (value >= 50) {
    return 'var(--color-mid)'
  }
  return 'var(--color-deep)'
}

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
      <div class="usage-block">
        <div class="row-line">
          <span>Usage</span>
          <strong>{{ workspaceUsagePercent.toFixed(1) }}%</strong>
        </div>
        <div class="progress-track workspace-progress">
          <div
            class="progress-fill progress-fill--accent"
            :style="{ width: `${workspaceUsagePercent}%`, background: usageTone(workspaceUsagePercent) }"
          ></div>
        </div>
      </div>
      <div class="action-row">
        <button class="primary-button" type="button" @click="run('backup')">Backup</button>
        <button class="ghost-button" type="button" @click="run('clean')">Clean outputs</button>
      </div>
    </article>

    <article class="surface-panel" v-if="workspace">
      <p class="eyebrow">Usage</p>
      <div class="workspace-usage-list">
        <div v-for="entry in usageEntries" :key="entry.name" class="workspace-usage-item">
          <div class="row-line workspace-usage-row">
            <span>{{ entry.name }}</span>
            <strong>{{ formatBytes(entry.value) }}</strong>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill progress-fill--accent"
              :style="{ width: `${entry.percent}%`, background: usageTone(entry.percent) }"
            ></div>
          </div>
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
