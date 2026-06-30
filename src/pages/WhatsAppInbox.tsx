import { useState, useEffect, useRef } from 'react'
import { MessageSquare, Pause, Play, Loader2, Phone, ChevronRight, Circle } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface Message {
  role: 'user' | 'assistant'
  content: string
  ts: string
}

interface Conv {
  id: string
  lead_phone: string
  lead_name: string | null
  messages: Message[]
  ai_paused: boolean
  unread_count: number
  last_message_at: string
}

function timeAgo(ts: string) {
  const diff = Date.now() - new Date(ts).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function WhatsAppInbox() {
  const { user } = useAuth()
  const [convs, setConvs] = useState<Conv[]>([])
  const [active, setActive] = useState<Conv | null>(null)
  const [loading, setLoading] = useState(true)
  const [toggling, setToggling] = useState(false)
  const bottomRef = useRef<HTMLDivElement>(null)

  const load = async () => {
    if (!user) return
    const { data } = await supabase
      .from('whatsapp_conversations')
      .select('*')
      .eq('user_id', user.id)
      .order('last_message_at', { ascending: false })
    setConvs((data ?? []) as Conv[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  // Realtime subscription
  useEffect(() => {
    if (!user) return
    const channel = supabase
      .channel(`wa-inbox-${user.id}`)
      .on('postgres_changes', {
        event: '*', schema: 'public', table: 'whatsapp_conversations',
        filter: `user_id=eq.${user.id}`,
      }, () => { load() })
      .subscribe()
    return () => { supabase.removeChannel(channel) }
  }, [user])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [active?.messages])

  // Mark as read when opening a conversation
  const openConv = async (conv: Conv) => {
    setActive(conv)
    if (conv.unread_count > 0) {
      await supabase.from('whatsapp_conversations').update({ unread_count: 0 }).eq('id', conv.id)
      setConvs(prev => prev.map(c => c.id === conv.id ? { ...c, unread_count: 0 } : c))
    }
  }

  const toggleAI = async () => {
    if (!active) return
    setToggling(true)
    const next = !active.ai_paused
    await supabase.from('whatsapp_conversations').update({ ai_paused: next }).eq('id', active.id)
    const updated = { ...active, ai_paused: next }
    setActive(updated)
    setConvs(prev => prev.map(c => c.id === active.id ? updated : c))
    setToggling(false)
  }

  const totalUnread = convs.reduce((s, c) => s + (c.unread_count ?? 0), 0)

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto px-4 py-8">
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-1">
            <span className="section-tag">WhatsApp AI</span>
            {totalUnread > 0 && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold text-white" style={{ background: '#25d366' }}>
                {totalUnread} new
              </span>
            )}
          </div>
          <h1 className="text-2xl font-bold text-gray-900">WhatsApp Inbox</h1>
          <p className="text-gray-500 text-sm mt-0.5">AI replies to incoming messages. Pause AI to take over manually.</p>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-green-500" /></div>
        ) : convs.length === 0 ? (
          <div className="text-center py-20">
            <MessageSquare size={40} className="mx-auto mb-4 text-gray-300" />
            <p className="font-semibold text-gray-800 mb-2">No conversations yet</p>
            <p className="text-sm text-gray-500 max-w-sm mx-auto">
              When customers message your WhatsApp Business number, conversations will appear here.
              Enable the AI responder in <a href="/settings?tab=integrations" className="text-green-600 hover:underline">Settings → Integrations</a>.
            </p>
          </div>
        ) : (
          <div className="flex gap-4 h-[600px]">
            {/* Conversation list */}
            <div className="w-72 shrink-0 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col">
              <div className="px-4 py-3 border-b border-gray-100">
                <p className="text-xs font-bold text-gray-500 uppercase tracking-widest">{convs.length} conversation{convs.length !== 1 ? 's' : ''}</p>
              </div>
              <div className="flex-1 overflow-y-auto">
                {convs.map(conv => {
                  const last = conv.messages?.[conv.messages.length - 1]
                  return (
                    <button
                      key={conv.id}
                      onClick={() => openConv(conv)}
                      className={`w-full text-left px-4 py-3.5 border-b border-gray-100 hover:bg-gray-50 transition-colors ${active?.id === conv.id ? 'bg-green-50 border-l-2 border-l-green-500' : ''}`}>
                      <div className="flex items-start justify-between gap-2">
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-1.5">
                            <p className="text-sm font-semibold text-gray-900 truncate">{conv.lead_name ?? conv.lead_phone}</p>
                            {conv.ai_paused && (
                              <span className="text-[9px] px-1.5 py-0.5 rounded-full bg-amber-50 text-amber-600 font-bold border border-amber-200 shrink-0">paused</span>
                            )}
                          </div>
                          <p className="text-xs text-gray-500 truncate mt-0.5">{last?.content ?? '—'}</p>
                        </div>
                        <div className="flex flex-col items-end gap-1 shrink-0">
                          <p className="text-[10px] text-gray-400">{timeAgo(conv.last_message_at)}</p>
                          {conv.unread_count > 0 && (
                            <span className="w-5 h-5 rounded-full text-[10px] font-bold text-white flex items-center justify-center" style={{ background: '#25d366' }}>
                              {conv.unread_count}
                            </span>
                          )}
                        </div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Conversation view */}
            {active ? (
              <div className="flex-1 border border-gray-200 rounded-2xl bg-white overflow-hidden flex flex-col">
                {/* Header */}
                <div className="px-5 py-3.5 border-b border-gray-200 flex items-center justify-between">
                  <div>
                    <p className="font-semibold text-gray-900">{active.lead_name ?? active.lead_phone}</p>
                    <div className="flex items-center gap-2">
                      <a href={`tel:${active.lead_phone}`} className="text-xs text-gray-400 hover:text-gray-600 flex items-center gap-1">
                        <Phone size={10} /> {active.lead_phone}
                      </a>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-gray-500">{active.ai_paused ? 'AI paused — manual mode' : 'AI is responding'}</span>
                    <button
                      onClick={toggleAI}
                      disabled={toggling}
                      className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-1.5 rounded-lg border transition-all ${
                        active.ai_paused
                          ? 'border-green-300 bg-green-50 text-green-700 hover:bg-green-100'
                          : 'border-amber-300 bg-amber-50 text-amber-700 hover:bg-amber-100'
                      }`}>
                      {toggling ? <Loader2 size={11} className="animate-spin" />
                        : active.ai_paused ? <Play size={11} /> : <Pause size={11} />}
                      {active.ai_paused ? 'Resume AI' : 'Pause AI'}
                    </button>
                  </div>
                </div>

                {/* Messages */}
                <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
                  {active.messages.map((msg, i) => (
                    <div key={i} className={`flex ${msg.role === 'user' ? 'justify-start' : 'justify-end'}`}>
                      <div className={`max-w-[75%] rounded-2xl px-4 py-2.5 text-sm leading-relaxed ${
                        msg.role === 'user'
                          ? 'bg-gray-100 text-gray-800 rounded-tl-sm'
                          : 'text-white rounded-tr-sm'
                      }`}
                        style={msg.role === 'assistant' ? { background: '#25d366' } : {}}>
                        <p className="whitespace-pre-wrap">{msg.content}</p>
                        <p className={`text-[10px] mt-1 ${msg.role === 'user' ? 'text-gray-400' : 'text-green-100'}`}>
                          {new Date(msg.ts).toLocaleTimeString('en-KE', { hour: '2-digit', minute: '2-digit' })}
                          {msg.role === 'assistant' && <span className="ml-1">· AI</span>}
                        </p>
                      </div>
                    </div>
                  ))}
                  <div ref={bottomRef} />
                </div>

                {/* Paused notice */}
                {active.ai_paused && (
                  <div className="px-5 py-3 border-t border-gray-100 bg-amber-50">
                    <p className="text-xs text-amber-700 flex items-center gap-2">
                      <Pause size={12} />
                      AI paused. To reply, open WhatsApp Business and message {active.lead_phone} directly.
                      <a href={`https://wa.me/${active.lead_phone.replace(/^\+/, '')}`} target="_blank" rel="noopener noreferrer"
                        className="font-semibold underline hover:no-underline ml-1">
                        Open in WhatsApp <ChevronRight size={10} className="inline" />
                      </a>
                    </p>
                  </div>
                )}

                {!active.ai_paused && (
                  <div className="px-5 py-3 border-t border-gray-100">
                    <p className="text-xs text-gray-400 flex items-center gap-2">
                      <Circle size={8} className="text-green-500 fill-green-500" />
                      AI is handling replies automatically. Pause to take over.
                    </p>
                  </div>
                )}
              </div>
            ) : (
              <div className="flex-1 flex items-center justify-center text-gray-400 border border-dashed border-gray-200 rounded-2xl">
                <div className="text-center">
                  <MessageSquare size={28} className="mx-auto mb-2 text-gray-300" />
                  <p className="text-sm">Select a conversation</p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </DashboardLayout>
  )
}
