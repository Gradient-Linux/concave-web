<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { formatBytes, formatMiB } from '../lib/format'
import type { MetricsPayload } from '../types'

const metrics = ref<MetricsPayload | null>(null)
const error = ref('')
let stream: EventSource | null = null

const installedSuites = computed(() => metrics.value?.suites.filter((suite) => suite.installed) ?? [])
const workspace = computed(() => {
  if (!metrics.value || !('root' in metrics.value.workspace)) {
    return null
  }
  return metrics.value.workspace
})

onMounted(() => {
  stream = new EventSource('/api/v1/metrics/stream')
  stream.addEventListener('metrics', (event) => {
    const message = event as MessageEvent<string>
    metrics.value = JSON.parse(message.data) as MetricsPayload
    error.value = ''
  })
  stream.onmessage = (event) => {
    metrics.value = JSON.parse(event.data) as MetricsPayload
    error.value = ''
  }
  stream.onerror = () => {
    error.value = 'Live metrics stream unavailable'
  }
})

onBeforeUnmount(() => {
  stream?.close()
})
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Live</p>
      <h2>Machine state</h2>
      <p class="muted-copy">
        {{ error || 'Shared snapshot from concave serve with suite, GPU, and workspace telemetry.' }}
      </p>
    </article>

    <article class="surface-panel" v-if="workspace">
      <p class="eyebrow">Workspace</p>
      <h2>{{ formatBytes(workspace.free) }} free</h2>
      <p class="muted-copy">{{ workspace.root }}</p>
      <div class="kv-list">
        <div><span>Used</span><strong>{{ formatBytes(workspace.used) }}</strong></div>
        <div><span>Total</span><strong>{{ formatBytes(workspace.total) }}</strong></div>
      </div>
    </article>

    <article class="surface-panel" v-if="metrics">
      <p class="eyebrow">Suites</p>
      <h2>{{ installedSuites.length }} installed</h2>
      <ul class="stack-list">
        <li v-for="suite in metrics.suites" :key="suite.name" class="row-line">
          <strong>{{ suite.name }}</strong>
          <StatusBadge :value="suite.state" />
        </li>
      </ul>
    </article>

    <article class="surface-panel" v-if="metrics?.gpu?.devices?.length">
      <p class="eyebrow">GPU</p>
      <h2>{{ metrics.gpu.devices[0].name }}</h2>
      <div class="stack-list">
        <div class="row-line">
          <span>Utilization</span>
          <strong>{{ metrics.gpu.devices[0].utilization }}%</strong>
        </div>
        <div class="row-line">
          <span>VRAM</span>
          <strong>
            {{ formatMiB(metrics.gpu.devices[0].memory_used) }} / {{ formatMiB(metrics.gpu.devices[0].memory_total) }}
          </strong>
        </div>
      </div>
    </article>
  </section>
</template>
