import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import { useFriends } from '../contexts/FriendsContext'
import { useToast } from '../contexts/ToastContext'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'

export default function Friends() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { friends, pendingRequests, sendRequest, respondToRequest, removeFriend, fetchFriends } = useFriends()
  const [tab, setTab] = useState('friends')
  const [search, setSearch] = useState('')
  const [searchResults, setSearchResults] = useState([])
  const [searching, setSearching] = useState(false)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [user])

  useEffect(() => {
    if (search.trim().length < 2) { setSearchResults([]); return }
    const timer = setTimeout(async () => {
      setSearching(true)
      const { data } = await supabase.from('profiles')
        .select('id, full_name, username, avatar_url')
        .or(`full_name.ilike.%${search}%,username.ilike.%${search}%`)
        .neq('id', user.id)
        .limit(10)
      setSearchResults(data || [])
      setSearching(false)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, user])

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Friends</title></Helmet>
      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-3xl mx-auto pb-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-yellow-500 bg-clip-text text-transparent">Friends</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">Manage your friends</p>
          </div>
        </div>

        <div className="flex gap-2 mb-6">
          {[
            { key: 'friends', label: 'Friends', count: friends.length },
            { key: 'requests', label: 'Requests', count: pendingRequests.length },
            { key: 'search', label: 'Add Friend' },
          ].map(t => (
            <button key={t.key} onClick={() => setTab(t.key)}
              className={`flex items-center gap-2 px-5 py-3 rounded-2xl font-black text-[9px] uppercase tracking-widest transition-all ${
                tab === t.key
                  ? 'bg-purple-500/20 border border-purple-500/30 text-purple-300'
                  : 'bg-zinc-900/40 border border-white/[0.04] text-gray-500 hover:border-white/[0.08]'
              }`}>
              {t.label}
              {t.count !== undefined && t.count > 0 && (
                <span className="bg-purple-500/30 text-purple-300 text-[7px] px-2 py-0.5 rounded-full">{t.count}</span>
              )}
            </button>
          ))}
        </div>

        {tab === 'search' && (
          <div className="space-y-4">
            <input type="text" value={search} onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or username..."
              className="w-full bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
            {searching && <p className="text-[9px] text-gray-600 text-center">Searching...</p>}
            <div className="space-y-2">
              {searchResults.map(p => (
                <div key={p.id} className="flex items-center gap-3 bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-3">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
                    {p.avatar_url ? <img src={p.avatar_url} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">
                        {(p.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{p.full_name || 'Unknown'}</p>
                    {p.username && <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">@{p.username}</p>}
                  </div>
                  <button onClick={async () => {
                    const { error } = await sendRequest(p.id)
                    if (error) showToast(error.message, 'error')
                    else { showToast('Friend request sent!', 'success'); setSearch(''); setSearchResults([]) }
                  }}
                    className="px-4 py-2.5 bg-purple-500/20 border border-purple-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all">
                    Add
                  </button>
                </div>
              ))}
              {search.trim().length >= 2 && !searching && searchResults.length === 0 && (
                <p className="text-[9px] text-gray-600 text-center py-8">No users found</p>
              )}
            </div>
          </div>
        )}

        {tab === 'friends' && (
          <div className="space-y-2">
            {friends.length > 0 ? friends.map(f => (
              <div key={f.id} className="flex items-center gap-3 bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-3 hover:border-white/[0.08] transition-all group">
                <Link to={`/profile?user=${f.id}`} className="flex items-center gap-3 flex-1 min-w-0">
                  <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
                    {f.avatar_url ? <img src={f.avatar_url} className="w-full h-full object-cover" /> : (
                      <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">
                        {(f.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                      </div>
                    )}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-bold truncate">{f.full_name || 'Unknown'}</p>
                    {f.username && <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">@{f.username}</p>}
                  </div>
                </Link>
                <button onClick={async () => {
                  const { error } = await removeFriend(f.friendshipId)
                  if (!error) showToast('Friend removed', 'info')
                }}
                  className="p-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all opacity-0 group-hover:opacity-100">
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            )) : (
              <div className="text-center py-12">
                <span className="text-3xl">👥</span>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4">No friends yet</p>
                <button onClick={() => setTab('search')}
                  className="mt-4 text-[8px] text-purple-400 font-black uppercase tracking-widest hover:text-purple-300 transition-all">
                  Search for friends →
                </button>
              </div>
            )}
          </div>
        )}

        {tab === 'requests' && (
          <div className="space-y-2">
            {pendingRequests.length > 0 ? pendingRequests.map(r => (
              <div key={r.id} className="flex items-center gap-3 bg-zinc-900/40 border border-white/[0.04] rounded-2xl p-3">
                <div className="w-10 h-10 rounded-xl overflow-hidden bg-gradient-to-br from-purple-600 to-blue-600 flex-shrink-0">
                  {r.avatar_url ? <img src={r.avatar_url} className="w-full h-full object-cover" /> : (
                    <div className="w-full h-full flex items-center justify-center text-xs font-black text-white">
                      {(r.full_name || 'U').split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                    </div>
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold truncate">{r.full_name || 'Unknown'}</p>
                  {r.username && <p className="text-[8px] text-gray-500 font-black uppercase tracking-widest">@{r.username}</p>}
                </div>
                <div className="flex gap-2">
                  <button onClick={async () => {
                    const { error } = await respondToRequest(r.requestId, true)
                    if (!error) showToast('Friend request accepted!', 'success')
                  }}
                    className="px-4 py-2.5 bg-green-500/20 border border-green-500/30 rounded-xl text-[8px] font-black uppercase tracking-widest text-green-300 hover:bg-green-500/30 transition-all">
                    Accept
                  </button>
                  <button onClick={async () => {
                    await respondToRequest(r.requestId, false)
                  }}
                    className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 rounded-xl text-[8px] font-black uppercase tracking-widest text-red-400 hover:bg-red-500/20 transition-all">
                    Reject
                  </button>
                </div>
              </div>
            )) : (
              <div className="text-center py-12">
                <span className="text-3xl">📭</span>
                <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4">No pending requests</p>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
