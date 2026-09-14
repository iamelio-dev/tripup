import { useEffect, useRef, type RefObject } from 'react'
import './touch-pointer.css'

/**
 * A fingertip rather than an arrow. Inside the phone the cursor is hidden and
 * this stands in for it, so the prototype demonstrates the way it would be
 * used — and so a recording of it reads as someone tapping rather than
 * someone pointing.
 *
 * Mouse only: a real touch already has a finger over it, and a pen has its own
 * cursor. It never takes a pointer event of its own.
 */
export function TouchPointer({ within }: { within: RefObject<HTMLElement | null> }) {
  const dot = useRef<HTMLDivElement>(null)

  useEffect(() => {
    const el = dot.current
    const box = within.current
    if (!el || !box) return

    let shown = false
    const show = (on: boolean) => {
      if (on === shown) return
      shown = on
      el.classList.toggle('is-on', on)
    }

    const move = (e: PointerEvent) => {
      if (e.pointerType !== 'mouse') return
      const r = box.getBoundingClientRect()
      const inside =
        e.clientX >= r.left && e.clientX <= r.right && e.clientY >= r.top && e.clientY <= r.bottom
      // Moved before it is shown, so it never fades in at the last place it was.
      if (inside) el.style.transform = `translate3d(${e.clientX}px, ${e.clientY}px, 0)`
      show(inside)
    }
    const down = (e: PointerEvent) => {
      if (e.pointerType === 'mouse') el.classList.add('is-pressed')
    }
    const up = () => el.classList.remove('is-pressed')
    const leave = (e: PointerEvent) => {
      // relatedTarget is null when the pointer leaves the window altogether
      if (!e.relatedTarget) show(false)
    }

    window.addEventListener('pointermove', move)
    window.addEventListener('pointerdown', down)
    window.addEventListener('pointerup', up)
    window.addEventListener('pointercancel', up)
    document.addEventListener('pointerout', leave)
    return () => {
      window.removeEventListener('pointermove', move)
      window.removeEventListener('pointerdown', down)
      window.removeEventListener('pointerup', up)
      window.removeEventListener('pointercancel', up)
      document.removeEventListener('pointerout', leave)
    }
  }, [within])

  return <div className="touch-pointer" ref={dot} aria-hidden />
}
