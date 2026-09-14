import { useEffect, useRef, type RefObject } from 'react'
import createGlobe from 'cobe'
import type { Trip } from '../data/types'
import { EVENT_IMAGES } from './EventCard'
// the pins are the itinerary map's, so they share its styles
import './map-card.css'
import './globe.css'

/** Rendered size in CSS pixels — the canvas is drawn at device resolution. */
const SIZE = 520
/** Radians per pixel dragged. */
const DRAG_SPEED = 0.005
/** How far the globe can be tipped, so it never rolls past the poles. */
const MAX_TILT = 0.9
/** Radians per frame when nobody is touching it. */
const DRIFT = 0.0015
/** Idle time before the globe levels itself off again. */
const IDLE_BEFORE_LEVEL = 3000
/** Share of the remaining tilt shed per frame — settles in about half a second. */
const LEVEL_RATE = 0.12
/** How long the levelling takes to wind up to that rate from a standstill. */
const LEVEL_EASE_IN = 500
/** Share of a fling that survives each frame once the globe is let go. */
const FRICTION = 0.95
/** Fastest fling the globe will accept, in radians per millisecond. */
const MAX_SPIN = 0.015
/** Weight of the newest sample when measuring fling speed. */
const SPIN_SMOOTHING = 0.25
/** Below this a fling is spent, in radians per millisecond. */
const SPIN_FLOOR = 0.00005
/** A pointer that rested this long before lifting was not flung. */
const SPIN_STALE = 80

const rgb = (hex: string): [number, number, number] => [
  parseInt(hex.slice(1, 3), 16) / 255,
  parseInt(hex.slice(3, 5), 16) / 255,
  parseInt(hex.slice(5, 7), 16) / 255,
]

const clamp = (v: number, lo: number, hi: number) => Math.min(hi, Math.max(lo, v))

const RAD = Math.PI / 180
/** Radius of cobe's sphere in its own clip space. */
const SPHERE = 0.8
/** Pin size in CSS pixels; it is centred on its coordinate. */
const PIN = 36

/**
 * Where a coordinate lands on screen, matching cobe's own marker maths so the
 * pins sit exactly on the sphere it draws. `front` is false once a point has
 * turned round the back, and `depth` is how far it leans towards the viewer —
 * biggest on the equator, falling away towards the poles and the horizon.
 */
function project([lat, lon]: [number, number], phi: number, theta: number) {
  const la = lat * RAD
  const lo = lon * RAD
  // cobe's location vector, with the -pi longitude shift folded in
  const x0 = Math.cos(la) * Math.cos(lo) * SPHERE
  const y0 = Math.sin(la) * SPHERE
  const z0 = -Math.cos(la) * Math.sin(lo) * SPHERE

  const cp = Math.cos(phi)
  const sp = Math.sin(phi)
  const ct = Math.cos(theta)
  const st = Math.sin(theta)

  const x = cp * x0 + sp * z0
  const y = sp * st * x0 + ct * y0 - cp * st * z0
  const z = -sp * ct * x0 + st * y0 + cp * ct * z0

  return {
    // clip space is -1..1 with y up; the canvas is square so there is no aspect term
    left: (SIZE / 2) * (1 + x),
    top: (SIZE / 2) * (1 - y),
    front: z >= 0,
    depth: z,
  }
}

/** A trip's pin picture — the first place on the itinerary that has one. */
const tripPhoto = (trip: Trip) => {
  const place = trip.events.find((e) => e.image)
  return place?.image ? EVENT_IMAGES[place.image] : undefined
}

/**
 * The globe behind the trip list (S01). Drag to turn it; every trip is pinned
 * at its own coordinates, using the same pin as the itinerary map.
 */
/**
 * `dragSurface` is an element that stands in front of the globe but should
 * still drive it — the home list holds one open over it, so that the gaps
 * between the cards can belong to the list without stealing the globe's drags.
 */
export function Globe({
  trips,
  dragSurface,
}: {
  trips: Trip[]
  dragSurface?: RefObject<HTMLElement | null>
}) {
  const canvas = useRef<HTMLCanvasElement>(null)
  const pins = useRef<(HTMLSpanElement | null)[]>([])
  // kept in a ref so the render loop never restarts on a pointer move
  // level is the resting state, so it also starts there
  const view = useRef({ phi: 4.2, theta: 0 })

  useEffect(() => {
    const el = canvas.current
    if (!el) return

    const globe = createGlobe(el, {
      devicePixelRatio: Math.min(window.devicePixelRatio, 2),
      width: SIZE,
      height: SIZE,
      phi: view.current.phi,
      theta: view.current.theta,
      dark: 0,
      diffuse: 1.1,
      mapSamples: 16000,
      mapBrightness: 2.2,
      baseColor: rgb('#e9e6e1'),
      markerColor: rgb('#c95e42'),
      glowColor: rgb('#e9e6e1'),
    })

    // Pointers are tracked on the window so a drag survives leaving the canvas.
    const pointers = new Map<number, { x: number; y: number }>()
    let dragging = false
    let lastInput = performance.now()
    const touched = () => (lastInput = performance.now())
    // Carried over from the drag when the globe is released, in radians per ms.
    const spin = { phi: 0, theta: 0 }
    let lastMove = lastInput


    const onDown = (e: PointerEvent) => {
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      touched()
      // catching the globe stops it dead, as though it had been grabbed
      spin.phi = 0
      spin.theta = 0
      lastMove = e.timeStamp
      dragging = true
      ;(e.currentTarget as Element | null)?.setPointerCapture?.(e.pointerId)
    }

    const onMove = (e: PointerEvent) => {
      const last = pointers.get(e.pointerId)
      if (!last) return
      const dx = e.clientX - last.x
      const dy = e.clientY - last.y
      pointers.set(e.pointerId, { x: e.clientX, y: e.clientY })
      touched()

      // the surface follows the pointer, as though the globe were being pushed
      view.current.phi += dx * DRAG_SPEED
      const tilted = clamp(view.current.theta + dy * DRAG_SPEED, -MAX_TILT, MAX_TILT)

      // Speed is smoothed so one jittery sample can't define the throw, and the
      // tilt is measured after clamping — pushing into a pole bleeds it to nothing.
      const elapsed = e.timeStamp - lastMove
      lastMove = e.timeStamp
      if (elapsed > 0) {
        spin.phi += ((dx * DRAG_SPEED) / elapsed - spin.phi) * SPIN_SMOOTHING
        spin.theta += ((tilted - view.current.theta) / elapsed - spin.theta) * SPIN_SMOOTHING
      }

      view.current.theta = tilted
      e.preventDefault()
    }

    const onUp = (e: PointerEvent) => {
      touched()
      pointers.delete(e.pointerId)
      if (pointers.size > 0) return
      dragging = false
      // A finger that came to rest before lifting is placing the globe, not
      // throwing it, so the stale speed is dropped rather than replayed.
      if (e.timeStamp - lastMove > SPIN_STALE) {
        spin.phi = 0
        spin.theta = 0
        return
      }
      spin.phi = clamp(spin.phi, -MAX_SPIN, MAX_SPIN)
      spin.theta = clamp(spin.theta, -MAX_SPIN, MAX_SPIN)
    }


    const surface = dragSurface?.current
    el.addEventListener('pointerdown', onDown)
    surface?.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)

    // Moved directly rather than through state — this runs every frame.
    const placePins = () => {
      trips.forEach((trip, i) => {
        const pin = pins.current[i]
        if (!pin) return
        const { left, top, front, depth } = project(trip.coords, view.current.phi, view.current.theta)
        pin.style.transform = `translate3d(${left - PIN / 2}px, ${top - PIN / 2}px, 0)`
        pin.style.opacity = front ? '1' : '0'
        // nearer the viewer wins the overlap; depth is -SPHERE..SPHERE
        pin.style.zIndex = String(Math.round((depth + 1) * 1000))
      })
    }

    let frame = 0
    let previous = performance.now()
    const draw = (now: number) => {
      // clamped so a dropped frame eases rather than jumps
      const dt = Math.min(now - previous, 32)
      previous = now

      if (!dragging) view.current.phi += DRIFT

      // The throw carries on under friction, decaying into the idle drift.
      if (!dragging && (spin.phi !== 0 || spin.theta !== 0)) {
        view.current.phi += spin.phi * dt
        view.current.theta = clamp(view.current.theta + spin.theta * dt, -MAX_TILT, MAX_TILT)
        const kept = Math.pow(FRICTION, dt / 16.67)
        spin.phi *= kept
        spin.theta *= kept
        if (Math.abs(spin.phi) < SPIN_FLOOR) spin.phi = 0
        if (Math.abs(spin.theta) < SPIN_FLOOR) spin.theta = 0
      }

      // Left alone for a moment, the globe rights itself: the tilt eases back
      // to level while the spin carries on. Any input resets the wait.
      const settled = now - lastInput - IDLE_BEFORE_LEVEL
      if (!dragging && spin.theta === 0 && settled > 0 && view.current.theta !== 0) {
        // Wound up from nothing over LEVEL_EASE_IN — at full rate from the first
        // frame the tilt visibly lurches the moment the timer expires.
        const ramp = Math.min(settled / LEVEL_EASE_IN, 1)
        const rate = LEVEL_RATE * ramp * ramp * (3 - 2 * ramp)
        const eased = 1 - Math.pow(1 - rate, dt / 16.67)
        view.current.theta -= view.current.theta * eased
        if (Math.abs(view.current.theta) < 0.0005) view.current.theta = 0
      }

      globe.update({
        phi: view.current.phi,
        theta: view.current.theta,
      })

      placePins()

      frame = requestAnimationFrame(draw)
    }
    // placed before the first frame, so they never paint at the box origin
    placePins()
    frame = requestAnimationFrame(draw)

    return () => {
      cancelAnimationFrame(frame)
      el.removeEventListener('pointerdown', onDown)
      surface?.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
      globe.destroy()
    }
  }, [trips])

  return (
    <div className="home__globe">
      <canvas
        ref={canvas}
        className="home__globe-canvas"
        style={{ width: SIZE, height: SIZE }}
        aria-label="Globe showing where your trips are"
        role="img"
      />
      {trips.map((trip, i) => {
        const photo = tripPhoto(trip)
        return (
          <span
            key={trip.id}
            ref={(el) => {
              pins.current[i] = el
            }}
            className="map-pin globe-pin"
            aria-hidden
          >
            <span className="map-pin__tile">{photo && <img src={photo} alt="" />}</span>
          </span>
        )
      })}
    </div>
  )
}
