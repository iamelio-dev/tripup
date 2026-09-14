import { useEffect, useRef, useState, type ReactNode } from 'react'
import './swipe-to-delete.css'

const ACTION_WIDTH = 84
/** How far a drag must travel before it commits to an axis. */
const THRESHOLD = 6

/**
 * iOS-style swipe row: dragging left reveals a Delete button behind the
 * content. Movement is tracked on the window so the gesture survives the
 * pointer leaving the row; vertical drags are handed back to the scroller.
 */
export function SwipeToDelete({
  children,
  onDelete,
  radius = 16,
  label = 'Delete',
  surface = 'var(--bg-secondary)',
}: {
  children: ReactNode
  onDelete: () => void
  radius?: number
  label?: string
  /** Must match the surface the row sits on, so the action stays hidden. */
  surface?: string
}) {
  const [offset, setOffset] = useState(0)
  const [sliding, setSliding] = useState(false)
  const gesture = useRef<{ x: number; y: number; base: number; axis: '' | 'x' | 'y' } | null>(null)

  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gesture.current
      if (!g) return
      const dx = e.clientX - g.x
      const dy = e.clientY - g.y
      if (!g.axis) {
        if (Math.abs(dx) < THRESHOLD && Math.abs(dy) < THRESHOLD) return
        g.axis = Math.abs(dx) > Math.abs(dy) ? 'x' : 'y'
        if (g.axis === 'x') setSliding(true)
      }
      if (g.axis !== 'x') return
      e.preventDefault()
      setOffset(Math.min(0, Math.max(-ACTION_WIDTH, g.base + dx)))
    }

    const onUp = () => {
      const g = gesture.current
      gesture.current = null
      setSliding(false)
      if (g?.axis === 'x') setOffset((o) => (o < -ACTION_WIDTH / 2 ? -ACTION_WIDTH : 0))
    }

    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [])

  const onPointerDown = (e: React.PointerEvent) => {
    // the reorder handle owns its own gesture
    if ((e.target as HTMLElement).closest('.poll-option__handle')) return
    gesture.current = { x: e.clientX, y: e.clientY, base: offset, axis: '' }
  }

  return (
    <div className="swipe-row" style={{ borderRadius: radius }}>
      <button
        type="button"
        className="swipe-row__action"
        style={{ width: ACTION_WIDTH }}
        tabIndex={offset === 0 ? -1 : 0}
        onClick={() => {
          setOffset(0)
          onDelete()
        }}
      >
        {label}
      </button>
      <div
        className={`swipe-row__content${sliding ? ' is-sliding' : ''}`}
        style={{ transform: `translateX(${offset}px)`, background: surface }}
        onPointerDown={onPointerDown}
      >
        {children}
      </div>
    </div>
  )
}
