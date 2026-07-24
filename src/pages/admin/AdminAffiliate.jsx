import { useState, useEffect } from 'react'
import { supabase } from '../../lib/supabase'
import { useToast } from '../../contexts/ToastContext'
import { FaSave, FaCheck, FaEdit, FaLock, FaUnlock, FaPlus, FaTrash } from 'react-icons/fa'
import { motion, AnimatePresence } from 'framer-motion'

export default function AdminAffiliate() {
  const { showToast } = useToast()
  const [settings, setSettings] = useState(null)
  const [tiers, setTiers] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [applications, setApplications] = useState([])
  const [gameRequests, setGameRequests] = useState([])
  const [affiliates, setAffiliates] = useState([])
  const [games, setGames] = useState([])
  const [assignGameUserId, setAssignGameUserId] = useState('')
  const [assignGameId, setAssignGameId] = useState('')
  
  // Settings Form State
  const [tierMode, setTierMode] = useState('automatic')
  const [tierMetric, setTierMetric] = useState('sales')
  const [minWithdraw, setMinWithdraw] = useState(50000)
  const [autoApproveWithdraw, setAutoApproveWithdraw] = useState(false)
  const [referralBonuses, setReferralBonuses] = useState([])

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    setLoading(true)
    const [settingsRes, tiersRes, appsRes, greqsRes, affRes, gRes] = await Promise.all([
      supabase.from('affiliate_settings').select('*').eq('id', 1).single(),
      supabase.from('affiliate_tiers').select('*').order('rank_order', { ascending: true }),
      supabase.from('affiliate_applications').select('*, profiles(email, full_name)').order('created_at', { ascending: false }),
      supabase.from('affiliate_game_requests').select('*, profiles(email, full_name), games(title)').order('created_at', { ascending: false }),
      supabase.from('profiles').select('id, email, full_name, affiliate_code').not('affiliate_code', 'is', null),
      supabase.from('games').select('id, title').order('title', { ascending: true })
    ])

    if (settingsRes.data) {
      setSettings(settingsRes.data)
      setTierMode(settingsRes.data.tier_mode || 'automatic')
      setTierMetric(settingsRes.data.tier_metric || 'sales')
      setMinWithdraw(settingsRes.data.min_withdraw || 50000)
      setAutoApproveWithdraw(settingsRes.data.auto_approve_withdraw || false)
      setReferralBonuses(settingsRes.data.referral_bonuses || [])
    }
    if (tiersRes.data) {
      setTiers(tiersRes.data)
    }
    if (appsRes.data) setApplications(appsRes.data)
    if (greqsRes.data) setGameRequests(greqsRes.data)
    if (affRes.data) setAffiliates(affRes.data)
    if (gRes.data) setGames(gRes.data)
    setLoading(false)
  }

  async function handleApproveApp(id, userId, code) {
    await supabase.from('affiliate_applications').update({ status: 'approved' }).eq('id', id)
    await supabase.from('profiles').update({ affiliate_code: code }).eq('id', userId)
    fetchData()
    showToast('Affiliate disetujui!', 'success')
  }

  async function handleRejectApp(id, userId) {
    const reason = window.prompt("Alasan penolakan (opsional):")
    if (reason === null) return
    
    const rejectionReason = reason || 'Tanpa alasan'
    await supabase.from('affiliate_applications').update({ status: 'rejected' }).eq('id', id)
    fetchData()
    showToast('Affiliate ditolak', 'info')
    
    const title = 'Pengajuan Affiliate Ditolak'
    const message = `Pengajuan affiliate Anda ditolak. Alasan: ${rejectionReason}`
    await supabase.from('vault_notifications').insert([{ user_id: userId, title, message }])
    supabase.functions.invoke('send-push', { body: { title, message, target_user_id: userId } }).catch(console.error)
  }

  async function handleApproveGameReq(id, userId, gameId) {
    const { error: reqError } = await supabase.from('affiliate_game_requests').update({ status: 'approved' }).eq('id', id)
    if (reqError) { showToast('Gagal update status request', 'error'); return; }

    const { data, error } = await supabase.functions.invoke('admin-grant-game', {
      body: { user_id: userId, game_id: gameId }
    })
    
    if (error || (data && data.error)) {
      showToast('Gagal memasukkan game ke vault: ' + (error?.message || data?.error), 'error')
      return
    }

    fetchData()
    showToast('Game diberikan ke Affiliate!', 'success')
  }

  async function handleRejectGameReq(id) {
    await supabase.from('affiliate_game_requests').update({ status: 'rejected' }).eq('id', id)
    fetchData()
    showToast('Request game ditolak', 'info')
  }

  async function handleAssignGame() {
    if (!assignGameUserId || !assignGameId) return showToast('Pilih Affiliate dan Game', 'warning')
    setSaving(true)
    const { error } = await supabase.from('library').insert({
      user_id: assignGameUserId,
      game_id: assignGameId,
      status: 'approved',
      is_giveaway: true,
      purchase_date: new Date().toISOString()
    })
    if (error) showToast('Gagal memberikan game', 'error')
    else showToast('Game berhasil ditambahkan ke library affiliate', 'success')
    setAssignGameUserId('')
    setAssignGameId('')
    setSaving(false)
  }

  async function saveSettings() {
    setSaving(true)
    const { error } = await supabase.from('affiliate_settings').update({
      tier_mode: tierMode,
      tier_metric: tierMetric,
      min_withdraw: Number(minWithdraw),
      auto_approve_withdraw: autoApproveWithdraw,
      referral_bonuses: referralBonuses
    }).eq('id', 1)

    if (error) showToast('Gagal menyimpan pengaturan', 'error')
    else showToast('Pengaturan Affiliate tersimpan!', 'success')
    setSaving(false)
  }

  async function updateTier(id, field, value) {
    const numFields = ['commission_rate', 'min_sales']
    const updatedTiers = tiers.map(t => t.id === id ? { ...t, [field]: numFields.includes(field) ? Number(value) : value } : t)
    setTiers(updatedTiers)
  }

  async function saveTiers() {
    setSaving(true)
    let hasError = false
    for (const t of tiers) {
      const { error } = await supabase.from('affiliate_tiers').update({
        commission_rate: Number(t.commission_rate),
        min_sales: Number(t.min_sales),
        is_active: t.is_active,
        benefits: t.benefits
      }).eq('id', t.id)
      if (error) { hasError = true; console.error('Tier save error:', t.name, error) }
    }
    
    if (hasError) showToast('Beberapa tier gagal disimpan', 'error')
    else showToast('Pengaturan Tier tersimpan!', 'success')
    setSaving(false)
  }

  const addBonus = () => {
    setReferralBonuses([...referralBonuses, { milestone: 10, reward: 50000 }])
  }

  const updateBonus = (index, field, value) => {
    const newBonuses = [...referralBonuses]
    newBonuses[index][field] = Number(value)
    setReferralBonuses(newBonuses)
  }

  const removeBonus = (index) => {
    setReferralBonuses(referralBonuses.filter((_, i) => i !== index))
  }

  if (loading) return <div className="text-gray-400 p-8">Loading Affiliate Data...</div>

  return (
    <div className="space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
      
      {/* Global Settings */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Global Affiliate Settings</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
          <div>
            <label className="block text-sm text-gray-400 mb-2">Mode Kenaikan Tier</label>
            <select 
              value={tierMode} onChange={e => setTierMode(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
            >
              <option value="automatic">Automatic (Auto Naik)</option>
              <option value="manual">Manual (Oleh Admin)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Metode Kenaikan Tier</label>
            <select 
              value={tierMetric} onChange={e => setTierMetric(e.target.value)}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
              disabled={tierMode === 'manual'}
            >
              <option value="sales">Berdasarkan Total Sales (Jumlah)</option>
              <option value="omzet">Berdasarkan Total Omzet (Rupiah)</option>
            </select>
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Minimal Withdraw (Rp)</label>
              <input 
              type="number" value={minWithdraw} onChange={e => setMinWithdraw(Number(e.target.value))}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-gray-400 mb-2">Auto Approve Withdraw?</label>
            <select 
              value={autoApproveWithdraw ? 'yes' : 'no'} onChange={e => setAutoApproveWithdraw(e.target.value === 'yes')}
              className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none"
            >
              <option value="no">Manual Approval (Aman)</option>
              <option value="yes">Auto Approve (Langsung Success)</option>
            </select>
          </div>
        </div>

        {/* Bonus Milestones */}
        <div className="mb-6">
          <div className="flex justify-between items-center mb-4">
            <label className="block text-sm text-gray-400">Bonus Milestone Referral</label>
            <button onClick={addBonus} className="text-xs bg-purple-500/20 text-purple-400 px-3 py-1 rounded-md hover:bg-purple-500/30 flex items-center gap-1">
              <FaPlus /> Tambah Bonus
            </button>
          </div>
          <div className="space-y-3">
            {referralBonuses.map((bonus, i) => (
              <div key={i} className="flex gap-4 items-center bg-black/50 p-3 rounded-lg border border-white/5">
                <div>
                  <span className="text-xs text-gray-500">Mencapai Sales:</span>
                  <input type="number" value={bonus.milestone} onChange={e => updateBonus(i, 'milestone', e.target.value)} className="w-24 bg-transparent border-b border-white/20 text-white p-1 ml-2 outline-none focus:border-purple-500" />
                </div>
                <div>
                  <span className="text-xs text-gray-500">Bonus Rp:</span>
                  <input type="number" value={bonus.reward} onChange={e => updateBonus(i, 'reward', e.target.value)} className="w-32 bg-transparent border-b border-white/20 text-white p-1 ml-2 outline-none focus:border-purple-500" />
                </div>
                <button onClick={() => removeBonus(i)} className="text-red-400 hover:text-red-300 ml-auto p-2"><FaTrash /></button>
              </div>
            ))}
            {referralBonuses.length === 0 && <div className="text-sm text-gray-500 italic">Belum ada bonus yang diset.</div>}
          </div>
        </div>

        <button 
          onClick={saveSettings} disabled={saving}
          className="flex items-center gap-2 bg-purple-600 hover:bg-purple-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          <FaSave /> {saving ? 'Menyimpan...' : 'Simpan Settings'}
        </button>
      </div>

      {/* Tier Settings */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <div className="flex justify-between items-center mb-6 border-b border-white/10 pb-4">
          <h2 className="text-xl font-bold text-white">Tier Management</h2>
          <button 
            onClick={saveTiers} disabled={saving}
            className="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-6 py-2 rounded-lg font-medium transition-colors"
          >
            <FaSave /> Simpan Tiers
          </button>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          {tiers.map((t) => (
            <div key={t.id} className="bg-black/40 border border-white/10 rounded-xl p-5 relative overflow-hidden">
              <div className={`absolute top-0 right-0 w-32 h-32 ${t.color.replace('text-', 'bg-')}/10 blur-3xl -mr-10 -mt-10`} />
              
              <div className="flex justify-between items-center mb-4">
                <h3 className={`text-xl font-bold ${t.color}`}>{t.name} <span className="text-xs text-gray-500 ml-2">(Rank {t.rank_order})</span></h3>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-gray-400">Aktif?</span>
                  <input type="checkbox" checked={t.is_active} onChange={e => updateTier(t.id, 'is_active', e.target.checked)} className="accent-purple-500 w-4 h-4" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Komisi (%)</label>
                  <input type="number" value={t.commission_rate} onChange={e => updateTier(t.id, 'commission_rate', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white outline-none focus:border-purple-500" />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">Min Penjualan Naik Tier</label>
                  <input type="number" value={t.min_sales} onChange={e => updateTier(t.id, 'min_sales', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white outline-none focus:border-purple-500" />
                </div>
              </div>

              <div>
                <label className="block text-xs text-gray-500 mb-2">Benefit (Pisahkan dengan baris baru)</label>
                <textarea 
                  rows="3"
                  value={t.benefits ? t.benefits.join('\n') : ''} 
                  onChange={e => updateTier(t.id, 'benefits', e.target.value.split('\n').filter(b => b.trim()))}
                  className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-xs text-white outline-none focus:border-purple-500"
                  placeholder="Misal: Priority Support"
                />
              </div>

            </div>
          ))}
        </div>

      </div>

      {/* Affiliate Applications */}
      <div className="bg-[#111] border border-white/10 rounded-xl p-6">
        <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Pengajuan Affiliate Baru</h2>
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-white/10 text-xs text-gray-500 uppercase">
                <th className="pb-3 px-4">User</th>
                <th className="pb-3 px-4">Store / Sosmed</th>
                <th className="pb-3 px-4">Kode Request</th>
                <th className="pb-3 px-4">Status</th>
                <th className="pb-3 px-4 text-right">Aksi</th>
              </tr>
            </thead>
            <tbody>
              {applications.length === 0 ? (
                <tr><td colSpan="5" className="py-8 text-center text-gray-500">Belum ada pengajuan</td></tr>
              ) : (
                applications.map(app => (
                  <tr key={app.id} className="border-b border-white/5 hover:bg-white/5 transition-colors text-sm">
                    <td className="py-3 px-4">
                      <div className="font-bold text-white">{app.profiles?.full_name || 'No Name'}</div>
                      <div className="text-xs text-gray-500">{app.profiles?.email}</div>
                    </td>
                    <td className="py-3 px-4 text-gray-300">{app.store_name}</td>
                    <td className="py-3 px-4 text-purple-400 font-mono">{app.requested_code}</td>
                    <td className="py-3 px-4">
                      <span className={`px-2 py-1 rounded text-xs uppercase font-bold tracking-wider ${
                        app.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                        app.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                      }`}>{app.status}</span>
                    </td>
                    <td className="py-3 px-4 text-right">
                      {app.status === 'pending' && (
                        <>
                          <button onClick={() => handleApproveApp(app.id, app.user_id, app.requested_code)} className="text-green-400 hover:bg-green-500/20 p-2 rounded-lg" title="Setujui"><FaCheck /></button>
                          <button onClick={() => handleRejectApp(app.id, app.user_id)} className="text-red-400 hover:bg-red-500/20 p-2 rounded-lg" title="Tolak"><FaTrash /></button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Affiliate Game Requests & Assignment */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        <div className="bg-[#111] border border-white/10 rounded-xl p-6">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Request Game Affiliate</h2>
          <div className="space-y-4 max-h-[400px] overflow-y-auto pr-2 custom-scrollbar">
            {gameRequests.length === 0 ? (
              <div className="text-center py-8 text-gray-500">Belum ada request game</div>
            ) : (
              gameRequests.map(req => (
                <div key={req.id} className="bg-black/40 border border-white/10 rounded-xl p-4">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <div className="font-bold text-white text-sm">{req.games?.title}</div>
                      <div className="text-xs text-purple-400">{req.profiles?.full_name || req.profiles?.email}</div>
                    </div>
                    <span className={`px-2 py-1 rounded text-[10px] uppercase font-bold tracking-wider ${
                      req.status === 'approved' ? 'bg-green-500/10 text-green-400' :
                      req.status === 'rejected' ? 'bg-red-500/10 text-red-400' : 'bg-yellow-500/10 text-yellow-400'
                    }`}>{req.status}</span>
                  </div>
                  <div className="text-xs text-gray-400 bg-black/60 p-2 rounded mb-3 mt-2 border border-white/5">
                    "{req.reason}"
                  </div>
                  {req.status === 'pending' && (
                    <div className="flex gap-2">
                      <button onClick={() => handleApproveGameReq(req.id, req.user_id, req.game_id)} className="flex-1 bg-green-600/20 text-green-400 hover:bg-green-600/40 py-1.5 rounded-lg transition-colors text-xs font-bold">Berikan Game</button>
                      <button onClick={() => handleRejectGameReq(req.id)} className="flex-1 bg-red-600/20 text-red-400 hover:bg-red-600/40 py-1.5 rounded-lg transition-colors text-xs font-bold">Tolak</button>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        <div className="bg-[#111] border border-white/10 rounded-xl p-6 h-fit">
          <h2 className="text-xl font-bold text-white mb-6 border-b border-white/10 pb-4">Beri Game ke Affiliate</h2>
          <div className="space-y-4">
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pilih Affiliate</label>
              <select value={assignGameUserId} onChange={e => setAssignGameUserId(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
                <option value="">-- Pilih Affiliate --</option>
                {affiliates.map(a => (
                  <option key={a.id} value={a.id}>{a.full_name || a.email} ({a.affiliate_code})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm text-gray-400 mb-2">Pilih Game</label>
              <select value={assignGameId} onChange={e => setAssignGameId(e.target.value)} className="w-full bg-black border border-white/10 rounded-lg p-3 text-white focus:border-purple-500 outline-none">
                <option value="">-- Pilih Game --</option>
                {games.map(g => (
                  <option key={g.id} value={g.id}>{g.title}</option>
                ))}
              </select>
            </div>
            <button 
              onClick={handleAssignGame} disabled={saving}
              className="w-full bg-purple-600 hover:bg-purple-500 text-white px-6 py-3 rounded-lg font-bold transition-colors mt-2 uppercase tracking-widest text-xs"
            >
              {saving ? 'Memproses...' : 'Kirim Game'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
