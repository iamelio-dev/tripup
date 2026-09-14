import { useState } from 'react'
import { Sheet, SheetActions, SheetButton } from '../components/Sheet'
import { BuddyGrid } from '../components/BuddyGrid'
import { PlusIcon } from '../components/Icons'
import { CONTACTS, PEOPLE } from '../data/seed'
import { useStore } from '../state/store'
import './sheets.css'

/** S05 — Travel Buddies */
export function BuddiesSheet() {
  const store = useStore()
  return (
    <Sheet onDismiss={store.closeSheet}>
      <div className="buddies-sheet__head">
        <h2 className="sheet-heading">Travel Buddies</h2>
        <button
          type="button"
          className="buddies-sheet__add"
          onClick={() => store.pushSheet('search-buddy')}
          aria-label="Add buddy"
        >
          <PlusIcon size={22} />
        </button>
      </div>
      <BuddyGrid ids={store.trip.participants} />
    </Sheet>
  )
}

/** S06 — Search Buddy */
export function SearchBuddySheet({ stacked }: { stacked?: boolean }) {
  const store = useStore()
  const [query, setQuery] = useState('')
  const [picked, setPicked] = useState<string[]>([])

  const results = CONTACTS.filter(
    (id) =>
      !store.trip.participants.includes(id) &&
      PEOPLE[id].name.toLowerCase().includes(query.trim().toLowerCase()),
  )

  return (
    <Sheet onDismiss={store.closeSheet} stacked={stacked}>
      <h2 className="sheet-heading">Search Buddy</h2>

      <label className="search-field">
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search"
          aria-label="Search contacts"
        />
      </label>

      <div>
        <h3 className="sheets__label">Your Contacts</h3>
        <BuddyGrid
          ids={results}
          selected={picked}
          onToggle={(id) =>
            setPicked((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))
          }
        />
        {results.length === 0 && <p className="sheets__empty">No matching contacts.</p>}
      </div>

      <SheetActions>
        <SheetButton type="ghost" onClick={store.closeSheet}>
          Cancel
        </SheetButton>
        <SheetButton
          disabled={picked.length === 0}
          onClick={() => {
            picked.forEach(store.addParticipant)
            setPicked([])
            store.closeSheet()
          }}
        >
          Add Buddy
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}
