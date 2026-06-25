export type UserRole = 'user' | 'admin'

export interface User {
  id: string
  name: string
  email: string
  role: UserRole
  created_at: string
}

export interface Campaign {
  id: string
  user_id: string
  business_name: string
  industry: string
  product_name: string
  objective: string
  target_audience: string
  location: string
  offer: string
  tone: string
  platforms: string[]
  cta: string
  notes: string
  generated_content?: GeneratedContent
  status: CampaignStatus
  created_at: string
}

export type CampaignStatus = 'Draft' | 'Generated' | 'In Review' | 'Delivered' | 'Published'

export interface GeneratedContent {
  strategy: {
    angle: string
    painPoint: string
    keyMessage: string
    platforms: string[]
    cta: string
  }
  videoScript: {
    hook: string
    scene1: string
    scene2: string
    scene3: string
    callToAction: string
    visualDirection: string
  }
  posterCopy: {
    headline: string
    subheadline: string
    offerText: string
    cta: string
    designDirection: string
  }
  captions: {
    facebook: string
    instagram: string
    tiktok: string
    linkedin: string
  }
  whatsapp: {
    status: string
    broadcast: string
    reply: string
  }
  landingPage: {
    headline: string
    subheadline: string
    benefits: string[]
    cta: string
    faqs: Array<{ question: string; answer: string }>
  }
  // Added 2026-06-25 — optional for back-compat with campaigns saved before this.
  youtubeShorts?: {
    hook: string
    script: string
    caption: string
  }
  contentCalendar?: Array<{
    day: string
    platform: string
    format: string
    idea: string
    caption: string
  }>
  followUps?: {
    firstFollowUp: string
    secondFollowUp: string
    finalFollowUp: string
  }
}

export interface PackageRequest {
  id: string
  name: string
  business_name: string
  phone: string
  email: string
  industry: string
  package: string
  message: string
  status: PackageStatus
  created_at: string
}

export type PackageStatus = 'New' | 'Contacted' | 'In Progress' | 'Delivered' | 'Closed'

export interface Template {
  id: string
  name: string
  industry: string
  description: string
  platforms: string[]
  prompt_structure: string
  created_at: string
}

export interface BrandKit {
  business_name: string
  logo_url?: string
  primary_color: string
  secondary_color: string
  phone: string
  whatsapp: string
  website: string
  preferred_tone: string
  target_customer: string
  business_description: string
}

export interface CampaignFormData {
  business_name: string
  industry: string
  product_name: string
  objective: string
  target_audience: string
  location: string
  offer: string
  tone: string
  platforms: string[]
  cta: string
  notes: string
  whatsapp_number?: string
}
