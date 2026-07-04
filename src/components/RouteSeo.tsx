import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'

const SITE_URL = 'https://niamedia.co.ke'
const DEFAULT_IMAGE = `${SITE_URL}/images/nia-cafe-owner.png`

const PUBLIC_ROUTES: Record<string, { title: string; description: string }> = {
  '/': {
    title: 'Nia Media | Video Commercials for Kenyan SMEs',
    description: 'Affordable AI-assisted video commercials, campaign ideas, voiceovers, posters, and jingles for Kenyan and East African businesses.',
  },
  '/pricing': {
    title: 'Video Commercial Pricing in Kenya | Nia Media',
    description: 'Transparent Kenya pricing for 15-second promos, social commercials, campaign videos, infomercials, voiceovers, posters, and rush delivery.',
  },
  '/quote': {
    title: 'Get an Instant Video Commercial Quote | Nia Media',
    description: 'Estimate the cost of your business video by duration, platforms, delivery speed, posters, and subtitles. No account required.',
  },
  '/portfolio': {
    title: 'Video Commercial Portfolio | Nia Media Kenya',
    description: 'Explore video commercials, campaign creative, and promotional work produced for Kenyan businesses and growing African brands.',
  },
  '/start': {
    title: 'Start Your Video Project | Nia Media',
    description: 'Submit your business video brief and receive a custom production proposal from Nia Media.',
  },
  '/package-request': {
    title: 'Request a Creative Package | Nia Media',
    description: 'Request campaign copy, video production, voiceover, jingle, poster, or a complete multi-service creative package.',
  },
  '/book': {
    title: 'Book a Creative Consultation | Nia Media',
    description: 'Book a call with Nia Media to discuss your video commercial, campaign concept, budget, and delivery timeline.',
  },
  '/templates': {
    title: 'Campaign and Video Templates | Nia Media',
    description: 'Explore campaign structures, video concepts, and audio formats built for Kenyan and East African businesses.',
  },
  '/terms': {
    title: 'Terms of Service | Nia Media',
    description: 'Terms governing Nia Media campaign, video, audio, and creative production services.',
  },
  '/privacy': {
    title: 'Privacy Policy | Nia Media',
    description: 'How Nia Media collects, uses, and protects customer and platform information.',
  },
}

function setMeta(selector: string, attribute: string, value: string) {
  let element = document.head.querySelector<HTMLMetaElement>(selector)
  if (!element) {
    element = document.createElement('meta')
    const match = selector.match(/meta\[(name|property)="([^"]+)"\]/)
    if (!match) return
    element.setAttribute(match[1], match[2])
    document.head.appendChild(element)
  }
  element.setAttribute(attribute, value)
}

export default function RouteSeo() {
  const { pathname } = useLocation()

  useEffect(() => {
    const seo = PUBLIC_ROUTES[pathname]
    const isPublic = Boolean(seo)
    const title = seo?.title ?? 'Nia Media Workspace'
    const description = seo?.description ?? 'Secure Nia Media customer and production workspace.'
    const canonicalUrl = `${SITE_URL}${isPublic ? pathname : '/'}`

    document.title = title
    setMeta('meta[name="description"]', 'content', description)
    setMeta('meta[name="robots"]', 'content', isPublic ? 'index, follow' : 'noindex, nofollow')
    setMeta('meta[property="og:title"]', 'content', title)
    setMeta('meta[property="og:description"]', 'content', description)
    setMeta('meta[property="og:url"]', 'content', canonicalUrl)
    setMeta('meta[property="og:image"]', 'content', DEFAULT_IMAGE)
    setMeta('meta[name="twitter:title"]', 'content', title)
    setMeta('meta[name="twitter:description"]', 'content', description)
    setMeta('meta[name="twitter:image"]', 'content', DEFAULT_IMAGE)

    let canonical = document.head.querySelector<HTMLLinkElement>('link[rel="canonical"]')
    if (!canonical) {
      canonical = document.createElement('link')
      canonical.rel = 'canonical'
      document.head.appendChild(canonical)
    }
    canonical.href = canonicalUrl
  }, [pathname])

  return null
}