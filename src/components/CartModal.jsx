import { useCart } from '../contexts/CartContext'
import { formatRupiah } from '../lib/utils'
import { createPortal } from 'react-dom'

export default function CartModal({ onCheckout }) {
  const { cartOpen, closeCart, cartItems, removeFromCart } = useCart()

  if (!cartOpen) return null

  const total = cartItems.reduce((sum, item) => {
    const p = item.games?.discount_price || item.games?.price || 0
    return sum + p
  }, 0)

  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div className="absolute inset-0 bg-black/90 backdrop-blur-xl" onClick={closeCart}>
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 mix-blend-overlay" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-4xl h-px bg-purple-500/10 blur-[2px]" />
      </div>
      
      {/* Modal Container */}
      <div className="relative bg-zinc-950/90 border border-purple-500/30 p-8 rounded-[32px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[0_0_50px_rgba(168,85,247,0.15)] backdrop-blur-2xl animate-fade-up">
        
        {/* Decorative corner glows */}
        <div className="absolute -top-10 -left-10 w-40 h-40 bg-purple-600/20 rounded-full blur-[60px] pointer-events-none -z-10" />
        <div className="absolute -bottom-10 -right-10 w-40 h-40 bg-blue-600/20 rounded-full blur-[70px] pointer-events-none -z-10" />

        {/* Header Section */}
        <div className="mb-6 relative pb-4 border-b border-white/5 flex justify-between items-start">
          <div>
            <div className="flex items-center gap-2 mb-3">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-purple-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-purple-500"></span>
              </span>
              <span className="text-purple-400 text-[9px] font-mono uppercase tracking-[0.3em]">Payload Ready</span>
            </div>
            <h3 className="text-2xl font-black uppercase tracking-tighter text-white flex items-center gap-3">
              <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-blue-600 rounded-xl flex items-center justify-center shadow-lg shadow-purple-600/30 border border-white/10">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <span className="bg-gradient-to-r from-purple-400 to-blue-400 bg-clip-text text-transparent drop-shadow-sm">Secure Vault Cart</span>
            </h3>
          </div>
          
          <button onClick={closeCart} className="p-2.5 rounded-xl bg-white/5 text-gray-400 hover:text-white hover:bg-white/10 hover:rotate-90 transition-all duration-300">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>

        {/* Cart Items Area */}
        <div className="flex-grow overflow-y-auto space-y-3 no-scrollbar min-h-[300px] pr-2">
          {cartItems.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-12 text-center bg-black/20 rounded-3xl border border-white/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
              <div className="w-20 h-20 rounded-full bg-purple-500/5 border border-purple-500/10 flex items-center justify-center mx-auto mb-6 relative">
                <div className="absolute inset-0 border-2 border-dashed border-purple-500/20 rounded-full animate-spin-slow" />
                <svg className="w-8 h-8 text-purple-500/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <p className="text-sm font-black uppercase tracking-[0.1em] text-white mb-2">Vault Empty</p>
              <p className="text-[10px] text-gray-500 font-mono uppercase tracking-widest max-w-[200px] mx-auto">No digital assets found in staging area.</p>
            </div>
          ) : (
            cartItems.map((item, i) => {
              const p = item.games?.discount_price || item.games?.price || 0
              return (
                <div
                  key={item.id}
                  className="group flex items-center justify-between p-3 pl-4 bg-zinc-900/50 border border-white/5 rounded-2xl hover:border-purple-500/40 hover:bg-zinc-800/80 hover:shadow-[0_0_20px_rgba(168,85,247,0.15)] transition-all duration-300 animate-fade-up relative overflow-hidden"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-purple-500 opacity-0 group-hover:opacity-100 group-hover:shadow-[0_0_10px_rgba(168,85,247,1)] transition-all" />
                  
                  <div className="flex items-center gap-4">
                    <div className="w-16 h-16 rounded-xl overflow-hidden border border-white/10 group-hover:border-purple-400/50 transition-colors shadow-lg relative">
                      <div className="absolute inset-0 bg-purple-500/20 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity z-10" />
                      <img src={item.games?.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.games?.title} />
                    </div>
                    <div>
                      <p className="text-xs font-black uppercase tracking-tight text-white group-hover:text-purple-300 transition-colors">{item.games?.title}</p>
                      <div className="flex items-center gap-2 mt-1.5">
                        <span className="text-[9px] font-mono text-gray-500 uppercase tracking-widest">Asset Value</span>
                        <span className="w-1 h-1 rounded-full bg-white/20" />
                        <span className="text-[11px] font-black text-purple-400">{formatRupiah(p)}</span>
                      </div>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="p-3 bg-red-500/10 border border-red-500/20 text-red-500 hover:text-red-400 hover:bg-red-500/20 hover:border-red-500/40 hover:shadow-[0_0_15px_rgba(239,68,68,0.2)] rounded-xl transition-all active:scale-95 shrink-0">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        {/* Footer Area */}
        <div className="relative z-10 pt-6 mt-4 border-t border-white/5 space-y-6">
          <div className="flex justify-between items-end px-2">
            <div>
              <p className="text-[10px] font-black text-gray-500 uppercase tracking-[0.2em] mb-1">Payload Summary</p>
              <div className="flex items-center gap-2">
                <span className="text-[8px] font-mono text-cyan-400 bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 rounded-md">
                  {cartItems.length} ASSETS DETECTED
                </span>
              </div>
            </div>
            <div className="text-right">
              <p className="text-3xl font-black text-purple-400 tracking-tighter drop-shadow-md">{formatRupiah(total)}</p>
            </div>
          </div>
          
          <button
            onClick={() => onCheckout()}
            disabled={cartItems.length === 0}
            className="group relative w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white py-4 rounded-2xl font-black text-[11px] uppercase tracking-[0.2em] active-scale hover:shadow-[0_0_40px_rgba(168,85,247,0.4)] disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-300 overflow-hidden"
          >
            <div className="absolute inset-0 bg-white/20 -translate-x-full group-hover:animate-shimmer" />
            <span className="relative z-10 flex items-center justify-center gap-2">
              Initiate Secure Transfer
              <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M17 8l4 4m0 0l-4 4m4-4H3" /></svg>
            </span>
          </button>
        </div>
      </div>
    </div>,
    document.body
  )
}
