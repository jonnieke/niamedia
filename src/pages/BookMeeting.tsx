import { useMemo } from 'react'
import { useSearchParams, Link } from 'react-router-dom'
import { CalendarDays, Clock3, Video, MessageSquare, Sparkles, ArrowRight, CheckCircle2, ShieldCheck } from 'lucide-react'
import '@calcom/atoms/globals.tw3.min.css'
import { BookerEmbed } from '@calcom/atoms'
import PublicHeader from '../components/layout/PublicHeader'
import { getCalBookingTarget, type BookingService } from '../lib/booking'

export default function BookMeeting() {
  const [searchParams] = useSearchParams()
  const serviceParam = searchParams.get('service')
  const priority = searchParams.get('priority')
  const service: BookingService = serviceParam === 'video' || serviceParam === 'campaign' || serviceParam === 'urgent'
    ? serviceParam
    : priority === 'urgent'
      ? 'urgent'
      : 'consultation'
  const calTarget = getCalBookingTarget(service)

  const copy = useMemo(() => {
    if (service === 'video') {
      return {
        eyebrow: 'Video briefing',
        title: 'Book a creative call for your video project',
        description: 'Tell us the length, format, voiceover preference, and deadline. We will confirm scope, estimate, and next steps on the call.',
        eventName: 'Video Briefing',
      }
    }
    if (service === 'campaign') {
      return {
        eyebrow: 'Campaign strategy',
        title: 'Book a strategy session with Nia',
        description: 'We will help shape the concept, channel mix, and deliverables before production starts.',
        eventName: 'Campaign Strategy',
      }
    }
    if (service === 'urgent') {
      return {
        eyebrow: 'Fast-track booking',
        title: 'Book a fast-track call with the Nia team',
        description: 'For same-day or rush briefs, skip ideation and jump straight into scope, timeline, and pricing.',
        eventName: 'Fast-Track Call',
      }
    }
    return {
      eyebrow: 'Nia consultation',
      title: 'Book a consultation with the Nia team',
      description: 'Skip the back-and-forth. Share your brief, deadline, and budget so we can advise quickly.',
      eventName: 'Consultation',
    }
  }, [service])

  const bookingReady = Boolean(calTarget)

  return (
    <div className="min-h-screen" style={{ background: 'radial-gradient(circle at top, #f5f3ff 0%, #eef2ff 32%, #f8fafc 100%)' }}>
      <PublicHeader />
      <main className="pt-24 px-4 pb-12">
        <div className="max-w-7xl mx-auto grid lg:grid-cols-[1.05fr_0.95fr] gap-8 items-start">
          <section>
            <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-widest mb-5" style={{ background: 'rgba(124,58,237,0.08)', color: '#7c3aed', border: '1px solid rgba(124,58,237,0.15)' }}>
              <Sparkles size={12} /> {copy.eyebrow}
            </div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-900 leading-tight max-w-2xl">{copy.title}</h1>
            <p className="mt-4 text-base md:text-lg text-gray-600 max-w-xl leading-relaxed">{copy.description}</p>
            <div className="mt-4 inline-flex items-center rounded-full border border-gray-200 bg-white px-3 py-1 text-xs font-semibold text-gray-600">
              Recommended Cal event name: <span className="ml-1 text-gray-900">{copy.eventName}</span>
            </div>

            <div className="mt-8 grid sm:grid-cols-2 gap-3 max-w-2xl">
              {[
                { icon: Video, title: 'Video scope', desc: 'Length, format, voiceover, add-ons, and rush timeline.' },
                { icon: MessageSquare, title: 'Consultation first', desc: service === 'urgent' ? 'Ideal for same-day, rush, or last-minute briefs.' : 'Ideal for urgent briefs or projects needing fast alignment.' },
                { icon: CalendarDays, title: 'Book a slot', desc: 'Choose a time that works for your team.' },
                { icon: ShieldCheck, title: 'No pressure', desc: 'We will only start once scope and pricing are clear.' },
              ].map(item => (
                <div key={item.title} className="rounded-2xl border border-white/80 bg-white/80 backdrop-blur p-4 shadow-sm">
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-3" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                    <item.icon size={18} className="text-white" />
                  </div>
                  <p className="text-sm font-bold text-gray-900">{item.title}</p>
                  <p className="text-xs text-gray-500 mt-1 leading-relaxed">{item.desc}</p>
                </div>
              ))}
            </div>

            <div className="mt-8 flex flex-wrap gap-3">
              <Link to="/request-video" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold text-white" style={{ background: 'linear-gradient(135deg, #7c3aed, #2563eb)' }}>
                Request a Video Commercial <ArrowRight size={14} />
              </Link>
              <Link to="/?assistant=1" className="inline-flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-semibold border border-gray-200 bg-white text-gray-700">
                Talk to Nia
              </Link>
            </div>

            <div className="mt-8 rounded-2xl border border-emerald-200 bg-emerald-50 p-4 max-w-2xl">
              <div className="flex items-start gap-3">
                <Clock3 size={16} className="text-emerald-600 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-emerald-900">Urgent projects</p>
                  <p className="text-sm text-emerald-800 mt-1 leading-relaxed">For launches, last-minute promos, and rush briefs, book here and mention the deadline. We will fast-track the scope discussion and tell you exactly what can be delivered.</p>
                </div>
              </div>
            </div>
          </section>

          <section className="rounded-3xl border border-gray-200 bg-white shadow-2xl overflow-hidden">
            <div className="px-5 py-4 border-b border-gray-100 bg-gradient-to-r from-purple-50 to-blue-50">
              <p className="text-xs font-bold uppercase tracking-widest text-purple-700">Nia booking desk</p>
              <p className="text-sm text-gray-600 mt-1">{bookingReady ? 'The Cal booking widget is embedded directly in your branded page.' : 'Set a public Cal.com event link such as https://cal.com/your-team/30min in VITE_CAL_BOOKING_URL or the service-specific booking env vars.'}</p>
            </div>
            <div className="aspect-[4/5] md:aspect-[3/4] lg:aspect-[4/5] bg-gray-50">
              {bookingReady && calTarget ? (
                <BookerEmbed
                  apiUrl="https://api.cal.com/v2"
                  username={calTarget.username}
                  eventSlug={calTarget.eventSlug}
                  isTeamEvent={false}
                />
              ) : (
                <div className="h-full flex items-center justify-center p-8 text-center">
                  <div className="max-w-sm">
                    <CheckCircle2 size={28} className="text-purple-500 mx-auto mb-3" />
                    <p className="text-lg font-bold text-gray-900">Booking page almost ready</p>
                    <p className="text-sm text-gray-500 mt-2 leading-relaxed">Add a public Cal.com event URL in <code className="px-1 py-0.5 rounded bg-gray-100">VITE_CAL_BOOKING_URL</code> or the service-specific booking env vars and this embedded scheduler will appear here with the Nia branding around it.</p>
                  </div>
                </div>
              )}
            </div>
          </section>
        </div>
      </main>
    </div>
  )
}


