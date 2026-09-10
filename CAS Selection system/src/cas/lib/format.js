import { CAS_CONFIG } from '../config'

/** Coerce anything Firestore hands back into a safe non-negative integer. */
export function toCount(value) {
  const n = Number(value)
  return Number.isFinite(n) && n > 0 ? Math.floor(n) : 0
}

/**
 * Capacity view-model for a trip. `max === 0` means unlimited.
 * Everything in the UI reads spaces through this, so the "full" rule is
 * defined exactly once.
 */
export function capacityOf(trip) {
  const max = toCount(trip?.maxStudents)
  const enrolled = toCount(trip?.enrolledCount)
  const unlimited = max === 0
  const remaining = unlimited ? Infinity : Math.max(0, max - enrolled)
  return {
    max,
    enrolled,
    unlimited,
    remaining,
    isFull: !unlimited && enrolled >= max,
    /** 0..1, used for the progress bar. Unlimited trips never fill. */
    ratio: unlimited ? 0 : max === 0 ? 0 : Math.min(1, enrolled / max),
  }
}

/** "5 / 16" or "10 joined". */
export function capacityLabel(trip) {
  const c = capacityOf(trip)
  return c.unlimited ? `${c.enrolled} joined` : `${c.enrolled} / ${c.max}`
}

/** "11 left" / "Full" / "No limit". */
export function spacesLabel(trip) {
  const c = capacityOf(trip)
  if (c.unlimited) return 'No limit'
  if (c.isFull) return 'Full'
  return `${c.remaining} left`
}

/** 'full' | 'low' | 'ok' — drives the colour of counts and bars. */
export function spacesTone(trip) {
  const c = capacityOf(trip)
  if (c.unlimited) return 'ok'
  if (c.isFull) return 'full'
  if (c.remaining <= CAS_CONFIG.lowSpaceThreshold) return 'low'
  return 'ok'
}

/**
 * Headline cost, e.g. "220 OMR" or "230–290 OMR".
 * Returns '' when no cost has been entered, so the card can hide the block.
 */
export function costLabel(trip) {
  const from = Number(trip?.cost)
  const to = Number(trip?.costTo)
  const hasFrom = Number.isFinite(from) && from > 0
  const hasTo = Number.isFinite(to) && to > 0 && to !== from
  if (!hasFrom) return ''
  const figure = hasTo
    ? `${formatNumber(from)}–${formatNumber(to)}`
    : formatNumber(from)
  return `${figure} ${CAS_CONFIG.currency}`
}

function formatNumber(n) {
  return new Intl.NumberFormat('en-GB', { maximumFractionDigits: 2 }).format(n)
}

/** Sort trips the way the handbook lists them, falling back to name. */
export function sortTrips(trips) {
  return [...trips].sort((a, b) => {
    const ao = Number.isFinite(Number(a.order)) ? Number(a.order) : 9999
    const bo = Number.isFinite(Number(b.order)) ? Number(b.order) : 9999
    if (ao !== bo) return ao - bo
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

/** Live board ordering: fullest first, then fewest spaces left. */
export function sortByFillingFastest(trips) {
  return [...trips].sort((a, b) => {
    const ca = capacityOf(a)
    const cb = capacityOf(b)
    // Capped trips always rank above uncapped ones.
    if (ca.unlimited !== cb.unlimited) return ca.unlimited ? 1 : -1
    if (!ca.unlimited && cb.ratio !== ca.ratio) return cb.ratio - ca.ratio
    if (cb.enrolled !== ca.enrolled) return cb.enrolled - ca.enrolled
    return String(a.name || '').localeCompare(String(b.name || ''))
  })
}

export function initialsOf(name) {
  const parts = String(name || '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  if (parts.length === 0) return '?'
  if (parts.length === 1) return parts[0].slice(0, 2).toUpperCase()
  return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase()
}

/** "2 min ago", "17d ago" — matches the Clubs activity feed. */
export function relativeTime(date) {
  if (!date) return ''
  const then = date instanceof Date ? date : new Date(date)
  if (Number.isNaN(then.getTime())) return ''
  const seconds = Math.floor((Date.now() - then.getTime()) / 1000)
  if (seconds < 45) return 'just now'
  const minutes = Math.floor(seconds / 60)
  if (minutes < 60) return `${Math.max(1, minutes)} min ago`
  const hours = Math.floor(minutes / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 30) return `${days}d ago`
  const months = Math.floor(days / 30)
  if (months < 12) return `${months}mo ago`
  return `${Math.floor(months / 12)}y ago`
}

/** Firestore Timestamp | Date | null -> Date | null */
export function toDate(value) {
  if (!value) return null
  if (typeof value.toDate === 'function') return value.toDate()
  if (value instanceof Date) return value
  const d = new Date(value)
  return Number.isNaN(d.getTime()) ? null : d
}

/** Best display name we can get for a signed-in user. */
export function displayNameOf(user) {
  if (!user) return ''
  if (user.displayName) return user.displayName
  const email = user.email || ''
  const local = email.split('@')[0] || ''
  if (!local) return 'Unknown student'
  return local
    .replace(/[._-]+/g, ' ')
    .replace(/\d+/g, '')
    .trim()
    .replace(/\b\w/g, (c) => c.toUpperCase()) || 'Unknown student'
}
