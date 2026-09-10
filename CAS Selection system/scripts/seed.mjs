/**
 * Seed the nine handbook excursions from the command line.
 *
 * The Admin page has a "Add the 9 handbook excursions" button that does the
 * same thing and needs no setup — prefer that. This script exists for the
 * case where you would rather not click through the UI, or want to re-run
 * seeding as part of setting up a second Firebase project.
 *
 *   1. Firebase console → Project settings → Service accounts →
 *      "Generate new private key". Save it as service-account.json in this
 *      folder (it is already in .gitignore — never commit it).
 *   2. npm install
 *   3. npm run seed              # refuses to run if casTrips is not empty
 *      npm run seed -- --force   # overwrites the nine documents by id
 *
 * A service-account key bypasses security rules entirely. Delete the file
 * when you are done.
 */

import { readFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import { initializeApp, cert } from 'firebase-admin/app'
import { getFirestore, FieldValue } from 'firebase-admin/firestore'

const here = path.dirname(fileURLToPath(import.meta.url))
const keyPath = path.join(here, '..', 'service-account.json')

const force = process.argv.includes('--force')

let credentials
try {
  credentials = JSON.parse(await readFile(keyPath, 'utf8'))
} catch {
  console.error(
    `Could not read ${keyPath}.\n` +
      'Download a service account key from the Firebase console and save it there.'
  )
  process.exit(1)
}

// The seed data is plain ESM, so it can be imported directly.
const { HANDBOOK_TRIPS } = await import('../src/cas/seed/trips.js')

initializeApp({ credential: cert(credentials) })
const db = getFirestore()

const existing = await db.collection('casTrips').get()
if (!existing.empty && !force) {
  console.error(
    `casTrips already has ${existing.size} document(s). ` +
      'Re-run with --force to overwrite the nine handbook documents by id, ' +
      'or delete the collection first.'
  )
  process.exit(1)
}

const batch = db.batch()
for (const { id, ...rest } of HANDBOOK_TRIPS) {
  const ref = db.collection('casTrips').doc(id)
  const prior = existing.docs.find((d) => d.id === id)
  batch.set(
    ref,
    {
      ...rest,
      // Never reset a live count when re-seeding.
      enrolledCount: prior?.get('enrolledCount') ?? 0,
      createdAt: prior?.get('createdAt') ?? FieldValue.serverTimestamp(),
      updatedAt: FieldValue.serverTimestamp(),
    },
    { merge: true }
  )
}

// Create the settings document, closed, so nothing goes live by accident.
batch.set(
  db.collection('casSettings').doc('config'),
  {
    openToStudents: false,
    registrationOpen: false,
    updatedAt: FieldValue.serverTimestamp(),
  },
  { merge: true }
)

await batch.commit()
console.log(
  `Wrote ${HANDBOOK_TRIPS.length} excursions. ` +
    'CAS is seeded CLOSED — open it from the Admin page when you are ready.'
)
process.exit(0)
