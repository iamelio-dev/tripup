import type { ReactNode } from 'react'
import './transaction-card.css'

/** Transaction Card group (Figma: date chip + white 36-radius stack of rows). */
export function TransactionGroup({ label, children }: { label: string; children: ReactNode }) {
  return (
    <section className="transaction-group">
      <div className="transaction-group__head">
        <span className="transaction-group__label">{label}</span>
      </div>
      <div className="transaction-group__body">{children}</div>
    </section>
  )
}

export function TransactionRow({
  title,
  subtitle,
  amount,
  caption,
  tone = 'default',
}: {
  title: string
  subtitle?: string
  amount: string
  caption?: string
  tone?: 'default' | 'owed'
}) {
  return (
    <div className="transaction-row">
      <div className="transaction-row__left">
        <span className="transaction-row__title">{title}</span>
        {subtitle && <span className="transaction-row__subtitle">{subtitle}</span>}
      </div>
      <div className="transaction-row__right">
        <span className={`transaction-row__amount${tone === 'owed' ? ' is-owed' : ''}`}>{amount}</span>
        {caption && <span className="transaction-row__caption">{caption}</span>}
      </div>
    </div>
  )
}
