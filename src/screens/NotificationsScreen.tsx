import { useNavigate } from 'react-router-dom'
import { useStore } from '../state/store'
import { Header } from '../components/Header'
import { SheetHost } from '../sheets/SheetHost'
import { TransactionGroup } from '../components/TransactionCard'
import { BuddiesPreview } from '../components/Avatar'
import { ChevronIcon, PollIcon } from '../components/Icons'
import { formatTime } from '../state/clock'
import './notifications.css'

/**
 * Open polls, newest first. Once a poll closes its winner is in the itinerary,
 * so the notification has served its purpose and drops off the list.
 */
export function NotificationsScreen() {
  const store = useStore()
  const navigate = useNavigate()
  const polls = store.polls.filter((p) => p.status === 'live').reverse()

  // The sheet comes up over the list it was opened from — being thrown back to
  // the itinerary loses your place for no reason.
  const open = (pollId: string, voted: boolean) => {
    store.openPoll(pollId, voted ? 'poll-results' : 'poll-vote')
  }

  return (
    <div className="screen notifications">
      <div className="screen__scrim" />
      <Header title="Notifications" onBack={() => navigate(-1)} />

      <div className="scroll notifications__list scroll--under-header">
        {polls.length === 0 ? (
          <p className="notifications__empty">
            Nothing needs you right now. Open polls will show up here.
          </p>
        ) : (
          <TransactionGroup label="Today">
            {polls.map((poll) => {
              const voters = Object.keys(poll.votes)
              const voted = Boolean(poll.votes[store.you.id])
              return (
                <button
                  type="button"
                  key={poll.id}
                  className="notification-row"
                  onClick={() => open(poll.id, voted)}
                >
                  <span className="notification-row__icon">
                    <PollIcon size={20} />
                  </span>
                  <span className="notification-row__body">
                    <span className="notification-row__title">{poll.question}</span>
                    <span className="notification-row__meta">
                      {voted
                        ? `Voted · ${voters.length} of ${store.trip.participants.length}`
                        : 'Waiting for your vote'}
                    </span>
                    {voters.length > 0 && (
                      <span className="notification-row__voters">
                        <BuddiesPreview ids={voters} size={24} max={4} />
                      </span>
                    )}
                  </span>
                  <span className="notification-row__trailing">
                    <span className="notification-row__time">{formatTime(poll.createdAt)}</span>
                    <ChevronIcon size={16} />
                  </span>
                </button>
              )
            })}
          </TransactionGroup>
        )}
        {polls.length > 0 && <div className="notifications__spacer" />}
      </div>
      <SheetHost />
    </div>
  )
}
