import { Suspense, lazy } from 'react'
import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import { AuthProvider, useAuth } from './lib/AuthContext'

const Home = lazy(() => import('./pages/Home'))
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
const ProjectReview = lazy(() => import('./pages/ProjectReview'))
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
const Requests = lazy(() => import('./pages/MyVideoRequests'))
const ShareTracker = lazy(() => import('./pages/ShareTracker'))

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
  const { isAuthenticated } = useAuth()
  return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user } = useAuth()
  return user?.role === 'admin' ? <>{children}</> : <Navigate to="/dashboard" replace />
}

function AppRoutes() {
  return (
    <Suspense fallback={<RouteLoader />}>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<Login />} />
        <Route path="/register" element={<Register />} />
        <Route path="/templates" element={<Templates />} />
        <Route path="/pricing" element={<Pricing />} />
        <Route path="/package-request" element={<PackageRequest />} />
        <Route path="/join" element={<JoinRedirect />} />
        <Route path="/forgot-password" element={<ForgotPassword />} />
        <Route path="/reset-password" element={<ResetPassword />} />
        <Route path="/payment/callback" element={<PaymentCallback />} />
        <Route path="/terms" element={<Terms />} />
        <Route path="/privacy" element={<Privacy />} />
        <Route path="/track/:token" element={<ShareTracker />} />

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
        <Route path="/projects/:id/review" element={<ProtectedRoute><ProjectReview /></ProtectedRoute>} />
        <Route path="/audio-studio" element={<ProtectedRoute><AudioStudio /></ProtectedRoute>} />
        <Route path="/assets" element={<ProtectedRoute><Assets /></ProtectedRoute>} />
        <Route path="/analytics" element={<ProtectedRoute><Analytics /></ProtectedRoute>} />
        <Route path="/referral" element={<ProtectedRoute><Referral /></ProtectedRoute>} />
        <Route path="/brand-kit" element={<ProtectedRoute><BrandKit /></ProtectedRoute>} />
        <Route path="/request-video" element={<ProtectedRoute><VideoRequest /></ProtectedRoute>} />
        <Route path="/requests" element={<ProtectedRoute><Requests /></ProtectedRoute>} />
        <Route path="/my-requests" element={<Navigate to="/requests" replace />} />
        <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
        <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
        <Route path="/admin/voices" element={<ProtectedRoute><AdminRoute><AdminVoices /></AdminRoute></ProtectedRoute>} />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  )
}

export default function App() {
  return (
    <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
      <AuthProvider>
        <AppRoutes />
      </AuthProvider>
    </BrowserRouter>
  )
}
