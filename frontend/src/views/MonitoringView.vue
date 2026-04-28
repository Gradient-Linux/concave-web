<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, reactive, ref } from 'vue'
import { RouterLink } from 'vue-router'

import AppIcon from '../components/AppIcon.vue'
import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import {
  GRAFANA_BASE,
  PROMETHEUS_BASE,
  detectMonitoringSuites,
  firstVectorValue,
  probeMonitoring,
  promQuery,
} from '../lib/monitoring'
import type {
  MonitoringReachability,
  MonitoringSuiteHint,
  PromQLInstantResponse,
  SuitesResponse,
} from '../types'

type MetricCard = {
  id: string
  label: string
  query: string
  unit: 'percent' | 'count' | 'bytes' | 'raw'
  description: string
  value: number | null
  error: string
  loading: boolean
}

const reachability = ref<MonitoringReachability | null>(null)
const reachabilityError = ref('')
const suiteHints = ref<MonitoringSuiteHint[]>([])
const suiteError = ref('')
const iframeEnabled = ref(false)
const iframeKey = ref(0)

const cards = reactive<MetricCard[]>([
  {
    id: 'targets-up',
    label: 'Scrape targets up',
    query: 'count(up == 1)',
    unit: 'count',
    description: 'Number of Prometheus scrape targets reporting healthy',
    value: null,
    error: '',
    loading: false,
  },
  {
    id: 'targets-total',
    label: 'Scrape targets total',
    query: 'count(up)',
    unit: 'count',
    description: 'All scrape targets known to Prometheus',
    value: null,
    error: '',
    loading: false,
  },
  {
    id: 'cpu-busy',
    label: 'Node CPU busy',
    query: '100 - (avg by(instance) (rate(node_cpu_seconds_total{mode="idle"}[1m])) * 100)',
    unit: 'percent',
    description: 'Average CPU busy percentage across node_exporter instances',
    value: null,
    error: '',
    loading: false,
  },
  {
    id: 'mem-available',
    label: 'Node memory available',
    query: 'avg(node_memory_MemAvailable_bytes)',
    unit: 'bytes',
    description: 'Average available memory reported by node_exporter',
    value: null,
    error: '',
    loading: false,
  },
  {
    id: 'fs-free',
    label: 'Root filesystem free',
    query: 'avg(node_filesystem_avail_bytes{mountpoint="/"})',
    unit: 'bytes',
    description: 'Average free bytes on the root filesystem',
    value: null,
    error: '',
    loading: false,
  },
  {
    id: 'gpu-util',
    label: 'GPU utilization',
    query: 'avg(DCGM_FI_DEV_GPU_UTIL)',
    unit: 'percent',
    description: 'Average GPU utilization from DCGM exporter (if installed)',
    value: null,
    error: '',
    loading: false,
  },
])

let refreshTimer: number | null = null

const prometheusReachable = computed(() => reachability.value?.prometheus.reachable ?? false)
const grafanaReachable = computed(() => reachability.value?.grafana.reachable ?? false)
const anyMonitoringConfigured = computed(() => suiteHints.value.length > 0)
const grafanaHomeURL = `${GRAFANA_BASE}/`
const prometheusHomeURL = `${PROMETHEUS_BASE}/`
const grafanaKioskURL = `${GRAFANA_BASE}/?kiosk=tv`

function formatCardValue(card: MetricCard): string {
  if (card.loading && card.value === null) {
    return '—'
  }
  if (card.value === null) {
    return '—'
  }
  switch (card.unit) {
    case 'percent':
      return `${card.value.toFixed(1)}%`
    case 'count':
      return Number.isFinite(card.value) ? card.value.toFixed(0) : '—'
    case 'bytes':
      return formatBytes(card.value)
    default:
      return card.value.toFixed(2)
  }
}

function formatBytes(value: number): string {
  if (!Number.isFinite(value) || value <= 0) {
    return '—'
  }
  const units = ['B', 'KB', 'MB', 'GB', 'TB']
  let current = value
  let unit = 0
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024
    unit += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[unit]}`
}

async function refreshCards() {
  if (!prometheusReachable.value) {
    for (const card of cards) {
      card.error = 'Prometheus unreachable'
      card.value = null
    }
    return
  }

  await Promise.all(
    cards.map(async (card) => {
      card.loading = true
      try {
        const payload: PromQLInstantResponse = await promQuery(card.query)
        if (payload.status === 'error') {
          card.error = payload.error ?? 'PromQL error'
          card.value = null
          return
        }
        const value = firstVectorValue(payload)
        card.value = value
        card.error = value === null ? 'No samples' : ''
      } catch (err) {
        card.value = null
        card.error = err instanceof Error ? err.message : 'Query failed'
      } finally {
        card.loading = false
      }
    }),
  )
}

async function refreshReachability() {
  try {
    reachability.value = await probeMonitoring()
    reachabilityError.value = ''
  } catch (err) {
    reachabilityError.value = err instanceof Error ? err.message : 'Failed to probe monitoring services'
  }
}

async function loadSuites() {
  try {
    const response = await api<SuitesResponse>('/api/v1/suites')
    suiteHints.value = detectMonitoringSuites(response.suites)
    suiteError.value = ''
  } catch (err) {
    suiteError.value = err instanceof Error ? err.message : 'Failed to load suites'
  }
}

async function refresh() {
  await Promise.all([refreshReachability(), loadSuites()])
  await refreshCards()
}

function toggleIframe() {
  iframeEnabled.value = !iframeEnabled.value
  if (iframeEnabled.value) {
    iframeKey.value += 1
  }
}

onMounted(async () => {
  await refresh()
  refreshTimer = window.setInterval(refresh, 15_000)
})

onBeforeUnmount(() => {
  if (refreshTimer !== null) {
    window.clearInterval(refreshTimer)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Monitoring</p>
      <h2>Prometheus and Grafana</h2>
      <p class="muted-copy">
        Same-origin proxy to the Prometheus and Grafana instances bundled in the Flow and Forge suites.
        Live reachability and PromQL summaries refresh every 15 seconds.
      </p>
      <div class="summary-strip">
        <div>
          <span class="summary-label">Prometheus</span>
          <StatusBadge :value="prometheusReachable ? 'reachable' : 'unreachable'" />
        </div>
        <div>
          <span class="summary-label">Prometheus version</span>
          <strong>{{ reachability?.prometheus.version ?? '—' }}</strong>
        </div>
        <div>
          <span class="summary-label">Grafana</span>
          <StatusBadge :value="grafanaReachable ? 'reachable' : 'unreachable'" />
        </div>
        <div>
          <span class="summary-label">Grafana version</span>
          <strong>{{ reachability?.grafana.version ?? '—' }}</strong>
        </div>
      </div>
      <div class="action-row">
        <a class="primary-button" :href="prometheusHomeURL" target="_blank" rel="noopener">Open Prometheus</a>
        <a class="ghost-button" :href="grafanaHomeURL" target="_blank" rel="noopener">Open Grafana</a>
        <button class="ghost-button" type="button" @click="toggleIframe">
          {{ iframeEnabled ? 'Hide embedded Grafana' : 'Show embedded Grafana' }}
        </button>
      </div>
      <p v-if="reachabilityError" class="error-copy">{{ reachabilityError }}</p>
    </article>

    <article class="surface-panel" v-if="!anyMonitoringConfigured && !suiteError">
      <div class="settings-section-header">
        <div class="settings-icon-shell">
          <AppIcon name="suites" />
        </div>
        <div>
          <p class="eyebrow">Suite hint</p>
          <h3>No monitoring suite installed</h3>
        </div>
      </div>
      <p class="muted-copy">
        Prometheus and Grafana ship as part of the <strong>Flow</strong> suite and are optional components of
        <strong>Forge</strong>. Install one of those from the Suites page to enable the metrics pipeline.
      </p>
      <div class="action-row">
        <RouterLink to="/suites" class="ghost-button">Go to Suites</RouterLink>
      </div>
    </article>

    <article class="surface-panel" v-for="hint in suiteHints" :key="hint.suite">
      <div class="row-line">
        <strong>{{ hint.suite }}</strong>
        <StatusBadge :value="hint.state" />
      </div>
      <p class="muted-copy">Monitoring containers in this suite</p>
      <div class="section-divider"></div>
      <div class="stack-list">
        <div v-for="container in hint.containers" :key="container.name" class="table-row">
          <div>
            <strong>{{ container.name }}</strong>
            <p class="muted-copy">{{ container.role }}</p>
          </div>
          <StatusBadge :value="container.status" />
        </div>
      </div>
    </article>

    <article class="surface-panel" v-if="suiteError">
      <p class="eyebrow">Suites</p>
      <p class="error-copy">{{ suiteError }}</p>
    </article>

    <article class="surface-panel card-span-12">
      <div class="settings-section-header">
        <div class="settings-icon-shell">
          <AppIcon name="monitoring" />
        </div>
        <div>
          <p class="eyebrow">Live metrics</p>
          <h3>PromQL snapshot</h3>
        </div>
      </div>
      <div class="dashboard-grid">
        <article v-for="card in cards" :key="card.id" class="surface-panel dashboard-card card-span-4">
          <p class="eyebrow">{{ card.label }}</p>
          <div class="metric-headline">
            <strong>{{ formatCardValue(card) }}</strong>
            <span v-if="card.loading" class="muted-copy">refreshing</span>
          </div>
          <p class="muted-copy">{{ card.description }}</p>
          <p v-if="card.error" class="muted-copy">{{ card.error }}</p>
          <code class="mono-copy">{{ card.query }}</code>
        </article>
      </div>
    </article>

    <article class="surface-panel card-span-12" v-if="iframeEnabled && grafanaReachable">
      <div class="row-line">
        <p class="eyebrow">Embedded Grafana</p>
        <a class="ghost-button" :href="grafanaHomeURL" target="_blank" rel="noopener">Pop out</a>
      </div>
      <p class="muted-copy">
        Grafana is embedded via the same-origin <code class="mono-copy">{{ GRAFANA_BASE }}</code> proxy. If the iframe
        is blank, enable anonymous viewing or sign in by opening Grafana in a new tab.
      </p>
      <iframe
        :key="iframeKey"
        :src="grafanaKioskURL"
        title="Grafana"
        class="monitoring-iframe"
        sandbox="allow-same-origin allow-scripts allow-forms allow-popups"
      ></iframe>
    </article>
  </section>
</template>

<style scoped>
.monitoring-iframe {
  width: 100%;
  height: 640px;
  border: 0;
  background: var(--bg-2);
  margin-top: 12px;
}

.mono-copy {
  display: inline-block;
  font-family: 'JetBrains Mono', ui-monospace, monospace;
  font-size: 0.85em;
  color: var(--text-muted);
  word-break: break-all;
}

code.mono-copy {
  display: block;
  margin-top: 6px;
}
</style>
