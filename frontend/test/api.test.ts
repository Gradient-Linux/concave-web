import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { APIError, api } from '../src/lib/api'

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

describe('api', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('sends credentials and parses json', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(json({ checks: [{ name: 'Docker', status: 'pass', detail: 'running' }] }))

    const response = await api<{ checks: Array<{ name: string }> }>('/api/v1/check')

    expect(fetchMock).toHaveBeenCalledWith(
      '/api/v1/check',
      expect.objectContaining({
        credentials: 'include',
        headers: expect.any(Headers),
      }),
    )
    expect(response.checks).toHaveLength(1)
    expect(response.checks[0].name).toBe('Docker')
  })

  it('raises APIError with backend error payload', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(json({ error: 'nope' }, 409))

    await expect(api('/api/v1/check')).rejects.toMatchObject({
      constructor: APIError,
      status: 409,
      message: 'nope',
    })
  })
})
