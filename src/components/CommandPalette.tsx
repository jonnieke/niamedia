import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search, X, LayoutDashboard, Users, Zap, Film,
  FileText, Receipt, CalendarDays, MessageSquare, Link2,
  ShieldCheck, Settings, Package, TrendingUp, Gift,
  ArrowRight, Loader2, Briefcase, Image,
} from 'lucide-react'
import { supabase } from '../lib/supabase'

interface Result {
  id: string
  type: 'page' | 'lead' | 'proposal' | 'project' | 'quote' | 'action'
  title: string
  subtitle?: string
  icon: typeof Search
  iconColor?: string
  href: string
}

const PAGES: Result[] = [
  { id: 'p-dashboard',  type: 'page', title: 'Dashboard',       icon: LayoutDashboard, href: '/dashboard' },
  { id: 'p-leads',      type: 'page', title: 'Leads',            icon: Users,           href: '/leads' },
  { id: 'p-campaigns',  type: 'page', title: 'Campaigns',        icon: Zap,             href: '/campaigns' },
  { id: 'p-proposals',  type: 'page', title: 'Proposals',        icon: FileText,        href: '/proposals' },
  { id: 'p-production', type: 'page', title: 'Production Board', icon: Film,            href: '/production' },
  { id: 'p-invoices',   type: 'page', title: 'Invoices',         icon: Receipt,         href: '/invoices' },
  { id: 'p-portals',    type: 'page', title: 'Client Portals',   icon: Link2,           href: '/portals' },
  { id: 'p-inbox',      type: 'page', title: 'WhatsApp Inbox',   icon: MessageSquare,   href: '/inbox' },
  { id: 'p-calendar',   type: 'page', title: 'Calendar',         icon: CalendarDays,    href: '/calendar' },
  { id: 'p-billing',    type: 'page', title: 'Billing',          icon: Receipt,         href: '/billing' },
  { id: 'p-portfolio',  type: 'page', title: 'Portfolio',        icon: Image,           href: '/portfolio' },
  { id: 'p-analytics',  type: 'page', title: 'Analytics',        icon: TrendingUp,      href: '/analytics' },
  { id: 'p-team',       type: 'page', title: 'Team',             icon: Users,           href: '/team' },
  { id: 'p-requests',   type: 'page', title: 'Video Requests',   icon: Package,         href: '/requests' },
  { id: 'p-referral',   type: 'page', title: 'Refer & Earn',     icon: Gift,            href: '/referral' },
  { id: 'p-settings',   type: 'page', title: 'Settings',         icon: Settings,        href: '/settings' },
  { id: 'p-admin',      type: 'page', title: 'Admin Panel',      icon: ShieldCheck,     href: '/admin' },
]

const ACTIONS: Result[] = [
  { id: 'a-campaign',   type: 'action', title: 'New Campaign',      icon: Zap,      iconColor: '#7c3aed', href: '/new-campaign' },
  { id: 'a-quote',      type: 'action', title: 'Open Quote Form',   icon: FileText, iconColor: '#2563eb', href: '/quote' },
  { id: 'a-book',       type: 'action', title: 'Book a Meeting',    icon: CalendarDays, iconColor: '#059669', href: '/book' },
]

function fuzzy(needle: string, haystack: string): boolean {
  if (!needle) return true
  const n = needle.toLowerCase()
  const h = haystack.toLowerCase()
  if (h.includes(n)) return true
  let ni = 0
  for (let hi = 0; hi < h.length && ni < n.length; hi++) {
    if (h[hi] === n[ni]) ni++
  }
  return ni === n.length
}

interface CommandPaletteProps {
  open: boolean
  onClose: () => void
}

export default function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const navigate = useNavigate()
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  const [query, setQuery] = useState('')
  const [activeIdx, setActiveIdx] = useState(0)
  const [dbResults, setDbResults] = useState<Result[]>([])
  const [loadingDb, setLoadingDb] = useState(false)

  // Focus input when opened
  useEffect(() => {
    if (open) {
      setQuery('')
      setActiveIdx(0)
      setDbResults([])
      setTimeout(() => inputRef.current?.focus(), 50)
    }
  }, [open])

  // Fetch DB results when query changes (debounced)
  useEffect(() => {
    if (!open || query.length < 2) { setDbResults([]); return }
    const t = setTimeout(async () => {
      setLoadingDb(true)
      const q = query.toLowerCase()
      const [leads, proposals, projects, quotes] = await Promise.all([
        supabase.from('leads').select('id,name,business_name,status').ilike('business_name', `%${q}%`).limit(4),
        supabase.from('proposals').select('id,business_name,status,video_length').ilike('business_name', `%${q}%`).limit(4),
        supabase.from('projects').select('id,business_name,status').ilike('business_name', `%${q}%`).limit(4),
        supabase.from('quote_requests').select('id,business_name,status,video_length').ilike('business_name', `%${q}%`).limit(3),
      ])
      const results: Result[] = [
        ...(leads.data ?? []).map(l => ({
          id: `lead-${l.id}`, type: 'lead' as const,
          title: l.business_name ?? l.name,
          subtitle: `Lead · ${l.status}`,
          icon: Users, iconColor: '#7c3aed',
          href: '/leads',
        })),
        ...(proposals.data ?? []).map(p => ({
          id: `prop-${p.id}`, type: 'proposal' as const,
          title: p.business_name,
          subtitle: `Proposal · ${p.video_length ?? ''} · ${p.status}`,
          icon: FileText, iconColor: '#2563eb',
          href: '/proposals',
        })),
        ...(projects.data ?? []).map(p => ({
          id: `proj-${p.id}`, type: 'project' as const,
          title: p.business_name,
          subtitle: `Project · ${p.status.replace('_', ' ')}`,
          icon: Briefcase, iconColor: '#059669',
          href: '/production',
        })),
        ...(quotes.data ?? []).map(q => ({
          id: `quote-${q.id}`, type: 'quote' as const,
          title: q.business_name,
          subtitle: `Quote · ${q.video_length ?? ''} · ${q.status}`,
          icon: Zap, iconColor: '#d97706',
          href: '/admin',
        })),
      ]
      setDbResults(results)
      setLoadingDb(false)
    }, 200)
    return () => clearTimeout(t)
  }, [query, open])

  const allResults: Result[] = query.length < 2
    ? [
        ...ACTIONS,
        ...PAGES.filter(p => fuzzy(query, p.title)).slice(0, 8),
      ]
    : [
        ...dbResults,
        ...PAGES.filter(p => fuzzy(query, p.title)),
        ...ACTIONS.filter(a => fuzzy(query, a.title)),
      ]

  // Scroll active item into view
  useEffect(() => {
    const el = listRef.current?.querySelector(`[data-idx="${activeIdx}"]`)
    el?.scrollIntoView({ block: 'nearest' })
  }, [activeIdx])

  const go = useCallback((result: Result) => {
    onClose()
    navigate(result.href)
  }, [navigate, onClose])

  const handleKey = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') { e.preventDefault(); setActiveIdx(i => Math.min(i + 1, allResults.length - 1)) }
    if (e.key === 'ArrowUp') { e.preventDefault(); setActiveIdx(i => Math.max(i - 1, 0)) }
    if (e.key === 'Enter' && allResults[activeIdx]) go(allResults[activeIdx])
    if (e.key === 'Escape') onClose()
  }

  if (!open) return null

  const groupLabel = (type: Result['type']) => {
    switch (type) {
      case 'action': return 'Quick actions'
      case 'page': return 'Navigate'
      case 'lead': return 'Leads'
      case 'proposal': return 'Proposals'
      case 'project': return 'Projects'
      case 'quote': return 'Quotes'
    }
  }

  // Group results for display
  const groups: { label: string; items: (Result & { globalIdx: number })[] }[] = []
  let gi = 0
  const seen = new Set<string>()
  for (const r of allResults) {
    const label = groupLabel(r.type)
    if (!seen.has(label)) { seen.add(label); groups.push({ label, items: [] }) }
    groups[groups.length - 1].items.push({ ...r, globalIdx: gi++ })
  }

  return (
    <div
      className="fixed inset-0 z-[100] flex items-start justify-center pt-[15vh] px-4"
      style={{ background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }}
      onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}>

      <div className="w-full max-w-xl rounded-2xl overflow-hidden shadow-2xl"
        style={{ background: '#ffffff', border: '1px solid #e5e7eb' }}>

        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-gray-100">
          <Search size={16} className="text-gray-400 shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={e => { setQuery(e.target.value); setActiveIdx(0) }}
            onKeyDown={handleKey}
            placeholder="Search pages, clients, proposals, projects…"
            className="flex-1 text-sm text-gray-900 bg-transparent outline-none placeholder-gray-400"
          />
          {loadingDb && <Loader2 size={14} className="animate-spin text-gray-400 shrink-0" />}
          {!loadingDb && query && (
            <button onClick={() => { setQuery(''); setActiveIdx(0) }}
              className="text-gray-400 hover:text-gray-600 shrink-0">
              <X size={14} />
            </button>
          )}
          <kbd className="hidden sm:inline-flex items-center px-1.5 py-0.5 rounded text-[10px] text-gray-400 shrink-0"
            style={{ background: '#f3f4f6', border: '1px solid #e5e7eb' }}>
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div ref={listRef} className="max-h-80 overflow-y-auto py-2">
          {allResults.length === 0 && query.length >= 2 && !loadingDb && (
            <div className="py-10 text-center text-sm text-gray-400">
              No results for "{query}"
            </div>
          )}
          {groups.map(group => (
            <div key={group.label}>
              <p className="px-4 pt-2 pb-1 text-[10px] font-bold uppercase tracking-widest text-gray-400">
                {group.label}
              </p>
              {group.items.map(result => {
                const Icon = result.icon
                const isActive = result.globalIdx === activeIdx
                return (
                  <button
                    key={result.id}
                    data-idx={result.globalIdx}
                    onMouseEnter={() => setActiveIdx(result.globalIdx)}
                    onClick={() => go(result)}
                    className="w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors"
                    style={{ background: isActive ? 'rgba(124,58,237,0.06)' : 'transparent' }}>
                    <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0"
                      style={{ background: result.iconColor ? `${result.iconColor}15` : '#f3f4f6' }}>
                      <Icon size={14} style={{ color: result.iconColor ?? '#6b7280' }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${isActive ? 'text-gray-900' : 'text-gray-700'}`}>
                        {result.title}
                      </p>
                      {result.subtitle && (
                        <p className="text-[11px] text-gray-400 truncate capitalize">{result.subtitle}</p>
                      )}
                    </div>
                    {isActive && <ArrowRight size={13} className="text-purple-400 shrink-0" />}
                  </button>
                )
              })}
            </div>
          ))}
        </div>

        {/* Footer */}
        <div className="px-4 py-2.5 border-t border-gray-100 flex items-center gap-4 text-[10px] text-gray-400">
          <span><kbd className="font-mono font-bold">↑↓</kbd> navigate</span>
          <span><kbd className="font-mono font-bold">↵</kbd> open</span>
          <span><kbd className="font-mono font-bold">esc</kbd> close</span>
          <span className="ml-auto">Powered by Nia</span>
        </div>
      </div>
    </div>
  )
}
