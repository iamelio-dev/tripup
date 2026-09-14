import { Sheet, SheetActions, SheetButton, SheetDivider } from '../components/Sheet'
import { Avatar } from '../components/Avatar'
import { ChevronIcon } from '../components/Icons'
import { PEOPLE } from '../data/seed'
import { money2, pairwiseTransferCount } from '../state/money'
import { useStore } from '../state/store'
import './sheets.css'

/**
 * Breakdown — who owes whom after TripUp consolidates the debts.
 * Reached from "See Breakdown" on the expenses screen (S03).
 */
export function BreakdownSheet() {
  const store = useStore()
  const { you, trip, netBalances, transfers } = store
  const balance = netBalances[you.id] ?? 0
  const direct = pairwiseTransferCount(trip.expenses)

  const mine = transfers.filter((t) => t.from === you.id || t.to === you.id)
  const others = transfers.filter((t) => t.from !== you.id && t.to !== you.id)
  // Only what you owe is yours to pay off; being owed is the others' move.
  const owing = transfers.filter((t) => t.from === you.id)
  const awaited = transfers.filter((t) => t.to === you.id)

  return (
    <Sheet onDismiss={store.closeSheet} surface="white">
      <div className="poll-results__head">
        <h2 className="sheet-title">Breakdown</h2>
        <p className="sheet-subtitle">
          {owing.length > 0
            ? `You owe ${money2(balance)} across ${trip.participants.length} buddies`
            : awaited.length > 0
              ? `You are owed ${money2(balance)} — ${
                  awaited.length === 1 ? 'that payment is' : 'those payments are'
                } theirs to make`
              : `Nothing left between you and the other ${trip.participants.length - 1} buddies`}
        </p>
      </div>

      <div className="balance-list">
        {trip.participants.map((id) => {
          const value = netBalances[id] ?? 0
          return (
            <div className="balance-row" key={id}>
              <Avatar id={id} size={38} ring />
              <span className="balance-row__name">
                {PEOPLE[id].name}
                {id === you.id && <span className="balance-row__you">You</span>}
              </span>
              <span className={`balance-row__value${value > 0.005 ? ' is-credit' : ''}`}>
                {/* nobody is owed nothing — a settled row carries no sign */}
                {Math.abs(value) < 0.005 ? '' : value > 0 ? '+ ' : '− '}
                {money2(value)}
              </span>
            </div>
          )
        })}
      </div>

      <SheetDivider label="Consolidated debts" />

      <p className="breakdown__note">
        TripUp nets everything off, so the group settles in{' '}
        <strong>{transfers.length} transfers</strong> instead of {direct}.
      </p>

      <div className="transfer-list">
        {[...mine, ...others].map((t, i) => (
          <div className={`transfer-row${t.from === you.id || t.to === you.id ? ' is-yours' : ''}`} key={i}>
            <Avatar id={t.from} size={34} ring />
            <span className="transfer-row__name">{PEOPLE[t.from].name}</span>
            <ChevronIcon size={16} />
            <Avatar id={t.to} size={34} ring />
            <span className="transfer-row__name">{PEOPLE[t.to].name}</span>
            <span className="transfer-row__amount">{money2(t.amount)}</span>
          </div>
        ))}
        {transfers.length === 0 && <p className="sheets__empty">Everyone is settled up.</p>}
      </div>

      {/* Nothing to offer when the next move is someone else's: the breakdown
          is still worth reading, it just cannot be acted on. */}
      {owing.length > 0 && (
        <SheetActions>
          <SheetButton type="accent" onClick={store.settleUp}>
            Settle now
          </SheetButton>
        </SheetActions>
      )}
    </Sheet>
  )
}
