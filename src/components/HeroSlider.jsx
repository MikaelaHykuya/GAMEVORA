import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'

export default function HeroSlider({ games }) {
  const [currentSlide, setCurrentSlide] = useState(0)
  const navigate = useNavigate()
  const trending = games?.filter(g => g.is_trending).slice(0, 4) || []

  useEffect(() => {
    if (trending.length < 2) return
    const interval = setInterval(() => {
      setCurrentSlide(prev => (prev + 1) % trending.length)
    }, 6000)
    return () => clearInterval(interval)
  }, [trending.length])

  if (trending.length === 0) return null

  return (
    <section className="relative hero-container shadow-2xl animate-fade-in overflow-hidden rounded-3xl">
      <div className="absolute -top-20 -left-20 w-80 h-80 bg-purple-600/10 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="absolute -bottom-20 -right-20 w-80 h-80 bg-blue-600/10 rounded-full blur-[120px] pointer-events-none z-10" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-pink-600/5 rounded-full blur-[150px] pointer-events-none z-10" />

      <div className="h-full w-full bg-black/20 relative">
        {trending.map((game, index) => (
          <div
            key={game.id}
            className={`hero-slide ${index === currentSlide ? 'active' : ''}`}
          >
            <img
              src={game.thumbnail}
              className="w-full h-full object-cover"
              alt={game.title}
            />
            <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-[#030303]/60 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/80 via-transparent to-transparent" />
            <div className="absolute inset-0 hero-overlay flex flex-col justify-end px-8 md:px-20 pb-20">
              <div className="animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span className="inline-flex items-center gap-2 text-purple-400 font-black uppercase tracking-[0.5em] text-[10px] mb-4 bg-purple-500/10 px-4 py-2 rounded-full border border-purple-500/20 backdrop-blur-xl">
                  <span className="w-1.5 h-1.5 bg-purple-500 rounded-full animate-pulse" />
                  Trending Now
                </span>
              </div>
              <h1 className="text-5xl md:text-8xl font-black italic uppercase tracking-tighter mb-4 leading-none animate-slide-up" style={{ animationDelay: '0.2s' }}>
                {game.title}
              </h1>
              <div className="flex items-center gap-4 mb-6 animate-slide-up" style={{ animationDelay: '0.25s' }}>
                <span className="text-3xl md:text-4xl font-black text-purple-400 drop-shadow-[0_0_20px_rgba(168,85,247,0.5)]">
                  {game.discount_price > 0 ? (
                    <span>Rp {Number(game.discount_price).toLocaleString('id-ID')}</span>
                  ) : (
                    <span>Rp {Number(game.price).toLocaleString('id-ID')}</span>
                  )}
                </span>
                {game.discount_price > 0 && (
                  <span className="text-sm text-gray-500 line-through">Rp {Number(game.price).toLocaleString('id-ID')}</span>
                )}
                {game.discount_price > 0 && (
                  <span className="px-3 py-1 bg-red-500/20 border border-red-500/30 text-red-400 text-[10px] font-black rounded-xl">
                    -{Math.round((1 - game.discount_price / game.price) * 100)}%
                  </span>
                )}
              </div>
              <p className="max-w-md text-gray-400 text-sm font-medium leading-relaxed mb-8 line-clamp-2 animate-slide-up" style={{ animationDelay: '0.3s' }}>
                {game.description || 'Secure encrypted vault access.'}
              </p>
              <div className="animate-slide-up flex items-center gap-4" style={{ animationDelay: '0.4s' }}>
                <button
                  onClick={() => navigate(`/detail/${game.id}`)}
                  className="w-fit bg-gradient-to-r from-purple-600 to-purple-500 px-12 py-4 rounded-2xl font-black uppercase text-[11px] tracking-widest active-scale shadow-[0_0_40px_rgba(168,85,247,0.4)] hover:shadow-[0_0_60px_rgba(168,85,247,0.6)] hover:from-purple-500 hover:to-purple-400 transition-all duration-300"
                >
                  View Vault
                </button>
                {game.connectivity_type === 'Online' ? (
                  <span className="flex items-center gap-2 text-[10px] font-black text-blue-400 uppercase tracking-wider bg-blue-500/10 px-4 py-2 rounded-xl border border-blue-500/20">
                    <span className="w-1.5 h-1.5 bg-blue-500 rounded-full animate-pulse" />
                    Online
                  </span>
                ) : (
                  <span className="flex items-center gap-2 text-[10px] font-black text-green-400 uppercase tracking-wider bg-green-500/10 px-4 py-2 rounded-xl border border-green-500/20">
                    <span className="w-1.5 h-1.5 bg-green-500 rounded-full" />
                    Offline
                  </span>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {trending.length > 1 && (
        <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-3">
          {trending.map((_, index) => (
            <button
              key={index}
              onClick={() => setCurrentSlide(index)}
              className={`transition-all duration-500 ${
                index === currentSlide
                  ? 'w-8 h-2 bg-gradient-to-r from-purple-600 to-purple-500 rounded-full shadow-[0_0_10px_rgba(168,85,247,0.5)]'
                  : 'w-2 h-2 bg-white/20 rounded-full hover:bg-white/40'
              }`}
              aria-label={`Slide ${index + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  )
}
