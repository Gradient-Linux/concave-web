<script setup lang="ts">
defineProps<{
  name: string
}>()
</script>

<template>
  <svg class="app-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">
    <template v-if="name === 'dashboard'">
      <rect x="3.5" y="3.5" width="7" height="7" rx="1.5" />
      <rect x="13.5" y="3.5" width="7" height="4" rx="1.5" />
      <rect x="13.5" y="10.5" width="7" height="10" rx="1.5" />
      <rect x="3.5" y="13.5" width="7" height="7" rx="1.5" />
    </template>
    <template v-else-if="name === 'suites'">
      <path d="M6 7h12" />
      <path d="M6 12h12" />
      <path d="M6 17h12" />
      <circle cx="4" cy="7" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="12" r="1" fill="currentColor" stroke="none" />
      <circle cx="4" cy="17" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'logs'">
      <path d="M6 5h12a2 2 0 0 1 2 2v10a2 2 0 0 1-2 2H9l-5 3V7a2 2 0 0 1 2-2Z" />
      <path d="M8 10h8" />
      <path d="M8 14h6" />
    </template>
    <template v-else-if="name === 'workspace'">
      <path d="M3 8.5h7l2 2H21v7a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
      <path d="M3 8.5v-2A2.5 2.5 0 0 1 5.5 4H10l2 2h6.5A2.5 2.5 0 0 1 21 8.5" />
    </template>
    <template v-else-if="name === 'doctor'">
      <path d="M12 3v18" />
      <path d="M7 8h10" />
      <path d="m8 16 1.8-5 2.2 3 1.8-4 2.2 6" />
    </template>
    <template v-else-if="name === 'users'">
      <path d="M16.5 21v-2a3.5 3.5 0 0 0-3.5-3.5h-2A3.5 3.5 0 0 0 7.5 19v2" />
      <circle cx="12" cy="8.5" r="3.5" />
      <path d="M19 21v-2a2.5 2.5 0 0 0-2-2.45" />
      <path d="M17 5.5a3 3 0 0 1 0 6" />
    </template>
    <template v-else-if="name === 'system'">
      <rect x="3.5" y="5" width="17" height="11" rx="2" />
      <path d="M8 20h8" />
      <path d="M12 16v4" />
    </template>
    <template v-else-if="name === 'settings'">
      <circle cx="12" cy="12" r="3" />
      <path d="M19.4 15a1 1 0 0 0 .2 1.1l.1.1a1.5 1.5 0 0 1-2.1 2.1l-.1-.1a1 1 0 0 0-1.1-.2 1 1 0 0 0-.6.9V19a1.5 1.5 0 0 1-3 0v-.2a1 1 0 0 0-.7-.9 1 1 0 0 0-1.1.2l-.1.1a1.5 1.5 0 0 1-2.1-2.1l.1-.1a1 1 0 0 0 .2-1.1 1 1 0 0 0-.9-.6H5a1.5 1.5 0 0 1 0-3h.2a1 1 0 0 0 .9-.7 1 1 0 0 0-.2-1.1l-.1-.1a1.5 1.5 0 1 1 2.1-2.1l.1.1a1 1 0 0 0 1.1.2 1 1 0 0 0 .6-.9V5a1.5 1.5 0 0 1 3 0v.2a1 1 0 0 0 .7.9 1 1 0 0 0 1.1-.2l.1-.1a1.5 1.5 0 1 1 2.1 2.1l-.1.1a1 1 0 0 0-.2 1.1 1 1 0 0 0 .9.6H19a1.5 1.5 0 0 1 0 3h-.2a1 1 0 0 0-.9.7" />
    </template>
    <template v-else-if="name === 'collapse'">
      <path d="m15 6-6 6 6 6" />
    </template>
    <template v-else-if="name === 'expand'">
      <path d="m9 6 6 6-6 6" />
    </template>
    <template v-else-if="name === 'moon'">
      <path d="M20 14.5A7.5 7.5 0 0 1 9.5 4 8 8 0 1 0 20 14.5Z" />
    </template>
    <template v-else-if="name === 'sun'">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2.5v2.2" />
      <path d="M12 19.3v2.2" />
      <path d="m4.9 4.9 1.5 1.5" />
      <path d="m17.6 17.6 1.5 1.5" />
      <path d="M2.5 12h2.2" />
      <path d="M19.3 12h2.2" />
      <path d="m4.9 19.1 1.5-1.5" />
      <path d="m17.6 6.4 1.5-1.5" />
    </template>
    <template v-else-if="name === 'server'">
      <rect x="4" y="4" width="16" height="6" rx="2" />
      <rect x="4" y="14" width="16" height="6" rx="2" />
      <path d="M8 7h.01" />
      <path d="M8 17h.01" />
      <path d="M12 7h5" />
      <path d="M12 17h5" />
    </template>
    <template v-else-if="name === 'palette'">
      <path d="M12 3a9 9 0 1 0 0 18h1.5a1.5 1.5 0 0 0 0-3H12a2 2 0 0 1 0-4h4a5 5 0 0 0 0-10Z" />
      <circle cx="7.5" cy="11" r="1" fill="currentColor" stroke="none" />
      <circle cx="9.5" cy="7.5" r="1" fill="currentColor" stroke="none" />
      <circle cx="14" cy="7" r="1" fill="currentColor" stroke="none" />
    </template>
    <template v-else-if="name === 'terminal'">
      <path d="m6 8 4 4-4 4" />
      <path d="M13 16h5" />
    </template>
    <template v-else-if="name === 'logout'">
      <path d="M15 17l5-5-5-5" />
      <path d="M20 12H9" />
      <path d="M12 20H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h6" />
    </template>
    <template v-else-if="name === 'cpu'">
      <rect x="7" y="7" width="10" height="10" rx="2" />
      <path d="M9 1.5v3" />
      <path d="M15 1.5v3" />
      <path d="M9 19.5v3" />
      <path d="M15 19.5v3" />
      <path d="M1.5 9h3" />
      <path d="M1.5 15h3" />
      <path d="M19.5 9h3" />
      <path d="M19.5 15h3" />
    </template>
    <template v-else-if="name === 'gpu'">
      <rect x="4" y="6" width="16" height="10" rx="2" />
      <path d="M8 18v2" />
      <path d="M16 18v2" />
      <path d="M8 10h4" />
      <path d="M15 10h1" />
      <path d="M8 13h8" />
    </template>
    <template v-else-if="name === 'memory'">
      <rect x="3.5" y="7" width="17" height="10" rx="2" />
      <path d="M7 10v4" />
      <path d="M10 10v4" />
      <path d="M13 10v4" />
      <path d="M16 10v4" />
    </template>
  </svg>
</template>
