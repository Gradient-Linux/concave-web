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
