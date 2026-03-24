<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatRelativeTime } from '../lib/format'
import type { EnvironmentDiffResponse, EnvironmentDriftReport, EnvironmentStatusResponse } from '../types'

const status = ref<EnvironmentStatusResponse | null>(null)
const reports = ref<EnvironmentDriftReport[]>([])
const error = ref('')

const summary = computed(() => {
  const items = status.value?.group_reports ?? []
  return {
    groups: items.length,
    flagged: items.filter((item) => !item.clean).length,
    snapshots: status.value?.snapshot_count ?? 0,
  }
})

async function load() {
  try {
    const [statusResponse, diffResponse] = await Promise.all([
      api<EnvironmentStatusResponse>('/api/v1/env/status'),
      api<EnvironmentDiffResponse>('/api/v1/env/diff'),
    ])
    status.value = statusResponse
    reports.value = diffResponse.reports ?? statusResponse.group_reports ?? []
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load environment state'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Environment</p>
      <h2>Resolver drift and baseline state</h2>
      <p class="muted-copy">
        Layer-3 package drift from concave-resolver, grouped by team baseline.
      </p>
      <div class="usage-stack" v-if="status?.available !== false">
        <div class="row-line">
          <span>Groups tracked</span>
          <strong>{{ summary.groups }}</strong>
        </div>
        <div class="row-line">
          <span>Flagged groups</span>
          <strong>{{ summary.flagged }}</strong>
        </div>
        <div class="row-line">
          <span>Snapshots</span>
          <strong>{{ summary.snapshots }}</strong>
        </div>
      </div>
      <p v-else class="muted-copy">{{ status?.message ?? 'Resolver not configured.' }}</p>
    </article>

    <article class="surface-panel" v-for="report in reports" :key="`${report.group}-${report.timestamp}`">
      <div class="row-line">
        <strong>{{ report.group }}</strong>
        <StatusBadge :value="report.clean ? 'clean' : `flag ${report.diffs.length}`" />
      </div>
      <p class="muted-copy">Last scan {{ formatRelativeTime(report.timestamp) }}</p>
      <div class="section-divider"></div>
      <div class="stack-list" v-if="report.diffs.length">
        <div class="table-row" v-for="diff in report.diffs.slice(0, 6)" :key="`${report.group}-${diff.name}`">
          <div>
            <strong>{{ diff.name }}</strong>
            <p class="muted-copy">{{ diff.baseline }} → {{ diff.current }}</p>
          </div>
          <StatusBadge :value="String(diff.tier)" />
        </div>
      </div>
      <p v-else class="muted-copy">No package drift detected.</p>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
