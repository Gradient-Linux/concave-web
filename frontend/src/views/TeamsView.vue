<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatRelativeTime } from '../lib/format'
import type { TeamSummary, TeamsResponse } from '../types'

const response = ref<TeamsResponse | null>(null)
const error = ref('')
const loadedAt = ref<Date | null>(null)

function textValue(value: unknown, fallback = '—'): string {
  if (typeof value === 'string' && value.trim()) {
    return value
  }
  if (typeof value === 'number' && Number.isFinite(value)) {
    return String(value)
  }
  return fallback
}

function userCount(team: TeamSummary): string {
  if (typeof team.user_count === 'number') {
    return String(team.user_count)
  }
  if (Array.isArray(team.users)) {
    return String(team.users.length)
  }
  if (typeof team.users === 'number' || typeof team.users === 'string') {
    return textValue(team.users)
  }
  return '—'
}

async function load() {
  try {
    response.value = await api<TeamsResponse>('/api/v1/teams')
    loadedAt.value = new Date()
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load teams'
  }
}

const teams = computed(() => response.value?.teams ?? [])
const available = computed(() => response.value?.available !== false)
const summaryLabel = computed(() => {
  if (!available.value) {
    return 'Team directory unavailable'
  }
  return teams.value.length === 1 ? '1 team configured' : `${teams.value.length} teams configured`
})
const detailLabel = computed(() => response.value?.message ?? 'Read-only team directory from concave serve.')

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel wide-panel">
      <div class="row-line">
        <div>
          <p class="eyebrow">Teams</p>
          <h2>{{ summaryLabel }}</h2>
          <p class="muted-copy">{{ detailLabel }}</p>
        </div>
        <StatusBadge :value="available ? 'available' : 'unavailable'" />
      </div>

      <div class="summary-strip">
        <div>
          <span class="summary-label">Returned teams</span>
          <strong>{{ teams.length }}</strong>
        </div>
        <div>
          <span class="summary-label">State</span>
          <strong>{{ available ? 'read only' : 'not configured' }}</strong>
        </div>
        <div>
          <span class="summary-label">Last refresh</span>
          <strong>{{ formatRelativeTime(loadedAt) }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel wide-panel" v-if="teams.length === 0">
      <p class="eyebrow">Directory</p>
      <strong>No teams returned yet</strong>
      <p class="muted-copy">{{ detailLabel }}</p>
    </article>

    <article
      v-for="team in teams"
      :key="textValue(team.name, JSON.stringify(team))"
      class="surface-panel"
    >
      <div class="row-line">
        <div>
          <p class="eyebrow">Team</p>
          <strong>{{ textValue(team.name, 'Unnamed team') }}</strong>
          <p class="muted-copy">{{ textValue(team.description) }}</p>
        </div>
        <StatusBadge :value="textValue(team.preset, 'unconfigured')" />
      </div>

      <div class="team-metrics">
        <div class="row-line">
          <span>Users</span>
          <strong>{{ userCount(team) }}</strong>
        </div>
        <div class="row-line">
          <span>CPU quota</span>
          <strong>{{ textValue(team.cpu_quota) }}</strong>
        </div>
        <div class="row-line">
          <span>RAM quota</span>
          <strong>{{ textValue(team.ram_quota) }}</strong>
        </div>
        <div class="row-line">
          <span>GPU</span>
          <strong>{{ textValue(team.gpu) }}</strong>
        </div>
      </div>
    </article>

    <p v-if="error" class="error-copy wide-panel">{{ error }}</p>
  </section>
</template>
