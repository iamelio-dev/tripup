import { useState } from 'react'
import { Sheet, SheetActions, SheetButton } from '../components/Sheet'
import { DateTimeWheel } from '../components/DateTimeWheel'
import { tripDay } from '../state/clock'
import { useStore } from '../state/store'
import './sheets.css'

/** Sensible drum position when nothing has been picked yet. */
const FALLBACK = { event: () => tripDay(26, 20, 0), deadline: () => tripDay(26, 18, 30) }

/** Day + time wheel, presented as a sheet over the poll setup sheet. */
export function PollTimeSheet({ stacked }: { stacked?: boolean }) {
  const store = useStore()
  const target = store.pollTimeTarget
  const current = target === 'event' ? store.pollDraft.eventAt : store.pollDraft.deadlineAt
  const [draft, setDraft] = useState(current ?? FALLBACK[target ?? 'event']())
  if (!target) return null

  const apply = (value: number | null) => {
    store.setPollDraft(target === 'event' ? { eventAt: value } : { deadlineAt: value })
    store.closeSheet()
  }

  return (
    <Sheet onDismiss={store.closeSheet} stacked={stacked} matchHeight>
      <h2 className="sheet-heading">
        {target === 'event' ? 'Time of the event' : 'Deadline'}
      </h2>

      <div className="poll-time-body">
        <DateTimeWheel value={draft} onChange={setDraft} />
      </div>

      <SheetActions>
        <SheetButton type="ghost" onClick={() => apply(null)}>
          Clear
        </SheetButton>
        <SheetButton onClick={() => apply(draft)}>Done</SheetButton>
      </SheetActions>
    </Sheet>
  )
}
