export default function AdminGiveaway({ giveaways, giveawayTitle, setGiveawayTitle, giveawayDesc, setGiveawayDesc, giveawayGameId, setGiveawayGameId, giveawayWinners, setGiveawayWinners, giveawayDuration, setGiveawayDuration, games, createGiveaway, endingGiveaway, endGiveaway, giveawayEntries, entriesLoading, viewGiveawayEntries, setGiveawayEntries }) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Buat Giveaway</p>
        <div className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Judul</label>
            <input type="text" value={giveawayTitle} onChange={e => setGiveawayTitle(e.target.value)}
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
              placeholder="e.g. Summer Giveaway" />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Deskripsi</label>
            <textarea value={giveawayDesc} onChange={e => setGiveawayDesc(e.target.value)} rows={3}
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all"
              placeholder="Deskripsi giveaway..." />
          </div>
          <div className="space-y-1.5">
            <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Game Hadiah</label>
            <div className="relative">
              <select value={giveawayGameId} onChange={e => setGiveawayGameId(e.target.value)}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white appearance-none cursor-pointer focus:border-purple-500/40 transition-all">
                <option value="" className="bg-zinc-900 text-gray-400">Pilih game...</option>
                {games.map(g => <option key={g.id} value={g.id} className="bg-zinc-900 text-white">{g.title}</option>)}
              </select>
              <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-5">
                <svg className="w-4 h-4 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </div>
            </div>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Jumlah Pemenang</label>
              <input type="number" min="1" max="10" value={giveawayWinners} onChange={e => setGiveawayWinners(Number(e.target.value))}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
            </div>
            <div className="space-y-1.5">
              <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Durasi (jam)</label>
              <input type="number" min="1" max="720" value={giveawayDuration} onChange={e => setGiveawayDuration(Number(e.target.value))}
                className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all" />
            </div>
          </div>
          <button onClick={createGiveaway} disabled={!giveawayTitle.trim() || !giveawayGameId}
            className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
            Buat Giveaway
          </button>
        </div>
      </div>
      <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
        <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Daftar Giveaway</p>
        <div className="space-y-3 max-h-[500px] overflow-y-auto no-scrollbar">
          {giveaways.length === 0 ? (
            <p className="text-[9px] text-gray-600 text-center py-10 font-black uppercase tracking-widest">Belum ada giveaway</p>
          ) : giveaways.map(g => (
            <div key={g.id} className="bg-zinc-900/60 border border-white/[0.04] rounded-2xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <p className="text-xs font-black uppercase">{g.title}</p>
                  <p className="text-[9px] text-gray-500 mt-1">{g.games?.title || 'Unknown'}</p>
                </div>
                <span className={`px-3 py-1.5 rounded text-[8px] font-black uppercase border ${
                  g.status === 'active' ? 'text-green-500 border-green-500/30 bg-green-500/10' :
                  g.status === 'ended' ? 'text-gray-500 border-gray-500/30 bg-gray-500/10' :
                  'text-red-500 border-red-500/30 bg-red-500/10'
                }`}>{g.status}</span>
              </div>
              {g.status === 'active' && (
                <button onClick={() => endGiveaway(g.id)} disabled={endingGiveaway === g.id}
                  className="w-full mt-3 bg-red-500/10 border border-red-500/20 text-red-400 font-black py-3 rounded-2xl text-[8px] tracking-wider uppercase hover:bg-red-500/20 transition-all active-scale disabled:opacity-50">
                  {endingGiveaway === g.id ? 'Memilih winner...' : 'Akhiri & Pilih Winner'}
                </button>
              )}
              <button onClick={() => viewGiveawayEntries(g.id)}
                className="w-full mt-2 bg-zinc-800/60 border border-white/[0.04] text-gray-400 font-black py-3 rounded-2xl text-[8px] tracking-wider uppercase hover:bg-zinc-800 hover:text-white transition-all active-scale">
                Lihat Peserta
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
