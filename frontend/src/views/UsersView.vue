<script setup lang="ts">
import { onMounted, ref } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import { api } from '../lib/api'
import { formatMiB } from '../lib/format'
import type { UsersActivityResponse } from '../types'

const users = ref<UsersActivityResponse['users']>([])
const error = ref('')

async function load() {
  try {
    const response = await api<UsersActivityResponse>('/api/v1/users/activity')
    users.value = response.users
    error.value = ''
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load user activity'
  }
}

onMounted(load)
</script>

<template>
  <section class="page-grid">
    <article class="surface-panel hero-panel">
      <p class="eyebrow">Users</p>
      <h2>Per-user activity</h2>
      <p class="muted-copy">Containers and approximate GPU usage grouped by authenticated owner label.</p>
    </article>

    <article class="surface-panel" v-for="user in users" :key="user.username">
      <div class="row-line">
        <strong>{{ user.username }}</strong>
        <StatusBadge :value="user.role" />
      </div>
      <p class="muted-copy">GPU: {{ formatMiB(user.gpu_memory_mib) }}</p>
      <ul class="stack-list">
        <li v-for="container in user.containers" :key="container.name" class="row-line">
          <span>{{ container.name }}</span>
          <StatusBadge :value="container.status" />
        </li>
      </ul>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>
  </section>
</template>
