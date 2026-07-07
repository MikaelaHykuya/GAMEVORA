import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useBgm } from '../contexts/BgmContext'
import { useToast } from '../contexts/ToastContext'
import { parseMusicUrl } from '../lib/utils'
import Navbar from '../components/Navbar'
import { Helmet } from 'react-helmet-async'

export default function BgmPlaylist() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const { showToast } = useToast()
  const { playlist, currentIndex, bgmPlaying, bgmReady, bgmError, hasMultiple, playTrack, addTrack, removeTrack, reorderTracks, toggleBgm, currentTrack } = useBgm()
  const [inputUrl, setInputUrl] = useState('')
  const [adding, setAdding] = useState(false)
  const [dragIndex, setDragIndex] = useState(null)

  useEffect(() => {
    if (!user) { navigate('/login'); return }
  }, [user])

  const handleAdd = async () => {
    if (!inputUrl.trim()) return
    const parsed = parseMusicUrl(inputUrl.trim())
    if (!parsed || parsed.type === 'unknown') { showToast('Invalid YouTube/SoundCloud URL', 'error'); return }
    setAdding(true)
    const { error } = await addTrack(inputUrl.trim())
    if (error) showToast(error.message, 'error')
    else { showToast('Track added!', 'success'); setInputUrl('') }
    setAdding(false)
  }

  const handleRemove = async (index) => {
    const { error } = await removeTrack(index)
    if (error) showToast(error.message, 'error')
  }

  const handleMove = (from, to) => {
    reorderTracks(from, to)
  }

  return (
    <div className="min-h-screen bg-[#030303] text-white">
      <Helmet><title>GVR - Playlist</title></Helmet>
      <Navbar />
      <main className="pt-28 px-4 md:px-6 max-w-3xl mx-auto pb-8">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => navigate(-1)} className="p-2.5 bg-white/[0.05] rounded-2xl hover:bg-white/10 transition-all">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 12H5m7 7l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 className="text-2xl font-black uppercase tracking-tight bg-gradient-to-r from-purple-400 to-yellow-500 bg-clip-text text-transparent">Playlist</h1>
            <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest mt-1">{playlist.length} Track{playlist.length !== 1 ? 's' : ''}</p>
          </div>
        </div>

        {currentTrack && currentIndex >= 0 && (
          <div className="bg-zinc-900/60 border border-white/[0.06] rounded-3xl p-5 mb-8">
            <p className="text-[8px] font-black uppercase tracking-widest text-gray-600 mb-2">Now Playing</p>
            <div className="flex items-center gap-4">
              <div className={`w-16 h-16 rounded-2xl flex items-center justify-center ${
                bgmPlaying ? 'bg-green-500/10 animate-pulse' : 'bg-zinc-800'
              }`}>
                {bgmPlaying ? (
                  <div className="flex items-end gap-0.5 h-6">
                    {[1,2,3,4].map(i => (
                      <div key={i} className="w-1 bg-green-400 rounded-full equalizer-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                    ))}
                  </div>
                ) : (
                  <svg className="w-7 h-7 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-sm font-bold truncate">{currentTrack.title || 'Untitled Track'}</p>
                <p className="text-[9px] text-gray-500 font-black uppercase tracking-widest truncate mt-0.5">
                  {(() => { const p = parseMusicUrl(currentTrack.url); return p ? p.type.toUpperCase() : 'UNKNOWN' })()}
                </p>
              </div>
              <button onClick={toggleBgm}
                disabled={!bgmReady && !bgmError}
                className={`p-3 rounded-xl transition-all ${
                  bgmPlaying
                    ? 'bg-green-500/20 border border-green-500/30 text-green-400'
                    : 'bg-zinc-800 border border-white/[0.06] text-gray-400 hover:bg-zinc-700'
                }`}>
                {bgmPlaying ? (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zM7 8a1 1 0 012 0v4a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v4a1 1 0 102 0V8a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                ) : (
                  <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        )}

        <div className="flex gap-2 mb-8">
          <input type="url" value={inputUrl} onChange={e => setInputUrl(e.target.value)}
            placeholder="Paste YouTube or SoundCloud URL..."
            onKeyDown={e => e.key === 'Enter' && handleAdd()}
            className="flex-1 bg-zinc-900/60 border border-white/[0.06] rounded-2xl px-5 py-3.5 outline-none focus:border-purple-500/40 transition-all text-sm text-white placeholder:text-gray-700" />
          <button onClick={handleAdd} disabled={adding}
            className="px-6 py-3.5 bg-purple-500/20 border border-purple-500/30 rounded-2xl text-[9px] font-black uppercase tracking-widest text-purple-300 hover:bg-purple-500/30 transition-all disabled:opacity-50">
            {adding ? '...' : 'Add'}
          </button>
        </div>

        {playlist.length === 0 ? (
          <div className="text-center py-16">
            <span className="text-4xl">🎵</span>
            <p className="text-[9px] text-gray-600 font-black uppercase tracking-widest mt-4">Empty Playlist</p>
            <p className="text-[8px] text-gray-700 mt-2">Add YouTube or SoundCloud links above</p>
          </div>
        ) : (
          <div className="space-y-2">
            {playlist.map((track, i) => {
              const parsed = parseMusicUrl(track.url)
              return (
                <div key={i}
                  className={`flex items-center gap-3 bg-zinc-900/40 border rounded-2xl p-3 transition-all group ${
                    i === currentIndex
                      ? 'border-purple-500/30 bg-purple-500/5'
                      : 'border-white/[0.04] hover:border-white/[0.08]'
                  }`}>
                  <div className="flex flex-col gap-1 opacity-0 group-hover:opacity-100 transition-all">
                    {i > 0 && (
                      <button onClick={() => handleMove(i, i - 1)} className="p-1 hover:text-purple-400 transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 15l7-7 7 7" />
                        </svg>
                      </button>
                    )}
                    {i < playlist.length - 1 && (
                      <button onClick={() => handleMove(i, i + 1)} className="p-1 hover:text-purple-400 transition-all">
                        <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                        </svg>
                      </button>
                    )}
                  </div>

                  <button onClick={() => playTrack(i)}
                    className={`w-10 h-10 rounded-xl flex-shrink-0 flex items-center justify-center transition-all ${
                      i === currentIndex && bgmPlaying
                        ? 'bg-green-500/15 text-green-400'
                        : 'bg-zinc-800 border border-white/[0.04] text-gray-500 hover:text-white hover:bg-zinc-700'
                    }`}>
                    {i === currentIndex && bgmPlaying ? (
                      <div className="flex items-end gap-0.5 h-4">
                        {[1,2,3].map(n => (
                          <div key={n} className="w-0.5 bg-green-400 rounded-full equalizer-bar" style={{ animationDelay: `${n * 0.15}s` }} />
                        ))}
                      </div>
                    ) : (
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clipRule="evenodd" />
                      </svg>
                    )}
                  </button>

                  <div className="flex-1 min-w-0">
                    <p className={`text-sm font-bold truncate ${i === currentIndex ? 'text-purple-300' : 'text-white'}`}>
                      {track.title || `Track ${i + 1}`}
                    </p>
                    <p className="text-[8px] text-gray-600 font-black uppercase tracking-widest truncate">
                      {parsed ? parsed.type.toUpperCase() : 'UNKNOWN'}
                    </p>
                  </div>

                  <span className="text-[9px] text-gray-600 font-mono">{String(i + 1).padStart(2, '0')}</span>

                  <button onClick={() => handleRemove(i)}
                    className="p-2 opacity-0 group-hover:opacity-100 bg-red-500/10 border border-red-500/20 rounded-xl text-red-400 hover:bg-red-500/20 transition-all">
                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </main>
    </div>
  )
}
