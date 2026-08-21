import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { FaCheck, FaTimes, FaSearch, FaFilter } from 'react-icons/fa'

export default function AdminWithdraw({ withdrawals, formatRupiah, approveWithdrawal, rejectWithdrawal }) {
  const [filterStatus, setFilterStatus] = useState('all')
  const [search, setSearch] = useState('')

  const filtered = withdrawals.filter(w => {
    if (filterStatus !== 'all' && w.status !== filterStatus) return false
    if (search) {
      const q = search.toLowerCase()
      if (!w.profiles?.full_name?.toLowerCase().includes(q) && !w.profiles?.email?.toLowerCase().includes(q) && !w.account_details?.toLowerCase().includes(q)) {
        return false
      }
    }
    return true
  })

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-bold text-white mb-2">Withdraw Requests</h2>
          <p className="text-xs text-gray-500">Kelola penarikan komisi affiliate</p>
        </div>
        <div className="flex gap-2">
          <div className="relative">
            <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-xs" />
            <input 
              type="text" 
              placeholder="Cari user..." 
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="bg-black/50 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-white focus:border-purple-500 outline-none w-48"
            />
          </div>
          <select 
            value={filterStatus}
            onChange={e => setFilterStatus(e.target.value)}
            className="bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:border-purple-500 outline-none"
          >
            <option value="all">Semua Status</option>
            <option value="pending">Pending</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
          </select>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest bg-black/40">
                <th className="py-4 px-6">Affiliate Info</th>
                <th className="py-4 px-6">Amount</th>
                <th className="py-4 px-6">Metode</th>
                <th className="py-4 px-6">Detail Rekening</th>
                <th className="py-4 px-6">Tanggal</th>
                <th className="py-4 px-6 text-center">Status</th>
                <th className="py-4 px-6 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              <AnimatePresence>
                {filtered.length === 0 ? (
                  <tr>
                    <td colSpan="7" className="py-12 text-center text-gray-500 text-sm">
                      Tidak ada data withdraw.
                    </td>
                  </tr>
                ) : filtered.map(w => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 10 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    key={w.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors group"
                  >
                    <td className="py-4 px-6">
                      <p className="font-bold text-white text-sm">{w.profiles?.full_name || '—'}</p>
                      <p className="text-xs text-gray-500">{w.profiles?.email || ''}</p>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-sm font-black text-purple-400">{formatRupiah(w.amount)}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs font-bold uppercase tracking-wider text-gray-300">{w.method}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-400 font-mono bg-black/40 px-2 py-1 rounded">{w.account_details || '—'}</span>
                    </td>
                    <td className="py-4 px-6">
                      <span className="text-xs text-gray-500">{new Date(w.created_at).toLocaleDateString('id-ID', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`text-[9px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md ${
                        w.status === 'approved' ? 'text-green-400 bg-green-500/10 border border-green-500/20' :
                        w.status === 'rejected' ? 'text-red-400 bg-red-500/10 border border-red-500/20' :
                        'text-yellow-400 bg-yellow-500/10 border border-yellow-500/20'
                      }`}>
                        {w.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-right">
                      {w.status === 'pending' && (
                        <div className="flex gap-2 justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                          <button onClick={() => approveWithdrawal(w)}
                            title="Setujui"
                            className="p-2 bg-green-500/10 text-green-400 hover:bg-green-500/20 hover:scale-110 rounded-lg transition-all">
                            <FaCheck size={12} />
                          </button>
                          <button onClick={() => rejectWithdrawal(w)}
                            title="Tolak"
                            className="p-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 hover:scale-110 rounded-lg transition-all">
                            <FaTimes size={12} />
                          </button>
                        </div>
                      )}
                    </td>
                  </motion.tr>
                ))}
              </AnimatePresence>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
