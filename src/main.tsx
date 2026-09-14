import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App'
import { preloadAssets } from './state/preloadAssets'
import './styles/global.css'

/** Long enough for the pictures on a normal connection, short enough that a
 *  bad one costs a moment rather than the demo. */
const WAIT_FOR_PICTURES = 1500

preloadAssets(WAIT_FOR_PICTURES).then(() => {
  createRoot(document.getElementById('root')!).render(
    <StrictMode>
      <App />
    </StrictMode>,
  )
})
