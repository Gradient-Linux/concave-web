<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatRelativeTime } from '../lib/format'
import type { FleetNodeInfo, FleetPeersResponse, FleetStatusResponse } from '../types'

const node = ref<FleetNodeInfo | null>(null)
const status = ref<FleetStatusResponse | null>(null)
const peers = ref<FleetNodeInfo[]>([])
const error = ref('')

let refreshHandle: number | null = null

function valueOrDash(value?: string | null): string {
  return value && value.trim() ? value : '—'
}

function suiteList(nodeInfo: FleetNodeInfo | null): string {
  const suites = nodeInfo?.installed_suites ?? []
  return suites.length ? suites.join(', ') : 'No suites reported'
}

function isAvailable(value: { available?: boolean } | null): boolean {
  return value?.available !== false
}

async function load() {
  const [nodeResult, statusResult, peersResult] = await Promise.allSettled([
    api<FleetNodeInfo>('/api/v1/node/status'),
    api<FleetStatusResponse>('/api/v1/fleet/status'),
    api<FleetPeersResponse>('/api/v1/fleet/peers'),
  ])

  node.value = nodeResult.status === 'fulfilled' ? nodeResult.value : null
  status.value = statusResult.status === 'fulfilled' ? statusResult.value : null
  peers.value =
    peersResult.status === 'fulfilled'
      ? peersResult.value.peers ?? []
      : statusResult.status === 'fulfilled'
        ? statusResult.value.peers ?? []
        : []

  const messages: string[] = []
  if (nodeResult.status === 'rejected') {
    messages.push(nodeResult.reason instanceof Error ? nodeResult.reason.message : 'Failed to load node status')
  }
  if (statusResult.status === 'rejected') {
    messages.push(statusResult.reason instanceof Error ? statusResult.reason.message : 'Failed to load fleet status')
  }
  if (peersResult.status === 'rejected') {
    messages.push(peersResult.reason instanceof Error ? peersResult.reason.message : 'Failed to load fleet peers')
  }
  error.value = messages.join(' · ')
}

const visiblePeers = computed(() => peers.value)
const visibleCount = computed(() => status.value?.count ?? visiblePeers.value.length)
const singleNodeMode = computed(() => visibleCount.value <= 1 && visiblePeers.value.length === 0)
const availabilityLabel = computed(() => (isAvailable(node.value) && isAvailable(status.value) ? 'available' : 'unavailable'))
const nodeVisibility = computed(() => valueOrDash(node.value?.visibility))
const nodeVersion = computed(() => valueOrDash(node.value?.gradient_version))
const nodeSuites = computed(() => suiteList(node.value))
const nodeResolver = computed(() => (node.value?.resolver_running ? 'running' : 'offline'))

async function refresh() {
  await load()
}

onMounted(async () => {
  await refresh()
  refreshHandle = window.setInterval(refresh, 10_000)
})

onBeforeUnmount(() => {
  if (refreshHandle !== null) {
    window.clearInterval(refreshHandle)
  }
})
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel wide-panel">
      <div class="row-line">
        <div>
          <p class="eyebrow">Fleet</p>
          <h2>{{ valueOrDash(node?.hostname) }}</h2>
          <p class="muted-copy">
            {{ valueOrDash(node?.address) }} · version {{ nodeVersion }} · visibility {{ nodeVisibility }}
          </p>
        </div>
        <StatusBadge :value="availabilityLabel" />
      </div>

      <div class="summary-strip">
        <div>
          <span class="summary-label">Visible peers</span>
          <strong>{{ visibleCount }}</strong>
        </div>
        <div>
          <span class="summary-label">Resolver</span>
          <strong>{{ nodeResolver }}</strong>
        </div>
        <div>
          <span class="summary-label">Last seen</span>
          <strong>{{ formatRelativeTime(node?.last_seen) }}</strong>
        </div>
        <div>
          <span class="summary-label">Suites</span>
          <strong>{{ nodeSuites }}</strong>
        </div>
      </div>

      <p class="muted-copy fleet-note">{{ status?.message || node?.message || 'Fleet visibility is served by concave serve.' }}</p>
    </article>

    <article class="surface-panel wide-panel" v-if="singleNodeMode">
      <p class="eyebrow">Peers</p>
      <strong>No peers visible - running in single node mode</strong>
      <p class="muted-copy">The mesh daemon has not exposed any remote nodes yet.</p>
    </article>

    <article class="surface-panel wide-panel" v-else-if="visiblePeers.length === 0">
      <p class="eyebrow">Peers</p>
      <strong>Fleet peers are unavailable</strong>
      <p class="muted-copy">{{ status?.message || node?.message || 'The backend returned an empty peer list.' }}</p>
    </article>

    <article class="surface-panel wide-panel" v-else>
      <p class="eyebrow">Peers</p>
      <div class="fleet-table">
        <div class="fleet-table__head">
          <span>Node</span>
          <span>Version</span>
          <span>Suites</span>
          <span>Resolver</span>
          <span>Last seen</span>
        </div>

        <div v-for="peer in visiblePeers" :key="`${peer.machine_id || peer.hostname}-${peer.address || peer.last_seen || ''}`" class="fleet-table__row">
          <div>
            <strong>{{ valueOrDash(peer.hostname) }}</strong>
            <p class="mono-copy">{{ valueOrDash(peer.address) }}</p>
          </div>
          <div class="fleet-table__cell">{{ valueOrDash(peer.gradient_version) }}</div>
          <div class="fleet-table__cell">{{ suiteList(peer) }}</div>
          <div class="fleet-table__cell">
            <StatusBadge :value="peer.resolver_running ? 'running' : 'offline'" />
          </div>
          <div class="fleet-table__cell">{{ formatRelativeTime(peer.last_seen) }}</div>
        </div>
      </div>
    </article>

    <p v-if="error" class="error-copy wide-panel">{{ error }}</p>
  </section>
</template>
