import { useState } from 'react'

export default function ConfirmModal({ title, message, confirmLabel, variant, inputMode, inputPlaceholder, onConfirm, onClose }) {
  const [inputValue, setInputValue] = useState('')
  const [loading, setLoading] = useState(false)

  const handleConfirm = async () => {
    setLoading(true)
    try {
      if (inputMode) {
        await onConfirm(inputValue)
      } else {
        await onConfirm()
      }
      onClose()
    } catch {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-[9000] flex items-center justify-center p-4" onClick={onClose}>
      <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" />
      <div className="relative bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6 max-w-sm w-full" onClick={e => e.stopPropagation()}>
        <div className="flex items-center gap-3 mb-4">
          <div className={`w-10 h-10 rounded-2xl flex items-center justify-center ${
            variant === 'danger' ? 'bg-red-500/15 text-red-400' : 'bg-purple-500/15 text-purple-400'
          }`}>
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
              {variant === 'danger'
                ? <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                : <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              }
            </svg>
          </div>
          <div>
            <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
            <p className="text-[10px] text-gray-400 mt-0.5">{message}</p>
          </div>
        </div>

        {inputMode && (
          <input type="text" value={inputValue} onChange={e => setInputValue(e.target.value)}
            placeholder={inputPlaceholder || ''}
            className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all mb-4" />
        )}

        <div className="flex gap-3">
          <button onClick={onClose} disabled={loading}
            className="flex-1 bg-zinc-800/60 border border-white/[0.06] text-gray-400 font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-wider hover:bg-zinc-800 hover:text-white transition-all active-scale disabled:opacity-50">
            Batal
          </button>
          <button onClick={handleConfirm} disabled={loading}
            className={`flex-1 font-black py-3.5 rounded-2xl text-[10px] uppercase tracking-wider transition-all active-scale disabled:opacity-50 flex items-center justify-center gap-2 ${
              variant === 'danger'
                ? 'bg-gradient-to-r from-red-600 to-red-500 text-white hover:shadow-lg hover:shadow-red-600/20'
                : 'bg-gradient-to-r from-purple-600 to-purple-500 text-white hover:shadow-lg hover:shadow-purple-600/20'
            }`}>
            {loading && <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />}
            {confirmLabel || 'Konfirmasi'}
          </button>
        </div>
      </div>
    </div>
  )
}
