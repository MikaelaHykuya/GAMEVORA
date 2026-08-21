export default function AdminInventory({ games, searchGames, setSearchGames, newGame, prepareEdit, deleteGame, formatRupiah, pendingNewGameCount, sendPendingGames, users, pendingOrders, refundRequests, requests }) {
  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-4 mb-10">
        {[
          { label: 'Total Games', value: games.length, color: 'from-purple-600 to-purple-400', shadow: 'shadow-purple-500/20', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          { label: 'Total Users', value: users.length, color: 'from-blue-600 to-blue-400', shadow: 'shadow-blue-500/20', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Orders', value: pendingOrders.length, color: 'from-emerald-600 to-emerald-400', shadow: 'shadow-emerald-500/20', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Refund', value: refundRequests.length, color: 'from-amber-500 to-yellow-400', shadow: 'shadow-yellow-500/20', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          { label: 'Requests', value: requests.length, color: 'from-rose-600 to-pink-400', shadow: 'shadow-pink-500/20', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        ].map(stat => (
          <div key={stat.label} className="relative bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-3xl p-5 hover:border-white/[0.15] hover:-translate-y-1 transition-all duration-300 group overflow-hidden shadow-lg shadow-black">
            <div className={`absolute top-0 right-0 w-24 h-24 bg-gradient-to-br ${stat.color} opacity-5 rounded-full blur-2xl group-hover:opacity-10 transition-opacity`} />
            <div className="relative z-10 flex items-center gap-3 mb-3">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} flex items-center justify-center shadow-lg ${stat.shadow}`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="2">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className={`relative z-10 text-3xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent group-hover:scale-105 origin-left transition-transform`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1 max-w-md">
            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
              <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input type="text" placeholder="Cari game..." value={searchGames} onChange={e => setSearchGames(e.target.value)}
              className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-purple-500/40 focus:bg-white/[0.02] transition-all text-sm text-white placeholder:text-gray-600 shadow-lg shadow-black/20" />
          </div>
          {pendingNewGameCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[10px] font-black text-yellow-400 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2.5 rounded-xl whitespace-nowrap shadow-lg shadow-yellow-500/10">
                Discord {pendingNewGameCount}/10
              </span>
              <button onClick={sendPendingGames} className="text-[10px] font-black text-green-400 bg-green-500/10 border border-green-500/20 px-4 py-2.5 rounded-xl hover:bg-green-500/20 hover:border-green-400/30 transition-all active-scale whitespace-nowrap shadow-lg shadow-green-500/10 flex items-center gap-2">
                Kirim <span className="text-lg leading-none">→</span>
              </button>
            </div>
          )}
        </div>
        <button onClick={newGame} className="bg-gradient-to-r from-purple-600 to-blue-600 p-[1px] rounded-2xl active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 group">
          <div className="bg-[#0A0A0C] hover:bg-transparent rounded-2xl px-6 py-3 transition-colors flex items-center gap-2">
            <svg className="w-4 h-4 text-purple-400 group-hover:text-white transition-colors" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
            <span className="text-[11px] font-black uppercase tracking-wider text-purple-400 group-hover:text-white transition-colors whitespace-nowrap">New Game</span>
          </div>
        </button>
      </div>

      {/* Game Table */}
      <div className="bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] overflow-hidden shadow-2xl shadow-black relative">
        <div className="absolute top-0 left-1/4 w-1/2 h-px bg-gradient-to-r from-transparent via-purple-500/50 to-transparent" />
        <div className="overflow-x-auto custom-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.08] bg-white/[0.02]">
                <th className="text-left py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest whitespace-nowrap">Game</th>
                <th className="text-left py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest hidden md:table-cell">Genre</th>
                <th className="text-right py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest whitespace-nowrap">Price</th>
                <th className="text-center py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest hidden md:table-cell">Sold</th>
                <th className="text-center py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="text-right py-5 px-6 text-[10px] text-gray-500 font-black uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/[0.04]">
              {games.filter(g => g.title.toLowerCase().includes(searchGames.toLowerCase())).map(g => (
                <tr key={g.id} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-4">
                      <div className="w-12 h-12 rounded-xl overflow-hidden border border-white/10 flex-shrink-0 relative group-hover:border-purple-500/30 transition-colors">
                        <img src={g.thumbnail} className="w-full h-full object-cover" alt="" />
                      </div>
                      <div>
                        <p className="text-sm font-black tracking-tight text-gray-200 group-hover:text-white transition-colors">{g.title}</p>
                        <p className="text-[9px] text-gray-500 font-bold mt-1 tracking-widest">#{g.id?.slice(0, 6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-6 hidden md:table-cell">
                    <span className="inline-block px-3 py-1 rounded-lg bg-white/5 border border-white/5 text-[10px] text-gray-400 font-bold">{g.genre}</span>
                  </td>
                  <td className="py-4 px-6 text-right whitespace-nowrap">
                    <span className="text-sm font-black text-purple-400">{formatRupiah(g.discount_price || g.price)}</span>
                    {g.discount_price > 0 && g.price > g.discount_price && (
                      <span className="block text-[9px] text-gray-600 line-through mt-0.5 font-bold">{formatRupiah(g.price)}</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-center hidden md:table-cell">
                    <span className="text-sm font-black text-gray-300">{(g.sold_count || 0).toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 px-6 text-center hidden md:table-cell">
                    {g.is_trending ? (
                      <span className="text-[9px] font-black text-rose-400 bg-rose-500/10 border border-rose-500/20 px-3 py-1.5 rounded-xl uppercase tracking-widest shadow-lg shadow-rose-500/10">Trending</span>
                    ) : (
                      <span className="text-[10px] text-gray-700 font-black">—</span>
                    )}
                  </td>
                  <td className="py-4 px-6 text-right">
                    <div className="flex items-center justify-end gap-2 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <button onClick={() => prepareEdit(g)} className="p-2.5 bg-white/5 hover:bg-white/10 border border-white/5 hover:border-white/20 rounded-xl text-gray-400 hover:text-white transition-all active-scale" title="Edit">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" /></svg>
                      </button>
                      <button onClick={() => deleteGame(g.id)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 border border-red-500/20 hover:border-red-500/30 rounded-xl text-red-400 hover:text-red-300 transition-all active-scale" title="Hapus">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {games.length === 0 && (
          <div className="text-center py-20">
            <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
              <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Belum ada game</p>
          </div>
        )}
      </div>
    </div>
  )
}
