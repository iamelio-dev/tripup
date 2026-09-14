import { useState } from 'react'
import { Sheet, SheetActions, SheetButton, SheetDivider } from '../components/Sheet'
import { BuddyGrid } from '../components/BuddyGrid'
import { Avatar } from '../components/Avatar'
import { DeleteKeyIcon, PlusIcon, ScanIcon } from '../components/Icons'
import { PEOPLE } from '../data/seed'
import { SwipeToDelete } from '../components/SwipeToDelete'
import type { PersonId } from '../data/types'
import { useStore } from '../state/store'
import './sheets.css'

const uid = () => Math.random().toString(36).slice(2, 9)
const fmt = (n: number) => (n % 1 === 0 ? `$${n.toFixed(0)}` : `$${n.toFixed(2)}`)

/** The line items a restaurant bill breaks down into, scaled to the bill total. */
const ITEM_TEMPLATE = [
  { label: 'Mains to share', ratio: 98 / 186 },
  { label: 'Mezze & sides', ratio: 28 / 186 },
  { label: 'House wine', ratio: 60 / 186 },
]

function seedItems(total: number, participants: PersonId[]) {
  const rest = ITEM_TEMPLATE.slice(1).map((t) => ({
    id: uid(),
    label: t.label,
    amount: Math.round(total * t.ratio * 100) / 100,
    participants: [...participants],
  }))
  const remainder = Math.round((total - rest.reduce((s, i) => s + i.amount, 0)) * 100) / 100
  return [
    { id: uid(), label: ITEM_TEMPLATE[0].label, amount: remainder, participants: [...participants] },
    ...rest,
  ]
}

/** The sentence that grows across S13 → S17. */
function BillSentence({ withPayers, withSplit }: { withPayers?: boolean; withSplit?: boolean }) {
  const { billDraft } = useStore()
  const amount = fmt(Number(billDraft.amount) || 0)
  const names = billDraft.paidBy.map((id) => PEOPLE[id].name)
  const payers =
    names.length <= 1
      ? names[0]
      : `${names.slice(0, -1).join(', ')} and ${names[names.length - 1]}`

  return (
    <h2 className="bill-sentence">
      <strong>{amount}</strong> <span>for</span> <strong>{billDraft.title || billDraft.titleSuggestion}</strong>
      {withPayers && (
        <>
          <span>,</span>
          <br />
          <strong>paid equally</strong> <span>by</span> <strong>{payers}</strong>
        </>
      )}
      {withSplit && (
        <>
          {' '}
          <span>and</span>{' '}
          <strong>{billDraft.splitMode === 'items' ? 'split by item' : 'split equally'}</strong>
          <span>.</span>
        </>
      )}
    </h2>
  )
}

/** S12 — Bill total */
export function BillTotalSheet() {
  const store = useStore()
  const { billDraft, setBillDraft } = store
  const amount = billDraft.amount

  const press = (key: string) => {
    if (key === 'del') return setBillDraft({ amount: amount.slice(0, -1) })
    if (key === '.' && amount.includes('.')) return
    if (amount.replace('.', '').length >= 6) return
    setBillDraft({ amount: amount + key })
  }

  const display = amount === '' ? '$0' : `$${amount}`

  return (
    <Sheet
      onDismiss={store.closeSheet}
      footer={
        <div className="keypad">
          {[
            ['1', ''],
            ['2', 'ABC'],
            ['3', 'DEF'],
            ['4', 'GHI'],
            ['5', 'JKL'],
            ['6', 'MNO'],
            ['7', 'PQRS'],
            ['8', 'TUV'],
            ['9', 'WXYZ'],
            ['.', ''],
            ['0', ''],
            ['del', ''],
          ].map(([key, sub]) => (
            <button
              key={key}
              type="button"
              className={`keypad__key${key === 'del' || key === '.' ? ' keypad__key--plain' : ''}`}
              onClick={() => press(key)}
            >
              {key === 'del' ? (
                <DeleteKeyIcon size={25} />
              ) : (
                <>
                  <span className="keypad__digit">{key}</span>
                  {sub && <span className="keypad__letters">{sub}</span>}
                </>
              )}
            </button>
          ))}
        </div>
      }
    >
      <div className="bill-total__bar">
        <h2 className="sheet-heading">Bill Total</h2>
        <span className="bill-total__currency">USD</span>
      </div>

      <p className="bill-total__amount">{display}</p>

      <div className="bill-total__for">
        <h3 className="sheets__label">For</h3>
        <input
          className="sheet-field"
          value={billDraft.title}
          onChange={(e) => setBillDraft({ title: e.target.value })}
          placeholder="Dinner, taxi, tickets…"
          aria-label="What is this expense for"
        />
      </div>

      <SheetActions>
        <SheetButton type="ghost" disabled>
          <span className="bill-total__scan">
            <ScanIcon size={22} /> Scan Bill
          </span>
        </SheetButton>
        <SheetButton
          disabled={!Number(amount)}
          onClick={() => store.openSheet('bill-paid-by')}
        >
          Next
        </SheetButton>
      </SheetActions>

    </Sheet>
  )
}

/** S13 — Paid by */
export function BillPaidBySheet() {
  const store = useStore()
  const { billDraft, setBillDraft } = store

  return (
    <Sheet onDismiss={store.closeSheet}>
      <BillSentence />

      <div className="sheet-row">
        <span className="sheet-row__label">Paid</span>
        <span className="sheet-row__value">Equally</span>
      </div>

      <SheetDivider label="By" />

      <BuddyGrid
        ids={store.trip.participants}
        selected={billDraft.paidBy}
        onToggle={(id) =>
          setBillDraft({
            paidBy: billDraft.paidBy.includes(id)
              ? billDraft.paidBy.filter((p) => p !== id)
              : [...billDraft.paidBy, id],
          })
        }
      />

      <SheetActions>
        <SheetButton type="ghost" onClick={() => store.openSheet('bill-total')}>
          Back
        </SheetButton>
        <SheetButton
          disabled={billDraft.paidBy.length === 0}
          onClick={() => store.openSheet('bill-split')}
        >
          Next
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}

/** S14 / S15 — Split equally or by item */
export function BillSplitSheet() {
  const store = useStore()
  const { billDraft, setBillDraft } = store
  const total = Number(billDraft.amount) || 0

  // Nothing to summarise until the split actually covers someone.
  const splitIsValid =
    billDraft.splitMode === 'equally'
      ? billDraft.splitWith.length > 0
      : billDraft.items.some((i) => i.amount > 0 && i.participants.length > 0)

  const setMode = (mode: 'equally' | 'items') => {
    if (mode === 'items' && billDraft.items.length === 0) {
      setBillDraft({ splitMode: mode, items: seedItems(total, store.trip.participants) })
    } else {
      setBillDraft({ splitMode: mode })
    }
  }

  return (
    <Sheet onDismiss={store.closeSheet}>
      <BillSentence withPayers />

      <div className="split-toggle">
        <span className="sheet-row__label">Split</span>
        <div className="split-toggle__options">
          <button
            type="button"
            className={billDraft.splitMode === 'equally' ? 'is-active' : ''}
            onClick={() => setMode('equally')}
          >
            Equally
          </button>
          <button
            type="button"
            className={billDraft.splitMode === 'items' ? 'is-active' : ''}
            onClick={() => setMode('items')}
          >
            By item
          </button>
        </div>
      </div>

      {billDraft.splitMode === 'equally' ? (
        <>
          <SheetDivider label="By" />
          <BuddyGrid
            ids={store.trip.participants}
            selected={billDraft.splitWith}
            onToggle={(id) =>
              setBillDraft({
                splitWith: billDraft.splitWith.includes(id)
                  ? billDraft.splitWith.filter((p) => p !== id)
                  : [...billDraft.splitWith, id],
              })
            }
          />
        </>
      ) : (
        <>
          <SheetDivider label="Items list" />
          <ItemList editable />
        </>
      )}

      <SheetActions>
        <SheetButton type="ghost" onClick={() => store.openSheet('bill-paid-by')}>
          Back
        </SheetButton>
        <SheetButton disabled={!splitIsValid} onClick={() => store.openSheet('bill-summary')}>
          Summary
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}

/** Items list shared by S15 and S17. */
function ItemList({ editable = false }: { editable?: boolean }) {
  const store = useStore()
  const { billDraft, setBillDraft } = store
  const everyone = store.trip.participants.length

  const addItem = () =>
    setBillDraft({
      items: [
        ...billDraft.items,
        { id: uid(), label: '', amount: 0, participants: [...store.trip.participants] },
      ],
    })

  const removeItem = (id: string) =>
    setBillDraft({ items: billDraft.items.filter((i) => i.id !== id) })

  const patch = (id: string, key: 'label' | 'amount', value: string) =>
    setBillDraft({
      items: billDraft.items.map((item) =>
        item.id === id
          ? { ...item, [key]: key === 'amount' ? Number(value) || 0 : value }
          : item,
      ),
    })

  return (
    <div className="item-list">
      {billDraft.items.map((item) => {
        const row = (
        <div className="item-row">
          {editable ? (
            <input
              className="item-row__label"
              value={item.label}
              onChange={(e) => patch(item.id, 'label', e.target.value)}
              placeholder="Item"
              aria-label="Item name"
            />
          ) : (
            <span className="item-row__label">{item.label}</span>
          )}
          {editable ? (
            <span className="item-row__amount-field">
              $
              <input
                className="item-row__amount-input"
                value={item.amount || ''}
                onChange={(e) => patch(item.id, 'amount', e.target.value)}
                inputMode="decimal"
                placeholder="0"
                aria-label="Item amount"
              />
            </span>
          ) : (
            <span className="item-row__amount">{fmt(item.amount)}</span>
          )}
          <span className="item-row__rule" />
          <button
            type="button"
            className="item-row__people"
            onClick={
              editable
                ? () => {
                    setBillDraft({ editingItemId: item.id })
                    store.pushSheet('bill-item-buddies')
                  }
                : undefined
            }
            disabled={!editable}
            aria-label={`Who shares ${item.label}`}
          >
            {item.participants.length === everyone ? (
              <span className="item-row__all">All</span>
            ) : (
              <span className="item-row__stack">
                {item.participants.slice(0, 2).map((id) => (
                  <Avatar key={id} id={id} size={30} ring />
                ))}
                {item.participants.length > 2 && (
                  <span className="avatar avatar--ring avatar--more" style={{ width: 30, height: 30, fontSize: 10 }}>
                    +{item.participants.length - 2}
                  </span>
                )}
                {item.participants.length === 0 && <span className="item-row__all">None</span>}
              </span>
            )}
          </button>
        </div>
        )
        // only a list you can add to is a list you can swipe to delete from
        return editable ? (
          <SwipeToDelete
            key={item.id}
            radius={16}
            surface="var(--bg-tertiary)"
            onDelete={() => removeItem(item.id)}
          >
            {row}
          </SwipeToDelete>
        ) : (
          <div key={item.id}>{row}</div>
        )
      })}

      {editable && (
        <button type="button" className="item-list__add" onClick={addItem}>
          <PlusIcon size={16} /> Add item
        </button>
      )}
    </div>
  )
}

/** S16 — Remove / add a buddy from an item */
export function BillItemBuddiesSheet({ stacked }: { stacked?: boolean }) {
  const store = useStore()
  const { billDraft } = store
  const item = billDraft.items.find((i) => i.id === billDraft.editingItemId)
  const [draft, setDraft] = useState<PersonId[]>(item?.participants ?? [])
  if (!item) return null

  return (
    <Sheet onDismiss={store.closeSheet} stacked={stacked}>
      <h2 className="sheet-heading">{item.label || 'Item'}</h2>

      <BuddyGrid
        ids={store.trip.participants}
        selected={draft}
        onToggle={(id) =>
          setDraft((d) => (d.includes(id) ? d.filter((x) => x !== id) : [...d, id]))
        }
      />

      <SheetActions>
        <SheetButton type="ghost" onClick={store.closeSheet}>
          Cancel
        </SheetButton>
        <SheetButton
          disabled={draft.length === 0}
          onClick={() => {
            store.setBillDraft({
              items: billDraft.items.map((i) =>
                i.id === item.id ? { ...i, participants: draft } : i,
              ),
              editingItemId: null,
            })
            store.closeSheet()
          }}
        >
          Confirm
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}

/** S17 — Summary */
export function BillSummarySheet() {
  const store = useStore()
  const { billDraft } = store

  return (
    <Sheet onDismiss={store.closeSheet}>
      <BillSentence withPayers withSplit />

      {billDraft.splitMode === 'items' ? (
        <ItemList />
      ) : (
        <div className="sheet-row">
          <span className="sheet-row__label">Split between</span>
          <span className="sheet-row__value">{billDraft.splitWith.length} buddies</span>
        </div>
      )}

      <SheetActions>
        <SheetButton type="ghost" onClick={() => store.openSheet('bill-split')}>
          Back
        </SheetButton>
        <SheetButton
          onClick={() => {
            store.logExpense()
            store.closeAllSheets()
          }}
        >
          Log Expense
        </SheetButton>
      </SheetActions>
    </Sheet>
  )
}
