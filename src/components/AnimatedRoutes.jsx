import { lazy, Suspense, useEffect } from 'react'
import { Routes, Route, useLocation } from 'react-router-dom'
import { AnimatePresence, motion } from 'framer-motion'

const Home = lazy(() => import('../pages/Home'))
const Store = lazy(() => import('../pages/Store'))
const Login = lazy(() => import('../pages/Login'))
const Register = lazy(() => import('../pages/Register'))
const ForgotPassword = lazy(() => import('../pages/ForgotPassword'))
const UpdatePassword = lazy(() => import('../pages/UpdatePassword'))
const Dashboard = lazy(() => import('../pages/Dashboard'))
const Detail = lazy(() => import('../pages/Detail'))
const ProfileOverview = lazy(() => import('../pages/ProfileOverview'))
const ProfileCollection = lazy(() => import('../pages/ProfileCollection'))
const ProfileWishlist = lazy(() => import('../pages/ProfileWishlist'))
const ProfileOrders = lazy(() => import('../pages/ProfileOrders'))
const ProfileSettings = lazy(() => import('../pages/ProfileSettings'))
const Friends = lazy(() => import('../pages/Friends'))
const BgmPlaylist = lazy(() => import('../pages/BgmPlaylist'))
const FAQ = lazy(() => import('../pages/FAQ'))
const Request = lazy(() => import('../pages/Request'))
const Admin = lazy(() => import('../pages/Admin'))
const Giveaways = lazy(() => import('../pages/Giveaways'))
const ConfirmEmail = lazy(() => import('../pages/ConfirmEmail'))
const Affiliate = lazy(() => import('../pages/Affiliate'))
const AffiliateBenefits = lazy(() => import('../pages/AffiliateBenefits'))
const AffiliateApply = lazy(() => import('../pages/AffiliateApply'))
const RefundRequest = lazy(() => import('../pages/RefundRequest'))
const Wallet = lazy(() => import('../pages/Wallet'))
const NotFound = lazy(() => import('../pages/NotFound'))

function PageSkeleton() {
  return (
    <div className="min-h-screen bg-[#030303] flex items-center justify-center">
      <div className="flex flex-col items-center gap-4">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
        <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest animate-pulse">Loading Vault...</p>
      </div>
    </div>
  )
}

export default function AnimatedRoutes() {
  const location = useLocation()

  useEffect(() => {
    window.scrollTo(0, 0)
  }, [location.pathname])

  return (
    <AnimatePresence mode="wait">
      <motion.div
        key={location.pathname}
        initial={{ opacity: 0, y: 15 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: -15 }}
        transition={{ duration: 0.3, ease: 'easeOut' }}
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
      >
        <Suspense fallback={<PageSkeleton />}>
          <Routes location={location}>
            <Route path="/" element={<Home />} />
            <Route path="/store" element={<Store />} />
            <Route path="/login" element={<Login />} />
            <Route path="/register" element={<Register />} />
            <Route path="/forgot-password" element={<ForgotPassword />} />
            <Route path="/update-password" element={<UpdatePassword />} />
            <Route path="/dashboard" element={<Dashboard />} />
            <Route path="/detail/:id" element={<Detail />} />
            <Route path="/profile" element={<ProfileOverview />} />
            <Route path="/profile/collection" element={<ProfileCollection />} />
            <Route path="/profile/wishlist" element={<ProfileWishlist />} />
            <Route path="/profile/orders" element={<ProfileOrders />} />
            <Route path="/profile/orders/refund/:id" element={<RefundRequest />} />
            <Route path="/profile/settings" element={<ProfileSettings />} />
            <Route path="/friends" element={<Friends />} />
            <Route path="/playlist" element={<BgmPlaylist />} />
            <Route path="/faq" element={<FAQ />} />
            <Route path="/request" element={<Request />} />
            <Route path="/admin" element={<Admin />} />
            <Route path="/giveaways" element={<Giveaways />} />
            <Route path="/auth/callback" element={<ConfirmEmail />} />
            <Route path="/affiliate" element={<Affiliate />} />
            <Route path="/affiliate/apply" element={<AffiliateApply />} />
            <Route path="/affiliate/benefits" element={<AffiliateBenefits />} />
            <Route path="/wallet" element={<Wallet />} />
            <Route path="*" element={<NotFound />} />
          </Routes>
        </Suspense>
      </motion.div>
    </AnimatePresence>
  )
}
