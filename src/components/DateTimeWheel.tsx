import { useEffect, useRef } from 'react'
import { TRIP_DAYS } from '../data/seed'
import { formatDayLabel, tripDay } from '../state/clock'
import './date-time-wheel.css'

const ITEM_HEIGHT = 34
const VISIBLE_ROWS = 5
const PAD = ((VISIBLE_ROWS - 1) / 2) * ITEM_HEIGHT

interface WheelProps {
  items: string[]
  index: number
  onIndex: (index: number) => void
  label: string
  width?: number
  align?: 'center' | 'right' | 'left'
}

/** One drum of the picker: snap-scrolling column with a centred selection. */
function Wheel({ items, index, onIndex, label, width, align = 'center' }: WheelProps) {
  const ref = useRef<HTMLDivElement>(null)
  const settle = useRef<number>()
  const committed = useRef(index)

  // Follow the value when it changes from outside (e.g. switching rows).
  useEffect(() => {
    const el = ref.current
    if (!el) return
    committed.current = index
    const top = index * ITEM_HEIGHT
    if (Math.abs(el.scrollTop - top) > 1) el.scrollTop = top
  }, [index])

  const handleScroll = () => {
    window.clearTimeout(settle.current)
    settle.current = window.setTimeout(() => {
      const el = ref.current
      if (!el) return
      const next = Math.max(0, Math.min(items.length - 1, Math.round(el.scrollTop / ITEM_HEIGHT)))
      el.scrollTo({ top: next * ITEM_HEIGHT, behavior: 'smooth' })
      if (next !== committed.current) {
        committed.current = next
        onIndex(next)
      }
    }, 90)
  }

  return (
    <div
      className="wheel"
      style={width ? { width } : undefined}
      ref={ref}
      onScroll={handleScroll}
      role="listbox"
      aria-label={label}
      tabIndex={0}
      onKeyDown={(e) => {
        if (e.key === 'ArrowDown') {
          e.preventDefault()
          onIndex(Math.min(items.length - 1, index + 1))
        }
        if (e.key === 'ArrowUp') {
          e.preventDefault()
          onIndex(Math.max(0, index - 1))
        }
      }}
    >
      <div style={{ height: PAD }} aria-hidden />
      {items.map((item, i) => (
        <div
          key={item}
          role="option"
          aria-selected={i === index}
          className={`wheel__item wheel__item--${align}${i === index ? ' is-selected' : ''}`}
          onClick={() => onIndex(i)}
        >
          {item}
        </div>
      ))}
      <div style={{ height: PAD }} aria-hidden />
    </div>
  )
}

const HOURS = Array.from({ length: 24 }, (_, i) => String(i).padStart(2, '0'))
const MINUTES = Array.from({ length: 12 }, (_, i) => String(i * 5).padStart(2, '0'))

/**
 * iOS-style inline date-and-time picker: day, hour and minute drums behind a
 * fixed selection band. Days are limited to the trip; minutes step by 5.
 */
export function DateTimeWheel({
  value,
  onChange,
}: {
  value: number
  onChange: (value: number) => void
}) {
  const date = new Date(value)
  const dayIndex = Math.max(
    0,
    TRIP_DAYS.findIndex((d) => d.day === date.getDate()),
  )
  const hourIndex = date.getHours()
  const minuteIndex = Math.round(date.getMinutes() / 5) % 12

  const emit = (day: number, hour: number, minute: number) =>
    onChange(tripDay(day, hour, minute * 5))

  return (
    <div className="wheel-picker">
      <div className="wheel-picker__band" aria-hidden />
      <div className="wheel-picker__columns">
        <Wheel
          label="Day"
          align="right"
          width={150}
          items={TRIP_DAYS.map((d) => formatDayLabel(tripDay(d.day), d.weekday))}
          index={dayIndex}
          onIndex={(i) => emit(TRIP_DAYS[i].day, hourIndex, minuteIndex)}
        />
        <Wheel
          label="Hour"
          width={52}
          items={HOURS}
          index={hourIndex}
          onIndex={(i) => emit(TRIP_DAYS[dayIndex].day, i, minuteIndex)}
        />
        <Wheel
          label="Minute"
          width={52}
          items={MINUTES}
          index={minuteIndex}
          onIndex={(i) => emit(TRIP_DAYS[dayIndex].day, hourIndex, i)}
        />
      </div>
    </div>
  )
}

