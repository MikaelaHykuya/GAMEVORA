import { useCart } from '../contexts/CartContext'
import { formatRupiah } from '../lib/utils'

export default function CartModal({ onCheckout }) {
  const { cartOpen, closeCart, cartItems, removeFromCart } = useCart()

  if (!cartOpen) return null

  const total = cartItems.reduce((sum, item) => {
    const p = item.games?.discount_price || item.games?.price || 0
    return sum + p
  }, 0)

  return (
    <div className="fixed inset-0 z-[6000] flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/80 backdrop-blur-sm" onClick={closeCart} />
      <div className="relative bg-gradient-to-b from-[#0c0c0e] to-[#08080a] border border-white/[0.06] p-8 md:p-10 rounded-[45px] max-w-2xl w-full max-h-[85vh] flex flex-col shadow-[0_30px_80px_rgba(0,0,0,0.8)] animate-slide-up">
        {/* Decorative glows */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none" />
        <div className="absolute -bottom-20 -left-20 w-40 h-40 bg-blue-600/10 rounded-full blur-[80px] pointer-events-none" />

        <div className="relative z-10 flex justify-between items-center mb-8 border-b border-white/[0.04] pb-5">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-gradient-to-br from-purple-600 to-purple-500 rounded-2xl flex items-center justify-center shadow-lg shadow-purple-600/30">
              <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
              </svg>
            </div>
            <h3 className="text-xl font-black uppercase tracking-tight">
              Cart <span className="bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">Vault</span>
            </h3>
          </div>
          <button onClick={closeCart} className="text-gray-600 text-[9px] font-black uppercase tracking-widest hover:text-white transition-colors px-4 py-2 rounded-xl bg-white/[0.03] border border-white/[0.06] hover:bg-white/[0.06]">
            Close
          </button>
        </div>

        <div className="relative z-10 flex-grow overflow-y-auto space-y-2 no-scrollbar mb-8 pr-2">
          {cartItems.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.06] flex items-center justify-center">
                <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 100 4 2 2 0 000-4z" />
                </svg>
              </div>
              <p className="text-gray-500 text-sm font-black uppercase tracking-wider mb-1">Cart Empty</p>
              <p className="text-gray-600 text-[10px] font-bold uppercase tracking-widest">Belum ada item</p>
            </div>
          ) : (
            cartItems.map((item, i) => {
              const p = item.games?.discount_price || item.games?.price || 0
              return (
                <div
                  key={item.id}
                  className="flex items-center justify-between bg-white/[0.02] p-4 rounded-3xl border border-white/[0.04] hover:bg-white/[0.05] hover:border-purple-500/10 transition-all duration-300 group"
                  style={{ animation: `fadeInUp 0.3s ease-out ${i * 0.05}s both` }}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 rounded-2xl overflow-hidden border border-white/[0.04] shadow-lg">
                      <img src={item.games?.thumbnail} className="w-full h-full object-cover" alt={item.games?.title} />
                    </div>
                    <div>
                      <p className="text-[11px] font-black uppercase leading-tight">{item.games?.title}</p>
                      <p className="text-[10px] font-bold text-purple-400 mt-1">{formatRupiah(p)}</p>
                    </div>
                  </div>
                  <button onClick={() => removeFromCart(item.id)} className="text-red-500/50 hover:text-red-400 p-2 active-scale transition-colors hover:bg-red-500/10 rounded-xl">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              )
            })
          )}
        </div>

        <div className="relative z-10 pt-6 border-t border-white/[0.04] space-y-5">
          <div className="flex justify-between items-end px-1">
            <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Subtotal Pesanan</p>
            <div className="text-right">
              <p className="text-3xl font-black text-purple-400 tracking-tight">{formatRupiah(total)}</p>
              <p className="text-[7px] text-gray-700 font-black uppercase tracking-widest mt-1">{cartItems.length} item</p>
            </div>
          </div>
          <button
            onClick={() => onCheckout()}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-5 rounded-[24px] font-black text-[11px] uppercase tracking-wider active-scale shadow-xl hover:shadow-purple-600/30 hover:from-purple-500 hover:to-purple-400 transition-all duration-300"
          >
            Secure Checkout
          </button>
        </div>
      </div>
    </div>
  )
}
