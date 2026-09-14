import { Sheet } from '../components/Sheet'
import {
  ExpenseAddIcon,
  PollIcon,
  SmartAddIcon,
  SpotEventIcon,
  StayIcon,
  TransportIcon,
} from '../components/Icons'
import { useStore } from '../state/store'
import './sheets.css'

/** The kinds of thing you can add, with an example or two of each. */
const KINDS = [
  { label: 'Transport', hint: 'Flight, Train, Bus...', Icon: TransportIcon },
  { label: 'Stay', hint: 'Hotel, Resort, AirBnb...', Icon: StayIcon },
  { label: 'Spot or Event', hint: 'Restaurant, Museum, Concert...', Icon: SpotEventIcon },
]

/** S04 / S11 — Add sheet */
export function AddSheet() {
  const store = useStore()

  return (
    <Sheet onDismiss={store.closeSheet} className="add-sheet">
      <div className="add-sheet__tiles">
        <button type="button" className="add-tile" onClick={() => store.notify('Smart add is not part of this prototype')}>
          <SmartAddIcon size={35} />
          <span>Smart add</span>
        </button>
        <button
          type="button"
          className="add-tile"
          onClick={() => {
            store.resetPollDraft()
            store.openSheet('poll-question')
          }}
        >
          <PollIcon size={35} />
          <span>New Poll</span>
        </button>
        <button
          type="button"
          className="add-tile"
          onClick={() => {
            store.resetBillDraft()
            store.openSheet('bill-total')
          }}
        >
          <ExpenseAddIcon size={35} />
          <span>Log expense</span>
        </button>
      </div>

      <ul className="add-sheet__list">
        {KINDS.map(({ label, hint, Icon }) => (
          <li key={label}>
            <button
              type="button"
              className="add-row"
              onClick={() => store.notify('Add Event is out of scope for this prototype')}
            >
              <span className="add-row__icon">
                <Icon size={30} />
              </span>
              <span className="add-row__text">
                <span className="add-row__label">{label}</span>
                <span className="add-row__hint">{hint}</span>
              </span>
            </button>
          </li>
        ))}
      </ul>
    </Sheet>
  )
}
