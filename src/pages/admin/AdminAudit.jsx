import { useState, useEffect } from 'react'
import { supabase } from '@lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { FaSearch, FaFilter, FaDownload, FaSyncAlt } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminAudit() {
  const { showToast } = useToast()
  const [logs, setLogs] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState('all')
  const [dateRange, setDateRange] = useState('all')
  const [page, setPage] = useState(0)
  const [hasMore, setHasMore] = useState(true)
  const [stats, setStats] = useState({ total: 0, today: 0, admins: 0, lastAction: '-' })
  const [selectedLog, setSelectedLog] = useState(null)
  
  const LIMIT = 50

  useEffect(() => {
    fetchLogs(true)
  }, [category, dateRange])

  async function fetchLogs(reset = false) {
    setLoading(true)
    const currentPage = reset ? 0 : page
    
    let query = supabase.from('audit_logs').select('*', { count: 'exact' })
    
    if (category !== 'all') {
      query = query.eq('target_type', category)
    }
    
    if (dateRange !== 'all') {
      const d = new Date()
      if (dateRange === 'today') {
        d.setHours(0,0,0,0)
        query = query.gte('created_at', d.toISOString())
      } else if (dateRange === '7d') {
        d.setDate(d.getDate() - 7)
        query = query.gte('created_at', d.toISOString())
      } else if (dateRange === '30d') {
        d.setDate(d.getDate() - 30)
        query = query.gte('created_at', d.toISOString())
      }
    }
    
    if (search.trim()) {
      query = query.or(`admin_name.ilike.%${search}%,action.ilike.%${search}%,target_type.ilike.%${search}%`)
    }
    
    query = query.order('created_at', { ascending: false })
      .range(currentPage * LIMIT, (currentPage + 1) * LIMIT - 1)
      
    const { data, count, error } = await query
    
    if (error) {
      showToast('Gagal memuat audit log', 'error')
    } else {
      if (reset) {
        setLogs(data || [])
        // Update stats on initial load
        if (category === 'all' && dateRange === 'all' && !search) {
          const uniqueAdmins = [...new Set((data || []).map(l => l.admin_name))].length
          const todayCount = (data || []).filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length
          setStats({
            total: count || 0,
            today: todayCount,
            admins: uniqueAdmins,
            lastAction: data?.[0]?.action?.replace(/_/g, ' ') || '-'
          })
        }
      } else {
        setLogs(prev => [...prev, ...(data || [])])
      }
      setHasMore((data || []).length === LIMIT)
      setPage(reset ? 1 : currentPage + 1)
    }
    setLoading(false)
  }

  const handleSearch = (e) => {
    e.preventDefault()
    fetchLogs(true)
  }

  const exportCSV = () => {
    if (logs.length === 0) return showToast('Tidak ada data untuk diexport', 'warning')
    
    const formatDetailText = (log) => {
      if (!log.details) return '-'
      try {
        const d = log.details
        switch (log.action) {
          case 'create_game':
          case 'update_game':
          case 'delete_game':
            return `Game: ${d.title || '-'}`
          case 'approve_order':
          case 'reject_order':
            return `Item: ${d.item_name || '-'} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          case 'approve_refund':
          case 'reject_refund':
          case 'revoke_game':
            return `Game ID: ${d.game_id ? d.game_id.slice(0,8) : '-'} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          case 'send_broadcast':
            return `Tipe: ${d.type || '-'} | Judul: ${d.title || '-'}`
          case 'create_giveaway':
            return `Judul: ${d.title || '-'} | Game ID: ${d.game_id ? d.game_id.slice(0,8) : '-'}`
          case 'update_request_status':
            return `Status Baru: ${d.status || '-'}`
          case 'approve_withdrawal':
            return `Jumlah: Rp${(d.amount || 0).toLocaleString('id-ID')} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          case 'reject_withdrawal':
            return `Jumlah: Rp${(d.amount || 0).toLocaleString('id-ID')} | Alasan: ${d.reason || '-'}`
          case 'approve_affiliate':
            return `Kode: ${d.code || '-'} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          case 'reject_affiliate':
            return `Alasan: ${d.reason || '-'} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          case 'assign_game':
            return `Game ID: ${d.game_id ? d.game_id.slice(0,8) : '-'} | User ID: ${d.user_id ? d.user_id.slice(0,8) : '-'}`
          default:
            return Object.entries(d).map(([k, v]) => `${k}: ${v}`).join(' | ')
        }
      } catch (e) {
        return JSON.stringify(log.details)
      }
    }

    const headers = ['Waktu', 'Admin', 'Aksi', 'Target Tipe', 'Target ID', 'Detail']
    const csvData = logs.map(l => [
      new Date(l.created_at).toLocaleString('id-ID'),
      l.admin_name,
      l.action,
      l.target_type || '-',
      l.target_id || '-',
      formatDetailText(l)
    ])
    
    const csvContent = [headers, ...csvData].map(e => e.map(x => `"${x}"`).join(",")).join("\n")
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement("a")
    link.setAttribute("href", url)
    link.setAttribute("download", `audit_log_${new Date().toISOString().slice(0,10)}.csv`)
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
    showToast('Berhasil diexport ke CSV', 'success')
  }

  const renderDetailBadge = (log) => {
    if (!log.details) return <span className="text-gray-600">-</span>
    try {
      const d = log.details
      
      const Badge = ({ label, value }) => (
        <span className="inline-flex items-center gap-1 bg-white/5 border border-white/10 px-2 py-0.5 rounded text-[10px] mr-1.5 mb-1">
          <span className="text-gray-500">{label}:</span>
          <span className="text-gray-300 font-medium truncate max-w-[120px]">{value}</span>
        </span>
      )

      switch (log.action) {
        case 'create_game':
        case 'update_game':
        case 'delete_game':
          return <Badge label="Game" value={d.title || '-'} />
        case 'approve_order':
        case 'reject_order':
          return (
            <>
              <Badge label="Item" value={d.item_name || '-'} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        case 'approve_refund':
        case 'reject_refund':
        case 'revoke_game':
          return (
            <>
              <Badge label="Game ID" value={d.game_id ? d.game_id.slice(0,8) : '-'} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        case 'send_broadcast':
          return (
            <>
              <Badge label="Tipe" value={d.type || '-'} />
              <Badge label="Judul" value={d.title || '-'} />
            </>
          )
        case 'create_giveaway':
          return (
            <>
              <Badge label="Judul" value={d.title || '-'} />
              <Badge label="Game ID" value={d.game_id ? d.game_id.slice(0,8) : '-'} />
            </>
          )
        case 'update_request_status':
          return <Badge label="Status" value={d.status || '-'} />
        case 'approve_withdrawal':
          return (
            <>
              <Badge label="Jumlah" value={`Rp${(d.amount || 0).toLocaleString('id-ID')}`} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        case 'reject_withdrawal':
          return (
            <>
              <Badge label="Jumlah" value={`Rp${(d.amount || 0).toLocaleString('id-ID')}`} />
              <Badge label="Alasan" value={d.reason || '-'} />
            </>
          )
        case 'approve_affiliate':
          return (
            <>
              <Badge label="Kode" value={d.code || '-'} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        case 'reject_affiliate':
          return (
            <>
              <Badge label="Alasan" value={d.reason || '-'} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        case 'assign_game':
          return (
            <>
              <Badge label="Game ID" value={d.game_id ? d.game_id.slice(0,8) : '-'} />
              <Badge label="User ID" value={d.user_id ? d.user_id.slice(0,8) : '-'} />
            </>
          )
        default:
          return Object.entries(d).map(([k, v]) => (
            <Badge key={k} label={k} value={String(v)} />
          ))
      }
    } catch (e) {
      return <span className="text-gray-500 text-[10px]">Invalid format</span>
    }
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Logs', value: stats.total, color: 'from-purple-600 to-purple-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Hari Ini', value: stats.today, color: 'from-blue-600 to-blue-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Unique Admin', value: stats.admins, color: 'from-emerald-600 to-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Aksi Terakhir', value: stats.lastAction, color: 'from-amber-600 to-amber-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
        ].map(card => (
          <div key={card.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
            </div>
            <p className={`text-2xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent truncate`}>{card.value}</p>
          </div>
        ))}
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl p-5 mb-6 flex flex-col md:flex-row gap-4 justify-between items-center shadow-xl">
        <form onSubmit={handleSearch} className="relative w-full md:w-auto flex-1 max-w-md">
          <FaSearch className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
          <input 
            type="text" 
            placeholder="Cari admin, aksi, atau target..." 
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="w-full bg-black/50 border border-white/10 rounded-xl py-2 pl-10 pr-4 text-sm text-white focus:border-purple-500 outline-none"
          />
        </form>
        <div className="flex w-full md:w-auto gap-2">
          <select value={category} onChange={e => setCategory(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:border-purple-500 outline-none flex-1 md:flex-none">
            <option value="all">Semua Kategori</option>
            <option value="library">Library / Orders</option>
            <option value="games">Games</option>
            <option value="affiliate_withdrawals">Withdrawals</option>
            <option value="affiliate_applications">Affiliate Apps</option>
            <option value="giveaways">Giveaways</option>
            <option value="game_requests">Game Requests</option>
            <option value="broadcast">Broadcast</option>
          </select>
          <select value={dateRange} onChange={e => setDateRange(e.target.value)} className="bg-black/50 border border-white/10 rounded-xl px-3 py-2 text-sm text-gray-300 focus:border-purple-500 outline-none flex-1 md:flex-none">
            <option value="all">Semua Waktu</option>
            <option value="today">Hari Ini</option>
            <option value="7d">7 Hari Terakhir</option>
            <option value="30d">30 Hari Terakhir</option>
          </select>
          <button onClick={() => fetchLogs(true)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-gray-300 transition-colors" title="Refresh">
            <FaSyncAlt className={loading ? "animate-spin" : ""} />
          </button>
          <button onClick={exportCSV} className="p-2.5 bg-green-500/20 hover:bg-green-500/30 border border-green-500/20 rounded-xl text-green-400 transition-colors" title="Export CSV">
            <FaDownload />
          </button>
        </div>
      </div>

      <div className="bg-[#111] border border-white/10 rounded-2xl overflow-hidden shadow-2xl">
        <div className="overflow-x-auto custom-scrollbar max-h-[600px]">
          <table className="w-full text-left">
            <thead className="sticky top-0 bg-black/80 backdrop-blur-md z-10">
              <tr className="border-b border-white/10 text-[10px] text-gray-500 font-bold uppercase tracking-widest">
                <th className="py-4 px-5 whitespace-nowrap">Waktu</th>
                <th className="py-4 px-5">Admin</th>
                <th className="py-4 px-5">Aksi</th>
                <th className="py-4 px-5">Target</th>
                <th className="py-4 px-5">Detail</th>
              </tr>
            </thead>
            <tbody>
              {logs.length === 0 && !loading ? (
                <tr>
                  <td colSpan="5" className="py-16 text-center text-gray-500 text-sm">
                    Tidak ada data log yang ditemukan.
                  </td>
                </tr>
              ) : (
                logs.map((log, i) => (
                  <motion.tr 
                    initial={{ opacity: 0, y: 5 }}
                    animate={{ opacity: 1, y: 0 }}
                    key={log.id} 
                    className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm group cursor-pointer"
                    onClick={() => setSelectedLog(log)}
                  >
                    <td className="py-3 px-5 text-gray-400 font-mono text-xs whitespace-nowrap">
                      {new Date(log.created_at).toLocaleString('id-ID', { day: '2-digit', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </td>
                    <td className="py-3 px-5 font-bold text-white whitespace-nowrap">{log.admin_name}</td>
                    <td className="py-3 px-5">
                      <span className="text-[10px] font-black uppercase tracking-wider px-2.5 py-1 rounded-md border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-3 px-5 text-gray-400">
                      <div className="flex flex-col">
                        <span className="text-[10px] uppercase font-bold text-gray-500">{log.target_type || '-'}</span>
                        <span className="font-mono text-[10px] truncate max-w-[150px]" title={log.target_id}>{log.target_id || ''}</span>
                      </div>
                    </td>
                    <td className="py-3 px-5 text-gray-400 text-xs max-w-[250px] flex flex-wrap" title={log.details ? JSON.stringify(log.details, null, 2) : ''}>
                      {renderDetailBadge(log)}
                    </td>
                  </motion.tr>
                ))
              )}
            </tbody>
          </table>
          {loading && (
            <div className="py-8 flex justify-center">
              <span className="w-8 h-8 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
            </div>
          )}
        </div>
        {hasMore && !loading && (
          <div className="border-t border-white/10 p-4 flex justify-center bg-black/40">
            <button onClick={() => fetchLogs()} className="px-6 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl text-sm font-bold transition-all text-white">
              Load More
            </button>
          </div>
        )}
      </div>

      <AnimatePresence>
        {selectedLog && (
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm"
            onClick={() => setSelectedLog(null)}
          >
            <motion.div 
              initial={{ scale: 0.95, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.95, opacity: 0 }}
              className="bg-[#111] border border-white/10 rounded-2xl w-full max-w-lg overflow-hidden shadow-2xl"
              onClick={e => e.stopPropagation()}
            >
              <div className="p-5 border-b border-white/10 flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-black text-white">Detail Audit Log</h3>
                  <p className="text-xs text-gray-500 font-mono mt-1">
                    {new Date(selectedLog.created_at).toLocaleString('id-ID')}
                  </p>
                </div>
                <button onClick={() => setSelectedLog(null)} className="text-gray-500 hover:text-white transition-colors">
                  <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /></svg>
                </button>
              </div>
              
              <div className="p-5 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Admin</p>
                    <p className="text-sm text-white font-medium">{selectedLog.admin_name}</p>
                  </div>
                  <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Aksi</p>
                    <span className="text-[10px] font-black uppercase tracking-wider px-2 py-1 rounded border bg-purple-500/10 text-purple-400 border-purple-500/20 inline-block">
                      {selectedLog.action.replace(/_/g, ' ')}
                    </span>
                  </div>
                </div>

                <div className="bg-white/5 p-3 rounded-xl border border-white/10">
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-1">Target</p>
                  <div className="flex items-center gap-2">
                    <span className="text-xs uppercase font-bold text-gray-400">{selectedLog.target_type || '-'}</span>
                    {selectedLog.target_id && (
                      <span className="text-xs font-mono bg-black/50 px-2 py-0.5 rounded text-gray-300 border border-white/5 break-all">
                        {selectedLog.target_id}
                      </span>
                    )}
                  </div>
                </div>

                <div>
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mb-2">Payload Data (JSON)</p>
                  <div className="bg-black/50 p-4 rounded-xl border border-white/10 overflow-x-auto">
                    <pre className="text-xs text-green-400 font-mono whitespace-pre-wrap">
                      {selectedLog.details ? JSON.stringify(selectedLog.details, null, 2) : 'No payload details provided.'}
                    </pre>
                  </div>
                </div>
              </div>
              
              <div className="p-4 border-t border-white/10 flex justify-end bg-black/20">
                <button onClick={() => setSelectedLog(null)} className="px-5 py-2 bg-white/10 hover:bg-white/20 text-white text-sm font-bold rounded-xl transition-colors">
                  Tutup
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
