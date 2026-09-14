import { useState } from 'react'
import { Avatar } from './Avatar'
import { PEOPLE } from '../data/seed'
import type { PersonId } from '../data/types'
import { money } from '../state/money'
import './spend-donut.css'

/** Segment shades — the hi-fi's three first, then matching extras. */
const SHADES = ['#c95e42', '#9a351f', '#e0917c', '#ffc39f', '#a8462f', '#d9755a', '#8f3a26']

/* Hi-fi geometry (S20 → Chart), in the 361 × 230 chart space. */
const RADIUS = 97 // arc centreline
const COLOUR_WIDTH = 10
const WHITE_WIDTH = 15 // wider underlay — this is what draws the separator
const GAP = 16 // arc length dropped between segments, round caps included
const ORBIT = 135 // distance from centre to a buddy avatar
const AVATAR = 44
const SVG = 2 * (RADIUS + WHITE_WIDTH / 2)

/**
 * Total-spent ring from the hi-fi expenses screen: one arc per payer, each
 * sitting on a wider white arc so the slices read as separated, with that
 * payer's avatar orbiting at the middle of their slice.
 */
export function SpendDonut({
  total,
  contributions,
  balances,
}: {
  total: number
  contributions: { id: PersonId; amount: number }[]
  /** Net position per person, so a hovered slice can report what they are owed. */
  balances?: Record<PersonId, number>
}) {
  const [focused, setFocused] = useState<PersonId | null>(null)
  const paid = contributions.filter((c) => c.amount > 0)
  const sum = paid.reduce((s, c) => s + c.amount, 0) || 1
  const circumference = 2 * Math.PI * RADIUS

  let cursor = 0
  const segments = paid.map((c, i) => {
    const slice = (c.amount / sum) * circumference
    // Round caps overhang the path by half a stroke at each end, so the path
    // has to stop short of the slice for the separator to survive.
    const length = Math.max(slice - GAP, 1)
    const offset = cursor + (slice - length) / 2
    cursor += slice
    // 0 is the top of the ring — the <g> below is rotated to match.
    const mid = ((offset + length / 2) / circumference) * 2 * Math.PI - Math.PI / 2
    return {
      id: c.id,
      length,
      offset,
      color: SHADES[i % SHADES.length],
      left: `calc(50% + ${(Math.cos(mid) * ORBIT).toFixed(2)}px)`,
      top: `calc(50% + ${(Math.sin(mid) * ORBIT).toFixed(2)}px)`,
    }
  })

  const arc = (
    s: (typeof segments)[number],
    stroke: string,
    width: number,
    interactive = false,
  ) => (
    <circle
      key={`${stroke}-${s.id}`}
      className={`spend-donut__arc${focused === s.id ? ' is-focused' : ''}`}
      cx={SVG / 2}
      cy={SVG / 2}
      r={RADIUS}
      fill="none"
      stroke={stroke}
      strokeWidth={width}
      strokeLinecap="round"
      strokeDasharray={`${s.length} ${circumference - s.length}`}
      strokeDashoffset={-s.offset}
      // only the coloured arc takes the pointer; the wider white underlay
      // would otherwise catch the hover just outside the visible slice
      pointerEvents={interactive ? 'stroke' : 'none'}
      onMouseEnter={interactive ? () => setFocused(s.id) : undefined}
      onMouseLeave={interactive ? () => setFocused(null) : undefined}
    />
  )

  const balance = focused ? (balances?.[focused] ?? 0) : 0
  const settled = Math.abs(balance) < 0.005

  return (
    <div className={`spend-donut${focused ? ' is-picking' : ''}`}>
      <svg width={SVG} height={SVG} className="spend-donut__ring" viewBox={`0 0 ${SVG} ${SVG}`}>
        <g transform={`rotate(-90 ${SVG / 2} ${SVG / 2})`}>
          {/* every underlay first, so no segment's white can cover a neighbour */}
          {segments.map((s) => arc(s, '#ffffff', WHITE_WIDTH))}
          {segments.map((s) => arc(s, s.color, COLOUR_WIDTH, true))}
        </g>
      </svg>
      <div className="spend-donut__centre">
        {focused ? (
          <>
            <span className="t-hero">{money(Math.abs(balance))}</span>
            <span className="spend-donut__caption">
              {settled
                ? `${PEOPLE[focused].name} is settled up`
                : `${PEOPLE[focused].name} ${balance < 0 ? 'owes' : 'is owed'}`}
            </span>
          </>
        ) : (
          <>
            <span className="t-hero">{money(total)}</span>
            <span className="spend-donut__caption">Total</span>
          </>
        )}
      </div>
      {segments.map((s) => (
        <span
          key={s.id}
          className={`spend-donut__buddy${focused === s.id ? ' is-focused' : ''}`}
          style={{ left: s.left, top: s.top }}
          onMouseEnter={() => setFocused(s.id)}
          onMouseLeave={() => setFocused(null)}
        >
          <Avatar id={s.id} size={AVATAR} ring />
        </span>
      ))}
    </div>
  )
}
