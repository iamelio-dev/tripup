export type PersonId = string

export interface Person {
  id: PersonId
  name: string
  /** Fallback tone used by <Avatar /> when there is no photo. */
  avatar: string
  photo?: string
  isYou?: boolean
}

export interface TripEvent {
  id: string
  kind: 'event' | 'poll' | 'flight'
  /** Day of the month this event sits on. */
  day: number
  title: string
  subtitle?: string
  /** Absent when no time has been set yet. */
  start?: string
  end?: string
  image?: string
  walkMinutes?: number
  busMinutes?: number
  pollId?: string
}

export interface PollOption {
  id: string
  label: string
  note?: string
}

export interface Poll {
  id: string
  question: string
  /** When the poll was sent to the group, on the app clock. */
  createdAt: number
  /** Epoch ms on the app clock — see state/clock.ts. `null` means "not set". */
  eventAt: number | null
  deadlineAt: number | null
  options: PollOption[]
  /** personId -> optionId */
  votes: Record<PersonId, string>
  status: 'live' | 'closed'
  winnerId?: string
  /** Why the poll ended, for the results copy. */
  closedBy?: 'votes' | 'deadline'
}

export interface ExpenseItem {
  id: string
  label: string
  amount: number
  /** who shares this line item */
  participants: PersonId[]
}

export interface Expense {
  id: string
  title: string
  date: string
  amount: number
  /** One or more payers; the bill is credited equally between them. */
  paidBy: PersonId[]
  /** used when splitMode === 'equally' */
  participants: PersonId[]
  splitMode: 'equally' | 'items'
  items?: ExpenseItem[]
}

export interface Trip {
  id: string
  name: string
  dates: string
  startDate: string
  endDate: string
  /** The calendar strip's days. Authored rather than derived: the Figma strip
   *  labels 21-27 April Sun-Sat, which is not what 2026 actually does. */
  days: { weekday: string; day: number }[]
  /** Where the trip is on the globe, as [latitude, longitude]. */
  coords: [number, number]
  /** Map artwork for the itinerary. Every trip shows one. */
  map: string
  /** Stop pins, positioned by their top-left corner in the hi-fi's
   *  361 × 230 map space. */
  mapPins: { image: string; left: number; top: number }[]
  /** The "you are here" dot, in that same space. */
  mapMe: { left: number; top: number }
  participants: PersonId[]
  events: TripEvent[]
  expenses: Expense[]
  status: 'current' | 'upcoming'
}

export interface Transfer {
  from: PersonId
  to: PersonId
  amount: number
}
