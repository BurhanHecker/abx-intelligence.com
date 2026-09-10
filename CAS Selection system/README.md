# CAS Excursion Week — selection module

Student view, admin view and live board for CAS Excursion Week, built to sit
inside the existing ABA student portal alongside Clubs. Same visual language,
same behaviour: **one excursion per student, switchable instantly, everyone
watching spaces open and close live.**

Built from `Handbook CAS excursion week.pdf`. React + Firebase (Firestore +
Firebase Auth) — the same stack as the portal.

---

## What's here

```
src/cas/                    ← the whole module. This is what you integrate.
  index.js                  Public exports — import from here.
  config.js                 Collection names, routes, thresholds. All strings live here.
  firebase.js               Reuses the portal's Firebase app if one exists.
  theme.css                 Every style, scoped under `.cas-app`.
  lib/
    CasProvider.jsx         Supplies { user, isAdmin } to the pages.
    useCas.js               Realtime Firestore subscriptions.
    actions.js              Every write, incl. the join/switch transaction.
    format.js               Capacity, cost and time formatting.
    csv.js                  Registrations export.
  components/
    CasHeader.jsx           Navy bar + gold underline.
    TripCard.jsx            One excursion on the student page.
    CapacityBar.jsx         The 6px progress bar.
  pages/
    CasStudentPage.jsx      /cas
    CasAdminPage.jsx        /cas/admin
    CasLivePage.jsx         /cas/live
  seed/trips.js             The nine handbook excursions.

firestore.rules             MERGE into the portal's rules. Not a standalone deploy.
firestore.indexes.json      No composite indexes needed — explains why.
scripts/seed.mjs            Optional CLI seeder (the Admin page has a button too).
tests/                      Unit, security-rules and transaction tests. See VERIFICATION.md.

src/main.jsx, index.html, vite.config.js, package.json
                            Standalone harness so you can run and review the
                            module before merging. DELETE these on integration.
```

---

## Run it standalone first

```bash
npm install
cp .env.example .env     # fill in from Firebase console → Project settings
npm run dev              # http://localhost:5175/cas
```

Then visit `/cas`, `/cas/admin` and `/cas/live`. On an empty database the Admin
page offers a **"Add the 9 handbook excursions"** button — one click and you
have real data to click around.

To grant yourself admin without setting up custom claims, create an empty
document at `casAdmins/{your-uid}` in the Firebase console.

---

## Integrating into the portal

### 1. Copy the folder

Copy `src/cas/` into the portal's `src/`. Delete `src/main.jsx`, `index.html`,
`vite.config.js` and `package.json` from this repo — the portal has its own.
No new dependencies: the module uses only `react`, `firebase/app`,
`firebase/auth` and `firebase/firestore`, which the portal already has.

### 2. Mount the pages

```jsx
import { CasProvider, CasStudentPage, CasAdminPage, CasLivePage } from './cas'

// Pass the portal's own user and staff flag — the provider then does no
// auth work of its own.
<CasProvider user={portalUser} isAdmin={portalUser.isStaff}>
  <Routes>
    <Route path="/cas"       element={<CasStudentPage onSignOut={signOut} />} />
    <Route path="/cas/admin" element={<CasAdminPage   onSignOut={signOut} />} />
    <Route path="/cas/live"  element={<CasLivePage    onSignOut={signOut} />} />
  </Routes>
</CasProvider>
```

`user` needs `uid` and `email`; `displayName` is used when present.
Render `<CasProvider>` with no props and it subscribes to Firebase Auth itself.

If the paths clash with anything, change them in **`src/cas/config.js`** —
nothing else hard-codes a route.

### 3. Merge the security rules

**Do not deploy `firestore.rules` on its own** — a Firebase project has one
ruleset, so that would wipe the portal's rules. Copy the `match /casX/{...}`
blocks and the helper functions into the portal's existing rules file.

Two things to adjust:

- **`isAdmin()`** — replace with whatever the portal already uses to decide
  someone is staff, and keep it in step with `resolveIsAdmin()` in
  `src/cas/lib/CasProvider.jsx`. The two must agree, or the UI and the database
  will disagree about who can do what.
- **`isSchoolAccount()`** — currently requires a verified `@abaoman.org` email.
  If students hit *"Missing or insufficient permissions"*, this is the first
  place to look; `email_verified` is true for Google sign-in but not for every
  provider.

### 4. Add the CAS tile to the portal

The `openToStudents` flag lives at `casSettings/config`. Read it the same way
the Clubs tile reads its own flag, and show the CAS circle as locked when it is
false.

### 5. Swap the logo

The header renders a placeholder `ABA` wordmark. Pass the real asset:

```jsx
<CasStudentPage logoSrc="/aba-logo.svg" />
```

---

## How it works

### One excursion per student

Everything hangs off `casSelections/{uid}` — one document per student, keyed by
their auth uid, so a student physically cannot hold two excursions.

Switching is a **single Firestore transaction** (`joinTrip` in
`src/cas/lib/actions.js`): the old trip's count goes down and the new one's up
together, or neither does. Two students racing for the last seat cannot both
get it — Firestore retries the transaction when the trip document changes
underneath it, and the capacity check runs again on each attempt.

Firestore forbids a read after the first write inside a transaction, so each
function does **all** of its reads up front. The `// NO MORE READS` comment
marks the boundary. Keep that structure if you edit them.

### Capacity is enforced in the rules, not just the client

The transaction is a convenience. A student who opens the browser console still
cannot exceed a cap, join while registration is closed, edit a trip, read
another student's choice, or forge activity entries — the rules reject all of
it, and `npm run test:rules` proves it.

Two conventions in `firestore.rules` are load-bearing, so keep them if you edit
it. Every field access goes through `.get(key, default)`: reading a property
that does not exist is an *error* in the rules language, not `false`, and an
erroring clause can deny a request that should have been allowed. And the
student branch is written before `isAdmin()` in every rule that has both,
because `isAdmin()` ends in an `exists()` lookup — a billed document read that
the common case should not pay for.

### Why `enrolledCount` is denormalised

Students may not read other students' selections, so they cannot count a trip's
members themselves. Each trip therefore carries a counter, maintained inside
the transaction, and the rules allow students to move it by exactly ±1 and
never past the cap.

Counters are a cache, and caches drift — a hand-edit in the Firebase console
would do it. The Admin page has a **"Recheck enrolment counts"** button that
rebuilds every count from the selection documents.

### Deleting a trip releases its students

Deleting an excursion also clears `tripId` on everyone who was on it. Without
that, those students would look signed up on the export while pointing at a
document that no longer exists.

---

## Data model

**`casTrips/{tripId}`**

| Field | Type | Notes |
|---|---|---|
| `name` | string | |
| `leader` | string | "Mr Jim" |
| `description` | string | Line breaks preserved |
| `cost` | number \| null | OMR. Headline / lowest figure |
| `costTo` | number \| null | Upper figure when the price is a range |
| `costNote` | string | "incl. flights", "+ 350 OMR flights" |
| `maxStudents` | number | **0 = no limit.** The cap the rules enforce |
| `minStudents` | number | 0 = none. Reference only — see below |
| `duration` | string | "6 days / 5 nights" |
| `location` | string | Optional |
| `strands` | string[] | Creativity / Activity / Service. Stored, not displayed |
| `enrolledCount` | number | Maintained by the transaction. Never write by hand |
| `order` | number | Sort order |

**`casSelections/{uid}`** — `uid`, `email`, `name`, `tripId` (null when none),
`tripName`, `updatedAt`.

**`casActivity/{autoId}`** — `uid`, `name`, `type` (`join` / `switch` /
`leave`), `tripId`, `tripName`, `fromTripId`, `fromTripName`, `at`. Append-only;
feeds the live board.

**`casSettings/config`** — `openToStudents`, `registrationOpen`. A missing
document means both are open.

**`casAdmins/{uid}`** — presence grants admin. A fallback for before custom
claims are set up; not writable from the client.

---

## Notes on the handbook data

`src/cas/seed/trips.js` transcribes all nine excursions. **Nothing is
invented** — every figure and phrase comes from the handbook. Three things to
settle with the CAS coordinator before this goes live:

1. **Descriptions are thin.** The handbook gives real detail only for Spain and
   Bali. For the other seven, the description is a one-line restatement of the
   handbook row. Trip leaders should expand these in the Admin page before
   students choose.
2. **The handbook labels the Barcelona bike tour "ACTION"**, where every other
   entry uses Creativity / Activity / Service. Reproduced verbatim; it is most
   likely meant to read "Activity".
3. **Junior Chef has no CAS strand** in the handbook.

Also worth confirming: Spain and Egypt list a bare *"20 students"* and *"15
students"* where the others give a range. These are stored as the **maximum**
(with no minimum), which is the natural reading — but if "20 students" means
the trip needs exactly 20 to run, say so and I'll adjust.

---

## Deliberately not built

These were scoped out. Each is a small, well-isolated addition if you change
your mind:

- **Minimum-student warnings.** `minStudents` is stored and shown on the admin
  table, but students never see it and nothing is blocked by it. A "needs 15,
  has 9 — may not run" badge would be about 15 lines in `TripCard.jsx`.
- **Waitlists.** A full trip simply refuses new joins.
- **Ranked choices.** Selection is first-come-first-served, as Clubs is.
- **CAS strand chips and filtering.** `strands` is stored on every trip and
  seeded correctly; the strands also appear in the description text. Rendering
  them as chips is a few lines in `TripCard.jsx`.
- **Payment / permission-slip tracking.**
- **Year-group eligibility.**

---

## Tests

```bash
npm run build          # 61 modules, clean
npm run test:unit      # 22 tests, no emulator needed

# These two need the emulator running in another terminal (and a JDK 11+):
npm run emulator
npm run test:rules     # 33 tests — what a student can actually do
npm run test:actions   # 18 tests — the join/switch transaction
```

`test:rules` is the important one for reviewing this change: it drives the
database directly, with the client code out of the picture, and asserts that a
student cannot exceed a cap, write another student's selection, spoof an email,
edit a trip, join while registration is closed, forge activity entries, or read
the feed.

`test:actions` includes the race: five students joining a two-seat trip
simultaneously, asserting that exactly two get in.

`VERIFICATION.md` records what was run and the three bugs the process caught.

---

## Going live — suggested order

1. Merge the rules, deploy them, confirm the portal's own pages still work.
2. Seed the nine excursions (Admin page button, or `npm run seed`).
3. With **Open to students OFF**, have the trip leaders write real
   descriptions and confirm costs and caps.
4. Turn **Open to students ON** and **Registration period ON**.
5. Project `/cas/live` during the selection window.
6. When selection closes, turn **Registration period OFF** — choices freeze but
   stay readable — and export the CSV.
