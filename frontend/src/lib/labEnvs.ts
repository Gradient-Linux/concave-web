import { api } from './api'
import type { LabEnv, LabEnvsResponse, LabStorage } from '../types'

export async function fetchLabEnvs(): Promise<LabEnvsResponse> {
  return api<LabEnvsResponse>('/api/v1/lab/envs')
}

export interface LaunchEnvPayload {
  image: string
  display_name?: string
  driver?: string
  gpus?: number
  cpu_request?: string
  mem_request?: string
  ttl_seconds: number
}

export async function launchLabEnv(payload: LaunchEnvPayload): Promise<LabEnv> {
  return api<LabEnv>('/api/v1/lab/envs', {
    method: 'POST',
    body: JSON.stringify(payload),
  })
}

export async function extendLabEnv(id: string, extendSeconds: number): Promise<LabEnv> {
  return api<LabEnv>(`/api/v1/lab/envs/${encodeURIComponent(id)}/extend`, {
    method: 'POST',
    body: JSON.stringify({ extend_seconds: extendSeconds }),
  })
}

export async function archiveLabEnv(id: string): Promise<LabEnv> {
  return api<LabEnv>(`/api/v1/lab/envs/${encodeURIComponent(id)}/archive`, {
    method: 'POST',
  })
}

export async function deleteLabEnv(id: string): Promise<LabEnv> {
  return api<LabEnv>(`/api/v1/lab/envs/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export async function updateLabStorage(next: LabStorage): Promise<LabStorage> {
  return api<LabStorage>('/api/v1/lab/storage', {
    method: 'PUT',
    body: JSON.stringify(next),
  })
}

export async function setActiveDriver(name: string): Promise<{ active: string }> {
  return api<{ active: string }>('/api/v1/lab/drivers', {
    method: 'PUT',
    body: JSON.stringify({ driver: name }),
  })
}

export function remainingSeconds(expiresAt: string, now: Date = new Date()): number {
  const expiry = Date.parse(expiresAt)
  if (Number.isNaN(expiry)) {
    return 0
  }
  return Math.max(0, Math.floor((expiry - now.getTime()) / 1000))
}

export function formatCountdown(seconds: number): string {
  if (seconds <= 0) {
    return 'expired'
  }
  const h = Math.floor(seconds / 3600)
  const m = Math.floor((seconds % 3600) / 60)
  const s = seconds % 60
  if (h > 0) {
    return `${h}h ${m.toString().padStart(2, '0')}m`
  }
  if (m > 0) {
    return `${m}m ${s.toString().padStart(2, '0')}s`
  }
  return `${s}s`
}
