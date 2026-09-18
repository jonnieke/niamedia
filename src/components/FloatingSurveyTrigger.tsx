import { useState } from 'react'
import { Star } from 'lucide-react'
import MarketSurveyModal from './MarketSurveyModal'

export default function FloatingSurveyTrigger() {
  const [open, setOpen] = useState(false)

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="fixed bottom-6 left-4 sm:left-6 z-40 flex items-center gap-2 px-3.5 py-2.5 rounded-full text-xs font-bold text-gray-900 bg-white shadow-xl border border-purple-200 hover:border-purple-400 hover:bg-purple-50 transition-all group active:scale-95"
        style={{ boxShadow: '0 8px 30px rgba(124,58,237,0.18)' }}
        title="Help us identify market gaps & rate your experience"
      >
        <span className="flex text-amber-400 group-hover:scale-110 transition-transform">
          <Star size={14} className="fill-amber-400 text-amber-400" />
        </span>
        <span className="font-extrabold text-purple-900 hidden sm:inline">Rate & Shape Nia</span>
        <span className="font-extrabold text-purple-900 sm:hidden">Survey</span>
      </button>

      <MarketSurveyModal isOpen={open} onClose={() => setOpen(false)} sourcePage="floating_trigger" />
    </>
  )
}
