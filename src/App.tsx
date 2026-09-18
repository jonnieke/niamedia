import { Suspense, lazy, useEffect } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/AuthContext'
import RouteSeo from './components/RouteSeo'
import { initAnalytics, trackPageView } from './lib/analytics'

import Home from './pages/Home'
const Login = lazy(() => import('./pages/Login'))
const Register = lazy(() => import('./pages/Register'))
const Dashboard = lazy(() => import('./pages/Dashboard'))
const NewCampaign = lazy(() => import('./pages/NewCampaign'))
const CampaignResults = lazy(() => import('./pages/CampaignResults'))
const Campaigns = lazy(() => import('./pages/Campaigns'))
const IdeasBank = lazy(() => import('./pages/IdeasBank'))
const Leads = lazy(() => import('./pages/Leads'))
const Templates = lazy(() => import('./pages/Templates'))
const Pricing = lazy(() => import('./pages/Pricing'))
const PackageRequest = lazy(() => import('./pages/PackageRequest'))
const BrandKit = lazy(() => import('./pages/BrandKit'))
const Admin = lazy(() => import('./pages/Admin'))
const Settings = lazy(() => import('./pages/Settings'))
const ConceptStudio = lazy(() => import('./pages/ConceptStudio'))
const VideoJourney = lazy(() => import('./pages/VideoJourney'))
const PreProduction = lazy(() => import('./pages/PreProduction'))
const Projects = lazy(() => import('./pages/Projects'))
const AudioStudio = lazy(() => import('./pages/AudioStudio'))
const Assets = lazy(() => import('./pages/Assets'))
const Analytics = lazy(() => import('./pages/Analytics'))
const Onboarding = lazy(() => import('./pages/Onboarding'))
const Referral = lazy(() => import('./pages/Referral'))
const ForgotPassword = lazy(() => import('./pages/ForgotPassword'))
const ResetPassword = lazy(() => import('./pages/ResetPassword'))
const PaymentCallback = lazy(() => import('./pages/PaymentCallback'))
const AdminVoices = lazy(() => import('./pages/AdminVoices'))
const Terms = lazy(() => import('./pages/Terms'))
const Privacy = lazy(() => import('./pages/Privacy'))
const VideoRequest = lazy(() => import('./pages/VideoRequest'))
const BookMeeting = lazy(() => import('./pages/BookMeeting'))
const Requests = lazy(() => import('./pages/MyVideoRequests'))
const ShareTracker = lazy(() => import('./pages/ShareTracker'))
const ReviewPage = lazy(() => import('./pages/ReviewPage'))
const Billing = lazy(() => import('./pages/Billing'))
const Calendar = lazy(() => import('./pages/Calendar'))
const Team = lazy(() => import('./pages/Team'))
const AcceptInvite = lazy(() => import('./pages/AcceptInvite'))
const ReportView = lazy(() => import('./pages/ReportView'))
const WhatsAppInbox = lazy(() => import('./pages/WhatsAppInbox'))
const Portals = lazy(() => import('./pages/Portals'))
const PortalView = lazy(() => import('./pages/PortalView'))
const Invoices = lazy(() => import('./pages/Invoices'))
const VideoPipeline = lazy(() => import('./pages/VideoPipeline'))
const ROITracker = lazy(() => import('./pages/ROITracker'))
const Quote = lazy(() => import('./pages/Quote'))
const Proposals = lazy(() => import('./pages/Proposals'))
const ProposalView = lazy(() => import('./pages/ProposalView'))
const BriefView = lazy(() => import('./pages/BriefView'))
const Portfolio = lazy(() => import('./pages/Portfolio'))
const Production = lazy(() => import('./pages/Production'))
const DeliveryView = lazy(() => import('./pages/DeliveryView'))
const Retainers = lazy(() => import('./pages/Retainers'))
const AdminAnalytics = lazy(() => import('./pages/AdminAnalytics'))
const Survey = lazy(() => import('./pages/Survey'))

function RouteLoader() {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ background: '#f8fafc' }}>
      <div className="flex items-center gap-3 text-gray-500 text-sm">
        <Loader2 size={18} className="animate-spin" /> Loading workspace...
      </div>
    </div>
  )
}

function JoinRedirect() {
  const location = useLocation()
  return <Navigate to={`/register${location.search}`} replace />
}
function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading } = useAuth()
  const location = useLocation()
  if (loading) return <RouteLoader />
  if (isAuthenticated) return <>{children}</>
  const redirect = encodeURIComponent(`${location.pathname}${location.search}`)
  return <Navigate to={`/login?redirect=${redirect}`} replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth()
  if (loading) return <RouteLoader />
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AnalyticsTracker() {
  const location = useLocation()

  useEffect(() => {
    initAnalytics()
  }, [])

  useEffect(() => {
    trackPageView(`${location.pathname}${location.search}`)
  }, [location.pathname, location.search])

  return null
}
function AppRoutes() {
  return (
    <>
      <RouteSeo />
      <Suspense fallback={<RouteLoader />}>
        <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/package-request" element={<PackageRequest />} />
        <Route path="/book" element={<BookMeeting />} />
        <Route path="/join" element={<JoinRedirect />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/quote" element={<Quote />} />
        {/* /start folded into /quote — one public intake funnel */}
        <Route path="/start" element={<Navigate to="/quote" replace />} />
        <Route path="/proposal/:token" element={<ProposalView />} />
        <Route path="/brief/:token" element={<BriefView />} />
        <Route path="/portfolio" element={<Portfolio />} />
        <Route path="/delivery/:token" element={<DeliveryView />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/survey" element={<Survey />} />
        <Route path="/track/:token" element={<ShareTracker />} />
        <Route path="/review/:token" element={<ReviewPage />} />
        <Route path="/accept-invite/:token" element={<AcceptInvite />} />
        <Route path="/report/:token" element={<ReportView />} />
        <Route path="/portal/:token" element={<PortalView />} />

        <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/new-campaign" element={<ProtectedRoute><NewCampaign /></ProtectedRoute>} />
        <Route path="/campaign-results" element={<ProtectedRoute><CampaignResults /></ProtectedRoute>} />
        <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
        <Route path="/ideas" element={<ProtectedRoute><IdeasBank /></ProtectedRoute>} />
        <Route path="/leads" element={<ProtectedRoute><Leads /></ProtectedRoute>} />
        <Route path="/campaigns/:id" element={<ProtectedRoute><CampaignResults /></ProtectedRoute>} />
        <Route path="/concept-studio" element={<ProtectedRoute><ConceptStudio /></ProtectedRoute>} />
        <Route path="/video-journey" element={<ProtectedRoute><VideoJourney /></ProtectedRoute>} />
        <Route path="/preproduction" element={<ProtectedRoute><PreProduction /></ProtectedRoute>} />
        <Route path="/projects" element={<ProtectedRoute><Projects /></ProtectedRoute>} />
        <Route path="/projects/:id/review" element={<Navigate to="/projects" replace />} />
        <Route path="/audio-studio" element={<ProtectedRoute><AudioStudio /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
        <Route path="/brand-kit" element={<ProtectedRoute><BrandKit /></ProtectedRoute>} />
        <Route path="/request-video" element={<ProtectedRoute><VideoRequest /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/my-requests" element={<Navigate to="/requests" replace />} />
        <Route path="/billing" element={<ProtectedRoute><Billing /></ProtectedRoute>} />
        <Route path="/calendar" element={<ProtectedRoute><Calendar /></ProtectedRoute>} />
        <Route path="/team" element={<ProtectedRoute><Team /></ProtectedRoute>} />
        <Route path="/inbox" element={<ProtectedRoute><WhatsAppInbox /></ProtectedRoute>} />
        <Route path="/portals" element={<ProtectedRoute><Portals /></ProtectedRoute>} />
        <Route path="/invoices" element={<ProtectedRoute><Invoices /></ProtectedRoute>} />
        <Route path="/video-pipeline" element={<ProtectedRoute><VideoPipeline /></ProtectedRoute>} />
        <Route path="/roi-tracker" element={<ProtectedRoute><ROITracker /></ProtectedRoute>} />
        <Route path="/proposals" element={<ProtectedRoute><Proposals /></ProtectedRoute>} />
        <Route path="/production" element={<ProtectedRoute><Production /></ProtectedRoute>} />
        <Route path="/retainers" element={<ProtectedRoute><Retainers /></ProtectedRoute>} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/voices" element={<ProtectedRoute><AdminRoute><AdminVoices /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/analytics" element={<ProtectedRoute><AdminRoute><AdminAnalytics /></AdminRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </Suspense>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AnalyticsTracker />
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
