import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './lib/AuthContext'
import Home from './pages/Home'
import Login from './pages/Login'
import Register from './pages/Register'
import Dashboard from './pages/Dashboard'
import NewCampaign from './pages/NewCampaign'
import CampaignResults from './pages/CampaignResults'
import Campaigns from './pages/Campaigns'
import Templates from './pages/Templates'
import Pricing from './pages/Pricing'
import PackageRequest from './pages/PackageRequest'
import BrandKit from './pages/BrandKit'
import Admin from './pages/Admin'
import Settings from './pages/Settings'
import ConceptStudio from './pages/ConceptStudio'
import VideoJourney from './pages/VideoJourney'
import PreProduction from './pages/PreProduction'
import Projects from './pages/Projects'
import ProjectReview from './pages/ProjectReview'
import AudioStudio from './pages/AudioStudio'
import Assets from './pages/Assets'
import Analytics from './pages/Analytics'
import Onboarding from './pages/Onboarding'
import Referral from './pages/Referral'
import ForgotPassword from './pages/ForgotPassword'
import ResetPassword from './pages/ResetPassword'
import PaymentCallback from './pages/PaymentCallback'
import AdminVoices from './pages/AdminVoices'
import Terms from './pages/Terms'
import Privacy from './pages/Privacy'
import VideoRequest from './pages/VideoRequest'

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
    <Routes>
      <Route path="/" element={<Home />} />
      <Route path="/login" element={<Login />} />
      <Route path="/register" element={<Register />} />
      <Route path="/templates" element={<Templates />} />
      <Route path="/pricing" element={<Pricing />} />
      <Route path="/package-request" element={<PackageRequest />} />
      <Route path="/forgot-password" element={<ForgotPassword />} />
      <Route path="/reset-password" element={<ResetPassword />} />
      <Route path="/payment/callback" element={<PaymentCallback />} />
      <Route path="/terms" element={<Terms />} />
      <Route path="/privacy" element={<Privacy />} />

      <Route path="/onboarding" element={<ProtectedRoute><Onboarding /></ProtectedRoute>} />
      <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
      <Route path="/new-campaign" element={<ProtectedRoute><NewCampaign /></ProtectedRoute>} />
      <Route path="/campaign-results" element={<ProtectedRoute><CampaignResults /></ProtectedRoute>} />
      <Route path="/campaigns" element={<ProtectedRoute><Campaigns /></ProtectedRoute>} />
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
      <Route path="/settings" element={<ProtectedRoute><Settings /></ProtectedRoute>} />
      <Route path="/admin" element={<ProtectedRoute><AdminRoute><Admin /></AdminRoute></ProtectedRoute>} />
      <Route path="/admin/voices" element={<ProtectedRoute><AdminRoute><AdminVoices /></AdminRoute></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
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

