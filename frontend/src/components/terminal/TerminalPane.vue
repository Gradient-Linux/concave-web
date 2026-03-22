<script setup lang="ts">
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from 'xterm'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { wsURL } from '../../lib/api'

const props = defineProps<{
  endpoint: string
  title: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const host = ref<HTMLDivElement | null>(null)
let terminal: Terminal | null = null
let fitAddon: FitAddon | null = null
let socket: WebSocket | null = null

function close() {
  emit('update:modelValue', false)
}

function teardown() {
  socket?.close()
  socket = null
  terminal?.dispose()
  terminal = null
  fitAddon = null
}

function connect() {
  if (!host.value || !props.modelValue) {
    return
  }
  terminal = new Terminal({
    theme: {
      background: '#0f0f1a',
      foreground: '#f4f0ff',
      cursor: '#F9D44E',
      selectionBackground: '#401079',
    },
    fontFamily: 'JetBrains Mono, monospace',
    fontSize: 13,
  })
  fitAddon = new FitAddon()
  terminal.loadAddon(fitAddon)
  terminal.open(host.value)
  fitAddon.fit()

  socket = new WebSocket(wsURL(props.endpoint))
  socket.onopen = () => {
    fitAddon?.fit()
    socket?.send(JSON.stringify({ type: 'resize', rows: terminal?.rows, cols: terminal?.cols }))
  }
  socket.onmessage = (event) => {
    const payload = JSON.parse(event.data) as { type: string; data?: string; line?: string }
    if (payload.type === 'data' && payload.data) {
      terminal?.write(payload.data)
    }
    if (payload.type === 'line' && payload.line) {
      terminal?.writeln(payload.line)
    }
    if (payload.type === 'error' && payload.data) {
      terminal?.writeln(`\r\n${payload.data}`)
    }
  }
  socket.onclose = () => {
    terminal?.writeln('\r\n[session closed]')
  }

  terminal.onData((data) => {
    socket?.send(JSON.stringify({ type: 'data', data }))
  })

  window.addEventListener('resize', resize)
}

function resize() {
  if (!socket || !terminal || !fitAddon) {
    return
  }
  fitAddon.fit()
  socket.send(JSON.stringify({ type: 'resize', rows: terminal.rows, cols: terminal.cols }))
}

watch(
  () => props.modelValue,
  (value) => {
    teardown()
    if (value) {
      requestAnimationFrame(connect)
    }
  },
)

onMounted(() => {
  if (props.modelValue) {
    connect()
  }
})

onBeforeUnmount(() => {
  window.removeEventListener('resize', resize)
  teardown()
})
</script>

<template>
  <div v-if="modelValue" class="terminal-overlay" @click.self="close">
    <section class="terminal-panel">
      <header class="terminal-header">
        <div>
          <p class="eyebrow">Terminal</p>
          <h2>{{ title }}</h2>
        </div>
        <button class="ghost-button" type="button" @click="close">Close</button>
      </header>
      <div ref="host" class="terminal-host"></div>
    </section>
  </div>
</template>
