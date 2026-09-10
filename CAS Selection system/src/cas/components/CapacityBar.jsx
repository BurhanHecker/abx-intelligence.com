import { capacityOf, spacesTone } from '../lib/format'
import { CAS_CONFIG } from '../config'

/**
 * The 6px progress bar.
 *
 * `variant="accent"` is the student card's gold bar; `variant="status"` is the
 * live board's, which goes navy → orange → red as a trip fills. Both come
 * straight from the Clubs screenshots.
 */
export function CapacityBar({ trip, variant = 'accent' }) {
  const { ratio, unlimited } = capacityOf(trip)

  // An unlimited trip has no bar to draw on a card. The live board keeps an
  // empty track so the four columns of every row stay aligned.
  if (unlimited && variant === 'accent') return null

  const percent = unlimited ? 0 : Math.round(ratio * 100)

  const tone = spacesTone(trip)

  let modifier = ''
  if (variant === 'status') {
    if (tone === 'full') modifier = 'cas-bar__fill--full'
    else if (ratio >= CAS_CONFIG.busyFillRatio) modifier = 'cas-bar__fill--low'
    else modifier = 'cas-bar__fill--ok'
  } else if (tone === 'full') {
    // Card bars are gold while a trip is filling; a full one goes red so it
    // agrees with the red "Full" label beside it.
    modifier = 'cas-bar__fill--full'
  }

  return (
    <div
      className="cas-bar"
      role="progressbar"
      aria-valuenow={percent}
      aria-valuemin={0}
      aria-valuemax={100}
      aria-label={`${trip?.name || 'Excursion'} places filled`}
    >
      <div
        className={`cas-bar__fill ${modifier}`.trim()}
        style={{ width: `${percent}%` }}
      />
    </div>
  )
}
