import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import { flushPromises, mount } from '@vue/test-utils'
import { createMemoryHistory, createRouter } from 'vue-router'

import MonitoringView from '../src/views/MonitoringView.vue'
import { detectMonitoringSuites, firstVectorValue } from '../src/lib/monitoring'
import type { PromQLInstantResponse, SuiteSummary } from '../src/types'

const integration = process.env.CONCAVE_INTEGRATION === '1' ? describe : describe.skip

const json = (body: unknown, status = 200) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { 'Content-Type': 'application/json' },
  })

const routerStub = createRouter({
  history: createMemoryHistory(),
  routes: [
    { path: '/', component: { template: '<div />' } },
    { path: '/suites', component: { template: '<div />' } },
    { path: '/monitoring', component: MonitoringView },
  ],
})

describe('monitoring helpers', () => {
  it('firstVectorValue returns the numeric value of a scalar-like vector sample', () => {
    const payload: PromQLInstantResponse = {
      status: 'success',
      data: {
        resultType: 'vector',
        result: [{ metric: {}, value: [1711376000, '42.5'] }],
      },
    }
    expect(firstVectorValue(payload)).toBe(42.5)
  })

  it('firstVectorValue returns null when Prometheus returned an error', () => {
    const payload: PromQLInstantResponse = { status: 'error', error: 'boom' }
    expect(firstVectorValue(payload)).toBeNull()
  })

  it('firstVectorValue returns null when the result set is empty', () => {
    const payload: PromQLInstantResponse = {
      status: 'success',
      data: { resultType: 'vector', result: [] },
    }
    expect(firstVectorValue(payload)).toBeNull()
  })

  it('detectMonitoringSuites surfaces suites that contain prometheus or grafana containers', () => {
    const suites: SuiteSummary[] = [
      {
        name: 'boosting',
        installed: true,
        state: 'running',
        ports: [],
        containers: [{ name: 'gradient-boost-core', image: 'python:3.12-slim', role: 'Core ML stack', status: 'running' }],
        gpu_required: false,
        compose_exists: true,
      },
      {
        name: 'flow',
        installed: true,
        state: 'running',
        ports: [],
        containers: [
          { name: 'gradient-flow-prometheus', image: 'prom/prometheus:v2.51.0', role: 'Metrics', status: 'running' },
          { name: 'gradient-flow-grafana', image: 'grafana/grafana:10.4.0', role: 'Dashboards', status: 'running' },
        ],
        gpu_required: false,
        compose_exists: true,
      },
    ]
    const hints = detectMonitoringSuites(suites)
    expect(hints).toHaveLength(1)
    expect(hints[0].suite).toBe('flow')
    expect(hints[0].containers).toHaveLength(2)
  })
})

integration('MonitoringView', () => {
  beforeEach(() => {
    vi.stubGlobal('fetch', vi.fn())
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('renders reachability cards and live PromQL values', async () => {
    const fetchMock = vi.mocked(fetch)
    fetchMock.mockImplementation(async (input) => {
      const url = typeof input === 'string' ? input : input.toString()
      if (url.endsWith('/monitoring/prometheus/-/healthy')) {
        return new Response('Prometheus is healthy.', { status: 200 })
      }
      if (url.endsWith('/monitoring/prometheus/api/v1/status/buildinfo')) {
        return json({ status: 'success', data: { version: '2.51.0' } })
      }
      if (url.endsWith('/monitoring/grafana/api/health')) {
        return json({ database: 'ok', version: '10.4.0' })
      }
      if (url.includes('/monitoring/prometheus/api/v1/query')) {
        return json({
          status: 'success',
          data: {
            resultType: 'vector',
            result: [{ metric: {}, value: [Date.now() / 1000, '3'] }],
          },
        })
      }
      if (url.endsWith('/api/v1/suites')) {
        return json({
          suites: [
            {
              name: 'flow',
              installed: true,
              state: 'running',
              ports: [],
              containers: [
                { name: 'gradient-flow-prometheus', image: 'prom/prometheus:v2.51.0', role: 'Metrics', status: 'running' },
                { name: 'gradient-flow-grafana', image: 'grafana/grafana:10.4.0', role: 'Dashboards', status: 'running' },
              ],
              gpu_required: false,
              compose_exists: true,
            },
          ],
        })
      }
      throw new Error(`unexpected fetch ${url}`)
    })

    await routerStub.push('/monitoring')
    const wrapper = mount(MonitoringView, {
      global: { plugins: [routerStub] },
    })

    await flushPromises()
    // Give the card-refresh Promise.all a tick
    await flushPromises()

    expect(wrapper.text()).toContain('Monitoring')
    expect(wrapper.text()).toContain('Prometheus')
    expect(wrapper.text()).toContain('Grafana')
    expect(wrapper.text()).toContain('flow')
    expect(wrapper.text()).toContain('gradient-flow-prometheus')
    expect(wrapper.html()).toContain('reachable')
    expect(fetchMock).toHaveBeenCalledWith('/api/v1/suites', expect.any(Object))
  })
})
