export default function AdminRequests({ requests, searchRequests, setSearchRequests, updateRequestStatus }) {
  return (
    <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-6">
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-lg font-black uppercase tracking-tight">Game Requests</h2>
        <span className="text-[10px] text-yellow-500 font-black bg-yellow-500/10 px-3 py-1.5 rounded-xl border border-yellow-500/20">
          {requests.length} requests
        </span>
      </div>
      <div className="mb-5 relative">
        <svg className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
        <input type="text" placeholder="Cari Request..." value={searchRequests} onChange={e => setSearchRequests(e.target.value)}
          className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-11 pr-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
      </div>
      {requests.length === 0 ? (
        <p className="text-center py-10 opacity-30 text-[10px] font-black uppercase italic">No game requests yet</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04] text-[8px] text-gray-600 font-black uppercase tracking-widest">
                <th className="pb-4 px-3 text-left hidden md:table-cell">User Email</th>
                <th className="pb-4 px-3 text-left">Game Title</th>
                <th className="pb-4 px-3 text-left hidden sm:table-cell">Notes</th>
                <th className="pb-4 px-3 text-left hidden md:table-cell">Date</th>
                <th className="pb-4 px-3 text-center">Status</th>
                <th className="pb-4 px-3 text-center">Action</th>
              </tr>
            </thead>
            <tbody>
              {requests.filter(r => (r.game_title||'').toLowerCase().includes(searchRequests.toLowerCase()) || (r.user_email||'').toLowerCase().includes(searchRequests.toLowerCase())).map(r => (
                <tr key={r.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all">
                  <td className="py-4 px-3 font-mono text-[9px] text-gray-500 uppercase tracking-tighter max-w-[120px] truncate hidden md:table-cell">{r.user_email || '-'}</td>
                  <td className="py-4 px-3 text-[10px] font-black uppercase truncate max-w-[120px] sm:max-w-none">{r.game_title || '-'}</td>
                  <td className="py-4 px-3 text-[9px] text-gray-400 max-w-[120px] sm:max-w-[300px] truncate hidden sm:table-cell">
                    <span className="text-purple-400 font-bold mr-2">[{r.platform}]</span>
                    {r.notes || '-'}
                  </td>
                  <td className="py-4 px-3 text-[9px] text-gray-500 hidden md:table-cell">{r.created_at ? new Date(r.created_at).toLocaleDateString('id-ID') : '-'}</td>
                  <td className="py-4 px-3 text-center">
                    <span className={`text-[8px] font-black uppercase tracking-widest px-3 py-1.5 rounded-lg border ${
                      r.status === 'fullverified' ? 'text-green-400 border-green-500/30 bg-green-500/10' :
                      r.status === 'proses' ? 'text-blue-400 border-blue-500/30 bg-blue-500/10' :
                      r.status === 'rejected' ? 'text-red-400 border-red-500/30 bg-red-500/10' :
                      'text-yellow-400 border-yellow-500/30 bg-yellow-500/10'
                    }`}>
                      {r.status || 'pending'}
                    </span>
                  </td>
                  <td className="py-4 px-3">
                    <div className="flex items-center justify-center gap-1">
                      <button onClick={() => updateRequestStatus(r.id, 'proses')} className="p-1.5 bg-blue-500/10 text-blue-400 hover:bg-blue-500 hover:text-white rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button onClick={() => updateRequestStatus(r.id, 'fullverified')} className="p-1.5 bg-green-500/10 text-green-400 hover:bg-green-500 hover:text-white rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                      <button onClick={() => updateRequestStatus(r.id, 'rejected')} className="p-1.5 bg-red-500/10 text-red-400 hover:bg-red-500 hover:text-white rounded-lg transition-all">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
