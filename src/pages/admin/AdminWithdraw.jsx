export default function AdminWithdraw({ withdrawals, formatRupiah, approveWithdrawal, rejectWithdrawal }) {
  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <p className="text-[9px] text-purple-400 font-black uppercase tracking-[0.3em]">Affiliate</p>
          <h2 className="text-2xl font-black italic uppercase tracking-tight">Withdraw Requests</h2>
        </div>
      </div>

      <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">User</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Jumlah</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Metode</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Detail</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden sm:table-cell">Tanggal</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Status</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {withdrawals.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-16">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                  </div>
                  <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada request withdraw</p>
                </td></tr>
              ) : withdrawals.map(w => (
                <tr key={w.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                  <td className="py-4 px-5">
                    <p className="text-[11px] font-bold">{w.profiles?.full_name || '—'}</p>
                    <p className="text-[8px] text-gray-600">{w.profiles?.email || ''}</p>
                  </td>
                  <td className="py-4 px-5 text-[12px] font-black text-purple-400">{formatRupiah(w.amount)}</td>
                  <td className="py-4 px-5 text-[10px] font-bold">{w.method === 'dana' ? 'DANA' : w.method === 'gopay' ? 'GoPay' : 'OVO'}</td>
                  <td className="py-4 px-5 text-[9px] text-gray-400 max-w-[150px] truncate hidden md:table-cell">{w.account_details || '—'}</td>
                  <td className="py-4 px-5 text-[9px] text-gray-500 hidden sm:table-cell">{new Date(w.created_at).toLocaleDateString('id-ID')}</td>
                  <td className="py-4 px-5 text-center">
                    <span className={`text-[9px] font-black uppercase tracking-wider px-3 py-1 rounded-lg ${
                      w.status === 'approved' ? 'text-green-400 bg-green-500/10' :
                      w.status === 'rejected' ? 'text-red-400 bg-red-500/10' :
                      'text-yellow-400 bg-yellow-500/10'
                    }`}>
                      {w.status === 'approved' ? 'Dibayar' : w.status === 'rejected' ? 'Ditolak' : 'Pending'}
                    </span>
                  </td>
                  <td className="py-4 px-5 text-center">
                    {w.status === 'pending' && (
                      <div className="flex gap-1.5 justify-center">
                        <button onClick={() => approveWithdrawal(w)}
                          className="px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl text-[7px] font-black text-green-400 hover:bg-green-500/20 transition-all uppercase tracking-wider">
                          Approve
                        </button>
                        <button onClick={() => rejectWithdrawal(w)}
                          className="px-3 py-1.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[7px] font-black text-red-400 hover:bg-red-500/20 transition-all uppercase tracking-wider">
                          Tolak
                        </button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
