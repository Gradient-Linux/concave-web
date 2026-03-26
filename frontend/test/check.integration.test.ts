import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import CheckView from '../src/views/CheckView.vue'

const integration = process.env.CONCAVE_INTEGRATION === '1' ? describe : describe.skip

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

integration('CheckView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders checks from concave serve', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      json({
        checks: [
          { name: 'Docker', status: 'pass', detail: 'running (27.0)' },
          { name: 'GPU', status: 'warn', detail: 'no GPU detected', recovery: 'install drivers' },
        ],
      }),
    )

    const wrapper = mount(CheckView)
    await flushPromises()

    expect(fetchMock).toHaveBeenCalledWith('/api/v1/check', expect.any(Object))
    expect(wrapper.text()).toContain('Check')
    expect(wrapper.text()).toContain('Docker')
    expect(wrapper.text()).toContain('no GPU detected')
    expect(wrapper.text()).not.toContain('Doctor')
  })
})
