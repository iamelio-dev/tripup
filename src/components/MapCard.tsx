import './map-card.css'

/** The hi-fi's map space — pin coordinates are authored against this. */
const MAP_W = 361
const MAP_H = 230

const at = (left: number, top: number) => ({
  left: `${((left / MAP_W) * 100).toFixed(3)}%`,
  top: `${((top / MAP_H) * 100).toFixed(3)}%`,
})

/**
 * Map Container (Figma S02 hi-fi: 361 × 230, radius 36). The artwork and the
 * pins come from the trip, so each one can carry its own.
 */
export function MapCard({
  image,
  pins,
  me,
  label,
}: {
  image: string
  pins: { image: string; left: number; top: number }[]
  /** Where the group is right now. Omitted on a trip that has not started. */
  me?: { left: number; top: number }
  label: string
}) {
  return (
    <div className="map-card">
      <img className="map-card__image" src={image} alt={label} />
      {pins.map((pin) => (
        <span key={`${pin.image}-${pin.left}`} className="map-pin" style={at(pin.left, pin.top)}>
          <span className="map-pin__tile">
            <img src={pin.image} alt="" />
          </span>
          <span className="map-pin__tail" />
          <span className="map-pin__dot" />
        </span>
      ))}
      {me && <span className="map-card__me" style={at(me.left, me.top)} />}
    </div>
  )
}
