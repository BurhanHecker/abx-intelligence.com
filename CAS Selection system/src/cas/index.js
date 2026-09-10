/**
 * Public surface of the CAS module. Import from here, not from inner files:
 *
 *   import { CasProvider, CasStudentPage } from './cas'
 */

export { CasProvider, useCasUser } from './lib/CasProvider'
export { CasStudentPage } from './pages/CasStudentPage'
export { CasAdminPage } from './pages/CasAdminPage'
export { CasLivePage } from './pages/CasLivePage'
export { CAS_CONFIG } from './config'
export { HANDBOOK_TRIPS } from './seed/trips'
export {
  CasError,
  joinTrip,
  leaveTrip,
  saveTrip,
  deleteTrip,
  saveSettings,
  recountEnrolment,
  seedFromHandbook,
} from './lib/actions'
export {
  useCasSettings,
  useCasTrips,
  useMySelection,
  useAllSelections,
  useCasActivity,
} from './lib/useCas'
export { buildRegistrationsCsv, downloadCsv } from './lib/csv'
