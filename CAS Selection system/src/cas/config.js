/**
 * CAS Excursion Week — single source of truth for names, paths and tuning.
 *
 * INTEGRATION NOTE
 * ----------------
 * Every collection name, route and threshold the CAS module uses lives here.
 * If the student portal already owns any of these names, change them in this
 * file only — nothing else in the module hard-codes a string.
 */

export const CAS_CONFIG = {
  /** Firestore collection / document names. */
  collections: {
    trips: 'casTrips',
    selections: 'casSelections',
    activity: 'casActivity',
    settings: 'casSettings',
    /** Fallback admin list — see `isAdmin()` in lib/auth.js. */
    admins: 'casAdmins',
  },

  /** The single settings document, at `casSettings/config`. */
  settingsDocId: 'config',

  /**
   * Routes. These are used for the in-app links only (Portal / Admin /
   * Live board buttons in the header). Wire the same paths into the portal's
   * router — see README "Mounting the pages".
   */
  routes: {
    portal: '/',
    student: '/cas',
    admin: '/cas/admin',
    live: '/cas/live',
  },

  /** Shown in the header, next to the ABA mark. */
  appName: 'CAS',

  /** Currency for all costs. Costs are stored as plain numbers. */
  currency: 'OMR',

  /** How many activity entries the live board keeps on screen. */
  activityFeedLimit: 25,

  /**
   * A trip with `remaining <= lowSpaceThreshold` is drawn in the "almost gone"
   * orange. Derived from the Clubs board, where "3 LEFT" is orange and
   * "11 LEFT" is grey.
   */
  lowSpaceThreshold: 3,

  /** Progress bar turns orange at or above this fill ratio (live board only). */
  busyFillRatio: 0.75,
}

export const COL = CAS_CONFIG.collections
