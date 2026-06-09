import { BrowserRouter } from 'react-router-dom'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'

import AnimatedRoutes from './components/AnimatedRoutes'

import ProfilePromptModal from './components/ProfilePromptModal'
import RealtimeNotifications from './components/RealtimeNotifications'
import MaintenancePage from './pages/MaintenancePage'

import { useEffect } from 'react'
import { useDeviceOS } from './hooks/useDeviceOS'

function OSProvider({ children }) {
  const os = useDeviceOS()
  useEffect(() => {
    document.body.className = `os-${os}`
  }, [os])
  return children
}

function AppContent() {
  const { maintenance, maintenanceMessage, maintenanceLoading, isAdmin, loading, user } = useAuth()
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/update-password'].includes(window.location.pathname)

  if (maintenanceLoading || loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (maintenance && !isAdmin && !isAuthRoute) {
    return <MaintenancePage message={maintenanceMessage} user={user} />
  }

  return (
    <>
      <ProfilePromptModal />
      <RealtimeNotifications />
      <AnimatedRoutes />
    </>
  )
}

export default function App() {
  return (
    <BrowserRouter>
      <OSProvider>
      <AuthProvider>
        <CartProvider>
          <AppContent />
        </CartProvider>
      </AuthProvider>
      </OSProvider>
    </BrowserRouter>
  )
}
