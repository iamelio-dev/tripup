import type { TripEvent } from '../data/types'
import { BuddiesPreview } from './Avatar'
import { NavigateIcon, ShareIcon, WalkIcon, BusIcon, PollIcon } from './Icons'
import type { PersonId } from '../data/types'
import './event-card.css'

/** Event photography, keyed by an event's `image`. Shared so a map pin and the
 *  card it belongs to always show the same picture. */
export const EVENT_IMAGES: Record<string, string> = {
  maat: '/assets/event-maat.png',
  tram: '/assets/event-tram.png',
  restaurant: '/assets/event-restaurant.jpg',
  'casa-da-bica': '/assets/event-casa-da-bica.jpg',
  'santa-luzia': '/assets/event-santa-luzia.jpg',
  castelo: '/assets/event-castelo.jpg',
  jeronimos: '/assets/event-jeronimos.jpg',
  'lx-factory': '/assets/event-lx-factory.jpg',
  'time-out': '/assets/event-time-out.jpg',
  'tasca-do-chico': '/assets/event-tasca-do-chico.jpg',
  'agios-stefanos': '/assets/event-agios-stefanos.jpg',
  'kos-town': '/assets/event-kos-town.jpg',
  'ferry-heraklion': '/assets/event-ferry-heraklion.jpg',
  samaria: '/assets/event-samaria.jpg',
  'tate-modern': '/assets/event-tate-modern.jpg',
  'borough-market': '/assets/event-borough-market.jpg',
  'west-end': '/assets/event-west-end.jpg',
  'columbia-road': '/assets/event-columbia-road.jpg',
}

/** Event Card (Figma: 361 × 226, radius 36, padding 8/8/16/8). */
export function EventCard({ event }: { event: TripEvent }) {
  // Places carry an `image`; flights do not. Without one the card drops the
  // picture rather than inventing a substitute.
  const photo = event.image ? EVENT_IMAGES[event.image] : undefined
  return (
    <article className={`event-card${photo ? '' : ' event-card--plain'}`}>
      {photo ? (
        <div className="event-card__image" style={{ backgroundImage: `url(${photo})` }}>
          {event.start && (
            <span className="event-time">
              {event.start} - {event.end}
            </span>
          )}
        </div>
      ) : (
        event.start && (
          <span className="event-time event-time--inline event-card__time">
            {event.start} - {event.end}
          </span>
        )
      )}
      <footer className="event-card__footer">
        <div className="event-card__location">
          <h3 className="t-title event-card__name">{event.title}</h3>
          {event.subtitle && <p className="event-card__address">{event.subtitle}</p>}
        </div>
        <div className="event-card__buttons">
          <button type="button" className="icon-button icon-button--tertiary" aria-label="Share">
            <ShareIcon size={44} />
          </button>
          <button type="button" className="icon-button icon-button--tertiary" aria-label="Navigate">
            <NavigateIcon size={44} />
          </button>
        </div>
      </footer>
    </article>
  )
}

/** Distance Time (Figma: 123 × 18) — shown between two consecutive events. */
export function DistanceTime({ walk, bus }: { walk: number; bus: number }) {
  return (
    <div className="distance-time">
      <span className="distance-time__leg">
        <WalkIcon size={9} /> {walk} min
      </span>
      <span className="distance-time__dot" />
      <span className="distance-time__leg">
        <BusIcon size={13} /> {bus} min
      </span>
    </div>
  )
}

/**
 * A live poll sitting in the itinerary where the event will land once the
 * group has decided. Tapping it opens the vote / results sheet.
 */
export function PollCard({
  question,
  time,
  voters,
  total,
  status,
  onOpen,
}: {
  question: string
  time?: string
  voters: PersonId[]
  total: number
  status: 'Open for votes' | 'Voted'
  onOpen: () => void
}) {
  return (
    <button type="button" className="poll-card" onClick={onOpen}>
      <div className="poll-card__top">
        <span className="poll-card__badge">
          <PollIcon size={16} />
          Live poll
        </span>
        {time && <span className="event-time event-time--inline">{time}</span>}
      </div>
      <h3 className="t-title poll-card__question">{question}</h3>
      <div className="poll-card__bottom">
        <div className="poll-card__voters">
          {voters.length > 0 && <BuddiesPreview ids={voters} size={28} max={4} />}
          <span className="poll-card__count">
            {voters.length} of {total} voted
          </span>
        </div>
        <span className={`poll-card__status${status === 'Voted' ? ' is-done' : ''}`}>{status}</span>
      </div>
    </button>
  )
}

/** Arrival / departure leg — same surface as an Event Card, without the photo. */
export function FlightCard({ event }: { event: TripEvent }) {
  return (
    <article className="flight-card">
      <div className="flight-card__meta">
        <span className="flight-card__label">Flight</span>
        <h3 className="t-title event-card__name">{event.title}</h3>
        {event.subtitle && <p className="event-card__address">{event.subtitle}</p>}
      </div>
      <span className="event-time event-time--inline">
        {event.start} - {event.end}
      </span>
    </article>
  )
}
