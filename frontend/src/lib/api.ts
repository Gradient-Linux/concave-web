import type { JobSnapshot } from '../types'

export class APIError extends Error {
  status: number

  constructor(status: number, message: string) {
    super(message)
    this.status = status
  }
}

export async function api<T>(path: string, init: RequestInit = {}): Promise<T> {
  const headers = new Headers(init.headers ?? {})
  if (!headers.has('Accept')) {
    headers.set('Accept', 'application/json')
  }
  if (init.body && !headers.has('Content-Type')) {
    headers.set('Content-Type', 'application/json')
  }

  const response = await fetch(path, {
    credentials: 'include',
    ...init,
    headers,
  })

  if (!response.ok) {
    let message = response.statusText
    try {
      const payload = (await response.json()) as { error?: string }
      if (payload.error) {
        message = payload.error
      }
    } catch {
      // keep default
    }
    throw new APIError(response.status, message)
  }

  if (response.status === 204) {
    return undefined as T
  }
  return (await response.json()) as T
}

export async function pollJob(jobId: string, onUpdate: (job: JobSnapshot) => void): Promise<JobSnapshot> {
  for (;;) {
    const job = await api<JobSnapshot>(`/api/v1/jobs/${jobId}`)
    onUpdate(job)
    if (job.status !== 'running') {
      return job
    }
    await new Promise((resolve) => window.setTimeout(resolve, 1000))
  }
}

export function wsURL(path: string): string {
  const proto = window.location.protocol === 'https:' ? 'wss:' : 'ws:'
  return `${proto}//${window.location.host}${path}`
}
