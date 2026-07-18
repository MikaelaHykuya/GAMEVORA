import React, { useMemo } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { useAuth } from '../contexts/AuthContext'
import { formatRupiah } from '../lib/utils'
import useTilt from '../hooks/useTilt'

const GameCard = React.memo(({ game }) => {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()
  const { user } = useAuth()
  const tilt = useTilt(6)

  const priceFinal = game.discount_price > 0 ? game.discount_price : game.price
  
  // Memoize ratings calculation to avoid recalculating on every render
  const { avgRating, ratingCount } = useMemo(() => {
    const ratings = game.reviews || []
    const count = ratings.length
    const avg = count > 0
      ? (ratings.reduce((sum, r) => sum + r.rating, 0) / count).toFixed(1)
      : '0.0'
    return { avgRating: avg, ratingCount: count }
  }, [game.reviews])

  const inWishlist = isInWishlist(game.id)

  return (
    <div ref={tilt.ref} onMouseMove={tilt.handleMouseMove} onMouseLeave={tilt.handleMouseLeave}
      className="tilt-card group bg-zinc-900/40 backdrop-blur-xl border border-white/[0.05] rounded-[32px] overflow-hidden hover:border-purple-500/40 transition-all duration-500 hover:shadow-[0_0_30px_rgba(168,85,247,0.2)] relative">
      
      {/* Ambient glow on hover */}
      <div className="absolute inset-0 bg-gradient-to-tr from-purple-600/0 via-purple-600/0 to-cyan-600/0 group-hover:from-purple-600/10 group-hover:via-transparent group-hover:to-cyan-600/10 transition-colors duration-700 pointer-events-none z-0" />
      
      <div
        className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-black/80 to-black/60 w-full cursor-pointer z-10"
        onClick={() => { if (!user) { navigate('/register'); return }; navigate(`/detail/${game.id}`) }}
      >
        <img
          src={game.thumbnail}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
          alt={game.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90" />
        <div className="absolute inset-0 bg-gradient-to-r from-[#030303]/60 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" />

        {game.discount_price > 0 && (
          <div className="absolute top-4 left-4 z-10 flex flex-col gap-1">
            <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[8px] font-black px-3 py-1.5 rounded-xl tracking-[0.2em] shadow-[0_0_15px_rgba(220,38,38,0.5)] border border-red-400/50 flex items-center gap-1.5">
              <span className="w-1.5 h-1.5 rounded-full bg-white animate-pulse" />
              SALE
            </div>
            <div className="bg-red-500/20 backdrop-blur-md border border-red-500/30 text-red-400 text-[9px] font-black px-2.5 py-1 rounded-lg w-fit ml-0.5">
              -{Math.round((1 - game.discount_price / game.price) * 100)}%
            </div>
          </div>
        )}

        <div className="absolute top-4 right-4 z-20 flex flex-col gap-2">
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(game.id) }}
            className="p-2.5 rounded-xl backdrop-blur-xl border border-white/10 shadow-lg transition-all hover:scale-110 hover:shadow-purple-500/30 relative group/btn"
            style={{ backgroundColor: inWishlist ? 'rgba(168, 85, 247, 0.8)' : 'rgba(0,0,0,0.6)' }}>
            <svg className="w-4 h-4 transition-transform group-hover/btn:scale-110" fill={inWishlist ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"
              color={inWishlist ? '#fff' : '#fff'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
        </div>
      </div>

      <div className="p-6 relative z-10">
        <div className="flex justify-between items-center mb-3">
          <span className="text-[8px] font-black text-cyan-400/80 uppercase tracking-[0.3em] bg-cyan-500/10 px-2 py-0.5 rounded-md border border-cyan-500/20">{game.genre || 'License'}</span>
          <div className="flex items-center gap-2">
            {game.sold_count > 0 && (
              <span className="text-[8px] font-bold text-gray-500 uppercase tracking-widest">{game.sold_count.toLocaleString('id-ID')} sold</span>
            )}
            <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/20">
              <svg className="w-2.5 h-2.5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
              <span className="text-[9px] font-black text-yellow-400">{avgRating}{ratingCount > 0 ? ` (${ratingCount})` : ''}</span>
            </div>
          </div>
        </div>
        
        {game.is_trending && (
          <div className="inline-flex items-center gap-1.5 mb-3 bg-gradient-to-r from-orange-500/20 to-red-500/20 border border-orange-500/30 px-2.5 py-1 rounded-lg">
            <span className="w-1.5 h-1.5 rounded-full bg-orange-400 animate-pulse" />
            <span className="text-[8px] font-black text-orange-400 uppercase tracking-widest">Trending</span>
          </div>
        )}
        
        <h3 className="font-black text-base uppercase tracking-tight line-clamp-1 mb-4 group-hover:text-transparent group-hover:bg-clip-text group-hover:bg-gradient-to-r group-hover:from-purple-400 group-hover:to-cyan-400 transition-all duration-300">
          {game.title}
        </h3>
        
        <div className="mb-5 flex flex-col justify-end min-h-[3rem]">
          {game.discount_price > 0 && (
            <span className="text-[10px] text-gray-500 line-through font-mono">{formatRupiah(game.price)}</span>
          )}
          <span className="text-xl font-black tracking-tight text-white">{formatRupiah(priceFinal)}</span>
        </div>
        
        <button
          onClick={() => addToCart(game.id)}
          className="w-full relative overflow-hidden bg-white/5 border border-white/10 text-white py-4 rounded-2xl text-[9px] font-black uppercase tracking-[0.2em] hover:bg-white hover:text-black hover:shadow-[0_0_20px_rgba(255,255,255,0.4)] transition-all duration-300 active:scale-95 group/btn"
        >
          <span className="relative z-10 flex items-center justify-center gap-2">
            <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 0a2 2 0 100 4 2 2 0 000-4z" /></svg>
            Add to Cart
          </span>
        </button>
      </div>
    </div>
  )
})

export default GameCard
