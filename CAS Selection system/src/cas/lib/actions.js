/**
 * Every write the CAS module makes.
 *
 * The join/switch/leave path runs inside a Firestore transaction so that two
 * students racing for the last seat can never both get it: Firestore retries
 * the transaction when the trip document changes underneath it, and the
 * capacity check is re-evaluated on each attempt.
 *
 * TRANSACTION RULE — Firestore forbids a read after the first write inside a
 * transaction. Every function below therefore does *all* of its reads up
 * front; the "NO MORE READS" comment marks the line past which only writes
 * may appear. Keep that structure if you edit these.
 */

import {
  collection,
  doc,
  getDocs,
  query,
  runTransaction,
  serverTimestamp,
  setDoc,
  where,
  writeBatch,
} from 'firebase/firestore'
import { getDb } from '../firebase'
import { CAS_CONFIG, COL } from '../config'
import { displayNameOf, toCount } from './format'

/** Errors students should see verbatim. Anything else is a real fault. */
export class CasError extends Error {
  constructor(code, message) {
    super(message)
    this.name = 'CasError'
    this.code = code
  }
}

const settingsRefOf = (db) => doc(db, COL.settings, CAS_CONFIG.settingsDocId)

function assertRegistrationOpen(settingsSnap) {
  const data = settingsSnap.exists() ? settingsSnap.data() : {}
  if (data.openToStudents === false) {
    throw new CasError(
      'closed',
      'CAS excursions are not open at the moment.'
    )
  }
  if (data.registrationOpen === false) {
    throw new CasError(
      'closed',
      'Registration is closed — your current excursion is locked in.'
    )
  }
}

/**
 * Join `tripId`, releasing whatever the student currently holds.
 *
 * Returns { changed, from, to }.
 */
export async function joinTrip({ tripId, user }) {
  if (!tripId) throw new CasError('bad-input', 'No excursion was given.')
  if (!user?.uid) throw new CasError('signed-out', 'You are not signed in.')

  const db = getDb()
  const tripRef = doc(db, COL.trips, tripId)
  const selectionRef = doc(db, COL.selections, user.uid)

  return runTransaction(db, async (tx) => {
    // ---------- reads ----------
    const settingsSnap = await tx.get(settingsRefOf(db))
    assertRegistrationOpen(settingsSnap)

    const tripSnap = await tx.get(tripRef)
    if (!tripSnap.exists()) {
      throw new CasError('missing', 'That excursion no longer exists.')
    }
    const trip = tripSnap.data()

    const selectionSnap = await tx.get(selectionRef)
    const previousTripId = selectionSnap.exists()
      ? selectionSnap.data().tripId || null
      : null

    if (previousTripId === tripId) {
      // Already there — a double click, or two tabs open. Nothing to do.
      return { changed: false, from: trip.name, to: trip.name }
    }

    // Read the trip being released *before* any write.
    let previousRef = null
    let previousSnap = null
    if (previousTripId) {
      previousRef = doc(db, COL.trips, previousTripId)
      previousSnap = await tx.get(previousRef)
    }
    // ---------- NO MORE READS ----------

    const max = toCount(trip.maxStudents)
    const enrolled = toCount(trip.enrolledCount)
    if (max > 0 && enrolled >= max) {
      throw new CasError(
        'full',
        `${trip.name} filled up while you were looking. Pick another excursion.`
      )
    }

    tx.update(tripRef, { enrolledCount: enrolled + 1 })

    const previousName =
      previousSnap && previousSnap.exists() ? previousSnap.data().name : null
    if (previousSnap && previousSnap.exists()) {
      tx.update(previousRef, {
        enrolledCount: Math.max(0, toCount(previousSnap.data().enrolledCount) - 1),
      })
    }

    tx.set(selectionRef, {
      uid: user.uid,
      email: user.email || '',
      name: displayNameOf(user),
      tripId,
      tripName: trip.name || '',
      updatedAt: serverTimestamp(),
    })

    tx.set(doc(collection(db, COL.activity)), {
      uid: user.uid,
      name: displayNameOf(user),
      type: previousTripId ? 'switch' : 'join',
      tripId,
      tripName: trip.name || '',
      fromTripId: previousTripId,
      fromTripName: previousName,
      at: serverTimestamp(),
    })

    return { changed: true, from: previousName, to: trip.name }
  })
}

/** Release the student's current excursion. */
export async function leaveTrip({ user }) {
  if (!user?.uid) throw new CasError('signed-out', 'You are not signed in.')

  const db = getDb()
  const selectionRef = doc(db, COL.selections, user.uid)

  return runTransaction(db, async (tx) => {
    // ---------- reads ----------
    const settingsSnap = await tx.get(settingsRefOf(db))
    assertRegistrationOpen(settingsSnap)

    const selectionSnap = await tx.get(selectionRef)
    const tripId = selectionSnap.exists()
      ? selectionSnap.data().tripId || null
      : null
    if (!tripId) return { changed: false }

    const tripRef = doc(db, COL.trips, tripId)
    const tripSnap = await tx.get(tripRef)
    // ---------- NO MORE READS ----------

    if (tripSnap.exists()) {
      tx.update(tripRef, {
        enrolledCount: Math.max(0, toCount(tripSnap.data().enrolledCount) - 1),
      })
    }

    tx.set(selectionRef, {
      uid: user.uid,
      email: user.email || '',
      name: displayNameOf(user),
      tripId: null,
      tripName: '',
      updatedAt: serverTimestamp(),
    })

    tx.set(doc(collection(db, COL.activity)), {
      uid: user.uid,
      name: displayNameOf(user),
      type: 'leave',
      tripId: null,
      tripName: '',
      fromTripId: tripId,
      fromTripName: tripSnap.exists() ? tripSnap.data().name || '' : '',
      at: serverTimestamp(),
    })

    return { changed: true, from: tripSnap.exists() ? tripSnap.data().name : null }
  })
}

/* ------------------------------------------------------------------ */
/* Admin writes                                                        */
/* ------------------------------------------------------------------ */

export async function saveSettings(patch) {
  await setDoc(settingsRefOf(getDb()), { ...patch, updatedAt: serverTimestamp() }, {
    merge: true,
  })
}

/**
 * Create or update an excursion.
 *
 * `enrolledCount` is never written here — it belongs to the join/leave
 * transaction, and clobbering it from the admin form would corrupt live
 * counts. Use `recountEnrolment()` if a count ever looks wrong.
 */
export async function saveTrip(tripId, fields) {
  const db = getDb()
  const payload = {
    name: String(fields.name || '').trim(),
    leader: String(fields.leader || '').trim(),
    description: String(fields.description || '').trim(),
    location: String(fields.location || '').trim(),
    duration: String(fields.duration || '').trim(),
    costNote: String(fields.costNote || '').trim(),
    cost: numberOrNull(fields.cost),
    costTo: numberOrNull(fields.costTo),
    maxStudents: toCount(fields.maxStudents),
    minStudents: toCount(fields.minStudents),
    order: numberOrNull(fields.order) ?? 999,
    updatedAt: serverTimestamp(),
  }

  if (!payload.name) {
    throw new CasError('bad-input', 'An excursion needs a name.')
  }

  if (tripId) {
    await setDoc(doc(db, COL.trips, tripId), payload, { merge: true })
    return tripId
  }

  const ref = doc(collection(db, COL.trips))
  await setDoc(ref, {
    ...payload,
    enrolledCount: 0,
    strands: Array.isArray(fields.strands) ? fields.strands : [],
    createdAt: serverTimestamp(),
  })
  return ref.id
}

/**
 * Delete an excursion and release every student on it.
 *
 * Without the second step, deleting a trip would leave students pointing at a
 * document that no longer exists — they would look "signed up" on the export
 * but be unable to see or change their choice.
 */
export async function deleteTrip(tripId) {
  const db = getDb()
  const affected = await getDocs(
    query(collection(db, COL.selections), where('tripId', '==', tripId))
  )

  const batch = writeBatch(db)
  batch.delete(doc(db, COL.trips, tripId))
  for (const snap of affected.docs) {
    batch.update(snap.ref, {
      tripId: null,
      tripName: '',
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return affected.size
}

/**
 * Rebuild every `enrolledCount` from the selection documents.
 *
 * The counts are denormalised so that students — who are not allowed to read
 * other students' selections — can still see how full a trip is. That makes
 * them a cache, and caches can drift (a half-applied manual edit in the
 * Firebase console, say). This is the repair button.
 */
export async function recountEnrolment() {
  const db = getDb()
  const [tripsSnap, selectionsSnap] = await Promise.all([
    getDocs(collection(db, COL.trips)),
    getDocs(collection(db, COL.selections)),
  ])

  const tally = {}
  for (const snap of selectionsSnap.docs) {
    const tripId = snap.data().tripId
    if (tripId) tally[tripId] = (tally[tripId] || 0) + 1
  }

  const batch = writeBatch(db)
  let corrected = 0
  for (const snap of tripsSnap.docs) {
    const actual = tally[snap.id] || 0
    if (toCount(snap.data().enrolledCount) !== actual) {
      batch.update(snap.ref, { enrolledCount: actual })
      corrected += 1
    }
  }
  if (corrected > 0) await batch.commit()
  return { corrected, trips: tripsSnap.size }
}

/** Write the nine handbook excursions. Refuses to run if any trip exists. */
export async function seedFromHandbook(trips) {
  const db = getDb()
  const existing = await getDocs(collection(db, COL.trips))
  if (!existing.empty) {
    throw new CasError(
      'not-empty',
      `There are already ${existing.size} excursions. Seeding is only ` +
        'available on an empty collection — delete them first if you really ' +
        'want to start over.'
    )
  }

  const batch = writeBatch(db)
  for (const trip of trips) {
    const { id, ...rest } = trip
    batch.set(doc(db, COL.trips, id), {
      ...rest,
      enrolledCount: 0,
      createdAt: serverTimestamp(),
      updatedAt: serverTimestamp(),
    })
  }
  await batch.commit()
  return trips.length
}

function numberOrNull(value) {
  if (value === '' || value === null || value === undefined) return null
  const n = Number(value)
  return Number.isFinite(n) ? n : null
}
