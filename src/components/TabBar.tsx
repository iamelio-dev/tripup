import { useEffect, useRef, useState, type CSSProperties } from 'react'
import { ExpensesIcon, ItineraryIcon, PlusIcon } from './Icons'
import './tab-bar.css'

export type TripTab = 'itinerary' | 'expenses'

const TABS = [
  { id: 'itinerary' as const, label: 'Itinerary', Icon: ItineraryIcon },
  { id: 'expenses' as const, label: 'Expenses', Icon: ExpensesIcon },
]

/** How long the capsule is stretched for before it relaxes back. */
const STRETCH_MS = 190

/** TabBar (Figma: 353 × 62 — tabs pill 240 × 62, add button 62 × 62). */
export function TabBar({
  active,
  onChange,
  onAdd,
}: {
  active: TripTab
  onChange: (tab: TripTab) => void
  onAdd: () => void
}) {
  const index = TABS.findIndex((t) => t.id === active)
  const [moving, setMoving] = useState(false)
  const mounted = useRef(false)

  // Stretch the capsule while it travels, then let it relax — the landing
  // settle comes from the overshoot in the transition curve.
  useEffect(() => {
    if (!mounted.current) {
      mounted.current = true
      return
    }
    setMoving(true)
    const id = window.setTimeout(() => setMoving(false), STRETCH_MS)
    return () => window.clearTimeout(id)
  }, [active])

  return (
    <nav className="tab-bar">
      <div className="tab-bar__tabs">
        <span
          className={`tab-indicator${moving ? ' is-moving' : ''}`}
          style={{ '--tab-index': index } as CSSProperties}
          aria-hidden
        >
          <span className="tab-indicator__fill" />
        </span>
        {TABS.map(({ id, label, Icon }) => (
          <button
            key={id}
            type="button"
            className={`tab${active === id ? ' is-active' : ''}`}
            onClick={() => onChange(id)}
          >
            <Icon size={24} />
            <span>{label}</span>
          </button>
        ))}
      </div>
      <button type="button" className="tab-bar__add" onClick={onAdd} aria-label="Add">
        <PlusIcon size={20} />
      </button>
    </nav>
  )
}
