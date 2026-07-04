const DEFAULT_CAL_BOOKING_URL = 'https://cal.com'
export const BOOKING_PATH = '/book'

export type BookingService = 'video' | 'campaign' | 'consultation' | 'urgent'

const CAL_BOOKING_URLS: Record<BookingService, string | undefined> = {
  video: (import.meta.env.VITE_CAL_BOOKING_URL_VIDEO as string | undefined)?.trim(),
  campaign: (import.meta.env.VITE_CAL_BOOKING_URL_CAMPAIGN as string | undefined)?.trim(),
  consultation: (import.meta.env.VITE_CAL_BOOKING_URL_CONSULTATION as string | undefined)?.trim(),
  urgent: (import.meta.env.VITE_CAL_BOOKING_URL_URGENT as string | undefined)?.trim(),
}

export function normalizeCalBookingUrl(value?: string) {
  const trimmed = value?.trim()
  if (!trimmed) return undefined

  let candidate = trimmed
  if (/^(?:www\.)?cal\.com(?:\/|$)/i.test(candidate)) {
    candidate = `https://${candidate.replace(/^www\./i, '')}`
  } else if (!/^[a-z][a-z\d+.-]*:\/\//i.test(candidate)) {
    candidate = `https://cal.com/${candidate.replace(/^\/+/, '')}`
  }

  try {
    const url = new URL(candidate)
    if (url.hostname === 'www.cal.com') url.hostname = 'cal.com'

    if (url.hostname === 'cal.com') {
      const parts = url.pathname.split('/').filter(Boolean)
      while (parts[0] && /^(?:www\.|app\.)?cal\.com$/i.test(parts[0])) parts.shift()
      url.pathname = `/${parts.join('/')}`
      url.protocol = 'https:'
    }

    return url.toString()
  } catch {
    return undefined
  }
}

export function getBookingUrl(service?: BookingService) {
  const configuredUrl = (service ? CAL_BOOKING_URLS[service] : undefined)
    || (service === 'urgent' ? CAL_BOOKING_URLS.consultation : undefined)
    || (import.meta.env.VITE_CAL_BOOKING_URL as string | undefined)?.trim()

  return normalizeCalBookingUrl(configuredUrl) || DEFAULT_CAL_BOOKING_URL
}

export function getCalBookingTarget(service?: BookingService) {
  try {
    const url = new URL(getBookingUrl(service))
    const parts = url.pathname.split('/').filter(Boolean)
    if (parts.length < 2) return null
    return {
      username: parts[0],
      eventSlug: parts[1],
      origin: url.origin,
    }
  } catch {
    return null
  }
}

export function getBookingPath(service?: string, extraParams?: Record<string, string | undefined>) {
  const params = new URLSearchParams()
  if (service) params.set('service', service)
  for (const [key, value] of Object.entries(extraParams ?? {})) {
    if (value) params.set(key, value)
  }
  const query = params.toString()
  return query ? `${BOOKING_PATH}?${query}` : BOOKING_PATH
}

export function openBookingUrl(service?: BookingService) {
  window.open(getBookingUrl(service), '_blank', 'noopener,noreferrer')
}
