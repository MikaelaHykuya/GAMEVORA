export default function AdminInventory({ games, searchGames, setSearchGames, newGame, prepareEdit, deleteGame, formatRupiah, pendingNewGameCount, sendPendingGames, users, pendingOrders, refundRequests, requests }) {
  return (
    <div>
      {/* Stat Cards */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3 mb-8">
        {[
          { label: 'Total Games', value: games.length, color: 'from-purple-600 to-purple-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          { label: 'Total Users', value: users.length, color: 'from-blue-600 to-blue-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Orders', value: pendingOrders.length, color: 'from-emerald-600 to-emerald-500', icon: 'M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4' },
          { label: 'Refund', value: refundRequests.length, color: 'from-amber-600 to-amber-500', icon: 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15' },
          { label: 'Requests', value: requests.length, color: 'from-rose-600 to-rose-500', icon: 'M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z' },
        ].map(stat => (
          <div key={stat.label} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-4 hover:border-white/[0.08] transition-all group">
            <div className="flex items-center gap-3 mb-2">
              <div className={`w-8 h-8 rounded-xl bg-gradient-to-br ${stat.color} bg-opacity-20 flex items-center justify-center`}>
                <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" strokeWidth="1.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d={stat.icon} />
                </svg>
              </div>
              <p className="text-[9px] text-gray-500 font-bold uppercase tracking-widest">{stat.label}</p>
            </div>
            <p className={`text-2xl font-black bg-gradient-to-r ${stat.color} bg-clip-text text-transparent`}>{stat.value}</p>
          </div>
        ))}
      </div>

      {/* Action bar */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 mb-6">
        <div className="flex items-center gap-3 flex-1 w-full md:w-auto">
          <div className="relative flex-1">
            <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari game..." value={searchGames} onChange={e => setSearchGames(e.target.value)}
              className="w-full md:w-80 bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-11 pr-4 py-3 outline-none focus:border-purple-500/40 focus:bg-zinc-900/80 transition-all text-sm text-white placeholder:text-gray-700" />
          </div>
          {pendingNewGameCount > 0 && (
            <div className="flex items-center gap-2">
              <span className="text-[9px] font-black text-yellow-500 bg-yellow-500/10 border border-yellow-500/20 px-3 py-2 rounded-xl whitespace-nowrap">
                Discord {pendingNewGameCount}/10
              </span>
              <button onClick={sendPendingGames} className="text-[9px] font-black text-green-400 bg-green-400/10 border border-green-400/20 px-3 py-2 rounded-xl hover:bg-green-400/20 transition-all active-scale whitespace-nowrap">
                Kirim →
              </button>
            </div>
          )}
        </div>
        <button onClick={newGame} className="bg-gradient-to-r from-purple-600 to-purple-500 px-6 py-3 rounded-2xl text-[10px] font-black uppercase active-scale hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 flex items-center gap-2 whitespace-nowrap">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" /></svg>
          New Game
        </button>
      </div>

      {/* Game Table */}
      <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Game</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Genre</th>
                <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Price</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Sold</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Status</th>
                <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Action</th>
              </tr>
            </thead>
            <tbody>
              {games.filter(g => g.title.toLowerCase().includes(searchGames.toLowerCase())).map(g => (
                <tr key={g.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                  <td className="py-4 px-5">
                    <div className="flex items-center gap-3">
                      <img src={g.thumbnail} className="w-10 h-10 rounded-xl object-cover border border-white/5 flex-shrink-0" alt="" />
                      <div>
                        <p className="text-[12px] font-bold leading-tight">{g.title}</p>
                        <p className="text-[8px] text-gray-600 mt-0.5">#{g.id?.slice(0, 6)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-5 hidden md:table-cell">
                    <span className="text-[9px] text-gray-500 font-bold">{g.genre}</span>
                  </td>
                  <td className="py-4 px-5 text-right">
                    <span className="text-[11px] font-black text-purple-400">{formatRupiah(g.discount_price || g.price)}</span>
                    {g.discount_price > 0 && g.price > g.discount_price && (
                      <span className="text-[8px] text-gray-600 line-through ml-2">{formatRupiah(g.price)}</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-center hidden md:table-cell">
                    <span className="text-[11px] font-black text-gray-400">{(g.sold_count || 0).toLocaleString('id-ID')}</span>
                  </td>
                  <td className="py-4 px-5 text-center hidden md:table-cell">
                    {g.is_trending ? (
                      <span className="text-[8px] font-black text-red-500 bg-red-500/10 border border-red-500/20 px-2.5 py-1 rounded-lg uppercase tracking-wider">Trending</span>
                    ) : (
                      <span className="text-[8px] text-gray-700 font-bold">—</span>
                    )}
                  </td>
                  <td className="py-4 px-5 text-right">
                    <div className="flex items-center justify-end gap-1.5 md:opacity-0 md:group-hover:opacity-100 transition-all">
                      <button onClick={() => prepareEdit(g)} className="px-3.5 py-2 bg-white/[0.04] hover:bg-white/[0.08] rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all">
                        Edit
                      </button>
                      <button onClick={() => deleteGame(g.id)} className="px-3.5 py-2 bg-red-500/10 text-red-400 hover:bg-red-500/20 rounded-xl text-[8px] font-bold uppercase tracking-wider transition-all">
                        Hapus
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {games.length === 0 && (
          <div className="text-center py-16">
            <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
              <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
            </div>
            <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada game</p>
          </div>
        )}
      </div>
    </div>
  )
}
