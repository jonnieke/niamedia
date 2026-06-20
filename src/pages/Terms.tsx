import { Link } from 'react-router-dom'
import PublicHeader from '../components/layout/PublicHeader'

export default function Terms() {
  return (
    <div className="min-h-screen" style={{ background: '#0a0a14' }}>
      <PublicHeader />
      <div className="max-w-3xl mx-auto px-6 py-16">
        <div className="mb-10">
          <p className="text-xs font-semibold text-purple-400 uppercase tracking-widest mb-2">Legal</p>
          <h1 className="text-3xl font-bold text-white mb-3">Terms of Service</h1>
          <p className="text-sm text-gray-500">Last updated: June 2026</p>
        </div>

        <div className="space-y-8 text-sm text-gray-400 leading-relaxed">
          <section>
            <h2 className="text-base font-semibold text-white mb-3">1. Acceptance of Terms</h2>
            <p>By accessing or using Nia Media ("we", "us", "our") and any services offered through niamedia.co.ke, you agree to be bound by these Terms of Service. If you do not agree, please do not use our services.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">2. Services</h2>
            <p>Nia Media provides AI-assisted campaign copy, video production coordination, and audio studio services including voice overs, jingles, and radio spots. All services are subject to availability, package terms, and agreed deliverable timelines.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">3. Orders & Payment</h2>
            <p className="mb-2">All orders are processed through our secure checkout powered by PesaPal. Payment is due in full before production begins. Rush orders (24-hour delivery) attract an additional fee as stated at checkout.</p>
            <p>Prices are quoted in Kenyan Shillings (KES) inclusive of applicable taxes unless otherwise stated.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">4. Revisions & Deliverables</h2>
            <p>Each package includes a stated number of revision rounds. Revisions beyond the included rounds will be quoted separately. Final files are delivered in the formats specified in your package. Nia Media retains the right to use completed work in its portfolio unless you request otherwise in writing.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">5. Intellectual Property</h2>
            <p>Upon full payment, you own the final creative output produced for your campaign. AI-generated elements (scripts, copy, briefs) may incorporate non-exclusive material. You grant Nia Media a non-exclusive licence to display the completed work for promotional purposes.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">6. Refunds & Cancellations</h2>
            <p className="mb-2">Cancellations requested before production begins are eligible for a full refund. Once production has started, refunds are assessed on a case-by-case basis based on work completed. Rush orders are non-refundable once work commences.</p>
            <p>To request a cancellation or refund, contact us at <a href="mailto:hello@niamedia.co.ke" className="text-purple-400 hover:text-purple-300">hello@niamedia.co.ke</a>.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">7. User Accounts</h2>
            <p>You are responsible for maintaining the confidentiality of your account credentials. Notify us immediately if you suspect unauthorised access. We reserve the right to suspend accounts that violate these terms or engage in fraudulent activity.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">8. Prohibited Use</h2>
            <p>You may not use our services to produce content that is defamatory, fraudulent, infringing on third-party intellectual property, or otherwise unlawful under Kenyan law.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">9. Limitation of Liability</h2>
            <p>To the maximum extent permitted by law, Nia Media's liability for any claim arising from our services is limited to the amount paid for the specific order in dispute. We are not liable for indirect, incidental, or consequential damages.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">10. Governing Law</h2>
            <p>These terms are governed by the laws of Kenya. Any disputes shall be resolved through the courts of Nairobi, Kenya.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">11. Changes to Terms</h2>
            <p>We may update these terms from time to time. Continued use of our services after changes constitutes acceptance of the revised terms. Material changes will be communicated via email.</p>
          </section>

          <section>
            <h2 className="text-base font-semibold text-white mb-3">12. Contact</h2>
            <p>Questions about these terms? Reach us at <a href="mailto:hello@niamedia.co.ke" className="text-purple-400 hover:text-purple-300">hello@niamedia.co.ke</a> or through our website.</p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-white/8 flex gap-6 text-xs text-gray-600">
          <Link to="/privacy" className="hover:text-gray-400 transition-colors">Privacy Policy</Link>
          <Link to="/" className="hover:text-gray-400 transition-colors">← Back to Home</Link>
        </div>
      </div>
    </div>
  )
}
