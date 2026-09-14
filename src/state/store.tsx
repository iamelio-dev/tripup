import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
} from 'react'
import { PEOPLE, TRIPS } from '../data/seed'
import type { Expense, Person, PersonId, Poll, Trip, TripEvent } from '../data/types'
import { afterSettling, balances, consolidate, sharesFor } from './money'
import { appNow, dayOfMonth, formatTime } from './clock'
import { freeMapSpot } from './mapPin'
import { EVENT_IMAGES } from '../components/EventCard'
import type { SheetTransition } from './sheetTransition'

/** Matches the exit transition in sheet.css — the reverse of sheet-in. */
export const SHEET_EXIT_MS = 300

const YOU: PersonId = 'ari'

/** Everything a sheet needs to know about itself. */
export type SheetId =
  | 'add' // S04 / S11
  | 'buddies' // S05
  | 'search-buddy' // S06
  | 'poll-question' // S07
  | 'poll-options' // S08
  | 'poll-vote' // S09
  | 'poll-results' // S10 / S20
  | 'bill-total' // S12
  | 'bill-paid-by' // S13
  | 'bill-split' // S14 / S15
  | 'bill-item-buddies' // S16
  | 'bill-summary' // S17
  | 'breakdown' // consolidated debts
  | 'poll-time' // day + time wheel

/** In-progress expense being built across S12 → S17. */
export interface BillDraft {
  amount: string
  title: string
  /** Name given to the expense when the field is left blank. The field itself
   *  shows a generic hint rather than this. */
  titleSuggestion: string
  paidBy: PersonId[]
  splitMode: 'equally' | 'items'
  splitWith: PersonId[]
  items: { id: string; label: string; amount: number; participants: PersonId[] }[]
  editingItemId: string | null
}

/** In-progress poll being built across S07 → S08. */
export interface PollDraft {
  question: string
  /** Epoch ms on the app clock; `null` until the picker sets one. */
  eventAt: number | null
  deadlineAt: number | null
  options: { id: string; label: string }[]
}

interface Store {
  you: Person
  people: Record<string, Person>
  trips: Trip[]
  trip: Trip
  polls: Poll[]
  activePoll: Poll | undefined
  /** Opens a poll's vote / results sheet and makes it the one being acted on. */
  openPoll: (pollId: string, sheet: 'poll-vote' | 'poll-results') => void

  /** Which trip the screens and every mutation are pointed at. */
  tripId: string
  setTripId: (id: string) => void
  sheets: SheetId[]
  sheetTransition: SheetTransition
  /** Which layers are playing their exit, if any — they are still mounted. */
  sheetClosing: 'top' | 'all' | null
  openSheet: (id: SheetId) => void
  pushSheet: (id: SheetId) => void
  closeSheet: () => void
  /** Pays off what you owe, and says so. */
  settleUp: () => void
  closeAllSheets: () => void

  toast: string | null
  notify: (message: string) => void

  addParticipant: (id: PersonId) => void

  pollDraft: PollDraft
  setPollDraft: (patch: Partial<PollDraft>) => void
  resetPollDraft: () => void
  pollTimeTarget: 'event' | 'deadline' | null
  openPollTime: (target: 'event' | 'deadline') => void
  publishPoll: () => void
  castVote: (optionId: PersonId) => void

  billDraft: BillDraft
  setBillDraft: (patch: Partial<BillDraft>) => void
  resetBillDraft: () => void
  toggleItemParticipant: (itemId: string, personId: PersonId) => void
  logExpense: () => void
  deleteExpense: (id: string) => void

  // derived money
  netBalances: Record<PersonId, number>
  yourBalance: number
  totalSpent: number
  transfers: ReturnType<typeof consolidate>
  shareOf: (expense: Expense, personId: PersonId) => number
}

const StoreContext = createContext<Store | null>(null)

const uid = () => Math.random().toString(36).slice(2, 9)

/** Chronological, with anything that has no time yet pushed to the end of the day. */
const byStartTime = (a: TripEvent, b: TripEvent) => {
  if (!a.start && !b.start) return 0
  if (!a.start) return 1
  if (!b.start) return -1
  return a.start.localeCompare(b.start)
}

const emptyPollDraft = (): PollDraft => ({
  question: '',
  eventAt: null,
  deadlineAt: null,
  // Start empty — the placeholder tells the user what to put here.
  options: [{ id: uid(), label: '' }, { id: uid(), label: '' }],
})

const emptyBillDraft = (): BillDraft => ({
  amount: '',
  title: '',
  titleSuggestion: 'Dinner',
  paidBy: [YOU],
  splitMode: 'equally',
  splitWith: [],
  items: [],
  editingItemId: null,
})

export function StoreProvider({ children }: { children: ReactNode }) {
  const [trips, setTrips] = useState<Trip[]>(() => JSON.parse(JSON.stringify(TRIPS)))
  const [polls, setPolls] = useState<Poll[]>([])
  const [sheets, setSheets] = useState<SheetId[]>([])
  const [tripId, setTripId] = useState('lisbon')
  const tripIdRef = useRef(tripId)
  tripIdRef.current = tripId
  const [sheetTransition, setSheetTransition] = useState<SheetTransition>('enter')
  const [sheetClosing, setSheetClosing] = useState<'top' | 'all' | null>(null)
  const closeTimer = useRef<number>()
  const sheetsRef = useRef(sheets)
  sheetsRef.current = sheets
  const [selectedPollId, setSelectedPollId] = useState<string | null>(null)
  const [pollTimeTarget, setPollTimeTarget] = useState<'event' | 'deadline' | null>(null)
  const [toast, setToast] = useState<string | null>(null)
  const [pollDraft, setPollDraftState] = useState<PollDraft>(emptyPollDraft)
  const [billDraft, setBillDraftState] = useState<BillDraft>(emptyBillDraft)
  const toastTimer = useRef<number>()
  const pollsRef = useRef(polls)
  pollsRef.current = polls

  const trip = trips.find((t) => t.id === tripId) ?? trips[0]
  const activePoll =
    polls.find((p) => p.id === selectedPollId) ?? polls[polls.length - 1]

  const updateTrip = useCallback((fn: (t: Trip) => Trip) => {
    setTrips((prev) => prev.map((t) => (t.id === tripIdRef.current ? fn(t) : t)))
  }, [])

  const notify = useCallback((message: string) => {
    setToast(message)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setToast(null), 2600)
  }, [])

  /* ---------------- sheets ---------------- */
  /** Any close in flight is abandoned the moment something opens again. */
  const cancelClose = useCallback(() => {
    window.clearTimeout(closeTimer.current)
    setSheetClosing(null)
  }, [])
  /** Keep the sheet mounted while it plays the reverse of its entrance. */
  const runClose = useCallback(
    (scope: 'top' | 'all', apply: () => void) => {
      if (sheetsRef.current.length === 0) return
      window.clearTimeout(closeTimer.current)
      setSheetClosing(scope)
      closeTimer.current = window.setTimeout(() => {
        apply()
        setSheetClosing(null)
      }, SHEET_EXIT_MS)
    },
    [],
  )

  /** Replacing an open sheet is a step change; opening from nothing is an entrance. */
  const openSheet = useCallback(
    (id: SheetId) => {
      cancelClose()
      setSheetTransition(sheetsRef.current.length > 0 ? 'swap' : 'enter')
      setSheets([id])
    },
    [cancelClose],
  )
  const openPoll = useCallback(
    (pollId: string, sheet: 'poll-vote' | 'poll-results') => {
      cancelClose()
      setSelectedPollId(pollId)
      setSheetTransition(sheetsRef.current.length > 0 ? 'swap' : 'enter')
      setSheets([sheet])
    },
    [cancelClose],
  )
  const pushSheet = useCallback(
    (id: SheetId) => {
      cancelClose()
      setSheetTransition('enter')
      setSheets((s) => [...s, id])
    },
    [cancelClose],
  )
  const closeSheet = useCallback(
    () => runClose('top', () => setSheets((s) => s.slice(0, -1))),
    [runClose],
  )
  const closeAllSheets = useCallback(() => runClose('all', () => setSheets([])), [runClose])

  /* ---------------- participants ---------------- */
  const addParticipant = useCallback(
    (id: PersonId) => {
      updateTrip((t) =>
        t.participants.includes(id) ? t : { ...t, participants: [...t.participants, id] },
      )
      notify(`${PEOPLE[id].name} joined the trip`)
    },
    [updateTrip, notify],
  )

  /* ---------------- poll ---------------- */
  const setPollDraft = useCallback(
    (patch: Partial<PollDraft>) => setPollDraftState((d) => ({ ...d, ...patch })),
    [],
  )
  const resetPollDraft = useCallback(() => setPollDraftState(emptyPollDraft()), [])
  const openPollTime = useCallback((target: 'event' | 'deadline') => {
    setPollTimeTarget(target)
    setSheetTransition('enter')
    setSheets((s) => [...s, 'poll-time'])
  }, [])

  const publishPoll = useCallback(() => {
    const poll: Poll = {
      id: uid(),
      question: pollDraft.question.trim() || 'Where are we eating tonight?',
      createdAt: appNow(),
      eventAt: pollDraft.eventAt,
      deadlineAt: pollDraft.deadlineAt,
      options: pollDraft.options
        .filter((o) => o.label.trim())
        .map((o) => ({ id: o.id, label: o.label.trim() })),
      votes: {},
      status: 'live',
    }
    setPolls((p) => [...p, poll])
    setSelectedPollId(poll.id)
    updateTrip((t) => ({
      ...t,
      events: [
        ...t.events,
        {
          id: `ev-${poll.id}`,
          kind: 'poll',
          day: dayOfMonth(poll.eventAt ?? appNow()),
          title: poll.question,
          start: poll.eventAt ? formatTime(poll.eventAt) : undefined,
          end: poll.eventAt ? formatTime(poll.eventAt + 2 * 60 * 60 * 1000) : undefined,
          pollId: poll.id,
          // the same travel the winner inherits, so the label doesn't change
          // under the user when the poll resolves
          walkMinutes: 12,
          busMinutes: 9,
        } satisfies TripEvent,
      ].sort(byStartTime),
    }))
    notify('Poll sent to the group')
  }, [pollDraft, updateTrip, notify])

  /**
   * Ari votes, then the rest of the group "replies" on a short timer so the
   * results visibly move while the reviewer is watching. Everyone but William
   * backs the second option, which is what the hi-fi results screen shows.
   */
  const castVote = useCallback(
    (optionId: string) => {
      const pollId = activePoll?.id
      if (!pollId) return

      setPolls((prev) =>
        prev.map((p) => (p.id === pollId ? { ...p, votes: { ...p.votes, [YOU]: optionId } } : p)),
      )

      const others = trip.participants.filter((id) => id !== YOU)
      others.forEach((personId, index) => {
        window.setTimeout(
          () => {
            setPolls((prev) =>
              prev.map((p) => {
                if (p.id !== pollId || p.status === 'closed') return p
                const choice =
                  personId === 'william'
                    ? p.options[0].id
                    : p.options[1]?.id ?? p.options[0].id
                return { ...p, votes: { ...p.votes, [personId]: choice } }
              }),
            )
          },
          700 + index * 750,
        )
      })
    },
    [activePoll, trip.participants],
  )

  /**
   * Ends a poll and drops the winning place into the itinerary. Called only by
   * the watcher below — there is no manual "close" control; a poll resolves
   * itself once everyone has voted or the deadline passes.
   */
  const closePoll = useCallback(
    (pollId: string, reason: 'votes' | 'deadline') => {
      const poll = pollsRef.current.find((p) => p.id === pollId)
      if (!poll || poll.status === 'closed') return

      const tally: Record<string, number> = {}
      poll.options.forEach((o) => (tally[o.id] = 0))
      Object.values(poll.votes).forEach((optionId) => {
        tally[optionId] = (tally[optionId] ?? 0) + 1
      })
      const winner = poll.options
        .slice()
        .sort((a, b) => (tally[b.id] ?? 0) - (tally[a.id] ?? 0))[0]

      setPolls((prev) =>
        prev.map((p) =>
          p.id === poll.id
            ? { ...p, status: 'closed', winnerId: winner.id, closedBy: reason }
            : p,
        ),
      )
      updateTrip((t) => {
        const decided = t.events.some((e) => e.pollId === poll.id)
        const events = t.events
          .map((e) =>
            e.pollId === poll.id
              ? {
                  ...e,
                  kind: 'event' as const,
                  title: winner.label,
                  subtitle: 'Rua da Bica de Duarte Belo 40',
                  image: 'restaurant',
                  walkMinutes: 12,
                  busMinutes: 9,
                  pollId: undefined,
                }
              : e,
          )
          .sort(byStartTime)
        if (!decided) return { ...t, events }
        // The place is now somewhere the group is going, so it earns a pin.
        // The user dot counts as taken ground too.
        const spot = freeMapSpot([...t.mapPins, t.mapMe])
        return {
          ...t,
          events,
          mapPins: [...t.mapPins, { image: EVENT_IMAGES.restaurant, ...spot }],
        }
      })
      notify(`${winner.label} added to the itinerary`)
    },
    [updateTrip, notify],
  )

  /**
   * Watches every live poll and resolves it as soon as the group has all voted
   * or the deadline runs out.
   */
  useEffect(() => {
    const check = () => {
      const now = appNow()
      for (const poll of pollsRef.current) {
        if (poll.status !== 'live') continue
        if (trip.participants.every((id) => poll.votes[id])) {
          closePoll(poll.id, 'votes')
        } else if (poll.deadlineAt !== null && now >= poll.deadlineAt) {
          closePoll(poll.id, 'deadline')
        }
      }
    }
    check()
    const id = window.setInterval(check, 1000)
    return () => window.clearInterval(id)
  }, [polls, trip.participants, closePoll])

  /* ---------------- bill ---------------- */
  const setBillDraft = useCallback(
    (patch: Partial<BillDraft>) => setBillDraftState((d) => ({ ...d, ...patch })),
    [],
  )
  const resetBillDraft = useCallback(() => {
    // The evening's restaurant is the obvious thing to be logging an expense
    // for, so fall back to whatever the poll picked if nothing is typed.
    const decided = polls.find((p) => p.status === 'closed')
    const winner = decided?.options.find((o) => o.id === decided.winnerId)
    setBillDraftState({
      ...emptyBillDraft(),
      titleSuggestion: winner ? `Dinner at ${winner.label}` : 'Dinner',
      splitWith: [...trip.participants],
    })
  }, [trip.participants, polls])

  const toggleItemParticipant = useCallback((itemId: string, personId: PersonId) => {
    setBillDraftState((d) => ({
      ...d,
      items: d.items.map((item) =>
        item.id === itemId
          ? {
              ...item,
              participants: item.participants.includes(personId)
                ? item.participants.filter((p) => p !== personId)
                : [...item.participants, personId],
            }
          : item,
      ),
    }))
  }, [])

  const logExpense = useCallback(() => {
    const amount = Number(billDraft.amount) || 0
    const expense: Expense = {
      id: uid(),
      title: billDraft.title.trim() || billDraft.titleSuggestion,
      date: `${dayOfMonth(appNow())} April`,
      amount,
      paidBy: billDraft.paidBy.length > 0 ? billDraft.paidBy : [YOU],
      participants:
        billDraft.splitWith.length > 0 ? billDraft.splitWith : [...trip.participants],
      splitMode: billDraft.splitMode,
      items: billDraft.splitMode === 'items' ? billDraft.items : undefined,
    }
    updateTrip((t) => ({ ...t, expenses: [...t.expenses, expense] }))
    notify('Expense logged — balances updated')
  }, [billDraft, trip.participants, updateTrip, notify])

  const deleteExpense = useCallback(
    (id: string) => {
      updateTrip((t) => ({ ...t, expenses: t.expenses.filter((e) => e.id !== id) }))
      notify('Expense deleted')
    },
    [updateTrip, notify],
  )

  /**
   * Pays off what you owe. Money owed *to* you is not yours to settle — those
   * are other people's payments to make, and they stay on the list until they
   * do.
   */
  const settleUp = useCallback(() => {
    const mine = transfersRef.current.filter((t) => t.from === YOU)
    if (mine.length === 0) return
    updateTrip((t) => ({ ...t, settlements: [...t.settlements, ...mine] }))
    closeSheet()
    notify('Payment settled — you are all square')
  }, [updateTrip, closeSheet, notify])

  /* ---------------- derived money ---------------- */
  const netBalances = useMemo(
    () => afterSettling(balances(trip.expenses, trip.participants), trip.settlements),
    [trip.expenses, trip.participants, trip.settlements],
  )
  const totalSpent = useMemo(
    () => trip.expenses.reduce((sum, e) => sum + e.amount, 0),
    [trip.expenses],
  )
  const transfers = useMemo(() => consolidate(netBalances), [netBalances])
  // read by settleUp, which must not be rebuilt every time a balance shifts
  const transfersRef = useRef(transfers)
  transfersRef.current = transfers

  const value: Store = {
    you: PEOPLE[YOU],
    people: PEOPLE,
    trips,
    trip,
    polls,
    activePoll,
    openPoll,
    sheets,
    tripId,
    setTripId,
    sheetTransition,
    sheetClosing,
    openSheet,
    pushSheet,
    closeSheet,
    closeAllSheets,
    settleUp,
    toast,
    notify,
    addParticipant,
    pollDraft,
    setPollDraft,
    resetPollDraft,
    pollTimeTarget,
    openPollTime,
    publishPoll,
    castVote,
    billDraft,
    setBillDraft,
    resetBillDraft,
    toggleItemParticipant,
    logExpense,
    deleteExpense,
    netBalances,
    yourBalance: netBalances[YOU] ?? 0,
    totalSpent,
    transfers,
    shareOf: (expense, personId) => sharesFor(expense)[personId] ?? 0,
  }

  return <StoreContext.Provider value={value}>{children}</StoreContext.Provider>
}

export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside <StoreProvider>')
  return ctx
}
