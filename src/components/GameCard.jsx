import { useNavigate } from 'react-router-dom'
import { useCart } from '../contexts/CartContext'
import { useWishlist } from '../contexts/WishlistContext'
import { formatRupiah } from '../lib/utils'

export default function GameCard({ game }) {
  const navigate = useNavigate()
  const { addToCart } = useCart()
  const { isInWishlist, toggleWishlist } = useWishlist()

  const priceFinal = game.discount_price > 0 ? game.discount_price : game.price
  const ratings = game.reviews || []
  const avgRating = ratings.length > 0
    ? (ratings.reduce((sum, r) => sum + r.rating, 0) / ratings.length).toFixed(1)
    : '0.0'

  return (
    <div className="group bg-zinc-900/40 border border-white/[0.04] rounded-3xl overflow-hidden hover:border-purple-500/30 transition-all duration-500 hover:shadow-lg hover:shadow-purple-600/10">
      <div
        className="aspect-[4/5] relative overflow-hidden bg-gradient-to-br from-black/60 to-black/40 w-full cursor-pointer"
        onClick={() => navigate(`/detail/${game.id}`)}
      >
        <img
          src={game.thumbnail}
          loading="lazy"
          className="object-cover w-full h-full group-hover:scale-110 transition-transform duration-[1200ms] ease-out"
          alt={game.title}
        />
        <div className="absolute inset-0 bg-gradient-to-t from-[#030303] via-transparent to-transparent opacity-90" />

        {game.discount_price > 0 && (
          <div className="absolute top-4 left-4 z-10 bg-gradient-to-r from-red-600 to-red-500 text-white text-[8px] font-black px-3 py-1.5 rounded-xl tracking-wider shadow-lg">
            SALE
          </div>
        )}

        <div className="absolute top-4 right-4 z-10 flex flex-col gap-2">
          <button onClick={(e) => { e.stopPropagation(); toggleWishlist(game.id) }}
            className="p-2 rounded-xl backdrop-blur-xl border border-white/10 shadow-lg transition-all hover:scale-110"
            style={{ backgroundColor: isInWishlist(game.id) ? 'rgba(236, 72, 153, 0.7)' : 'rgba(0,0,0,0.4)' }}>
            <svg className="w-4 h-4" fill={isInWishlist(game.id) ? 'currentColor' : 'none'} stroke="currentColor" viewBox="0 0 24 24"
              color={isInWishlist(game.id) ? '#fff' : '#fff'}>
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
            </svg>
          </button>
          {game.connectivity_type === 'Online' ? (
            <div className="bg-blue-600/70 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-lg hover:bg-blue-600/90 transition-colors">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
              </svg>
            </div>
          ) : (
            <div className="bg-green-600/70 backdrop-blur-xl p-1.5 rounded-xl border border-white/10 shadow-lg hover:bg-green-600/90 transition-colors">
              <svg className="w-3.5 h-3.5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M18.364 5.636a9 9 0 010 12.728m0-12.728L5.636 18.364m12.728 0a9 9 0 01-12.728 0m12.728 0L5.636 5.636m0 0a9 9 0 0112.728 0" />
              </svg>
            </div>
          )}
        </div>
      </div>

      <div className="p-5">
        <div className="flex justify-between items-center mb-2">
          <span className="text-[7px] font-black text-purple-400/80 uppercase tracking-[0.25em]">{game.genre || 'License'}</span>
          <div className="flex items-center gap-1 bg-yellow-500/10 px-2 py-0.5 rounded-lg border border-yellow-500/10">
            <svg className="w-2 h-2 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
            </svg>
            <span className="text-[8px] font-black text-yellow-300">{avgRating}</span>
          </div>
        </div>
        {game.is_trending && (
          <div className="bg-gradient-to-r from-red-600 to-red-500 text-white text-[7px] font-black px-2.5 py-1 rounded-lg mb-2 w-fit uppercase tracking-wider shadow-lg shadow-red-600/20">
            Trending
          </div>
        )}
        <h3 className="font-black text-sm uppercase tracking-tight line-clamp-1 mb-3 group-hover:text-purple-300 transition-colors duration-300">{game.title}</h3>
        <div className="mb-4 flex items-baseline gap-2">
          <span className="text-xl font-black tracking-tight">{formatRupiah(priceFinal)}</span>
          {game.discount_price > 0 && (
            <span className="text-[10px] text-gray-600 line-through">{formatRupiah(game.price)}</span>
          )}
        </div>
        <button
          onClick={() => addToCart(game.id)}
          className="w-full bg-gradient-to-r from-purple-600 to-purple-500 text-white py-3.5 rounded-2xl text-[9px] font-black uppercase tracking-wider hover:shadow-lg hover:shadow-purple-600/20 transition-all duration-300"
        >
          Add to Cart
        </button>
      </div>
    </div>
  )
}
