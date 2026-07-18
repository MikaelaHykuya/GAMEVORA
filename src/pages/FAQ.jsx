import { useState, useMemo } from 'react'
import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'

const faqs = [
  { q: 'Apa itu GameVora?', a: 'GameVora adalah platform digital vault yang menyediakan akses ke berbagai game dan software legal dengan harga terjangkau dan keamanan terenkripsi.' },
  { q: 'Bagaimana cara membeli game di Vault?', a: 'Tambahkan game ke cart, lakukan checkout, bayar via QRIS (Otomatis), lalu sistem AI kami akan memverifikasi dan memberikan akses secara instan.' },
  { q: 'Bagaimana cara download setelah proses enkripsi pembayaran selesai?', a: 'Setelah pembayaran tervalidasi, lisensi game akan muncul di halaman Vault/Dashboard pribadimu. Kamu tinggal klik untuk mengunduhnya kapan saja.' },
  { q: 'Kenapa game tidak muncul di library saya?', a: 'Pastikan pembayaran tidak pending. Jika sistem terganggu atau ada delay jaringan, silakan kontak transmisi support kami agar segera ditangani secara manual.' },
  { q: 'Apakah ada garansi akses?', a: 'Ya, setiap entri dalam vault memiliki garansi 30 hari penuh. Jika akses terputus, segera lapor ke admin untuk pemulihan.' },
  { q: 'Metode pembayaran apa saja yang diterima?', a: 'Saat ini, kami secara penuh menggunakan sistem QRIS dinamis yang mendukung semua Bank dan E-Wallet modern (GoPay, OVO, Dana, ShopeePay, dsb).' },
]

function FAQAccordion({ faq, isOpen, onClick, index }) {
  return (
    <div 
      className={`group relative bg-zinc-900/60 backdrop-blur-xl border rounded-2xl transition-all duration-500 overflow-hidden ${
        isOpen ? 'border-cyan-500/50 shadow-[0_0_20px_rgba(34,211,238,0.15)] bg-cyan-900/10' : 'border-white/[0.04] hover:border-cyan-500/30 hover:bg-zinc-800/80'
      }`}
      style={{ animationDelay: `${index * 0.1}s` }}
    >
      <div 
        className="absolute inset-0 bg-gradient-to-r from-cyan-500/0 via-cyan-500/5 to-purple-500/0 opacity-0 group-hover:opacity-100 transition-opacity duration-700 pointer-events-none" 
      />
      
      <button 
        onClick={onClick}
        className="w-full flex items-center justify-between p-5 md:p-6 text-left relative z-10 outline-none"
      >
        <div className="flex items-center gap-4">
          <span className={`text-[10px] font-black font-mono px-2 py-1 rounded-lg border transition-colors duration-300 ${isOpen ? 'bg-cyan-500/20 border-cyan-500/40 text-cyan-300' : 'bg-white/5 border-white/10 text-gray-500'}`}>
            Q{(index + 1).toString().padStart(2, '0')}
          </span>
          <span className={`text-sm md:text-base font-black uppercase tracking-tight transition-colors duration-300 ${isOpen ? 'text-white' : 'text-gray-300 group-hover:text-white'}`}>
            {faq.q}
          </span>
        </div>
        <div className={`flex-shrink-0 w-8 h-8 rounded-full border flex items-center justify-center transition-all duration-500 ${isOpen ? 'border-cyan-500/50 bg-cyan-500/10 rotate-180' : 'border-white/10 bg-black/20 group-hover:border-cyan-500/30'}`}>
          <svg className={`w-4 h-4 transition-colors duration-300 ${isOpen ? 'text-cyan-400' : 'text-gray-500 group-hover:text-cyan-400'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      </button>
      
      <div 
        className={`grid transition-all duration-500 ease-[cubic-bezier(0.4,0,0.2,1)] ${isOpen ? 'grid-rows-[1fr] opacity-100' : 'grid-rows-[0fr] opacity-0'}`}
      >
        <div className="overflow-hidden">
          <div className="px-5 pb-5 md:px-6 md:pb-6 relative z-10 pt-2">
            <div className="w-full h-px bg-gradient-to-r from-cyan-500/30 to-transparent mb-5" />
            <p className="text-gray-400 text-sm md:text-base leading-relaxed font-medium flex items-start gap-3">
              <span className="mt-1 w-1.5 h-1.5 rounded-full bg-cyan-400 animate-pulse flex-shrink-0" />
              {faq.a}
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default function FAQ() {
  const [search, setSearch] = useState('')
  const [openIndex, setOpenIndex] = useState(0) // Default buka yang pertama

  const filteredFaqs = useMemo(() => {
    return faqs.filter(faq => 
      faq.q.toLowerCase().includes(search.toLowerCase()) || 
      faq.a.toLowerCase().includes(search.toLowerCase())
    )
  }, [search])

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Support & FAQ</title><meta name="description" content="Pusat bantuan dan FAQ GameVora" /></Helmet>
      
      {/* Background Orbs */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden z-0">
        <div className="absolute top-1/4 -left-20 w-[500px] h-[500px] bg-purple-600/10 rounded-full blur-[150px] animate-float" />
        <div className="absolute bottom-1/4 -right-20 w-[400px] h-[400px] bg-cyan-600/10 rounded-full blur-[120px] animate-float" style={{ animationDelay: '-2s' }} />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full h-px bg-white/[0.02]" />
      </div>

      <Navbar />
      
      <main className="max-w-4xl mx-auto pt-32 px-4 md:px-6 pb-20 relative z-10">
        
        {/* Header Section */}
        <div className="text-center mb-16 relative">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-zinc-900/80 border border-white/5 backdrop-blur-md shadow-lg shadow-black/50 mb-6">
            <span className="relative flex h-2.5 w-2.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-cyan-500"></span>
            </span>
            <span className="text-gray-300 text-[10px] font-black uppercase tracking-[0.3em]">Support Center</span>
          </div>
          
          <h1 className="text-5xl md:text-7xl font-black uppercase tracking-tighter mb-6 relative">
            <span className="text-white drop-shadow-lg">Data</span>{' '}
            <span className="relative inline-block">
              <span className="relative z-10 text-transparent bg-clip-text bg-gradient-to-r from-purple-400 to-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.5)]">
                Core FAQ
              </span>
              <span className="absolute inset-x-0 bottom-2 h-4 bg-cyan-500/20 blur-md -z-10" />
            </span>
          </h1>
          
          <p className="text-gray-400 text-sm md:text-base max-w-xl mx-auto font-medium leading-relaxed">
            Akses basis data pengetahuan kami. Cari jawaban untuk kendala enkripsi, akses Vault, hingga proses transaksi.
          </p>
        </div>

        {/* Search Bar */}
        <div className="mb-12 relative group max-w-2xl mx-auto">
          <div className="absolute -inset-0.5 bg-gradient-to-r from-purple-500 to-cyan-500 rounded-2xl blur opacity-20 group-hover:opacity-50 transition duration-500"></div>
          <div className="relative flex items-center bg-zinc-900/90 border border-white/10 rounded-2xl backdrop-blur-xl overflow-hidden shadow-2xl">
            <div className="pl-6 pr-3">
              <svg className="w-5 h-5 text-gray-500 group-focus-within:text-cyan-400 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <input 
              type="text" 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Scan database for answers..."
              className="w-full bg-transparent py-5 pr-6 outline-none text-sm font-bold text-white placeholder:text-gray-600 tracking-wide"
            />
            {search && (
              <button 
                onClick={() => setSearch('')}
                className="absolute right-4 p-2 text-gray-500 hover:text-white bg-black/20 rounded-xl transition-colors"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            )}
          </div>
        </div>

        {/* FAQ List */}
        <div className="space-y-4 mb-20 relative">
          <div className="absolute left-6 top-4 bottom-4 w-px bg-gradient-to-b from-cyan-500/0 via-cyan-500/20 to-purple-500/0 -z-10 hidden md:block" />
          
          {filteredFaqs.length > 0 ? (
            filteredFaqs.map((faq, index) => (
              <div key={index} className="animate-fade-up">
                <FAQAccordion 
                  faq={faq} 
                  index={faqs.findIndex(f => f.q === faq.q)} // keep original index for numbering
                  isOpen={openIndex === index}
                  onClick={() => setOpenIndex(openIndex === index ? -1 : index)}
                />
              </div>
            ))
          ) : (
            <div className="text-center py-20 bg-black/20 border border-white/5 rounded-3xl backdrop-blur-sm shadow-inner relative overflow-hidden">
               <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10 pointer-events-none mix-blend-overlay" />
               <div className="relative w-16 h-16 mx-auto mb-4">
                 <div className="absolute inset-0 rounded-2xl bg-orange-500/10 border border-orange-500/30 animate-pulse" />
                 <svg className="relative w-8 h-8 text-orange-400 mx-auto mt-[16px]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                 </svg>
               </div>
               <p className="text-white text-xl font-black uppercase tracking-widest drop-shadow-md">Data Not Found</p>
               <p className="text-gray-400 text-xs font-bold mt-2 uppercase tracking-widest">
                 Pencarian "{search}" tidak terdeteksi di database.
               </p>
            </div>
          )}
        </div>

        {/* Support CTA */}
        <div className="relative group bg-zinc-900/80 backdrop-blur-2xl border border-white/[0.06] rounded-[32px] p-8 md:p-10 text-center overflow-hidden hover:border-purple-500/30 transition-colors duration-500">
          <div className="absolute inset-0 bg-gradient-to-t from-purple-900/20 to-transparent pointer-events-none" />
          <div className="absolute -top-32 -right-32 w-64 h-64 bg-purple-600/10 rounded-full blur-[80px] pointer-events-none group-hover:bg-purple-600/20 transition-all duration-700" />
          
          <div className="relative z-10 max-w-xl mx-auto">
            <h3 className="text-2xl md:text-3xl font-black uppercase tracking-tight text-white mb-3">
              Koneksi <span className="text-purple-400">Terputus?</span>
            </h3>
            <p className="text-sm text-gray-400 leading-relaxed mb-8">
              Jika databank kami belum bisa menjawab kodemu, silakan lakukan transmisi langsung ke admin Support kami untuk bantuan prioritas.
            </p>
            <a 
              href="https://discord.gg/yourdiscord" 
              target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center justify-center gap-3 bg-gradient-to-r from-purple-600 to-cyan-600 text-white font-black text-[11px] uppercase tracking-widest px-8 py-4 rounded-xl hover:shadow-[0_0_30px_rgba(168,85,247,0.4)] hover:scale-105 active:scale-95 transition-all duration-300"
            >
              <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189Z" />
              </svg>
              Kirim Transmisi Bantuan
            </a>
          </div>
        </div>

      </main>

      <Footer />
    </div>
  )
}
