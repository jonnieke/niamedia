import { useState } from 'react'
import { X, Printer, Check, Copy, Film, ShieldCheck } from 'lucide-react'

export interface QuotationData {
  quoteId?: string
  businessName: string
  contactName?: string
  phone?: string
  email?: string
  videoLength: string
  platforms?: string[] | string
  deliverySpeed?: string
  visualStyle?: string
  standardPrice: number
  depositAmount: number
  balanceAmount: number
  isPaid?: boolean
  mpesaRef?: string
  createdAt?: string
}

interface QuotationPrintModalProps {
  isOpen: boolean
  onClose: () => void
  data: QuotationData | null
}

export default function QuotationPrintModal({ isOpen, onClose, data }: QuotationPrintModalProps) {
  const [copied, setCopied] = useState(false)

  if (!isOpen || !data) return null

  const platformsList = Array.isArray(data.platforms)
    ? data.platforms.join(', ')
    : data.platforms || 'Instagram, TikTok, WhatsApp'

  const deliveryLabel = data.deliverySpeed === 'rush_24' || data.deliverySpeed === '24h'
    ? '24-Hour Rush (+50%)'
    : data.deliverySpeed === 'rush_48' || data.deliverySpeed === '48h'
    ? '48-Hour Rush (+25%)'
    : 'Standard (3–5 Business Days)'

  const formattedDate = data.createdAt
    ? new Date(data.createdAt).toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })
    : new Date().toLocaleDateString('en-KE', { day: 'numeric', month: 'short', year: 'numeric' })

  const copyWhatsAppText = () => {
    const text = `*OFFICIAL QUOTATION — NIA MEDIA*\n` +
      `📌 *Client:* ${data.businessName} (${data.contactName || 'Valued Client'})\n` +
      `⏱ *Specification:* ${data.videoLength} Commercial Video\n` +
      `📱 *Platforms:* ${platformsList}\n` +
      `⚡ *Timeline:* ${deliveryLabel}\n\n` +
      `💰 *Standard Package Price:* KES ${data.standardPrice.toLocaleString()}\n` +
      `🔒 *70% Milestone Deposit:* KES ${data.depositAmount.toLocaleString()}\n` +
      `✅ *30% Balance on Delivery:* KES ${data.balanceAmount.toLocaleString()}\n\n` +
      `*Included Deliverables:*\n` +
      `✔ ${data.videoLength} Commercial Video (${data.visualStyle || 'Live-Action / 2D / 3D / AI'})\n` +
      `✔ Matching branded promotional poster for WhatsApp & social feeds\n` +
      `✔ Professional Kenyan or Global human studio voiceover & mastering\n` +
      `✔ 2 free revision rounds\n` +
      `✔ 100% full commercial broadcast rights\n\n` +
      `View quotation online or pay deposit: https://niamedia.co.ke/quote`

    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2500)
    })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm overflow-y-auto">
      {/* Modal Dialog */}
      <div className="bg-white rounded-2xl w-full max-w-2xl shadow-2xl border border-gray-200 overflow-hidden my-auto animate-in fade-in zoom-in-95 duration-150">
        
        {/* Actions Bar (Hidden in Print) */}
        <div className="print:hidden flex items-center justify-between px-6 py-3.5 border-b border-gray-100 bg-gray-50/80">
          <div className="flex items-center gap-2">
            <Film size={18} className="text-purple-600" />
            <span className="text-xs font-bold text-gray-700 uppercase tracking-wider">
              {data.isPaid ? 'Payment Receipt & Specification' : 'Official Project Quotation'}
            </span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={copyWhatsAppText}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-gray-700 bg-white border border-gray-200 hover:bg-gray-50 transition-all shadow-sm cursor-pointer"
              title="Copy formatted quotation for WhatsApp"
            >
              {copied ? <Check size={13} className="text-emerald-600" /> : <Copy size={13} />}
              <span>{copied ? 'Copied!' : 'Copy for WhatsApp'}</span>
            </button>

            <button
              onClick={() => window.print()}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white transition-all shadow-sm cursor-pointer"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}
              title="Print quotation or save as PDF"
            >
              <Printer size={13} />
              <span>Print / PDF</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors ml-1 cursor-pointer"
            >
              <X size={18} />
            </button>
          </div>
        </div>

        {/* Printable Document Body */}
        <div id="quotation-document" className="p-8 sm:p-10 text-gray-900 text-sm">
          
          {/* Document Header */}
          <div className="flex justify-between items-start pb-6 border-b border-gray-200 mb-6">
            <div>
              <h1 className="text-2xl font-black text-gray-950 tracking-tight flex items-center gap-2">
                <span style={{ color: '#7c3aed' }}>Nia</span> Media
              </h1>
              <p className="text-xs text-gray-500 font-medium mt-0.5">High-Converting Commercial Video Production</p>
              <p className="text-[11px] text-gray-400 mt-2 leading-relaxed">
                Nairobi, Kenya · +254 751 822 556<br />
                hello@niamedia.co.ke · niamedia.co.ke
              </p>
            </div>

            <div className="text-right">
              <span className={`inline-block px-3 py-1 rounded-full text-[10px] font-extrabold uppercase tracking-wider mb-2 ${
                data.isPaid ? 'bg-emerald-100 text-emerald-800 border border-emerald-300' : 'bg-purple-100 text-purple-800 border border-purple-200'
              }`}>
                {data.isPaid ? 'Deposit Confirmed' : 'Official Quotation'}
              </span>
              <p className="text-xs text-gray-400 uppercase tracking-wider">Reference</p>
              <p className="text-sm font-mono font-bold text-gray-800">#{data.quoteId?.slice(0, 8).toUpperCase() || 'NIA-QUOTE'}</p>
              <p className="text-xs text-gray-500 mt-1">Date: {formattedDate}</p>
            </div>
          </div>

          {/* Client & Project Details */}
          <div className="grid grid-cols-2 gap-4 p-4 rounded-xl bg-gray-50/80 border border-gray-100 mb-6 text-xs">
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Prepared For</p>
              <p className="font-bold text-gray-900 text-sm">{data.businessName}</p>
              {data.contactName && <p className="text-gray-600 font-medium">{data.contactName}</p>}
              {data.phone && <p className="text-gray-500">{data.phone}</p>}
              {data.email && <p className="text-gray-500">{data.email}</p>}
            </div>
            <div>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-1">Project Specification</p>
              <p className="font-semibold text-gray-800">Format: <span className="font-bold text-purple-700">{data.videoLength} Commercial</span></p>
              <p className="text-gray-600">Target Platforms: {platformsList}</p>
              <p className="text-gray-600">Turnaround: {deliveryLabel}</p>
              {data.visualStyle && <p className="text-gray-600">Style: <span className="font-semibold text-gray-800">{data.visualStyle}</span></p>}
            </div>
          </div>

          {/* Scope & Deliverables Table */}
          <table className="w-full mb-6 text-xs border-collapse">
            <thead>
              <tr className="border-b-2 border-gray-200 text-gray-500 text-[10px] uppercase font-bold tracking-wider">
                <th className="text-left py-2.5">Scope / Deliverable Description</th>
                <th className="text-right py-2.5">Revision Rounds</th>
                <th className="text-right py-2.5">Commercial Rights</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              <tr>
                <td className="py-2.5 font-medium text-gray-900">
                  {data.videoLength} High-Impact Video Commercial
                  <span className="block text-[10px] text-gray-500 mt-0.5">Custom AI scenes, motion graphics, audio sync, sound design</span>
                </td>
                <td className="py-2.5 text-right text-gray-600">2 Included</td>
                <td className="py-2.5 text-right text-emerald-600 font-semibold">100% Exclusive</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-gray-900">
                  Audio Production & Voiceover
                  <span className="block text-[10px] text-gray-500 mt-0.5">Professional voiceover narration & commercial soundtrack</span>
                </td>
                <td className="py-2.5 text-right text-gray-600">Included</td>
                <td className="py-2.5 text-right text-emerald-600 font-semibold">Licensed</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-gray-900">
                  Multi-Platform Optimisation
                  <span className="block text-[10px] text-gray-500 mt-0.5">Sized & encoded for {platformsList}</span>
                </td>
                <td className="py-2.5 text-right text-gray-600">Included</td>
                <td className="py-2.5 text-right text-emerald-600 font-semibold">Full 4K / HD</td>
              </tr>
              <tr>
                <td className="py-2.5 font-medium text-gray-900">
                  Matching Branded Promotional Poster
                  <span className="block text-[10px] text-gray-500 mt-0.5">High-resolution graphic flyer for WhatsApp broadcast & social feed</span>
                </td>
                <td className="py-2.5 text-right text-gray-600">Included</td>
                <td className="py-2.5 text-right text-emerald-600 font-semibold">100% Commercial</td>
              </tr>
            </tbody>
          </table>

          {/* Financial Breakdown (Standard Price + 70% Deposit / 30% Balance) */}
          <div className="border-t border-gray-200 pt-4 flex justify-end mb-6">
            <div className="w-full sm:w-72 space-y-2 text-xs">
              <div className="flex justify-between text-gray-600">
                <span>Standard Package Price:</span>
                <span className="font-semibold text-gray-900">KES {data.standardPrice.toLocaleString()}</span>
              </div>
              <div className="flex justify-between items-center text-emerald-700 bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
                <span className="font-bold">70% Deposit to Start:</span>
                <span className="font-extrabold text-sm">KES {data.depositAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-gray-500 px-2.5">
                <span>30% Balance on Delivery:</span>
                <span className="font-semibold text-gray-700">KES {data.balanceAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Payment Status & Security Badge */}
          {data.isPaid ? (
            <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200 flex items-start gap-3 mb-6">
              <ShieldCheck size={20} className="text-emerald-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-emerald-950">70% Milestone Deposit Received</p>
                <p className="text-[11px] text-emerald-800 leading-relaxed mt-0.5">
                  Your creative production slot is secured. The 30% balance (KES {data.balanceAmount.toLocaleString()}) is only payable after you review and approve the watermarked video preview.
                </p>
                {data.mpesaRef && (
                  <p className="text-[10px] font-mono text-emerald-700 mt-1">Payment Ref: {data.mpesaRef}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="p-4 rounded-xl bg-purple-50 border border-purple-200 flex items-start gap-3 mb-6">
              <ShieldCheck size={20} className="text-purple-600 shrink-0 mt-0.5" />
              <div>
                <p className="text-xs font-bold text-purple-950">Milestone Protection Terms</p>
                <p className="text-[11px] text-purple-900 leading-relaxed mt-0.5">
                  70% deposit reserves your production schedule and creative team. The remaining 30% is payable only upon your approval of the preview cut. Payments accepted via M-Pesa, Visa, or Mastercard through PesaPal.
                </p>
              </div>
            </div>
          )}

          {/* Footer Note */}
          <div className="border-t border-gray-100 pt-4 flex flex-col sm:flex-row items-center justify-between text-[11px] text-gray-400 gap-2">
            <p>Thank you for choosing Nia Media · Quality Guaranteed</p>
            <p className="font-mono">Valid for 14 days from issue</p>
          </div>
        </div>

      </div>
    </div>
  )
}
