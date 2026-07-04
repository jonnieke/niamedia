const GA_MEASUREMENT_ID = import.meta.env.VITE_GA_MEASUREMENT_ID?.trim()

type AnalyticsParams = Record<string, string | number | boolean | undefined>

declare global {
  interface Window {
    dataLayer?: unknown[]
    gtag?: (...args: unknown[]) => void
  }
}

let scriptInjected = false
let initialized = false
let clickListenerAttached = false

function canUseAnalytics() {
  return typeof window !== 'undefined' && typeof document !== 'undefined' && Boolean(GA_MEASUREMENT_ID)
}

function getAnchorDetails(target: Element) {
  const anchor = target.closest('a[href]') as HTMLAnchorElement | null
  if (!anchor) return null

  const href = anchor.getAttribute('href') ?? ''
  const label = anchor.textContent?.trim().replace(/\s+/g, ' ').slice(0, 80) || 'unknown'

  return { anchor, href, label }
}

function handleDocumentClick(event: MouseEvent) {
  if (!canUseAnalytics()) return
  const target = event.target as Element | null
  if (!target) return

  const details = getAnchorDetails(target)
  if (!details) return

  const { href, label } = details

  if (href.startsWith('https://wa.me')) {
    trackEvent('whatsapp_click', { cta_label: label, destination: href })
    return
  }

  if (href.includes('/quote')) {
    trackEvent('cta_click', { cta_name: label, cta_location: 'link', destination: href })
    return
  }

  if (href.includes('/book')) {
    trackEvent('booking_click', { cta_name: label, cta_location: 'link', destination: href })
    return
  }

  if (href.includes('assistant=1')) {
    trackEvent('nia_assistant_open', { cta_label: label, destination: href })
  }
}

export function initAnalytics() {
  if (!canUseAnalytics() || initialized) return
  initialized = true

  window.dataLayer = window.dataLayer || []
  window.gtag = function gtag() {
    window.dataLayer?.push(arguments)
  }

  window.gtag('js', new Date())
  window.gtag('config', GA_MEASUREMENT_ID, {
    send_page_view: false,
  })

  if (!clickListenerAttached) {
    clickListenerAttached = true
    document.addEventListener('click', handleDocumentClick, true)
  }

  if (scriptInjected) return
  scriptInjected = true

  const script = document.createElement('script')
  script.async = true
  script.src = 'https://www.googletagmanager.com/gtag/js?id=' + encodeURIComponent(GA_MEASUREMENT_ID)
  document.head.appendChild(script)
}

export function trackPageView(pagePath: string) {
  if (!canUseAnalytics()) return
  window.gtag?.('event', 'page_view', {
    page_path: pagePath,
    page_location: window.location.href,
    page_title: document.title,
  })
}

export function trackEvent(eventName: string, params: AnalyticsParams = {}) {
  if (!canUseAnalytics()) return
  window.gtag?.('event', eventName, params)
}
