<script setup lang="ts">
import { RouterView, useRoute } from 'vue-router'

import AppShell from './components/layout/AppShell.vue'

const route = useRoute()
</script>

<template>
  <RouterView v-slot="{ Component }">
    <component :is="Component" v-if="route.meta.public" />
    <AppShell v-else>
      <component :is="Component" />
    </AppShell>
  </RouterView>
</template>
