export default function AdminStats({ stats, fetchStats }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
      {/* Left side: Chart */}
      <div className="lg:col-span-2">
        {stats.recentOrders.length > 0 ? (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 h-[340px] flex flex-col justify-between">
            <div className="flex items-center justify-between mb-4">
              <div>
                <p className="text-[9px] text-purple-400 font-black uppercase tracking-[0.2em]">Overview</p>
                <h3 className="text-sm font-black uppercase tracking-tight">Order 7 Hari Terakhir</h3>
              </div>
              <button onClick={fetchStats} className="text-[8px] font-black text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
                Refresh
              </button>
            </div>
            <div className="flex-1 flex items-end gap-3 h-44 pb-2">
              {(() => {
                const maxCount = Math.max(...stats.recentOrders.map(o => o.count), 1)
                return stats.recentOrders.map((o, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-2 group h-full justify-end">
                    <span className="text-[9px] text-gray-400 font-bold opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap">{o.count} order</span>
                    <div className="w-full rounded-lg bg-gradient-to-t from-purple-600 to-purple-400 transition-all duration-500 hover:from-purple-500 hover:to-purple-300 cursor-pointer relative"
                      style={{ height: Math.max(10, (o.count / maxCount) * 80) + '%' }}>
                      <div className="absolute inset-0 bg-white/[0.03] rounded-lg" />
                    </div>
                    <span className="text-[8px] text-gray-500 font-black uppercase">{o.dateStr}</span>
                  </div>
                ))
              })()}
            </div>
          </div>
        ) : (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 h-[340px] flex items-center justify-center">
            <p className="text-[10px] text-gray-600 font-black uppercase italic">Tidak ada data order 7 hari terakhir</p>
          </div>
        )}
      </div>

      {/* Right side: KPI cards */}
      <div className="lg:col-span-1 grid grid-cols-2 gap-3 h-[340px]">
        {[
          { label: 'Total Game', value: stats.totalGames, color: 'from-blue-600 to-blue-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          { label: 'Total User', value: stats.totalUsers, color: 'from-green-600 to-green-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Total Order', value: stats.totalOrders, color: 'from-purple-600 to-purple-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Sukses', value: stats.approvedOrders, color: 'from-emerald-600 to-emerald-500', icon: 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Pending', value: stats.pendingOrders, color: 'from-yellow-600 to-yellow-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Revenue', value: 'Rp ' + (stats.totalRevenue || 0).toLocaleString('id-ID'), color: 'from-pink-600 to-pink-500', icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z' },
        ].map(card => (
          <div key={card.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] hover:-translate-y-0.5 transition-all group flex flex-col justify-between">
            <div className="flex items-center justify-between">
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{card.label}</p>
              <div className={`w-6 h-6 rounded-lg bg-gradient-to-br ${card.color} flex items-center justify-center shrink-0`}>
                <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={card.icon} />
                </svg>
              </div>
            </div>
            <p className={`text-lg font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent truncate mt-2`} title={card.value}>{card.value}</p>
          </div>
        ))}
      </div>
    </div>
  )
}
