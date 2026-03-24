<script setup lang="ts">
import { onMounted } from 'vue'
import { RouterView, useRoute } from 'vue-router'

import GradientBackground from './components/GradientBackground.vue'
import AppShell from './components/layout/AppShell.vue'
import { useUIStore } from './stores/ui'

const route = useRoute()
const ui = useUIStore()

onMounted(() => {
  ui.hydrate()
})
</script>

<template>
  <GradientBackground />
  <div class="app-root">
    <RouterView v-slot="{ Component }">
      <component :is="Component" v-if="route.meta.public" />
      <AppShell v-else>
        <component :is="Component" />
      </AppShell>
    </RouterView>
  </div>
</template>
