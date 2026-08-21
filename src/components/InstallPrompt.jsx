import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null)
  const [show, setShow] = useState(false)
  const [isIOS, setIsIOS] = useState(false)
  const [isStandalone, setIsStandalone] = useState(false)

  useEffect(() => {
    // Check if running in standalone mode (already installed)
    const isAppStandalone = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone || document.referrer.includes('android-app://')
    setIsStandalone(isAppStandalone)

    if (isAppStandalone) return

    // Check if dismissed recently (24 hours)
    const lastDismissed = localStorage.getItem('gvr_install_dismissed')
    if (lastDismissed && Date.now() - parseInt(lastDismissed) < 24 * 60 * 60 * 1000) {
      return
    }

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase()
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent)
    setIsIOS(isIosDevice)

    if (isIosDevice) {
      // Show prompt on iOS after 2 seconds
      const timer = setTimeout(() => setShow(true), 2000)
      return () => clearTimeout(timer)
    }

    // Handle Android/Chrome beforeinstallprompt
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault()
      setDeferredPrompt(e)
      setShow(true)
    }

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
    return () => window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt)
  }, [])

  const handleInstallClick = async () => {
    if (isIOS) return
    if (!deferredPrompt) return

    deferredPrompt.prompt()
    const { outcome } = await deferredPrompt.userChoice
    if (outcome === 'accepted') {
      setShow(false)
    }
    setDeferredPrompt(null)
  }

  const handleDismiss = () => {
    setShow(false)
    localStorage.setItem('gvr_install_dismissed', Date.now().toString())
  }

  if (isStandalone) return null

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          initial={{ y: 150, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: 150, opacity: 0 }}
          transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          className="fixed bottom-6 left-4 right-4 md:left-1/2 md:-translate-x-1/2 md:w-[400px] z-[9999]"
        >
          <div className="bg-[#0A0A0C]/90 backdrop-blur-3xl border border-white/[0.08] shadow-[0_0_40px_rgba(0,0,0,0.8)] rounded-3xl p-5 relative overflow-hidden">
            <div className="absolute top-0 inset-x-0 h-1 bg-gradient-to-r from-transparent via-cyan-500 to-transparent opacity-50 blur-sm z-0" />
            <div className="absolute top-0 inset-x-0 h-[2px] bg-gradient-to-r from-transparent via-cyan-300 to-transparent opacity-80 z-0" />
            
            <button onClick={handleDismiss} className="absolute top-4 right-4 w-8 h-8 flex items-center justify-center bg-white/[0.05] rounded-full text-gray-400 hover:text-white hover:bg-white/[0.1] transition-all z-10">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>

            <div className="flex gap-4 items-start relative z-10">
              <div className="w-12 h-12 bg-black rounded-xl border border-white/[0.1] shadow-[0_0_15px_rgba(34,211,238,0.3)] flex items-center justify-center shrink-0">
                <img src="/favicon.png" alt="Icon" className="w-8 h-8 drop-shadow-md" />
              </div>
              <div className="pr-6">
                <h3 className="text-sm font-black uppercase tracking-widest text-white drop-shadow-md">Install GAMEVORA</h3>
                <p className="text-[10px] text-gray-400 mt-1 mb-4 leading-relaxed font-medium">
                  {isIOS 
                    ? 'Pasang aplikasi di iPhone untuk notifikasi langsung! Ketuk ikon "Share" di menu bawah lalu pilih "Add to Home Screen".' 
                    : 'Pasang aplikasi ke ponsel kamu untuk akses lebih cepat & notifikasi instan!'}
                </p>

                {!isIOS && (
                  <button onClick={handleInstallClick}
                    className="w-full bg-gradient-to-r from-cyan-600 to-blue-600 text-white py-2.5 rounded-xl font-black text-[9px] uppercase tracking-[0.2em] hover:shadow-[0_0_20px_rgba(34,211,238,0.4)] transition-all">
                    Install Sekarang
                  </button>
                )}
              </div>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}
