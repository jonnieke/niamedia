import { useState, useEffect, useRef } from 'react'
import { Play, ChevronLeft, ChevronRight, Star, ExternalLink, Sparkles, CheckCircle2 } from 'lucide-react'
import VideoModal from './VideoModal'

export interface ClientVideoItem {
  id: string
  clientName: string
  clientRole: string
  industry: string
  title: string
  deliverable: string
  aspectRatio: '9:16' | '16:9'
  thumbnail: string
  videoUrl: string
  platform: 'YouTube' | 'Vimeo' | 'Native'
  quote: string
  resultMetric: string
  stars: number
}

const CLIENT_VIDEOS: ClientVideoItem[] = [
  {
    id: 'kilimani-cafe',
    clientName: 'Kilimani Organic Cafe',
    clientRole: 'Wanjiku Mwangi, Co-founder',
    industry: 'Hospitality & Dining',
    title: 'Weekend Cold Brew & Pastry Combo Reel',
    deliverable: '30s Vertical Reel (TikTok & IG)',
    aspectRatio: '9:16',
    thumbnail: '/images/styles/style-cinematic.jpg',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4', // High-energy commercial sample
    platform: 'YouTube',
    quote: 'The video hook stopped people mid-scroll on TikTok. We had customers walking into the cafe showing us the exact reel on their phones.',
    resultMetric: '+3.4x WhatsApp table reservations in 7 days',
    stars: 5,
  },
  {
    id: 'pesasure-fintech',
    clientName: 'PesaSure App',
    clientRole: 'Brian M., Product Lead',
    industry: 'Fintech & Mobile Apps',
    title: 'Kinetic App Explainer Commercial',
    deliverable: '45s 2D Motion Graphics Video',
    aspectRatio: '16:9',
    thumbnail: '/images/styles/style-motion-2d.jpg',
    videoUrl: 'https://www.youtube.com/embed/dQw4w9WgXcQ', // Standard demo embed
    platform: 'YouTube',
    quote: 'Explaining mobile savings & SACCO loans in under 45 seconds seemed impossible until Nia Media scripted and animated this. Clean, punchy, and locally relatable.',
    resultMetric: '1,400+ verified app installs in 2 weeks',
    stars: 5,
  },
  {
    id: 'savannah-botanicals',
    clientName: 'Savannah Botanicals',
    clientRole: 'Amina Hassan, Brand Lead',
    industry: 'Organic Beauty & Wellness',
    title: '3D Cosmic Bottle & Serum Showcase',
    deliverable: '60s 3D Stylized Product Film',
    aspectRatio: '16:9',
    thumbnail: '/images/styles/style-3d-stylized.jpg',
    videoUrl: 'https://player.vimeo.com/video/76979871', // Cinematic Vimeo sample
    platform: 'Vimeo',
    quote: 'The 3D product lighting and fluid dynamics gave our cosmetic line a premium aesthetic that elevated our online store conversion rate immediately.',
    resultMetric: '2.8x online catalog conversion rate',
    stars: 5,
  },
  {
    id: 'nairobi-tech-summit',
    clientName: 'Nairobi Tech Horizon',
    clientRole: 'Joy Otieno, Marketing Director',
    industry: 'Events & Conferences',
    title: 'Futuristic AI Horizon Teaser',
    deliverable: '30s Hyper-Realistic AI Reel',
    aspectRatio: '9:16',
    thumbnail: '/images/styles/style-hyper-ai.jpg',
    videoUrl: 'https://www.youtube.com/embed/ScMzIvxBSi4',
    platform: 'YouTube',
    quote: 'The futuristic Nairobi visuals blew everyone away. We sold out our early-bird conference tickets in 72 hours after posting this reel on LinkedIn and Instagram.',
    resultMetric: 'All Early-Bird passes sold out in 72 hours',
    stars: 5,
  },
]

export default function HomeVideoCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0)
  const [activeModalVideo, setActiveModalVideo] = useState<ClientVideoItem | null>(null)
  const [isPaused, setIsPaused] = useState(false)
  const touchStartX = useRef<number | null>(null)
  const touchEndX = useRef<number | null>(null)

  // Auto-scroll every 6 seconds when not hovered
  useEffect(() => {
    if (isPaused || activeModalVideo) return
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % CLIENT_VIDEOS.length)
    }, 6000)
    return () => clearInterval(timer)
  }, [isPaused, activeModalVideo])

  const nextSlide = () => {
    setCurrentIndex((prev) => (prev + 1) % CLIENT_VIDEOS.length)
  }

  const prevSlide = () => {
    setCurrentIndex((prev) => (prev - 1 + CLIENT_VIDEOS.length) % CLIENT_VIDEOS.length)
  }

  // Handle mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.targetTouches[0].clientX
  }

  const handleTouchMove = (e: React.TouchEvent) => {
    touchEndX.current = e.targetTouches[0].clientX
  }

  const handleTouchEnd = () => {
    if (!touchStartX.current || !touchEndX.current) return
    const diff = touchStartX.current - touchEndX.current
    if (diff > 50) nextSlide()
    if (diff < -50) prevSlide()
    touchStartX.current = null
    touchEndX.current = null
  }

  const current = CLIENT_VIDEOS[currentIndex]

  return (
    <section
      className="py-24 px-6 relative overflow-hidden bg-[#07050e] border-y border-white/[0.07]"
      onMouseEnter={() => setIsPaused(true)}
      onMouseLeave={() => setIsPaused(false)}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    >
      {/* Ambient background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[700px] h-[350px] bg-purple-600/10 blur-[130px] pointer-events-none rounded-full" />

      <div className="max-w-6xl mx-auto relative z-10">
        {/* Section Header */}
        <div className="flex flex-col md:flex-row md:items-end justify-between mb-12 gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-bold mb-3 bg-purple-500/15 text-purple-300 border border-purple-500/25">
              <Sparkles size={13} className="text-purple-400" />
              <span>FINISHED COMMERCIALS & REELS</span>
            </div>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white tracking-tight">
              Watch How Kenyan Brands Scale with Nia Media
            </h2>
            <p className="text-sm text-white/60 max-w-xl mt-2">
              Browse broadcast-ready commercial videos produced, voiced, and sound-engineered for real businesses across Kenya.
            </p>
          </div>

          {/* Navigation Controls */}
          <div className="flex items-center gap-2 self-start md:self-end">
            <button
              onClick={prevSlide}
              aria-label="Previous client video"
              className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all"
            >
              <ChevronLeft size={18} />
            </button>
            <button
              onClick={nextSlide}
              aria-label="Next client video"
              className="w-10 h-10 rounded-full border border-white/15 bg-white/5 hover:bg-white/15 text-white flex items-center justify-center transition-all"
            >
              <ChevronRight size={18} />
            </button>
          </div>
        </div>

        {/* Featured Showcase Slide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl">
          {/* Left: Video Preview Card with Play Trigger */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div
              onClick={() => setActiveModalVideo(current)}
              className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-black/60 border border-white/15 shadow-2xl cursor-pointer"
            >
              <img
                src={current.thumbnail}
                alt={current.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700 opacity-85 group-hover:opacity-100"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

              {/* Format & Platform Badges */}
              <div className="absolute top-4 left-4 flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md bg-black/70 backdrop-blur-md text-white border border-white/20">
                  {current.deliverable}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-purple-600/90 text-white shadow">
                  {current.platform}
                </span>
              </div>

              {/* Center Play Button Pulse */}
              <div className="absolute inset-0 flex items-center justify-center">
                <div className="w-16 h-16 rounded-full bg-purple-600/90 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_30px_rgba(168,85,247,0.6)] group-hover:scale-110 transition-all duration-300">
                  <Play size={24} className="fill-white translate-x-0.5" />
                </div>
              </div>

              {/* Bottom bar inside video preview */}
              <div className="absolute bottom-4 inset-x-4 flex items-center justify-between text-xs text-white/90">
                <span className="font-semibold drop-shadow">{current.title}</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 drop-shadow">
                  <CheckCircle2 size={13} /> {current.resultMetric}
                </span>
              </div>
            </div>
          </div>

          {/* Right: Client Testimonial & Production Scope */}
          <div className="lg:col-span-6 xl:col-span-5 flex flex-col justify-between space-y-6">
            <div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-xs font-extrabold uppercase tracking-widest text-purple-400">
                  {current.industry}
                </span>
                <div className="flex items-center gap-1">
                  {Array.from({ length: current.stars }).map((_, i) => (
                    <Star key={i} size={14} className="fill-amber-400 text-amber-400" />
                  ))}
                </div>
              </div>

              <h3 className="text-2xl font-extrabold text-white leading-snug mb-3">
                {current.clientName}
              </h3>

              <blockquote className="text-base text-white/80 leading-relaxed italic relative pl-4 border-l-2 border-purple-500">
                "{current.quote}"
              </blockquote>
            </div>

            {/* Metric Callout Card */}
            <div className="p-4 rounded-xl bg-purple-950/40 border border-purple-500/30 flex items-center justify-between">
              <div>
                <p className="text-[11px] font-extrabold uppercase tracking-wider text-purple-300">
                  Business Impact
                </p>
                <p className="text-sm font-bold text-white mt-0.5">
                  {current.resultMetric}
                </p>
              </div>
              <button
                onClick={() => setActiveModalVideo(current)}
                className="px-3.5 py-1.5 rounded-lg text-xs font-bold bg-purple-600 hover:bg-purple-500 text-white transition-colors flex items-center gap-1.5 shadow"
              >
                <Play size={12} className="fill-white" /> Watch Video
              </button>
            </div>

            {/* Author details & indicator dots */}
            <div className="flex items-center justify-between pt-4 border-t border-white/10">
              <div>
                <p className="text-sm font-bold text-white">{current.clientRole}</p>
                <p className="text-xs text-white/40">{current.clientName} · Kenya</p>
              </div>

              {/* Indicator Pills */}
              <div className="flex items-center gap-1.5">
                {CLIENT_VIDEOS.map((_, i) => (
                  <button
                    key={i}
                    onClick={() => setCurrentIndex(i)}
                    aria-label={`Go to slide ${i + 1}`}
                    className={`h-2 rounded-full transition-all ${
                      currentIndex === i ? 'w-6 bg-purple-500' : 'w-2 bg-white/20 hover:bg-white/40'
                    }`}
                  />
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Video Cinema Player Modal */}
      {activeModalVideo && (
        <VideoModal
          isOpen={!!activeModalVideo}
          onClose={() => setActiveModalVideo(null)}
          videoUrl={activeModalVideo.videoUrl}
          title={activeModalVideo.title}
          clientName={activeModalVideo.clientName}
          deliverableTag={activeModalVideo.deliverable}
          aspectRatio={activeModalVideo.aspectRatio}
        />
      )}
    </section>
  )
}
