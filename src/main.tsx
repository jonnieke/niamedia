import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'
import { initAnalytics } from './lib/analytics'

initAnalytics()

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  // Keep first launch clean: clear stale workers/caches instead of serving an old shell.
  void navigator.serviceWorker.getRegistrations()
    .then(registrations => Promise.all(registrations.map(registration => registration.unregister())))
    .catch(() => { /* non-fatal */ })

  if ('caches' in window) {
    void caches.keys()
      .then(keys => Promise.all(keys.map(key => caches.delete(key))))
      .catch(() => { /* non-fatal */ })
  }
}
