export function formatBytes(value?: number): string {
  if (!value && value !== 0) {
    return '—'
  }
  if (value < 1024) {
    return `${value} B`
  }
  const units = ['KB', 'MB', 'GB', 'TB']
  let current = value
  let unit = -1
  while (current >= 1024 && unit < units.length - 1) {
    current /= 1024
    unit += 1
  }
  return `${current.toFixed(current >= 10 ? 0 : 1)} ${units[unit]}`
}

export function formatMiB(value?: number): string {
  if (!value && value !== 0) {
    return '—'
  }
  if (value >= 1024) {
    return `${(value / 1024).toFixed(1)} GiB`
  }
  return `${value} MiB`
}

export function formatRelativeTime(value?: string | number | Date | null): string {
  if (value === undefined || value === null || value === '') {
    return '—'
  }

  const date = value instanceof Date ? value : new Date(value)
  if (Number.isNaN(date.getTime())) {
    return '—'
  }

  const deltaMs = date.getTime() - Date.now()
  const absMs = Math.abs(deltaMs)
  const minute = 60_000
  const hour = 3_600_000
  const day = 86_400_000

  let label = 'just now'
  if (absMs >= day) {
    const count = Math.round(absMs / day)
    label = `${count}d`
  } else if (absMs >= hour) {
    const count = Math.round(absMs / hour)
    label = `${count}h`
  } else if (absMs >= minute) {
    const count = Math.round(absMs / minute)
    label = `${count}m`
  }

  if (label === 'just now') {
    return deltaMs > 0 ? 'in a moment' : 'just now'
  }
  return deltaMs > 0 ? `in ${label}` : `${label} ago`
}
