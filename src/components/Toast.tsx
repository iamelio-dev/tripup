import { useStore } from '../state/store'
import { CheckIcon } from './Icons'
import './toast.css'

/** Lightweight confirmation for state changes ("Ren joined the trip"). */
export function Toast() {
  const { toast } = useStore()
  if (!toast) return null
  return (
    <div className="toast" role="status">
      <CheckIcon size={16} />
      {toast}
    </div>
  )
}
