import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Loader2, Film, Image, Zap, ExternalLink, ArrowRight, Star } from 'lucide-react'
import PublicHeader from '../components/layout/PublicHeader'
import { supabase } from '../lib/supabase'

interface Testimonial {
  id: string
  business_name: string
  contact_name: string | null
  industry: string | null
  rating: number
  body: string
  video_length: string | null
}

interface PortfolioItem {
  id: string
  title: string
  type: string
  client_name: string | null
  industry: string | null
  description: string | null
  thumbnail_url: string | null
  video_url: string | null
  tags: string[]
  featured: boolean
}

const TYPE_META: Record<string, { label: string; icon: typeof Film; color: string }> = {
  video:    { label: 'Video Commercial', icon: Film,  color: '#8b5cf6' },
  poster:   { label: 'Promo Poster',     icon: Image, color: '#3b82f6' },
  campaign: { label: 'AI Campaign',      icon: Zap,   color: '#f59e0b' },
}

const FILTERS = ['All', 'Video', 'Poster', 'Campaign']

const CLIENTS = [
  'Adiel Media', 'Somo Smart', 'Onfon Media', 'Onfon Mobile',
  'Ndovu Group', 'NCBA', 'PesaFlix', 'Shekel Coin',
]

export default function Portfolio() {
  const [items, setItems] = useState<PortfolioItem[]>([])
  const [testimonials, setTestimonials] = useState<Testimonial[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('All')
  const [selected, setSelected] = useState<PortfolioItem | null>(null)

  useEffect(() => {
    Promise.all([
      supabase.from('portfolio_items')
        .select('*')
        .eq('published', true)
        .order('featured', { ascending: false })
        .order('sort_order', { ascending: true })
        .order('created_at', { ascending: false }),
      supabase.from('testimonials')
        .select('id,business_name,contact_name,industry,rating,body,video_length')
        .eq('approved', true)
        .order('created_at', { ascending: false })
        .limit(6),
    ]).then(([{ data: portData }, { data: testData }]) => {
      if (portData) setItems(portData as PortfolioItem[])
      if (testData) setTestimonials(testData as Testimonial[])
      setLoading(false)
    })
  }, [])

  const filtered = filter === 'All' ? items : items.filter(i => i.type === filter.toLowerCase())

  return (
    <div className="min-h-screen bg-white">
      <PublicHeader />
      <div className="pt-16">

        {/* Hero */}
        <div className="py-16 px-6 text-center" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1035 100%)' }}>
          <p className="text-xs font-bold uppercase tracking-widest mb-3" style={{ color: '#a78bfa' }}>
            Our Work
          </p>
          <h1 className="text-4xl font-extrabold text-white mb-4 leading-tight">
            Video commercials that<br />drive real results
          </h1>
          <p className="text-gray-400 text-base max-w-xl mx-auto mb-8">
            Trusted by Kenyan SMEs and growing brands — from fintech startups to established businesses.
          </p>
          <Link to="/quote"
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all"
            style={{ background: '#7c3aed' }}>
            Get Your Free Quote <ArrowRight size={15} />
          </Link>
        </div>

        {/* Client strip */}
        <div className="border-y border-gray-100 py-5 px-6 overflow-x-auto">
          <div className="max-w-5xl mx-auto flex items-center gap-8 justify-center flex-wrap">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-widest whitespace-nowrap">Trusted by</span>
            {CLIENTS.map(c => (
              <span key={c} className="text-sm font-bold text-gray-500 whitespace-nowrap">{c}</span>
            ))}
          </div>
        </div>

        {/* Filter tabs */}
        <div className="max-w-6xl mx-auto px-6 pt-10">
          <div className="flex gap-2 mb-8">
            {FILTERS.map(f => (
              <button key={f} onClick={() => setFilter(f)}
                className="px-4 py-2 rounded-xl text-sm font-semibold transition-all"
                style={filter === f
                  ? { background: '#7c3aed', color: '#ffffff' }
                  : { background: '#f3f4f6', color: '#6b7280' }}>
                {f}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="flex items-center justify-center py-24">
              <Loader2 size={24} className="animate-spin text-purple-500" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="text-center py-24">
              <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center"
                style={{ background: 'rgba(124,58,237,0.08)', border: '1px solid rgba(124,58,237,0.15)' }}>
                <Film size={24} style={{ color: '#7c3aed' }} />
              </div>
              <p className="text-gray-500 text-sm">Portfolio coming soon.</p>
              <p className="text-gray-400 text-xs mt-1">We're uploading our latest work.</p>
              <Link to="/quote" className="inline-block mt-4 text-sm font-semibold text-purple-600 hover:underline">
                Get your video commercial →
              </Link>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5 pb-16">
              {filtered.map(item => {
                const meta = TYPE_META[item.type] ?? TYPE_META.video
                const Icon = meta.icon
                return (
                  <div key={item.id}
                    className="group rounded-2xl overflow-hidden border border-gray-100 bg-white shadow-sm hover:shadow-md transition-all cursor-pointer"
                    onClick={() => setSelected(item)}>
                    {/* Thumbnail */}
                    <div className="relative aspect-video overflow-hidden bg-gray-100"
                      style={{ background: 'linear-gradient(135deg, #1a1035, #0f172a)' }}>
                      {item.thumbnail_url ? (
                        <img src={item.thumbnail_url} alt={item.title}
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                      ) : (
                        <div className="absolute inset-0 flex flex-col items-center justify-center">
                          <Icon size={32} style={{ color: meta.color, opacity: 0.5 }} />
                        </div>
                      )}
                      {item.featured && (
                        <span className="absolute top-3 left-3 px-2.5 py-1 rounded-lg text-[11px] font-bold text-white"
                          style={{ background: '#7c3aed' }}>
                          Featured
                        </span>
                      )}
                      <span className="absolute top-3 right-3 px-2.5 py-1 rounded-lg text-[11px] font-semibold"
                        style={{ background: 'rgba(0,0,0,0.6)', color: '#ffffff' }}>
                        <Icon size={10} className="inline mr-1" />{meta.label}
                      </span>
                      {item.video_url && (
                        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                          <div className="w-12 h-12 rounded-full flex items-center justify-center"
                            style={{ background: 'rgba(255,255,255,0.9)' }}>
                            <div className="w-0 h-0 border-t-[8px] border-b-[8px] border-l-[14px] border-transparent ml-1"
                              style={{ borderLeftColor: '#7c3aed' }} />
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="p-4">
                      <h3 className="text-sm font-bold text-gray-900 mb-0.5">{item.title}</h3>
                      {(item.client_name || item.industry) && (
                        <p className="text-xs text-gray-400">
                          {item.client_name}{item.client_name && item.industry ? ' · ' : ''}{item.industry}
                        </p>
                      )}
                      {item.description && (
                        <p className="text-xs text-gray-500 mt-2 line-clamp-2">{item.description}</p>
                      )}
                      {item.tags.length > 0 && (
                        <div className="flex flex-wrap gap-1.5 mt-3">
                          {item.tags.map(tag => (
                            <span key={tag} className="px-2 py-0.5 rounded-md text-[11px] font-medium text-gray-500 bg-gray-100">
                              {tag}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Testimonials */}
        {testimonials.length > 0 && (
          <div className="py-16 px-6" style={{ background: 'linear-gradient(135deg, #0a0a14 0%, #1a1035 100%)' }}>
            <div className="max-w-5xl mx-auto">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-400 text-center mb-2">Client Stories</p>
              <h2 className="text-2xl font-extrabold text-white text-center mb-10">What our clients say</h2>
              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                {testimonials.map(t => (
                  <div key={t.id} className="rounded-2xl p-5"
                    style={{ background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)' }}>
                    <div className="flex gap-0.5 mb-3">
                      {[1,2,3,4,5].map(n => (
                        <Star key={n} size={14}
                          fill={n <= t.rating ? '#f59e0b' : 'none'}
                          stroke={n <= t.rating ? '#f59e0b' : 'rgba(255,255,255,0.2)'} />
                      ))}
                    </div>
                    <p className="text-sm text-gray-300 leading-relaxed mb-4 italic">"{t.body}"</p>
                    <div>
                      <p className="text-xs font-bold text-white">{t.contact_name ?? t.business_name}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {t.business_name}{t.industry ? ` · ${t.industry}` : ''}{t.video_length ? ` · ${t.video_length}` : ''}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* CTA section */}
        <div className="py-16 px-6 text-center" style={{ background: '#f9fafb', borderTop: '1px solid #f3f4f6' }}>
          <h2 className="text-2xl font-extrabold text-gray-900 mb-3">Want a video like these?</h2>
          <p className="text-gray-500 text-sm mb-6 max-w-md mx-auto">
            Get an instant quote in 60 seconds. No login required. First campaign is free.
          </p>
          <div className="flex gap-3 justify-center flex-wrap">
            <Link to="/quote"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white"
              style={{ background: '#7c3aed' }}>
              Get Free Quote
            </Link>
            <a href="https://wa.me/254751822556?text=Hi%2C%20I%20want%20a%20video%20commercial%20for%20my%20business"
              target="_blank" rel="noopener noreferrer"
              className="px-6 py-3 rounded-xl font-bold text-sm text-white flex items-center gap-2"
              style={{ background: '#25d366' }}>
              WhatsApp Us
            </a>
          </div>
        </div>
      </div>

      {/* Lightbox modal */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.85)' }}
          onClick={() => setSelected(null)}>
          <div className="bg-white rounded-2xl max-w-2xl w-full overflow-hidden shadow-2xl"
            onClick={e => e.stopPropagation()}>
            {selected.video_url ? (
              <video src={selected.video_url} controls autoPlay className="w-full aspect-video bg-black" />
            ) : selected.thumbnail_url ? (
              <img src={selected.thumbnail_url} alt={selected.title} className="w-full aspect-video object-cover" />
            ) : (
              <div className="w-full aspect-video flex items-center justify-center"
                style={{ background: '#0f172a' }}>
                <Film size={40} className="text-purple-400 opacity-30" />
              </div>
            )}
            <div className="p-5">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h3 className="text-base font-bold text-gray-900">{selected.title}</h3>
                  {(selected.client_name || selected.industry) && (
                    <p className="text-xs text-gray-400 mt-0.5">
                      {selected.client_name}{selected.client_name && selected.industry ? ' · ' : ''}{selected.industry}
                    </p>
                  )}
                  {selected.description && (
                    <p className="text-sm text-gray-600 mt-2">{selected.description}</p>
                  )}
                </div>
                <button onClick={() => setSelected(null)}
                  className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0">&times;</button>
              </div>
              {selected.video_url && (
                <a href={selected.video_url} target="_blank" rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 mt-3 text-xs font-semibold text-purple-600 hover:underline">
                  <ExternalLink size={11} /> Open full video
                </a>
              )}
              <div className="mt-4 pt-4 border-t border-gray-100 flex gap-3">
                <Link to="/quote" onClick={() => setSelected(null)}
                  className="flex-1 py-2.5 rounded-xl font-bold text-sm text-white text-center"
                  style={{ background: '#7c3aed' }}>
                  Get a Similar Video
                </Link>
                <a href="https://wa.me/254751822556?text=Hi%2C%20I%20saw%20your%20portfolio%20and%20want%20a%20similar%20video%20for%20my%20business"
                  target="_blank" rel="noopener noreferrer"
                  className="px-4 py-2.5 rounded-xl font-bold text-sm text-white"
                  style={{ background: '#25d366' }}>
                  WhatsApp
                </a>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

