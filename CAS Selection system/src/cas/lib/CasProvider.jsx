/**
 * Supplies the signed-in user and their admin flag to every CAS page.
 *
 * INTEGRATION NOTE
 * ----------------
 * Two ways to use this:
 *
 * 1. Standalone (what `src/main.jsx` does) — render <CasProvider> with no
 *    props and it subscribes to Firebase Auth itself.
 *
 * 2. Inside the portal — the portal already knows who is signed in and
 *    whether they are staff, so pass that down and skip all the work here:
 *
 *      <CasProvider user={portalUser} isAdmin={portalUser.isStaff}>
 *        <CasStudentPage />
 *      </CasProvider>
 *
 *    `user` needs `uid` and `email`; `displayName` is used when present.
 */

import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from 'react'
import { onAuthStateChanged, getIdTokenResult } from 'firebase/auth'
import { doc, getDoc } from 'firebase/firestore'
import { getAuthInstance, getDb } from '../firebase'
import { COL } from '../config'

const CasContext = createContext({ user: null, isAdmin: false, loading: true })

export function CasProvider({ children, user: userProp, isAdmin: isAdminProp }) {
  const controlled = userProp !== undefined

  const [authUser, setAuthUser] = useState(null)
  const [derivedAdmin, setDerivedAdmin] = useState(false)
  const [loading, setLoading] = useState(!controlled)

  useEffect(() => {
    if (controlled) return undefined
    let cancelled = false
    const unsub = onAuthStateChanged(getAuthInstance(), async (u) => {
      if (cancelled) return
      setAuthUser(u || null)
      if (!u) {
        setDerivedAdmin(false)
        setLoading(false)
        return
      }
      const admin = await resolveIsAdmin(u)
      if (cancelled) return
      setDerivedAdmin(admin)
      setLoading(false)
    })
    return () => {
      cancelled = true
      unsub()
    }
  }, [controlled])

  const value = useMemo(() => {
    if (controlled) {
      return {
        user: userProp || null,
        isAdmin: Boolean(isAdminProp),
        loading: false,
      }
    }
    return { user: authUser, isAdmin: derivedAdmin, loading }
  }, [controlled, userProp, isAdminProp, authUser, derivedAdmin, loading])

  return <CasContext.Provider value={value}>{children}</CasContext.Provider>
}

export function useCasUser() {
  return useContext(CasContext)
}

/**
 * Admin test, in priority order:
 *   1. A custom claim (`admin` or `staff`) on the ID token — the right answer
 *      long-term, and the one the security rules also check.
 *   2. A document at `casAdmins/{uid}` — a no-Cloud-Functions fallback so the
 *      module works on day one.
 *
 * REPLACE THIS with whatever the student portal already uses to decide that
 * someone is staff, and mirror the same test in firestore.rules `isAdmin()`.
 */
async function resolveIsAdmin(user) {
  try {
    const token = await getIdTokenResult(user)
    if (token?.claims?.admin === true || token?.claims?.staff === true) {
      return true
    }
  } catch {
    // Token unavailable — fall through to the Firestore check.
  }
  try {
    const snap = await getDoc(doc(getDb(), COL.admins, user.uid))
    return snap.exists()
  } catch {
    // Rules may forbid reading the admin list; treat as "not an admin".
    return false
  }
}
