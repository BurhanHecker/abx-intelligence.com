# Verification

What was actually run against this code, and what it proved. Everything below
was executed — none of it is "should work".

```
npm run build       61 modules transformed, clean
npm run test:unit   22/22
npm run test:rules  33/33   (Firestore emulator)
npm run test:actions 18/18  (Firestore emulator)
```

## 1. Unit tests — `tests/units.test.mjs` (22)

Capacity maths, cost formatting, CSV escaping, and the handbook data.

Notable cases:

- `maxStudents: 0` means unlimited and can never read as full.
- A count that has drifted above the cap clamps to `0 left` rather than going
  negative.
- Junk in `enrolledCount` (`-5`, `"abc"`, `undefined`) floors to 0 instead of
  producing `NaN` in the UI.
- **Status colours were checked against your Clubs screenshots**, trip by trip:
  STEM 20/20 → red, Powerlift 9/10 → orange, SAP 17/20 → orange, Serenity 7/10
  → orange, Mandala 9/20 → grey, ABA Podcast 5/16 → grey.
- CSV: `O"Brien, A` survives quoting; a cell starting `=` is neutralised so
  Excel cannot execute it as a formula.
- All nine excursions still match the handbook — every cost, every min/max.
  This test fails loudly if someone edits `seed/trips.js` carelessly.

## 2. Security rules — `tests/rules.test.mjs` (33)

Run against the Firestore emulator with the client code out of the picture, so
these describe what a student with the browser console open can actually do.

Confirmed **blocked**:

| Attempt | Result |
|---|---|
| Push `enrolledCount` past `maxStudents` | denied |
| Move the counter by 2 instead of 1 | denied |
| Change the counter *and* the name in one write | denied |
| Rename a trip, or raise its own cap | denied |
| Create or delete a trip | denied |
| Read another student's selection | denied |
| Write another student's selection | denied |
| Put someone else's email in their own selection row | denied |
| Join, or leave, while registration is closed | denied |
| Turn registration back on | denied |
| Forge an activity entry under another student's name | denied |
| Read the activity feed (it names other students) | denied |
| Read anything at all while signed out | denied |
| Sign in with a non-`@abaoman.org` account | denied |
| Present a token with no email claim, or an unverified one | denied |
| Add themselves to the admin list | denied |

Confirmed **allowed**: reading trips and settings; writing their own selection;
±1 on the counter within the cap; joining an unlimited trip; admin full access;
admin access via a `casAdmins/{uid}` document with no custom claim; admin
writes while registration is closed.

### One thing this uncovered

The first version of the rules used `request.auth.token.admin == true`. The
emulator logged *"Property admin is undefined on object"* — in the rules
language, reading a property that does not exist is an **error**, not `false`,
and an erroring clause can deny a request that should have been allowed. Every
field access now goes through `.get(key, default)`.

While confirming that, `exists()` turned out to be the other noisy call, which
led to a real improvement: the student branch is now written **before**
`isAdmin()` in every `allow` rule that has both. `isAdmin()` ends in an
`exists()` lookup, which is a billed document read — so the common case, a
student joining a trip, no longer pays for one on every write.

(The emulator still logs `evaluation error` on admin-only rules when a
non-admin is refused. That is the `casAdmins` lookup missing, which is the
correct answer; behaviour was verified in both directions.)

## 3. Transaction tests — `tests/actions.test.mjs` (18)

The real `joinTrip` / `leaveTrip` / `deleteTrip` / `recountEnrolment` against
the emulator.

**The one that matters: five students, two seats.** Five `joinTrip` calls fired
simultaneously at a trip with `maxStudents: 2`:

```
  ok   five students racing for two seats: exactly two get in
```

Exactly 2 resolved, exactly 3 rejected with `code: 'full'`, the counter landed
on exactly 2, and exactly 2 selection documents existed. No oversell.

**And the mirror case:** one student firing four overlapping switches between
two trips ends holding exactly one seat — the two counters sum to 1, with one
selection document. A student cannot end up occupying two places, or none.

Also confirmed:

- Switching decrements the old trip and increments the new one atomically.
- Joining the same trip twice is a no-op — no double increment, no duplicate
  activity entry.
- A refused join writes **nothing**: the counter is untouched and no selection
  document is created.
- Joining a deleted excursion fails with `missing` rather than corrupting state.
- Deleting an excursion releases exactly its own students and leaves others
  alone.
- `recountEnrolment` repairs a counter hand-edited to 99 and is a no-op when
  everything is already correct.
- `saveTrip` never clobbers a live `enrolledCount` while editing a trip.
- A blank "maximum students" field becomes `0` (unlimited), not `NaN`.

## 4. Visual check

All three pages were run in a browser against the emulator, seeded with the
nine real excursions and 95 students, with enrolment set to exercise every
state (full, one-left, mid, empty).

Checked against your Clubs screenshots: the navy bar and gold underline, the
three-column card grid, uppercase letterspaced teacher names, the gold progress
bar, the navy status banner with its green pill, the live board's three stat
tiles and "Filling fastest / A–Z" toggle, and the activity feed with initials
avatars and relative timestamps.

Interactions exercised end to end: joining (banner, card state and the live
count all updated together), the registration-closed state (red pill, warning,
buttons disabled, choice still visible), the admin toggles writing through to
the student page, the admin table rendering all nine excursions with cost
ranges and notes, and student search on the live board.

Three fixes came out of it:

1. The card grid was landing on four columns; the minimum track width was
   raised so it settles on three, as Clubs does.
2. A full trip's card bar stayed gold next to a red "Full" label — it now goes
   red too.
3. **The activity feed rendered "Nadine Al Mughairijoined Artistic Retreat"** —
   the name and action are spans inside a flex item and were running together
   inline. They are now `display: block`, matching the two-line layout in your
   screenshot.

Mobile (375px) was checked on all three pages: single column, no horizontal
overflow.

## Not covered

- No test signs in through real Google auth — the rules tests simulate the
  token claims instead.
- The CSV *download* (the browser file-save step) was not exercised; the CSV
  *content* is unit-tested.
- Nothing has been run against the live `aba-portal` project. First deploy
  should be to a staging project, or with **Open to students** off.
