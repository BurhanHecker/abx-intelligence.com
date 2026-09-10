/**
 * Realtime Firestore subscriptions.
 *
 * Everything the CAS pages render comes through these hooks, so all three
 * pages update live the moment anyone joins, leaves or switches — the same
 * behaviour as the Clubs live board.
 */

import { useEffect, useMemo, useState } from 'react'
import {
  collection,
  doc,
  limit as fsLimit,
  onSnapshot,
  orderBy,
  query,
} from 'firebase/firestore'
import { getDb } from '../firebase'
import { CAS_CONFIG, COL } from '../config'
import { sortTrips } from './format'

/** `casSettings/config` — the two availability switches. */
export function useCasSettings() {
  const [state, setState] = useState({
    settings: { openToStudents: true, registrationOpen: true },
    loading: true,
    error: null,
  })

  useEffect(() => {
    const ref = doc(getDb(), COL.settings, CAS_CONFIG.settingsDocId)
    return onSnapshot(
      ref,
      (snap) => {
        const data = snap.exists() ? snap.data() : {}
        setState({
          settings: {
            // Absent document = everything open. The admin page writes the
            // document the first time either switch is touched.
            openToStudents: data.openToStudents !== false,
            registrationOpen: data.registrationOpen !== false,
          },
          loading: false,
          error: null,
        })
      },
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [])

  return state
}

/**
 * All excursions, sorted by `order`.
 *
 * Sorting happens in JS rather than in the query: there are a handful of
 * documents, and it keeps the module free of composite-index requirements.
 */
export function useCasTrips() {
  const [state, setState] = useState({ trips: [], loading: true, error: null })

  useEffect(() => {
    const ref = collection(getDb(), COL.trips)
    return onSnapshot(
      ref,
      (snap) => {
        const trips = snap.docs.map((d) => ({ id: d.id, ...d.data() }))
        setState({ trips: sortTrips(trips), loading: false, error: null })
      },
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [])

  return state
}

/** The signed-in student's own selection document. */
export function useMySelection(uid) {
  const [state, setState] = useState({
    selection: null,
    loading: Boolean(uid),
    error: null,
  })

  useEffect(() => {
    if (!uid) {
      setState({ selection: null, loading: false, error: null })
      return undefined
    }
    setState((s) => ({ ...s, loading: true }))
    const ref = doc(getDb(), COL.selections, uid)
    return onSnapshot(
      ref,
      (snap) => {
        setState({
          selection: snap.exists() ? { id: snap.id, ...snap.data() } : null,
          loading: false,
          error: null,
        })
      },
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [uid])

  return state
}

/**
 * Every student's selection. Admin and live board only — the security rules
 * reject this read for students.
 */
export function useAllSelections(enabled = true) {
  const [state, setState] = useState({
    selections: [],
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    if (!enabled) {
      setState({ selections: [], loading: false, error: null })
      return undefined
    }
    const ref = collection(getDb(), COL.selections)
    return onSnapshot(
      ref,
      (snap) => {
        setState({
          selections: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          loading: false,
          error: null,
        })
      },
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [enabled])

  return state
}

/** Newest-first activity feed for the live board. */
export function useCasActivity(enabled = true, max = CAS_CONFIG.activityFeedLimit) {
  const [state, setState] = useState({
    entries: [],
    loading: enabled,
    error: null,
  })

  useEffect(() => {
    if (!enabled) {
      setState({ entries: [], loading: false, error: null })
      return undefined
    }
    const q = query(
      collection(getDb(), COL.activity),
      orderBy('at', 'desc'),
      fsLimit(max)
    )
    return onSnapshot(
      q,
      (snap) => {
        setState({
          entries: snap.docs.map((d) => ({ id: d.id, ...d.data() })),
          loading: false,
          error: null,
        })
      },
      (error) => setState((s) => ({ ...s, loading: false, error }))
    )
  }, [enabled, max])

  return state
}

/** `{ [tripId]: Selection[] }`, for the admin roster and student search. */
export function useSelectionsByTrip(selections) {
  return useMemo(() => {
    const map = {}
    for (const s of selections) {
      if (!s.tripId) continue
      if (!map[s.tripId]) map[s.tripId] = []
      map[s.tripId].push(s)
    }
    for (const list of Object.values(map)) {
      list.sort((a, b) =>
        String(a.name || a.email || '').localeCompare(
          String(b.name || b.email || '')
        )
      )
    }
    return map
  }, [selections])
}
