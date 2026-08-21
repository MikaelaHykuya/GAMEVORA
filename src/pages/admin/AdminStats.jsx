export default function AdminStats({ stats, fetchStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left side: Chart */}
      <div className="lg:col-span-2">
        {stats.recentOrders.length > 0 ? (
          <div className="relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 h-[400px] flex flex-col justify-between overflow-hidden shadow-2xl shadow-black group">
            <div className="absolute inset-0 bg-gradient-to-br from-purple-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-700" />
            <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[80px] -translate-y-1/2 translate-x-1/3" />
            
            <div className="relative z-10 flex items-center justify-between mb-6">
              <div>
                <p className="text-[10px] text-purple-400 font-black uppercase tracking-[0.2em] mb-1">Overview</p>
                <h3 className="text-xl font-black tracking-tight text-white">Order 7 Hari Terakhir</h3>
              </div>
              <button onClick={fetchStats} className="flex items-center gap-2 text-[10px] font-black text-white hover:text-purple-300 transition-all px-4 py-2.5 bg-white/5 hover:bg-white/10 border border-white/10 hover:border-purple-500/30 rounded-xl active-scale">
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                Refresh
              </button>
            </div>
            
            <div className="relative z-10 flex-1 flex items-end gap-2 sm:gap-4 h-48 pb-2">
              {(() => {
                const maxCount = Math.max(...stats.recentOrders.map(o => o.count), 1)
                return stats.recentOrders.map((o, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 sm:gap-3 group/bar h-full justify-end">
                    <span className="text-[10px] sm:text-[11px] text-white font-bold opacity-0 group-hover/bar:opacity-100 transition-opacity whitespace-nowrap translate-y-2 group-hover/bar:translate-y-0 duration-300">
                      {o.count} <span className="hidden sm:inline text-gray-400">order</span>
                    </span>
                    <div className="w-full max-w-[40px] rounded-xl bg-gradient-to-t from-purple-900/40 to-purple-600/60 border border-purple-500/20 transition-all duration-500 group-hover/bar:from-purple-600 group-hover/bar:to-purple-400 group-hover/bar:border-purple-400/50 group-hover/bar:shadow-[0_0_20px_rgba(168,85,247,0.4)] cursor-pointer relative overflow-hidden"
                      style={{ height: Math.max(15, (o.count / maxCount) * 80) + '%' }}>
                      <div className="absolute inset-0 bg-gradient-to-b from-white/20 to-transparent opacity-0 group-hover/bar:opacity-100 transition-opacity" />
                    </div>
                    <span className="text-[9px] text-gray-500 font-black uppercase text-center leading-tight whitespace-pre-line group-hover/bar:text-purple-300 transition-colors">{o.dateStr.replace(', ', '\n')}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 h-[400px] flex items-center justify-center shadow-2xl shadow-black">
            <p className="text-xs text-gray-600 font-black uppercase tracking-widest italic">Tidak ada data order 7 hari terakhir</p>
          </div>
        )}
      </div>

      {/* Right side: KPI cards */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-4 h-[400px]">
        {[
          { label: 'Total Game', value: stats.totalGames, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/20', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          { label: 'Total User', value: stats.totalUsers, color: 'from-green-600 to-emerald-400', shadow: 'shadow-emerald-500/20', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Total Order', value: stats.totalOrders, color: 'from-purple-600 to-fuchsia-400', shadow: 'shadow-fuchsia-500/20', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Sukses', value: stats.approvedOrders, color: 'from-emerald-600 to-teal-400', shadow: 'shadow-teal-500/20', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Pending', value: stats.pendingOrders, color: 'from-amber-500 to-yellow-400', shadow: 'shadow-yellow-500/20', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Revenue', value: 'Rp ' + (stats.totalRevenue || 0).toLocaleString('id-ID'), color: 'from-pink-600 to-rose-400', shadow: 'shadow-rose-500/20', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map(card => (
          <div key={card.label} className="relative bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 group flex flex-col justify-between overflow-hidden shadow-lg shadow-black">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${card.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="relative z-10 flex items-center justify-between">
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{card.label}</p>
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0 shadow-lg ${card.shadow}`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
            </div>
            <div className="relative z-10 mt-4">
              <p className={`text-xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent truncate group-hover:scale-105 origin-left transition-transform`} title={card.value}>{card.value}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
