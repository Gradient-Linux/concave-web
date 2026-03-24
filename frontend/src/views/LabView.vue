<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import AppIcon from '../components/AppIcon.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatBytes } from '../lib/format'
import type { SystemInfo, WorkspacePayload } from '../types'

const info = ref<SystemInfo | null>(null)
const workspace = ref<WorkspacePayload | null>(null)
const error = ref('')

const notebookRoot = computed(() => {
  if (!workspace.value) {
    return '—'
  }
  return `${workspace.value.root}/notebooks`
})

const labService = computed(() => {
  if (!info.value) {
    return null
  }
  return info.value.services.find((service) => {
    const name = service.name.toLowerCase()
    return name.includes('gradient-lab') || name.includes('jupyterhub') || name.includes('lab')
  }) ?? null
})

const runtimeStatus = computed(() => labService.value?.status ?? 'not configured')
const workspaceUsedPercent = computed(() => {
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
    const [systemInfo, workspaceInfo] = await Promise.all([
      api<SystemInfo>('/api/v1/system/info'),
      api<WorkspacePayload>('/api/v1/workspace'),
    ])
    info.value = systemInfo
    workspace.value = workspaceInfo
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load Gradient Lab state'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Gradient Lab</p>
      <h2>Collaborative notebooks and managed team sessions</h2>
      <p class="muted-copy">
        Gradient Lab is the notebook-facing layer for shared environments, team quotas, and resolver-aware sessions.
      </p>
      <div class="summary-strip">
        <div>
          <span class="summary-label">Runtime</span>
          <StatusBadge :value="runtimeStatus" />
        </div>
        <div>
          <span class="summary-label">Notebook root</span>
          <strong class="mono-copy">{{ notebookRoot }}</strong>
        </div>
        <div>
          <span class="summary-label">Concave</span>
          <strong>{{ info?.concave ?? '—' }}</strong>
        </div>
        <div>
          <span class="summary-label">Docker</span>
          <strong>{{ info?.docker || 'unknown' }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel">
      <p class="eyebrow">Runtime status</p>
      <div class="stack-list">
        <div class="row-line">
          <div>
            <strong>Service state</strong>
            <p class="muted-copy">
              {{ labService ? `${labService.name} is registered on this node.` : 'No Gradient Lab service is registered on this node yet.' }}
            </p>
          </div>
          <StatusBadge :value="runtimeStatus" />
        </div>
        <div class="section-divider"></div>
        <div class="row-line lab-inline-metric">
          <div class="lab-inline-icon">
            <AppIcon name="workspace" />
          </div>
          <div>
            <strong>Workspace envelope</strong>
            <p class="muted-copy">Notebook sessions mount the shared Gradient workspace rather than hidden per-user paths.</p>
          </div>
        </div>
        <div class="row-line lab-inline-metric">
          <div class="lab-inline-icon">
            <AppIcon name="environment" />
          </div>
          <div>
            <strong>Resolver alignment</strong>
            <p class="muted-copy">Environment drift and surgical rollback stay downstream of concave-resolver instead of living in the notebook tier.</p>
          </div>
        </div>
        <div class="row-line lab-inline-metric">
          <div class="lab-inline-icon">
            <AppIcon name="teams" />
          </div>
          <div>
            <strong>Quota-aware sessions</strong>
            <p class="muted-copy">Group provisioning and GPU shares remain owned by concave compute-engine, not by the Lab UI itself.</p>
          </div>
        </div>
      </div>
    </article>

    <article class="surface-panel" v-if="workspace">
      <p class="eyebrow">Notebook storage</p>
      <div class="row-line">
        <span>Workspace usage</span>
        <strong>{{ workspaceUsedPercent.toFixed(1) }}%</strong>
      </div>
      <div class="progress-track workspace-progress">
        <div
          class="progress-fill progress-fill--accent"
          :style="{ width: `${workspaceUsedPercent}%`, background: usageTone(workspaceUsedPercent) }"
        ></div>
      </div>
      <div class="summary-strip">
        <div>
          <span class="summary-label">Free</span>
          <strong>{{ formatBytes(workspace.free) }}</strong>
        </div>
        <div>
          <span class="summary-label">Used</span>
          <strong>{{ formatBytes(workspace.used) }}</strong>
        </div>
        <div>
          <span class="summary-label">Total</span>
          <strong>{{ formatBytes(workspace.total) }}</strong>
        </div>
        <div>
          <span class="summary-label">Notebooks</span>
          <strong>{{ formatBytes(workspace.usages?.notebooks ?? 0) }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel">
      <p class="eyebrow">Routing note</p>
      <p class="muted-copy">
        This page exposes the Gradient Lab control surface inside concave-web. A full notebook entrypoint only appears after the dedicated
        `gradient-lab` service advertises itself on the node.
      </p>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
