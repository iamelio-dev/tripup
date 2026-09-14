import { PEOPLE } from '../data/seed'
import type { PersonId } from '../data/types'
import { Avatar } from './Avatar'
import './buddy-grid.css'

/**
 * Avatar picker used by Travel Buddies (S05), Paid By (S13), Split (S14)
 * and the per-item buddy sheet (S16).
 */
export function BuddyGrid({
  ids,
  selected,
  onToggle,
  size = 66,
}: {
  ids: PersonId[]
  selected?: PersonId[]
  onToggle?: (id: PersonId) => void
  size?: number
}) {
  return (
    <div className="buddy-grid">
      {ids.map((id) => {
        const isSelected = selected ? selected.includes(id) : true
        const interactive = Boolean(onToggle)
        return (
          <button
            key={id}
            type="button"
            className={`buddy-grid__item${isSelected ? ' is-selected' : ''}${
              interactive ? '' : ' is-static'
            }`}
            onClick={onToggle ? () => onToggle(id) : undefined}
            disabled={!interactive}
          >
            <span className="buddy-grid__avatar">
              <Avatar id={id} size={size} dimmed={selected ? !isSelected : false} />
            </span>
            <span className="buddy-grid__name">{PEOPLE[id].name}</span>
          </button>
        )
      })}
    </div>
  )
}
