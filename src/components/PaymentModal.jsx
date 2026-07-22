import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { useWallet } from '../contexts/WalletContext'
import { formatRupiah } from '../lib/utils'
import { supabase } from '../lib/supabase'

const DISCOUNT_PERCENT = 10

export default function PaymentModal({ open, onClose, amount: baseAmount, subtotal = 0, uniqueCode = 0 }) {
  const { directBuyGame } = useCart()
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherOwnerId, setVoucherOwnerId] = useState(null)
  const [voucherError, setVoucherError] = useState('')
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const [qrisPreview, setQrisPreview] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('qris')
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const fileRef = useRef(null)
  const { user } = useAuth()
  const { fetchCartCount } = useCart()
  const { balance, fetchWalletData } = useWallet()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const hasVoucher = !!voucherOwnerId

  const discountedSubtotal = hasVoucher ? Math.floor(subtotal * (100 - DISCOUNT_PERCENT) / 100) : subtotal
  const discountAmountCalc = hasVoucher ? subtotal - discountedSubtotal : 0
  const displayAmount = hasVoucher ? (Math.floor(discountedSubtotal / 1000) * 1000) + uniqueCode : baseAmount

  const applyVoucher = useCallback(async () => {
    const code = voucherCode.trim()
    if (!code) return
    setApplyingVoucher(true)
    setVoucherError('')
    const { data: profile } = await supabase
      .from('profiles')
      .select('id')
      .ilike('affiliate_code', code)
      .maybeSingle()
    if (!profile) {
      setVoucherError('Kode affiliate tidak valid')
      setVoucherOwnerId(null)
    } else if (profile.id === user?.id) {
      setVoucherError('Tidak bisa menggunakan kode affiliate sendiri')
      setVoucherOwnerId(null)
    } else {
      setVoucherOwnerId(profile.id)
    }
    setApplyingVoucher(false)
  }, [voucherCode, user])

  if (!open) return null

  const handlePayment = async () => {
    const file = fileRef.current?.files?.[0]
    if (!file) return showToast('Upload receipt first!', 'warning')
    if (!displayAmount) return showToast('No pending payment!', 'warning')
    setLoading(true)

    try {
      setStep('UPLOADING PROOF...')
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('payments').upload(`proofs/${fileName}`, file)
      if (uploadError) throw new Error('Upload gagal: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`)

      setStep('SYNCING ORDERS...')
      let items = []

      if (directBuyGame) {
        items = [{ game_id: directBuyGame.id, games: { title: directBuyGame.title } }]
      } else {
        const { data: cartItems, error: cartError } = await supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id)
        if (cartError) throw new Error('Gagal memuat keranjang: ' + cartError.message)
        items = cartItems || []
      }

      if (!items.length) {
        showToast('Cart is empty!', 'warning')
        setLoading(false)
        setStep('')
        return
      }

      const vc = hasVoucher ? voucherCode : ''
      const voi = hasVoucher ? voucherOwnerId : null

      for (const item of items) {
        const insertFields = {
          user_id: user.id, game_id: item.game_id, status: 'pending', payment_proof: publicUrl
        }
        if (vc && voi) {
          insertFields.voucher_code = vc
          insertFields.voucher_owner_id = voi
        }
        const { error: insertError } = await supabase.from('library').upsert(insertFields, { onConflict: 'user_id, game_id' })
        if (insertError) throw new Error('Gagal memproses pesanan: ' + insertError.message)

        await supabase.from('vault_notifications').insert([{
          user_id: user.id, title: 'Payment Pending',
          message: `Pembayaran untuk ${item.games?.title || 'Game'} sedang menunggu verifikasi admin.`
        }])
      }

      setStep('CLEANING CART...')
      if (!directBuyGame) {
        const { error: deleteError } = await supabase.from('cart').delete().eq('user_id', user.id)
        if (deleteError) throw new Error('Gagal membersihkan keranjang: ' + deleteError.message)
      }

      // Notify Admins
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seseorang'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Pembayaran Baru 💸`, 
          message: `${sender} baru saja mengunggah bukti pembayaran. Harap verifikasi!`, 
          is_admin: true 
        } 
      }).catch(console.error)

      fetchCartCount()
      setDone(true)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  const handleWalletPayment = async () => {
    if (balance < displayAmount) return showToast('Saldo GVR Wallet tidak cukup!', 'warning')
    setLoading(true)
    setStep('MEMPROSES WALLET...')
    
    try {
      let gameIds = []
      if (directBuyGame) {
        gameIds = [directBuyGame.id]
      } else {
        const { data: items, error: cartError } = await supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id)
        if (cartError) throw new Error('Gagal memuat keranjang: ' + cartError.message)
        if (!items?.length) throw new Error('Cart is empty!')
        gameIds = items.map(item => item.game_id)
      }
      const vc = hasVoucher ? voucherCode : null
      const voi = hasVoucher ? voucherOwnerId : null

      const { data: success, error: rpcError } = await supabase.rpc('checkout_with_wallet', {
        p_user_id: user.id,
        p_amount: displayAmount,
        p_game_ids: gameIds,
        p_voucher_code: vc,
        p_voucher_owner_id: voi
      })

      if (rpcError) throw new Error('Gagal proses wallet: ' + rpcError.message)
      if (!success) throw new Error('Saldo tidak cukup saat diproses!')

      fetchCartCount()
      fetchWalletData()
      setDone(true)
    } catch (e) {
      showToast(e.message, 'error')
    } finally {
      setLoading(false)
      setStep('')
    }
  }

  const closeAndGo = () => {
    setDone(false)
    onClose()
    navigate('/profile/orders')
  }

  return (
    <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/98 backdrop-blur-2xl" onClick={done ? closeAndGo : onClose} />
      <div className="relative glass-card-premium max-w-md w-full max-h-[90vh] flex flex-col rounded-[32px] shadow-2xl text-center overflow-hidden">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

        {done ? (
          <div className="p-6 md:p-8 overflow-y-auto custom-scrollbar">
            <div className="w-20 h-20 bg-green-500/10 rounded-[28px] flex items-center justify-center mx-auto mb-6 border border-green-500/20">
              <svg className="w-8 h-8 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-2xl font-black italic uppercase mb-3 tracking-tighter text-gradient">Payment Submitted</h2>
            <p className="text-[10px] text-gray-400 uppercase tracking-widest leading-relaxed mb-8">
              Bukti pembayaran telah dikirim.<br />
              Admin akan memverifikasi dalam waktu 1x24 jam.<br />
              Silakan cek halaman Orders untuk status terbaru.
            </p>
            <button onClick={closeAndGo}
              className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-5 rounded-2xl font-black text-[11px] uppercase active-scale shadow-xl hover:shadow-[0_0_50px_rgba(168,85,247,0.5)] transition-all duration-300">
              Lihat Orders
            </button>
          </div>
        ) : (
          <>
            <div className="p-6 pb-2 shrink-0 border-b border-white/[0.05] relative z-10 bg-[#0f0f0f]/80 backdrop-blur-md">
              <h2 className="text-2xl font-black italic uppercase tracking-tighter text-gradient text-center">Checkout Summary</h2>
            </div>

            <div className="p-6 pt-5 overflow-y-auto custom-scrollbar flex-1 space-y-4">
              {/* Affiliate Section */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-4 text-left shadow-lg">
                <label className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-400 block mb-2.5">Voucher / Affiliate Code</label>
                <div className="flex gap-2">
                  <input type="text" value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherOwnerId(null); setVoucherError('') }}
                    className={`flex-1 min-w-0 bg-[#0f0f0f] border rounded-xl px-3.5 py-2.5 text-xs outline-none text-white placeholder:text-gray-700 transition-all uppercase ${hasVoucher ? 'border-green-500/40' : 'border-white/[0.04] focus:border-purple-500/40'}`}
                    placeholder="Masukkan kode" disabled={hasVoucher} />
                  {hasVoucher ? (
                    <button onClick={() => { setVoucherCode(''); setVoucherOwnerId(null); setVoucherError('') }}
                      className="shrink-0 px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-wider">Hapus</button>
                  ) : (
                    <button onClick={applyVoucher} disabled={applyingVoucher || !voucherCode.trim()}
                      className="shrink-0 px-5 py-2.5 bg-purple-600 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:bg-purple-500 transition-all disabled:opacity-50">
                      {applyingVoucher ? '...' : 'Pakai'}
                    </button>
                  )}
                </div>
                {voucherError && <p className="text-[9px] text-red-400 mt-2 font-bold">{voucherError}</p>}
                {hasVoucher && <p className="text-[9px] text-green-400 mt-2 font-bold">Diskon {DISCOUNT_PERCENT}% terkunci!</p>}
              </div>

              {/* Order Summary Section */}
              <div className="bg-[#0a0a0a] border border-white/[0.04] rounded-2xl p-5 shadow-lg space-y-3">
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">Subtotal Pesanan</span>
                  <span className="text-[11px] text-white font-bold tabular-nums">{formatRupiah(subtotal)}</span>
                </div>
                {hasVoucher && (
                  <div className="flex justify-between items-center">
                    <span className="text-[10px] text-green-400">Potongan Diskon ({DISCOUNT_PERCENT}%)</span>
                    <span className="text-[11px] text-green-400 font-bold tabular-nums">-{formatRupiah(discountAmountCalc)}</span>
                  </div>
                )}
                <div className="flex justify-between items-center pb-3 border-b border-white/[0.04]">
                  <span className="text-[10px] text-gray-400">Biaya Layanan</span>
                  <span className="text-[11px] text-white font-bold tabular-nums">{formatRupiah(uniqueCode)}</span>
                </div>
                <div className="flex justify-between items-center pt-2">
                  <span className="text-[11px] text-white font-black uppercase tracking-widest">Total Pembayaran</span>
                  <span className="text-xl font-black text-purple-400 italic tabular-nums">{formatRupiah(displayAmount)}</span>
                </div>
              </div>

              {/* Payment Method Section */}
              <div className="bg-white/[0.02] border border-white/[0.05] rounded-2xl p-5 shadow-lg">
                <div className="mb-6 relative">
                  <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-2.5 text-left ml-1">Pilih Metode Pembayaran</label>
                  <div 
                    onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                    className="w-full bg-[#0f0f0f] border border-white/[0.05] hover:border-white/[0.1] rounded-xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${paymentMethod === 'jago' ? 'text-orange-400' : 'text-white'}`}>
                      {paymentMethod === 'qris' ? 'QRIS' : 'Bank Jago'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPaymentDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {showPaymentDropdown && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#0f0f0f] border border-white/[0.08] rounded-xl overflow-hidden shadow-2xl z-50 animate-fade-in">
                      <div 
                        onClick={() => { setPaymentMethod('qris'); setShowPaymentDropdown(false); }}
                        className="px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors border-b border-white/[0.04] flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-purple-500/20 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-white">QRIS</span>
                      </div>
                      <div 
                        onClick={() => { setPaymentMethod('jago'); setShowPaymentDropdown(false); }}
                        className="px-4 py-3 hover:bg-white/[0.04] cursor-pointer transition-colors flex items-center gap-3">
                        <div className="w-6 h-6 rounded-lg bg-orange-500/20 flex items-center justify-center">
                          <svg className="w-3.5 h-3.5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" /></svg>
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-widest text-orange-400">Bank Jago</span>
                      </div>
                    </div>
                  )}
                </div>

                {paymentMethod === 'qris' ? (
                  <div className="bg-white p-3 rounded-[24px] mx-auto w-48 h-48 flex items-center justify-center shadow-xl cursor-pointer hover:opacity-90 transition-opacity active-scale" onClick={() => setQrisPreview(true)}>
                    <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-full object-contain rounded-xl" />
                  </div>
                ) : (
                  <div className="bg-black/40 border border-orange-500/30 rounded-[24px] p-6 mx-auto w-full text-center flex flex-col justify-center items-center shadow-inner">
                    <div className="w-14 h-14 bg-orange-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-orange-500/20 shadow-[0_0_15px_rgba(249,115,22,0.2)]">
                      <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    </div>
                    <p className="text-[10px] font-black text-gray-300 mb-1.5 uppercase tracking-widest">Bank Jago</p>
                    <p className="text-lg font-black text-orange-400 tracking-widest mb-1 select-all">{`1098 6775 6959`}</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">A/N: RAFLY</p>
                  </div>
                )}
                <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center mt-6">NOMINAL WAJIB SAMA PERSIS!</p>
              </div>
              
              {/* Actions Section */}
              <div className="space-y-3 pt-2">
                <input
                  ref={fileRef}
                  type="file"
                  accept="image/*"
                  className="w-full bg-[#0a0a0a] border border-white/[0.08] p-3 rounded-xl text-[10px] text-gray-400 cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-all shadow-inner"
                />

                {balance >= displayAmount ? (
                  <button
                    onClick={handleWalletPayment}
                    disabled={loading}
                    className="w-full bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-xl active-scale hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] transition-all duration-300 shadow-xl disabled:opacity-50 text-[11px] uppercase tracking-widest"
                  >
                    {loading && step.includes('WALLET') ? (
                      <span className="flex items-center justify-center gap-3">
                        <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                        {step}
                      </span>
                    ) : `Bayar dengan GVR Wallet`}
                  </button>
                ) : (
                  <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-3 flex items-center justify-between shadow-inner">
                    <span className="text-[9px] font-black text-red-400 uppercase tracking-wider">Saldo GVR tidak cukup</span>
                    <button onClick={() => { onClose(); navigate('/wallet') }} className="text-[9px] font-black uppercase text-purple-400 hover:text-purple-300 bg-purple-500/10 px-3 py-1.5 rounded-lg transition-colors">Top Up</button>
                  </div>
                )}
                
                <div className="relative flex items-center justify-center py-1">
                  <div className="absolute inset-0 flex items-center"><div className="w-full border-t border-white/[0.04]" /></div>
                  <span className="relative bg-transparent px-3 text-[9px] font-black uppercase text-gray-600">ATAU</span>
                </div>

                <button
                  onClick={handlePayment}
                  disabled={loading}
                  className="w-full bg-white/5 border border-white/10 text-white font-black py-4 rounded-xl active-scale hover:bg-white/10 transition-all duration-300 shadow-xl disabled:opacity-50 text-[11px] uppercase tracking-widest"
                >
                  {loading && !step.includes('WALLET') ? (
                    <span className="flex items-center justify-center gap-3">
                      <span className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      {step || 'PROCESSING'}
                    </span>
                  ) : 'Kirim Bukti Transfer'}
                </button>
                
                <button onClick={onClose} className="w-full py-3 mt-2 text-[10px] text-gray-500 font-black uppercase hover:text-white transition-colors tracking-widest">
                  {loading ? 'WAIT...' : 'BATAL'}
                </button>
              </div>
            </div>
          </>
        )}
      </div>
      {qrisPreview && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6 animate-fade-in" onClick={() => setQrisPreview(false)}>
          <div className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
          <div className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
            <div className="bg-white p-6 rounded-[32px] shadow-2xl">
              <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-auto object-contain" />
            </div>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest text-center mt-4">Tap anywhere to close</p>
          </div>
        </div>
      )}
    </div>
  )
}
