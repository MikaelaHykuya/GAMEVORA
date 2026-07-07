import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { useAuth } from './AuthContext'
import { parseMusicUrl } from '../lib/utils'
import { supabase } from '../lib/supabase'

const BAR_COUNT = 64
const VIS_HEIGHT = 90

const BgmContext = createContext(null)

export function BgmProvider({ children }) {
  const { user, profile, refreshProfile } = useAuth()
  const [bgmPlaying, setBgmPlaying] = useState(false)
  const [bgmReady, setBgmReady] = useState(false)
  const [bgmError, setBgmError] = useState(false)
  const [currentIndex, setCurrentIndex] = useState(-1)
  const bgmParsed = useRef(null)
  const playlistRef = useRef([])
  const indexRef = useRef(-1)

  const bgmUrl = profile?.bgm_url || ''
  const bgmPlaylist = profile?.bgm_playlist || []
  const playlist = bgmPlaylist.length > 0 ? bgmPlaylist : (bgmUrl ? [{ url: bgmUrl, title: '' }] : [])
  const currentTrack = currentIndex >= 0 && currentIndex < playlist.length ? playlist[currentIndex] : null

  // Sync ref with state
  useEffect(() => { indexRef.current = currentIndex }, [currentIndex])

  const [externalBgmUrl, setExternalBgmUrl] = useState('')
  const currentUrl = externalBgmUrl || currentTrack?.url || ''
  const showButton = playlist.length > 0 || !!externalBgmUrl

  function stopPlayer() {
    if (window.__ytPlayer) {
      try { window.__ytPlayer.stopVideo() } catch {}
    }
    if (window.__scWidget) {
      try { window.__scWidget.pause() } catch {}
    }
    setBgmPlaying(false)
    setBgmReady(false)
    setBgmError(false)
  }

  function loadTrack(url) {
    if (!url) { stopPlayer(); return }
    const parsed = parseMusicUrl(url)
    bgmParsed.current = parsed
    if (!parsed || parsed.type === 'unknown') { setBgmError(true); setBgmReady(false); return }
    setBgmError(false)
    setBgmReady(false)

    if (parsed.type === 'youtube') {
      if (window.__ytPlayer) {
        try { window.__ytPlayer.loadVideoById(parsed.id); setBgmReady(true) } catch {}
        return
      }
      if (window.YT && window.YT.Player) {
        createYouTubePlayer(parsed.id)
      } else {
        window._ytBgmCallback = () => createYouTubePlayer(parsed.id)
        if (!window._ytScriptLoaded) {
          window._ytScriptLoaded = true
          const tag = document.createElement('script')
          tag.src = 'https://www.youtube.com/iframe_api'
          tag.onload = () => {
            if (window.YT && window.YT.Player && window._ytBgmCallback) window.onYouTubeIframeAPIReady = window._ytBgmCallback
          }
          document.body.appendChild(tag)
        } else {
          window.onYouTubeIframeAPIReady = window._ytBgmCallback
        }
      }
    } else if (parsed.type === 'soundcloud') {
      if (window.__scWidget) {
        const scUrl = `https://soundcloud.com/${parsed.id}`
        window.__scWidget.load(scUrl, { auto_play: false })
        setBgmReady(true)
        return
      }
      if (window.SC && window.SC.Widget) {
        initSoundCloud(parsed.id)
      } else {
        const tag = document.createElement('script')
        tag.src = 'https://w.soundcloud.com/player/api.js'
        tag.onload = () => initSoundCloud(parsed.id)
        document.body.appendChild(tag)
      }
    }
  }

  function createYouTubePlayer(videoId) {
    let container = document.getElementById('yt-bgm-container')
    if (!container) {
      container = document.createElement('div')
      container.id = 'yt-bgm-container'
      container.style.display = 'none'
      document.body.appendChild(container)
    }
    container.innerHTML = '<div id="yt-bgm-player"></div>'
    window.__ytPlayer = new window.YT.Player('yt-bgm-player', {
      height: '0', width: '0', videoId,
      playerVars: { autoplay: 0, controls: 0, disablekb: 1, fs: 0, modestbranding: 1, playsinline: 1, rel: 0 },
      events: {
        onReady: () => { setBgmReady(true) },
        onError: () => { setBgmError(true) },
        onStateChange: (e) => {
          if (e.data === window.YT.PlayerState.PLAYING) setBgmPlaying(true)
          if (e.data === window.YT.PlayerState.PAUSED) setBgmPlaying(false)
          if (e.data === window.YT.PlayerState.ENDED) {
            setBgmPlaying(false)
            playNext()
          }
        },
      },
    })
  }

  function initSoundCloud(trackId) {
    const existing = document.getElementById('sc-bgm-container')
    if (existing) existing.remove()
    const container = document.createElement('div')
    container.id = 'sc-bgm-container'
    container.style.display = 'none'
    document.body.appendChild(container)
    const iframe = document.createElement('iframe')
    iframe.id = 'sc-bgm-iframe'
    iframe.src = `https://w.soundcloud.com/player/?url=https://soundcloud.com/${trackId}&auto_play=false&visual=false&hide_related=true&show_comments=false&show_user=false&show_reposts=false&show_teaser=false&liking=false&download=false&sharing=false`
    iframe.allow = 'autoplay'
    container.appendChild(iframe)
    iframe.onload = () => {
      if (window.SC && window.SC.Widget) {
        const widget = window.SC.Widget(iframe)
        window.__scWidget = widget
        widget.bind(window.SC.Widget.Events.READY, () => setBgmReady(true))
        widget.bind(window.SC.Widget.Events.PLAY, () => setBgmPlaying(true))
        widget.bind(window.SC.Widget.Events.PAUSE, () => setBgmPlaying(false))
        widget.bind(window.SC.Widget.Events.FINISH, () => { setBgmPlaying(false); playNext() })
      }
    }
  }

  function playNext() {
    const current = indexRef.current
    const next = current + 1
    if (next < playlistRef.current.length) {
      stopPlayer()
      setCurrentIndex(next)
    } else {
      stopPlayer()
      setCurrentIndex(-1)
    }
  }

  function playPrev() {
    const current = indexRef.current
    const prev = current > 0 ? current - 1 : playlistRef.current.length - 1
    stopPlayer()
    setCurrentIndex(prev)
  }

  // When playlist changes, reset if current track no longer valid
  useEffect(() => {
    playlistRef.current = playlist
    if (currentIndex >= playlist.length) {
      stopPlayer()
      setCurrentIndex(-1)
    }
  }, [playlist])

  // When playlist changes and nothing is selected, pick first track
  useEffect(() => {
    if (currentIndex === -1 && playlist.length > 0) {
      setCurrentIndex(0)
    }
  }, [playlist, currentIndex])

  // Load track when currentIndex or currentUrl changes
  useEffect(() => {
    if (currentUrl) {
      loadTrack(currentUrl)
    } else {
      stopPlayer()
    }
  }, [currentUrl])

  const toggleBgm = useCallback(() => {
    const parsed = bgmParsed.current
    if (!parsed || parsed.type === 'unknown') return
    if (bgmPlaying) {
      setBgmPlaying(false)
      if (parsed.type === 'youtube' && window.__ytPlayer) window.__ytPlayer.pauseVideo()
      else if (parsed.type === 'soundcloud' && window.__scWidget) window.__scWidget.pause()
    } else {
      setBgmPlaying(true)
      if (parsed.type === 'youtube' && window.__ytPlayer) window.__ytPlayer.playVideo()
      else if (parsed.type === 'soundcloud' && window.__scWidget) window.__scWidget.play()
    }
  }, [bgmPlaying])

  const playTrack = useCallback((index) => {
    if (index < 0 || index >= playlist.length) return
    stopPlayer()
    setCurrentIndex(index)
  }, [playlist])

  const addTrack = useCallback(async (url) => {
    if (!user) return
    const parsed = parseMusicUrl(url)
    if (!parsed || parsed.type === 'unknown') return { error: 'Invalid URL' }

    const newItem = { url, title: '' }
    const updated = [...(profile?.bgm_playlist || []), newItem]
    const { error } = await supabase.from('profiles').update({ bgm_playlist: updated }).eq('id', user.id)
    if (!error) {
      if (profile?.bgm_url) {
        await supabase.from('profiles').update({ bgm_url: '' }).eq('id', user.id)
      }
      refreshProfile()
    }
    return { error }
  }, [user, profile, refreshProfile])

  const removeTrack = useCallback(async (index) => {
    if (!user) return
    const updated = [...(profile?.bgm_playlist || [])]
    updated.splice(index, 1)
    const { error } = await supabase.from('profiles').update({ bgm_playlist: updated }).eq('id', user.id)
    if (!error) {
      const ci = indexRef.current
      if (ci === index) { stopPlayer(); setCurrentIndex(-1) }
      else if (ci > index) setCurrentIndex(prev => prev - 1)
      refreshProfile()
    }
    return { error }
  }, [user, profile, refreshProfile])

  const reorderTracks = useCallback(async (fromIndex, toIndex) => {
    if (!user) return
    const updated = [...(profile?.bgm_playlist || [])]
    const [moved] = updated.splice(fromIndex, 1)
    updated.splice(toIndex, 0, moved)
    const { error } = await supabase.from('profiles').update({ bgm_playlist: updated }).eq('id', user.id)
    if (!error) {
      const ci = indexRef.current
      if (ci === fromIndex) setCurrentIndex(toIndex)
      else {
        if (fromIndex < toIndex) {
          if (ci > fromIndex && ci <= toIndex) setCurrentIndex(prev => prev - 1)
        } else {
          if (ci >= toIndex && ci < fromIndex) setCurrentIndex(prev => prev + 1)
        }
      }
      refreshProfile()
    }
    return { error }
  }, [user, profile, refreshProfile])

  const canvasRef = useRef(null)
  const animRef = useRef(null)
  const visState = useRef({ bars: [], targets: [], phase: 0, lastBeat: 0 })

  // Init bar arrays once
  if (visState.current.bars.length === 0) {
    for (let i = 0; i < BAR_COUNT; i++) {
      visState.current.bars[i] = Math.random() * 0.3
      visState.current.targets[i] = Math.random() * 0.3
    }
  }

  useEffect(() => {
    if (!bgmPlaying) {
      if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null }
      return
    }
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const state = visState.current
    let running = true

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = VIS_HEIGHT + 'px'
      canvas.width = window.innerWidth * dpr
      canvas.height = VIS_HEIGHT * dpr
    }
    resize()
    window.addEventListener('resize', resize)

    function draw(now) {
      if (!running) return
      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      const t = now / 1000
      state.phase += 0.018
      if (t - state.lastBeat > 2 + Math.random() * 2) {
        state.lastBeat = t
        state.phase = 0
      }
      const beat = Math.max(0, 1 - state.phase / 0.35)

      for (let i = 0; i < BAR_COUNT; i++) {
        if (Math.random() < 0.04) state.targets[i] = Math.random() * 0.7 + 0.3
        if (beat > 0) {
          const center = Math.floor(BAR_COUNT / 2) + Math.floor(Math.sin(now / 800) * 8)
          const dist = Math.abs(i - center)
          if (dist < 10) state.targets[i] = Math.max(state.targets[i], beat * (1 - dist / 10) * 1.1)
        }
        state.bars[i] += (state.targets[i] - state.bars[i]) * 0.06
      }

      const barW = Math.max(2, (w - 24) / BAR_COUNT - 2)

      for (let i = 0; i < BAR_COUNT; i++) {
        const val = state.bars[i]
        const bh = Math.max(2, val * val * (h - 6))
        const x = 12 + i * (barW + 2)
        const hue = 260 + (i / BAR_COUNT) * 90 + Math.sin(now / 1500 + i * 0.2) * 10

        const r = Math.min(2, barW / 2)
        ctx.shadowColor = `hsla(${hue}, 100%, 70%, ${0.15 + val * 0.3})`
        ctx.shadowBlur = 6 + val * 10
        ctx.fillStyle = `hsla(${hue}, 85%, ${50 + val * 25}%, ${0.7 + val * 0.3})`
        const yTop = h - bh
        ctx.beginPath()
        ctx.moveTo(x + r, yTop)
        ctx.lineTo(x + barW - r, yTop)
        ctx.quadraticCurveTo(x + barW, yTop, x + barW, yTop + r)
        ctx.lineTo(x + barW, h)
        ctx.lineTo(x, h)
        ctx.lineTo(x, yTop + r)
        ctx.quadraticCurveTo(x, yTop, x + r, yTop)
        ctx.closePath()
        ctx.fill()
      }

      animRef.current = requestAnimationFrame(draw)
    }

    animRef.current = requestAnimationFrame(draw)
    return () => { running = false; window.removeEventListener('resize', resize); if (animRef.current) { cancelAnimationFrame(animRef.current); animRef.current = null } }
  }, [bgmPlaying])

  const parsed = currentUrl ? parseMusicUrl(currentUrl) : null
  const isInvalid = parsed?.type === 'unknown'

  return (
    <BgmContext.Provider value={{
      bgmPlaying, bgmReady, bgmError, toggleBgm,
      playlist, currentTrack, currentIndex, currentUrl,
      playTrack, addTrack, removeTrack, reorderTracks,
      hasMultiple: playlist.length > 1,
      loadExternalBgm: (url) => {
        stopPlayer()
        setExternalBgmUrl(url || '')
      },
      stopBgm: () => { stopPlayer(); setExternalBgmUrl(''); setBgmPlaying(false); },
    }}>
      {children}
      {bgmPlaying && (
        <canvas ref={canvasRef}
          style={{
            position: 'fixed', bottom: 0, left: 0, width: '100%', zIndex: 50,
            pointerEvents: 'none',
            background: 'linear-gradient(to top, rgba(3,3,3,0.7) 0%, transparent 100%)',
          }} />
      )}
      {showButton && (
        <div className="fixed bottom-24 right-4 z-[9999] flex items-center gap-2">
          {currentTrack && (
            <Link to="/playlist"
              className="max-w-[160px] truncate text-[8px] font-black uppercase tracking-widest text-gray-500 bg-zinc-900/80 border border-white/[0.04] rounded-xl px-3 py-2 hover:text-gray-300 transition-all backdrop-blur-xl">
              {currentTrack.title || 'Now Playing'}
            </Link>
          )}
          {playlist.length > 1 && (
            <>
              <button onClick={playPrev}
                className="w-9 h-9 rounded-xl bg-zinc-800/90 border border-white/[0.08] backdrop-blur-xl flex items-center justify-center hover:bg-zinc-700/90 transition-all">
                <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z" />
                </svg>
              </button>
            </>
          )}
          <button onClick={toggleBgm}
            className={`w-11 h-11 rounded-xl backdrop-blur-xl flex items-center justify-center transition-all shadow-lg ${
              isInvalid
                ? 'bg-zinc-800/50 border border-red-500/20 cursor-help'
                : bgmReady
                  ? 'bg-zinc-800/90 border border-white/[0.08] hover:bg-zinc-700/90'
                  : 'bg-zinc-800/50 border border-white/[0.04] cursor-not-allowed'
            }`}
            disabled={!isInvalid && !bgmReady}>
            {isInvalid || bgmError ? (
              <svg className="w-5 h-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            ) : bgmPlaying ? (
              <div className="flex items-end gap-0.5 h-4">
                {[1,2,3,4].map(i => (
                  <div key={i} className="w-0.5 bg-green-400 rounded-full equalizer-bar" style={{ animationDelay: `${i * 0.15}s` }} />
                ))}
              </div>
            ) : (
              <svg className={`w-5 h-5 ${bgmReady ? 'text-gray-400' : 'text-gray-600'}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            )}
          </button>
          {playlist.length > 1 && (
            <button onClick={playNext}
              className="w-9 h-9 rounded-xl bg-zinc-800/90 border border-white/[0.08] backdrop-blur-xl flex items-center justify-center hover:bg-zinc-700/90 transition-all">
              <svg className="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                <path d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" />
              </svg>
            </button>
          )}
        </div>
      )}
    </BgmContext.Provider>
  )
}

export const useBgm = () => useContext(BgmContext)
