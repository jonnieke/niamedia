import { useState, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import NiaAgent from './NiaAgent'

export function openNiaAssistant() {
  window.dispatchEvent(new CustomEvent('open-nia-assistant'))
}

export default function GlobalNiaAssistant() {
  const [open, setOpen] = useState(false)
  const location = useLocation()
  const navigate = useNavigate()

  // Open if URL contains ?assistant=1 or ?assistant=true
  useEffect(() => {
    const params = new URLSearchParams(location.search)
    if (params.get('assistant') === '1' || params.get('assistant') === 'true') {
      setOpen(true)
    }
  }, [location.search])

  // Listen for manual trigger events from headers or buttons
  useEffect(() => {
    const handleOpen = () => setOpen(true)
    window.addEventListener('open-nia-assistant', handleOpen)
    return () => window.removeEventListener('open-nia-assistant', handleOpen)
  }, [])

  const handleClose = () => {
    setOpen(false)
    // Clean up ?assistant query param if present
    const params = new URLSearchParams(location.search)
    if (params.has('assistant')) {
      params.delete('assistant')
      const search = params.toString()
      navigate(`${location.pathname}${search ? `?${search}` : ''}`, { replace: true })
    }
  }

  if (!open) return null

  return <NiaAgent onClose={handleClose} />
}
