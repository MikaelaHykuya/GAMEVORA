export default function AdminRefund({ refundRequests, approveRefund, rejectRefund, setProofPreview }) {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase tracking-tight">Refund Requests</h2>
        <span className="text-[10px] text-blue-400 font-black bg-blue-500/10 px-3 py-1.5 rounded-xl border border-blue-500/20">
          {refundRequests.length} menunggu
        </span>
      </div>
      {refundRequests.length === 0 ? (
        <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No refund requests</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/5 text-[8px] text-gray-600 font-black uppercase tracking-widest">
                <th className="pb-4 px-2 hidden sm:table-cell">ID</th>
                <th className="pb-4 px-2">Game</th>
                <th className="pb-4 px-2 hidden md:table-cell">User</th>
                <th className="pb-4 px-2">Alasan</th>
                <th className="pb-4 px-2 text-center">Bukti</th>
                <th className="pb-4 px-2 hidden sm:table-cell">Tanggal</th>
                <th className="pb-4 px-2 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {refundRequests.map(order => (
                <tr key={order.id} className="hover:bg-white/[0.01] transition-all border-b border-white/[0.02]">
                  <td className="py-5 px-2 font-mono text-[9px] text-gray-500 uppercase tracking-tighter whitespace-nowrap hidden sm:table-cell">
                    #GV-{order.id?.split('-')?.[0]?.toUpperCase()}
                  </td>
                  <td className="py-5 px-2">
                    <p className="text-[10px] font-black uppercase truncate max-w-[100px] sm:max-w-[120px]">{order.games?.title || 'Unknown'}</p>
                  </td>
                  <td className="py-5 px-2 hidden md:table-cell">
                    <p className="text-[9px] font-bold truncate max-w-[80px]">{order.profiles?.full_name || 'Unknown'}</p>
                    <p className="text-[7px] text-gray-500 truncate max-w-[80px]">{order.profiles?.email}</p>
                  </td>
                  <td className="py-5 px-2 max-w-[120px] sm:max-w-[200px]">
                    <p className="text-[8px] text-gray-400 leading-relaxed line-clamp-2">{order.refund_reason || '-'}</p>
                  </td>
                  <td className="py-5 px-2 text-center">
                    {(() => {
                      const proofMatch = order.refund_reason?.match(/\[Bukti Lampiran\]:\s*(https?:\/\/[^\s]+)/)
                      const refundProof = proofMatch ? proofMatch[1] : null
                      const actualProof = refundProof || order.payment_proof || order.proof_url

                      return actualProof ? (
                        <button onClick={() => setProofPreview({ ...order, payment_proof: actualProof, profiles: { full_name: order.profiles?.full_name } })}
                          className="px-2.5 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all active-scale uppercase tracking-wider">
                          Lihat
                        </button>
                      ) : (
                        <span className="text-[8px] text-gray-600">-</span>
                      )
                    })()}
                  </td>
                  <td className="py-5 px-2 text-[8px] font-bold text-gray-600 uppercase whitespace-nowrap hidden sm:table-cell">
                    {new Date(order.created_at).toLocaleDateString('id-ID')}
                  </td>
                  <td className="py-5 px-2">
                    <div className="flex gap-2 justify-center">
                      <button onClick={() => approveRefund(order)}
                        className="px-4 py-2 bg-green-500/10 text-green-500 border border-green-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-green-500/20 transition-all">
                        Setujui
                      </button>
                      <button onClick={() => rejectRefund(order)}
                        className="px-4 py-2 bg-red-500/10 text-red-500 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-wider active-scale hover:bg-red-500/20 transition-all">
                        Tolak
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
