/**
 * Placing a pin on the itinerary map. Coordinates are the hi-fi's 361 × 230 map
 * space, and a pin is placed by its top-left corner.
 */
const MAP_W = 361
const MAP_H = 230
const PIN = 30
/** Keeps pins clear of the card's rounded corners. */
const EDGE = 18
/** Centres closer than this read as overlapping. */
const MIN_GAP = 46
const TRIES = 60

const centre = (p: { left: number; top: number }) => [p.left + PIN / 2, p.top + PIN / 2] as const

/**
 * A free spot for a new pin: random, on the card, and as far from what is
 * already there as a handful of attempts can manage. A crowded map still has to
 * take the pin somewhere, so the roomiest candidate wins rather than nothing.
 */
export function freeMapSpot(
  taken: { left: number; top: number }[],
  random: () => number = Math.random,
) {
  const maxLeft = MAP_W - PIN - EDGE
  const maxTop = MAP_H - PIN - EDGE
  const centres = taken.map(centre)
  let best = { left: EDGE, top: EDGE }
  let bestGap = -1

  for (let i = 0; i < TRIES; i++) {
    const spot = {
      left: Math.round(EDGE + random() * (maxLeft - EDGE)),
      top: Math.round(EDGE + random() * (maxTop - EDGE)),
    }
    const [cx, cy] = centre(spot)
    const gap = centres.length
      ? Math.min(...centres.map(([x, y]) => Math.hypot(cx - x, cy - y)))
      : Infinity
    if (gap >= MIN_GAP) return spot
    if (gap > bestGap) {
      bestGap = gap
      best = spot
    }
  }
  return best
}
