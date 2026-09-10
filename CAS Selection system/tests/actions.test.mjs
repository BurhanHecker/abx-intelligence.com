/**
 * Transaction / integration tests for src/cas/lib/actions.js, run against the
 * Firestore emulator with permissive rules (the rules themselves are covered
 * separately by tests/rules.test.mjs).
 *
 * The one that matters most is "five students race for two seats" — the whole
 * point of doing the switch inside a transaction.
 *
 *   npm run test:actions      (with the emulator running on port 8181)
 */

import assert from 'node:assert/strict'
import { initializeApp } from 'firebase/app'
import {
  connectFirestoreEmulator,
  getFirestore,
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  query,
  where,
} from 'firebase/firestore'

const PROJECT = 'cas-actions-test'
const HOST = '127.0.0.1'
const PORT = 8181

// Permissive rules for this project only — we are testing the transaction,
// not the rules.
const res = await fetch(
  `http://${HOST}:${PORT}/emulator/v1/projects/${PROJECT}:securityRules`,
  {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      rules: {
        files: [
          {
            name: 'test.rules',
            content:
              "rules_version='2';service cloud.firestore{match /databases/{d}/documents{match /{p=**}{allow read,write:if true;}}}",
          },
        ],
      },
    }),
  }
)
assert.ok(res.ok, `could not install test rules: ${res.status}`)

const app = initializeApp({ projectId: PROJECT })
const db = getFirestore(app)
connectFirestoreEmulator(db, HOST, PORT)

// Imported only now, so firebase.js reuses the app configured above.
const {
  joinTrip, leaveTrip, deleteTrip, recountEnrolment, saveTrip, CasError,
} = await import('../src/cas/lib/actions.js')

const out = []
async function check(name, fn) {
  try { await fn(); out.push(['ok', name]) }
  catch (e) { out.push(['FAIL', name, e.message?.split('\n')[0]]) }
}

async function wipe() {
  for (const c of ['casTrips', 'casSelections', 'casActivity', 'casSettings']) {
    const snap = await getDocs(collection(db, c))
    await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
  }
}

async function seed({ open = true, trips = {} } = {}) {
  await wipe()
  await setDoc(doc(db, 'casSettings/config'), {
    openToStudents: true, registrationOpen: open,
  })
  const base = {
    kayaking: { name: 'Kayaking', leader: 'Mr Jim', maxStudents: 20, enrolledCount: 0, cost: 220 },
    sailing:  { name: 'Sailing',  leader: 'Mr Nik', maxStudents: 15, enrolledCount: 0, cost: 120 },
    ...trips,
  }
  for (const [id, t] of Object.entries(base)) await setDoc(doc(db, 'casTrips', id), t)
}

const stu = (n) => ({ uid: `s${n}`, email: `student${n}@abaoman.org`, displayName: `Student ${n}` })
const count = async (id) => (await getDoc(doc(db, 'casTrips', id))).data().enrolledCount
const sel   = async (uid) => (await getDoc(doc(db, 'casSelections', uid))).data()
const feed  = async () => (await getDocs(collection(db, 'casActivity'))).docs.map((d) => d.data())

// ---------------------------------------------------------------- join
await seed()
await check('joining increments the count and records the selection', async () => {
  const r = await joinTrip({ tripId: 'kayaking', user: stu(1) })
  assert.equal(r.changed, true)
  assert.equal(await count('kayaking'), 1)
  const s = await sel('s1')
  assert.equal(s.tripId, 'kayaking')
  assert.equal(s.tripName, 'Kayaking')
  assert.equal(s.email, 'student1@abaoman.org')
  const f = await feed()
  assert.equal(f.length, 1)
  assert.equal(f[0].type, 'join')
})

await check('joining the same trip twice is a no-op', async () => {
  const r = await joinTrip({ tripId: 'kayaking', user: stu(1) })
  assert.equal(r.changed, false)
  assert.equal(await count('kayaking'), 1, 'count must not double-increment')
  assert.equal((await feed()).length, 1, 'no extra activity entry')
})

// -------------------------------------------------------------- switch
await check('switching moves the place across atomically', async () => {
  const r = await joinTrip({ tripId: 'sailing', user: stu(1) })
  assert.equal(r.changed, true)
  assert.equal(r.from, 'Kayaking')
  assert.equal(r.to, 'Sailing')
  assert.equal(await count('kayaking'), 0, 'old trip released')
  assert.equal(await count('sailing'), 1, 'new trip taken')
  assert.equal((await sel('s1')).tripId, 'sailing')
  const f = await feed()
  assert.equal(f.filter((e) => e.type === 'switch').length, 1)
})

// --------------------------------------------------------------- leave
await check('leaving releases the place', async () => {
  const r = await leaveTrip({ user: stu(1) })
  assert.equal(r.changed, true)
  assert.equal(await count('sailing'), 0)
  assert.equal((await sel('s1')).tripId, null)
  assert.ok((await feed()).some((e) => e.type === 'leave'))
})

await check('leaving with no excursion is a no-op', async () => {
  const r = await leaveTrip({ user: stu(1) })
  assert.equal(r.changed, false)
})

// ------------------------------------------------------------ capacity
await seed({ trips: { tiny: { name: 'Tiny', maxStudents: 1, enrolledCount: 0 } } })
await check('a full trip refuses the next student', async () => {
  await joinTrip({ tripId: 'tiny', user: stu(1) })
  await assert.rejects(
    () => joinTrip({ tripId: 'tiny', user: stu(2) }),
    (e) => e instanceof CasError && e.code === 'full'
  )
  assert.equal(await count('tiny'), 1, 'count unchanged by the refusal')
  const s2 = await getDoc(doc(db, 'casSelections/s2'))
  assert.equal(s2.exists(), false, 'no selection written for the refused student')
})

await seed({ trips: { open: { name: 'Open', maxStudents: 0, enrolledCount: 0 } } })
await check('maxStudents 0 means unlimited', async () => {
  for (let i = 1; i <= 6; i++) await joinTrip({ tripId: 'open', user: stu(i) })
  assert.equal(await count('open'), 6)
})

// --------------------------------------------- THE RACE FOR THE LAST SEAT
await seed({ trips: { race: { name: 'Race', maxStudents: 2, enrolledCount: 0 } } })
await check('five students racing for two seats: exactly two get in', async () => {
  const results = await Promise.allSettled(
    [1, 2, 3, 4, 5].map((i) => joinTrip({ tripId: 'race', user: stu(i) }))
  )
  const won = results.filter((r) => r.status === 'fulfilled').length
  const lost = results.filter(
    (r) => r.status === 'rejected' && r.reason?.code === 'full'
  ).length
  assert.equal(won, 2, `expected 2 winners, got ${won}`)
  assert.equal(lost, 3, `expected 3 refused-as-full, got ${lost}`)
  assert.equal(await count('race'), 2, 'counter must equal the cap exactly')

  const holders = await getDocs(
    query(collection(db, 'casSelections'), where('tripId', '==', 'race'))
  )
  assert.equal(holders.size, 2, 'exactly two selection documents')
})

await seed({ trips: { a: { name: 'A', maxStudents: 5, enrolledCount: 0 },
                      b: { name: 'B', maxStudents: 5, enrolledCount: 0 } } })
await check('one student switching repeatedly never occupies two seats', async () => {
  await Promise.allSettled([
    joinTrip({ tripId: 'a', user: stu(9) }),
    joinTrip({ tripId: 'b', user: stu(9) }),
    joinTrip({ tripId: 'a', user: stu(9) }),
    joinTrip({ tripId: 'b', user: stu(9) }),
  ])
  const total = (await count('a')) + (await count('b'))
  assert.equal(total, 1, `student holds exactly one seat, counts sum to ${total}`)
  const holders = await getDocs(
    query(collection(db, 'casSelections'), where('tripId', '!=', null))
  )
  assert.equal(holders.size, 1)
})

// ---------------------------------------------------- registration closed
await seed({ open: false })
await check('closed registration refuses a join', () =>
  assert.rejects(
    () => joinTrip({ tripId: 'kayaking', user: stu(1) }),
    (e) => e instanceof CasError && e.code === 'closed'
  ))
await check('closed registration refuses a leave', async () => {
  await seed()
  await joinTrip({ tripId: 'kayaking', user: stu(1) })
  await setDoc(doc(db, 'casSettings/config'),
    { openToStudents: true, registrationOpen: false })
  await assert.rejects(
    () => leaveTrip({ user: stu(1) }),
    (e) => e instanceof CasError && e.code === 'closed'
  )
})

// --------------------------------------------------------- missing trip
await seed()
await check('joining a deleted excursion fails cleanly', () =>
  assert.rejects(
    () => joinTrip({ tripId: 'does-not-exist', user: stu(1) }),
    (e) => e instanceof CasError && e.code === 'missing'
  ))

// ------------------------------------------------------------- deletion
await seed()
await check('deleting an excursion releases everyone on it', async () => {
  await joinTrip({ tripId: 'kayaking', user: stu(1) })
  await joinTrip({ tripId: 'kayaking', user: stu(2) })
  await joinTrip({ tripId: 'sailing', user: stu(3) })
  const released = await deleteTrip('kayaking')
  assert.equal(released, 2)
  assert.equal((await sel('s1')).tripId, null)
  assert.equal((await sel('s2')).tripId, null)
  assert.equal((await sel('s3')).tripId, 'sailing', 'other trips untouched')
  assert.equal((await getDoc(doc(db, 'casTrips/kayaking'))).exists(), false)
})

// -------------------------------------------------------------- recount
await seed()
await check('recount repairs a drifted counter', async () => {
  await joinTrip({ tripId: 'kayaking', user: stu(1) })
  await joinTrip({ tripId: 'kayaking', user: stu(2) })
  // Simulate a hand-edit in the Firebase console.
  await setDoc(doc(db, 'casTrips/kayaking'),
    { name: 'Kayaking', maxStudents: 20, enrolledCount: 99 })
  const r = await recountEnrolment()
  assert.equal(r.corrected, 1)
  assert.equal(await count('kayaking'), 2)
})

await check('recount is a no-op when everything is correct', async () => {
  const r = await recountEnrolment()
  assert.equal(r.corrected, 0)
})

// ------------------------------------------------------- admin saveTrip
await seed()
await check('saveTrip never clobbers the live count', async () => {
  await joinTrip({ tripId: 'kayaking', user: stu(1) })
  await saveTrip('kayaking', {
    name: 'Kayaking (updated)', leader: 'Mr Jim', cost: 240, maxStudents: 25, order: 1,
  })
  assert.equal(await count('kayaking'), 1, 'count survived the edit')
  const t = (await getDoc(doc(db, 'casTrips/kayaking'))).data()
  assert.equal(t.name, 'Kayaking (updated)')
  assert.equal(t.cost, 240)
  assert.equal(t.maxStudents, 25)
})

await check('saveTrip rejects a nameless excursion', () =>
  assert.rejects(() => saveTrip(null, { name: '   ' }),
    (e) => e instanceof CasError && e.code === 'bad-input'))

await check('blank maxStudents becomes 0 (unlimited), not NaN', async () => {
  const id = await saveTrip(null, { name: 'Blank cap', maxStudents: '', cost: '' })
  const t = (await getDoc(doc(db, 'casTrips', id))).data()
  assert.equal(t.maxStudents, 0)
  assert.equal(t.cost, null)
  assert.equal(t.enrolledCount, 0)
})

let bad = 0
for (const [s, n, d] of out) {
  if (s === 'FAIL') bad++
  console.log(`${s === 'ok' ? '  ok  ' : ' FAIL '} ${n}${d ? '  — ' + d : ''}`)
}
console.log(`\n${out.length - bad}/${out.length} passed`)
process.exit(bad ? 1 : 0)
