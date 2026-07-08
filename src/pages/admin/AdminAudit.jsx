export default function AdminAudit({ auditLogs, fetchAuditLogs }) {
  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Logs', value: auditLogs.length, color: 'from-purple-600 to-purple-500', icon: 'M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z' },
          { label: 'Hari Ini', value: auditLogs.filter(l => new Date(l.created_at).toDateString() === new Date().toDateString()).length, color: 'from-blue-600 to-blue-500', icon: 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z' },
          { label: 'Unique Admin', value: [...new Set(auditLogs.map(l => l.admin_name))].length, color: 'from-emerald-600 to-emerald-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Aksi Terakhir', value: auditLogs[0]?.action?.replace(/_/g, ' ') || '-', color: 'from-amber-600 to-amber-500', icon: 'M13 10V3L4 14h7v7l9-11h-7z' },
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
            <p className={`text-2xl font-black bg-gradient-to-r ${card.color} bg-clip-text text-transparent`}>{card.value}</p>
          </div>
        ))}
      </div>
      <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-white/[0.04]">
          <h2 className="text-xs font-black uppercase tracking-tight">Activity Log</h2>
          <button onClick={fetchAuditLogs} className="text-[8px] font-black text-purple-400 hover:text-purple-300 transition-all px-3 py-1.5 bg-purple-500/10 border border-purple-500/20 rounded-xl">
            Refresh
          </button>
        </div>
        <div className="overflow-auto max-h-[480px] no-scrollbar">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Waktu</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Admin</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Aksi</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden lg:table-cell">Target</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden xl:table-cell">Detail</th>
              </tr>
            </thead>
            <tbody>
              {auditLogs.length === 0 ? (
                <tr><td colSpan="5" className="text-center py-16">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" /></svg>
                  </div>
                  <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">No audit logs</p>
                </td></tr>
              ) : (
                auditLogs.map((log, i) => (
                  <tr key={log.id} className={`border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group ${i % 2 === 0 ? 'bg-white/[0.01]' : ''}`}>
                    <td className="py-4 px-5 text-[9px] text-gray-500 font-mono whitespace-nowrap hidden md:table-cell">
                      {new Date(log.created_at).toLocaleString('id-ID')}
                    </td>
                    <td className="py-4 px-5 text-[10px] font-bold whitespace-nowrap truncate max-w-[80px] sm:max-w-none">{log.admin_name}</td>
                    <td className="py-4 px-5">
                      <span className="text-[8px] font-black uppercase tracking-widest px-2.5 py-1 rounded-lg border bg-purple-500/10 text-purple-400 border-purple-500/20">
                        {log.action.replace(/_/g, ' ')}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[9px] text-gray-400 font-mono max-w-[130px] truncate hidden lg:table-cell" title={log.target_id}>
                      {log.target_type ? `${log.target_type}#${log.target_id?.slice(0, 8)}` : '-'}
                    </td>
                    <td className="py-4 px-5 text-[9px] text-gray-500 max-w-[220px] truncate hidden xl:table-cell" title={log.details ? JSON.stringify(log.details, null, 1) : ''}>
                      {log.details ? JSON.stringify(log.details).slice(0, 70) + (JSON.stringify(log.details).length > 70 ? '…' : '') : '-'}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}
