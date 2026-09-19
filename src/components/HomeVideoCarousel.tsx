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
    id: 'onfon-mobile',
    clientName: 'Onfon Mobile',
    clientRole: 'Product & Growth Lead, Onfon Mobile',
    industry: 'Fintech & Smartphone Financing',
    title: 'Own a Smartphone Without Paying All at Once | Lipa Mos Mos',
    deliverable: '60s Commercial Video (16:9)',
    aspectRatio: '16:9',
    thumbnail: 'https://i.ytimg.com/vi/FQzMXAd0lNU/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/FQzMXAd0lNU',
    platform: 'YouTube',
    quote: 'Need a smartphone but don’t want to pay the full amount at once? Nia Media scripted and produced a crisp commercial showcasing how customers can get a smartphone today and Lipa Mos Mos. The campaign engagement and qualified purchase inquiries spiked immediately.',
    resultMetric: '+180% device financing inquiries in 3 weeks',
    stars: 5,
  },
  {
    id: 'onfon-media',
    clientName: 'Onfon Media',
    clientRole: 'Enterprise Solutions Division, Onfon Media',
    industry: 'Telecommunications & Bulk SMS',
    title: 'Grow Your Business with Fast, Reliable Bulk SMS',
    deliverable: '45s Commercial Explainer (16:9)',
    aspectRatio: '16:9',
    thumbnail: 'https://i.ytimg.com/vi/vHbOx1qhtnI/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/vHbOx1qhtnI',
    platform: 'YouTube',
    quote: 'Explaining how Kenyan businesses can instantly reach thousands of customers with high-speed SMS delivery was executed flawlessly. Nia Media delivered clean visuals, punchy narration, and local relatability that made enterprise messaging crystal clear.',
    resultMetric: '+2.6x enterprise demo requests and sign-ups',
    stars: 5,
  },
  {
    id: 'pesaflix',
    clientName: 'PesaFlix',
    clientRole: 'Creator Community & Partnerships, PesaFlix',
    industry: 'Digital Media & Creator Economy',
    title: 'What If Your Content Could Earn You Money? | PesaFlix Commercial',
    deliverable: '60s Commercial Film (16:9)',
    aspectRatio: '16:9',
    thumbnail: 'https://i.ytimg.com/vi/E5Zauj4TJHo/maxresdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/E5Zauj4TJHo',
    platform: 'YouTube',
    quote: 'What if watching and creating content could unlock real rewards? Nia Media captured the energy, creativity, and monetization potential of the PesaFlix platform in an electrifying commercial. The visual rhythm and voiceover fueled a massive influx of creator onboarding right after launch.',
    resultMetric: '5,000+ creator app downloads in first 14 days',
    stars: 5,
  },
  {
    id: 'onfon-mobile-reel',
    clientName: 'Onfon Mobile',
    clientRole: 'Digital Campaign Team, Onfon Mobile',
    industry: 'Fintech & Mobile Devices',
    title: 'Lipa Mos Mos Vertical Mobile Reel',
    deliverable: '30s Vertical Reel (TikTok & IG)',
    aspectRatio: '9:16',
    thumbnail: 'https://i.ytimg.com/vi/mxF6bI4JZV0/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/mxF6bI4JZV0',
    platform: 'YouTube',
    quote: 'The vertical mobile format hooked users mid-scroll on Instagram Reels and TikTok. Snappy pacing and relatable Kenyan messaging drove direct click-throughs straight to our WhatsApp sales line.',
    resultMetric: '+3.4x TikTok engagement & WhatsApp leads',
    stars: 5,
  },
  {
    id: 'onfon-media-reel',
    clientName: 'Onfon Media',
    clientRole: 'SME Outreach Division, Onfon Media',
    industry: 'Enterprise Messaging & SMS',
    title: 'Need to Reach Thousands of Customers Fast? Try Bulk SMS',
    deliverable: '30s Vertical Reel (TikTok & IG)',
    aspectRatio: '9:16',
    thumbnail: 'https://i.ytimg.com/vi/B8u6EbIaoIo/hqdefault.jpg',
    videoUrl: 'https://www.youtube.com/embed/B8u6EbIaoIo',
    platform: 'YouTube',
    quote: 'Short, crisp, and high energy. Perfect for WhatsApp Status and Instagram stories to show entrepreneurs how quickly they can broadcast alerts, promos, and updates to their customers.',
    resultMetric: '450+ SME portal sign-ups in 10 days',
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

          {/* Navigation Controls & YouTube Channel link */}
          <div className="flex items-center gap-3 self-start md:self-end">
            <a
              href="https://www.youtube.com/@Niamedia-b4z/videos"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold text-white/80 hover:text-white bg-white/5 hover:bg-white/10 border border-white/10 transition-colors"
            >
              <ExternalLink size={13} />
              <span>YouTube Channel</span>
            </a>
            <div className="flex items-center gap-1.5">
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
        </div>

        {/* Featured Showcase Slide */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center bg-white/[0.03] border border-white/10 rounded-3xl p-6 md:p-10 backdrop-blur-xl shadow-2xl">
          {/* Left: Video Preview Card with Play Trigger */}
          <div className="lg:col-span-6 xl:col-span-7">
            <div
              onClick={() => setActiveModalVideo(current)}
              className="group relative w-full aspect-video rounded-2xl overflow-hidden bg-black/80 border border-white/15 shadow-2xl cursor-pointer flex items-center justify-center"
            >
              {/* Blurred backdrop for vertical videos */}
              <img
                src={current.thumbnail}
                alt=""
                aria-hidden="true"
                onError={(e) => {
                  const target = e.target as HTMLImageElement
                  if (target.src.includes('maxresdefault.jpg')) {
                    target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg')
                  }
                }}
                className={`absolute inset-0 w-full h-full object-cover transition-transform duration-700 ${
                  current.aspectRatio === '9:16'
                    ? 'blur-xl opacity-40 scale-110'
                    : 'opacity-85 group-hover:opacity-100 group-hover:scale-105'
                }`}
              />

              {/* Centered crisp visual */}
              {current.aspectRatio === '9:16' ? (
                <img
                  src={current.thumbnail}
                  alt={current.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src.includes('maxresdefault.jpg')) {
                      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg')
                    }
                  }}
                  className="relative z-10 h-full w-auto aspect-[9/16] object-cover rounded-xl shadow-2xl group-hover:scale-105 transition-transform duration-700"
                />
              ) : (
                <div className="absolute inset-0 bg-transparent" />
              )}

              <div className="absolute inset-0 bg-gradient-to-t from-black/85 via-black/25 to-transparent z-10 pointer-events-none" />

              {/* Format & Platform Badges */}
              <div className="absolute top-4 left-4 z-20 flex items-center gap-2">
                <span className="text-[11px] font-extrabold uppercase tracking-wide px-2.5 py-1 rounded-md bg-black/75 backdrop-blur-md text-white border border-white/20">
                  {current.deliverable}
                </span>
                <span className="text-[11px] font-bold px-2.5 py-1 rounded-md bg-red-600/90 text-white shadow flex items-center gap-1">
                  <Play size={10} className="fill-white" />
                  {current.platform}
                </span>
              </div>

              {/* Center Play Button Pulse */}
              <div className="absolute inset-0 z-20 flex items-center justify-center pointer-events-none">
                <div className="w-16 h-16 rounded-full bg-purple-600/90 group-hover:bg-purple-500 text-white flex items-center justify-center shadow-[0_0_35px_rgba(168,85,247,0.7)] group-hover:scale-110 transition-all duration-300">
                  <Play size={24} className="fill-white translate-x-0.5" />
                </div>
              </div>

              {/* Bottom bar inside video preview */}
              <div className="absolute bottom-4 inset-x-4 z-20 flex items-center justify-between text-xs text-white/95">
                <span className="font-semibold drop-shadow truncate mr-3">{current.title}</span>
                <span className="inline-flex items-center gap-1 font-bold text-emerald-400 drop-shadow whitespace-nowrap">
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
                  Verified Project Impact
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

        {/* Quick Project Selector Strip */}
        <div className="mt-8 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
          {CLIENT_VIDEOS.map((video, idx) => (
            <button
              key={video.id}
              onClick={() => setCurrentIndex(idx)}
              className={`p-3 rounded-2xl border text-left transition-all flex flex-col gap-2.5 ${
                currentIndex === idx
                  ? 'bg-purple-600/20 border-purple-500/80 shadow-[0_0_20px_rgba(168,85,247,0.2)]'
                  : 'bg-white/[0.02] border-white/10 hover:bg-white/[0.05] hover:border-white/20'
              }`}
            >
              <div className="relative aspect-video rounded-xl overflow-hidden bg-black/70">
                <img
                  src={video.thumbnail}
                  alt={video.title}
                  onError={(e) => {
                    const target = e.target as HTMLImageElement
                    if (target.src.includes('maxresdefault.jpg')) {
                      target.src = target.src.replace('maxresdefault.jpg', 'hqdefault.jpg')
                    }
                  }}
                  className="w-full h-full object-cover"
                />
                <span className="absolute bottom-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded bg-black/80 text-white">
                  {video.aspectRatio}
                </span>
              </div>
              <div className="min-w-0">
                <p className={`text-xs font-bold truncate ${currentIndex === idx ? 'text-purple-300' : 'text-white'}`}>
                  {video.clientName}
                </p>
                <p className="text-[11px] text-white/50 truncate">
                  {video.deliverable.split('(')[0].trim()}
                </p>
              </div>
            </button>
          ))}
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
