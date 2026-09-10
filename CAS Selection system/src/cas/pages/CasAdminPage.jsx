import { useEffect, useMemo, useState } from 'react'
import { CasHeader } from '../components/CasHeader'
import { useCasUser } from '../lib/CasProvider'
import {
  useAllSelections,
  useCasSettings,
  useCasTrips,
  useSelectionsByTrip,
} from '../lib/useCas'
import {
  CasError,
  deleteTrip,
  recountEnrolment,
  saveSettings,
  saveTrip,
  seedFromHandbook,
} from '../lib/actions'
import { HANDBOOK_TRIPS } from '../seed/trips'
import { buildRegistrationsCsv, downloadCsv } from '../lib/csv'
import { capacityLabel, costLabel, toCount } from '../lib/format'
import { CAS_CONFIG } from '../config'
import '../theme.css'

const EMPTY_FORM = {
  name: '',
  leader: '',
  cost: '',
  costTo: '',
  costNote: '',
  maxStudents: '',
  minStudents: '',
  location: '',
  duration: '',
  order: '',
  description: '',
}

export function CasAdminPage({ logoSrc = null, onSignOut = null }) {
  const { user, isAdmin, loading: authLoading } = useCasUser()
  const { settings, loading: settingsLoading } = useCasSettings()
  const { trips, loading: tripsLoading } = useCasTrips()
  const { selections } = useAllSelections(isAdmin)
  const byTrip = useSelectionsByTrip(selections)

  const [form, setForm] = useState(EMPTY_FORM)
  const [editingId, setEditingId] = useState(null)
  const [busy, setBusy] = useState(false)
  const [message, setMessage] = useState(null)
  const [expandedTripId, setExpandedTripId] = useState(null)

  const chosenCount = useMemo(
    () => selections.filter((s) => s.tripId).length,
    [selections]
  )

  // Clear a success message when the admin starts doing something else.
  useEffect(() => {
    if (!message || message.tone === 'error') return undefined
    const t = setTimeout(() => setMessage(null), 6000)
    return () => clearTimeout(t)
  }, [message])

  if (authLoading || settingsLoading) {
    return <Shell logoSrc={logoSrc}><div className="cas-center">Loading…</div></Shell>
  }

  if (!user || !isAdmin) {
    return (
      <Shell logoSrc={logoSrc} email={user?.email}>
        <div className="cas-center">
          <p>
            This page is for CAS staff. If you should have access, ask for your
            account to be added to the admin list.
          </p>
        </div>
      </Shell>
    )
  }

  const headerLinks = [
    { label: 'Live board', href: CAS_CONFIG.routes.live },
    { label: 'Student view', href: CAS_CONFIG.routes.student },
    ...(onSignOut ? [{ label: 'Sign out', onClick: onSignOut }] : []),
  ]

  async function run(fn, successText) {
    setBusy(true)
    setMessage(null)
    try {
      const result = await fn()
      if (successText) {
        setMessage({
          tone: 'success',
          text:
            typeof successText === 'function'
              ? successText(result)
              : successText,
        })
      }
      return result
    } catch (error) {
      setMessage({
        tone: 'error',
        text:
          error instanceof CasError
            ? error.message
            : 'That did not save. Check your connection and try again.',
      })
      if (!(error instanceof CasError)) console.error('[CAS] admin action', error)
      return null
    } finally {
      setBusy(false)
    }
  }

  function startEdit(trip) {
    setEditingId(trip.id)
    setForm({
      name: trip.name || '',
      leader: trip.leader || '',
      cost: trip.cost ?? '',
      costTo: trip.costTo ?? '',
      costNote: trip.costNote || '',
      maxStudents: trip.maxStudents ?? '',
      minStudents: trip.minStudents ?? '',
      location: trip.location || '',
      duration: trip.duration || '',
      order: trip.order ?? '',
      description: trip.description || '',
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  function cancelEdit() {
    setEditingId(null)
    setForm(EMPTY_FORM)
  }

  const field = (key) => ({
    value: form[key],
    onChange: (e) => setForm((f) => ({ ...f, [key]: e.target.value })),
  })

  return (
    <Shell logoSrc={logoSrc} email={user.email} links={headerLinks}>
      <main className="cas-page cas-page--narrow">
        {message && (
          <div className={`cas-note cas-note--${message.tone}`} role="alert">
            {message.text}
          </div>
        )}

        {/* ------------------------------------------------ Availability */}
        <section className="cas-card" style={{ marginBottom: 22 }}>
          <div className="cas-card__body">
            <h2 className="cas-section-title">Availability</h2>
            <p className="cas-section-note">
              <strong>Open to students</strong> controls whether CAS is
              unlocked on the portal at all. <strong>Registration period</strong>{' '}
              controls whether students can still join, switch or leave — close
              it to freeze everyone's current choices while leaving the page
              readable.
            </p>

            <ToggleRow
              title="Open to students"
              note="When off, the CAS circle shows as locked on the portal."
              checked={settings.openToStudents}
              disabled={busy}
              onChange={(next) =>
                run(() => saveSettings({ openToStudents: next }))
              }
            />
            <ToggleRow
              title="Registration period"
              note="When off, students can see their excursion but can't change it."
              checked={settings.registrationOpen}
              disabled={busy}
              onChange={(next) =>
                run(() => saveSettings({ registrationOpen: next }))
              }
            />
          </div>
        </section>

        {/* ---------------------------------------------------- Export */}
        <section className="cas-card" style={{ marginBottom: 22 }}>
          <div className="cas-card__body">
            <h2 className="cas-section-title">Export registrations</h2>
            <p className="cas-section-note">
              Downloads a CSV of every student's CAS excursion — name, email,
              excursion, leader and cost. Open Google Sheets → File → Import →
              Upload to turn it into a spreadsheet.
            </p>
            <button
              type="button"
              className="cas-btn cas-btn--gold"
              disabled={selections.length === 0}
              onClick={() =>
                downloadCsv(
                  `cas-registrations-${new Date().toISOString().slice(0, 10)}.csv`,
                  buildRegistrationsCsv(selections, trips)
                )
              }
            >
              Download CSV
            </button>
            <p className="cas-hint">
              {chosenCount} of {selections.length} students who have opened CAS
              have chosen an excursion.
            </p>
          </div>
        </section>

        {/* ------------------------------------------------ Add / edit */}
        <section className="cas-card" style={{ marginBottom: 22 }}>
          <div className="cas-card__body">
            <h2 className="cas-section-title">
              {editingId ? 'Edit excursion' : 'Add an excursion'}
            </h2>
            <p className="cas-section-note">
              Costs are in {CAS_CONFIG.currency}. Leave the second cost box
              blank unless the price is a range.
            </p>

            <form
              className="cas-stack"
              onSubmit={async (e) => {
                e.preventDefault()
                const saved = await run(
                  () => saveTrip(editingId, form),
                  editingId ? 'Excursion updated.' : 'Excursion added.'
                )
                if (saved) cancelEdit()
              }}
            >
              <div className="cas-field-row">
                <div>
                  <label className="cas-label" htmlFor="cas-name">
                    Excursion name
                  </label>
                  <input id="cas-name" className="cas-input" required {...field('name')} />
                </div>
                <div>
                  <label className="cas-label" htmlFor="cas-leader">
                    Teacher in charge
                  </label>
                  <input id="cas-leader" className="cas-input" {...field('leader')} />
                </div>
              </div>

              <div className="cas-field-row">
                <div>
                  <label className="cas-label" htmlFor="cas-cost">
                    Cost ({CAS_CONFIG.currency})
                  </label>
                  <input
                    id="cas-cost"
                    className="cas-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 220"
                    {...field('cost')}
                  />
                </div>
                <div>
                  <label className="cas-label" htmlFor="cas-cost-to">
                    Upper cost, if a range
                  </label>
                  <input
                    id="cas-cost-to"
                    className="cas-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="e.g. 290"
                    {...field('costTo')}
                  />
                </div>
              </div>

              <div>
                <label className="cas-label" htmlFor="cas-cost-note">
                  Cost note
                </label>
                <input
                  id="cas-cost-note"
                  className="cas-input"
                  placeholder="e.g. incl. flights   ·   + 350 OMR flights"
                  {...field('costNote')}
                />
                <p className="cas-hint">
                  Shown next to the price. Use it for anything the figure alone
                  does not say.
                </p>
              </div>

              <div className="cas-field-row">
                <div>
                  <label className="cas-label" htmlFor="cas-max">
                    Maximum students
                  </label>
                  <input
                    id="cas-max"
                    className="cas-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Leave blank for no limit"
                    {...field('maxStudents')}
                  />
                  <p className="cas-hint">Blank or 0 = no limit.</p>
                </div>
                <div>
                  <label className="cas-label" htmlFor="cas-min">
                    Minimum students
                  </label>
                  <input
                    id="cas-min"
                    className="cas-input"
                    type="number"
                    min="0"
                    step="1"
                    placeholder="Leave blank for none"
                    {...field('minStudents')}
                  />
                  <p className="cas-hint">
                    Recorded for your reference. Students are not shown this and
                    it does not block anything.
                  </p>
                </div>
              </div>

              <div className="cas-field-row">
                <div>
                  <label className="cas-label" htmlFor="cas-duration">
                    Duration (optional)
                  </label>
                  <input
                    id="cas-duration"
                    className="cas-input"
                    placeholder="e.g. 6 days / 5 nights"
                    {...field('duration')}
                  />
                </div>
                <div>
                  <label className="cas-label" htmlFor="cas-location">
                    Location / meeting point (optional)
                  </label>
                  <input id="cas-location" className="cas-input" {...field('location')} />
                </div>
              </div>

              <div>
                <label className="cas-label" htmlFor="cas-order">
                  Sort order
                </label>
                <input
                  id="cas-order"
                  className="cas-input"
                  type="number"
                  step="1"
                  placeholder="1, 2, 3…"
                  {...field('order')}
                />
              </div>

              <div>
                <label className="cas-label" htmlFor="cas-description">
                  Description
                </label>
                <textarea
                  id="cas-description"
                  className="cas-textarea"
                  {...field('description')}
                />
                <p className="cas-hint">
                  Line breaks are preserved, so bullet lines work.
                </p>
              </div>

              <div>
                <button type="submit" className="cas-btn cas-btn--primary" disabled={busy}>
                  {busy ? 'Saving…' : editingId ? 'Save changes' : 'Save excursion'}
                </button>
                {editingId && (
                  <button
                    type="button"
                    className="cas-btn cas-btn--ghost"
                    style={{ marginLeft: 12 }}
                    onClick={cancelEdit}
                    disabled={busy}
                  >
                    Cancel
                  </button>
                )}
              </div>
            </form>
          </div>
        </section>

        {/* ------------------------------------------------ Trips table */}
        <section className="cas-card">
          <div className="cas-card__body">
            <h2 className="cas-section-title">Excursions</h2>
            <p className="cas-section-note">
              Enrolment updates live as students join and leave. Click a row's
              count to see who is on it.
            </p>

            {tripsLoading ? (
              <div className="cas-empty">Loading…</div>
            ) : trips.length === 0 ? (
              <div className="cas-empty">
                <p>No excursions yet.</p>
                <button
                  type="button"
                  className="cas-btn cas-btn--gold"
                  disabled={busy}
                  onClick={() =>
                    run(
                      () => seedFromHandbook(HANDBOOK_TRIPS),
                      (n) => `Added the ${n} excursions from the handbook.`
                    )
                  }
                >
                  Add the 9 handbook excursions
                </button>
                <p className="cas-hint" style={{ marginTop: 12 }}>
                  Descriptions are placeholders taken straight from the
                  handbook — edit them before opening to students.
                </p>
              </div>
            ) : (
              <table className="cas-table">
                <thead>
                  <tr>
                    <th>Excursion</th>
                    <th>Teacher</th>
                    <th>Cost</th>
                    <th>Enrolled</th>
                    <th />
                  </tr>
                </thead>
                <tbody>
                  {trips.map((trip) => {
                    const roster = byTrip[trip.id] || []
                    const min = toCount(trip.minStudents)
                    return (
                      <tr key={trip.id}>
                        <td>
                          <div className="cas-table__name">{trip.name}</div>
                          {(trip.location || trip.duration) && (
                            <div className="cas-table__sub">
                              {[trip.location, trip.duration]
                                .filter(Boolean)
                                .join(' · ')}
                            </div>
                          )}
                          {expandedTripId === trip.id && (
                            <div className="cas-table__sub" style={{ marginTop: 8 }}>
                              {roster.length === 0
                                ? 'Nobody yet.'
                                : roster
                                    .map((s) => s.name || s.email)
                                    .join(', ')}
                            </div>
                          )}
                        </td>
                        <td>{trip.leader || '—'}</td>
                        <td>
                          {costLabel(trip) || '—'}
                          {trip.costNote && (
                            <div className="cas-table__sub">{trip.costNote}</div>
                          )}
                        </td>
                        <td>
                          <button
                            type="button"
                            className="cas-linkbtn"
                            onClick={() =>
                              setExpandedTripId(
                                expandedTripId === trip.id ? null : trip.id
                              )
                            }
                          >
                            {capacityLabel(trip)}
                          </button>
                          {min > 0 && (
                            <div className="cas-table__sub">min {min}</div>
                          )}
                        </td>
                        <td className="cas-table__actions">
                          <button
                            type="button"
                            className="cas-linkbtn"
                            onClick={() => startEdit(trip)}
                          >
                            Edit
                          </button>
                          <button
                            type="button"
                            className="cas-linkbtn cas-linkbtn--danger"
                            disabled={busy}
                            onClick={() => {
                              const n = roster.length
                              const warning =
                                n > 0
                                  ? `Delete “${trip.name}”? ${n} student${
                                      n === 1 ? '' : 's'
                                    } will be released and will have to choose again.`
                                  : `Delete “${trip.name}”?`
                              if (!window.confirm(warning)) return
                              run(
                                () => deleteTrip(trip.id),
                                (released) =>
                                  released > 0
                                    ? `Deleted. ${released} student${
                                        released === 1 ? '' : 's'
                                      } released.`
                                    : 'Deleted.'
                              )
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            )}

            {trips.length > 0 && (
              <div style={{ marginTop: 22 }}>
                <button
                  type="button"
                  className="cas-btn cas-btn--ghost cas-btn--small"
                  disabled={busy}
                  onClick={() =>
                    run(
                      recountEnrolment,
                      (r) =>
                        r.corrected === 0
                          ? 'All counts already correct.'
                          : `Fixed ${r.corrected} of ${r.trips} counts.`
                    )
                  }
                >
                  Recheck enrolment counts
                </button>
                <p className="cas-hint">
                  Recalculates every count from the student selections. Only
                  needed if a number looks wrong after editing data by hand.
                </p>
              </div>
            )}
          </div>
        </section>
      </main>
    </Shell>
  )
}

function ToggleRow({ title, note, checked, disabled, onChange }) {
  return (
    <div className="cas-toggle-row">
      <div className="cas-toggle-row__text">
        <div className="cas-toggle-row__title">{title}</div>
        <div className="cas-toggle-row__note">{note}</div>
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={checked}
        aria-label={title}
        className="cas-toggle"
        disabled={disabled}
        onClick={() => onChange(!checked)}
      />
    </div>
  )
}

function Shell({ children, email, links, logoSrc }) {
  return (
    <div className="cas-app">
      <CasHeader
        section={`${CAS_CONFIG.appName} Admin`}
        email={email}
        links={links}
        logoSrc={logoSrc}
      />
      {children}
    </div>
  )
}

export default CasAdminPage
