import { CapacityBar } from './CapacityBar'
import {
  capacityLabel,
  capacityOf,
  costLabel,
  spacesLabel,
  spacesTone,
} from '../lib/format'

/**
 * One excursion on the student page.
 *
 * The card is intentionally dumb: it renders what it is given and reports
 * clicks upward. All the rules about who may join what live in the page and,
 * authoritatively, in the transaction and the security rules.
 */
export function TripCard({
  trip,
  isMine,
  canChange,
  /** True only for the card whose button was pressed. */
  busy,
  /** True while any action is in flight — every button locks, one shows work. */
  pending,
  hasOtherSelection,
  onJoin,
  onLeave,
}) {
  const cap = capacityOf(trip)
  const cost = costLabel(trip)
  const tone = spacesTone(trip)
  const blockedByFull = cap.isFull && !isMine

  let actionLabel = 'Join excursion'
  if (hasOtherSelection) actionLabel = 'Switch to this'
  if (blockedByFull) actionLabel = 'Full'

  return (
    <article className={`cas-trip${isMine ? ' cas-trip--mine' : ''}`}>
      <h3 className="cas-trip__name">{trip.name}</h3>
      {trip.leader && <p className="cas-trip__leader">{trip.leader}</p>}

      {cost && (
        <p className="cas-trip__cost">
          <span className="cas-trip__cost-figure">{cost}</span>
          {trip.costNote && (
            <span className="cas-trip__cost-note">{trip.costNote}</span>
          )}
        </p>
      )}

      {trip.duration && (
        <span className="cas-trip__duration">{trip.duration}</span>
      )}

      {trip.description && (
        <p className="cas-trip__description">{trip.description}</p>
      )}

      <div className="cas-trip__counts">
        <span>{capacityLabel(trip)}</span>
        <span className={`cas-trip__spaces--${tone}`}>{spacesLabel(trip)}</span>
      </div>

      <CapacityBar trip={trip} variant="accent" />

      {isMine ? (
        <>
          <div className="cas-mine-flag">Your excursion</div>
          <button
            type="button"
            className="cas-btn cas-btn--block cas-btn--danger"
            onClick={onLeave}
            disabled={!canChange || pending}
          >
            {busy ? 'Working…' : 'Leave excursion'}
          </button>
        </>
      ) : (
        <button
          type="button"
          className="cas-btn cas-btn--block cas-btn--primary"
          onClick={onJoin}
          disabled={!canChange || pending || blockedByFull}
        >
          {busy ? 'Working…' : actionLabel}
        </button>
      )}
    </article>
  )
}
