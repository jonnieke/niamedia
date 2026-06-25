import { useState, FormEvent, useRef, useEffect } from 'react'
import { Save, Upload, Globe, Instagram, Youtube, Facebook, Twitter, CheckCircle, Palette, Loader2 } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase, uploadLogo } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

const TONES = ['Professional', 'Friendly', 'Bold', 'Luxury', 'Youthful', 'Emotional', 'Direct sales']
const FONTS = [
  { id: 'inter', label: 'Inter', style: 'Inter, sans-serif' },
  { id: 'playfair', label: 'Playfair Display', style: "'Playfair Display', serif" },
  { id: 'poppins', label: 'Poppins', style: "'Poppins', sans-serif" },
  { id: 'montserrat', label: 'Montserrat', style: "'Montserrat', sans-serif" },
  { id: 'raleway', label: 'Raleway', style: "'Raleway', sans-serif" },
  { id: 'oswald', label: 'Oswald', style: "'Oswald', sans-serif" },
]

const INDUSTRIES = ['Real Estate', 'Hospitality', 'Education', 'Fintech / SACCO', 'Restaurant', 'Travel', 'Retail', 'Health & Wellness', 'Events', 'Professional Services', 'Faith & Community', 'Other']

interface Kit {
  business_name: string
  tagline: string
  industry: string
  primary_color: string
  secondary_color: string
  accent_color: string
  font: string
  phone: string
  whatsapp: string
  website: string
  instagram: string
  facebook: string
  tiktok: string
  youtube: string
  preferred_tone: string
  target_customer: string
  business_description: string
  logo_url?: string
}

const EMPTY: Kit = {
  business_name: '', tagline: '', industry: '',
  primary_color: '#8b5cf6', secondary_color: '#3b82f6', accent_color: '#10b981',
  font: 'inter', phone: '', whatsapp: '', website: '',
  instagram: '', facebook: '', tiktok: '', youtube: '',
  preferred_tone: '', target_customer: '', business_description: '',
}

function BrandPreview({ kit, logo }: { kit: Kit; logo: string | null }) {
  const font = FONTS.find(f => f.id === kit.font)?.style ?? 'Inter, sans-serif'
  return (
    <div className="rounded-2xl border border-gray-200 overflow-hidden sticky top-4">
      <div className="px-5 py-4 border-b border-gray-200 flex items-center gap-2">
        <Palette size={14} className="text-purple-400" />
        <p className="text-xs font-bold text-gray-900">Live Brand Preview</p>
      </div>
      <div className="p-4">
        <div className="rounded-xl overflow-hidden border border-gray-200" style={{ fontFamily: font }}>
          <div className="h-2" style={{ background: `linear-gradient(90deg, ${kit.primary_color}, ${kit.secondary_color})` }} />
          <div className="p-5" style={{ background: '#ffffff' }}>
            <div className="flex items-center gap-3 mb-4">
              {logo ? (
                <img src={logo} alt="" className="w-10 h-10 rounded-xl object-cover border border-gray-200" />
              ) : (
                <div className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-sm font-bold shrink-0"
                  style={{ background: `linear-gradient(135deg, ${kit.primary_color}, ${kit.secondary_color})` }}>
                  {kit.business_name.charAt(0) || 'B'}
                </div>
              )}
              <div>
                <p className="text-sm font-bold text-gray-900">{kit.business_name || 'Your Business'}</p>
                {kit.tagline && <p className="text-xs text-gray-500 italic">{kit.tagline}</p>}
              </div>
            </div>
            <p className="text-xs text-gray-600 mb-3 leading-relaxed">
              {kit.business_description
                ? kit.business_description.slice(0, 90) + (kit.business_description.length > 90 ? '...' : '')
                : 'Your brand story goes here — vivid, compelling, and made for your audience.'}
            </p>
            <div className="flex items-center justify-between">
              <div className="px-4 py-2 rounded-lg text-xs font-bold text-gray-900"
                style={{ background: `linear-gradient(135deg, ${kit.primary_color}, ${kit.secondary_color})` }}>
                {kit.preferred_tone === 'Direct sales' ? 'Buy Now' : 'Learn More'}
              </div>
              {kit.phone && <span className="text-[10px] text-gray-500">{kit.phone}</span>}
            </div>
          </div>
          <div className="px-5 py-3 flex items-center gap-3 border-t border-gray-200" style={{ background: '#f1f5f9' }}>
            {kit.instagram && <span className="text-[10px] text-gray-500">@{kit.instagram}</span>}
            {kit.website && (
              <span className="text-[10px] ml-auto" style={{ color: kit.primary_color }}>
                {kit.website.replace('https://', '').replace('http://', '')}
              </span>
            )}
          </div>
        </div>
        <div className="mt-4 flex items-center gap-2">
          <p className="text-[10px] text-gray-600 mr-1">Palette</p>
          {[kit.primary_color, kit.secondary_color, kit.accent_color].map(c => (
            <div key={c} className="w-6 h-6 rounded-lg border border-gray-200" style={{ background: c }} title={c} />
          ))}
          <p className="text-[10px] text-gray-600 ml-auto" style={{ fontFamily: font }}>Aa — {FONTS.find(f => f.id === kit.font)?.label}</p>
        </div>
      </div>
    </div>
  )
}

export default function BrandKit() {
  const { user } = useAuth()
  const [kit, setKit] = useState<Kit>(EMPTY)
  const [logoPreview, setLogoPreview] = useState<string | null>(null)
  const [logoFile, setLogoFile] = useState<File | null>(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const logoRef = useRef<HTMLInputElement>(null)

  // Load brand kit from Supabase on mount
  useEffect(() => {
    if (!user) return
    supabase
      .from('brand_kits')
      .select('*')
      .eq('user_id', user.id)
      .single()
      .then(({ data }) => {
        if (data) {
          const { id: _id, user_id: _uid, updated_at: _ua, ...rest } = data
          setKit({ ...EMPTY, ...rest })
          if (data.logo_url) setLogoPreview(data.logo_url)
        }
        setLoading(false)
      })
  }, [user])

  const set = (field: keyof Kit) => (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
    setKit(prev => ({ ...prev, [field]: e.target.value }))

  const handleLogo = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) { setLogoFile(file); setLogoPreview(URL.createObjectURL(file)) }
  }

  const handleSubmit = async (e: FormEvent) => {
    e.preventDefault()
    if (!user) return
    setSaving(true)
    try {
      let logo_url = kit.logo_url
      if (logoFile) {
        const url = await uploadLogo(user.id, logoFile)
        if (url) logo_url = url
      }
      const payload = { ...kit, logo_url, user_id: user.id }
      await supabase.from('brand_kits').upsert(payload, { onConflict: 'user_id' })
      setKit(k => ({ ...k, logo_url }))
      setSaved(true)
      setTimeout(() => setSaved(false), 2500)
    } finally {
      setSaving(false)
    }
  }

  const chip = (active: boolean) =>
    `px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all cursor-pointer ${
      active ? 'text-white border-purple-500/60 bg-purple-500/20' : 'text-gray-500 border-gray-200 bg-white/3 hover:border-white/20'
    }`

  const Card = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="card-glow p-6">
      <h2 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-5 pb-3 border-b border-gray-200">{title}</h2>
      {children}
    </div>
  )

  if (loading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Loader2 size={24} className="text-purple-400 animate-spin" />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="mb-6">
        <span className="section-tag mb-2 inline-block">Brand Kit</span>
        <h1 className="text-2xl font-bold text-gray-900">Your Brand Identity</h1>
        <p className="text-sm text-gray-500 mt-1">Used to personalise every campaign, script, and audio brief.</p>
      </div>

      <div className="grid lg:grid-cols-3 gap-6">
        <form onSubmit={handleSubmit} className="lg:col-span-2 space-y-5">
          <Card title="Brand Identity">
            <div className="space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="label">Business Name *</label>
                  <input className="input" placeholder="e.g. Sunrise Homes" value={kit.business_name} onChange={set('business_name')} />
                </div>
                <div>
                  <label className="label">Tagline / Slogan</label>
                  <input className="input" placeholder="e.g. Where Your Story Begins" value={kit.tagline} onChange={set('tagline')} />
                </div>
              </div>

              <div>
                <label className="label">Industry / Sector</label>
                <select className="input" value={kit.industry} onChange={set('industry')}>
                  <option value="">Select your industry</option>
                  {INDUSTRIES.map(i => <option key={i} value={i}>{i}</option>)}
                </select>
              </div>

              <div>
                <label className="label">Logo</label>
                <div onClick={() => logoRef.current?.click()}
                  className="border-2 border-dashed border-gray-200 rounded-xl p-6 text-center hover:border-purple-500/30 transition-colors cursor-pointer flex items-center gap-4">
                  {logoPreview ? (
                    <img src={logoPreview} alt="" className="w-16 h-16 rounded-xl object-cover border border-gray-200 shrink-0" />
                  ) : (
                    <div className="w-16 h-16 rounded-xl border border-gray-200 bg-white/3 flex items-center justify-center shrink-0">
                      <Upload size={20} className="text-gray-600" />
                    </div>
                  )}
                  <div className="text-left">
                    <p className="text-sm font-semibold text-gray-800">{logoPreview ? 'Logo uploaded' : 'Upload your logo'}</p>
                    <p className="text-xs text-gray-500 mt-0.5">PNG or SVG recommended · Max 2MB</p>
                    {logoPreview && (
                      <button type="button" onClick={e => { e.stopPropagation(); setLogoPreview(null); setLogoFile(null); setKit(k => ({ ...k, logo_url: undefined })) }}
                        className="text-xs text-red-400 mt-1">Remove</button>
                    )}
                  </div>
                  <input ref={logoRef} type="file" accept="image/*" className="hidden" onChange={handleLogo} />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-4">
                {([['primary_color', 'Primary'], ['secondary_color', 'Secondary'], ['accent_color', 'Accent']] as const).map(([field, label]) => (
                  <div key={field}>
                    <label className="label">{label} Color</label>
                    <div className="flex items-center gap-2">
                      <input type="color" className="w-10 h-10 rounded-lg border border-gray-200 bg-transparent cursor-pointer shrink-0"
                        value={kit[field]} onChange={set(field)} />
                      <input className="input flex-1 font-mono text-xs" value={kit[field]} onChange={set(field)} />
                    </div>
                  </div>
                ))}
              </div>

              <div>
                <label className="label">Brand Font</label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                  {FONTS.map(f => (
                    <button key={f.id} type="button" onClick={() => setKit(p => ({ ...p, font: f.id }))}
                      className={`p-3 rounded-xl border text-left transition-all ${kit.font === f.id ? 'border-purple-500/50 bg-purple-500/10' : 'border-gray-200 bg-white/2 hover:border-gray-300'}`}>
                      <p className="text-xs text-gray-500 mb-0.5">Aa</p>
                      <p className="text-sm font-semibold text-gray-800" style={{ fontFamily: f.style }}>{f.label}</p>
                      {kit.font === f.id && <CheckCircle size={12} className="text-purple-400 mt-1" />}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          </Card>

          <Card title="Contact Information">
            <div className="grid sm:grid-cols-2 gap-4">
              <div>
                <label className="label">Phone</label>
                <input className="input" placeholder="+254 7XX XXX XXX" value={kit.phone} onChange={set('phone')} />
              </div>
              <div>
                <label className="label">WhatsApp</label>
                <input className="input" placeholder="+254 7XX XXX XXX" value={kit.whatsapp} onChange={set('whatsapp')} />
              </div>
              <div className="sm:col-span-2">
                <label className="label">Website</label>
                <div className="relative">
                  <Globe size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input className="input pl-9" placeholder="https://yourwebsite.com" value={kit.website} onChange={set('website')} />
                </div>
              </div>
            </div>
          </Card>

          <Card title="Social Media Handles">
            <div className="grid sm:grid-cols-2 gap-4">
              {[
                { field: 'instagram' as const, icon: Instagram, placeholder: 'yourhandle', prefix: '@' },
                { field: 'facebook' as const, icon: Facebook, placeholder: 'YourPageName', prefix: 'fb/' },
                { field: 'tiktok' as const, icon: Twitter, placeholder: 'yourhandle', prefix: '@' },
                { field: 'youtube' as const, icon: Youtube, placeholder: 'YourChannel', prefix: 'yt/' },
              ].map(({ field, icon: Icon, placeholder, prefix }) => (
                <div key={field}>
                  <label className="label capitalize">{field}</label>
                  <div className="flex items-center gap-0">
                    <div className="flex items-center gap-2 px-3 h-10 rounded-l-xl border border-r-0 border-gray-200 bg-white/3 shrink-0">
                      <Icon size={13} className="text-gray-500" />
                      <span className="text-xs text-gray-500">{prefix}</span>
                    </div>
                    <input className="input rounded-l-none flex-1" placeholder={placeholder}
                      value={kit[field]} onChange={set(field)} />
                  </div>
                </div>
              ))}
            </div>
          </Card>

          <Card title="Brand Voice & Audience">
            <div className="space-y-4">
              <div>
                <label className="label">Preferred Tone</label>
                <div className="flex flex-wrap gap-2">
                  {TONES.map(t => (
                    <button key={t} type="button" onClick={() => setKit(p => ({ ...p, preferred_tone: t }))} className={chip(kit.preferred_tone === t)}>{t}</button>
                  ))}
                </div>
              </div>
              <div>
                <label className="label">Target Customer</label>
                <input className="input" placeholder="e.g. Young professionals aged 25–40 in Nairobi" value={kit.target_customer} onChange={set('target_customer')} />
              </div>
              <div>
                <label className="label">Business Description</label>
                <textarea className="input resize-none" rows={3}
                  placeholder="What does your business do, and what makes it different?"
                  value={kit.business_description} onChange={set('business_description')} />
              </div>
            </div>
          </Card>

          <button type="submit" className="btn-primary w-full py-3 text-sm gap-2" disabled={saving}>
            {saving ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><Save size={15} />{saved ? 'Saved ✓' : 'Save Brand Kit'}</>}
          </button>
        </form>

        <div className="lg:col-span-1">
          <BrandPreview kit={kit} logo={logoPreview} />
        </div>
      </div>
    </DashboardLayout>
  )
}

