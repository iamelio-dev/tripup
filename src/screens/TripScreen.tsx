import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { useStore } from '../state/store'
import { PEOPLE } from '../data/seed'
import { Header } from '../components/Header'
import { MapCard } from '../components/MapCard'
import { CalendarStrip } from '../components/CalendarStrip'
import { DistanceTime, EventCard, FlightCard, PollCard } from '../components/EventCard'
import { SpendDonut } from '../components/SpendDonut'
import { TransactionGroup, TransactionRow } from '../components/TransactionCard'
import { TabBar, type TripTab } from '../components/TabBar'
import { SettleIcon } from '../components/Icons'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { money, money2, sharesFor } from '../state/money'
import { appNow, dayOfMonth } from '../state/clock'
import type { TripEvent } from '../data/types'
import { SheetHost } from '../sheets/SheetHost'
import './trip.css'

/** Matches the day-change fade in trip.css. */
const DAY_SWAP_MS = 200

/** S02 — Trip Itinerary / S03 — Trip Expenses */
export function TripScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const { tripId } = useParams()
  const [tab, setTab] = useState<TripTab>('itinerary')
  const [calendarPinned, setCalendarPinned] = useState(false)

  // Resolved from the route rather than read back from the store: the store is
  // synced below, and that has not happened yet on this first render.
  const trip = store.trips.find((t) => t.id === tripId) ?? store.trip
  // Point the store at this trip so every screen and mutation works on it.
  // Before paint, so nothing renders a frame of the trip we came from.
  const { setTripId } = store
  useLayoutEffect(() => {
    if (tripId) setTripId(tripId)
  }, [tripId, setTripId])

  // Opens on today, but only for the trip actually under way — another trip
  // can share a day number without it meaning anything.
  const today = dayOfMonth(appNow())
  const [day, setDay] = useState(() =>
    trip.status === 'current' && trip.days.some((d) => d.day === today)
      ? today
      : (trip.days[0]?.day ?? 1),
  )

  return (
    <div
      className={`screen trip trip--${tab}${
        tab === 'itinerary' && calendarPinned ? ' is-calendar-pinned' : ''
      }`}
    >
      <div className="screen__scrim" />
      <Header
        title={trip.name}
        subtitle={trip.dates}
        buddies={trip.participants}
        onBack={() => navigate('/')}
        onBuddies={() => store.openSheet('buddies')}
        onNotifications={() => navigate('/notifications')}
        hasNotifications={store.polls.some((p) => p.status === 'live')}
      />

      {tab === 'itinerary' ? (
        <ItineraryTab
          key={trip.id}
          day={day}
          onDay={setDay}
          onPinnedChange={setCalendarPinned}
        />
      ) : (
        <ExpensesTab />
      )}

      <div className="tab-bar-scrim" />
      <TabBar
        active={tab}
        onChange={setTab}
        onAdd={() => {
          store.resetBillDraft()
          store.openSheet('add')
        }}
      />
      <SheetHost onSwitchTab={setTab} />
    </div>
  )
}

function ItineraryTab({
  day,
  onDay,
  onPinnedChange,
}: {
  day: number
  onDay: (d: number) => void
  onPinnedChange: (pinned: boolean) => void
}) {
  const store = useStore()
  const eventsFor = (d: number) => store.trip.events.filter((e) => e.day === d)
  const events = eventsFor(day)
  const scroller = useRef<HTMLDivElement>(null)
  const calendar = useRef<HTMLDivElement>(null)

  // The day being left behind stays mounted just long enough to play the
  // entrance backwards. Worked out during render so the outgoing set never
  // paints a frame without its exit already running.
  const [shown, setShown] = useState(day)
  const [leaving, setLeaving] = useState<number | null>(null)
  /** Where the list stood before the swap, read while that is still true. */
  const stood = useRef<{ top: number; height: number } | null>(null)
  if (shown !== day) {
    const box = scroller.current
    // Render runs before the DOM changes, which is the last moment the old
    // position can be had: by the time a layout effect runs the browser has
    // already clamped the scroll to the shorter day.
    if (box) stood.current = { top: box.scrollTop, height: box.scrollHeight }
    setLeaving(shown)
    setShown(day)
  }
  useEffect(() => {
    if (leaving === null) return
    const id = window.setTimeout(() => setLeaving(null), DAY_SWAP_MS)
    return () => window.clearTimeout(id)
  }, [leaving])

  // A shorter day cannot hold the scroll position. Left alone the browser
  // clamps twice — once now, and again when the outgoing copy unmounts, since
  // an absolutely positioned layer still counts towards scrollable overflow.
  // Working out here where the day will actually settle keeps it to a single
  // move — and keeps the position untouched whenever the new day is tall
  // enough to hold it.
  useLayoutEffect(() => {
    const box = scroller.current
    const tail = box?.querySelector<HTMLElement>('.trip__scroll-spacer')
    // Not cleared after reading: React runs this effect twice in development,
    // and the second run needs the same answer as the first. It is written
    // afresh on every swap, and only ever read just after being written.
    const before = stood.current
    if (!box || !tail) return
    const settled =
      tail.getBoundingClientRect().bottom - box.getBoundingClientRect().top + box.scrollTop
    const max = Math.max(0, settled - box.clientHeight)
    const from = before ? before.top : box.scrollTop
    if (from <= max) return

    // The shorter day has already cost the list some of its height, and with it
    // some of its scroll. The spacer gives that height back for the length of
    // the swap so the list can start from where it stood, and the scroll is
    // eased down instead of dropped — arriving somewhere else between one frame
    // and the next reads as a glitch rather than a change of day.
    // Grown until the height is actually back, rather than by the shortfall in
    // one go: the outgoing day is absolutely positioned and overflows its
    // stack, so for a while it is the overflow — not the content in flow —
    // setting the scrollable height, and the first helping of spacer only
    // brings the flow level with it. Reading the height back each pass is also
    // what gets the last one laid out, which the scroll below is clamped
    // against.
    const spacer = tail.offsetHeight
    let grown = 0
    if (before) {
      for (let pass = 0; pass < 3; pass += 1) {
        const short = before.height - box.scrollHeight
        if (short <= 0) break
        grown += short
        tail.style.height = `${spacer + grown}px`
      }
      if (grown > 0) box.scrollTop = from
    }

    let frame = 0
    const started = performance.now()
    const done = () => {
      tail.style.height = ''
    }
    const step = (now: number) => {
      const t = Math.min((now - started) / DAY_SWAP_MS, 1)
      // out-cubic: leaves at once, arrives gently
      box.scrollTop = from + (max - from) * (1 - Math.pow(1 - t, 3))
      if (t < 1) frame = requestAnimationFrame(step)
      // by now the list is back within the height it will keep, so letting the
      // spacer go costs no further clamp
      else done()
    }
    frame = requestAnimationFrame(step)
    return () => {
      cancelAnimationFrame(frame)
      done()
    }
  }, [day])

  // Decides when the strip parks under the header: the gradient grows to sit
  // behind it and it anchors to the screen. Driven by scrollTop rather than the
  // strip's own position, which stops meaning anything once it is anchored —
  // and which a rubber-band would move without scrollTop changing at all.
  useEffect(() => {
    const box = scroller.current
    const strip = calendar.current
    if (!box || !strip) return
    let pinned = false
    let restingOffset: number | null = null
    const check = () => {
      // the parked position on screen, not the sticky offset — that is
      // relative to the content edge and shifts with the lead padding
      const parkAt =
        parseFloat(getComputedStyle(strip).getPropertyValue('--header-stack')) || 0
      // only measurable while the strip is still in the flow
      if (!pinned) {
        restingOffset =
          strip.getBoundingClientRect().top - box.getBoundingClientRect().top + box.scrollTop
      }
      const next = restingOffset !== null && box.scrollTop >= restingOffset - parkAt
      if (next !== pinned) {
        pinned = next
        onPinnedChange(next)
      }
    }
    check()
    box.addEventListener('scroll', check, { passive: true })
    return () => {
      box.removeEventListener('scroll', check)
      onPinnedChange(false)
    }
  }, [onPinnedChange, day])

  return (
    <div className="scroll trip__scroll" ref={scroller}>
      <div className="trip__map">
        <MapCard
          image={store.trip.map}
          pins={store.trip.mapPins}
          // nobody is anywhere yet on a trip that has not started
          me={store.trip.status === 'current' ? store.trip.mapMe : undefined}
          label={`Map of ${store.trip.name}`}
        />
      </div>
      <div className="trip__calendar" ref={calendar}>
        <CalendarStrip days={store.trip.days} selected={day} onSelect={onDay} />
      </div>
      <div className="trip__calendar-spacer" />
      <div className="trip__events-stack">
        {leaving !== null && (
          <div className="trip__events trip__events--leaving" key={`out-${leaving}`}>
            <DayPlan events={eventsFor(leaving)} />
          </div>
        )}
        <div className="trip__events" key={day}>
          <DayPlan events={events} />
        </div>
      </div>
      <div className="trip__scroll-spacer" />
    </div>
  )
}

/**
 * One day's plan. Both the arriving and the departing copy render through this,
 * so the two can never drift apart — the first version hand-wrote the outgoing
 * copy and lost the travel times between cards.
 */
/** Stand-ins so a gap between two events is never left blank. */
const FALLBACK_WALK = 12
const FALLBACK_BUS = 9

function DayPlan({ events }: { events: TripEvent[] }) {
  if (events.length === 0) {
    return <p className="trip__empty">Nothing planned for this day yet.</p>
  }
  return (
    <>
      {events.map((event, index) => (
        <div className="trip__event" key={event.id}>
          {event.kind === 'flight' ? (
            <FlightCard event={event} />
          ) : event.kind === 'poll' ? (
            <ItineraryPoll event={event} />
          ) : (
            <EventCard event={event} />
          )}
          {index < events.length - 1 && (
            <DistanceTime
              walk={events[index + 1].walkMinutes ?? FALLBACK_WALK}
              bus={events[index + 1].busMinutes ?? FALLBACK_BUS}
            />
          )}
        </div>
      ))}
    </>
  )
}

/**
 * A poll sitting in the itinerary. It resolves its own poll from the event so
 * several open polls stay independent; once closed the event becomes a normal
 * Event Card showing the winning place.
 */
function ItineraryPoll({ event }: { event: TripEvent }) {
  const store = useStore()
  const poll = store.polls.find((p) => p.id === event.pollId)
  if (!poll) return <EventCard event={event} />

  const voted = Boolean(poll.votes[store.you.id])
  return (
    <PollCard
      question={event.title}
      time={event.start ? `${event.start} - ${event.end}` : undefined}
      voters={Object.keys(poll.votes)}
      total={store.trip.participants.length}
      status={voted ? 'Voted' : 'Open for votes'}
      onOpen={() => store.openPoll(poll.id, voted ? 'poll-results' : 'poll-vote')}
    />
  )
}

function ExpensesTab() {
  const store = useStore()
  const { trip, you, netBalances, totalSpent } = store

  const contributions = trip.participants.map((id) => ({
    id,
    amount: trip.expenses
      .filter((e) => e.paidBy.includes(id))
      .reduce((s, e) => s + e.amount / e.paidBy.length, 0),
  }))

  const balance = netBalances[you.id] ?? 0
  // rounded to the cent it is shown at, so a stray fraction cannot read as a debt
  const square = Math.abs(balance) < 0.005

  // Grouped by the day they were logged, newest day first, and newest entry
  // first within a day so a freshly logged expense lands at the top.
  const today = `${dayOfMonth(appNow())} April`
  const byDay = new Map<string, typeof trip.expenses>()
  for (const expense of trip.expenses) {
    const day = byDay.get(expense.date) ?? []
    day.unshift(expense)
    byDay.set(expense.date, day)
  }
  const days = [...byDay.keys()].sort((a, b) => parseInt(b, 10) - parseInt(a, 10))

  return (
    <div className="scroll trip__expenses scroll--under-header">
      <SpendDonut total={totalSpent} contributions={contributions} balances={netBalances} />

      <button type="button" className="balance-card" onClick={() => store.openSheet('breakdown')}>
        <div className="balance-card__text">
          <p className="balance-card__headline">
            {square ? (
              <>
                You are <strong>all square</strong>
              </>
            ) : (
              <>
                {balance < 0 ? 'You owe ' : 'You are owed '}
                <strong>{money(balance)}</strong>
              </>
            )}
          </p>
          <span className="balance-card__link">See Breakdown</span>
        </div>
        {!square && (
          <span className="balance-card__settle">
            <SettleIcon size={18} />
            Settle now
          </span>
        )}
      </button>

      {days.map((day) => (
        <TransactionGroup key={day} label={day === today ? 'Today' : day}>
          {byDay.get(day)!.map((expense) => {
            const share = sharesFor(expense)[you.id] ?? 0
            const youPaid = expense.paidBy.includes(you.id)
            const payer = PEOPLE[expense.paidBy[0]]
            return (
              <SwipeToDelete
                key={expense.id}
                radius={0}
                onDelete={() => store.deleteExpense(expense.id)}
              >
                <TransactionRow
                  title={expense.title}
                  subtitle={youPaid ? 'You paid' : `Paid by ${payer.name}`}
                  amount={`${youPaid ? '+' : '-'} ${money2(share)}`}
                  caption={youPaid ? 'You are owed' : 'You owe'}
                  tone={youPaid ? 'default' : 'owed'}
                />
              </SwipeToDelete>
            )
          })}
        </TransactionGroup>
      ))}
      <div className="trip__scroll-spacer" />
    </div>
  )
}
