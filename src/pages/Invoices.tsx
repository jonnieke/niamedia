import { useState, useEffect } from 'react'
import { Plus, Send, CheckCircle, Clock, AlertCircle, X, Printer, CreditCard } from 'lucide-react'
import DashboardLayout from '../components/layout/DashboardLayout'
import { supabase } from '../lib/supabase'
import { useAuth } from '../lib/AuthContext'

interface InvoiceItem { description: string; qty: number; rate: number }
interface Invoice {
  id: string
  invoice_number: string
  client_name: string
  client_email: string
  client_phone: string
  items: InvoiceItem[]
  subtotal: number
  tax_rate: number
  tax_amount: number
  total: number
  currency: string
  status: 'draft' | 'sent' | 'paid' | 'overdue' | 'cancelled'
  due_date: string
  paid_at: string | null
  mpesa_ref: string | null
  notes: string
  created_at: string
}

const STATUS_META: Record<string, { label: string; color: string; bg: string; icon: typeof CheckCircle }> = {
  draft:     { label: 'Draft',     color: '#6b7280', bg: '#f3f4f6', icon: Clock },
  sent:      { label: 'Sent',      color: '#2563eb', bg: '#eff6ff', icon: Send },
  paid:      { label: 'Paid',      color: '#059669', bg: '#ecfdf5', icon: CheckCircle },
  overdue:   { label: 'Overdue',   color: '#dc2626', bg: '#fef2f2', icon: AlertCircle },
  cancelled: { label: 'Cancelled', color: '#9ca3af', bg: '#f9fafb', icon: X },
}

const EMPTY_ITEM: InvoiceItem = { description: '', qty: 1, rate: 0 }

function fmt(n: number, currency = 'KES') {
  return `${currency} ${n.toLocaleString('en-KE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
}

function InvoicePrint({ inv }: { inv: Invoice }) {
  return (
    <div id="invoice-print" className="bg-white p-10 max-w-2xl mx-auto text-gray-900 text-sm">
      <div className="flex justify-between items-start mb-8">
        <div>
          <p className="text-2xl font-bold" style={{ color: '#7c3aed' }}>Nia Media</p>
          <p className="text-gray-500 text-xs mt-1">AI-Powered Advertising</p>
        </div>
        <div className="text-right">
          <p className="text-xs text-gray-400 uppercase tracking-wider">Invoice</p>
          <p className="text-xl font-bold text-gray-900">#{inv.invoice_number}</p>
          <p className="text-xs text-gray-500 mt-1">Date: {new Date(inv.created_at).toLocaleDateString('en-KE')}</p>
          {inv.due_date && <p className="text-xs text-gray-500">Due: {new Date(inv.due_date).toLocaleDateString('en-KE')}</p>}
        </div>
      </div>

      <div className="mb-8">
        <p className="text-xs text-gray-400 uppercase tracking-wider mb-1">Billed to</p>
        <p className="font-semibold">{inv.client_name}</p>
        {inv.client_email && <p className="text-gray-500">{inv.client_email}</p>}
        {inv.client_phone && <p className="text-gray-500">{inv.client_phone}</p>}
      </div>

      <table className="w-full mb-6 text-sm">
        <thead>
          <tr className="border-b-2 border-gray-200">
            <th className="text-left py-2 text-gray-500 font-medium text-xs uppercase tracking-wider">Description</th>
            <th className="text-right py-2 text-gray-500 font-medium text-xs uppercase tracking-wider w-16">Qty</th>
            <th className="text-right py-2 text-gray-500 font-medium text-xs uppercase tracking-wider w-28">Rate</th>
            <th className="text-right py-2 text-gray-500 font-medium text-xs uppercase tracking-wider w-28">Amount</th>
          </tr>
        </thead>
        <tbody>
          {inv.items.map((item, i) => (
            <tr key={i} className="border-b border-gray-100">
              <td className="py-3">{item.description}</td>
              <td className="py-3 text-right text-gray-600">{item.qty}</td>
              <td className="py-3 text-right text-gray-600">{fmt(item.rate, inv.currency)}</td>
              <td className="py-3 text-right font-medium">{fmt(item.qty * item.rate, inv.currency)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="flex justify-end">
        <div className="w-56 space-y-2">
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">Subtotal</span>
            <span>{fmt(inv.subtotal, inv.currency)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-gray-500">VAT ({inv.tax_rate}%)</span>
            <span>{fmt(inv.tax_amount, inv.currency)}</span>
          </div>
          <div className="flex justify-between font-bold text-base border-t border-gray-200 pt-2">
            <span>Total</span>
            <span style={{ color: '#7c3aed' }}>{fmt(inv.total, inv.currency)}</span>
          </div>
        </div>
      </div>

      {inv.mpesa_ref && (
        <div className="mt-6 p-3 rounded-lg bg-green-50 border border-green-200 text-xs text-green-700">
          Paid via M-Pesa · Ref: {inv.mpesa_ref}
        </div>
      )}

      {inv.notes && <p className="mt-6 text-xs text-gray-400">{inv.notes}</p>}

      <div className="mt-10 border-t border-gray-100 pt-4 text-xs text-gray-400 text-center">
        Generated by Nia Media · Thank you for your business
      </div>
    </div>
  )
}

export default function Invoices() {
  const { user } = useAuth()
  const [invoices, setInvoices] = useState<Invoice[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [preview, setPreview] = useState<Invoice | null>(null)
  const [pesapalLoading, setPesapalLoading] = useState<string | null>(null)
  const [form, setForm] = useState({
    client_name: '', client_email: '', client_phone: '',
    due_date: '', currency: 'KES', tax_rate: 16, notes: '',
    items: [{ ...EMPTY_ITEM }] as InvoiceItem[],
  })
  const [saving, setSaving] = useState(false)

  const load = async () => {
    if (!user) return
    setLoading(true)
    const { data } = await supabase.from('invoices').select('*').eq('user_id', user.id).order('created_at', { ascending: false })
    setInvoices((data ?? []) as Invoice[])
    setLoading(false)
  }

  useEffect(() => { load() }, [user])

  const calcTotals = (items: InvoiceItem[], taxRate: number) => {
    const subtotal = items.reduce((s, i) => s + (i.qty * i.rate), 0)
    const tax_amount = subtotal * (taxRate / 100)
    return { subtotal, tax_amount, total: subtotal + tax_amount }
  }

  const save = async () => {
    if (!user || !form.client_name) return
    setSaving(true)
    const { subtotal, tax_amount, total } = calcTotals(form.items, form.tax_rate)
    const num = `INV-${Date.now().toString().slice(-6)}`
    const { error } = await supabase.from('invoices').insert({
      user_id: user.id,
      invoice_number: num,
      ...form,
      subtotal, tax_amount, total,
      status: 'draft',
    })
    if (!error) { setShowModal(false); load() }
    setSaving(false)
  }

  const updateStatus = async (id: string, status: string, extra?: Record<string, unknown>) => {
    await supabase.from('invoices').update({ status, ...extra }).eq('id', id)
    setInvoices(prev => prev.map(i => i.id === id ? { ...i, status: status as Invoice['status'], ...extra } : i))
  }

  const requestPesapal = async (inv: Invoice) => {
    setPesapalLoading(inv.id)
    try {
      const { data: { session } } = await supabase.auth.getSession()
      const callbackUrl = `${window.location.origin}/payment/callback?type=invoice&id=${inv.id}`
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/pesapal-checkout`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session?.access_token ?? import.meta.env.VITE_SUPABASE_ANON_KEY}`,
          'apikey': import.meta.env.VITE_SUPABASE_ANON_KEY,
        },
        body: JSON.stringify({
          orderId: `inv_${inv.id}`,
          amountKes: Math.round(inv.total),
          description: `Invoice #${inv.invoice_number} — ${inv.client_name}`,
          callbackUrl,
          email: inv.client_email ?? '',
          phone: inv.client_phone ?? '',
          firstName: inv.client_name.split(' ')[0],
          lastName: inv.client_name.split(' ').slice(1).join(' ') || inv.client_name,
        }),
      })
      const data = await res.json() as { redirectUrl?: string; error?: string }
      if (data.redirectUrl) {
        updateStatus(inv.id, 'sent')
        window.open(data.redirectUrl, '_blank')
      } else {
        alert(data.error ?? 'PesaPal checkout failed — check Supabase secrets')
      }
    } catch {
      alert('PesaPal checkout failed')
    }
    setPesapalLoading(null)
  }

  const updateItem = (idx: number, field: keyof InvoiceItem, val: string | number) =>
    setForm(f => ({ ...f, items: f.items.map((item, i) => i === idx ? { ...item, [field]: val } : item) }))

  const totalSummary = { paid: 0, outstanding: 0, overdue: 0 }
  invoices.forEach(inv => {
    if (inv.status === 'paid') totalSummary.paid += inv.total
    else if (inv.status === 'overdue') totalSummary.overdue += inv.total
    else if (['sent', 'draft'].includes(inv.status)) totalSummary.outstanding += inv.total
  })

  if (preview) {
    return (
      <DashboardLayout>
        <div className="max-w-3xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <button onClick={() => setPreview(null)} className="text-sm text-gray-500 hover:text-gray-800 flex items-center gap-2">
              ← Back
            </button>
            <div className="flex gap-2">
              <button onClick={() => window.print()}
                className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl border border-gray-200 text-gray-700 hover:bg-gray-50">
                <Printer size={14} /> Print / PDF
              </button>
              {preview.client_phone && preview.status !== 'paid' && (
                <button onClick={() => requestPesapal(preview)}
                  disabled={pesapalLoading === preview.id}
                  className="flex items-center gap-2 text-sm px-4 py-2 rounded-xl text-white font-medium"
                  style={{ background: '#7c3aed' }}>
                  <CreditCard size={14} /> Pay via PesaPal
                </button>
              )}
            </div>
          </div>
          <InvoicePrint inv={preview} />
        </div>
      </DashboardLayout>
    )
  }

  return (
    <DashboardLayout>
      <div className="max-w-5xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <div>
            <span className="section-tag">Finance</span>
            <h1 className="text-2xl font-bold text-gray-900 mt-1">Invoices</h1>
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
            <Plus size={15} /> New Invoice
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-3 gap-4 mb-6">
          {[
            { label: 'Paid', amount: totalSummary.paid, color: '#059669' },
            { label: 'Outstanding', amount: totalSummary.outstanding, color: '#2563eb' },
            { label: 'Overdue', amount: totalSummary.overdue, color: '#dc2626' },
          ].map(s => (
            <div key={s.label} className="card-glow p-5">
              <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-1">{s.label}</p>
              <p className="text-xl font-bold" style={{ color: s.color }}>{fmt(s.amount)}</p>
            </div>
          ))}
        </div>

        {/* Invoice list */}
        <div className="card-glow overflow-hidden">
          {loading ? (
            <div className="p-12 text-center text-gray-400 text-sm">Loading invoices…</div>
          ) : invoices.length === 0 ? (
            <div className="p-12 text-center">
              <p className="text-gray-400 text-sm mb-3">No invoices yet</p>
              <button onClick={() => setShowModal(true)} className="btn-primary text-sm gap-2">
                <Plus size={14} /> Create first invoice
              </button>
            </div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-100">
                  {['Invoice', 'Client', 'Amount', 'Due', 'Status', ''].map(h => (
                    <th key={h} className="text-left text-xs font-semibold text-gray-400 uppercase tracking-wider px-5 py-3">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invoices.map(inv => {
                  const meta = STATUS_META[inv.status]
                  const Icon = meta.icon
                  return (
                    <tr key={inv.id} className="border-b border-gray-50 hover:bg-gray-50 transition-colors">
                      <td className="px-5 py-4 text-sm font-semibold text-gray-800">#{inv.invoice_number}</td>
                      <td className="px-5 py-4">
                        <p className="text-sm font-medium text-gray-900">{inv.client_name}</p>
                        {inv.client_email && <p className="text-xs text-gray-400">{inv.client_email}</p>}
                      </td>
                      <td className="px-5 py-4 text-sm font-bold text-gray-900">{fmt(inv.total, inv.currency)}</td>
                      <td className="px-5 py-4 text-sm text-gray-500">
                        {inv.due_date ? new Date(inv.due_date).toLocaleDateString('en-KE', { day: 'numeric', month: 'short' }) : '—'}
                      </td>
                      <td className="px-5 py-4">
                        <span className="inline-flex items-center gap-1 text-xs font-semibold px-2 py-1 rounded-full"
                          style={{ color: meta.color, background: meta.bg }}>
                          <Icon size={10} />
                          {meta.label}
                        </span>
                      </td>
                      <td className="px-5 py-4">
                        <div className="flex items-center gap-2 justify-end">
                          <button onClick={() => setPreview(inv)}
                            className="text-xs text-purple-600 hover:text-purple-800 font-medium">
                            View
                          </button>
                          {inv.status === 'draft' && (
                            <button onClick={() => updateStatus(inv.id, 'sent')}
                              className="text-xs text-blue-600 hover:text-blue-800 font-medium">
                              Mark Sent
                            </button>
                          )}
                          {inv.status === 'sent' && (
                            <button onClick={() => updateStatus(inv.id, 'paid', { paid_at: new Date().toISOString() })}
                              className="text-xs text-emerald-600 hover:text-emerald-800 font-medium">
                              Mark Paid
                            </button>
                          )}
                          {inv.client_phone && inv.status !== 'paid' && (
                            <button onClick={() => requestPesapal(inv)}
                              disabled={pesapalLoading === inv.id}
                              className="text-xs font-semibold px-2 py-1 rounded-lg text-white"
                              style={{ background: '#7c3aed' }}>
                              Pay
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Create Invoice Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto" style={{ background: 'rgba(0,0,0,0.5)' }}>
          <div className="w-full max-w-xl bg-white rounded-2xl shadow-2xl m-6">
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
              <h2 className="font-bold text-gray-900">New Invoice</h2>
              <button onClick={() => setShowModal(false)}><X size={18} className="text-gray-400" /></button>
            </div>
            <div className="p-6 space-y-4 max-h-[75vh] overflow-y-auto">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-2">
                  <label className="label">Client name *</label>
                  <input className="input" value={form.client_name} onChange={e => setForm(f => ({ ...f, client_name: e.target.value }))} placeholder="Kilele Bakery" />
                </div>
                <div>
                  <label className="label">Email</label>
                  <input className="input" type="email" value={form.client_email} onChange={e => setForm(f => ({ ...f, client_email: e.target.value }))} placeholder="client@example.com" />
                </div>
                <div>
                  <label className="label">Phone (for M-Pesa)</label>
                  <input className="input" value={form.client_phone} onChange={e => setForm(f => ({ ...f, client_phone: e.target.value }))} placeholder="254712345678" />
                </div>
                <div>
                  <label className="label">Due date</label>
                  <input className="input" type="date" value={form.due_date} onChange={e => setForm(f => ({ ...f, due_date: e.target.value }))} />
                </div>
                <div>
                  <label className="label">VAT %</label>
                  <input className="input" type="number" value={form.tax_rate} onChange={e => setForm(f => ({ ...f, tax_rate: Number(e.target.value) }))} />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-2">
                  <label className="label mb-0">Line items</label>
                  <button onClick={() => setForm(f => ({ ...f, items: [...f.items, { ...EMPTY_ITEM }] }))}
                    className="text-xs text-purple-600 font-semibold">+ Add line</button>
                </div>
                <div className="space-y-2">
                  {form.items.map((item, i) => (
                    <div key={i} className="grid grid-cols-12 gap-2 items-center">
                      <input className="input col-span-6 text-sm" value={item.description}
                        onChange={e => updateItem(i, 'description', e.target.value)} placeholder="Description" />
                      <input className="input col-span-2 text-sm text-center" type="number" value={item.qty}
                        onChange={e => updateItem(i, 'qty', Number(e.target.value))} placeholder="Qty" />
                      <input className="input col-span-3 text-sm" type="number" value={item.rate}
                        onChange={e => updateItem(i, 'rate', Number(e.target.value))} placeholder="Rate" />
                      <button onClick={() => setForm(f => ({ ...f, items: f.items.filter((_, j) => j !== i) }))}
                        className="col-span-1 text-gray-300 hover:text-red-400"><X size={14} /></button>
                    </div>
                  ))}
                </div>

                {/* Totals preview */}
                <div className="mt-3 border-t border-gray-100 pt-3 text-sm space-y-1">
                  {(() => { const t = calcTotals(form.items, form.tax_rate); return (
                    <>
                      <div className="flex justify-between text-gray-500"><span>Subtotal</span><span>{fmt(t.subtotal, form.currency)}</span></div>
                      <div className="flex justify-between text-gray-500"><span>VAT ({form.tax_rate}%)</span><span>{fmt(t.tax_amount, form.currency)}</span></div>
                      <div className="flex justify-between font-bold text-gray-900"><span>Total</span><span style={{ color: '#7c3aed' }}>{fmt(t.total, form.currency)}</span></div>
                    </>
                  )})()}
                </div>
              </div>

              <div>
                <label className="label">Notes / payment instructions</label>
                <textarea className="input" rows={2} value={form.notes} onChange={e => setForm(f => ({ ...f, notes: e.target.value }))} placeholder="Payment terms, bank details, etc." />
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-100 flex justify-end gap-3">
              <button onClick={() => setShowModal(false)} className="btn-secondary text-sm">Cancel</button>
              <button onClick={save} disabled={saving || !form.client_name} className="btn-primary text-sm gap-2 disabled:opacity-40">
                {saving ? 'Saving…' : 'Create Invoice'}
              </button>
            </div>
          </div>
        </div>
      )}
    </DashboardLayout>
  )
}
