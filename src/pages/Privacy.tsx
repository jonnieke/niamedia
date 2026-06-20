import { Link } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader'

export default function Privacy() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a14' }}>
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Privacy Policy</h1>
          <p className="text-sm text-gray-500">Last updated: June 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Who We Are</h2>
            <p>Nia Media ("we", "us", "our") operates niamedia.co.ke, a creative production platform serving businesses across Kenya and East Africa. This policy explains how we collect, use, and protect your personal information.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Information We Collect</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-gray-300">Account data:</strong> name, email address, phone number, and business name provided at registration.</li>
              <li><strong className="text-gray-300">Order data:</strong> campaign briefs, uploaded files, script content, and payment references.</li>
              <li><strong className="text-gray-300">Payment data:</strong> transaction IDs and payment status from PesaPal. We do not store card numbers or M-Pesa PINs.</li>
              <li><strong className="text-gray-300">Usage data:</strong> pages visited, features used, and session duration to improve the platform.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. How We Use Your Information</h2>
            <ul className="space-y-2 list-disc list-inside">
              <li>Deliver and manage your orders and campaign assets.</li>
              <li>Process payments and send order confirmations.</li>
              <li>Send transactional emails (order updates, delivery notifications).</li>
              <li>Improve our AI models and platform features using anonymised usage data.</li>
              <li>Send occasional product updates — you can unsubscribe at any time.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Data Sharing</h2>
            <p className="mb-2">We do not sell your personal data. We share information only with:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li><strong className="text-gray-300">PesaPal</strong> — to process payments securely.</li>
              <li><strong className="text-gray-300">ElevenLabs</strong> — to generate voice audio for your orders (script text only).</li>
              <li><strong className="text-gray-300">Anthropic</strong> — to generate AI copy and scripts (brief content only).</li>
              <li><strong className="text-gray-300">Supabase</strong> — our database and file storage provider, hosted in the EU.</li>
            </ul>
            <p className="mt-2">All third-party providers are bound by data processing agreements and handle data only to fulfil your order.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Data Retention</h2>
            <p>We retain account and order data for 3 years after your last activity, or as required by Kenyan tax law. You may request earlier deletion by contacting us — see Section 8.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Cookies</h2>
            <p>We use essential session cookies to keep you logged in. We do not use advertising or third-party tracking cookies.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. Security</h2>
            <p>All data is encrypted in transit (TLS) and at rest. Access to production data is restricted to authorised personnel. We follow industry best practices for web application security.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Your Rights</h2>
            <p className="mb-2">You have the right to:</p>
            <ul className="space-y-2 list-disc list-inside">
              <li>Access the personal data we hold about you.</li>
              <li>Request correction of inaccurate data.</li>
              <li>Request deletion of your account and associated data.</li>
              <li>Opt out of marketing communications at any time.</li>
            </ul>
            <p className="mt-2">To exercise any of these rights, email <a href="mailto:hello@niamedia.co.ke" className="text-purple-400 hover:text-purple-300">hello@niamedia.co.ke</a>. We will respond within 14 days.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Children's Privacy</h2>
            <p>Our services are not directed at children under 18. We do not knowingly collect personal data from minors.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Changes to This Policy</h2>
            <p>We may update this policy periodically. Material changes will be communicated by email and by updating the date at the top of this page.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Contact</h2>
            <p>Privacy concerns or requests: <a href="mailto:hello@niamedia.co.ke" className="text-purple-400 hover:text-purple-300">hello@niamedia.co.ke</a></p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-6 text-xs text-gray-600">
          <Link to="/terms" className="hover:text-gray-400 transition-colors">Terms of Service</Link>
          <Link to="/" className="hover:text-gray-400 transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
