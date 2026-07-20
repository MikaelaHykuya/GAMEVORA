import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { formatRupiah } from '../../lib/utils'
import { useToast } from '../../contexts/ToastContext'

export default function AdminWalletTopup() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedProof, setSelectedProof] = useState(null)
  const { showToast } = useToast()

  useEffect(() => {
    fetchRequests()
  }, [])

  async function fetchRequests() {
    setLoading(true)
    const { data, error } = await supabase
      .from('wallet_transactions')
      .select(`
        *,
        profiles!inner ( email, full_name )
      `)
      .eq('type', 'top_up')
      .order('created_at', { ascending: false })

    if (error) {
      showToast('Gagal memuat request top-up: ' + error.message, 'error')
    } else {
      setRequests(data || [])
    }
    setLoading(false)
  }

  async function handleApprove(tx) {
    if (!window.confirm(`Setujui Top-Up ${formatRupiah(tx.amount)} untuk ${tx.profiles?.full_name}?`)) return
    try {
      // Use RPC to securely add balance if needed, or we can just update profiles and then transaction
      // Since it's admin, they have permissions to update directly.
      const { data: profile } = await supabase.from('profiles').select('gvr_balance').eq('id', tx.user_id).single()
      const newBalance = (profile?.gvr_balance || 0) + tx.amount

      const { error: profileError } = await supabase.from('profiles').update({ gvr_balance: newBalance }).eq('id', tx.user_id)
      if (profileError) throw profileError

      const { error: txError } = await supabase.from('wallet_transactions').update({ status: 'completed' }).eq('id', tx.id)
      if (txError) throw txError

      // Notify User
      await supabase.from('vault_notifications').insert([{
        user_id: tx.user_id,
        title: 'Top-Up Berhasil',
        message: `Top-Up sebesar ${formatRupiah(tx.amount)} telah disetujui dan masuk ke GVR Wallet Anda.`
      }])

      showToast('Top-Up berhasil disetujui.', 'success')
      fetchRequests()
    } catch (err) {
      showToast('Gagal menyetujui: ' + err.message, 'error')
    }
  }

  async function handleReject(tx) {
    const reason = window.prompt('Alasan penolakan:')
    if (reason === null) return
    try {
      const { error: txError } = await supabase
        .from('wallet_transactions')
        .update({ status: 'rejected', description: `Top-Up Ditolak: ${reason}` })
        .eq('id', tx.id)
      
      if (txError) throw txError

      await supabase.from('vault_notifications').insert([{
        user_id: tx.user_id,
        title: 'Top-Up Ditolak',
        message: `Request Top-Up sebesar ${formatRupiah(tx.amount)} ditolak: ${reason}`
      }])

      showToast('Top-Up berhasil ditolak.', 'success')
      fetchRequests()
    } catch (err) {
      showToast('Gagal menolak: ' + err.message, 'error')
    }
  }

  return (
    <div className="bg-zinc-900/50 p-6 border border-white/5 rounded-3xl">
      <h2 className="text-xl font-black italic uppercase text-white mb-6">Wallet Top-Ups</h2>
      {loading ? (
        <div className="flex items-center justify-center py-10"><div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" /></div>
      ) : requests.length === 0 ? (
        <p className="text-gray-400 text-sm">Belum ada request top-up.</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-zinc-800 text-gray-400 uppercase text-[10px] tracking-wider">
              <tr>
                <th className="px-4 py-3 rounded-tl-xl rounded-bl-xl">Date</th>
                <th className="px-4 py-3">User</th>
                <th className="px-4 py-3">Amount</th>
                <th className="px-4 py-3">Status</th>
                <th className="px-4 py-3">Proof</th>
                <th className="px-4 py-3 rounded-tr-xl rounded-br-xl text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {requests.map(tx => (
                <tr key={tx.id} className="hover:bg-white/[0.02]">
                  <td className="px-4 py-4">{new Date(tx.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="px-4 py-4 text-purple-400 font-bold">{tx.profiles?.full_name}<br/><span className="text-[10px] text-gray-500 font-normal">{tx.profiles?.email}</span></td>
                  <td className="px-4 py-4 font-black">{formatRupiah(tx.amount)}</td>
                  <td className="px-4 py-4">
                    <span className={`px-2 py-1 text-[10px] font-black uppercase rounded-full ${
                      tx.status === 'pending' ? 'bg-yellow-500/10 text-yellow-500' :
                      tx.status === 'completed' ? 'bg-green-500/10 text-green-500' :
                      'bg-red-500/10 text-red-500'
                    }`}>{tx.status}</span>
                  </td>
                  <td className="px-4 py-4">
                    {tx.proof_url ? (
                      <button onClick={() => setSelectedProof(tx.proof_url)} className="text-blue-400 hover:underline text-xs">Lihat Bukti</button>
                    ) : '-'}
                  </td>
                  <td className="px-4 py-4 text-right">
                    {tx.status === 'pending' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(tx)} className="px-3 py-1 bg-green-500/20 text-green-400 rounded-lg text-xs font-bold hover:bg-green-500/30">Approve</button>
                        <button onClick={() => handleReject(tx)} className="px-3 py-1 bg-red-500/20 text-red-400 rounded-lg text-xs font-bold hover:bg-red-500/30">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {selectedProof && (
        <div className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/90 backdrop-blur-sm" onClick={() => setSelectedProof(null)}>
          <div className="max-w-2xl max-h-[90vh] overflow-hidden rounded-2xl relative" onClick={e => e.stopPropagation()}>
            <img src={selectedProof} alt="Proof" className="w-full h-full object-contain" />
            <button onClick={() => setSelectedProof(null)} className="absolute top-4 right-4 w-8 h-8 bg-black/50 rounded-full flex items-center justify-center text-white">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
