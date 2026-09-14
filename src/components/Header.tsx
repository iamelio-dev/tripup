import type { ReactNode } from 'react'
import { BackIcon, BellIcon } from './Icons'
import { BuddiesPreview } from './Avatar'
import { useArrivedByPush } from './ScreenNav'
import type { PersonId } from '../data/types'
import './header.css'

interface HeaderProps {
  title: string
  subtitle?: string
  /** Home uses a larger subtitle (the year) than the trip dates. */
  subtitleSize?: 'small' | 'large'
  buddies?: PersonId[]
  onBack?: () => void
  onBuddies?: () => void
  onNotifications?: () => void
  /** Shows the unread dot on the bell. */
  hasNotifications?: boolean
  /** Extra trailing controls, placed before the notifications button. */
  actions?: ReactNode
}

/**
 * Header component (Figma: Components / Header, 361 × 65).
 * Shared by S01 and S02/S03 so both screens carry the same title treatment.
 */
export function Header({
  title,
  subtitle,
  subtitleSize = 'small',
  buddies,
  onBack,
  onBuddies,
  onNotifications,
  hasNotifications = false,
  actions,
}: HeaderProps) {
  // the stack only deals itself out on the way in, not on the way back
  const fanIn = useArrivedByPush()
  return (
    <header className="header">
      <div className="header__leading">
        <div className="header__title-row">
          {onBack && (
            <button type="button" className="header__back" onClick={onBack} aria-label="Back">
              <BackIcon size={30} />
            </button>
          )}
          <h1 className="t-hero">{title}</h1>
        </div>
        {subtitle && (
          <p className={`header__dates header__dates--${subtitleSize}`}>{subtitle}</p>
        )}
      </div>
      <div className="header__trailing">
        {actions}
        {buddies && buddies.length > 0 && (
          <BuddiesPreview ids={buddies} size={44} max={3} onClick={onBuddies} fanIn={fanIn} />
        )}
        {onNotifications && (
          <button
            type="button"
            className={`icon-button icon-button--light${hasNotifications ? ' has-badge' : ''}`}
            onClick={onNotifications}
            aria-label="Notifications"
          >
            <BellIcon size={44} />
          </button>
        )}
      </div>
    </header>
  )
}
