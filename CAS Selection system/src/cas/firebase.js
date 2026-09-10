/**
 * Firebase handles.
 *
 * INTEGRATION NOTE
 * ----------------
 * This module is deliberately defensive: `initializeApp` is only called when
 * no Firebase app exists yet. When the CAS pages are mounted inside the
 * student portal, the portal will already have initialised Firebase, and this
 * file will quietly reuse that app — so there is no second connection, no
 * second auth session, and nothing to delete from the portal's own setup.
 *
 * If the portal exports its own `db` / `auth`, you can instead delete the
 * bodies below and re-export the portal's:
 *
 *     export { db, auth } from '../../firebase'
 */

import { getApp, getApps, initializeApp } from 'firebase/app'
import { connectAuthEmulator, getAuth } from 'firebase/auth'
import { connectFirestoreEmulator, getFirestore } from 'firebase/firestore'

/** Only read when this module has to create the app itself (standalone dev). */
const standaloneConfig = {
  apiKey: import.meta.env?.VITE_FIREBASE_API_KEY,
  authDomain: import.meta.env?.VITE_FIREBASE_AUTH_DOMAIN,
  projectId: import.meta.env?.VITE_FIREBASE_PROJECT_ID,
  storageBucket: import.meta.env?.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env?.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId: import.meta.env?.VITE_FIREBASE_APP_ID,
}

export function getCasApp() {
  if (getApps().length > 0) return getApp()
  if (!standaloneConfig.projectId) {
    throw new Error(
      'CAS: no Firebase app found and no VITE_FIREBASE_* env vars set. ' +
        'Either mount the CAS pages inside the portal (which initialises ' +
        'Firebase itself) or copy .env.example to .env and fill it in.'
    )
  }
  return initializeApp(standaloneConfig)
}

/**
 * Point at the local Firebase emulators instead of the real project.
 * Set VITE_USE_EMULATORS=1 in .env. Never true in a production build.
 */
const useEmulators = import.meta.env?.VITE_USE_EMULATORS === '1'

let _db = null
let _auth = null

export function getDb() {
  if (!_db) {
    _db = getFirestore(getCasApp())
    if (useEmulators) connectFirestoreEmulator(_db, '127.0.0.1', 8181)
  }
  return _db
}

export function getAuthInstance() {
  if (!_auth) {
    _auth = getAuth(getCasApp())
    if (useEmulators) {
      connectAuthEmulator(_auth, 'http://127.0.0.1:9099', { disableWarnings: true })
    }
  }
  return _auth
}
