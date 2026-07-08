export default function AdminBroadcast({ broadcastTitle, setBroadcastTitle, broadcastMessage, setBroadcastMessage, broadcastType, setBroadcastType, sendBroadcast }) {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6 max-w-xl">
      <p className="text-[10px] text-gray-500 font-black uppercase tracking-widest mb-6">Broadcast Message</p>
      <div className="space-y-4">
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Title</label>
          <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
            className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white focus:border-purple-500/40 transition-all"
            placeholder="e.g. Maintenance" />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Message</label>
          <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4}
            className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 text-sm outline-none text-white resize-none focus:border-purple-500/40 transition-all"
            placeholder="Type your announcement..." />
        </div>
        <div className="space-y-1.5">
          <label className="text-[9px] font-black uppercase text-gray-500 tracking-widest">Type</label>
          <div className="flex gap-2">
            {['info', 'maintenance', 'new_game'].map(t => (
              <button key={t} onClick={() => setBroadcastType(t)}
                className={`px-5 py-3 rounded-2xl text-[9px] font-black uppercase tracking-wider transition-all active-scale ${
                  broadcastType === t
                    ? 'bg-gradient-to-r from-purple-600 to-purple-500 text-white shadow-lg shadow-purple-600/20'
                    : 'bg-zinc-800/60 border border-white/[0.06] text-gray-400 hover:text-white'
                }`}>
                {t === 'info' ? 'Info' : t === 'maintenance' ? 'Maintenance' : 'New Game'}
              </button>
            ))}
          </div>
        </div>
        <button onClick={sendBroadcast} disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white font-black py-3.5 rounded-2xl hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300 active:scale-[0.98] text-[11px] tracking-[0.2em] uppercase disabled:opacity-50">
          Kirim Broadcast
        </button>
      </div>
    </div>
  )
}
