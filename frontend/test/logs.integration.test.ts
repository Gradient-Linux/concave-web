import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'

import LogsView from '../src/views/LogsView.vue'

const integration = process.env.CONCAVE_INTEGRATION === '1' ? describe : describe.skip

class MockWebSocket {
  static instances: MockWebSocket[] = []

  url: string
  readyState = 1
  onmessage: ((event: MessageEvent<string>) => void) | null = null
  onerror: ((event: Event) => void) | null = null
  onclose: ((event: Event) => void) | null = null
  onopen: ((event: Event) => void) | null = null

  constructor(url: string) {
    this.url = url
    MockWebSocket.instances.push(this)
    queueMicrotask(() => this.onopen?.(new Event('open')))
  }

  send() {}

  close() {
    this.readyState = 3
    this.onclose?.(new Event('close'))
  }

  emit(data: unknown) {
    this.onmessage?.(new MessageEvent('message', { data: JSON.stringify(data) }))
  }
}

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

integration('LogsView', () => {
  beforeEach(() => {
    MockWebSocket.instances = []
    vi.stubGlobal('fetch', vi.fn())
    vi.stubGlobal('WebSocket', MockWebSocket)
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('streams lines from the websocket contract', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockResolvedValue(
      json({
        suites: [
          {
            name: 'neural',
            installed: true,
            state: 'running',
            ports: [],
            containers: [
              {
                name: 'gradient-neural-lab',
                image: 'quay.io/jupyter/base-notebook:python-3.11.6',
                role: 'lab',
                status: 'running',
              },
            ],
            gpu_required: true,
            compose_exists: true,
          },
        ],
      }),
    )

    const wrapper = mount(LogsView, {
      global: {
        stubs: {
          TerminalPane: true,
        },
      },
    })

    await flushPromises()

    const socket = MockWebSocket.instances.at(-1)
    expect(socket).toBeTruthy()
    expect(socket?.url).toContain('container=gradient-neural-lab')
    expect(socket?.url).toContain('service=gradient-neural-lab')
    expect(socket?.url).toContain('lines=100')
    expect(socket?.url).toContain('follow=true')

    socket?.emit({ line: '[gradient-neural-lab] notebook ready' })
    await flushPromises()

    expect(wrapper.text()).toContain('notebook ready')

    socket?.emit({ error: 'suite not running' })
    await flushPromises()

    expect(wrapper.text()).toContain('suite not running')
  })
})
