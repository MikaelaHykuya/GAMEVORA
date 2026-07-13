import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Helmet } from 'react-helmet-async'
import { supabase } from '../lib/supabase'
import Navbar from '../components/Navbar'
import { motion } from 'framer-motion'
import { formatRupiah } from '../lib/utils'
import { 
  FaLeaf, FaRocket, FaGem, FaFire, FaCrown, 
  FaMoneyBillWave, FaChartLine, FaGift, FaTrophy, FaHandshake
} from 'react-icons/fa'

const TIER_ICONS = {
  beginner: <FaLeaf />,
  pro: <FaRocket />,
  expert: <FaGem />,
  extreme: <FaFire />,
  god: <FaCrown />
}

export default function AffiliateBenefits() {
  const [tiers, setTiers] = useState([])
  const [settings, setSettings] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchData()
  }, [])

  async function fetchData() {
    const [tiersRes, settingsRes] = await Promise.all([
      supabase.from('affiliate_tiers').select('*').eq('is_active', true).order('rank_order', { ascending: true }),
      supabase.from('affiliate_settings').select('*').eq('id', 1).single()
    ])
    setTiers(tiersRes.data || [])
    if (settingsRes.data) setSettings(settingsRes.data)
    setLoading(false)
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.1 } }
  }
  
  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    visible: { opacity: 1, y: 0 }
  }

  return (
    <div className="min-h-screen bg-[#030303] text-gray-200 selection:bg-purple-500/30 font-sans pb-24">
      <Helmet>
        <title>Affiliate Benefits - GAMEVORA</title>
      </Helmet>
      
      <Navbar />

      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 pt-28">
        
        {/* Header Section */}
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-center mb-16"
        >
          <div className="inline-block px-4 py-1 rounded-full bg-purple-500/10 border border-purple-500/20 text-purple-400 text-sm font-semibold mb-4">
            GAMEVORA AFFILIATE PROGRAM
          </div>
          <h1 className="text-4xl md:text-5xl font-black mb-6 bg-gradient-to-br from-white via-gray-200 to-gray-500 bg-clip-text text-transparent">
            Ubah Pengaruhmu Jadi <span className="text-purple-500">Penghasilan</span>
          </h1>
          <p className="text-gray-400 max-w-2xl mx-auto text-lg">
            Bergabung dengan program Affiliate Gamevora dan dapatkan komisi tanpa batas dari setiap penjualan. Semakin tinggi tier Anda, semakin besar keuntungan yang menanti!
          </p>
          <div className="mt-8">
            <Link to="/affiliate" className="px-8 py-3 bg-purple-600 hover:bg-purple-500 text-white font-bold rounded-xl transition-all shadow-[0_0_20px_rgba(168,85,247,0.4)]">
              Mulai Menghasilkan
            </Link>
          </div>
        </motion.div>

        {/* Benefits Grid */}
        <div className="mb-24">
          <h2 className="text-2xl font-bold mb-8 text-center">Keuntungan Menjadi Affiliate</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <BenefitCard icon={<FaMoneyBillWave className="text-green-400" />} title="Komisi Tanpa Batas" desc="Dapatkan persentase dari setiap transaksi yang menggunakan kode referral Anda." />
            <BenefitCard icon={<FaChartLine className="text-blue-400" />} title="Naik Tier Otomatis" desc="Tingkatkan performa penjualan untuk mendapatkan komisi yang jauh lebih besar." />
            <BenefitCard icon={<FaGift className="text-pink-400" />} title="Bonus Spesial" desc="Dapatkan bonus tunai setiap kali mencapai target jumlah penjualan tertentu." />
            <BenefitCard icon={<FaTrophy className="text-yellow-400" />} title="Leaderboard & Badge" desc="Buktikan Anda yang terbaik dan dapatkan badge eksklusif di profil Anda." />
            <BenefitCard icon={<FaHandshake className="text-purple-400" />} title="Priority Support" desc="Tim kami selalu siap memprioritaskan bantuan untuk affiliate tingkat tinggi." />
            <BenefitCard icon={<FaRocket className="text-orange-400" />} title="Withdraw Mudah" desc="Cairkan penghasilan Anda ke E-Wallet atau Bank kapan saja dengan cepat." />
          </div>
        </div>

        {/* Tiers Section */}
        <div className="mb-24">
          <h2 className="text-3xl font-black mb-4 text-center">Sistem Tier Affiliate</h2>
          <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Sistem akan secara otomatis menaikkan tier Anda berdasarkan performa. Berikut adalah tingkatan dan benefitnya:</p>
          
          {loading ? (
            <div className="flex justify-center"><div className="w-8 h-8 border-2 border-purple-500 rounded-full animate-spin border-t-transparent" /></div>
          ) : (
            <motion.div 
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4"
            >
              {tiers.map((t) => (
                <motion.div key={t.id} variants={itemVariants} className="bg-[#0a0a0a] border border-white/5 rounded-2xl p-6 relative overflow-hidden group hover:border-purple-500/30 transition-all">
                  <div className={`absolute top-0 right-0 w-24 h-24 ${t.color.replace('text-', 'bg-')}/10 blur-2xl rounded-full -mr-10 -mt-10`} />
                  <div className={`text-4xl mb-4 ${t.color}`}>
                    {TIER_ICONS[t.id] || <FaGem />}
                  </div>
                  <h3 className={`text-xl font-bold mb-1 ${t.color}`}>{t.name}</h3>
                  <div className="text-3xl font-black text-white mb-4">{t.commission_rate}% <span className="text-sm font-normal text-gray-500">Komisi</span></div>
                  
                  <div className="space-y-4 mb-6">
                    <div>
                      <div className="text-xs text-gray-500 uppercase font-semibold">Syarat Naik</div>
                      <div className="text-sm font-medium">{t.min_sales} Sales / {formatRupiah(t.min_omzet)}</div>
                    </div>
                  </div>

                  <div className="border-t border-white/5 pt-4">
                    <div className="text-xs text-gray-500 uppercase font-semibold mb-2">Benefit</div>
                    <ul className="space-y-2">
                      {t.benefits?.map((b, i) => (
                        <li key={i} className="text-sm text-gray-300 flex items-start gap-2">
                          <div className={`mt-1 text-[10px] ${t.color}`}>✦</div>
                          <span className="leading-tight">{b}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </div>

        {/* Bonus Milestones */}
        {settings?.referral_bonuses && settings.referral_bonuses.length > 0 && (
          <div className="mb-24">
            <h2 className="text-3xl font-black mb-4 text-center">Bonus Milestone</h2>
            <p className="text-center text-gray-400 mb-12 max-w-2xl mx-auto">Dapatkan bonus tunai ekstra saat mencapai target penjualan tertentu!</p>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 max-w-4xl mx-auto">
              {settings.referral_bonuses.map((bonus, i) => (
                <div key={i} className="bg-[#0a0a0a] border border-yellow-500/20 rounded-2xl p-6 text-center group hover:border-yellow-500/40 transition-all">
                  <div className="text-4xl mb-3">🎁</div>
                  <div className="text-3xl font-black text-yellow-400 mb-2">{formatRupiah(bonus.reward)}</div>
                  <div className="text-sm text-gray-400">Bonus saat mencapai <span className="font-bold text-white">{bonus.milestone} sales</span></div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* FAQ Section */}
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl font-bold mb-8 text-center">Frequently Asked Questions</h2>
          <div className="space-y-4">
            <FaqItem q="Bagaimana cara bergabung?" a="Semua pengguna GAMEVORA otomatis terdaftar sebagai affiliate Beginner. Anda cukup membuat kode affiliate di menu Dashboard Affiliate dan membagikannya." />
            <FaqItem q="Kapan komisi masuk?" a="Komisi akan otomatis masuk ke saldo Anda setelah pesanan dari pembeli yang menggunakan kode Anda berstatus 'Completed' (Selesai)." />
            <FaqItem q="Bagaimana cara naik tier?" a="Sistem akan otomatis membaca total penjualan atau omzet Anda. Jika sudah mencapai syarat tier berikutnya, tier dan komisi Anda akan langsung naik secara otomatis!" />
            <FaqItem q="Berapa minimal withdraw?" a={`Minimal pencairan komisi adalah ${formatRupiah(Number(settings?.min_withdraw) || 50000)}. Anda bisa mencairkannya ke Dana, Gopay, OVO, ShopeePay, atau Transfer Bank.`} />
          </div>
        </div>

      </div>
    </div>
  )
}

function BenefitCard({ icon, title, desc }) {
  return (
    <div className="bg-white/[0.02] border border-white/5 p-6 rounded-2xl hover:bg-white/[0.04] transition-colors">
      <div className="text-3xl mb-4 bg-black/30 w-12 h-12 rounded-xl flex items-center justify-center border border-white/5">
        {icon}
      </div>
      <h3 className="text-lg font-bold text-white mb-2">{title}</h3>
      <p className="text-sm text-gray-400">{desc}</p>
    </div>
  )
}

function FaqItem({ q, a }) {
  return (
    <div className="bg-[#0a0a0a] border border-white/5 p-5 rounded-xl">
      <h4 className="font-bold text-white mb-2">{q}</h4>
      <p className="text-sm text-gray-400">{a}</p>
    </div>
  )
}
