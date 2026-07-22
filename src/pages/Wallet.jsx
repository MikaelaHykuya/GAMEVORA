import { useState, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { useAuth } from '../contexts/AuthContext'
import { useWallet } from '../contexts/WalletContext'
import { useToast } from '../contexts/ToastContext'
import { formatRupiah } from '../lib/utils'
import { supabase } from '../lib/supabase'

export default function Wallet() {
  const { user } = useAuth()
  const { balance, transactions, loading, requestTopUp, fetchWalletData } = useWallet()
  const { showToast } = useToast()
  
  const [showTopUpModal, setShowTopUpModal] = useState(false)
  const [topUpAmount, setTopUpAmount] = useState('')
  const [uploading, setUploading] = useState(false)
  const [qrisPreview, setQrisPreview] = useState(false)
  const [paymentMethod, setPaymentMethod] = useState('qris')
  const [showPaymentDropdown, setShowPaymentDropdown] = useState(false)
  const fileRef = useRef(null)

  const handleTopUpSubmit = async () => {
    const amount = parseInt(topUpAmount)
    if (isNaN(amount) || amount < 10000) {
      return showToast('Minimal top-up Rp 10.000', 'warning')
    }
    const file = fileRef.current?.files?.[0]
    if (!file) return showToast('Upload bukti pembayaran dulu!', 'warning')

    setUploading(true)
    try {
      const ext = file.name.split('.').pop()
      const fileName = `${user.id}-topup-${Date.now()}.${ext}`
      const { error: uploadError } = await supabase.storage.from('payments').upload(`proofs/${fileName}`, file)
      
      if (uploadError) throw new Error('Upload gagal: ' + uploadError.message)

      const { data: { publicUrl } } = supabase.storage.from('payments').getPublicUrl(`proofs/${fileName}`)

      const result = await requestTopUp(amount, publicUrl)
      if (result.error) throw new Error(result.error.message)
      
      showToast('Request Top-Up terkirim, menunggu verifikasi Admin.', 'success')
      
      // Notify Admin
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'Seseorang'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Top-Up Wallet Baru 💸`, 
          message: `${sender} request Top-Up ${formatRupiah(amount)}`, 
          is_admin: true 
        } 
      }).catch(console.error)

      setShowTopUpModal(false)
      setTopUpAmount('')
    } catch (err) {
      showToast(err.message, 'error')
    } finally {
      setUploading(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen pt-24 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  return (
    <div className="min-h-screen pt-24 pb-20 px-4 md:px-8 max-w-5xl mx-auto">
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mb-12 text-center">
        <h1 className="text-3xl md:text-5xl font-black italic uppercase tracking-tighter text-gradient mb-4">GVR Wallet</h1>
        <p className="text-xs text-gray-400 font-black uppercase tracking-widest">Kelola saldo dan riwayat transaksimu</p>
      </motion.div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="md:col-span-1 glass-card-premium p-8 rounded-[32px] relative overflow-hidden flex flex-col items-center justify-center min-h-[250px]">
          <div className="absolute top-0 right-0 w-32 h-32 bg-purple-600/20 rounded-full blur-[50px] pointer-events-none" />
          <h2 className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-4">Total Saldo GVR</h2>
          <div className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-8 tabular-nums">
            {formatRupiah(balance)}
          </div>
          <button onClick={() => setShowTopUpModal(true)}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-4 rounded-xl text-xs uppercase tracking-widest active-scale shadow-lg shadow-purple-500/20 hover:shadow-purple-500/40 transition-all">
            Top Up Saldo
          </button>
        </motion.div>

        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.1 }}
          className="md:col-span-2 glass-card-premium p-6 md:p-8 rounded-[32px] max-h-[500px] overflow-y-auto custom-scrollbar">
          <div className="flex items-center justify-between mb-6 border-b border-white/5 pb-4">
            <h2 className="text-sm font-black text-white uppercase tracking-widest">Riwayat Transaksi</h2>
            <button onClick={fetchWalletData} className="text-purple-400 hover:text-purple-300 transition-colors">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </button>
          </div>

          {transactions.length === 0 ? (
            <div className="text-center py-10">
              <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Belum ada transaksi</p>
            </div>
          ) : (
            <div className="space-y-3">
              {transactions.map((tx) => (
                <div key={tx.id} className="bg-white/[0.02] border border-white/[0.05] p-4 rounded-2xl flex items-center justify-between hover:bg-white/[0.04] transition-colors">
                  <div className="flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                      tx.type === 'top_up' ? 'bg-green-500/10 text-green-400' :
                      tx.type === 'refund' ? 'bg-blue-500/10 text-blue-400' :
                      'bg-red-500/10 text-red-400'
                    }`}>
                      {tx.type === 'top_up' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4"/></svg>
                      )}
                      {tx.type === 'purchase' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"/></svg>
                      )}
                      {tx.type === 'refund' && (
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6"/></svg>
                      )}
                    </div>
                    <div>
                      <p className="text-xs text-white font-bold mb-1">{tx.description || tx.type.replace('_', ' ').toUpperCase()}</p>
                      <p className="text-[10px] text-gray-500">{new Date(tx.created_at).toLocaleString('id-ID')}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={`text-sm font-black tabular-nums ${
                      tx.type === 'purchase' ? 'text-red-400' : 'text-green-400'
                    }`}>
                      {tx.type === 'purchase' ? '-' : '+'}{formatRupiah(Math.abs(tx.amount))}
                    </p>
                    <span className={`inline-block mt-1 text-[9px] font-black uppercase tracking-widest px-2 py-0.5 rounded-full ${
                      tx.status === 'completed' ? 'bg-green-500/20 text-green-400' :
                      tx.status === 'pending' ? 'bg-yellow-500/20 text-yellow-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {tx.status}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      <AnimatePresence>
        {showTopUpModal && (
          <div className="fixed inset-0 z-[7000] flex items-center justify-center p-4">
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" onClick={() => !uploading && setShowTopUpModal(false)} />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative glass-card-premium p-6 md:p-8 rounded-[32px] max-w-sm w-full max-h-[95vh] overflow-y-auto custom-scrollbar shadow-2xl">
              <h2 className="text-xl font-black italic uppercase mb-6 tracking-tighter text-gradient text-center">Top Up GVR</h2>
              
              <div className="space-y-4 mb-6">
                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 block">Nominal Top Up</label>
                  <input type="number" placeholder="Contoh: 50000" value={topUpAmount} onChange={(e) => setTopUpAmount(e.target.value)}
                    className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-xl px-4 py-3 text-white focus:border-purple-500/40 outline-none transition-all font-medium" />
                </div>
                
                <div className="mb-6 mx-auto w-full max-w-[200px] relative">
                  <label className="text-[9px] text-gray-400 font-black uppercase tracking-widest block mb-2 text-left ml-1">Metode Pembayaran</label>
                  <div 
                    onClick={() => setShowPaymentDropdown(!showPaymentDropdown)}
                    className="w-full bg-white/[0.02] border border-white/[0.05] hover:bg-white/[0.04] rounded-2xl px-4 py-3.5 flex items-center justify-between cursor-pointer transition-all">
                    <span className={`text-[11px] font-black uppercase tracking-widest ${paymentMethod === 'jago' ? 'text-orange-400' : 'text-white'}`}>
                      {paymentMethod === 'qris' ? 'QRIS' : 'Bank Jago'}
                    </span>
                    <svg className={`w-4 h-4 text-gray-400 transition-transform ${showPaymentDropdown ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" /></svg>
                  </div>
                  
                  {showPaymentDropdown && (
                    <div className="absolute top-[105%] left-0 right-0 bg-[#0f0f0f] border border-white/[0.08] rounded-2xl overflow-hidden shadow-2xl z-50 animate-fade-in">
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
                  <>
                    <div className="bg-white p-4 rounded-3xl mx-auto w-48 h-48 flex items-center justify-center shadow-xl cursor-pointer hover:opacity-90 transition-opacity active-scale" onClick={() => setQrisPreview(true)}>
                      <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-full object-contain rounded-2xl" />
                    </div>
                    <p className="text-[8px] text-gray-400 font-black uppercase tracking-widest text-center mt-3">Scan QRIS untuk membayar</p>
                  </>
                ) : (
                  <div className="bg-white/[0.02] border border-orange-500/30 rounded-3xl p-6 mx-auto w-48 text-center flex flex-col justify-center items-center shadow-xl">
                    <div className="w-14 h-14 bg-orange-500/20 rounded-2xl mx-auto mb-4 flex items-center justify-center border border-orange-500/20">
                      <svg className="w-7 h-7 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/></svg>
                    </div>
                    <p className="text-xs font-black text-white mb-1.5 uppercase tracking-widest">Bank Jago</p>
                    <p className="text-sm font-black text-orange-400 tracking-widest mb-1.5 select-all">109867756959</p>
                    <p className="text-[10px] text-gray-500 uppercase font-bold">A/N: RAFLY</p>
                  </div>
                )}

                <div>
                  <label className="text-[10px] text-gray-400 font-black uppercase tracking-widest mb-2 block">Upload Bukti Transfer</label>
                  <input type="file" accept="image/*" ref={fileRef}
                    className="w-full bg-white/[0.02] border border-white/[0.08] p-3 rounded-xl text-[10px] text-gray-400 cursor-pointer file:mr-3 file:py-1.5 file:px-3 file:rounded-lg file:border-0 file:text-[9px] file:font-black file:bg-purple-600 file:text-white hover:file:bg-purple-500 transition-all" />
                </div>
              </div>

              <div className="flex flex-col gap-3">
                <button onClick={handleTopUpSubmit} disabled={uploading || !topUpAmount}
                  className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest active-scale shadow-lg disabled:opacity-50 transition-all">
                  {uploading ? 'MEMPROSES...' : 'KIRIM REQUEST'}
                </button>
                <button onClick={() => setShowTopUpModal(false)} disabled={uploading}
                  className="w-full bg-white/5 hover:bg-white/10 text-white font-black py-3.5 rounded-xl text-xs uppercase tracking-widest transition-all">
                  BATAL
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <AnimatePresence>
        {qrisPreview && (
          <div className="fixed inset-0 z-[9999] flex items-center justify-center p-6" onClick={() => setQrisPreview(false)}>
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="absolute inset-0 bg-black/95 backdrop-blur-xl" />
            <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.95 }}
              className="relative max-w-lg w-full" onClick={e => e.stopPropagation()}>
              <div className="bg-white p-6 rounded-[32px] shadow-2xl">
                <img src="/img/qris.jpeg" alt="QRIS" className="w-full h-auto object-contain rounded-2xl" />
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

    </div>
  )
}
