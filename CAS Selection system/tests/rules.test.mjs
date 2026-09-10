/**
 * Security-rules tests. These are the important ones: they assert that the
 * rules stop what they claim to stop, with the client code out of the picture
 * entirely — a student with the browser console open gets no further.
 *
 * Requires the Firestore emulator (and a JDK 11+):
 *
 *   npx firebase emulators:exec --only firestore --project cas-test \
 *     "node tests/rules.test.mjs"
 *
 * or, with an emulator already running on port 8181:
 *
 *   npm run test:rules
 */
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import {
  initializeTestEnvironment,
  assertFails,
  assertSucceeds,
} from '@firebase/rules-unit-testing'
import {
  doc, getDoc, setDoc, updateDoc, collection, addDoc, getDocs,
} from 'firebase/firestore'

const results = []
async function check(name, fn) {
  try { await fn(); results.push(['PASS', name]) }
  catch (e) { results.push(['FAIL', name, e.message?.split('\n')[0]]) }
}

const env = await initializeTestEnvironment({
  projectId: 'cas-test',
  firestore: {
    host: '127.0.0.1', port: 8181,
    rules: readFileSync(new URL('../firestore.rules', import.meta.url), 'utf8'),
  },
})

const student = (uid, email) => env
  .authenticatedContext(uid, { email, email_verified: true })
  .firestore()
const outsider = env
  .authenticatedContext('out1', { email: 'x@gmail.com', email_verified: true })
  .firestore()
const admin = env
  .authenticatedContext('adm1', { email: 'staff@abaoman.org', email_verified: true, admin: true })
  .firestore()
const anon = env.unauthenticatedContext().firestore()
// An admin with NO custom claim, relying on the casAdmins/{uid} fallback.
const docAdmin = env
  .authenticatedContext('adm2', { email: 'coord@abaoman.org', email_verified: true })
  .firestore()
// A signed-in account with no email claim at all (e.g. phone auth).
const noEmail = env.authenticatedContext('ne1', {}).firestore()

async function reset(seed) {
  await env.clearFirestore()
  await env.withSecurityRulesDisabled(async (ctx) => {
    const db = ctx.firestore()
    await setDoc(doc(db, 'casSettings/config'), {
      openToStudents: true, registrationOpen: true,
    })
    await setDoc(doc(db, 'casTrips/kayaking'), {
      name: 'Kayaking', leader: 'Mr Jim', maxStudents: 2, enrolledCount: 0, cost: 220,
    })
    await setDoc(doc(db, 'casTrips/sailing'), {
      name: 'Sailing', leader: 'Mr Nik', maxStudents: 0, enrolledCount: 5,
    })
    await setDoc(doc(db, 'casAdmins/adm2'), { note: 'CAS coordinator' })
    if (seed) await seed(db)
  })
}

const S1 = () => student('s1', 'ali@abaoman.org')
const S2 = () => student('s2', 'sara@abaoman.org')

// ---- reads -----------------------------------------------------------
await reset()
await check('student can read trips', () =>
  assertSucceeds(getDoc(doc(S1(), 'casTrips/kayaking'))))
await check('anonymous cannot read trips', () =>
  assertFails(getDoc(doc(anon, 'casTrips/kayaking'))))
await check('student can read settings', () =>
  assertSucceeds(getDoc(doc(S1(), 'casSettings/config'))))

// ---- selections ------------------------------------------------------
await check('student writes own selection', () =>
  assertSucceeds(setDoc(doc(S1(), 'casSelections/s1'), {
    uid: 's1', email: 'ali@abaoman.org', name: 'Ali', tripId: 'kayaking', tripName: 'Kayaking',
  })))
await check("student CANNOT write another student's selection", () =>
  assertFails(setDoc(doc(S1(), 'casSelections/s2'), {
    uid: 's2', email: 'sara@abaoman.org', tripId: 'kayaking',
  })))
await check("student CANNOT read another student's selection", () =>
  assertFails(getDoc(doc(S2(), 'casSelections/s1'))))
await check('student CANNOT spoof a different email', () =>
  assertFails(setDoc(doc(S2(), 'casSelections/s2'), {
    uid: 's2', email: 'headteacher@abaoman.org', tripId: 'kayaking',
  })))
await check('admin can read all selections', () =>
  assertSucceeds(getDocs(collection(admin, 'casSelections'))))
await check('non-school account is rejected', () =>
  assertFails(setDoc(doc(outsider, 'casSelections/out1'), {
    uid: 'out1', email: 'x@gmail.com', tripId: 'kayaking',
  })))

// ---- capacity --------------------------------------------------------
await reset()
await check('student may take a place (+1)', () =>
  assertSucceeds(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 1 })))
await check('student may release a place (-1)', () =>
  assertSucceeds(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 0 })))
await check('student CANNOT jump the counter by 2', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 2 })))

await reset(async (db) => {
  await setDoc(doc(db, 'casTrips/kayaking'), {
    name: 'Kayaking', maxStudents: 2, enrolledCount: 2,
  })
})
await check('student CANNOT exceed maxStudents', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 3 })))
await check('unlimited trip (max 0) accepts +1', () =>
  assertSucceeds(updateDoc(doc(S1(), 'casTrips/sailing'), { enrolledCount: 6 })))

await reset()
await check('student CANNOT edit trip name', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { name: 'Hacked' })))
await check('student CANNOT raise maxStudents', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { maxStudents: 99 })))
await check('student CANNOT change count AND name together', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 1, name: 'X' })))
await check('student CANNOT create a trip', () =>
  assertFails(setDoc(doc(S1(), 'casTrips/fake'), { name: 'Fake', maxStudents: 0, enrolledCount: 0 })))
await check('admin CAN create a trip', () =>
  assertSucceeds(setDoc(doc(admin, 'casTrips/new'), { name: 'New', maxStudents: 5, enrolledCount: 0 })))

// ---- registration closed --------------------------------------------
await reset(async (db) => {
  await setDoc(doc(db, 'casSettings/config'), {
    openToStudents: true, registrationOpen: false,
  })
})
await check('closed registration blocks the counter', () =>
  assertFails(updateDoc(doc(S1(), 'casTrips/kayaking'), { enrolledCount: 1 })))
await check('closed registration blocks the selection', () =>
  assertFails(setDoc(doc(S1(), 'casSelections/s1'), {
    uid: 's1', email: 'ali@abaoman.org', tripId: 'kayaking',
  })))
await check('admin can still write while closed', () =>
  assertSucceeds(updateDoc(doc(admin, 'casTrips/kayaking'), { enrolledCount: 1 })))
await check('student CANNOT open registration themselves', () =>
  assertFails(setDoc(doc(S1(), 'casSettings/config'), { registrationOpen: true })))

// ---- admin fallback + malformed tokens -------------------------------
await reset()
await check('casAdmins document grants admin without a custom claim', () =>
  assertSucceeds(getDocs(collection(docAdmin, 'casSelections'))))
await check('casAdmins admin can create a trip', () =>
  assertSucceeds(setDoc(doc(docAdmin, 'casTrips/fallback'), {
    name: 'Fallback', maxStudents: 3, enrolledCount: 0,
  })))
await check('casAdmins list is not writable from the client', () =>
  assertFails(setDoc(doc(admin, 'casAdmins/evil'), { note: 'me too' })))
await check('a token with no email claim is rejected', () =>
  assertFails(setDoc(doc(noEmail, 'casSelections/ne1'), { uid: 'ne1', tripId: 'kayaking' })))
await check('unverified email is rejected', () =>
  assertFails(setDoc(
    doc(env.authenticatedContext('u1', { email: 'u@abaoman.org', email_verified: false }).firestore(),
        'casSelections/u1'),
    { uid: 'u1', email: 'u@abaoman.org', tripId: 'kayaking' })))
await check('trip with no maxStudents field behaves as unlimited', async () => {
  await env.withSecurityRulesDisabled(async (ctx) => {
    await setDoc(doc(ctx.firestore(), 'casTrips/nomax'), { name: 'No max', enrolledCount: 0 })
  })
  await assertSucceeds(updateDoc(doc(S1(), 'casTrips/nomax'), { enrolledCount: 1 }))
})

// ---- activity feed ---------------------------------------------------
await reset()
await check('student can append their own activity', () =>
  assertSucceeds(addDoc(collection(S1(), 'casActivity'), {
    uid: 's1', name: 'Ali', type: 'join', tripId: 'kayaking', tripName: 'Kayaking',
  })))
await check("student CANNOT forge someone else's activity", () =>
  assertFails(addDoc(collection(S1(), 'casActivity'), {
    uid: 's2', name: 'Sara', type: 'join', tripId: 'kayaking',
  })))
await check('student CANNOT read the activity feed', () =>
  assertFails(getDocs(collection(S1(), 'casActivity'))))
await check('admin CAN read the activity feed', () =>
  assertSucceeds(getDocs(collection(admin, 'casActivity'))))

await env.cleanup()

let failed = 0
for (const [status, name, detail] of results) {
  if (status === 'FAIL') failed++
  console.log(`${status === 'PASS' ? '  ok  ' : ' FAIL '} ${name}${detail ? '  — ' + detail : ''}`)
}
console.log(`\n${results.length - failed}/${results.length} passed`)
process.exit(failed ? 1 : 0)
