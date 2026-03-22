<script setup lang="ts">
import { computed, onBeforeUnmount, onMounted, ref, watch } from 'vue'

import StatusBadge from '../components/StatusBadge.vue'
import TerminalPane from '../components/terminal/TerminalPane.vue'
import { api, wsURL } from '../lib/api'
import type { SuiteSummary, SuitesResponse } from '../types'

const suites = ref<SuiteSummary[]>([])
const selectedSuite = ref('')
const selectedContainer = ref('')
const lines = ref<string[]>([])
const error = ref('')
const terminalOpen = ref(false)
const terminalEndpoint = ref('')

let socket: WebSocket | null = null

const containers = computed(() => suites.value.find((suite) => suite.name === selectedSuite.value)?.containers ?? [])

async function loadSuites() {
  try {
    const response = await api<SuitesResponse>('/api/v1/suites')
    suites.value = response.suites.filter((suite) => suite.installed)
    if (!selectedSuite.value && suites.value.length > 0) {
      selectedSuite.value = suites.value[0].name
    }
    if (!selectedContainer.value && containers.value.length > 0) {
      selectedContainer.value = containers.value[0].name
    }
  } catch (err) {
    error.value = err instanceof Error ? err.message : 'Failed to load logs'
  }
}

function connect() {
  socket?.close()
  lines.value = []
  if (!selectedSuite.value || !selectedContainer.value) {
    return
  }
  socket = new WebSocket(
    wsURL(`/api/v1/suites/${selectedSuite.value}/logs?container=${encodeURIComponent(selectedContainer.value)}`),
  )
  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data) as { type: string; line?: string }
    if (payload.type === 'line' && payload.line) {
      lines.value = [...lines.value.slice(-999), payload.line]
    }
  }
  socket.onerror = () => {
    error.value = 'Log stream disconnected'
  }
}

function openTerminal() {
  terminalEndpoint.value = `/api/v1/terminal/container/${selectedSuite.value}/${selectedContainer.value}`
  terminalOpen.value = true
}

function selectContainer(suiteName: string, containerName: string) {
  selectedSuite.value = suiteName
  selectedContainer.value = containerName
}

watch([selectedSuite, selectedContainer], () => {
  connect()
})

onMounted(async () => {
  await loadSuites()
  connect()
})

onBeforeUnmount(() => {
  socket?.close()
})
</script>

<template>
  <section class="two-column-layout">
    <article class="surface-panel">
      <p class="eyebrow">Containers</p>
      <div class="stack-list">
        <template v-for="suite in suites" :key="suite.name">
          <div class="section-label">{{ suite.name }}</div>
          <button
            v-for="container in suite.containers"
            :key="container.name"
            class="list-button"
            :class="{ 'is-selected': container.name === selectedContainer }"
            type="button"
            @click="selectContainer(suite.name, container.name)"
          >
            <div>
              <strong>{{ container.name }}</strong>
              <p class="mono-copy">{{ container.image }}</p>
            </div>
            <StatusBadge :value="container.status" />
          </button>
        </template>
      </div>
    </article>

    <article class="surface-panel">
      <div class="row-line">
        <div>
          <p class="eyebrow">Live logs</p>
          <h2>{{ selectedContainer || 'Select a container' }}</h2>
        </div>
        <button class="ghost-button" type="button" :disabled="!selectedContainer" @click="openTerminal">
          Terminal
        </button>
      </div>
      <pre class="console-block large">{{ lines.join('\n') || 'Waiting for log lines…' }}</pre>
    </article>

    <p v-if="error" class="error-copy">{{ error }}</p>

    <TerminalPane
      v-model="terminalOpen"
      :endpoint="terminalEndpoint"
      :title="selectedContainer || 'Container terminal'"
    />
  </section>
</template>
