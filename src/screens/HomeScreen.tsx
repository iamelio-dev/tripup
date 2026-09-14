import { useLayoutEffect, useRef } from 'react'
import { useIsLeavingScreen } from '../components/ScreenNav'
import { swallowNextClick } from '../state/swallowClick'
import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import { BuddiesPreview } from '../components/Avatar'
import { Header } from '../components/Header'
import { Globe } from '../components/Globe'
import { ArrowUpRightIcon, PlusThinIcon } from '../components/Icons'
import type { Trip } from '../data/types'
import './home.css'

/** How close the first card gets to the header at the point the globe has gone
 *  entirely. Tying the fade to that distance rather than to the scroll range
 *  means the globe is only ever fully gone once a card has taken its place. */
const HEADER_CLEARANCE = 16
/** How far down it shrinks by the time it has gone. */
const GLOBE_SHRINK = 0.35
/** The globe canvas, in CSS pixels — matches SIZE in Globe.tsx. */
const GLOBE_SIZE = 520
/** Breathing room under the first card where it comes to rest. */
const CARD_BOTTOM_GAP = 24
/** The gap between items in the list, which follows the globe's spacer. */
const LIST_GAP = 12
/** Past halfway it settles open, short of it it settles back. */
const PULL_SNAP = 0.5
/** px/ms. A throw this quick decides the direction on its own. */
const PULL_FLICK = 0.35
/** Only the last moments of the drag count towards the throw. */
const PULL_WINDOW = 100
/** Movement up to here is a tap on the card, beyond it a swipe at the globe. */
const PULL_TAP = 4
/** Matches the settle in home.css, so the list stays parked until it lands. */
const SNAP_MS = 380

/* Navigating away rebuilds this screen in the outgoing slot of the transition,
   so anything held in component state is back at its default before the screen
   has finished leaving — you watch the list jump as it goes. These outlive the
   component just far enough for the departing copy to be the one you were
   looking at. Arriving is a fresh start, so a screen that mounts to be looked
   at clears them again. */
let wasOpen = 0
let wasScrolledTo = 0

/** S01 — All Trips */
export function HomeScreen() {
  const { trips, you, polls } = useStore()
  const navigate = useNavigate()
  const current = trips.filter((t) => t.status === 'current')
  const upcoming = trips.filter((t) => t.status === 'upcoming')
  const screen = useRef<HTMLDivElement>(null)
  const scroller = useRef<HTMLDivElement>(null)
  const globeSpace = useRef<HTMLDivElement>(null)
  const leaving = useIsLeavingScreen()

  // Bringing the trips up scales the globe down and fades it out behind them.
  // Written straight to custom properties rather than through state — this
  // runs on every scroll frame. Laid out before paint so the globe never shows
  // at its fallback size first.
  useLayoutEffect(() => {
    const box = scroller.current
    const root = screen.current
    const header = root?.querySelector('.header')
    if (!box || !root || !header) return

    // Pulled fully open, the first trip sits on the bottom of the screen and the
    // globe takes the whole band above it, centred. Both ends depend on the
    // card's height, so the open end is measured rather than fixed; CSS blends
    // between it and the resting layout on --globe-hero.
    let travel = 1
    const layout = () => {
      const card = box.querySelector('.trip-card')
      if (!card) return
      const top = box.getBoundingClientRect().top
      const headerBottom = header.getBoundingClientRect().bottom - top
      const cardTop = box.clientHeight - CARD_BOTTOM_GAP - (card as HTMLElement).offsetHeight
      const open = cardTop - LIST_GAP
      root.style.setProperty('--globe-space-hero', `${open}px`)
      const middle = (headerBottom + cardTop) / 2
      root.style.setProperty('--globe-top-hero', `${middle - GLOBE_SIZE / 2}px`)
      // How far the card has to move, which is how far the finger has to. Taken
      // from the two declared layouts rather than from the live one, which may
      // already be open — on a remount, or on a repeated effect run.
      const shut = parseFloat(getComputedStyle(root).getPropertyValue('--globe-space-base'))
      travel = Math.max(open - shut, 1)
    }

    let frame = 0
    const apply = () => {
      frame = 0
      const card = box.querySelector('.trip-card')
      if (!card) return
      // The gap closes one for one with the scroll, so adding the scroll back
      // recovers the resting gap without having to measure it up front — it
      // stays right if the list of trips changes.
      const gap = card.getBoundingClientRect().top - header.getBoundingClientRect().bottom
      const atRest = gap + box.scrollTop
      const closed = (atRest - gap) / Math.max(atRest - HEADER_CLEARANCE, 1)
      const t = Math.min(Math.max(closed, 0), 1)
      const eased = t * t * (3 - 2 * t)
      root.style.setProperty('--globe-scale', String(1 - eased * GLOBE_SHRINK))
      root.style.setProperty('--globe-fade', String(1 - eased))
      root.style.setProperty('--globe-hits', eased > 0.85 ? 'none' : 'auto')
    }
    // coalesced to one write per frame, however fast the scroll events arrive
    const onScroll = () => {
      wasScrolledTo = box.scrollTop
      if (!frame) frame = requestAnimationFrame(apply)
    }

    // the open layout depends on the screen, so it is worked out again on resize
    const onResize = () => {
      layout()
      apply()
    }

    /* ---- opening the globe out ------------------------------------------
       Reaching for the globe is the whole gesture: touch it and it takes the
       room it needs, shrinking to fit and pushing the list down out of its
       way. Swiping back up puts the list back. That swipe tracks the finger
       exactly — the resistance is the distance, not a curve — so where it is
       heading is never in doubt, and letting go settles it to whichever end is
       nearer, or to wherever it was thrown. */
    let hero = 0
    let settled = 0
    let pulling = false
    let startY = 0
    let thrown: { t: number; y: number }[] = []

    let unpark = 0
    const setHero = (v: number) => {
      hero = v
      root.style.setProperty('--globe-hero', String(v))
      // Parked for as long as the globe has any of the room — not just when it
      // is all the way open. Letting the list loose partway through leaves the
      // swipe and the list scrolling at once, and it settles between the two.
      if (v > 0) {
        window.clearTimeout(unpark)
        root.classList.add('home--hero')
      }
    }
    const snap = (to: number) => {
      settled = to
      wasOpen = to
      // dropping this first lets the value animate rather than jump
      root.classList.remove('home--pulling')
      setHero(to)
      // and it stays parked until the return has actually arrived
      if (to === 0) {
        unpark = window.setTimeout(() => root.classList.remove('home--hero'), SNAP_MS)
      }
    }
    const clamp = (v: number) => Math.min(Math.max(v, 0), 1)
    /** Where a let-go lands: the way it was thrown, else the nearer end. */
    const settle = (at: number) => {
      const recent = thrown.filter((s) => at - s.t <= PULL_WINDOW)
      const first = recent[0]
      const last = recent[recent.length - 1]
      const span = first && last ? last.t - first.t : 0
      const v = span > 0 ? (last.y - first.y) / span : 0
      if (Math.abs(v) > PULL_FLICK) return v > 0 ? 1 : 0
      return hero > PULL_SNAP ? 1 : 0
    }

    const onDown = (e: PointerEvent) => {
      const onGlobe = Boolean((e.target as HTMLElement).closest('.home__globe-space'))
      if (settled === 0) {
        // Taking hold of the globe opens it out. Only from the top of the list:
        // further down there is no room to give it, and the list would jump.
        if (onGlobe && box.scrollTop === 0) snap(1)
        return
      }
      // Open, the globe keeps its own drag — that one is turning it. Anywhere
      // else, a swipe back up is what puts the list down again.
      if (onGlobe) return
      pulling = true
      startY = e.clientY
      thrown = [{ t: e.timeStamp, y: e.clientY }]
    }
    const onPull = (e: PointerEvent) => {
      if (!pulling) return
      const next = clamp(1 + (e.clientY - startY) / travel)
      if (next === hero) return
      root.classList.add('home--pulling')
      setHero(next)
      thrown.push({ t: e.timeStamp, y: e.clientY })
      if (thrown.length > 8) thrown.shift()
      e.preventDefault()
    }
    const onRelease = (e: PointerEvent) => {
      if (!pulling) return
      pulling = false
      snap(settle(e.timeStamp))
      // The list is parked while the globe is open, so useDragScroll is not
      // watching and cannot excuse this one: a swipe that puts the globe away
      // ends over the card resting at the bottom, and would open that trip.
      // A press that never moved is still a tap, and still should.
      if (Math.abs(e.clientY - startY) > PULL_TAP) swallowNextClick()
    }

    // The same swipe from a wheel, which has no release of its own — a lull in
    // the events stands in for one. Shut, every wheel belongs to the list.
    let wheeled = 0
    let lull = 0
    const onWheel = (e: WheelEvent) => {
      if (settled === 0) return
      wheeled -= e.deltaY
      const next = clamp(1 + wheeled / travel)
      if (next !== hero) {
        root.classList.add('home--pulling')
        setHero(next)
      }
      window.clearTimeout(lull)
      lull = window.setTimeout(() => {
        wheeled = 0
        snap(hero > PULL_SNAP ? 1 : 0)
      }, 140)
    }

    layout()
    // Only the copy on its way out is put back the way it was left, so the
    // screen sliding away is the one you were looking at. Coming back is a
    // fresh arrival and starts at the default.
    if (!leaving) {
      wasOpen = 0
      wasScrolledTo = 0
    } else if (wasOpen) {
      root.classList.add('home--pulling')
      settled = 1
      setHero(1)
      window.setTimeout(() => root.classList.remove('home--pulling'), 0)
    } else if (wasScrolledTo) {
      box.scrollTop = wasScrolledTo
    }

    box.addEventListener('scroll', onScroll, { passive: true })
    box.addEventListener('pointerdown', onDown)
    box.addEventListener('wheel', onWheel, { passive: true })
    window.addEventListener('pointermove', onPull, { passive: false })
    window.addEventListener('pointerup', onRelease)
    window.addEventListener('pointercancel', onRelease)
    window.addEventListener('resize', onResize)
    apply()
    return () => {
      box.removeEventListener('scroll', onScroll)
      box.removeEventListener('pointerdown', onDown)
      box.removeEventListener('wheel', onWheel)
      window.removeEventListener('pointermove', onPull)
      window.removeEventListener('pointerup', onRelease)
      window.removeEventListener('pointercancel', onRelease)
      window.removeEventListener('resize', onResize)
      window.clearTimeout(lull)
      window.clearTimeout(unpark)
      if (frame) cancelAnimationFrame(frame)
    }
  }, [trips, leaving])

  return (
    <div className="screen home" ref={screen}>
      <div className="screen__scrim" />
      <Header
        title="Your Trips"
        subtitle="2026"
        subtitleSize="large"
        onNotifications={() => navigate('/notifications')}
        hasNotifications={polls.some((p) => p.status === 'live')}
        actions={
          <>
            <button type="button" className="icon-button icon-button--tertiary" aria-label="New trip">
              <PlusThinIcon size={36} />
            </button>
            <button type="button" className="home__profile" aria-label="Profile">
              <img src={you.photo} alt={you.name} />
            </button>
          </>
        }
      />

      <Globe trips={trips} dragSurface={globeSpace} />

      <div className="scroll home__scroll" ref={scroller}>
        <div className="home__globe-space" ref={globeSpace} />
        {current.map((trip) => (
          <TripCard key={trip.id} trip={trip} onOpen={() => navigate(`/trip/${trip.id}`)} />
        ))}
        <h2 className="home__section">Up Next</h2>
        {upcoming.map((trip) => (
          <TripCard key={trip.id} trip={trip} onOpen={() => navigate(`/trip/${trip.id}`)} />
        ))}
        <div className="home__spacer" />
      </div>
    </div>
  )
}

/** The whole card is the tap target; the arrow is just an affordance. */
function TripCard({ trip, onOpen }: { trip: Trip; onOpen: () => void }) {
  return (
    <button type="button" className="trip-card" onClick={onOpen} aria-label={`Open ${trip.name}`}>
      <span className="trip-card__top">
        <span className="trip-card__meta">
          <span className="t-title">{trip.name}</span>
          <span className="trip-card__dates">{trip.dates}</span>
        </span>
        <BuddiesPreview ids={trip.participants} size={36} max={4} />
      </span>
      <span className="trip-card__open" aria-hidden>
        <ArrowUpRightIcon size={20} />
      </span>
    </button>
  )
}
