import { createContext, useContext, useEffect, useState, type ReactNode } from 'react'
import { useLocation, type Location } from 'react-router-dom'
import './screen-nav.css'

/**
 * How the screen being rendered arrived: 'push' if it was just pushed on,
 * 'pop' if it was uncovered by going back, null if it was already there.
 * Entrance flourishes should only run on a push.
 */
const ScreenEntranceContext = createContext<'push' | 'pop' | null>(null)

/** True for the copy of a screen that is on its way out. */
const ScreenLeavingContext = createContext(false)

/** Overlays belong to the screen you are on, not the one sliding away. */
export function useIsLeavingScreen() {
  return useContext(ScreenLeavingContext)
}

/** Read once on mount — the value clears when the transition ends, and a
 *  running CSS animation must not have its class pulled out from under it. */
export function useArrivedByPush() {
  const entrance = useContext(ScreenEntranceContext)
  const [pushed] = useState(() => entrance === 'push')
  return pushed
}

/** Matches the animation length in screen-nav.css. */
const DURATION = 380

/**
 * How deep a route sits in the stack. Going deeper is a push, coming back is a
 * pop — which is all the direction the transition needs.
 */
function depth(pathname: string) {
  if (pathname === '/') return 0
  if (pathname.startsWith('/notifications')) return 2
  return 1
}

/**
 * iOS-style push/pop between screens: the arriving screen slides in from the
 * edge while the one behind it drifts the other way and dims, so the stack
 * reads as layered rather than swapped.
 */
export function ScreenNav({ children }: { children: (location: Location) => ReactNode }) {
  const location = useLocation()
  const [shown, setShown] = useState(location)
  const [leaving, setLeaving] = useState<Location | null>(null)
  const [direction, setDirection] = useState<'push' | 'pop'>('push')

  // Worked out while rendering rather than in an effect. An effect runs after
  // the browser has painted, so the arriving screen would show for a frame at
  // its resting position before the animation took hold — it appeared in place,
  // vanished, then slid in.
  if (shown.key !== location.key) {
    if (shown.pathname !== location.pathname) {
      setDirection(depth(location.pathname) >= depth(shown.pathname) ? 'push' : 'pop')
      setLeaving(shown)
    }
    setShown(location)
  }

  useEffect(() => {
    if (!leaving) return
    const id = window.setTimeout(() => setLeaving(null), DURATION)
    return () => window.clearTimeout(id)
  }, [leaving])

  return (
    <div className={`nav${leaving ? ` is-moving nav--${direction}` : ''}`}>
      {leaving && (
        <div className="nav__screen nav__screen--leaving" key={leaving.key}>
          <ScreenLeavingContext.Provider value={true}>
            <ScreenEntranceContext.Provider value={null}>
              {children(leaving)}
            </ScreenEntranceContext.Provider>
          </ScreenLeavingContext.Provider>
        </div>
      )}
      <div className="nav__screen nav__screen--current" key={shown.key}>
        <ScreenEntranceContext.Provider value={leaving ? direction : null}>
          {children(shown)}
        </ScreenEntranceContext.Provider>
      </div>
    </div>
  )
}
