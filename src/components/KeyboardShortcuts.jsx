import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

const shortcuts = [
  { key: 'g', path: '/store', label: 'Store' },
  { key: 'h', path: '/', label: 'Home' },
  { key: 'p', path: '/profile', label: 'Profile' },
  { key: 'o', path: '/profile/orders', label: 'Orders' },
  { key: 's', path: '/profile/settings', label: 'Settings' },
  { key: 'w', path: '/profile/wishlist', label: 'Wishlist' },
  { key: 'f', path: '/faq', label: 'FAQ' },
  { key: 'l', path: '/playlist', label: 'Playlist' },
  { key: '?', modal: true, label: 'Show shortcuts' },
]

export default function KeyboardShortcuts() {
  const navigate = useNavigate()
  const [showHint, setShowHint] = useState(false)

  useEffect(() => {
    const handler = (e) => {
      if (e.target.tagName === 'INPUT' || e.target.tagName === 'TEXTAREA' || e.target.isContentEditable) return

      const s = shortcuts.find(s => s.key === e.key.toLowerCase())
      if (!s) return

      if (s.key === '?') {
        setShowHint(prev => !prev)
        setTimeout(() => setShowHint(false), 4000)
        return
      }

      navigate(s.path)
    }

    window.addEventListener('keydown', handler)
    return () => window.removeEventListener('keydown', handler)
  }, [navigate])

  return showHint ? (
    <div className="shortcut-hint" onClick={() => setShowHint(false)}>
      <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest mb-3">Keyboard Shortcuts</p>
      <div className="space-y-2">
        {shortcuts.filter(s => s.key !== '?').map(s => (
          <div key={s.key} className="flex items-center justify-between gap-6">
            <span className="text-xs text-gray-400">{s.label}</span>
            <kbd>{s.key.toUpperCase()}</kbd>
          </div>
        ))}
        <div className="flex items-center justify-between gap-6 pt-2 border-t border-white/[0.04]">
          <span className="text-xs text-gray-400">Hide this</span>
          <kbd>?</kbd>
        </div>
      </div>
    </div>
  ) : null
}
