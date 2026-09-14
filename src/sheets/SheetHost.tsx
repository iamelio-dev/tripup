import { useEffect } from 'react'
import { useStore, type SheetId } from '../state/store'
import { useIsLeavingScreen } from '../components/ScreenNav'
import { SheetTransitionContext } from '../state/sheetTransition'
import { AddSheet } from './AddSheet'
import { BuddiesSheet, SearchBuddySheet } from './BuddiesSheets'
import { PollOptionsSheet, PollQuestionSheet, PollResultsSheet, PollVoteSheet } from './PollSheets'
import {
  BillItemBuddiesSheet,
  BillPaidBySheet,
  BillSplitSheet,
  BillSummarySheet,
  BillTotalSheet,
} from './BillSheets'
import { BreakdownSheet } from './BreakdownSheet'
import { PollTimeSheet } from './PollTimeSheet'
import type { TripTab } from '../components/TabBar'

const EXPENSE_SHEETS: SheetId[] = [
  'bill-total',
  'bill-paid-by',
  'bill-split',
  'bill-item-buddies',
  'bill-summary',
]

/**
 * Renders the sheet stack over whichever screen hosts it. Screens that have no
 * tabs to switch to — notifications — leave `onSwitchTab` off.
 */
export function SheetHost({ onSwitchTab }: { onSwitchTab?: (tab: TripTab) => void }) {
  const store = useStore()
  const leaving = useIsLeavingScreen()
  const top = store.sheets[store.sheets.length - 1]

  // Logging an expense lands the reviewer on the expenses tab, where the
  // updated balances live.
  useEffect(() => {
    if (top && EXPENSE_SHEETS.includes(top)) onSwitchTab?.('expenses')
  }, [top, onSwitchTab])

  // Two screens are mounted at once mid-transition; only the arriving one
  // should be carrying the sheet.
  if (leaving) return null

  return (
    <SheetTransitionContext.Provider value={store.sheetTransition}>
      {store.sheets.map((id, index) => {
        const stacked = index > 0
        switch (id) {
          case 'add':
            return <AddSheet key={id} />
          case 'buddies':
            return <BuddiesSheet key={id} />
          case 'search-buddy':
            return <SearchBuddySheet key={id} stacked={stacked} />
          case 'poll-question':
            return <PollQuestionSheet key={id} />
          case 'poll-options':
            return <PollOptionsSheet key={id} />
          case 'poll-vote':
            return <PollVoteSheet key={id} />
          case 'poll-results':
            return <PollResultsSheet key={id} />
          case 'bill-total':
            return <BillTotalSheet key={id} />
          case 'bill-paid-by':
            return <BillPaidBySheet key={id} />
          case 'bill-split':
            return <BillSplitSheet key={id} />
          case 'bill-item-buddies':
            return <BillItemBuddiesSheet key={id} stacked={stacked} />
          case 'bill-summary':
            return <BillSummarySheet key={id} />
          case 'breakdown':
            return <BreakdownSheet key={id} />
          case 'poll-time':
            return <PollTimeSheet key={id} stacked={stacked} />
          default:
            return null
        }
      })}
    </SheetTransitionContext.Provider>
  )
}
