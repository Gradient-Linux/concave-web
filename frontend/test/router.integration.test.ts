import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises } from '@vue/test-utils'

import { router } from '../src/router'
import { pinia } from '../src/stores'
import { useAuthStore } from '../src/stores/auth'

const integration = process.env.CONCAVE_INTEGRATION === '1' ? describe : describe.skip

const session = {
  username: 'sandra',
  role: 'viewer',
  expires_at: '2026-03-26T00:00:00Z',
}

integration('router', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/api/v1/auth/me')) {
        return new Response(JSON.stringify(session), {
          status: 200,
          headers: { 'Content-Type': 'application/json' },
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    const auth = useAuthStore(pinia)
    auth.$reset()
  })

  afterEach(async () => {
    await router.replace('/dashboard').catch(() => undefined)
    vi.unstubAllGlobals()
  })

  it('redirects /doctor to /check', async () => {
    await router.push('/doctor')
    await flushPromises()

    expect(router.currentRoute.value.path).toBe('/check')
    expect(router.getRoutes().some((route) => route.path === '/doctor' && route.redirect === '/check')).toBe(true)
  })
})
