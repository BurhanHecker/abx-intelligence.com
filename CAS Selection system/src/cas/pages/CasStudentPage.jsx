import { useMemo, useState } from 'react'
import { CasHeader } from '../components/CasHeader'
import { TripCard } from '../components/TripCard'
import { useCasUser } from '../lib/CasProvider'
import { useCasSettings, useCasTrips, useMySelection } from '../lib/useCas'
import { CasError, joinTrip, leaveTrip } from '../lib/actions'
import { costLabel } from '../lib/format'
import { CAS_CONFIG } from '../config'
import '../theme.css'

/**
 * The student-facing page: choose one excursion, switch freely while
 * registration is open.
 *
 * A student holds exactly one excursion. Switching is a single transaction —
 * the old place is released and the new one taken together, so a student can
 * never occupy two seats and never end up with none because a switch
 * half-failed.
 */
export function CasStudentPage({ logoSrc = null, onSignOut = null }) {
  const { user, isAdmin, loading: authLoading } = useCasUser()
  const { settings, loading: settingsLoading } = useCasSettings()
  const { trips, loading: tripsLoading, error: tripsError } = useCasTrips()
  const { selection } = useMySelection(user?.uid)

  const [search, setSearch] = useState('')
  const [busyTripId, setBusyTripId] = useState(null)
  const [message, setMessage] = useState(null)

  const myTripId = selection?.tripId || null
  const myTrip = useMemo(
    () => trips.find((t) => t.id === myTripId) || null,
    [trips, myTripId]
  )

  const visibleTrips = useMemo(() => {
    const needle = search.trim().toLowerCase()
    if (!needle) return trips
    return trips.filter((t) =>
      `${t.name || ''} ${t.leader || ''}`.toLowerCase().includes(needle)
    )
  }, [trips, search])

  const headerLinks = [
    { label: 'Portal', href: CAS_CONFIG.routes.portal },
    ...(isAdmin ? [{ label: 'Admin', href: CAS_CONFIG.routes.admin }] : []),
    ...(onSignOut ? [{ label: 'Sign out', onClick: onSignOut }] : []),
  ]

  async function runAction(tripId, fn) {
    setBusyTripId(tripId ?? '__leave__')
    setMessage(null)
    try {
      await fn()
    } catch (error) {
      setMessage({
        tone: 'error',
        text:
          error instanceof CasError
            ? error.message
            : 'Something went wrong. Check your connection and try again.',
      })
      if (!(error instanceof CasError)) console.error('[CAS] action failed', error)
    } finally {
      setBusyTripId(null)
    }
  }

  if (authLoading || settingsLoading) {
    return <Shell><div className="cas-center">Loading…</div></Shell>
  }

  if (!user) {
    return (
      <Shell logoSrc={logoSrc}>
        <div className="cas-center">
          <p>Sign in with your ABA account to choose a CAS excursion.</p>
        </div>
      </Shell>
    )
  }

  if (!settings.openToStudents) {
    return (
      <Shell logoSrc={logoSrc} email={user.email} links={headerLinks}>
        <main className="cas-page cas-page--narrow">
          <h1 className="cas-title">CAS Excursion Week</h1>
          <div className="cas-note cas-note--warn">
            Excursion selection is not open yet. You will be able to choose
            here once it opens — nothing to do for now.
          </div>
        </main>
      </Shell>
    )
  }

  const canChange = settings.registrationOpen

  return (
    <Shell logoSrc={logoSrc} email={user.email} links={headerLinks}>
      <main className="cas-page">
        <h1 className="cas-title">Select your CAS excursion</h1>
        <p className="cas-subtitle">
          You can hold one excursion. Switching moves your place across
          instantly — everyone sees spaces open and close live.
        </p>

        <section className="cas-banner">
          <div>
            <div className="cas-banner__label">Your CAS excursion</div>
            {myTrip ? (
              <>
                <div className="cas-banner__value">{myTrip.name}</div>
                <div className="cas-banner__meta">
                  {[myTrip.leader, costLabel(myTrip)]
                    .filter(Boolean)
                    .join(' · ')}
                </div>
              </>
            ) : myTripId ? (
              <div className="cas-banner__value cas-banner__value--empty">
                Your excursion is no longer available — please pick another.
              </div>
            ) : (
              <div className="cas-banner__value cas-banner__value--empty">
                Not selected yet
              </div>
            )}
          </div>
          <span className="cas-banner__spacer" />
          <span
            className={`cas-status-pill cas-status-pill--${
              canChange ? 'open' : 'closed'
            }`}
          >
            {canChange ? 'Registration open' : 'Registration closed'}
          </span>
        </section>

        {!canChange && (
          <div className="cas-note cas-note--warn">
            Registration is closed. Your choice above is locked in — speak to
            the CAS coordinator if it needs to change.
          </div>
        )}

        {message && (
          <div className={`cas-note cas-note--${message.tone}`} role="alert">
            {message.text}
          </div>
        )}

        {tripsError && (
          <div className="cas-note cas-note--error" role="alert">
            Could not load the excursions. Refresh the page, and tell the CAS
            coordinator if it keeps happening.
          </div>
        )}

        <label className="cas-sr-only" htmlFor="cas-search">
          Search excursions or leaders
        </label>
        <input
          id="cas-search"
          className="cas-search"
          type="search"
          placeholder="Search excursions or leaders…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />

        {tripsLoading ? (
          <div className="cas-empty">Loading excursions…</div>
        ) : visibleTrips.length === 0 ? (
          <div className="cas-empty">
            {trips.length === 0
              ? 'No excursions have been published yet.'
              : `Nothing matches “${search}”.`}
          </div>
        ) : (
          <div className="cas-grid">
            {visibleTrips.map((trip) => (
              <TripCard
                key={trip.id}
                trip={trip}
                isMine={trip.id === myTripId}
                canChange={canChange}
                busy={
                  busyTripId === trip.id ||
                  (busyTripId === '__leave__' && trip.id === myTripId)
                }
                pending={busyTripId !== null}
                hasOtherSelection={Boolean(myTripId) && trip.id !== myTripId}
                onJoin={() =>
                  runAction(trip.id, async () => {
                    const result = await joinTrip({ tripId: trip.id, user })
                    if (result.changed) {
                      setMessage({
                        tone: 'success',
                        text: result.from
                          ? `Moved from ${result.from} to ${result.to}.`
                          : `You are on ${result.to}.`,
                      })
                    }
                  })
                }
                onLeave={() =>
                  runAction(null, async () => {
                    const result = await leaveTrip({ user })
                    if (result.changed) {
                      setMessage({
                        tone: 'info',
                        text: `You have left ${result.from}. Your place is back in the pool.`,
                      })
                    }
                  })
                }
              />
            ))}
          </div>
        )}
      </main>
    </Shell>
  )
}

function Shell({ children, email, links, logoSrc }) {
  return (
    <div className="cas-app">
      <CasHeader
        section={CAS_CONFIG.appName}
        email={email}
        links={links}
        logoSrc={logoSrc}
      />
      {children}
    </div>
  )
}

export default CasStudentPage
