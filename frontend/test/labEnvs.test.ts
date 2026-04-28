import { describe, expect, it } from 'vitest'

import { formatCountdown, remainingSeconds } from '../src/lib/labEnvs'

describe('labEnvs', () => {
  it('formats countdown in hours/minutes/seconds', () => {
    expect(formatCountdown(3 * 3600 + 15 * 60)).toBe('3h 15m')
    expect(formatCountdown(15 * 60 + 7)).toBe('15m 07s')
    expect(formatCountdown(42)).toBe('42s')
    expect(formatCountdown(0)).toBe('expired')
    expect(formatCountdown(-5)).toBe('expired')
  })

  it('computes remaining seconds from ISO expiry', () => {
    const now = new Date('2026-01-01T00:00:00Z')
    expect(remainingSeconds('2026-01-01T01:00:00Z', now)).toBe(3600)
    expect(remainingSeconds('2026-01-01T00:00:00Z', now)).toBe(0)
    expect(remainingSeconds('2025-12-31T23:59:00Z', now)).toBe(0)
    expect(remainingSeconds('not-a-date', now)).toBe(0)
  })
})
