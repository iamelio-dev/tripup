import { InfoIcon } from './Icons'
import './poll-option.css'

/**
 * Poll Option (Figma component set: Selected × Winning × Voted).
 * 341 × 56 — content pill 16px radius + 38px navigate button.
 */
export function PollOptionRow({
  label,
  percent,
  selected = false,
  winning = false,
  voted = false,
  onClick,
  trailing,
}: {
  label: string
  percent?: number
  selected?: boolean
  winning?: boolean
  voted?: boolean
  onClick?: () => void
  trailing?: 'info' | 'none'
}) {
  const classes = ['poll-option']
  if (selected) classes.push('is-selected')
  if (voted) classes.push('is-voted')
  if (voted && winning) classes.push('is-winning')
  if (voted && !winning && !selected) classes.push('is-losing')

  return (
    <div className={classes.join(' ')}>
      <button type="button" className="poll-option__content" onClick={onClick} disabled={!onClick}>
        <span className="poll-option__label">{label}</span>
        {percent !== undefined && <span className="poll-option__result">{percent}%</span>}
      </button>
      {trailing !== 'none' && (
        <span className="poll-option__navigate">
          <InfoIcon size={38} />
        </span>
      )}
    </div>
  )
}
