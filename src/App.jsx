import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import ErrorBoundary from './components/ErrorBoundary'
import AnimatedRoutes from './components/AnimatedRoutes'

import ProfilePromptModal from './components/ProfilePromptModal'
import RealtimeNotifications from './components/RealtimeNotifications'
import MaintenancePage from './pages/MaintenancePage'

function AppContent() {
  const { maintenance, maintenanceMessage, maintenanceLoading, isAdmin, loading, user } = useAuth()
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/update-password'].includes(window.location.pathname)

  useEffect(() => {
    if (!loading && !maintenanceLoading) {
      const el = document.getElementById('splash-screen')
      if (el) {
        el.style.transition = 'opacity 0.5s ease'
        el.style.opacity = '0'
        setTimeout(() => el.remove(), 500)
      }
    }
  }, [loading, maintenanceLoading])

  if (maintenanceLoading || loading) {
    return (
      <div className="min-h-[100dvh] bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (maintenance && !isAdmin && !isAuthRoute) {
    return <MaintenancePage message={maintenanceMessage} user={user} />
  }

  return (
    <>
      <ErrorBoundary>
        <ProfilePromptModal />
        <RealtimeNotifications />
        <AnimatedRoutes />
      </ErrorBoundary>
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
    </BrowserRouter>
  )
}
