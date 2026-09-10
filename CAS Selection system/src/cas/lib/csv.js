import { costLabel, toDate } from './format'

/**
 * Build the registrations CSV: one row per student who has chosen an
 * excursion, plus (optionally) the students who have not.
 *
 * Excel on Windows guesses the encoding unless the file starts with a BOM,
 * which is why one is prepended — without it, accented staff names come out
 * mangled.
 */
export function buildRegistrationsCsv(selections, trips, { includeUnselected = true } = {}) {
  const tripsById = new Map(trips.map((t) => [t.id, t]))

  const header = [
    'Name',
    'Email',
    'Excursion',
    'Leader',
    'Cost',
    'Chosen at',
  ]

  const rows = selections
    .filter((s) => (includeUnselected ? true : Boolean(s.tripId)))
    .slice()
    .sort((a, b) => {
      const an = String(a.tripName || '~')
      const bn = String(b.tripName || '~')
      if (an !== bn) return an.localeCompare(bn)
      return String(a.name || a.email || '').localeCompare(
        String(b.name || b.email || '')
      )
    })
    .map((s) => {
      const trip = s.tripId ? tripsById.get(s.tripId) : null
      const chosen = toDate(s.updatedAt)
      return [
        s.name || '',
        s.email || '',
        trip?.name || s.tripName || '',
        trip?.leader || '',
        trip ? costLabel(trip) : '',
        chosen ? chosen.toISOString().slice(0, 16).replace('T', ' ') : '',
      ]
    })

  return toCsv([header, ...rows])
}

/** Excel guesses the encoding without this, mangling accented staff names. */
const BOM = '\uFEFF'

export function toCsv(rows) {
  return BOM + rows.map((row) => row.map(escapeCell).join(',')).join('\r\n')
}

function escapeCell(value) {
  const s = value === null || value === undefined ? '' : String(value)
  // A leading =, +, - or @ makes Excel treat the cell as a formula. Prefix a
  // quote so a name like "-Ali" cannot become one.
  const safe = /^[=+\-@]/.test(s) ? `'${s}` : s
  return /[",\r\n]/.test(safe) ? `"${safe.replace(/"/g, '""')}"` : safe
}

export function downloadCsv(filename, csv) {
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  // Revoke on the next tick so Safari has actually started the download.
  setTimeout(() => URL.revokeObjectURL(url), 1000)
}
