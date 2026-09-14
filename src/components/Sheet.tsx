import { useEffect, useLayoutEffect, useRef, useState, type ReactNode } from 'react'
import { useSheetTransition } from '../state/sheetTransition'
import { useStore } from '../state/store'
import './sheet.css'

/** How far down from the sheet's top edge a dismiss drag may start. */
const GRAB_ZONE = 88
/** Past this the release dismisses rather than snapping back. */
const CLOSE_DISTANCE = 88
/** px/ms — a quick flick dismisses even from a short distance. */
const CLOSE_VELOCITY = 0.45
/** Movement before a press becomes a drag, so taps still land. */
const SLOP = 6
/** Elements that own the pointer themselves. */
const NO_DRAG = 'input, textarea, .wheel, .keypad, .sheet-footer'

/**
 * Height of the sheet this one is stacked over, so a stacked sheet can sit at
 * exactly the same height instead of resizing the surface underneath it.
 */
function useHeightOfSheetBelow(enabled: boolean) {
  const [height, setHeight] = useState<number>()
  useLayoutEffect(() => {
    if (!enabled) return
    const below = document.querySelector('.sheet-layer:not(.is-stacked) .sheet')
    if (below) setHeight(below.getBoundingClientRect().height)
  }, [enabled])
  return height
}

/**
 * Bottom sheet — "Sheet + Overlay Dim" in Figma.
 * Radius 34 top / 50 bottom, inset 6px, white surface over a dimmed screen.
 */
export function Sheet({
  children,
  onDismiss,
  surface = 'tertiary',
  stacked = false,
  matchHeight = false,
  footer,
  className,
}: {
  children: ReactNode
  onDismiss?: () => void
  surface?: 'tertiary' | 'white'
  stacked?: boolean
  /** Take the same height as the sheet underneath (stacked sheets only). */
  matchHeight?: boolean
  /** Rendered below the sheet, edge to edge — used for the keyboard. */
  footer?: ReactNode
  /** Extra class on the sheet surface, for per-sheet padding or layout. */
  className?: string
}) {
  const height = useHeightOfSheetBelow(matchHeight && stacked)
  // a stacked sheet always slides in; a step change only cross-fades its content
  const transition = useSheetTransition()
  // Captured on mount. It drives .is-swapping, which suppresses the sheet's
  // entrance; if it flipped later — as it does when a sheet is pushed on top of
  // this one — the entrance would become live again and replay on a sheet that
  // has been sitting there all along.
  const [swapping] = useState(() => transition === 'swap' && !stacked)
  const { sheetClosing, sheets } = useStore()
  // Popping one sheet must not animate the sheet it sits on top of.
  const isTop = stacked || sheets.length === 1
  const closing = sheetClosing === 'all' || (sheetClosing === 'top' && isTop)

  const sheetRef = useRef<HTMLElement>(null)
  const [dragY, setDragY] = useState(0)
  const [dragging, setDragging] = useState(false)
  const gesture = useRef<{
    startY: number
    lastY: number
    lastT: number
    velocity: number
    active: boolean
  } | null>(null)

  /** Pressing near the top of the sheet arms a drag-to-dismiss. */
  const onPointerDown = (e: React.PointerEvent) => {
    const box = sheetRef.current
    if (!onDismiss || !box || box.scrollTop > 0) return
    if ((e.target as HTMLElement).closest(NO_DRAG)) return
    if (e.clientY - box.getBoundingClientRect().top > GRAB_ZONE) return
    gesture.current = {
      startY: e.clientY,
      lastY: e.clientY,
      lastT: e.timeStamp,
      velocity: 0,
      active: false,
    }
  }

  // Tracked on the window so the gesture survives the pointer leaving the sheet.
  useEffect(() => {
    const onMove = (e: PointerEvent) => {
      const g = gesture.current
      if (!g) return
      const dy = e.clientY - g.startY
      if (!g.active) {
        if (dy < SLOP) return
        g.active = true
        setDragging(true)
      }
      const dt = e.timeStamp - g.lastT
      if (dt > 0) g.velocity = (e.clientY - g.lastY) / dt
      g.lastY = e.clientY
      g.lastT = e.timeStamp
      // the sheet only follows downwards; up is a no-op
      setDragY(Math.max(0, dy))
      e.preventDefault()
    }
    const onUp = (e: PointerEvent) => {
      const g = gesture.current
      gesture.current = null
      if (!g || !g.active) return
      setDragging(false)
      const dy = Math.max(0, e.clientY - g.startY)
      if (dy > CLOSE_DISTANCE || g.velocity > CLOSE_VELOCITY) {
        // leave dragY where it is: the exit carries on from here
        onDismiss?.()
      } else {
        setDragY(0)
      }
      // a drag must not also activate whatever it started on
      const swallow = (ev: MouseEvent) => {
        ev.stopPropagation()
        ev.preventDefault()
      }
      window.addEventListener('click', swallow, true)
      window.setTimeout(() => window.removeEventListener('click', swallow, true), 0)
    }
    window.addEventListener('pointermove', onMove, { passive: false })
    window.addEventListener('pointerup', onUp)
    window.addEventListener('pointercancel', onUp)
    return () => {
      window.removeEventListener('pointermove', onMove)
      window.removeEventListener('pointerup', onUp)
      window.removeEventListener('pointercancel', onUp)
    }
  }, [onDismiss])

  return (
    <div
      className={`sheet-layer${stacked ? ' is-stacked' : ''}${footer ? ' has-footer' : ''}${
        dragging ? ' is-dragging' : ''
      }${closing ? ' is-closing' : ''}`}
      style={{ '--sheet-drag': `${dragY}px` } as React.CSSProperties}
    >
      <div className="sheet-dim" onClick={onDismiss} />
      <section
        ref={sheetRef}
        onPointerDown={onPointerDown}
        className={`sheet sheet--${surface}${
          swapping ? ' is-swapping' : ''
        }${className ? ` ${className}` : ''}`}
        style={height ? { height } : undefined}
      >
        <span className="sheet__grabber" />
        {children}
      </section>
      {footer && <div className="sheet-footer">{footer}</div>}
    </div>
  )
}

/** Sheet Primary Button (Figma component set: State × Type). */
export function SheetButton({
  children,
  onClick,
  type = 'default',
  disabled = false,
}: {
  children: ReactNode
  onClick?: () => void
  type?: 'default' | 'accent' | 'ghost'
  disabled?: boolean
}) {
  return (
    <button
      className={`sheet-button sheet-button--${type}${disabled ? ' is-disabled' : ''}`}
      onClick={disabled ? undefined : onClick}
      disabled={disabled}
      type="button"
    >
      {children}
    </button>
  )
}

export function SheetActions({ children }: { children: ReactNode }) {
  return <div className="sheet-actions">{children}</div>
}

/** The "——— Label ———" rule used across the split-bill sheets. */
export function SheetDivider({ label }: { label: string }) {
  return (
    <div className="sheet-divider">
      <span className="sheet-divider__rule" />
      <span className="sheet-divider__label">{label}</span>
      <span className="sheet-divider__rule" />
    </div>
  )
}
