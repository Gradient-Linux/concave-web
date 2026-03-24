<script setup lang="ts">
import { computed } from 'vue'

const gradientId = `metric-fill-${Math.random().toString(36).slice(2, 10)}`

const props = withDefaults(
  defineProps<{
    values: number[]
    stroke?: string
    fill?: string
  }>(),
  {
    stroke: 'var(--color-mid)',
    fill: 'rgba(124, 58, 237, 0.16)',
  },
)

const width = 100
const height = 44

const normalized = computed(() => {
  const values = props.values.length ? props.values : [0]
  return values.map((v) => Math.max(0, Math.min(100, v)))
})

const polyline = computed(() => {
  const values = normalized.value
  if (values.length === 1) return `0,${height} ${width},${height}`
  return values
    .map((v, i) => {
      const x = (i / (values.length - 1)) * width
      const y = height - (v / 100) * height
      return `${x.toFixed(2)},${y.toFixed(2)}`
    })
    .join(' ')
})

const area = computed(() => `0,${height} ${polyline.value} ${width},${height}`)
</script>

<template>
  <div class="metric-chart">
    <svg viewBox="0 0 100 44" preserveAspectRatio="none">
      <g class="metric-chart__grid">
        <line x1="0" y1="0"  x2="100" y2="0" />
        <line x1="0" y1="11" x2="100" y2="11" />
        <line x1="0" y1="22" x2="100" y2="22" />
        <line x1="0" y1="33" x2="100" y2="33" />
        <line x1="0" y1="44" x2="100" y2="44" />
      </g>
      <g class="metric-chart__guide">
        <line x1="0" y1="0" x2="0" y2="44" />
        <line x1="25" y1="0" x2="25" y2="44" />
        <line x1="50" y1="0" x2="50" y2="44" />
        <line x1="75" y1="0" x2="75" y2="44" />
        <line x1="100" y1="0" x2="100" y2="44" />
      </g>
      <defs>
        <linearGradient :id="gradientId" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" :stop-color="fill" stop-opacity="0.9" />
          <stop offset="100%" :stop-color="fill" stop-opacity="0.03" />
        </linearGradient>
      </defs>
      <polygon
        :points="area"
        :fill="`url(#${gradientId})`"
        class="metric-chart__area"
      />
      <polyline :points="polyline" :stroke="stroke" class="metric-chart__line" />
    </svg>
    <div class="metric-chart__axis">
      <span>30s ago</span>
      <span>now</span>
    </div>
  </div>
</template>
