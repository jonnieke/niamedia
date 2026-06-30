import { useState, useEffect } from 'react'
import { Loader2, Sparkles, ChevronLeft, ChevronRight, X, Check, MessageSquare, Image, Lightbulb, Instagram } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface CalItem {
  id: string
  scheduled_date: string
  content_type: string
  content: string
  status: string
}

const TYPE_META: Record<string, { label: string; color: string; bg: string; Icon: typeof MessageSquare }> = {
  caption:  { label: 'Caption',   color: '#7c3aed', bg: '#ede9fe', Icon: Instagram },
  whatsapp: { label: 'WhatsApp',  color: '#059669', bg: '#d1fae5', Icon: MessageSquare },
  story:    { label: 'Story',     color: '#d97706', bg: '#fef3c7', Icon: Image },
  idea:     { label: 'Idea',      color: '#2563eb', bg: '#dbeafe', Icon: Lightbulb },
}

const STATUS_META: Record<string, { label: string; color: string }> = {
  idea:      { label: 'Idea',      color: '#94a3b8' },
  scheduled: { label: 'Scheduled', color: '#7c3aed' },
  posted:    { label: 'Posted',    color: '#059669' },
}

function toDateKey(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export default function Calendar() {
  const { user } = useAuth()
  const now = new Date()
  const [year, setYear] = useState(now.getFullYear())
  const [month, setMonth] = useState(now.getMonth() + 1) // 1-based
  const [items, setItems] = useState<CalItem[]>([])
  const [loading, setLoading] = useState(true)
  const [generating, setGenerating] = useState(false)
  const [selected, setSelected] = useState<{ date: string; items: CalItem[] } | null>(null)
  const [genError, setGenError] = useState('')

  const monthLabel = new Date(year, month - 1, 1).toLocaleString('en-KE', { month: 'long', year: 'numeric' })

  const load = async () => {
    if (!user) return
    setLoading(true)
    const monthStart = `${year}-${String(month).padStart(2, '0')}-01`
    const daysInMonth = new Date(year, month, 0).getDate()
    const monthEnd = `${year}-${String(month).padStart(2, '0')}-${String(daysInMonth).padStart(2, '0')}`
    const { data } = await supabase.from('content_calendar')
      .select('*')
      .eq('user_id', user.id)
      .gte('scheduled_date', monthStart)
      .lte('scheduled_date', monthEnd)
      .order('scheduled_date')
    setItems((data ?? []) as CalItem[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user, year, month])

  const navigate = (dir: -1 | 1) => {
    let m = month + dir
    let y = year
    if (m < 1) { m = 12; y-- }
    if (m > 12) { m = 1; y++ }
    setMonth(m)
    setYear(y)
    setSelected(null)
  }

  const generate = async () => {
    setGenerating(true)
    setGenError('')
    try {
      const { error } = await supabase.functions.invoke('generate-calendar', { body: { year, month } })
      if (error) throw new Error(error.message)
      await load()
    } catch (e) {
      setGenError(e instanceof Error ? e.message : 'Generation failed')
    } finally {
      setGenerating(false)
    }
  }

  const cycleStatus = async (item: CalItem) => {
    const order: CalItem['status'][] = ['idea', 'scheduled', 'posted']
    const next = order[(order.indexOf(item.status) + 1) % order.length]
    await supabase.from('content_calendar').update({ status: next }).eq('id', item.id)
    setItems(prev => prev.map(i => i.id === item.id ? { ...i, status: next } : i))
    if (selected) setSelected(s => s ? { ...s, items: s.items.map(i => i.id === item.id ? { ...i, status: next } : i) } : null)
  }

  const deleteItem = async (item: CalItem) => {
    await supabase.from('content_calendar').delete().eq('id', item.id)
    setItems(prev => prev.filter(i => i.id !== item.id))
    if (selected) {
      const remaining = selected.items.filter(i => i.id !== item.id)
      if (remaining.length === 0) setSelected(null)
      else setSelected({ ...selected, items: remaining })
    }
  }

  // Build calendar grid
  const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
  const daysInMonth = new Date(year, month, 0).getDate()
  const itemsByDate: Record<string, CalItem[]> = {}
  items.forEach(item => {
    const key = item.scheduled_date
    if (!itemsByDate[key]) itemsByDate[key] = []
    itemsByDate[key].push(item)
  })

  const totalPosted = items.filter(i => i.status === 'posted').length
  const totalScheduled = items.filter(i => i.status === 'scheduled').length

  return (
    <DashboardLayout>
      <div className="max-w-5xl">

        {/* Header */}
        <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Content Calendar</h1>
            <p className="text-sm text-gray-500 mt-0.5">AI-generated monthly content plan for your campaigns.</p>
          </div>
          <button
            onClick={generate}
            disabled={generating}
            className="btn-primary text-sm px-4 py-2.5 gap-2 disabled:opacity-60">
            {generating ? <Loader2 size={15} className="animate-spin" /> : <Sparkles size={15} />}
            {generating ? 'Generating…' : `Generate ${monthLabel}`}
          </button>
        </div>

        {genError && <p className="text-xs text-red-500 mb-4">{genError}</p>}

        {/* Stats row */}
        {items.length > 0 && (
          <div className="flex gap-3 mb-5 flex-wrap">
            <div className="px-4 py-2.5 rounded-xl border border-gray-200 bg-white text-sm">
              <span className="font-bold text-gray-900">{items.length}</span> <span className="text-gray-500">items total</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl border border-purple-200 bg-purple-50 text-sm">
              <span className="font-bold text-purple-700">{totalScheduled}</span> <span className="text-purple-600">scheduled</span>
            </div>
            <div className="px-4 py-2.5 rounded-xl border border-green-200 bg-green-50 text-sm">
              <span className="font-bold text-green-700">{totalPosted}</span> <span className="text-green-600">posted</span>
            </div>
          </div>
        )}

        {/* Month nav */}
        <div className="flex items-center justify-between mb-4">
          <button onClick={() => navigate(-1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <ChevronLeft size={16} />
          </button>
          <h2 className="text-base font-bold text-gray-900">{monthLabel}</h2>
          <button onClick={() => navigate(1)} className="w-8 h-8 flex items-center justify-center rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-500">
            <ChevronRight size={16} />
          </button>
        </div>

        {loading ? (
          <div className="flex justify-center py-20"><Loader2 size={22} className="animate-spin text-purple-500" /></div>
        ) : (
          <>
            {/* Day-of-week headers */}
            <div className="grid grid-cols-7 mb-1">
              {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map(d => (
                <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1.5">{d}</div>
              ))}
            </div>

            {/* Calendar grid */}
            <div className="grid grid-cols-7 gap-px bg-gray-200 rounded-2xl overflow-hidden border border-gray-200">
              {/* Empty cells before month starts */}
              {Array.from({ length: firstDay }).map((_, i) => (
                <div key={`empty-${i}`} className="bg-gray-50 min-h-[80px] sm:min-h-[100px]" />
              ))}

              {/* Day cells */}
              {Array.from({ length: daysInMonth }).map((_, i) => {
                const day = i + 1
                const dateKey = `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`
                const dayItems = itemsByDate[dateKey] ?? []
                const isToday = dateKey === toDateKey(now)

                return (
                  <div
                    key={dateKey}
                    onClick={() => dayItems.length > 0 && setSelected({ date: dateKey, items: dayItems })}
                    className={`bg-white min-h-[80px] sm:min-h-[100px] p-1.5 flex flex-col ${dayItems.length > 0 ? 'cursor-pointer hover:bg-purple-50/40 transition-colors' : ''}`}>
                    <span className={`text-xs font-semibold mb-1 self-start w-6 h-6 flex items-center justify-center rounded-full ${isToday ? 'text-white' : 'text-gray-600'}`}
                      style={isToday ? { background: '#7c3aed' } : {}}>
                      {day}
                    </span>
                    <div className="flex flex-col gap-0.5">
                      {dayItems.slice(0, 3).map(item => {
                        const meta = TYPE_META[item.content_type] ?? TYPE_META.idea
                        return (
                          <div key={item.id}
                            className="text-[9px] sm:text-[10px] font-medium px-1 py-0.5 rounded truncate"
                            style={{ background: meta.bg, color: meta.color }}>
                            {meta.label}
                            {item.status === 'posted' && ' ✓'}
                          </div>
                        )
                      })}
                      {dayItems.length > 3 && (
                        <p className="text-[9px] text-gray-400 pl-1">+{dayItems.length - 3} more</p>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>

            {items.length === 0 && (
              <div className="text-center py-12 mt-4">
                <Sparkles size={32} className="mx-auto mb-3 text-gray-300" />
                <p className="font-medium text-gray-700 mb-1">No content plan for this month yet</p>
                <p className="text-sm text-gray-500 mb-4">Generate a full month of captions, WhatsApp messages, and content ideas in seconds.</p>
                <button onClick={generate} disabled={generating} className="btn-primary text-sm px-5 py-2.5 gap-2 disabled:opacity-60">
                  {generating ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                  Generate {monthLabel}
                </button>
              </div>
            )}
          </>
        )}
      </div>

      {/* Day detail panel */}
      {selected && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/30 backdrop-blur-sm" onClick={() => setSelected(null)} />
          <div className="relative w-full max-w-lg bg-white rounded-2xl shadow-2xl overflow-hidden max-h-[80vh] flex flex-col">
            <div className="flex items-center justify-between px-5 py-3.5 border-b border-gray-100">
              <p className="text-sm font-bold text-gray-900">
                {new Date(selected.date + 'T12:00:00').toLocaleDateString('en-KE', { weekday: 'long', day: 'numeric', month: 'long' })}
              </p>
              <button onClick={() => setSelected(null)} className="text-gray-400 hover:text-gray-600"><X size={16} /></button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {selected.items.map(item => {
                const meta = TYPE_META[item.content_type] ?? TYPE_META.idea
                const statusMeta = STATUS_META[item.status] ?? STATUS_META.idea
                const Icon = meta.Icon
                return (
                  <div key={item.id} className="rounded-xl border border-gray-200 p-4">
                    <div className="flex items-center gap-2 mb-2">
                      <div className="w-6 h-6 rounded-md flex items-center justify-center" style={{ background: meta.bg }}>
                        <Icon size={12} style={{ color: meta.color }} />
                      </div>
                      <span className="text-xs font-semibold" style={{ color: meta.color }}>{meta.label}</span>
                      <button
                        onClick={() => cycleStatus(item)}
                        className="ml-auto text-[10px] font-bold px-2 py-0.5 rounded-full border transition-colors"
                        style={{ color: statusMeta.color, borderColor: statusMeta.color }}>
                        {item.status === 'posted' ? <Check size={10} className="inline" /> : null} {statusMeta.label}
                      </button>
                      <button onClick={() => deleteItem(item)} className="text-gray-300 hover:text-red-400 transition-colors ml-1">
                        <X size={13} />
                      </button>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">{item.content}</p>
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
