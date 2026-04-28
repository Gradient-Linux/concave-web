import type {
  MonitoringReachability,
  MonitoringSuiteHint,
  PromQLInstantResponse,
  PromQLVectorSample,
  SuiteSummary,
} from '../types'

export const PROMETHEUS_BASE = '/monitoring/prometheus'
export const GRAFANA_BASE = '/monitoring/grafana'

const DEFAULT_TIMEOUT_MS = 4000

function fetchWithTimeout(path: string, timeoutMs = DEFAULT_TIMEOUT_MS, init: RequestInit = {}): Promise<Response> {
  const controller = new AbortController()
  const timer = window.setTimeout(() => controller.abort(), timeoutMs)
  return fetch(path, {
    credentials: 'include',
    ...init,
    signal: controller.signal,
  }).finally(() => {
    window.clearTimeout(timer)
  })
}

export async function probeMonitoring(): Promise<MonitoringReachability> {
  const [prom, graf] = await Promise.all([probePrometheus(), probeGrafana()])
  return { prometheus: prom, grafana: graf }
}

async function probePrometheus(): Promise<MonitoringReachability['prometheus']> {
  try {
    const response = await fetchWithTimeout(`${PROMETHEUS_BASE}/-/healthy`)
    if (!response.ok) {
      return { reachable: false, error: `HTTP ${response.status}` }
    }
    let version: string | undefined
    try {
      const build = await fetchWithTimeout(`${PROMETHEUS_BASE}/api/v1/status/buildinfo`)
      if (build.ok) {
        const payload = (await build.json()) as { data?: { version?: string } }
        version = payload.data?.version
      }
    } catch {
      // buildinfo is best-effort; reachability was already confirmed
    }
    return { reachable: true, version }
  } catch (err) {
    return { reachable: false, error: err instanceof Error ? err.message : 'unreachable' }
  }
}

async function probeGrafana(): Promise<MonitoringReachability['grafana']> {
  try {
    const response = await fetchWithTimeout(`${GRAFANA_BASE}/api/health`)
    if (!response.ok) {
      return { reachable: false, error: `HTTP ${response.status}` }
    }
    const payload = (await response.json()) as { version?: string; database?: string }
    return { reachable: true, version: payload.version }
  } catch (err) {
    return { reachable: false, error: err instanceof Error ? err.message : 'unreachable' }
  }
}

export async function promQuery(expr: string): Promise<PromQLInstantResponse> {
  const response = await fetchWithTimeout(
    `${PROMETHEUS_BASE}/api/v1/query?query=${encodeURIComponent(expr)}`,
    DEFAULT_TIMEOUT_MS,
    { headers: { Accept: 'application/json' } },
  )
  if (!response.ok) {
    return { status: 'error', errorType: 'http', error: `HTTP ${response.status}` }
  }
  return (await response.json()) as PromQLInstantResponse
}

export function firstVectorValue(payload: PromQLInstantResponse): number | null {
  if (payload.status !== 'success' || !payload.data) {
    return null
  }
  if (payload.data.resultType !== 'vector') {
    return null
  }
  const samples = payload.data.result as PromQLVectorSample[]
  if (!samples.length) {
    return null
  }
  const raw = samples[0].value[1]
  const value = Number(raw)
  return Number.isFinite(value) ? value : null
}

export function detectMonitoringSuites(suites: SuiteSummary[]): MonitoringSuiteHint[] {
  const hints: MonitoringSuiteHint[] = []
  for (const suite of suites) {
    const relevant = (suite.containers ?? []).filter((container) => {
      const name = container.name.toLowerCase()
      return name.includes('prometheus') || name.includes('grafana')
    })
    if (relevant.length === 0) {
      continue
    }
    hints.push({
      suite: suite.name,
      state: suite.state,
      containers: relevant.map((container) => ({
        name: container.name,
        role: container.role,
        status: container.status,
      })),
    })
  }
  return hints
}
