import { PEOPLE } from '../data/seed'
import type { CSSProperties } from 'react'
import type { PersonId } from '../data/types'
import './avatar.css'

interface AvatarProps {
  id: PersonId
  size?: number
  ring?: boolean
  dimmed?: boolean
}

/** Buddy Avatar — photo when the design system has one, monogram otherwise. */
export function Avatar({ id, size = 44, ring = false, dimmed = false }: AvatarProps) {
  const person = PEOPLE[id]
  const style = {
    width: size,
    height: size,
    borderWidth: ring ? Math.max(2, size * 0.057) : 0,
    background: person.avatar,
    fontSize: Math.max(11, size * 0.36),
  }
  return (
    <span className={`avatar${ring ? ' avatar--ring' : ''}${dimmed ? ' is-dimmed' : ''}`} style={style}>
      {person.photo ? <img src={person.photo} alt={person.name} /> : person.name[0]}
    </span>
  )
}

/** Buddies Preview — overlapping stack, newest last. */
export function BuddiesPreview({
  ids,
  size = 44,
  max = 4,
  overlap,
  onClick,
  fanIn = false,
}: {
  ids: PersonId[]
  size?: number
  max?: number
  overlap?: number
  onClick?: () => void
  /** Deal the stack out of the first avatar on mount, one to N. */
  fanIn?: boolean
}) {
  const shown = ids.slice(0, max)
  const extra = ids.length - shown.length
  // CSS gap cannot be negative, so the overlap is a negative margin on every
  // avatar after the first (Figma: Buddies Preview 4, gap -24 at size 44).
  const step = overlap ?? -(size * 0.545)
  // what each avatar sits to the right of the one before it
  const advance = size + step
  const item = (i: number) =>
    ({
      marginLeft: i === 0 ? 0 : step,
      display: 'inline-flex',
      '--buddy-i': i,
      '--buddy-advance': `${advance}px`,
    }) as CSSProperties
  const cls = `buddies-preview__item${fanIn ? ' is-fanning' : ''}`
  const content = (
    <span className="buddies-preview">
      {shown.map((id, i) => (
        <span key={id} className={cls} style={item(i)}>
          <Avatar id={id} size={size} ring />
        </span>
      ))}
      {extra > 0 && (
        <span className={cls} style={item(shown.length)}>
          <span
            className="avatar avatar--ring avatar--more"
            style={{ width: size, height: size, fontSize: Math.max(11, size * 0.3) }}
          >
            +{extra}
          </span>
        </span>
      )}
    </span>
  )
  if (!onClick) return content
  return (
    <button type="button" className="buddies-preview-button" onClick={onClick} aria-label="Travel buddies">
      {content}
    </button>
  )
}
