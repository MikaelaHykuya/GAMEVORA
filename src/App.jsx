import { useEffect } from 'react'
import { BrowserRouter, useLocation } from 'react-router-dom'
import { HelmetProvider } from 'react-helmet-async'
import { AuthProvider, useAuth } from './contexts/AuthContext'
import { CartProvider } from './contexts/CartContext'
import { WishlistProvider } from './contexts/WishlistContext'
import { ToastProvider } from './contexts/ToastContext'
import { BgmProvider } from './contexts/BgmContext'
import { FriendsProvider } from './contexts/FriendsContext'
import { WalletProvider } from './contexts/WalletContext'

import ErrorBoundary from './components/ErrorBoundary'
import AnimatedRoutes from './components/AnimatedRoutes'

import ProfilePromptModal from './components/ProfilePromptModal'
import RealtimeNotifications from './components/RealtimeNotifications'
import CustomCursor from './components/CustomCursor'
import KeyboardShortcuts from './components/KeyboardShortcuts'
import SeasonalTheme from './components/SeasonalTheme'
import RevealObserver from './components/RevealObserver'
import MaintenancePage from './pages/MaintenancePage'

function AppContent() {
  const location = useLocation()
  const { maintenance, maintenanceMessage, maintenanceLoading, isAdmin, loading, user } = useAuth()
  const isAuthRoute = ['/login', '/register', '/forgot-password', '/update-password'].includes(location.pathname)

  useEffect(() => {
    const el = document.getElementById('splash-screen')
    if (el) {
      el.style.transition = 'opacity 0.3s ease'
      el.style.opacity = '0'
      setTimeout(() => el.remove(), 300)
    }
  }, [])

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
      <CustomCursor />
      <KeyboardShortcuts />
      <SeasonalTheme />
      <RevealObserver />
      <ErrorBoundary key={location.key}>
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
      <HelmetProvider>
        <AuthProvider>
          <ToastProvider>
            <CartProvider>
              <WishlistProvider>
                <FriendsProvider>
                  <WalletProvider>
                    <BgmProvider>
                      <AppContent />
                    </BgmProvider>
                  </WalletProvider>
                </FriendsProvider>
              </WishlistProvider>
            </CartProvider>
          </ToastProvider>
        </AuthProvider>
      </HelmetProvider>
    </BrowserRouter>
  )
}
