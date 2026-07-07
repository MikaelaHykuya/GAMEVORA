import { createContext, useContext, useState, useCallback, useEffect, useRef } from 'react'
import { createPortal } from 'react-dom'

const ToastContext = createContext()

const iconMap = {
  success: { bg: 'bg-green-500/20', color: 'text-green-400', path: 'M5 13l4 4L19 7' },
  error: { bg: 'bg-red-500/20', color: 'text-red-400', path: 'M6 18L18 6M6 6l12 12' },
  warning: { bg: 'bg-yellow-500/20', color: 'text-yellow-400', path: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z' },
  info: { bg: 'bg-purple-500/20', color: 'text-purple-400', path: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
}

export function ToastProvider({ children }) {
  const [toasts, setToasts] = useState([])

  const showToast = useCallback((message, type = 'info', duration = 3500) => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, message, type }])
  }, [])

  const showAchievement = useCallback((label, emoji, color = '#f59e0b') => {
    const id = Date.now() + Math.random()
    setToasts(prev => [...prev, { id, type: 'achievement', label, emoji, color, duration: 5000 }])
  }, [])

  const removeToast = useCallback((id) => {
    setToasts(prev => prev.filter(t => t.id !== id))
  }, [])

  return (
    <ToastContext.Provider value={{ showToast, showAchievement }}>
      {children}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </ToastContext.Provider>
  )
}

function ToastContainer({ toasts, removeToast }) {
  const containerRef = useRef(null)

  return createPortal(
    <div
      ref={containerRef}
      className="fixed top-20 right-4 md:right-6 z-[9999] flex flex-col gap-3 pointer-events-none"
    >
      {toasts.map(toast => (
        <ToastItem key={toast.id} toast={toast} onClose={() => removeToast(toast.id)} />
      ))}
    </div>,
    document.body
  )
}

function ToastItem({ toast, onClose }) {
  const icon = iconMap[toast.type] || iconMap.info
  const [exiting, setExiting] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => {
      setExiting(true)
      setTimeout(onClose, 200)
    }, toast.duration || 3500)
    return () => clearTimeout(timer)
  }, [onClose, toast.duration])

  if (toast.type === 'achievement') {
    return (
      <div className={`pointer-events-auto achievement-popup ${exiting ? 'opacity-0 translate-x-4' : ''} transition-all duration-300`}>
        <div className="bg-zinc-900/95 border border-white/[0.08] rounded-2xl px-6 py-5 shadow-2xl backdrop-blur-xl flex items-center gap-4 min-w-[320px]">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-yellow-500/20 to-yellow-600/10 border border-yellow-500/20 flex items-center justify-center text-2xl flex-shrink-0">
            {toast.emoji}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-[7px] text-yellow-400 font-black uppercase tracking-widest">Achievement Unlocked</p>
            <p className="text-sm font-black uppercase tracking-tight mt-1" style={{ color: toast.color }}>{toast.label}</p>
          </div>
          <svg className="w-6 h-6 text-yellow-500 flex-shrink-0" fill="currentColor" viewBox="0 0 24 24">
            <path d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
          </svg>
        </div>
      </div>
    )
  }

  return (
    <div
      className={`pointer-events-auto bg-zinc-900/95 border border-white/[0.06] rounded-2xl px-5 py-4 shadow-2xl flex items-center gap-3 min-w-[280px] max-w-[400px] backdrop-blur-xl transition-all duration-200 ${
        exiting ? 'opacity-0 translate-x-4' : 'opacity-100 translate-x-0'
      }`}
      style={{ animation: 'slideIn 0.3s ease-out' }}
    >
      <div className={`w-8 h-8 rounded-xl ${icon.bg} flex items-center justify-center flex-shrink-0`}>
        <svg className={`w-4 h-4 ${icon.color}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
          <path strokeLinecap="round" strokeLinejoin="round" d={icon.path} />
        </svg>
      </div>
      <p className="text-sm text-white font-medium flex-1 leading-tight">{toast.message}</p>
      <button onClick={() => { setExiting(true); setTimeout(onClose, 200) }} className="p-1 hover:bg-white/5 rounded-lg transition-colors flex-shrink-0">
        <svg className="w-3.5 h-3.5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
          <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  )
}

export function useToast() {
  const ctx = useContext(ToastContext)
  if (!ctx) throw new Error('useToast must be used within ToastProvider')
  return ctx
}
