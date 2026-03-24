<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import type { TeamSummary, TeamsResponse } from '../types'

const response = ref<TeamsResponse | null>(null)
const error = ref('')

const teams = computed<TeamSummary[]>(() => response.value?.teams ?? [])

async function load() {
  try {
    response.value = await api<TeamsResponse>('/api/v1/teams')
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load teams'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Teams</p>
      <h2>Compute groups and quota presets</h2>
      <p class="muted-copy">
        Team provisioning lands with the compute engine. This view is already wired to the API surface.
      </p>
      <p class="muted-copy" v-if="response?.available === false">
        {{ response.message }}
      </p>
    </article>

    <article class="surface-panel" v-for="team in teams" :key="team.name || team.preset || JSON.stringify(team)">
      <div class="row-line">
        <strong>{{ team.name || 'Unnamed team' }}</strong>
        <StatusBadge :value="team.preset || 'preset'" />
      </div>
      <div class="section-divider"></div>
      <div class="usage-stack">
        <div class="row-line">
          <span>Users</span>
          <strong>{{ team.user_count ?? team.users ?? '—' }}</strong>
        </div>
        <div class="row-line" v-if="team.cpu_quota">
          <span>CPU</span>
          <strong>{{ team.cpu_quota }}</strong>
        </div>
        <div class="row-line" v-if="team.ram_quota">
          <span>RAM</span>
          <strong>{{ team.ram_quota }}</strong>
        </div>
        <div class="row-line" v-if="team.gpu">
          <span>GPU</span>
          <strong>{{ team.gpu }}</strong>
        </div>
      </div>
    </article>

    <article class="surface-panel" v-if="!teams.length && !error">
      <p class="eyebrow">Teams</p>
      <h2>No teams provisioned yet</h2>
      <p class="muted-copy">{{ response?.message ?? 'The compute engine has not been configured.' }}</p>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
