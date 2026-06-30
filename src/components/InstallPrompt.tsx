import { useEffect, useState } from 'react'
import { X, Smartphone, Bell, BellOff } from 'lucide-react'
import { subscribeToPush, isPushSubscribed, isPushSupported } from '../lib/pushNotifications'

interface BeforeInstallPromptEvent extends Event {
  prompt(): Promise<void>
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed' }>
}

export default function InstallPrompt() {
  const [installEvent, setInstallEvent] = useState<BeforeInstallPromptEvent | null>(null)
  const [showInstall, setShowInstall] = useState(false)
  const [showPush, setShowPush] = useState(false)
  const [pushSubscribed, setPushSubscribed] = useState(false)
  const [pushLoading, setPushLoading] = useState(false)
  const [dismissed, setDismissed] = useState(
    () => localStorage.getItem('install_prompt_dismissed') === '1'
  )

  useEffect(() => {
    // Install prompt
    const handler = (e: Event) => {
      e.preventDefault()
      setInstallEvent(e as BeforeInstallPromptEvent)
      if (!dismissed && !localStorage.getItem('app_installed')) setShowInstall(true)
    }
    window.addEventListener('beforeinstallprompt', handler)

    // Push notification prompt — show after 30s if supported and not already subscribed
    if (isPushSupported() && Notification.permission === 'default') {
      const timer = setTimeout(() => setShowPush(true), 30_000)
      return () => { window.removeEventListener('beforeinstallprompt', handler); clearTimeout(timer) }
    }

    // Already subscribed?
    isPushSubscribed().then(subscribed => setPushSubscribed(subscribed))

    return () => window.removeEventListener('beforeinstallprompt', handler)
  }, [dismissed])

  const install = async () => {
    if (!installEvent) return
    await installEvent.prompt()
    const { outcome } = await installEvent.userChoice
    if (outcome === 'accepted') localStorage.setItem('app_installed', '1')
    setShowInstall(false)
    setInstallEvent(null)
  }

  const enablePush = async () => {
    setPushLoading(true)
    const ok = await subscribeToPush()
    setPushLoading(false)
    if (ok) setPushSubscribed(true)
    setShowPush(false)
  }

  const dismissInstall = () => {
    localStorage.setItem('install_prompt_dismissed', '1')
    setDismissed(true)
    setShowInstall(false)
  }

  // Install banner (shows first, disappears after action)
  if (showInstall) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl shadow-2xl border border-purple-200 bg-white p-4 flex items-start gap-3 animate-slide-up">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <Smartphone size={18} className="text-white" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 mb-0.5">Add Nia Media to your phone</p>
          <p className="text-xs text-gray-500 leading-relaxed">Open your campaigns and leads instantly — no browser needed.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={install}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-white"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              Install app
            </button>
            <button onClick={dismissInstall}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
              Not now
            </button>
          </div>
        </div>
        <button onClick={dismissInstall} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  // Push notification prompt
  if (showPush && !pushSubscribed) {
    return (
      <div className="fixed bottom-4 left-4 right-4 sm:left-auto sm:right-4 sm:w-80 z-50 rounded-2xl shadow-2xl border border-purple-200 bg-white p-4 flex items-start gap-3">
        <div className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0"
          style={{ background: 'rgba(124,58,237,0.1)' }}>
          <Bell size={18} className="text-purple-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-gray-900 mb-0.5">Get instant lead alerts</p>
          <p className="text-xs text-gray-500 leading-relaxed">We'll notify you the moment someone enquires via your campaign page.</p>
          <div className="flex gap-2 mt-3">
            <button onClick={enablePush} disabled={pushLoading}
              className="flex-1 py-2 rounded-lg text-xs font-bold text-white disabled:opacity-60"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {pushLoading ? 'Enabling…' : 'Enable alerts'}
            </button>
            <button onClick={() => setShowPush(false)}
              className="px-3 py-2 rounded-lg text-xs font-medium text-gray-500 border border-gray-200 hover:bg-gray-50 transition-colors">
              Later
            </button>
          </div>
        </div>
        <button onClick={() => setShowPush(false)} className="text-gray-400 hover:text-gray-600 transition-colors shrink-0">
          <X size={14} />
        </button>
      </div>
    )
  }

  // Small bell icon in corner if push is available but not subscribed (after prompt dismissed)
  if (isPushSupported() && !pushSubscribed && Notification.permission === 'default' && !showPush) {
    return (
      <button
        onClick={() => setShowPush(true)}
        title="Enable lead notifications"
        className="fixed bottom-4 right-4 z-40 w-11 h-11 rounded-full shadow-lg flex items-center justify-center border border-gray-200 bg-white hover:bg-purple-50 transition-colors"
      >
        <BellOff size={16} className="text-gray-400" />
      </button>
    )
  }

  return null
}
