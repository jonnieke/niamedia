import { Campaign, PackageRequest, User } from '../types'

export const mockUser: User = {
  id: 'u1',
  name: 'Admin User',
  email: 'admin@niamedia.co',
  role: 'admin',
  created_at: '2024-01-15T10:00:00Z',
}

export const mockCampaigns: Campaign[] = [
  {
    id: 'c1',
    user_id: 'u1',
    business_name: 'Ruaka Heights',
    industry: 'Real Estate',
    product_name: 'Ruaka Apartment Launch',
    objective: 'Get leads',
    target_audience: 'Young professionals and families',
    location: 'Ruaka, Nairobi',
    offer: '2-bedroom apartments from KES 4.5M',
    tone: 'Professional',
    platforms: ['Facebook', 'Instagram', 'WhatsApp'],
    cta: 'Call now',
    notes: '',
    status: 'Delivered',
    created_at: '2024-06-01T08:00:00Z',
  },
  {
    id: 'c2',
    user_id: 'u1',
    business_name: 'Diani Paradise Resort',
    industry: 'Hospitality',
    product_name: 'Diani Weekend Getaway',
    objective: 'Increase bookings',
    target_audience: 'Nairobi couples and families',
    location: 'Diani Beach, Kenya',
    offer: '2 nights for 2 from KES 18,000',
    tone: 'Luxury',
    platforms: ['Instagram', 'Facebook'],
    cta: 'Book now',
    notes: '',
    status: 'Published',
    created_at: '2024-06-05T09:00:00Z',
  },
  {
    id: 'c3',
    user_id: 'u1',
    business_name: 'EduPath Kenya',
    industry: 'Education',
    product_name: 'CBC Tuition Campaign',
    objective: 'Get leads',
    target_audience: 'Parents with primary school children',
    location: 'Nairobi',
    offer: 'Free trial class for CBC grades 1–6',
    tone: 'Friendly',
    platforms: ['Facebook', 'WhatsApp'],
    cta: 'WhatsApp us',
    notes: '',
    status: 'Generated',
    created_at: '2024-06-08T11:00:00Z',
  },
  {
    id: 'c4',
    user_id: 'u1',
    business_name: 'Faida Sacco',
    industry: 'Fintech',
    product_name: 'Sacco Loan Product',
    objective: 'Promote offer',
    target_audience: 'Employed Kenyans aged 25–50',
    location: 'Kenya',
    offer: 'Emergency loans up to KES 100,000 in 24 hours',
    tone: 'Direct sales',
    platforms: ['Facebook', 'WhatsApp', 'LinkedIn'],
    cta: 'Apply today',
    notes: '',
    status: 'In Review',
    created_at: '2024-06-10T14:00:00Z',
  },
  {
    id: 'c5',
    user_id: 'u1',
    business_name: 'Savanna Grill',
    industry: 'Restaurant',
    product_name: 'Restaurant Lunch Offer',
    objective: 'Promote offer',
    target_audience: 'Office workers in Westlands',
    location: 'Westlands, Nairobi',
    offer: 'Lunch buffet KES 850 all-inclusive',
    tone: 'Friendly',
    platforms: ['Instagram', 'TikTok', 'WhatsApp'],
    cta: 'Visit website',
    notes: '',
    status: 'Draft',
    created_at: '2024-06-12T10:00:00Z',
  },
]

export const mockPackageRequests: PackageRequest[] = [
  {
    id: 'pr1',
    name: 'James Kariuki',
    business_name: 'Kariuki Properties',
    phone: '+254712345678',
    email: 'james@kariukiproperties.co.ke',
    industry: 'Real Estate',
    package: 'Growth Pack',
    message: 'We need monthly content for our 3 upcoming listings in Kiambu.',
    status: 'Contacted',
    created_at: '2024-06-10T09:00:00Z',
  },
  {
    id: 'pr2',
    name: 'Amina Hassan',
    business_name: 'Amina Beauty Studio',
    phone: '+254723456789',
    email: 'amina@beautynairobi.co.ke',
    industry: 'Professional Services',
    package: 'Starter Pack',
    message: 'Looking for help launching our new skincare line on Instagram.',
    status: 'New',
    created_at: '2024-06-13T11:00:00Z',
  },
  {
    id: 'pr3',
    name: 'David Mwangi',
    business_name: 'TechSoft Africa',
    phone: '+254734567890',
    email: 'david@techsoft.africa',
    industry: 'Fintech',
    package: 'Business Pack',
    message: 'We want full campaign strategy for our B2B SaaS product launch.',
    status: 'In Progress',
    created_at: '2024-06-14T08:00:00Z',
  },
]

// ─── Project / Production queue mock data ────────────────────────

export type ProjectType = 'video-commercial' | 'brand-film' | 'documentary' | 'jingle' | 'voiceover' | 'radio-spot'
export type ProjectStatus = 'queued' | 'in-production' | 'ready-for-review' | 'revision-requested' | 'accepted' | 'delivered'

export interface ProjectRevision {
  iteration: number
  uploadedAt: string
  creatorNotes: string
  clientFeedback?: string
  status: 'pending' | 'revision-requested' | 'accepted'
}

export interface Project {
  id: string
  userId: string
  clientName: string
  title: string
  type: ProjectType
  package: string
  status: ProjectStatus
  creatorName: string
  brief: string
  maxIterations: number
  revisions: ProjectRevision[]
  deliverableUrl?: string
  deliverableThumb?: string
  rights: string
  createdAt: string
  updatedAt: string
}

export interface AudioBrief {
  id: string
  type: 'jingle' | 'voiceover' | 'radio-spot'
  businessName: string
  message: string
  duration: string
  mood: string
  voiceGender: string
  accent: string
  platform: string
  package: string
  status: 'new' | 'in-production' | 'ready' | 'delivered'
  createdAt: string
}

export const mockProjects: Project[] = [
  {
    id: 'proj-1',
    userId: 'u2',
    clientName: 'James Kariuki',
    title: 'Where Your Story Begins — 30s Commercial',
    type: 'video-commercial',
    package: 'Growth Pack',
    status: 'ready-for-review',
    creatorName: 'Amara O.',
    brief: 'Real estate apartments in Ruaka Nairobi. 2 and 3 bedroom units targeting young professionals aged 25-40. Goal: generate site visit bookings. Price starts at KES 6.5M with 10% deposit.',
    maxIterations: 2,
    deliverableUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    deliverableThumb: 'https://images.unsplash.com/photo-1600596542815-ffad4c1539a9?w=600&q=80',
    rights: 'All rights transferred to subscriber upon full payment. AI-generated — zero third-party copyright.',
    revisions: [
      {
        iteration: 1,
        uploadedAt: '2026-06-16T14:30:00Z',
        creatorNotes: 'First cut delivered. Used Cinematic Live Action style with golden hour colour palette. 30-second edit featuring the "Stop Renting, Start Owning" narrative arc. Voiceover: warm Kenyan female. Music: Afro-soul acoustic.',
        status: 'pending',
      },
    ],
    createdAt: '2026-06-14T09:00:00Z',
    updatedAt: '2026-06-16T14:30:00Z',
  },
  {
    id: 'proj-2',
    userId: 'u3',
    clientName: 'Amina Hassan',
    title: 'PesaSure — Confidence in Every Transaction',
    type: 'brand-film',
    package: 'Starter Pack',
    status: 'revision-requested',
    creatorName: 'David K.',
    brief: 'Fintech SACCO product. Bold, modern, Afro-fusion energy. Target: urban Kenyans 25–40. Key message: send money in seconds, zero fees.',
    maxIterations: 2,
    deliverableUrl: 'https://www.w3schools.com/html/mov_bbb.mp4',
    deliverableThumb: 'https://images.unsplash.com/photo-1563986768494-4dee2763ff3f?w=600&q=80',
    rights: 'All rights transferred to subscriber upon full payment. AI-generated — zero third-party copyright.',
    revisions: [
      {
        iteration: 1,
        uploadedAt: '2026-06-15T10:00:00Z',
        creatorNotes: 'Delivered first version — 2D animated style with Afro-beat soundtrack. Three character arc as briefed.',
        clientFeedback: 'Love the energy but the colour palette feels too bright. Can we go darker and more premium? Also the CTA text needs to be larger.',
        status: 'revision-requested',
      },
    ],
    createdAt: '2026-06-13T11:00:00Z',
    updatedAt: '2026-06-15T16:00:00Z',
  },
  {
    id: 'proj-3',
    userId: 'u2',
    clientName: 'David Mwangi',
    title: 'Safari Stays — The World Can Wait',
    type: 'documentary',
    package: 'Business Pack',
    status: 'in-production',
    creatorName: 'Fatima M.',
    brief: 'Coastal resort documentary. Dreamy, escape-focused mood. Golden and oceanic palette. Warm Kenyan female narrator.',
    maxIterations: 2,
    deliverableThumb: 'https://images.unsplash.com/photo-1571003123894-1f0594d2b5d9?w=600&q=80',
    rights: 'All rights transferred to subscriber upon full payment. AI-generated — zero third-party copyright.',
    revisions: [],
    createdAt: '2026-06-17T08:00:00Z',
    updatedAt: '2026-06-17T08:00:00Z',
  },
  {
    id: 'proj-4',
    userId: 'u1',
    clientName: 'EduPath Kenya',
    title: 'Elimu Hub — Learn Today, Lead Tomorrow',
    type: 'video-commercial',
    package: 'Starter Pack',
    status: 'queued',
    creatorName: 'Unassigned',
    brief: 'CBC education platform. Inspirational, warm tone. Target: parents 30–50, Nairobi suburbs.',
    maxIterations: 2,
    revisions: [],
    rights: 'All rights transferred to subscriber upon full payment. AI-generated — zero third-party copyright.',
    createdAt: '2026-06-18T07:00:00Z',
    updatedAt: '2026-06-18T07:00:00Z',
  },
  {
    id: 'proj-5',
    userId: 'u3',
    clientName: 'Savanna Grill',
    title: '"Taste That Stays" — Radio Jingle',
    type: 'jingle',
    package: 'Audio — Jingle 30s',
    status: 'accepted',
    creatorName: 'Amara O.',
    brief: 'Restaurant jingle. Warm, soulful Afro-jazz. Tagline: "Taste That Stays With You". 30 seconds. Kiswahili-English mix.',
    maxIterations: 2,
    deliverableUrl: 'https://www.soundjay.com/misc/sounds/bell-ringing-05.mp3',
    deliverableThumb: 'https://images.unsplash.com/photo-1555396273-367ea4eb4db5?w=600&q=80',
    rights: 'All rights transferred to subscriber upon full payment. AI-generated — zero third-party copyright.',
    revisions: [
      {
        iteration: 1,
        uploadedAt: '2026-06-15T12:00:00Z',
        creatorNotes: 'First version: Afro-jazz melody, warm male voice, Kiswahili-English mix. Full 30s with brand tagline.',
        clientFeedback: 'Perfect! Approved.',
        status: 'accepted',
      },
    ],
    createdAt: '2026-06-12T10:00:00Z',
    updatedAt: '2026-06-15T15:00:00Z',
  },
]

// ─── Notifications ───────────────────────────────────────────────

export type NotifType = 'ready-for-review' | 'revision-done' | 'accepted' | 'delivered' | 'audio-ready' | 'new-order'

export interface Notification {
  id: string
  type: NotifType
  title: string
  body: string
  time: string
  read: boolean
  link?: string
}

export const mockNotifications: Notification[] = [
  { id: 'n1', type: 'ready-for-review', title: 'Project ready for review', body: '"Where Your Story Begins" — Iteration 1 uploaded by Amara O. Review and decide.', time: '2026-06-16T14:30:00Z', read: false, link: '/projects/proj-1/review' },
  { id: 'n2', type: 'audio-ready', title: 'Audio brief received', body: 'Your Jingle 30s brief for Savanna Grill is in the production queue.', time: '2026-06-15T12:00:00Z', read: false, link: '/projects' },
  { id: 'n3', type: 'revision-done', title: 'Revision submitted', body: 'PesaSure iteration 2 is underway — David K. has your feedback and is working on it.', time: '2026-06-15T16:00:00Z', read: true, link: '/projects/proj-2/review' },
  { id: 'n4', type: 'accepted', title: '"Taste That Stays" accepted', body: 'Your Savanna Grill jingle was accepted. Certificate of AI Origin issued.', time: '2026-06-15T15:00:00Z', read: true, link: '/projects/proj-5/review' },
  { id: 'n5', type: 'new-order', title: 'New audio order confirmed', body: 'PesaSure VO 60s brief submitted successfully. Production begins shortly.', time: '2026-06-16T09:00:00Z', read: true, link: '/projects' },
]

export const mockAudioBriefs: AudioBrief[] = [
  { id: 'ab1', type: 'jingle', businessName: 'Savanna Grill', message: 'Restaurant experience, warm and soulful', duration: '30s', mood: 'Warm & Soulful', voiceGender: 'Male', accent: 'Kenyan English', platform: 'Radio / Instagram', package: 'Jingle 30s', status: 'delivered', createdAt: '2026-06-12T10:00:00Z' },
  { id: 'ab2', type: 'voiceover', businessName: 'PesaSure', message: 'App explainer for digital ad', duration: '60s', mood: 'Confident & Clear', voiceGender: 'Female', accent: 'Kenyan English', platform: 'YouTube / Facebook', package: 'VO 60s', status: 'in-production', createdAt: '2026-06-16T09:00:00Z' },
]

export const mockAdminUsers: User[] = [
  mockUser,
  {
    id: 'u2',
    name: 'Sarah Njeri',
    email: 'sarah@gmail.com',
    role: 'user',
    created_at: '2024-06-02T12:00:00Z',
  },
  {
    id: 'u3',
    name: 'Brian Omondi',
    email: 'brian@omondi.co.ke',
    role: 'user',
    created_at: '2024-06-07T14:30:00Z',
  },
]
