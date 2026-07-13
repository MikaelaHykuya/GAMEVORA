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
    const [settingsRes, tiersRes] = await Promise.all([
      supabase.from('affiliate_settings').select('*').eq('id', 1).single(),
      supabase.from('affiliate_tiers').select('*').order('rank_order', { ascending: true })
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
    setLoading(false)
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
    const numFields = ['commission_rate', 'min_sales', 'min_omzet']
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
        min_omzet: Number(t.min_omzet),
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
                  <label className="block text-xs text-gray-500 mb-1">Min Sales Naik</label>
                  <input type="number" value={t.min_sales} onChange={e => updateTier(t.id, 'min_sales', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white outline-none focus:border-purple-500" />
                </div>
                <div className="col-span-2">
                  <label className="block text-xs text-gray-500 mb-1">Min Omzet Naik (Rp)</label>
                  <input type="number" value={t.min_omzet} onChange={e => updateTier(t.id, 'min_omzet', e.target.value)} className="w-full bg-black/60 border border-white/10 rounded-md p-2 text-white outline-none focus:border-purple-500" />
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
    </div>
  )
}
