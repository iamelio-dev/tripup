import { appNow, dayOfMonth } from '../state/clock'
import './calendar-strip.css'

/** TabBar/Calendar (Figma: 361 × 73, day frame 52 × 73). */
export function CalendarStrip({
  days,
  selected,
  onSelect,
}: {
  days: { weekday: string; day: number }[]
  selected: number
  onSelect: (day: number) => void
}) {
  const today = dayOfMonth(appNow())
  return (
    <div className="calendar-strip">
      {days.map((d) => (
        <button
          key={d.day}
          type="button"
          className={`calendar-day${d.day === selected ? ' is-selected' : ''}${
            d.day === today ? ' is-today' : ''
          }`}
          onClick={() => onSelect(d.day)}
        >
          <span className="calendar-day__weekday">{d.weekday}</span>
          <span className="calendar-day__number">{d.day}</span>
        </button>
      ))}
    </div>
  )
}
