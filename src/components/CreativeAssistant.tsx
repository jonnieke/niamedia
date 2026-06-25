import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  X, Send, Loader2, Sparkles, Lightbulb, Bookmark, Check,
  Wand2, ArrowRight, MessageSquare,
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

export interface CampaignIdea {
  idea_title: string
  campaign_angle: string
  target_audience: string
  offer: string
  platforms: string[]
  whatsapp_message?: string
  poster_concept?: string
  video_concept?: string
  next_actions?: string[]
}

interface ChatMessage {
  role: 'user' | 'assistant'
  content: string
  idea?: CampaignIdea | null
}

const QUICK_ACTIONS = [
  'Generate 10 campaign ideas',
  'Make it more premium',
  'Make it more emotional',
  'Make it more direct',
  'Create a WhatsApp version',
  'Create a poster concept',
  'Create a 30-sec video script',
  'What should I post for the next 7 days?',
]

const STARTERS = [
  'I run a small restaurant in Kitengela. What campaign can I run this weekend?',
  'Give me 10 ideas for a real estate campaign targeting diaspora buyers.',
  'How do I announce a discount without sounding cheap?',
  'I have a weak idea — help me sharpen it.',
]

// Map a structured idea to NewCampaign URL params.
function ideaToParams(idea: CampaignIdea): string {
  const p = new URLSearchParams()
  if (idea.idea_title) p.set('product_name', idea.idea_title)
  if (idea.target_audience) p.set('target_audience', idea.target_audience)
  if (idea.offer) p.set('offer', idea.offer)
  if (idea.campaign_angle) p.set('notes', idea.campaign_angle)
  return p.toString()
}

function IdeaCard({ idea, onSaved }: { idea: CampaignIdea; onSaved: () => void }) {
  const { user } = useAuth()
  const navigate = useNavigate()
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)

  const save = async () => {
    if (!user || saving) return
    setSaving(true)
    const { error } = await supabase.from('ideas').insert({
      user_id: user.id,
      title: idea.idea_title || 'Untitled idea',
      angle: idea.campaign_angle || '',
      target_audience: idea.target_audience || '',
      offer: idea.offer || '',
      platforms: idea.platforms || [],
      notes: [idea.poster_concept && `Poster: ${idea.poster_concept}`, idea.video_concept && `Video: ${idea.video_concept}`, idea.whatsapp_message && `WhatsApp: ${idea.whatsapp_message}`].filter(Boolean).join('\n'),
      source: 'Assistant',
      status: 'Draft',
    })
    setSaving(false)
    if (!error) { setSaved(true); onSaved() }
  }

  return (
    <div className="mt-2 rounded-xl border border-purple-200 bg-purple-50/60 overflow-hidden">
      <div className="px-3.5 py-2.5 border-b border-purple-200 bg-purple-100/50 flex items-center gap-2">
        <Lightbulb size={13} className="text-purple-600 shrink-0" />
        <p className="text-sm font-bold text-purple-900 leading-tight">{idea.idea_title}</p>
      </div>
      <div className="p-3.5 space-y-2 text-xs text-gray-700">
        <p><span className="font-semibold text-gray-900">Angle:</span> {idea.campaign_angle}</p>
        <p><span className="font-semibold text-gray-900">Audience:</span> {idea.target_audience}</p>
        <p><span className="font-semibold text-gray-900">Offer:</span> {idea.offer}</p>
        {idea.platforms?.length > 0 && (
          <div className="flex flex-wrap gap-1">
            {idea.platforms.map(p => (
              <span key={p} className="px-1.5 py-0.5 rounded bg-white border border-purple-200 text-[10px] font-semibold text-purple-700">{p}</span>
            ))}
          </div>
        )}
        {idea.whatsapp_message && (
          <div className="rounded-lg bg-white border border-green-200 p-2.5">
            <p className="text-[10px] font-bold text-green-700 uppercase tracking-wide mb-1 flex items-center gap-1">
              <MessageSquare size={10} /> WhatsApp
            </p>
            <p className="text-[11px] text-gray-700 whitespace-pre-line leading-relaxed">{idea.whatsapp_message}</p>
          </div>
        )}
      </div>
      <div className="px-3.5 pb-3.5 flex flex-wrap gap-2">
        <button onClick={save} disabled={saving || saved}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-purple-300 text-purple-700 bg-white hover:bg-purple-50 disabled:opacity-60 transition-colors">
          {saved ? <Check size={12} /> : saving ? <Loader2 size={12} className="animate-spin" /> : <Bookmark size={12} />}
          {saved ? 'Saved' : 'Save to Ideas Bank'}
        </button>
        <button onClick={() => navigate(`/new-campaign?${ideaToParams(idea)}`)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
          <Wand2 size={12} /> Use as brief <ArrowRight size={12} />
        </button>
      </div>
    </div>
  )
}

export default function CreativeAssistant({ onClose }: { onClose: () => void }) {
  const { user } = useAuth()
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [input, setInput] = useState('')
  const [loading, setLoading] = useState(false)
  const [brandContext, setBrandContext] = useState<string>('')
  const threadId = useRef<string | null>(null)
  const scrollRef = useRef<HTMLDivElement>(null)

  // Load brand context once for sharper, on-brand suggestions.
  useEffect(() => {
    if (!user) return
    supabase.from('brand_kits')
      .select('business_name, industry, preferred_tone, target_customer, business_description')
      .eq('user_id', user.id).single()
      .then(({ data }) => {
        if (!data) return
        const parts = [
          data.business_name && `Business: ${data.business_name}`,
          data.industry && `Industry: ${data.industry}`,
          data.target_customer && `Target customer: ${data.target_customer}`,
          data.preferred_tone && `Preferred tone: ${data.preferred_tone}`,
          data.business_description && `About: ${data.business_description}`,
        ].filter(Boolean)
        if (parts.length) setBrandContext(parts.join('\n'))
      })
  }, [user])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages, loading])

  const ensureThread = async (): Promise<string | null> => {
    if (threadId.current || !user) return threadId.current
    const { data } = await supabase.from('assistant_threads')
      .insert({ user_id: user.id, title: 'Creative session', context_type: 'general' })
      .select('id').single()
    threadId.current = data?.id ?? null
    return threadId.current
  }

  const persist = async (role: 'user' | 'assistant', content: string, idea?: CampaignIdea | null) => {
    const tid = await ensureThread()
    if (!tid || !user) return
    await supabase.from('assistant_messages').insert({
      thread_id: tid, user_id: user.id, role, content, structured_output: idea ?? null,
    })
  }

  const send = async (text: string) => {
    const trimmed = text.trim()
    if (!trimmed || loading) return
    const next = [...messages, { role: 'user' as const, content: trimmed }]
    setMessages(next)
    setInput('')
    setLoading(true)
    void persist('user', trimmed)
    try {
      const { data, error } = await supabase.functions.invoke('creative-assistant', {
        body: { messages: next.map(m => ({ role: m.role, content: m.content })), brandContext },
      })
      if (error || data?.error) throw new Error(data?.friendly || error?.message || 'failed')
      const reply: string = data.reply || ''
      const idea: CampaignIdea | null = data.idea ?? null
      setMessages(m => [...m, { role: 'assistant', content: reply, idea }])
      void persist('assistant', reply, idea)
    } catch (err) {
      setMessages(m => [...m, { role: 'assistant', content: err instanceof Error ? err.message : "Nia couldn't respond — please try again." }])
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 z-50 flex justify-end">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-md h-full bg-white shadow-2xl flex flex-col animate-[slideIn_0.2s_ease]">
        {/* Header */}
        <div className="flex items-center justify-between px-5 h-16 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl flex items-center justify-center"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              <Sparkles size={16} className="text-white" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900 leading-tight">Nia Creative Assistant</p>
              <p className="text-[11px] text-gray-500 leading-tight">Your campaign strategist</p>
            </div>
          </div>
          <button onClick={onClose} className="w-8 h-8 flex items-center justify-center rounded-lg text-gray-500 hover:bg-gray-100">
            <X size={16} />
          </button>
        </div>

        {/* Messages */}
        <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-4 space-y-3">
          {messages.length === 0 && (
            <div className="space-y-4">
              <div className="rounded-xl bg-purple-50 border border-purple-100 p-4">
                <p className="text-sm text-gray-700 leading-relaxed">
                  Hey 👋 I'm Nia. Tell me about your business and what you're trying to sell — I'll sharpen the idea and hand you a campaign you can run today. WhatsApp-first, built for the Kenyan market.
                </p>
              </div>
              <div className="space-y-2">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Try asking</p>
                {STARTERS.map(s => (
                  <button key={s} onClick={() => send(s)}
                    className="block w-full text-left text-xs text-gray-600 px-3 py-2.5 rounded-lg border border-gray-200 hover:border-purple-300 hover:bg-purple-50/50 transition-colors">
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {messages.map((m, i) => (
            <div key={i} className={m.role === 'user' ? 'flex justify-end' : ''}>
              <div className={m.role === 'user'
                ? 'max-w-[85%] px-3.5 py-2.5 rounded-2xl rounded-br-md text-sm text-white'
                : 'max-w-full text-sm text-gray-800'}
                style={m.role === 'user' ? { background: 'linear-gradient(135deg, #7c3aed, #2563eb)' } : undefined}>
                {m.role === 'assistant'
                  ? <p className="whitespace-pre-line leading-relaxed">{m.content}</p>
                  : m.content}
                {m.role === 'assistant' && m.idea && <IdeaCard idea={m.idea} onSaved={() => {}} />}
              </div>
            </div>
          ))}

          {loading && (
            <div className="flex items-center gap-2 text-gray-400 text-sm">
              <Loader2 size={14} className="animate-spin" /> Nia is thinking…
            </div>
          )}
        </div>

        {/* Quick actions */}
        {messages.length > 0 && (
          <div className="px-4 pt-2 pb-1 flex gap-1.5 overflow-x-auto shrink-0">
            {QUICK_ACTIONS.map(q => (
              <button key={q} onClick={() => send(q)} disabled={loading}
                className="shrink-0 px-2.5 py-1.5 rounded-lg text-[11px] font-medium border border-gray-200 text-gray-600 hover:border-purple-300 hover:text-purple-700 disabled:opacity-50 whitespace-nowrap transition-colors">
                {q}
              </button>
            ))}
          </div>
        )}

        {/* Input */}
        <div className="p-3 border-t border-gray-200 shrink-0">
          <div className="flex items-end gap-2">
            <textarea
              value={input}
              onChange={e => setInput(e.target.value)}
              onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(input) } }}
              placeholder="Describe your business or idea…"
              rows={1}
              className="flex-1 resize-none input text-sm py-2.5 max-h-28"
            />
            <button onClick={() => send(input)} disabled={!input.trim() || loading}
              className="w-10 h-10 rounded-xl flex items-center justify-center text-white shrink-0 disabled:opacity-40"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
              {loading ? <Loader2 size={16} className="animate-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      </div>
      <style>{`@keyframes slideIn { from { transform: translateX(100%); } to { transform: translateX(0); } }`}</style>
    </div>
  )
}

export function CreativeAssistantButton({ onClick, label = 'Nia Creative Assistant' }: { onClick: () => void; label?: string }) {
  return (
    <button onClick={onClick}
      className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-semibold border border-purple-200 text-purple-700 bg-white hover:bg-purple-50 transition-colors">
      <Sparkles size={15} /> {label}
    </button>
  )
}
