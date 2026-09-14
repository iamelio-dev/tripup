import type { Expense, PersonId, Transfer } from '../data/types'

const round = (n: number) => Math.round(n * 100) / 100

/**
 * Splits an amount into n parts that add back up to it exactly. Dividing and
 * rounding each part leaves the group a cent or two out on anything that does
 * not divide — a residue that never cancels, so it survives settling up and
 * shows as a debt of a few cents that cannot be cleared. The cents that will
 * not divide are handed out one each instead.
 */
function splitEvenly(amount: number, n: number): number[] {
  const cents = Math.round(amount * 100)
  const each = Math.trunc(cents / n)
  const over = cents - each * n
  return Array.from({ length: n }, (_, i) => (each + (i < over ? Math.sign(cents) : 0)) / 100)
}

/** What each person owes for a single expense. */
export function sharesFor(expense: Expense): Record<PersonId, number> {
  const shares: Record<PersonId, number> = {}
  const add = (id: PersonId, amount: number) => {
    shares[id] = round((shares[id] ?? 0) + amount)
  }

  if (expense.splitMode === 'items' && expense.items?.length) {
    for (const item of expense.items) {
      if (item.participants.length === 0) continue
      const each = splitEvenly(item.amount, item.participants.length)
      item.participants.forEach((id, i) => add(id, each[i]))
    }
    return shares
  }

  if (expense.participants.length === 0) return shares
  const each = splitEvenly(expense.amount, expense.participants.length)
  expense.participants.forEach((id, i) => add(id, each[i]))
  return shares
}

/** Net position per person: what they paid minus what they owe. */
export function balances(expenses: Expense[], people: PersonId[]): Record<PersonId, number> {
  const net: Record<PersonId, number> = {}
  people.forEach((id) => (net[id] = 0))

  for (const expense of expenses) {
    const perPayer = splitEvenly(expense.amount, Math.max(expense.paidBy.length, 1))
    expense.paidBy.forEach((id, i) => {
      net[id] = round((net[id] ?? 0) + perPayer[i])
    })
    const shares = sharesFor(expense)
    for (const [id, amount] of Object.entries(shares)) {
      net[id] = round((net[id] ?? 0) - amount)
    }
  }
  return net
}

/**
 * Money handed over to square up rather than to buy something: the payer's
 * position rises by what they gave, the receiver's falls by what they took.
 * Kept apart from the expenses so the trip's spending is still its spending.
 */
export function afterSettling(
  net: Record<PersonId, number>,
  settlements: Transfer[],
): Record<PersonId, number> {
  const out = { ...net }
  for (const paid of settlements) {
    out[paid.from] = round((out[paid.from] ?? 0) + paid.amount)
    out[paid.to] = round((out[paid.to] ?? 0) - paid.amount)
  }
  return out
}

/**
 * Greedy settle-up: repeatedly match the biggest debtor with the biggest
 * creditor. Produces at most (n - 1) transfers instead of every pairwise debt.
 */
export function consolidate(net: Record<PersonId, number>): Transfer[] {
  const creditors = Object.entries(net)
    .filter(([, v]) => v > 0.005)
    .map(([id, v]) => ({ id, amount: v }))
  const debtors = Object.entries(net)
    .filter(([, v]) => v < -0.005)
    .map(([id, v]) => ({ id, amount: -v }))

  creditors.sort((a, b) => b.amount - a.amount)
  debtors.sort((a, b) => b.amount - a.amount)

  const transfers: Transfer[] = []
  let c = 0
  let d = 0
  while (c < creditors.length && d < debtors.length) {
    const amount = round(Math.min(creditors[c].amount, debtors[d].amount))
    if (amount > 0.005) transfers.push({ from: debtors[d].id, to: creditors[c].id, amount })
    creditors[c].amount = round(creditors[c].amount - amount)
    debtors[d].amount = round(debtors[d].amount - amount)
    if (creditors[c].amount <= 0.005) c += 1
    if (debtors[d].amount <= 0.005) d += 1
  }
  return transfers
}

/** Number of transfers if everybody settled with everybody directly. */
export function pairwiseTransferCount(expenses: Expense[]): number {
  const pairs = new Set<string>()
  for (const expense of expenses) {
    for (const id of Object.keys(sharesFor(expense))) {
      for (const payer of expense.paidBy) {
        if (id !== payer) pairs.add([id, payer].join('>'))
      }
    }
  }
  return pairs.size
}

export const money = (n: number) => {
  const abs = Math.abs(n)
  const formatted = abs % 1 === 0 ? abs.toFixed(0) : abs.toFixed(2)
  return `$${formatted}`
}

export const money2 = (n: number) => `$${Math.abs(n).toFixed(2)}`
