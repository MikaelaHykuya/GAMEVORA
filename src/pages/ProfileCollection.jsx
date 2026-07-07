import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'
import { useToast } from '../contexts/ToastContext'

export default function ProfileCollection() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [library, setLibrary] = useState([])
  const { showToast } = useToast()
  const [tutorialOpen, setTutorialOpen] = useState(false)
  const [tutorialTitle, setTutorialTitle] = useState('')
  const [tutorialContent, setTutorialContent] = useState('')

  useEffect(() => {
    if (!user) { navigate('/login'); return }

    const fetchLibrary = () => {
      supabase.from('library').select('*, games(*)').eq('user_id', user.id).eq('status', 'approved').then(({ data, error }) => {
        if (error) console.error('Library fetch error:', error)
        setLibrary(data || [])
      })
    }
    fetchLibrary()

    const channel = supabase.channel('profile_collection_page_' + user.id)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'library', filter: 'user_id=eq.' + user.id }, fetchLibrary)
      .subscribe()

    return () => supabase.removeChannel(channel)
  }, [user])

  const showTutorial = async (gameId) => {
    const { data: game } = await supabase.from('games').select('title, manual_guide').eq('id', gameId).single()
    if (!game) return showToast('Failed to load guide.', 'error')
    setTutorialTitle(`MANUAL: ${game.title}`)
    setTutorialContent(game.manual_guide || 'Belum ada panduan untuk arsip ini.')
    setTutorialOpen(true)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - My Games</title><meta name="description" content="Your purchased games collection" /></Helmet>
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-purple-600/10 rounded-full blur-[150px] animate-pulse" style={{ animationDuration: '4s' }} />
        <div className="absolute bottom-0 right-1/4 w-[300px] h-[300px] bg-blue-600/5 rounded-full blur-[100px] animate-float" />
      </div>

      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-8 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">My Games</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">{library.length} titles in vault</p>
          </div>
        </div>

        {library.length === 0 ? (
          <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl text-center py-24">
            <div className="relative w-16 h-16 mx-auto mb-5">
              <div className="absolute inset-0 bg-purple-600/10 rounded-2xl animate-ping" />
              <div className="relative w-16 h-16 bg-gradient-to-br from-purple-600/20 to-blue-600/20 rounded-2xl flex items-center justify-center border border-purple-500/20">
                <svg className="w-7 h-7 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
            </div>
            <p className="text-sm text-gray-500 font-black uppercase tracking-tight">No collection found</p>
            <p className="text-[9px] text-gray-700 font-bold uppercase tracking-widest mt-2">Games you unlock will appear here</p>
          </div>
        ) : (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
            {library.map(item => (
              <div key={item.id} className="group bg-zinc-900/40 border border-white/[0.04] rounded-2xl overflow-hidden hover:border-white/[0.08] hover:-translate-y-1 transition-all duration-300">
                <div className="aspect-[3/4] overflow-hidden relative">
                  <img src={item.games?.thumbnail} className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500" alt={item.games?.title} />
                  <div className={`absolute top-3 left-3 flex items-center gap-1 px-2 py-1 rounded-lg text-[6px] font-black uppercase tracking-wider border backdrop-blur-sm z-10 ${
                    item.games?.connectivity_type === 'Online'
                      ? 'bg-blue-600/70 border-blue-400/20 text-blue-200'
                      : 'bg-green-600/70 border-green-400/20 text-green-200'
                  }`}>
                    <span className={`w-1 h-1 rounded-full ${item.games?.connectivity_type === 'Online' ? 'bg-blue-400' : 'bg-green-400'} animate-pulse`} />
                    {item.games?.connectivity_type || 'Offline'}
                  </div>
                  <div className="absolute inset-0 bg-gradient-to-t from-zinc-900 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  <div className="absolute bottom-0 left-0 right-0 p-3 translate-y-full group-hover:translate-y-0 transition-transform duration-300">
                    <div className="flex gap-2">
                      <button onClick={() => showTutorial(item.games?.id)}
                        className="flex-1 py-2 bg-yellow-500/20 backdrop-blur-sm text-yellow-400 rounded-xl font-black text-[7px] uppercase border border-yellow-500/30 hover:bg-yellow-500/30 transition-all">
                        Tutorial
                      </button>
                      <button onClick={() => navigate('/dashboard')}
                        className="flex-1 py-2 bg-gradient-to-r from-purple-600/80 to-purple-500/80 backdrop-blur-sm text-white rounded-xl font-black text-[7px] uppercase hover:shadow-lg hover:shadow-purple-600/20 transition-all">
                        Access
                      </button>
                    </div>
                  </div>
                </div>
                <div className="p-3.5">
                  <span className="text-[7px] font-black text-purple-500 uppercase tracking-widest block mb-1 truncate">{item.games?.genre || 'License'}</span>
                  <h5 className="text-xs font-black uppercase leading-tight truncate">{item.games?.title || 'Unknown'}</h5>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {tutorialOpen && (
        <div className="fixed inset-0 z-[5000] flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-black/95 backdrop-blur-2xl" onClick={() => setTutorialOpen(false)} />
          <div className="relative bg-zinc-900/95 border border-white/[0.06] rounded-3xl p-6 max-w-lg w-full max-h-[75vh] overflow-y-auto">
            <h2 className="text-lg font-black uppercase tracking-tight mb-5 bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">{tutorialTitle}</h2>
            <p className="text-gray-300 leading-relaxed text-sm whitespace-pre-line font-medium">{tutorialContent}</p>
            <button onClick={() => setTutorialOpen(false)}
              className="w-full mt-6 py-3.5 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-2xl font-black text-[10px] uppercase tracking-widest hover:shadow-lg hover:shadow-purple-600/20 transition-all">
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
