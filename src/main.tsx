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

if ('serviceWorker' in navigator) {
  if (import.meta.env.PROD) {
    window.addEventListener('load', () => {
      navigator.serviceWorker.register('/sw.js').catch(() => { /* non-fatal */ })
    })
  } else {
    void navigator.serviceWorker.getRegistrations().then(registrations => {
      registrations.forEach(registration => { void registration.unregister() })
    }).catch(() => { /* non-fatal */ })

    if ('caches' in window) {
      void caches.keys().then(keys => Promise.all(keys.map(key => caches.delete(key)))).catch(() => { /* non-fatal */ })
    }
  }
}

