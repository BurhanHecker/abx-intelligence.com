import { useMemo, useState } from 'react'
import { CasHeader } from '../components/CasHeader'
import { CapacityBar } from '../components/CapacityBar'
import { useCasUser } from '../lib/CasProvider'
import { useAllSelections, useCasActivity, useCasTrips } from '../lib/useCas'
import {
  capacityLabel,
  capacityOf,
  initialsOf,
  relativeTime,
  sortByFillingFastest,
  sortTrips,
  spacesLabel,
  spacesTone,
  toDate,
} from '../lib/format'
import { CAS_CONFIG } from '../config'
import '../theme.css'

/**
 * Staff-facing live board — the screen to project during the selection window.
 *
 * Everything on this page is driven by Firestore snapshot listeners, so it
 * never needs refreshing.
 */
export function CasLivePage({ logoSrc = null, onSignOut = null }) {
  const { user, isAdmin, loading: authLoading } = useCasUser()
  const { trips, loading: tripsLoading } = useCasTrips()
  const { selections } = useAllSelections(isAdmin)
  const { entries } = useCasActivity(isAdmin)

  const [sortMode, setSortMode] = useState('filling')
  const [studentQuery, setStudentQuery] = useState('')

  const stats = useMemo(() => {
    const signedUp = selections.filter((s) => s.tripId).length
    const withStudents = new Set(
      selections.filter((s) => s.tripId).map((s) => s.tripId)
    ).size

    const full = trips.filter((t) => capacityOf(t).isFull)
    const capped = trips.filter((t) => !capacityOf(t).unlimited)
    const spacesLeft = capped.reduce((sum, t) => sum + capacityOf(t).remaining, 0)
    const uncapped = trips.length - capped.length

    return {
      signedUp,
      withStudents,
      totalTrips: trips.length,
      full,
      spacesLeft,
      uncapped,
    }
  }, [trips, selections])

  const orderedTrips = useMemo(
    () => (sortMode === 'filling' ? sortByFillingFastest(trips) : sortTrips(trips)),
    [trips, sortMode]
  )

  const studentResults = useMemo(() => {
    const needle = studentQuery.trim().toLowerCase()
    if (needle.length < 2) return []
    return selections
      .filter((s) =>
        `${s.name || ''} ${s.email || ''}`.toLowerCase().includes(needle)
      )
      .sort((a, b) =>
        String(a.name || a.email || '').localeCompare(
          String(b.name || b.email || '')
        )
      )
      .slice(0, 25)
  }, [selections, studentQuery])

  if (authLoading) {
    return <Shell logoSrc={logoSrc}><div className="cas-center">Loading…</div></Shell>
  }

  if (!user || !isAdmin) {
    return (
      <Shell logoSrc={logoSrc} email={user?.email}>
        <div className="cas-center">
          <p>The live board is for CAS staff.</p>
        </div>
      </Shell>
    )
  }

  const headerLinks = [
    { label: 'Admin', href: CAS_CONFIG.routes.admin },
    ...(onSignOut ? [{ label: 'Sign out', onClick: onSignOut }] : []),
  ]

  return (
    <Shell logoSrc={logoSrc} email={user.email} links={headerLinks} live>
      <main className="cas-page">
        <section className="cas-stats">
          <div className="cas-stat">
            <div className="cas-stat__label">Students signed up</div>
            <div className="cas-stat__value">{stats.signedUp}</div>
            <div className="cas-stat__note">
              across {stats.withStudents} of {stats.totalTrips} excursions
            </div>
          </div>

          <div className="cas-stat">
            <div className="cas-stat__label">Excursions full</div>
            <div className="cas-stat__value">{stats.full.length}</div>
            <div className="cas-stat__note">
              {stats.full.length === 0
                ? 'Places available on every excursion'
                : summariseNames(stats.full.map((t) => t.name))}
            </div>
          </div>

          <div className="cas-stat">
            <div className="cas-stat__label">Spaces left</div>
            <div className="cas-stat__value">{stats.spacesLeft}</div>
            <div className="cas-stat__note">
              {stats.uncapped > 0
                ? `${stats.uncapped} excursion${
                    stats.uncapped === 1 ? '' : 's'
                  } unlimited`
                : 'across all capped excursions'}
            </div>
          </div>
        </section>

        <div className="cas-live-layout">
          <section className="cas-card">
            <div className="cas-card__body">
              <div className="cas-live-head">
                <h2 className="cas-section-title" style={{ margin: 0 }}>
                  Excursions
                </h2>
                <div className="cas-segmented">
                  <button
                    type="button"
                    aria-pressed={sortMode === 'filling'}
                    onClick={() => setSortMode('filling')}
                  >
                    Filling fastest
                  </button>
                  <button
                    type="button"
                    aria-pressed={sortMode === 'order'}
                    onClick={() => setSortMode('order')}
                  >
                    A–Z
                  </button>
                </div>
              </div>

              {tripsLoading ? (
                <div className="cas-empty">Loading…</div>
              ) : orderedTrips.length === 0 ? (
                <div className="cas-empty">No excursions published yet.</div>
              ) : (
                orderedTrips.map((trip) => {
                  const tone = spacesTone(trip)
                  return (
                    <div className="cas-row" key={trip.id}>
                      <div>
                        <div className="cas-row__name">{trip.name}</div>
                        {trip.leader && (
                          <div className="cas-row__leader">{trip.leader}</div>
                        )}
                      </div>
                      <div className="cas-row__bar">
                        <CapacityBar trip={trip} variant="status" />
                      </div>
                      <div className="cas-row__count">{capacityLabel(trip)}</div>
                      <div className={`cas-row__spaces cas-row__spaces--${tone}`}>
                        {spacesLabel(trip)}
                      </div>
                    </div>
                  )
                })
              )}
            </div>
          </section>

          <div className="cas-stack">
            <section className="cas-card">
              <div className="cas-card__body">
                <h2 className="cas-section-title">Find a student</h2>
                <label className="cas-sr-only" htmlFor="cas-student-search">
                  Type a student's name
                </label>
                <input
                  id="cas-student-search"
                  className="cas-input"
                  type="search"
                  placeholder="Type a student's name…"
                  value={studentQuery}
                  onChange={(e) => setStudentQuery(e.target.value)}
                  style={{ marginTop: 12 }}
                />
                {studentQuery.trim().length < 2 ? (
                  <p className="cas-hint">Type a name to search.</p>
                ) : studentResults.length === 0 ? (
                  <p className="cas-hint">No student matches that.</p>
                ) : (
                  <div style={{ marginTop: 8 }}>
                    {studentResults.map((s) => (
                      <div className="cas-result" key={s.id}>
                        <div className="cas-table__name">
                          {s.name || s.email}
                        </div>
                        <div className="cas-table__sub">
                          {s.tripName || 'No excursion chosen'}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </section>

            <section className="cas-card">
              <div className="cas-card__body">
                <div className="cas-live-head">
                  <h2 className="cas-section-title" style={{ margin: 0 }}>
                    Activity
                  </h2>
                  <span
                    className="cas-section-note"
                    style={{ margin: 0, marginLeft: 'auto' }}
                  >
                    Newest first
                  </span>
                </div>
                {entries.length === 0 ? (
                  <p className="cas-hint">Nothing yet.</p>
                ) : (
                  <ul className="cas-feed">
                    {entries.map((entry) => (
                      <li className="cas-feed__item" key={entry.id}>
                        <span
                          className={`cas-avatar${
                            entry.type === 'leave' ? ' cas-avatar--muted' : ''
                          }`}
                          aria-hidden="true"
                        >
                          {initialsOf(entry.name)}
                        </span>
                        <span className="cas-feed__body">
                          <span className="cas-feed__name">{entry.name}</span>
                          <span className="cas-feed__what">
                            {describeActivity(entry)}
                          </span>
                        </span>
                        <span className="cas-feed__time">
                          {relativeTime(toDate(entry.at))}
                        </span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          </div>
        </div>
      </main>
    </Shell>
  )
}

function describeActivity(entry) {
  if (entry.type === 'leave') {
    return entry.fromTripName ? (
      <>
        left <strong>{entry.fromTripName}</strong>
      </>
    ) : (
      'left their excursion'
    )
  }
  if (entry.type === 'switch' && entry.fromTripName) {
    return (
      <>
        moved from {entry.fromTripName} to <strong>{entry.tripName}</strong>
      </>
    )
  }
  return (
    <>
      joined <strong>{entry.tripName}</strong>
    </>
  )
}

/** "International Food Club, STEM +1" — the Clubs board's phrasing. */
function summariseNames(names) {
  if (names.length === 0) return ''
  const shown = names.slice(0, 2).join(', ')
  const extra = names.length - 2
  return extra > 0 ? `${shown} +${extra}` : shown
}

function Shell({ children, email, links, logoSrc, live = false }) {
  return (
    <div className="cas-app">
      <CasHeader
        section="Live Board"
        email={email}
        links={links}
        logoSrc={logoSrc}
        live={live}
      />
      {children}
    </div>
  )
}

export default CasLivePage
