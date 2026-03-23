<script setup lang="ts">
import { computed } from 'vue'

const props = withDefaults(
  defineProps<{
    values: number[]
    stroke?: string
    fill?: string
  }>(),
  {
    stroke: 'var(--chart-accent)',
    fill: 'var(--chart-fill)',
  },
)

const width = 100
const height = 44

const normalized = computed(() => {
  const values = props.values.length ? props.values : [0]
  return values.map((value) => Math.max(0, Math.min(100, value)))
})

const polyline = computed(() => {
  const values = normalized.value
  if (values.length === 1) {
    return `0,${height} ${width},${height}`
  }
  return values
    .map((value, index) => {
      const x = (index / (values.length - 1)) * width
      const y = height - (value / 100) * height
      return `${x},${y}`
    })
    .join(' ')
})

const area = computed(() => {
  const line = polyline.value
  return `0,${height} ${line} ${width},${height}`
})
</script>

<template>
  <div class="metric-chart">
    <svg viewBox="0 0 100 44" preserveAspectRatio="none">
      <g class="metric-chart__grid">
        <line x1="0" y1="0" x2="100" y2="0" />
        <line x1="0" y1="11" x2="100" y2="11" />
        <line x1="0" y1="22" x2="100" y2="22" />
        <line x1="0" y1="33" x2="100" y2="33" />
        <line x1="0" y1="44" x2="100" y2="44" />
      </g>
      <polygon :points="area" :fill="fill" class="metric-chart__area" />
      <polyline :points="polyline" :stroke="stroke" class="metric-chart__line" />
    </svg>
    <div class="metric-chart__axis">
      <span>30s</span>
      <span>now</span>
    </div>
  </div>
</template>
