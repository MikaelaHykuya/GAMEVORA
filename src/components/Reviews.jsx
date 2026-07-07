import { useState, useEffect } from 'react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useToast } from '../contexts/ToastContext'

export default function Reviews({ gameId }) {
  const { user } = useAuth()
  const { showToast } = useToast()
  const [reviews, setReviews] = useState([])
  const [userReview, setUserReview] = useState(null)
  const [rating, setRating] = useState(0)
  const [content, setContent] = useState('')
  const [hoverRating, setHoverRating] = useState(0)
  const [submitting, setSubmitting] = useState(false)
  const [canReview, setCanReview] = useState(false)

  useEffect(() => {
    loadReviews()
  }, [gameId])

  async function loadReviews() {
    const [revRes, ownRes] = await Promise.all([
      supabase.from('reviews').select('*, profiles:user_id(id, full_name, username, avatar_url)').eq('game_id', gameId).order('created_at', { ascending: false }),
      user ? supabase.from('reviews').select('*').eq('game_id', gameId).eq('user_id', user.id).maybeSingle() : null,
      user ? supabase.from('library').select('id').eq('user_id', user.id).eq('game_id', gameId).eq('status', 'approved').maybeSingle() : null,
    ])
    setReviews(revRes.data || [])
    if (ownRes?.data) {
      setUserReview(ownRes.data)
      setRating(ownRes.data.rating)
      setContent(ownRes.data.comment || '')
    }
  }

  // Check if user can review
  useEffect(() => {
    if (!user || userReview) { setCanReview(false); return }
    supabase.from('library').select('id').eq('user_id', user.id).eq('game_id', gameId).eq('status', 'approved').maybeSingle()
      .then(({ data }) => setCanReview(!!data))
  }, [user, gameId, userReview])

  const avgRating = reviews.length
    ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length
    : 0
  const distribution = [0, 0, 0, 0, 0]
  reviews.forEach(r => distribution[r.rating - 1]++)

  async function submitReview() {
    if (rating < 1) return showToast('Select a rating!', 'warning')
    setSubmitting(true)
    if (userReview) {
      const { error } = await supabase.from('reviews').update({ rating, comment: content, updated_at: new Date().toISOString() }).eq('id', userReview.id)
      if (error) showToast(error.message, 'error')
      else { showToast('Review updated!', 'success'); loadReviews() }
    } else {
      const { error } = await supabase.from('reviews').insert({ user_id: user.id, game_id: gameId, rating, comment: content })
      if (error) showToast(error.message, 'error')
      else { showToast('Review submitted!', 'success'); loadReviews() }
    }
    setSubmitting(false)
  }

  async function deleteReview() {
    const { error } = await supabase.from('reviews').delete().eq('id', userReview.id)
    if (!error) { setUserReview(null); setRating(0); setContent(''); loadReviews() }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-4 mb-6">
        <h3 className="text-base font-black uppercase tracking-tight">Reviews</h3>
        {reviews.length > 0 && (
          <div className="flex items-center gap-2 bg-zinc-800/60 border border-white/[0.04] rounded-xl px-3 py-1.5">
            <span className="text-yellow-400 text-sm">★</span>
            <span className="text-sm font-bold">{avgRating.toFixed(1)}</span>
            <span className="text-[9px] text-gray-600">({reviews.length})</span>
          </div>
        )}
      </div>

      {/* Rating distribution */}
      {reviews.length > 0 && (
        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5 mb-6">
          {[5, 4, 3, 2, 1].map(star => {
            const count = distribution[star - 1]
            const pct = reviews.length > 0 ? (count / reviews.length) * 100 : 0
            return (
              <div key={star} className="flex items-center gap-2 text-[11px]">
                <span className="w-3 text-gray-500">{star}</span>
                <span className="text-yellow-400">★</span>
                <div className="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
                  <div className="h-full bg-yellow-500 rounded-full transition-all" style={{ width: `${pct}%` }} />
                </div>
                <span className="w-6 text-right text-gray-600">{count}</span>
              </div>
            )
          })}
        </div>
      )}

      {/* Review form */}
      {(canReview || userReview) && (
        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-5">
          <p className="text-[9px] font-black uppercase tracking-widest text-gray-500 mb-3">
            {userReview ? 'Edit Your Review' : 'Write a Review'}
          </p>
          <div className="flex gap-1 mb-4">
            {[1, 2, 3, 4, 5].map(star => (
              <button key={star} onClick={() => setRating(star)} onMouseEnter={() => setHoverRating(star)} onMouseLeave={() => setHoverRating(0)}
                className={`text-2xl transition-all ${(hoverRating || rating) >= star ? 'text-yellow-400 scale-110' : 'text-zinc-700 hover:text-zinc-500'}`}>
                ★
              </button>
            ))}
          </div>
          <textarea value={content} onChange={e => setContent(e.target.value)} placeholder="Share your thoughts..."
            maxLength={500} rows={3}
            className="w-full bg-zinc-800/60 border border-white/[0.06] rounded-2xl px-4 py-3 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700 resize-none" />
          <div className="flex gap-2 mt-3">
            <button onClick={submitReview} disabled={submitting || rating < 1}
              className="px-5 py-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50">
              {submitting ? '...' : userReview ? 'Update' : 'Submit'}
            </button>
            {userReview && (
              <button onClick={deleteReview}
                className="px-5 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all">
                Delete
              </button>
            )}
          </div>
        </div>
      )}

      {/* Review list */}
      <div className="space-y-3">
        {reviews.length > 0 ? reviews.map(r => (
          <div key={r.id} className="bg-zinc-900/30 border border-white/[0.03] rounded-2xl p-4">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
                {r.profiles?.avatar_url ? <img src={r.profiles.avatar_url} className="w-full h-full object-cover" /> : (
                  <div className="w-full h-full flex items-center justify-center text-[8px] font-black text-white">
                    {(r.profiles?.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                  </div>
                )}
              </div>
              <div className="flex-1">
                <p className="text-xs font-bold">{r.profiles?.full_name || 'Unknown'}</p>
                <div className="flex gap-0.5">
                  {[1,2,3,4,5].map(s => (
                    <span key={s} className={`text-[10px] ${s <= r.rating ? 'text-yellow-400' : 'text-zinc-700'}`}>★</span>
                  ))}
                </div>
              </div>
              <span className="text-[7px] text-gray-600">{new Date(r.created_at).toLocaleDateString()}</span>
            </div>
            {r.comment && <p className="text-sm text-gray-400 leading-relaxed">{r.comment}</p>}
          </div>
        )) : (
          <p className="text-[9px] text-gray-700 text-center py-6">No reviews yet. Be the first!</p>
        )}
      </div>
    </div>
  )
}
