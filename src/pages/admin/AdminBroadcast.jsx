export default function AdminBroadcast({ broadcastTitle, setBroadcastTitle, broadcastMessage, setBroadcastMessage, broadcastType, setBroadcastType, sendBroadcast }) {
  return (
    <div className="relative bg-[#0A0A0C]/80 backdrop-blur-3xl border border-white/[0.08] rounded-[2rem] p-8 max-w-2xl overflow-hidden shadow-2xl shadow-black group">
      {/* Glow Orbs */}
      <div className="absolute top-0 right-0 w-64 h-64 bg-purple-500/10 rounded-full blur-[100px] -translate-y-1/2 translate-x-1/3 transition-colors duration-700" />
      <div className="absolute bottom-0 left-0 w-64 h-64 bg-blue-500/10 rounded-full blur-[100px] translate-y-1/2 -translate-x-1/3 transition-colors duration-700" />

      <div className="relative z-10 mb-8 flex items-center gap-4">
        <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-purple-500/20 to-blue-500/20 border border-white/10 flex items-center justify-center shrink-0 shadow-lg shadow-purple-500/10">
          <svg className="w-6 h-6 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />
          </svg>
        </div>
        <div>
          <h2 className="text-xl font-black tracking-tight text-white">Broadcast Message</h2>
          <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest mt-1">Kirim pengumuman ke Discord</p>
        </div>
      </div>

      <div className="relative z-10 space-y-6">
        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 flex items-center gap-2">
            Title
            <span className="text-purple-500">*</span>
          </label>
          <input type="text" value={broadcastTitle} onChange={e => setBroadcastTitle(e.target.value)}
            className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white focus:border-purple-500/40 focus:bg-white/[0.02] transition-all shadow-inner placeholder:text-gray-600"
            placeholder="e.g. Server Maintenance" />
        </div>

        <div className="space-y-2">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1 flex items-center gap-2">
            Message
            <span className="text-purple-500">*</span>
          </label>
          <textarea value={broadcastMessage} onChange={e => setBroadcastMessage(e.target.value)} rows={4}
            className="w-full bg-[#0A0A0C]/80 backdrop-blur-xl border border-white/[0.08] rounded-2xl px-5 py-4 text-sm outline-none text-white resize-none focus:border-purple-500/40 focus:bg-white/[0.02] transition-all shadow-inner placeholder:text-gray-600 custom-scrollbar"
            placeholder="Type your announcement here..." />
        </div>

        <div className="space-y-3">
          <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest pl-1">Broadcast Type</label>
          <div className="grid grid-cols-3 gap-3">
            {[
              { id: 'info', label: 'Info', icon: 'M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-blue-600 to-blue-500', shadow: 'shadow-blue-500/20' },
              { id: 'maintenance', label: 'Maintenance', icon: 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z', color: 'from-yellow-600 to-yellow-500', shadow: 'shadow-yellow-500/20' },
              { id: 'new_game', label: 'New Game', icon: 'M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z M21 12a9 9 0 11-18 0 9 9 0 0118 0z', color: 'from-emerald-600 to-emerald-500', shadow: 'shadow-emerald-500/20' }
            ].map(t => (
              <button key={t.id} onClick={() => setBroadcastType(t.id)}
                className={`relative overflow-hidden flex flex-col items-center justify-center gap-2 p-4 rounded-2xl transition-all duration-300 active-scale ${
                  broadcastType === t.id
                    ? `bg-gradient-to-br ${t.color} text-white shadow-lg ${t.shadow} border border-white/20`
                    : 'bg-white/5 border border-white/10 text-gray-400 hover:bg-white/10 hover:text-white'
                }`}>
                <div className={`absolute inset-0 bg-white/20 opacity-0 transition-opacity ${broadcastType === t.id ? 'opacity-20' : ''}`} />
                <svg className="w-5 h-5 relative z-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d={t.icon} />
                </svg>
                <span className="text-[9px] font-black uppercase tracking-wider relative z-10">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        <button onClick={sendBroadcast} disabled={!broadcastTitle.trim() || !broadcastMessage.trim()}
          className="w-full mt-4 bg-gradient-to-r from-purple-600 to-blue-600 text-white font-black py-4 rounded-2xl text-[10px] tracking-[0.2em] uppercase active-scale hover:shadow-[0_0_20px_rgba(168,85,247,0.4)] transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed border border-white/10 flex items-center justify-center gap-3">
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
          </svg>
          Kirim Broadcast
        </button>
      </div>
    </div>
  )
}
