import { useRef, useState } from 'react'
import { Sheet, SheetActions, SheetButton } from '../components/Sheet'
import { PollOptionRow } from '../components/PollOption'
import { BuddiesPreview } from '../components/Avatar'
import { DragIcon, MapIcon, PlusIcon } from '../components/Icons'
import { SwipeToDelete } from '../components/SwipeToDelete'
import { TRIP_DAYS } from '../data/seed'
import { useStore } from '../state/store'
import { formatCountdown, formatDayLabel, formatTime } from '../state/clock'
import { useNow } from '../state/useNow'
import './sheets.css'

const uid = () => Math.random().toString(36).slice(2, 9)

/** S07 — Poll: what are we deciding? */
export function PollQuestionSheet() {
  const store = useStore()
  const { pollDraft, setPollDraft } = store

  return (
    <Sheet onDismiss={store.closeSheet}>
      <div>
        <h2 className="sheet-title">What are we deciding?</h2>
        <p className="sheet-subtitle">This is the question your buddies will see.</p>
      </div>

      <input
        className="sheet-field"
        value={pollDraft.question}
        onChange={(e) => setPollDraft({ question: e.target.value })}
        placeholder="Ask the group a question…"
        aria-label="Poll question"
      />

      <div className="poll-meta">
        <PollTimeRow
          label="Time of the event"
          value={pollDraft.eventAt}
          onOpen={() => store.openPollTime('event')}
        />
        <PollTimeRow
          label="Deadline"
          value={pollDraft.deadlineAt}
          onOpen={() => store.openPollTime('deadline')}
        />
      </div>

      <SheetActions>
        <SheetButton type="ghost" onClick={store.closeSheet}>
          Cancel
        </SheetButton>
        <SheetButton
          disabled={!pollDraft.question.trim()}
          onClick={() => store.openSheet('poll-options')}
        >
          Continue
        </SheetButton>
      </SheetActions>

    </Sheet>
  )
}

/** A settings row that opens the day + time wheel sheet. */
function PollTimeRow({
  label,
  value,
  onOpen,
}: {
  label: string
  value: number | null
  onOpen: () => void
}) {
  const weekday = value
    ? TRIP_DAYS.find((d) => d.day === new Date(value).getDate())?.weekday
    : undefined
  return (
    <button type="button" className="poll-meta__row" onClick={onOpen}>
      <span className="sheet-row__label">{label}</span>
      <span className={`poll-meta__value${value ? '' : ' is-empty'}`}>
        {value ? `${formatDayLabel(value, weekday)} ${formatTime(value)}` : 'None'}
      </span>
    </button>
  )
}

/** S08 — Poll: add options */
export function PollOptionsSheet() {
  const store = useStore()
  const { pollDraft, setPollDraft } = store
  const question = pollDraft.question.trim() || 'Where are we eating tonight?'

  const update = (id: string, label: string) =>
    setPollDraft({ options: pollDraft.options.map((o) => (o.id === id ? { ...o, label } : o)) })

  const addOption = (label = '') =>
    setPollDraft({ options: [...pollDraft.options, { id: uid(), label }] })

  const removeOption = (id: string) =>
    setPollDraft({ options: pollDraft.options.filter((o) => o.id !== id) })

  const filled = pollDraft.options.filter((o) => o.label.trim()).length

  /* ---- drag to reorder ---- */
  const rows = useRef<(HTMLDivElement | null)[]>([])
  const drag = useRef<{ index: number; startY: number; rects: DOMRect[] } | null>(null)
  const [draggingId, setDraggingId] = useState<string | null>(null)
  const [offsetY, setOffsetY] = useState(0)

  /** Where the dragged row would land, given how far it has travelled. */
  const dropIndex = () => {
    if (!drag.current) return 0
    const { index, rects } = drag.current
    const centre = rects[index].top + rects[index].height / 2 + offsetY
    const found = rects.findIndex((r) => centre < r.top + r.height / 2)
    return found === -1 ? rects.length - 1 : found
  }

  const onPointerDown = (e: React.PointerEvent, index: number, id: string) => {
    e.preventDefault()
    drag.current = {
      index,
      startY: e.clientY,
      rects: rows.current.filter(Boolean).map((el) => el!.getBoundingClientRect()),
    }
    setDraggingId(id)
    setOffsetY(0)
    e.currentTarget.setPointerCapture(e.pointerId)
  }

  const onPointerMove = (e: React.PointerEvent) => {
    if (drag.current) setOffsetY(e.clientY - drag.current.startY)
  }

  const onPointerUp = () => {
    if (drag.current) {
      const from = drag.current.index
      const to = dropIndex()
      if (to !== from) {
        const next = [...pollDraft.options]
        const [moved] = next.splice(from, 1)
        next.splice(to, 0, moved)
        setPollDraft({ options: next })
      }
    }
    drag.current = null
    setDraggingId(null)
    setOffsetY(0)
  }

  const target = draggingId ? dropIndex() : -1

  return (
    <Sheet onDismiss={store.closeSheet}>
      <div>
        <h2 className="sheet-title">{question}</h2>
        <p className="sheet-subtitle">Add options below</p>
      </div>

      <div className="poll-options">
        {pollDraft.options.map((option, index) => {
          const isDragging = draggingId === option.id
          // rows between the origin and the drop point slide to make room
          let shift = 0
          if (draggingId && !isDragging && drag.current) {
            const from = drag.current.index
            if (from < index && index <= target) shift = -1
            if (target <= index && index < from) shift = 1
          }
          return (
            <div
              key={option.id}
              ref={(el) => (rows.current[index] = el)}
              className={`poll-option-row${isDragging ? ' is-dragging' : ''}`}
              style={{
                transform: isDragging
                  ? `translateY(${offsetY}px)`
                  : shift
                    ? `translateY(${shift * 74}px)`
                    : undefined,
              }}
            >
              <SwipeToDelete
                radius={16}
                surface="var(--bg-tertiary)"
                onDelete={() => removeOption(option.id)}
              >
                <div className="poll-option poll-option--editable">
                  <span
                    className="poll-option__handle"
                    role="button"
                    tabIndex={0}
                    aria-label={`Reorder option ${index + 1}`}
                    onPointerDown={(e) => onPointerDown(e, index, option.id)}
                    onPointerMove={onPointerMove}
                    onPointerUp={onPointerUp}
                    onPointerCancel={onPointerUp}
                  >
                    <DragIcon size={16} />
                  </span>
                  <input
                    className="poll-option__content poll-option__input"
                    value={option.label}
                    onChange={(e) => update(option.id, e.target.value)}
                    placeholder="Add a place…"
                    aria-label="Poll option"
                  />
                  <span className="poll-option__navigate">
                    <MapIcon size={20} />
                  </span>
                </div>
              </SwipeToDelete>
            </div>
          )
        })}

        <button type="button" className="poll-option__add" onClick={() => addOption()}>
          <PlusIcon size={16} /> Add option
        </button>
      </div>

      <SheetActions>
        <SheetButton type="ghost" onClick={() => store.openSheet('poll-question')}>
          Back
        </SheetButton>
        <SheetButton
          disabled={filled < 2}
          onClick={() => {
            store.publishPoll()
            store.closeAllSheets()
          }}
        >
          Send poll
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}

/** S09 — Poll: vote */
export function PollVoteSheet() {
  const store = useStore()
  const poll = store.activePoll
  const [choice, setChoice] = useState<string | null>(null)
  const now = useNow()
  if (!poll) return null
  const countdown = poll.deadlineAt === null ? null : formatCountdown(poll.deadlineAt - now)

  return (
    <Sheet onDismiss={store.closeSheet}>
      <div>
        <h2 className="sheet-title">{poll.question}</h2>
        <p className="sheet-subtitle">
          {poll.eventAt ? `Event scheduled for ${formatTime(poll.eventAt)}` : 'No time set yet'}
        </p>
      </div>

      <div className="poll-options">
        {poll.options.map((option) => (
          <PollOptionRow
            key={option.id}
            label={option.label}
            selected={choice === option.id}
            onClick={() => setChoice(option.id)}
          />
        ))}
      </div>

      <p className="poll-footnote">
        {poll.deadlineAt === null
          ? 'Open until everyone has voted'
          : countdown
            ? `${countdown} left to vote`
            : 'Voting has closed'}
      </p>

      <SheetActions>
        <SheetButton
          disabled={!choice}
          onClick={() => {
            store.castVote(choice!)
            store.openSheet('poll-results')
          }}
        >
          Submit vote
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}

/** S10 / S20 — Poll: results overview */
export function PollResultsSheet() {
  const store = useStore()
  const poll = store.activePoll
  const now = useNow()
  if (!poll) return null
  const countdown = poll.deadlineAt === null ? null : formatCountdown(poll.deadlineAt - now)

  const voters = Object.keys(poll.votes)
  const totalVotes = voters.length
  const tally = poll.options.map((option) => ({
    option,
    count: Object.values(poll.votes).filter((v) => v === option.id).length,
  }))
  const top = Math.max(...tally.map((t) => t.count), 0)
  const myVote = poll.votes[store.you.id]
  const closed = poll.status === 'closed'
  const winner = poll.options.find((o) => o.id === poll.winnerId)

  return (
    <Sheet onDismiss={store.closeSheet} surface="white">
      <div className="poll-results__head">
        <h2 className="sheet-title">{poll.question}</h2>
        <p className="sheet-subtitle">
          {closed
            ? `${winner?.label ?? 'The winner'} is in the itinerary${
                poll.eventAt ? ` for ${formatTime(poll.eventAt)}` : ''
              }`
            : poll.eventAt
              ? `Event scheduled for ${formatTime(poll.eventAt)}`
              : 'No time set yet'}
        </p>
      </div>

      <div className="poll-options">
        {tally.map(({ option, count }) => (
          <PollOptionRow
            key={option.id}
            label={option.label}
            percent={totalVotes ? Math.round((count / totalVotes) * 100) : 0}
            selected={myVote === option.id}
            winning={count === top && top > 0}
            voted
          />
        ))}
      </div>

      <div className="poll-results__footer">
        {voters.length > 0 && <BuddiesPreview ids={voters} size={44} max={4} />}
        <p className="poll-footnote">
          {closed
            ? poll.closedBy === 'deadline'
              ? `Voting closed · ${totalVotes} of ${store.trip.participants.length} voted`
              : `Everyone voted · ${totalVotes} of ${store.trip.participants.length}`
            : poll.deadlineAt === null
              ? 'Open until everyone has voted'
              : countdown
                ? `Left to vote: ${countdown}`
                : 'Closing the poll…'}
        </p>
      </div>

      <SheetActions>
        <SheetButton type="accent" disabled>
          {closed ? 'Added to the itinerary' : 'Vote Submitted'}
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}
