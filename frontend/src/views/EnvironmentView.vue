<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatRelativeTime } from '../lib/format'
import type { EnvironmentDiffResponse, EnvironmentDriftReport, EnvironmentStatusResponse } from '../types'

const status = ref<EnvironmentStatusResponse | null>(null)
const diff = ref<EnvironmentDiffResponse | null>(null)
const error = ref('')

function normalizeTier(tier: number | string | undefined): 'safe' | 'flag' | 'leave' {
  if (tier === 0 || tier === '0' || tier === 'safe') {
    return 'safe'
  }
  if (tier === 1 || tier === '1' || tier === 'flag') {
    return 'flag'
  }
  if (tier === 2 || tier === '2' || tier === 'leave') {
    return 'leave'
  }
  return 'safe'
}

function tierLabel(tier: number | string | undefined): string {
  return normalizeTier(tier)
}

function tierDetail(tier: number | string | undefined): string {
  switch (normalizeTier(tier)) {
    case 'leave':
      return 'CUDA-adjacent or major divergence'
    case 'flag':
      return 'Manual review recommended'
    case 'safe':
    default:
      return 'Safe to auto-update'
  }
}

function sortReports(reports: EnvironmentDriftReport[]): EnvironmentDriftReport[] {
  return [...reports].sort((left, right) => {
    const leftTime = new Date(left.timestamp).getTime()
    const rightTime = new Date(right.timestamp).getTime()
    return rightTime - leftTime
  })
}

const reports = computed(() => sortReports(diff.value?.reports ?? status.value?.group_reports ?? []))
const available = computed(() => status.value?.available !== false && diff.value?.available !== false)
const lastScan = computed(() => status.value?.last_scan ?? reports.value[0]?.timestamp ?? null)
const snapshotCount = computed(() => status.value?.snapshot_count ?? 0)
const cleanReports = computed(() => reports.value.filter((report) => report.clean).length)
const totalDiffs = computed(() => reports.value.reduce((sum, report) => sum + report.diffs.length, 0))
const statusMessage = computed(() => status.value?.message ?? diff.value?.message ?? 'Drift snapshots from concave serve.')

async function load() {
  const [statusResult, diffResult] = await Promise.allSettled([
    api<EnvironmentStatusResponse>('/api/v1/env/status'),
    api<EnvironmentDiffResponse>('/api/v1/env/diff'),
  ])

  status.value = statusResult.status === 'fulfilled' ? statusResult.value : null
  diff.value = diffResult.status === 'fulfilled' ? diffResult.value : null

  const messages: string[] = []
  if (statusResult.status === 'rejected') {
    messages.push(statusResult.reason instanceof Error ? statusResult.reason.message : 'Failed to load environment status')
  }
  if (diffResult.status === 'rejected') {
    messages.push(diffResult.reason instanceof Error ? diffResult.reason.message : 'Failed to load environment drift')
  }
  error.value = messages.join(' · ')
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel wide-panel">
      <div class="row-line">
        <div>
          <p class="eyebrow">Environment</p>
          <h2>Drift and resolver status</h2>
          <p class="muted-copy">{{ statusMessage }}</p>
        </div>
        <StatusBadge :value="available ? 'available' : 'unavailable'" />
      </div>

      <div class="summary-strip">
        <div>
          <span class="summary-label">Reports</span>
          <strong>{{ reports.length }}</strong>
        </div>
        <div>
          <span class="summary-label">Clean</span>
          <strong>{{ cleanReports }}</strong>
        </div>
        <div>
          <span class="summary-label">Drifted packages</span>
          <strong>{{ totalDiffs }}</strong>
        </div>
        <div>
          <span class="summary-label">Last scan</span>
          <strong>{{ formatRelativeTime(lastScan) }}</strong>
        </div>
      </div>

      <div class="row-line environment-meta">
        <span class="muted-copy">Snapshots: {{ snapshotCount }}</span>
        <span class="muted-copy" v-if="status?.socket_path">{{ status.socket_path }}</span>
      </div>
    </article>

    <article class="surface-panel wide-panel" v-if="reports.length === 0">
      <p class="eyebrow">Status</p>
      <strong>{{ available ? 'No drift reports yet' : 'Resolver unavailable' }}</strong>
      <p class="muted-copy">
        {{ available ? 'The backend has not returned any group drift snapshots yet.' : (statusMessage || 'The resolver daemon is not configured.') }}
      </p>
    </article>

    <article
      v-for="report in reports"
      :key="`${report.group}-${report.user || 'group'}-${report.timestamp}`"
      class="surface-panel"
    >
      <div class="row-line">
        <div>
          <p class="eyebrow">Drift report</p>
          <strong>{{ report.group }}</strong>
          <p class="muted-copy">{{ report.user || 'Group snapshot' }} · {{ formatRelativeTime(report.timestamp) }}</p>
        </div>
        <StatusBadge :value="report.clean ? 'clean' : `${report.diffs.length} drift`" />
      </div>

      <div v-if="report.diffs.length === 0" class="empty-state">
        <p class="muted-copy">No package drift detected.</p>
      </div>

      <div v-else class="stack-list report-list">
        <div v-for="pkg in report.diffs" :key="pkg.name" class="report-row">
          <div class="report-row__main">
            <strong>{{ pkg.name }}</strong>
            <p class="mono-copy">{{ pkg.baseline }} → {{ pkg.current }}</p>
            <p class="muted-copy">{{ pkg.reason }}</p>
          </div>
          <div class="report-row__meta">
            <StatusBadge :value="tierLabel(pkg.tier)" :title="tierDetail(pkg.tier)" />
            <span class="muted-copy">{{ tierDetail(pkg.tier) }}</span>
          </div>
        </div>
      </div>
    </article>

    <p v-if="error" class="error-copy wide-panel">{{ error }}</p>
  </section>
</template>
