/**
 * Standalone harness — `npm run dev` renders the three CAS pages against a
 * real Firebase project so the module can be reviewed before it is merged
 * into the portal.
 *
 * THIS FILE IS NOT PART OF THE MODULE. When integrating, delete it (and
 * index.html, vite.config.js, package.json) and mount the pages from
 * `src/cas` inside the portal's own router. See README.
 */

import { StrictMode, useEffect, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  GoogleAuthProvider,
  createUserWithEmailAndPassword,
  onAuthStateChanged,
  signInWithEmailAndPassword,
  signInWithPopup,
  signOut,
} from 'firebase/auth'
import { getAuthInstance } from './cas/firebase'
import {
  CasProvider,
  CasStudentPage,
  CasAdminPage,
  CasLivePage,
  CAS_CONFIG,
} from './cas'
import './cas/theme.css'

function currentPage() {
  const path = window.location.pathname.replace(/\/+$/, '') || '/'
  if (path === CAS_CONFIG.routes.admin) return 'admin'
  if (path === CAS_CONFIG.routes.live) return 'live'
  return 'student'
}

const useEmulators = import.meta.env?.VITE_USE_EMULATORS === '1'

/**
 * Against the emulators there is no Google popup, so sign in with a plain
 * email and password instead. Emulator-only — never reachable in a real build.
 */
function SignIn() {
  const [email, setEmail] = useState('student1@abaoman.org')
  const [error, setError] = useState(null)

  async function emulatorSignIn() {
    const auth = getAuthInstance()
    try {
      await signInWithEmailAndPassword(auth, email, 'password123')
    } catch {
      try {
        await createUserWithEmailAndPassword(auth, email, 'password123')
      } catch (e) {
        setError(e.message)
      }
    }
  }

  return (
    <div className="cas-app">
      <div className="cas-center">
        <div>
          <p style={{ marginBottom: 20 }}>Sign in with your ABA account.</p>
          {useEmulators ? (
            <>
              <input
                className="cas-input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                style={{ marginBottom: 12 }}
              />
              <button
                type="button"
                className="cas-btn cas-btn--primary"
                onClick={emulatorSignIn}
              >
                Sign in (emulator)
              </button>
            </>
          ) : (
            <button
              type="button"
              className="cas-btn cas-btn--primary"
              onClick={() =>
                signInWithPopup(getAuthInstance(), new GoogleAuthProvider())
              }
            >
              Sign in with Google
            </button>
          )}
          {error && <p className="cas-hint">{error}</p>}
        </div>
      </div>
    </div>
  )
}

function App() {
  const [page, setPage] = useState(currentPage)
  const [user, setUser] = useState(null)
  const [ready, setReady] = useState(false)

  useEffect(() => {
    const onPop = () => setPage(currentPage())
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [])

  useEffect(
    () =>
      onAuthStateChanged(getAuthInstance(), (u) => {
        setUser(u)
        setReady(true)
      }),
    []
  )

  if (!ready) {
    return <div className="cas-app"><div className="cas-center">Loading…</div></div>
  }

  if (!user) return <SignIn />

  const handleSignOut = () => signOut(getAuthInstance())
  const props = { onSignOut: handleSignOut }

  if (page === 'admin') return <CasAdminPage {...props} />
  if (page === 'live') return <CasLivePage {...props} />
  return <CasStudentPage {...props} />
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <CasProvider>
      <App />
    </CasProvider>
  </StrictMode>
)
