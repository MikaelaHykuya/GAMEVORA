import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { useState, useEffect } from 'react'

export default function AdminUsers({ users, searchUsers, setSearchUsers, getAvatarUrl, viewUserOrders, fetchUsers }) {
  const { showToast } = useToast()
  const [tiers, setTiers] = useState([])
  const [showAffiliatesOnly, setShowAffiliatesOnly] = useState(false)

  useEffect(() => {
    supabase.from('affiliate_tiers').select('id, name, color').order('rank_order', { ascending: true })
      .then(({ data }) => setTiers(data || []))
  }, [])

  return (
    <div>
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
        {[
          { label: 'Total Users', value: users.length, color: 'from-purple-600 to-purple-500', icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z' },
          { label: 'Admins', value: users.filter(u => u.role === 'admin').length, color: 'from-rose-600 to-rose-500', icon: 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z' },
          { label: 'With Games', value: users.filter(u => u.game_count > 0).length, color: 'from-emerald-600 to-emerald-500', icon: 'M15 5v2m0 4v2m0 4v2M5 5a2 2 0 00-2 2v3a2 2 0 110 4v3a2 2 0 002 2h14a2 2 0 002-2v-3a2 2 0 110-4V7a2 2 0 00-2-2H5z' },
          { label: 'Bulan Ini', value: users.filter(u => { const d = new Date(u.created_at); const now = new Date(); return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear(); }).length, color: 'from-blue-600 to-blue-500', icon: 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z' },
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
        <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 px-5 py-4 border-b border-white/[0.04]">
          <div className="flex items-center gap-4">
            <h2 className="text-xs font-black uppercase tracking-tight">All Users</h2>
            <button 
              onClick={() => setShowAffiliatesOnly(!showAffiliatesOnly)}
              className={`px-3 py-1.5 rounded-lg text-[9px] font-bold uppercase tracking-wider border transition-colors ${
                showAffiliatesOnly 
                  ? 'bg-purple-500/20 border-purple-500/50 text-purple-300' 
                  : 'bg-zinc-900/60 border-white/[0.06] text-gray-500 hover:text-white'
              }`}
            >
              ⭐ Affiliates Only
            </button>
          </div>
          <div className="relative w-full md:w-72">
            <svg className="absolute left-3.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input type="text" placeholder="Cari User..." value={searchUsers} onChange={e => setSearchUsers(e.target.value)}
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl pl-9 pr-4 py-2.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
          </div>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-white/[0.04]">
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">User</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden sm:table-cell">Email</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden md:table-cell">Role</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Games</th>
                <th className="text-center py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden xl:table-cell">Orders</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden lg:table-cell">Kode Affiliate</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden lg:table-cell">Tier</th>
                <th className="text-right py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest">Total Komisi</th>
                <th className="text-left py-4 px-5 text-[9px] text-gray-600 font-black uppercase tracking-widest hidden xl:table-cell">Joined</th>
              </tr>
            </thead>
            <tbody>
              {users.length === 0 ? (
                <tr><td colSpan="7" className="text-center py-16">
                  <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                    <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <p className="text-[11px] text-gray-600 font-black uppercase tracking-wider">Belum ada user</p>
                </td></tr>
              ) : (
                users
                  .filter(u => showAffiliatesOnly ? (u.affiliate_code || u.affiliate_tier_id) : true)
                  .filter(u => (u.full_name||'').toLowerCase().includes(searchUsers.toLowerCase()) || (u.email||'').toLowerCase().includes(searchUsers.toLowerCase()))
                  .map(u => (
                  <tr key={u.id} className="border-b border-white/[0.02] hover:bg-white/[0.02] transition-all group">
                    <td className="py-4 px-5">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-600 to-purple-400 overflow-hidden border border-white/10 flex-shrink-0">
                          <img src={u.avatar_url || getAvatarUrl(u.full_name || u.email)} className="w-full h-full object-cover" alt="" />
                        </div>
                        <div>
                          <p className="text-[11px] font-bold leading-tight">{u.full_name || '—'}</p>
                          <p className="text-[8px] text-gray-600 mt-0.5">#{u.id?.slice(0, 6)}</p>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-[10px] text-gray-400 truncate max-w-[100px] hidden sm:table-cell">{u.email || '—'}</td>
                    <td className="py-4 px-5 hidden md:table-cell">
                      <span className={`px-2.5 py-1 rounded-lg text-[7px] font-black border uppercase tracking-wider ${
                        u.role === 'admin' ? 'text-red-400 bg-red-500/10 border-red-500/20' : 'text-gray-400 bg-zinc-800/60 border-white/[0.06]'
                      }`}>
                        {u.role || 'user'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-center">
                      <span className="text-[12px] font-black text-purple-400">{u.game_count}</span>
                    </td>
                    <td className="py-4 px-5 text-center hidden xl:table-cell">
                      <button onClick={() => viewUserOrders(u.id, u.full_name || u.email)}
                        className="px-3 py-1.5 bg-blue-500/10 border border-blue-500/20 rounded-xl text-[7px] font-black text-blue-400 hover:bg-blue-500/20 transition-all uppercase tracking-wider opacity-100">
                        Lihat
                      </button>
                    </td>
                    <td className="py-4 px-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        <span className="text-[9px] font-bold text-purple-400 font-mono">{u.affiliate_code || '—'}</span>
                        <button onClick={() => {
                          const code = prompt('Set kode voucher untuk ' + (u.full_name || u.email) + ':', u.affiliate_code || '')
                          if (code !== null && code.trim()) {
                            supabase.from('profiles').update({ affiliate_code: code.trim().toUpperCase() }).eq('id', u.id).then(({ error }) => {
                              if (error) showToast('Error: ' + error.message, 'error')
                              else { showToast('Kode voucher diupdate!', 'success'); fetchUsers() }
                            })
                          } else if (code !== null && code === '') {
                            supabase.from('profiles').update({ affiliate_code: null }).eq('id', u.id).then(({ error }) => {
                              if (error) showToast('Error: ' + error.message, 'error')
                              else { showToast('Kode voucher dihapus!', 'success'); fetchUsers() }
                            })
                          }
                        }}
                          className="px-2 py-1 bg-purple-500/10 border border-purple-500/20 rounded-lg text-[7px] font-black text-purple-400 hover:bg-purple-500/20 transition-all uppercase tracking-wider md:opacity-0 md:group-hover:opacity-100">
                          Edit
                        </button>
                      </div>
                    </td>
                    <td className="py-4 px-5 hidden lg:table-cell">
                      <div className="flex items-center gap-2">
                        {u.affiliate_tier_id ? (
                          <span className={`text-[9px] font-bold uppercase ${tiers.find(t => t.id === u.affiliate_tier_id)?.color || 'text-gray-400'}`}>
                            {tiers.find(t => t.id === u.affiliate_tier_id)?.name || 'Unknown'}
                          </span>
                        ) : (
                          <span className="text-[9px] font-bold text-gray-600 uppercase">—</span>
                        )}
                        <select 
                          className="px-2 py-1 bg-black/60 border border-white/10 rounded text-[9px] text-white outline-none md:opacity-0 md:group-hover:opacity-100 transition-all cursor-pointer"
                          value={u.affiliate_tier_id || ''}
                          onChange={(e) => {
                            const val = e.target.value === '' ? null : e.target.value
                            supabase.from('profiles').update({ affiliate_tier_id: val }).eq('id', u.id).then(({ error }) => {
                              if (error) showToast('Error: ' + error.message, 'error')
                              else { showToast('Tier diupdate!', 'success'); fetchUsers() }
                            })
                          }}
                        >
                          <option value="">Set Tier</option>
                          {tiers.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                        </select>
                      </div>
                    </td>
                    <td className="py-4 px-5 text-right">
                      <span className="text-[10px] font-bold text-green-400 font-mono">
                        {u.total_earned ? new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(u.total_earned) : 'Rp 0'}
                      </span>
                    </td>
                    <td className="py-4 px-5 text-[9px] font-bold text-gray-600 uppercase whitespace-nowrap hidden xl:table-cell">
                      {u.created_at ? new Date(u.created_at).toLocaleDateString('id-ID') : '—'}
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
