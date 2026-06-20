import { useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import { useAuth } from './context/AuthContext'
import Navbar from './components/Navbar'
import LandingPage from './pages/LandingPage'
import SearchResultsPage from './pages/SearchResultsPage'
import BookingPage from './pages/BookingPage'
import PaymentSuccessPage from './pages/PaymentSuccessPage'
import PaymentFailurePage from './pages/PaymentFailurePage'
import LoginPage from './pages/LoginPage'
import RegisterPage from './pages/RegisterPage'
import DashboardPage from './pages/DashboardPage'
import AdminPage from './pages/AdminPage'
import ForgotPasswordPage from './pages/ForgotPasswordPage'
import ResetPasswordPage from './pages/ResetPasswordPage'
import VerifyEmailPage from './pages/VerifyEmailPage'
import DocPage from './pages/DocPage'
import StartupLoader from './components/StartupLoader'

function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  return isAuthenticated ? children : <Navigate to="/login" replace />
}

function AdminRoute({ children }) {
  const { isAdmin, isAuthenticated, loading } = useAuth()
  if (loading) return <LoadingScreen />
  if (!isAuthenticated) return <Navigate to="/login" replace />
  if (!isAdmin) return <Navigate to="/" replace />
  return children
}

function LoadingScreen() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-primary-600 border-t-transparent rounded-full animate-spin" />
        <p className="text-gray-400 text-sm">Loading Tripline...</p>
      </div>
    </div>
  )
}

export default function App() {
  const [isAppReady, setIsAppReady] = useState(false)

  return (
    <div className="min-h-screen relative">
      {!isAppReady && <StartupLoader onComplete={() => setIsAppReady(true)} />}
      
      <div className={`transition-opacity duration-1000 ${isAppReady ? 'opacity-100' : 'opacity-0'}`}>
        <Navbar />
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/search" element={<SearchResultsPage />} />
        <Route path="/login" element={<LoginPage />} />
        <Route path="/register" element={<RegisterPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/verify-email" element={<VerifyEmailPage />} />
        <Route path="/booking" element={
          <ProtectedRoute><BookingPage /></ProtectedRoute>
        } />
        <Route path="/booking-confirmation" element={
          <ProtectedRoute><PaymentSuccessPage /></ProtectedRoute>
        } />
        <Route path="/payment-cancelled" element={
          <ProtectedRoute><PaymentFailurePage /></ProtectedRoute>
        } />
        <Route path="/dashboard" element={
          <ProtectedRoute><DashboardPage /></ProtectedRoute>
        } />
        <Route path="/admin" element={
          <AdminRoute><AdminPage /></AdminRoute>
        } />
        
        {/* Documentation Pages from Footer */}
        <Route path="/about" element={<DocPage />} />
        <Route path="/team" element={<DocPage />} />
        <Route path="/careers" element={<DocPage />} />
        <Route path="/blog" element={<DocPage />} />
        <Route path="/press" element={<DocPage />} />
        <Route path="/help" element={<DocPage />} />
        <Route path="/cancellation" element={<DocPage />} />
        <Route path="/refund" element={<DocPage />} />
        <Route path="/contact" element={<DocPage />} />
        <Route path="/chat" element={<DocPage />} />
        <Route path="/terms" element={<DocPage />} />
        <Route path="/privacy" element={<DocPage />} />
        <Route path="/cookies" element={<DocPage />} />
        <Route path="/disclaimer" element={<DocPage />} />
        <Route path="/accessibility" element={<DocPage />} />

        <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </div>
    </div>
  )
}
