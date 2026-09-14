/**
 * The prototype runs on trip time rather than wall-clock time: the story is set
 * on the evening of Friday 26 April 2026, so every session opens at 18:00 that
 * day regardless of the real date. From there the clock advances in real time,
 * which is what makes a poll deadline a genuine ticking countdown.
 */
export const TRIP_YEAR = 2026
export const TRIP_MONTH = 3 // April (0-indexed)

const DEMO_EPOCH = new Date(TRIP_YEAR, TRIP_MONTH, 26, 18, 0, 0).getTime()
const REAL_EPOCH = Date.now()

/** Current time on the app's clock. */
export const appNow = () => DEMO_EPOCH + (Date.now() - REAL_EPOCH)

export const tripDay = (day: number, hours = 0, minutes = 0) =>
  new Date(TRIP_YEAR, TRIP_MONTH, day, hours, minutes, 0).getTime()

const pad = (n: number) => String(n).padStart(2, '0')

export const formatTime = (ms: number) => {
  const d = new Date(ms)
  return `${pad(d.getHours())}:${pad(d.getMinutes())}`
}

/**
 * Weekday names come from the trip itself, not the real calendar: the Figma
 * calendar strip labels 21-27 April as Sun-Sat, so the picker has to agree
 * with it rather than with what those dates really fall on in 2026.
 */
export const formatDayLabel = (ms: number, weekday?: string) => {
  const d = new Date(ms)
  const today = new Date(appNow())
  if (d.toDateString() === today.toDateString()) return 'Today'
  return `${weekday ?? ''} ${d.getDate()} Apr`.trim()
}

/** Day of the month an event belongs to. */
export const dayOfMonth = (ms: number) => new Date(ms).getDate()

/** "2h 30min", "12min 05s", "45s" — or null once the deadline has passed. */
export function formatCountdown(msLeft: number): string | null {
  if (msLeft <= 0) return null
  const total = Math.floor(msLeft / 1000)
  const hours = Math.floor(total / 3600)
  const minutes = Math.floor((total % 3600) / 60)
  const seconds = total % 60
  if (hours > 0) return `${hours}h ${minutes}min`
  if (minutes > 0) return `${minutes}min ${pad(seconds)}s`
  return `${seconds}s`
}
