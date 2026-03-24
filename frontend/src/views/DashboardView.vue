<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import AppIcon from '../components/AppIcon.vue'
import MetricLineChart from '../components/dashboard/MetricLineChart.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { formatBytes, formatMiB } from '../lib/format'
import type { MetricsPayload } from '../types'

const metrics = ref<MetricsPayload | null>(null)
const error = ref('')
const cpuHistory = ref<number[]>([])
const gpuHistory = ref<number[]>([])
let stream: EventSource | null = null

function clampPercent(value: number | undefined): number {
  if (value === undefined || Number.isNaN(value)) {
    return 0
  }
  return Math.max(0, Math.min(100, value))
}

function pushHistory(series: typeof cpuHistory, value: number) {
  const next = [...series.value, clampPercent(value)]
  series.value = next.slice(-30)
}

const workspace = computed(() => {
  if (!metrics.value || !('root' in metrics.value.workspace)) {
    return null
  }
  return metrics.value.workspace
})

const installedSuites = computed(() => metrics.value?.suites.filter((suite) => suite.installed) ?? [])
const gpuDevices = computed(() => metrics.value?.gpu?.devices ?? [])
const cpuOverall = computed(() => clampPercent(metrics.value?.cpu?.overall))
const gpuOverall = computed(() => {
  if (!gpuDevices.value.length) {
    return 0
  }
  return clampPercent(
    gpuDevices.value.reduce((total, device) => total + device.utilization, 0) / gpuDevices.value.length,
  )
})
const memory = computed(() => metrics.value?.memory ?? null)
const cpuCores = computed(() => metrics.value?.cpu?.cores ?? [])

const workspaceUsagePercent = computed(() => {
  if (!workspace.value?.total) {
    return 0
  }
  return clampPercent((workspace.value.used / workspace.value.total) * 100)
})

const workspaceUsageEntries = computed(() => {
  if (!workspace.value?.usages) {
    return []
  }

  const preferredOrder = ['backups', 'compose', 'config', 'dags', 'data', 'mlruns', 'models', 'notebooks', 'outputs']
  const entries = Object.entries(workspace.value.usages)
  const ranking = new Map(preferredOrder.map((name, index) => [name, index]))

  return entries
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
      percent: workspace.value?.total ? clampPercent((value / workspace.value.total) * 100) : 0,
    }))
})

const ramUsagePercent = computed(() => {
  if (!memory.value?.total || !memory.value?.used) {
    return 0
  }
  return clampPercent((memory.value.used / memory.value.total) * 100)
})

const gpuPrimary = computed(() => gpuDevices.value[0] ?? null)
const vramUsagePercent = computed(() => {
  if (!gpuPrimary.value?.memory_total || !gpuPrimary.value?.memory_used) {
    return 0
  }
  return clampPercent((gpuPrimary.value.memory_used / gpuPrimary.value.memory_total) * 100)
})

const swapUsagePercent = computed(() => {
  if (!memory.value?.swap_total || !memory.value?.swap_used) {
    return 0
  }
  return clampPercent((memory.value.swap_used / memory.value.swap_total) * 100)
})

function percentageText(value: number): string {
  return `${value.toFixed(1)}%`
}

function progressWidth(value: number): string {
  return `${clampPercent(value)}%`
}

function usageTone(value: number): string {
  if (value >= 80) {
    return 'var(--color-gold)'
  }
  if (value >= 50) {
    return 'var(--color-mid)'
  }
  return 'var(--color-deep)'
}

onMounted(() => {
  stream = new EventSource('/api/v1/metrics/stream')
  const handleMessage = (payload: MetricsPayload) => {
    metrics.value = payload
    error.value = ''
    pushHistory(cpuHistory, payload.cpu?.overall ?? 0)
    const devices = payload.gpu?.devices ?? []
    const gpuValue = devices.length
      ? devices.reduce((total, device) => total + device.utilization, 0) / devices.length
      : 0
    pushHistory(gpuHistory, gpuValue)
  }

  stream.addEventListener('metrics', (event) => {
    const message = event as MessageEvent<string>
    handleMessage(JSON.parse(message.data) as MetricsPayload)
  })
  stream.onmessage = (event) => {
    handleMessage(JSON.parse(event.data) as MetricsPayload)
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
  <section class="dashboard-grid">
    <article class="surface-panel surface-panel--hero dashboard-card card-span-4">
      <p class="eyebrow">Live</p>
      <h2>Machine state</h2>
      <p class="muted-copy">
        {{ error || 'Shared concave serve snapshot with workspace, suite, CPU, memory, and GPU telemetry.' }}
      </p>
    </article>

    <article class="surface-panel dashboard-card card-span-4" v-if="workspace">
      <p class="eyebrow">Workspace</p>
      <div class="metric-headline">
        <strong>{{ formatBytes(workspace.free) }} free</strong>
        <span>{{ formatBytes(workspace.total) }} total</span>
      </div>
      <p class="muted-copy">{{ workspace.root }}</p>
      <div class="usage-stack">
        <div class="usage-block">
          <div class="row-line">
            <span>Usage</span>
            <strong>{{ percentageText(workspaceUsagePercent) }}</strong>
          </div>
          <div class="progress-track workspace-progress">
            <div
              class="progress-fill progress-fill--accent"
              :style="{ width: progressWidth(workspaceUsagePercent), background: usageTone(workspaceUsagePercent) }"
            ></div>
          </div>
        </div>
        <div class="workspace-usage-list">
          <div v-for="entry in workspaceUsageEntries" :key="entry.name" class="workspace-usage-item">
            <div class="row-line workspace-usage-row">
              <span>{{ entry.name }}</span>
              <strong>{{ formatBytes(entry.value) }}</strong>
            </div>
            <div class="progress-track">
              <div
                class="progress-fill progress-fill--accent"
                :style="{ width: progressWidth(entry.percent), background: usageTone(entry.percent) }"
              ></div>
            </div>
          </div>
        </div>
      </div>
    </article>

    <article class="surface-panel dashboard-card card-span-4" v-if="metrics">
      <p class="eyebrow">Suites</p>
      <div class="metric-headline">
        <strong>{{ installedSuites.length }} installed</strong>
        <span>{{ metrics.suites.length }} defined</span>
      </div>
      <ul class="stack-list suite-overview-list">
        <li v-for="suite in metrics.suites" :key="suite.name" class="row-line">
          <strong>{{ suite.name }}</strong>
          <StatusBadge :value="suite.state" />
        </li>
      </ul>
    </article>

    <article class="surface-panel dashboard-card card-span-6">
      <div class="metric-panel-header">
        <div>
          <p class="eyebrow">CPU usage</p>
          <div class="metric-kicker">
            <AppIcon name="cpu" />
            <strong>{{ percentageText(cpuOverall) }}</strong>
          </div>
        </div>
        <span class="muted-copy">{{ cpuCores.length }} cores</span>
      </div>
      <MetricLineChart :values="cpuHistory" stroke="var(--color-mid)" fill="rgba(124, 58, 237, 0.16)" />
    </article>

    <article class="surface-panel dashboard-card card-span-6" v-if="gpuDevices.length">
      <div class="metric-panel-header">
        <div>
          <p class="eyebrow">GPU usage</p>
          <div class="metric-kicker">
            <AppIcon name="gpu" />
            <strong>{{ percentageText(gpuOverall) }}</strong>
          </div>
        </div>
        <span class="muted-copy">{{ gpuPrimary?.name }}</span>
      </div>
      <MetricLineChart :values="gpuHistory" stroke="var(--color-gold)" fill="rgba(249, 212, 78, 0.14)" />
    </article>

    <article class="surface-panel dashboard-card card-span-4">
      <p class="eyebrow">Memory</p>
      <div class="metric-headline">
        <strong>{{ formatBytes(memory?.used) }} / {{ formatBytes(memory?.total) }}</strong>
        <span>{{ percentageText(ramUsagePercent) }}</span>
      </div>
      <div class="usage-stack">
        <div class="usage-block">
          <div class="row-line">
            <span>RAM</span>
            <strong>{{ percentageText(ramUsagePercent) }}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill progress-fill--accent" :style="{ width: progressWidth(ramUsagePercent), background: usageTone(ramUsagePercent) }"></div>
          </div>
        </div>
        <div class="usage-block">
          <div class="row-line">
            <span>Swap</span>
            <strong>{{ percentageText(swapUsagePercent) }}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill progress-fill--gold" :style="{ width: progressWidth(swapUsagePercent) }"></div>
          </div>
        </div>
        <div class="usage-block" v-if="gpuPrimary">
          <div class="row-line">
            <span>VRAM</span>
            <strong>{{ formatMiB(gpuPrimary.memory_used) }} / {{ formatMiB(gpuPrimary.memory_total) }}</strong>
          </div>
          <div class="progress-track">
            <div class="progress-fill progress-fill--gold" :style="{ width: progressWidth(vramUsagePercent) }"></div>
          </div>
        </div>
      </div>
    </article>

    <article class="surface-panel dashboard-card card-span-8">
      <p class="eyebrow">CPU cores</p>
      <div class="core-grid">
        <div v-for="core in cpuCores" :key="core.name" class="core-card">
          <div class="row-line">
            <span>{{ core.name }}</span>
            <strong>{{ percentageText(clampPercent(core.utilization)) }}</strong>
          </div>
          <div class="progress-track">
            <div
              class="progress-fill progress-fill--accent"
              :style="{ width: progressWidth(core.utilization), background: usageTone(clampPercent(core.utilization)) }"
            ></div>
          </div>
        </div>
      </div>
    </article>
  </section>
</template>
