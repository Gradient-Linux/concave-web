<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{ value: string }>()

const normalized = computed(() => props.value.trim().toLowerCase())

const tone = computed(() => {
  const v = normalized.value
  if (!v) return 'muted'
  if (v.includes('running') || v.includes('ok') || v.includes('healthy') || v.includes('active') || v.includes('pass') || v.includes('clean')) return 'success'
  if (v.includes('degraded') || v.includes('warn') || v.includes('skip') || v.includes('unconfigured') || v.includes('flag')) return 'warn'
  if (v.includes('stopped') || v.includes('failed') || v.includes('error') || v.includes('fail')) return 'error'
  if (v.includes('leave')) return 'error'
  if (v.includes('viewer') || v.includes('developer') || v.includes('operator') || v.includes('admin')) return 'role'
  if (v.includes('safe')) return 'muted'
  return 'muted'
})

const label = computed(() =>
  props.value
    .trim()
    .replace(/[-_]+/g, ' ')
    .replace(/\s+/g, ' '),
)
</script>

<template>
  <span class="status-badge" :class="`tone-${tone}`">{{ label }}</span>
</template>
