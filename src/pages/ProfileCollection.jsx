import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { supabase } from '../lib/supabase'
import { useAuth } from '../contexts/AuthContext'
import Navbar from '../components/Navbar'
import BottomNav from '../components/BottomNav'
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
      supabase.from('library').select('*, games(*)').eq('user_id', user.id).eq('status', 'approved').then(({ data }) => {
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
        <div className="absolute top-1/4 left-1/3 w-[350px] h-[350px] bg-purple-600/5 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/3 right-1/3 w-[250px] h-[250px] bg-blue-600/5 rounded-full blur-[80px] animate-float" style={{ animationDelay: '-3s' }} />
      </div>

      <Navbar />
      <BottomNav />

      <main className="pt-28 px-4 md:px-6 max-w-7xl mx-auto pb-32 relative">
        <div className="flex items-center gap-4 mb-10">
          <button onClick={() => navigate('/profile')} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-blue-500 bg-clip-text text-transparent">My Games</h1>
        </div>

        <div className="bg-zinc-900/40 border border-white/[0.04] rounded-3xl p-5 space-y-3">
          {library.length === 0 ? (
            <div className="text-center py-16">
              <div className="w-12 h-12 mx-auto mb-4 rounded-2xl bg-white/[0.03] flex items-center justify-center">
                <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /></svg>
              </div>
              <p className="text-sm text-gray-500 font-bold">No collection found</p>
            </div>
          ) : (
            library.map(item => (
              <div key={item.id} className="flex items-center justify-between bg-zinc-900/60 border border-white/[0.04] p-4 rounded-2xl hover:border-white/[0.08] transition-all">
                <div className="flex items-center gap-3 min-w-0 flex-1">
                  <img src={item.games?.thumbnail} className="w-11 h-11 rounded-xl object-cover border border-white/5 flex-shrink-0" alt={item.games?.title} />
                  <div className="min-w-0">
                    <h5 className="text-sm font-black uppercase leading-tight truncate">{item.games?.title || 'Unknown'}</h5>
                    <p className="text-[8px] text-purple-400 font-bold uppercase mt-0.5 tracking-widest">Vault Granted</p>
                  </div>
                </div>
                <div className="flex gap-2 flex-shrink-0 ml-3">
                  <button onClick={() => showTutorial(item.games?.id)} className="px-3.5 py-2 bg-yellow-500/10 text-yellow-500 rounded-xl font-black text-[8px] uppercase border border-yellow-500/20 hover:bg-yellow-500/20 transition-all">Tutorial</button>
                  <button onClick={() => navigate('/dashboard')} className="px-3.5 py-2 bg-gradient-to-r from-purple-600 to-purple-500 text-white rounded-xl font-black text-[8px] uppercase hover:shadow-lg hover:shadow-purple-600/20 transition-all">Access</button>
                </div>
              </div>
            ))
          )}
        </div>
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
