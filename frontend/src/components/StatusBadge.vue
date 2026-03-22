<script setup lang="ts">
import { computed } from 'vue'

const props = defineProps<{
  value: string
}>()

const tone = computed(() => {
  const value = props.value.toLowerCase()
  if (value.includes('running') || value.includes('ok') || value.includes('healthy') || value.includes('active')) {
    return 'success'
  }
  if (value.includes('degraded') || value.includes('warn')) {
    return 'warn'
  }
  if (value.includes('stopped') || value.includes('failed') || value.includes('error') || value.includes('unconfigured')) {
    return 'error'
  }
  return 'muted'
})
</script>

<template>
  <span class="status-badge" :class="`tone-${tone}`">{{ value }}</span>
</template>
