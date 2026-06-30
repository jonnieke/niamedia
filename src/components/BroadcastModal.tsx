import { useState } from 'react'
import { X, Megaphone, Sparkles, Loader2, Send, Users, CheckCircle } from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Props {
  leads: { id: string; name: string; phone: string; status: string; campaign_id: string | null }[]
  campaigns: { id: string; title: string }[]
  onClose: () => void
}

export default function BroadcastModal({ leads, campaigns, onClose }: Props) {
  const [campaignFilter, setCampaignFilter] = useState('')
  const [statusFilter, setStatusFilter] = useState('all')
  const [prompt, setPrompt] = useState('')
  const [message, setMessage] = useState('')
  const [generating, setGenerating] = useState(false)
  const [sending, setSending] = useState(false)
  const [done, setDone] = useState<{ sentCount: number; failedCount: number } | null>(null)
  const [error, setError] = useState('')

  const filteredLeads = leads.filter(l => {
    if (l.status === 'Lost') return false
    if (!l.phone) return false
    if (campaignFilter && l.campaign_id !== campaignFilter) return false
    if (statusFilter !== 'all' && l.status !== statusFilter) return false
    return true
  })

  const generateMessage = async () => {
    if (!prompt.trim()) return
    setGenerating(true)
    setError('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-broadcast', {
        body: { prompt: prompt.trim(), campaignId: campaignFilter || undefined, statusFilter, previewOnly: true },
      })
      if (fnErr) throw new Error(fnErr.message)
      // We get back a generated message in previewOnly mode
      setMessage(data.message ?? '')
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const sendBroadcast = async () => {
    if (!message.trim() || filteredLeads.length === 0) return
    setSending(true)
    setError('')
    try {
      const { data, error: fnErr } = await supabase.functions.invoke('send-broadcast', {
        body: {
          messageOverride: message.trim(),
          campaignId: campaignFilter || undefined,
          statusFilter,
        },
      })
      if (fnErr) throw new Error(fnErr.message)
      setDone({ sentCount: data.sentCount, failedCount: data.failedCount })
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Send failed')
    } finally {
      setSending(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[90vh] flex flex-col">

        {/* Header */}
        <div className="flex items-center justify-between px-5 py-4 border-b border-gray-100">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-green-50 flex items-center justify-center">
              <Megaphone size={15} className="text-green-600" />
            </div>
            <div>
              <p className="text-sm font-bold text-gray-900">WhatsApp Broadcast</p>
              <p className="text-xs text-gray-500">Send a message to multiple leads at once</p>
            </div>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {done ? (
            <div className="text-center py-8">
              <CheckCircle size={40} className="mx-auto mb-3 text-green-500" />
              <p className="text-lg font-bold text-gray-900 mb-1">Broadcast sent!</p>
              <p className="text-sm text-gray-500">
                <span className="text-green-600 font-semibold">{done.sentCount} delivered</span>
                {done.failedCount > 0 && <span className="text-red-500 ml-2">{done.failedCount} failed</span>}
              </p>
              <button onClick={onClose} className="mt-5 btn-primary text-sm px-5 py-2.5">Done</button>
            </div>
          ) : (
            <>
              {/* Recipients */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Who receives this?</p>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">From campaign</label>
                    <select className="input text-sm" value={campaignFilter} onChange={e => setCampaignFilter(e.target.value)}>
                      <option value="">All campaigns</option>
                      {campaigns.map(c => <option key={c.id} value={c.id}>{c.title}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="text-[10px] text-gray-500 mb-1 block">Status</label>
                    <select className="input text-sm" value={statusFilter} onChange={e => setStatusFilter(e.target.value)}>
                      <option value="all">All (excl. Lost)</option>
                      <option value="New">New</option>
                      <option value="Contacted">Contacted</option>
                      <option value="Interested">Interested</option>
                      <option value="Converted">Converted</option>
                    </select>
                  </div>
                </div>
                <div className="flex items-center gap-1.5 mt-2 px-3 py-2 rounded-lg bg-gray-50 border border-gray-200">
                  <Users size={12} className="text-purple-500" />
                  <p className="text-xs text-gray-600">
                    <span className="font-bold text-gray-900">{filteredLeads.length}</span> lead{filteredLeads.length !== 1 ? 's' : ''} with phone numbers will receive this
                  </p>
                </div>
              </div>

              {/* AI generate */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Generate with AI</p>
                <div className="flex gap-2">
                  <input
                    className="input text-sm flex-1"
                    placeholder='e.g. "Announce 20% off this weekend only"'
                    value={prompt}
                    onChange={e => setPrompt(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && generateMessage()}
                  />
                  <button
                    onClick={generateMessage}
                    disabled={!prompt.trim() || generating}
                    className="px-3 py-2 rounded-xl text-xs font-semibold text-white disabled:opacity-50 shrink-0 flex items-center gap-1.5"
                    style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                    {generating ? <Loader2 size={13} className="animate-spin" /> : <Sparkles size={13} />}
                    Generate
                  </button>
                </div>
              </div>

              {/* Message */}
              <div>
                <p className="text-xs font-semibold text-gray-700 mb-2">Message <span className="text-gray-400 font-normal">(edit freely)</span></p>
                <textarea
                  className="input text-sm w-full"
                  rows={7}
                  placeholder="Hi [Name], ..."
                  value={message}
                  onChange={e => setMessage(e.target.value)}
                />
                <p className="text-[10px] text-gray-400 mt-1">Use [Name] to personalise — it's replaced with each lead's first name.</p>
              </div>

              {error && <p className="text-xs text-red-500">{error}</p>}
            </>
          )}
        </div>

        {!done && (
          <div className="px-5 py-4 border-t border-gray-100 flex justify-end gap-2">
            <button onClick={onClose} className="btn-secondary text-sm px-4 py-2">Cancel</button>
            <button
              onClick={sendBroadcast}
              disabled={!message.trim() || filteredLeads.length === 0 || sending}
              className="btn-primary text-sm px-4 py-2.5 gap-1.5 disabled:opacity-50">
              {sending ? <Loader2 size={14} className="animate-spin" /> : <Send size={14} />}
              Send to {filteredLeads.length} lead{filteredLeads.length !== 1 ? 's' : ''}
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
