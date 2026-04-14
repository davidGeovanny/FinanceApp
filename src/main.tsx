import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.tsx'

// Register the service worker.
// onNeedRefresh fires when a new SW has taken control (skipWaiting fired).
// We reload immediately so the user always gets the latest build.
registerSW({
  onNeedRefresh() {
    window.location.reload()
  },
  onOfflineReady() {
    // App is ready for offline use — no UI needed for now
  },
})

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)