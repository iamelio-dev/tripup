import { createContext, useContext } from 'react'

/**
 * How the sheet currently on screen arrived:
 * - `enter` — nothing was open, so the whole surface slides up
 * - `swap`  — it replaced another step, so only the content cross-fades
 */
export type SheetTransition = 'enter' | 'swap'

export const SheetTransitionContext = createContext<SheetTransition>('enter')
export const useSheetTransition = () => useContext(SheetTransitionContext)
