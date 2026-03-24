<script setup lang="ts">
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatRelativeTime } from '../lib/format'
import type { FleetNodeInfo, FleetPeersResponse, FleetStatusResponse } from '../types'

const node = ref<FleetNodeInfo | null>(null)
const peers = ref<FleetNodeInfo[]>([])
const meta = ref<FleetStatusResponse | null>(null)
const error = ref('')

async function load() {
  try {
    const [nodeResponse, fleetResponse, peersResponse] = await Promise.all([
      api<FleetNodeInfo>('/api/v1/node/status'),
      api<FleetStatusResponse>('/api/v1/fleet/status'),
      api<FleetPeersResponse>('/api/v1/fleet/peers'),
    ])
    node.value = nodeResponse
    meta.value = fleetResponse
    peers.value = peersResponse.peers ?? fleetResponse.peers ?? []
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load fleet state'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Fleet</p>
      <h2>Local node and visible peers</h2>
      <p class="muted-copy">
        gradient-mesh publishes LAN visibility and peer discovery over the local socket.
      </p>
      <div class="usage-stack" v-if="node?.available !== false">
        <div class="row-line">
          <span>Hostname</span>
          <strong>{{ node?.hostname ?? '—' }}</strong>
        </div>
        <div class="row-line">
          <span>Visibility</span>
          <StatusBadge :value="node?.visibility ?? 'unknown'" />
        </div>
        <div class="row-line">
          <span>Peers visible</span>
          <strong>{{ meta?.count ?? peers.length }}</strong>
        </div>
      </div>
      <p v-else class="muted-copy">{{ node?.message ?? meta?.message ?? 'Mesh not configured.' }}</p>
    </article>

    <article class="surface-panel" v-for="peer in peers" :key="peer.machine_id || peer.hostname">
      <div class="row-line">
        <strong>{{ peer.hostname || 'Unknown peer' }}</strong>
        <StatusBadge :value="peer.visibility || 'unknown'" />
      </div>
      <p class="muted-copy">{{ peer.address || 'No advertised address' }}</p>
      <div class="section-divider"></div>
      <div class="usage-stack">
        <div class="row-line">
          <span>Resolver</span>
          <StatusBadge :value="peer.resolver_running ? 'running' : 'stopped'" />
        </div>
        <div class="row-line">
          <span>Last seen</span>
          <strong>{{ formatRelativeTime(peer.last_seen) }}</strong>
        </div>
        <div class="row-line" v-if="peer.installed_suites?.length">
          <span>Suites</span>
          <strong>{{ peer.installed_suites.join(', ') }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel" v-if="!peers.length && !error">
      <p class="eyebrow">Peers</p>
      <h2>No visible peers</h2>
      <p class="muted-copy">Single-node setups are valid. Hidden nodes do not appear here.</p>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
