import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'
import { motion } from 'framer-motion'

export default function RefundRequest() {
  const { id } = useParams()
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()

  const [order, setOrder] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refundReason, setRefundReason] = useState('')
  const [refunding, setRefunding] = useState(false)
  const [proofUrl, setProofUrl] = useState('')
  const [uploadingProof, setUploadingProof] = useState(false)

  useEffect(() => {
    if (!user) {
      navigate('/login')
      return
    }

    const fetchOrder = async () => {
      const { data, error } = await supabase
        .from('library')
        .select('*, games(title)')
        .eq('id', id)
        .eq('user_id', user.id)
        .single()

      if (error || !data) {
        showToast('Pesanan tidak ditemukan', 'error')
        navigate('/profile/orders')
      } else {
        setOrder(data)
      }
      setLoading(false)
    }

    fetchOrder()
  }, [id, user, navigate, showToast])

  const handleProofUpload = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    
    // Check size (max 20MB)
    if (file.size > 20 * 1024 * 1024) {
      return showToast('Maksimal ukuran file adalah 20MB!', 'warning')
    }

    setUploadingProof(true)
    const fileExt = file.name.split('.').pop()
    const fileName = `refunds/${user.id}-${order.id}-${Date.now()}.${fileExt}`

    const { error: uploadError } = await supabase.storage.from('payments').upload(fileName, file)

    if (uploadError) {
      showToast('Gagal mengupload bukti: ' + uploadError.message, 'error')
      setUploadingProof(false)
      return
    }

    const { data } = supabase.storage.from('payments').getPublicUrl(fileName)
    setProofUrl(data.publicUrl)
    setUploadingProof(false)
  }

  const requestRefund = async () => {
    if (!refundReason.trim()) return showToast('Harap isi alasan refund', 'warning')
    if (!proofUrl) return showToast('Harap lampirkan bukti berupa foto atau video', 'warning')
    
    setRefunding(true)
    
    const finalReason = `${refundReason.trim()}\n\n[Bukti Lampiran]: ${proofUrl}`
    
    const { error } = await supabase.from('library').update({
      status: 'refund_requested',
      refund_reason: finalReason
    }).eq('id', order.id)
    
    if (error) {
      showToast('Gagal: ' + error.message, 'error')
    } else {
      showToast('Pengajuan refund berhasil dikirim', 'success')
      // Notify Admins
      const sender = user.user_metadata?.full_name || user.email?.split('@')[0] || 'User'
      supabase.functions.invoke('send-push', { 
        body: { 
          title: `Request Refund ⚠️`, 
          message: `${sender} mengajukan refund untuk pesanan ${order.games?.title || 'Game'} beserta bukti lampiran.`, 
          is_admin: true 
        } 
      }).catch(console.error)
      
      navigate('/profile/orders')
    }
    setRefunding(false)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-[#030303] flex items-center justify-center">
        <div className="w-10 h-10 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
      </div>
    )
  }

  if (!order) return null

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet>
        <title>GVR - Request Refund</title>
        <meta name="description" content="Request a refund for your order" />
      </Helmet>
      
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-red-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      
      <main className="pt-28 px-4 md:px-6 max-w-2xl mx-auto pb-8 relative">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/profile/orders')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all flex-shrink-0">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-red-400 to-red-600 bg-clip-text text-transparent">Refund Request</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Submit your refund claim</p>
          </div>
        </div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="glass-card-premium p-6 md:p-8 rounded-[32px] space-y-6 border-red-500/20">
          <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4 flex items-start gap-4">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-red-500/20 to-orange-500/20 flex items-center justify-center border border-red-500/20 flex-shrink-0">
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h3 className="text-sm font-black uppercase tracking-wide text-red-400">Important Note</h3>
              <p className="text-[10px] text-gray-400 mt-1 leading-relaxed">
                Pengajuan refund akan ditinjau oleh Admin. Pastikan kamu belum mengklaim key atau hadiah yang dikirimkan. Proses review mungkin membutuhkan waktu 1-2 hari kerja.
              </p>
            </div>
          </div>

          <div className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-5 space-y-4">
            <div>
              <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Game</p>
              <p className="text-sm font-bold text-white">{order.games?.title || 'Unknown'}</p>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Order ID</p>
                <p className="text-[10px] text-gray-300 font-mono">#GV-{order.id?.split('-')?.[0]?.toUpperCase()}</p>
              </div>
              <div>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mb-1">Date</p>
                <p className="text-[10px] text-gray-300">
                  {new Date(order.created_at).toLocaleDateString('id-ID', {day: '2-digit', month: 'long', year: 'numeric'})}
                </p>
              </div>
            </div>
          </div>

          <div>
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Reason for Refund</label>
            <textarea 
              value={refundReason} 
              onChange={e => setRefundReason(e.target.value)} 
              rows={5}
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-4 text-sm outline-none focus:border-red-500/40 transition-all text-white placeholder:text-gray-700 resize-none mb-4"
              placeholder="Ceritakan dengan jelas mengapa kamu ingin melakukan refund pesanan ini..." 
            />

            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest block mb-2">Upload Bukti (Foto/Video Maks 20MB)</label>
            <div className="relative">
              <div className={`w-full border-2 border-dashed rounded-2xl p-6 text-center transition-all ${proofUrl ? 'border-green-500/50 bg-green-500/5' : 'border-white/[0.1] bg-zinc-900/40 hover:border-red-500/30 hover:bg-zinc-900/80'}`}>
                {uploadingProof ? (
                  <div className="flex flex-col items-center gap-2">
                    <span className="w-6 h-6 border-2 border-red-500 border-t-transparent rounded-full animate-spin" />
                    <span className="text-[9px] text-gray-400 font-bold uppercase tracking-widest">Uploading...</span>
                  </div>
                ) : proofUrl ? (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-green-500/20 rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <span className="text-[10px] text-green-400 font-bold uppercase tracking-widest">Bukti Tersimpan</span>
                    <p className="text-[8px] text-gray-500 truncate max-w-full">Ketuk untuk mengganti file</p>
                  </div>
                ) : (
                  <div className="flex flex-col items-center gap-2">
                    <div className="w-10 h-10 bg-white/[0.05] rounded-full flex items-center justify-center">
                      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /></svg>
                    </div>
                    <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Pilih File Bukti</span>
                    <p className="text-[8px] text-gray-600">Video (MP4/MKV) atau Foto (JPG/PNG)</p>
                  </div>
                )}
                <input 
                  type="file" 
                  accept="image/*,video/*" 
                  onChange={handleProofUpload} 
                  disabled={uploadingProof}
                  className="absolute inset-0 w-full h-full opacity-0 cursor-pointer disabled:cursor-not-allowed" 
                />
              </div>
            </div>
          </div>

          <button 
            onClick={requestRefund} 
            disabled={refunding || !refundReason.trim() || !proofUrl || uploadingProof}
            className="w-full bg-gradient-to-r from-red-600 to-red-500 text-white font-black py-4 rounded-2xl hover:shadow-lg hover:shadow-red-600/20 transition-all duration-300 text-[10px] tracking-widest uppercase disabled:opacity-50 flex items-center justify-center gap-2"
          >
            {refunding ? (
              <>
                <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Submitting...
              </>
            ) : (
              <>
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" /></svg>
                Submit Refund Request
              </>
            )}
          </button>
        </motion.div>
      </main>
    </div>
  )
}
