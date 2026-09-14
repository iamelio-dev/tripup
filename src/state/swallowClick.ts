/**
 * Stops the click that follows a gesture from also activating what the gesture
 * happened to land on — a drag, a flick caught mid-glide, a swipe that puts the
 * globe away. All of them end with a pointerup over something tappable, and
 * none of them were a tap.
 *
 * The click, if there is one, is dispatched right after pointerup and before
 * timers, so the guard is gone again on the next task either way. Leaving it
 * armed any longer would swallow the next genuine click.
 */
export function swallowNextClick() {
  const swallow = (event: MouseEvent) => {
    event.stopPropagation()
    event.preventDefault()
  }
  window.addEventListener('click', swallow, true)
  window.setTimeout(() => window.removeEventListener('click', swallow, true), 0)
}
