import Navbar from '../components/Navbar'
import Footer from '../components/Footer'
import { Helmet } from 'react-helmet-async'

const faqs = [
  { q: 'Apa itu GameVora?', a: 'GameVora adalah platform digital vault yang menyediakan akses ke berbagai game dan software legal dengan harga terjangkau.' },
  { q: 'Bagaimana cara membeli game?', a: 'Tambah game ke cart, lakukan pembayaran via QRIS, upload bukti transfer, dan AI kami akan memverifikasi secara otomatis.' },
  { q: 'Bagaimana cara download setelah bayar?', a: 'Setelah pembayaran diverifikasi, game akan muncul di halaman Vault (Dashboard). Klik game tersebut untuk mengakses link download.' },
  { q: 'Kenapa game tidak muncul di library?', a: 'Pastikan pembayaran sudah diverifikasi. Jika status masih pending, hubungi admin melalui chat support.' },
  { q: 'Apakah ada garansi?', a: 'Ya, setiap pembelian memiliki garansi akses 30 hari. Jika ada kendala, hubungi support kami.' },
]

export default function FAQ() {
  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - FAQ</title><meta name="description" content="Frequently asked questions about GameVora" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/3 left-1/4 w-[300px] h-[300px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 right-1/4 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-2s' }} />
      </div>

      <Navbar />
      <main className="max-w-3xl mx-auto pt-32 px-6 pb-8 relative">
        <div className="text-center mb-14">
          <span className="text-purple-500 text-[10px] font-black uppercase tracking-[0.5em]">Information</span>
          <h1 className="text-5xl md:text-6xl font-black uppercase tracking-tight mt-4 mb-4 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">FAQ</h1>
          <p className="text-gray-400 text-sm max-w-lg mx-auto">
            Frequently Asked Questions tentang layanan GameVora.
          </p>
        </div>

        <div className="space-y-3">
          {faqs.map((faq, i) => (
            <details key={i} className="group bg-zinc-900/40 border border-white/[0.04] rounded-2xl transition-all duration-300 overflow-hidden">
              <summary className="flex items-center justify-between p-5 md:p-6 cursor-pointer list-none">
                <span className="text-sm md:text-base font-black uppercase tracking-tight pr-4">{faq.q}</span>
                <svg className="w-4 h-4 text-purple-500 group-open:rotate-180 transition-transform flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M19 9l-7 7-7-7" />
                </svg>
              </summary>
              <div className="px-5 pb-5 md:px-6 md:pb-6">
                <div className="w-full h-px bg-white/[0.04] mb-5" />
                <p className="text-gray-400 text-sm leading-relaxed font-medium">{faq.a}</p>
              </div>
            </details>
          ))}
        </div>
      </main>

      <Footer />
    </div>
  )
}
