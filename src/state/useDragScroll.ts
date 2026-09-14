import { useEffect, type RefObject } from 'react'
import { swallowNextClick } from './swallowClick'

/** Elements that own their own pointer gestures or need a text caret. */
const IGNORE =
  'input, textarea, select, [contenteditable], .wheel, .poll-option__handle, .home__globe, .home__globe-space, .home--hero .home__scroll'

/** Velocity decay per 16.67ms frame — roughly how iOS sheds a flick. */
const FRICTION = 0.94
/** px/ms. Below this a release reads as a stop, not a flick. */
const MIN_VELOCITY = 0.05
/** px/ms. Caps how far a hard flick can throw the list. */
const MAX_VELOCITY = 4
/** Only movement from the last moments of the drag decides the throw. */
const SAMPLE_WINDOW = 100

function scrollableFrom(el: HTMLElement | null, root: HTMLElement) {
  while (el && el !== root.parentElement) {
    const style = getComputedStyle(el)
    const scrolls = style.overflowY === 'auto' || style.overflowY === 'scroll'
    if (scrolls && el.scrollHeight > el.clientHeight + 1) return el
    el = el.parentElement
  }
  return null
}

/**
 * Lets a mouse drag scroll the prototype the way a finger would on a phone:
 * the list follows the pointer, and a flick keeps gliding after release.
 * Touch already scrolls natively, so this only handles mouse input, and it
 * swallows the click that would otherwise fire at the end of a drag.
 */
export function useDragScroll(ref: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = ref.current
    if (!root) return

    let target: HTMLElement | null = null
    let startY = 0
    let startScroll = 0
    let dragging = false
    let samples: { t: number; y: number }[] = []
    let raf = 0
    /** Set when the press landed on a list that was still moving. */
    let arrested = false

    const stopGlide = () => {
      if (raf) cancelAnimationFrame(raf)
      raf = 0
    }

    /** Coast to a halt, bailing out the moment the list hits an end. */
    const glide = (el: HTMLElement, initial: number) => {
      let v = Math.max(-MAX_VELOCITY, Math.min(MAX_VELOCITY, initial))
      let pos = el.scrollTop
      let last = performance.now()
      const step = (now: number) => {
        // Cleared up front and only set again when another frame is booked, so
        // raf answers "is it still moving?" rather than "did it ever move?".
        raf = 0
        // A dropped frame should slow the glide, not teleport it.
        const dt = Math.min(now - last, 32)
        last = now
        pos -= v * dt
        el.scrollTop = pos
        // The browser clamps scrollTop at the ends — that means we've arrived.
        if (Math.abs(el.scrollTop - pos) > 1) return
        pos = el.scrollTop
        v *= Math.pow(FRICTION, dt / 16.67)
        if (Math.abs(v) < MIN_VELOCITY) return
        raf = requestAnimationFrame(step)
      }
      raf = requestAnimationFrame(step)
    }

    const onDown = (e: PointerEvent) => {
      // Touching down stops a glide in progress, as it would on a phone. That
      // press was there to stop the list, so it must not also open whatever it
      // happened to land on — noted here, acted on at release.
      arrested = raf !== 0
      stopGlide()
      if (e.pointerType !== 'mouse' || e.button !== 0) return
      const el = e.target as HTMLElement
      if (el.closest(IGNORE)) return
      target = scrollableFrom(el, root)
      if (!target) return
      startY = e.clientY
      startScroll = target.scrollTop
      dragging = false
      samples = [{ t: e.timeStamp, y: e.clientY }]
    }

    const onMove = (e: PointerEvent) => {
      if (!target) return
      const dy = e.clientY - startY
      if (!dragging && Math.abs(dy) > 4) {
        dragging = true
        document.body.classList.add('is-drag-scrolling')
      }
      if (dragging) {
        target.scrollTop = startScroll - dy
        samples.push({ t: e.timeStamp, y: e.clientY })
        if (samples.length > 8) samples.shift()
        e.preventDefault()
      }
    }

    const onUp = (e: PointerEvent) => {
      if (dragging && target) {
        const recent = samples.filter((s) => e.timeStamp - s.t <= SAMPLE_WINDOW)
        const first = recent[0]
        const span = recent.length > 1 ? e.timeStamp - first.t : 0
        // A drag that ended in a pause has no throw left in it.
        if (span > 0) {
          const v = (e.clientY - first.y) / span
          if (Math.abs(v) > MIN_VELOCITY) glide(target, v)
        }
      }

      // Neither a drag nor a press that caught the list mid-glide was a tap.
      if (dragging || arrested) swallowNextClick()

      document.body.classList.remove('is-drag-scrolling')
      target = null
      dragging = false
      arrested = false
      samples = []
    }

    root.addEventListener('pointerdown', onDown)
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      stopGlide()
      root.removeEventListener('pointerdown', onDown)
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [ref])
}
