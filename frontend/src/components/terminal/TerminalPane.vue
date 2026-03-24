<script setup lang="ts">
import { FitAddon } from '@xterm/addon-fit'
import { Terminal } from 'xterm'
import { onBeforeUnmount, onMounted, ref, watch } from 'vue'

import { wsURL } from '../../lib/api'
import { useUIStore } from '../../stores/ui'

const props = defineProps<{
  endpoint: string
  title: string
  modelValue: boolean
}>()

const emit = defineEmits<{
  'update:modelValue': [value: boolean]
}>()

const ui = useUIStore()
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

function terminalTheme(theme: 'dark' | 'light') {
  if (theme === 'light') {
    return {
      background: '#FFFFFF',
      foreground: '#1A1030',
      cursor: '#7B30C8',
      cursorAccent: '#FFFFFF',
      selectionBackground: 'rgba(123, 48, 200, 0.18)',
      black: '#1A1030',
      red: '#C8318A',
      green: '#2C8B57',
      yellow: '#D4880A',
      blue: '#7B30C8',
      magenta: '#C8318A',
      cyan: '#5C4A80',
      white: '#5C4A80',
      brightBlack: '#9880B8',
      brightWhite: '#1A1030',
    }
  }

  return {
    background: '#0D0A1A',
    foreground: '#F2EFFF',
    cursor: '#F5C842',
    cursorAccent: '#0D0A1A',
    selectionBackground: 'rgba(91, 0, 160, 0.32)',
    black: '#0A0814',
    red: '#FF5878',
    green: '#59D98C',
    yellow: '#F5C842',
    blue: '#5B00A0',
    magenta: '#D63CA0',
    cyan: '#9F93BF',
    white: '#F2EFFF',
    brightBlack: '#64597F',
    brightWhite: '#FFFFFF',
  }
}

function applyTerminalTheme() {
  if (!terminal) {
    return
  }
  terminal.options.theme = terminalTheme(ui.theme)
}

function connect() {
  if (!host.value || !props.modelValue) {
    return
  }
  terminal = new Terminal({
    theme: terminalTheme(ui.theme),
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

watch(
  () => ui.theme,
  () => {
    applyTerminalTheme()
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
