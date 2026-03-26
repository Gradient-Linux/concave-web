<script setup lang="ts">
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import type { CheckItem, CheckResponse } from '../types'

const checks = ref<CheckItem[]>([])
const error = ref('')

async function load() {
  try {
    const response = await api<CheckResponse>('/api/v1/check')
    checks.value = response.checks
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load check results'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Check</p>
      <h2>System health</h2>
      <p class="muted-copy">Independent checks from concave serve.</p>
    </article>

    <article class="surface-panel" v-for="check in checks" :key="check.name">
      <div class="row-line">
        <strong>{{ check.name }}</strong>
        <StatusBadge :value="check.status" />
      </div>
      <p class="muted-copy">{{ check.detail }}</p>
      <p v-if="check.recovery" class="mono-copy">Recovery: {{ check.recovery }}</p>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
