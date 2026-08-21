export default function AdminGiveaway({ giveaways, giveawayTitle, setGiveawayTitle, giveawayDesc, setGiveawayDesc, giveawayGameId, setGiveawayGameId, giveawayWinners, setGiveawayWinners, giveawayDuration, setGiveawayDuration, games, createGiveaway, endingGiveaway, endGiveaway, giveawayEntries, entriesLoading, viewGiveawayEntries, setGiveawayEntries }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 relative">
      {/* Left Column: Create Form */}
      <div className="lg:col-span-5 relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 overflow-hidden shadow-2xl shadow-black group">
        <div className="absolute top-0 right-0 w-64 h-64 bg-pink-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 transition-colors duration-700" />
        
        <div className="relative z-10 mb-8 flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-pink-500/20 to-rose-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-pink-500/10">
            <svg className="w-6 h-6 text-pink-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
            </svg>
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Buat Giveaway</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Sistem Undian Otomatis</p>
          </div>
        </div>

        <div className="relative z-10 space-y-5">
          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 flex items-center gap-2">
              Judul <span className="text-pink-500">*</span>
            </label>
            <input type="text" value={giveawayTitle} onChange={e => setGiveawayTitle(e.target.value)}
              className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-pink-500/40 focus:bg-white/[0.02] transition-all shadow-inner placeholder:text-gray-600"
              placeholder="e.g. Summer Epic Giveaway" />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Deskripsi</label>
            <textarea value={giveawayDesc} onChange={e => setGiveawayDesc(e.target.value)} rows={3}
              className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white resize-none focus:border-pink-500/40 focus:bg-white/[0.02] transition-all shadow-inner placeholder:text-gray-600 custom-scrollbar"
              placeholder="Jelaskan syarat & hadiah..." />
          </div>

          <div className="space-y-2">
            <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 flex items-center gap-2">
              Game Hadiah <span className="text-pink-500">*</span>
            </label>
            <div className="relative">
              <select value={giveawayGameId} onChange={e => setGiveawayGameId(e.target.value)}
                className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white appearance-none cursor-pointer focus:border-pink-500/40 focus:bg-white/[0.02] transition-all shadow-inner">
                <option value="" className="bg-[#0A0A0C] text-gray-400">Pilih game untuk dibagikan...</option>
                {games.map(g => <option key={g.id} value={g.id} className="bg-[#0A0A0C] text-white">{g.title}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
                <svg className="w-5 h-5 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 9l4-4 4 4m0 6l-4 4-4-4" />
                </svg>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Jml Pemenang</label>
              <div className="relative">
                <input type="number" min="1" max="10" value={giveawayWinners} onChange={e => setGiveawayWinners(Number(e.target.value))}
                  className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl pl-10 pr-4 py-4 text-sm outline-none text-white focus:border-pink-500/40 focus:bg-white/[0.02] transition-all shadow-inner" />
                <svg className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
              </div>
            </div>
            <div className="space-y-2">
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Durasi (Jam)</label>
              <div className="relative">
                <input type="number" min="1" max="720" value={giveawayDuration} onChange={e => setGiveawayDuration(Number(e.target.value))}
                  className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl pl-10 pr-4 py-4 text-sm outline-none text-white focus:border-pink-500/40 focus:bg-white/[0.02] transition-all shadow-inner" />
                <svg className="w-4 h-4 text-gray-500 absolute left-4 top-1/2 -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
              </div>
            </div>
          </div>

          <button onClick={createGiveaway} disabled={!giveawayTitle.trim() || !giveawayGameId}
            className="w-full mt-2 bg-gradient-to-r from-pink-600 to-rose-500 text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase active-scale hover:shadow-[0_0_20px_rgba(244,63,94,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center gap-3">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
            </svg>
            Buat Giveaway
          </button>
        </div>
      </div>

      {/* Right Column: List */}
      <div className="lg:col-span-7 relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 overflow-hidden shadow-2xl shadow-black">
        <div className="absolute bottom-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-[100px] translate-y-1/2 translate-x-1/3" />
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <div>
            <h2 className="text-xl font-black tracking-tight text-white">Daftar Giveaway</h2>
            <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Riwayat & Status Undian</p>
          </div>
          <div className="px-4 py-2 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase text-gray-300">
            Total: {giveaways.length}
          </div>
        </div>

        <div className="relative z-10 space-y-4 max-h-[600px] overflow-y-auto custom-scrollbar pr-2">
          {giveaways.length === 0 ? (
            <div className="text-center py-20">
              <div className="w-16 h-16 mx-auto mb-5 rounded-2xl bg-white/[0.03] border border-white/[0.05] flex items-center justify-center">
                <svg className="w-8 h-8 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-xs text-gray-500 font-black uppercase tracking-widest">Belum ada giveaway</p>
            </div>
          ) : giveaways.map(g => (
            <div key={g.id} className="group relative bg-[#0A0A0C]/60 border border-white/[0.06] rounded-2xl p-6 hover:border-white/[0.15] hover:bg-white/[0.02] transition-all duration-300">
              <div className="flex items-start justify-between mb-5">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-white/10 flex items-center justify-center shrink-0">
                    <svg className="w-6 h-6 text-indigo-400 group-hover:scale-110 transition-transform" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-base font-black text-gray-200 group-hover:text-white transition-colors">{g.title}</p>
                    <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-1 line-clamp-1">{g.games?.title || 'Unknown Game'}</p>
                  </div>
                </div>
                <div className={`px-4 py-1.5 rounded-xl text-[9px] font-black uppercase tracking-widest border shadow-lg ${
                  g.status === 'active' ? 'text-green-400 border-green-500/30 bg-green-500/10 shadow-green-500/10' :
                  g.status === 'ended' ? 'text-gray-400 border-gray-500/30 bg-gray-500/10 shadow-gray-500/10' :
                  'text-red-400 border-red-500/30 bg-red-500/10 shadow-red-500/10'
                }`}>
                  <span className="flex items-center gap-1.5">
                    {g.status === 'active' && <span className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />}
                    {g.status}
                  </span>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                {g.status === 'active' && (
                  <button onClick={() => endGiveaway(g.id)} disabled={endingGiveaway === g.id}
                    className="flex-1 bg-red-500/10 border border-red-500/20 text-red-400 font-black py-3 rounded-xl text-[9px] tracking-[0.1em] uppercase hover:bg-red-500/20 hover:border-red-500/40 transition-all active-scale disabled:opacity-50 shadow-inner flex items-center justify-center gap-2">
                    {endingGiveaway === g.id ? (
                      <><span className="w-3 h-3 border-2 border-red-400 border-t-transparent rounded-full animate-spin" /> Memilih...</>
                    ) : (
                      <><svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0zM9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" /></svg> Akhiri & Pilih Winner</>
                    )}
                  </button>
                )}
                <button onClick={() => viewGiveawayEntries(g.id)}
                  className="flex-1 bg-white/5 border border-white/10 text-gray-300 font-black py-3 rounded-xl text-[9px] tracking-[0.1em] uppercase hover:bg-white/10 hover:text-white transition-all active-scale shadow-inner flex items-center justify-center gap-2">
                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                  </svg>
                  Lihat Peserta
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
