import { useState, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useCart } from '../contexts/CartContext'
import { useToast } from '../contexts/ToastContext'
import { formatRupiah } from '../lib/utils'
import { supabase } from '../lib/supabase'

const DISCOUNT_PERCENT = 10

export default function PaymentModal({ open, onClose, amount: baseAmount, subtotal = 0, uniqueCode = 0 }) {
  const [loading, setLoading] = useState(false)
  const [step, setStep] = useState('')
  const [done, setDone] = useState(false)
  const [voucherCode, setVoucherCode] = useState('')
  const [voucherOwnerId, setVoucherOwnerId] = useState(null)
  const [voucherError, setVoucherError] = useState('')
  const [applyingVoucher, setApplyingVoucher] = useState(false)
  const [qrisPreview, setQrisPreview] = useState(false)
  const fileRef = useRef(null)
  const { user } = useAuth()
  const { fetchCartCount } = useCart()
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
      setVoucherError('Kode voucher tidak valid')
      setVoucherOwnerId(null)
    } else if (profile.id === user?.id) {
      setVoucherError('Tidak bisa menggunakan kode voucher sendiri')
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
      const { data: items, error: cartError } = await supabase.from('cart').select('game_id, games(title)').eq('user_id', user.id)
      if (cartError) throw new Error('Gagal memuat keranjang: ' + cartError.message)

      if (!items?.length) {
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
      const { error: deleteError } = await supabase.from('cart').delete().eq('user_id', user.id)
      if (deleteError) throw new Error('Gagal membersihkan keranjang: ' + deleteError.message)

      fetchCartCount()
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
      <div className="relative glass-card-premium p-10 rounded-[45px] max-w-md w-full shadow-2xl text-center">
        <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/10 rounded-full blur-[60px] pointer-events-none" />

        {done ? (
          <>
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
          </>
        ) : (
          <>
            <h2 className="text-2xl font-black italic uppercase mb-6 tracking-tighter text-gradient">Vault Transaction</h2>

            <div className="bg-white/[0.02] rounded-[24px] border border-white/[0.06] p-5">
              <div className="flex gap-2 items-center pb-5 border-b border-white/[0.06] mb-5">
                <span className="text-[9px] font-black uppercase tracking-[0.2em] text-gray-500 shrink-0">Kode Voucher</span>
                <div className="flex-1 flex gap-2">
                  <input type="text" value={voucherCode}
                    onChange={e => { setVoucherCode(e.target.value.toUpperCase()); setVoucherOwnerId(null); setVoucherError('') }}
                    className={`flex-1 min-w-0 bg-zinc-900/60 border rounded-xl px-3.5 py-2.5 text-sm outline-none text-white placeholder:text-gray-700 transition-all uppercase ${hasVoucher ? 'border-green-500/40' : 'border-white/[0.06] focus:border-purple-500/40'}`}
                    placeholder="Masukkan kode" disabled={hasVoucher} />
                  {hasVoucher ? (
                    <button onClick={() => { setVoucherCode(''); setVoucherOwnerId(null); setVoucherError('') }}
                      className="shrink-0 px-3 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[9px] font-black text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-wider">Hapus</button>
                  ) : (
                    <button onClick={applyVoucher} disabled={applyingVoucher || !voucherCode.trim()}
                      className="shrink-0 px-4 py-2.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl text-[9px] font-black uppercase tracking-wider hover:shadow-lg hover:shadow-purple-600/20 transition-all disabled:opacity-50">
                      {applyingVoucher ? '...' : 'Pakai'}
                    </button>
                  )}
                </div>
              </div>
              {voucherError && <p className="text-[9px] text-red-400 -mt-3 mb-4 font-bold text-left">{voucherError}</p>}
              {hasVoucher && <p className="text-[9px] text-green-400 -mt-3 mb-4 font-bold text-left">Diskon {DISCOUNT_PERCENT}% terkunci!</p>}

              <div className="space-y-3">
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
                <div className="flex justify-between items-center">
                  <span className="text-[10px] text-gray-400">Biaya Layanan</span>
                  <span className="text-[11px] text-white font-bold tabular-nums">{formatRupiah(uniqueCode)}</span>
                </div>
              </div>
              <div className="border-t border-white/[0.06] mt-4 pt-4 flex justify-between items-center mb-6">
                <span className="text-[11px] text-white font-black uppercase tracking-widest">Total Pembayaran</span>
                <span className="text-lg font-black text-purple-400 italic tabular-nums">{formatRupiah(displayAmount)}</span>
              </div>

              <div className="bg-white p-4 rounded-3xl mx-auto w-52 h-52 flex items-center justify-center shadow-2xl mb-2 cursor-pointer hover:opacity-90 transition-opacity active-scale" onClick={() => setQrisPreview(true)}>
                <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-full object-contain" />
              </div>
              <p className="text-[8px] text-red-500 font-black uppercase tracking-widest text-center mb-6">NOMINAL WAJIB SAMA PERSIS!</p>

              <input
                ref={fileRef}
                type="file"
                accept="image/*"
                className="w-full bg-white/[0.02] border border-white/[0.08] p-3.5 rounded-2xl text-[10px] text-gray-400 mb-4 cursor-pointer file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-[9px] file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-all"
              />
              <button
                onClick={handlePayment}
                disabled={loading}
                className="w-full bg-gradient-to-r from-white to-gray-100 text-black font-black py-5 rounded-2xl active-scale hover:from-purple-600 hover:to-purple-500 hover:text-white transition-all duration-300 shadow-xl disabled:opacity-50"
              >
                {loading ? (
                  <span className="flex items-center justify-center gap-3">
                    <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                    {step || 'PROCESSING'}
                  </span>
                ) : 'Kirim Pembayaran'}
              </button>
              <button onClick={onClose} className="mt-4 text-[10px] text-gray-600 font-black uppercase hover:text-gray-400 transition-colors">
                {loading ? 'WAIT...' : 'Cancel'}
              </button>
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
