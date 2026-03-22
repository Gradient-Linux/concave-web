<script setup lang="ts">
import { reactive } from 'vue'
import { useRouter } from 'vue-router'

import { useAuthStore } from '../stores/auth'

const router = useRouter()
const auth = useAuthStore()
const form = reactive({
  username: '',
  password: '',
})

async function submit() {
  try {
    await auth.login(form)
    await router.push(auth.homeRoute())
  } catch {
    // handled in store
  }
}
</script>

<template>
  <main class="login-shell">
    <section class="login-panel">
      <p class="brand-mark">gradient</p>
      <h1>concave web</h1>
      <p class="muted-copy">Authenticate against concave serve and enter the machine control plane.</p>

      <form class="form-stack" @submit.prevent="submit">
        <label>
          <span>Username</span>
          <input v-model="form.username" type="text" autocomplete="username" required />
        </label>
        <label>
          <span>Password</span>
          <input v-model="form.password" type="password" autocomplete="current-password" required />
        </label>
        <button class="primary-button" type="submit" :disabled="auth.loading">
          {{ auth.loading ? 'Signing in…' : 'Sign in' }}
        </button>
        <p v-if="auth.error" class="error-copy">{{ auth.error }}</p>
      </form>
    </section>
  </main>
</template>
