export const FRAMES = [
  { id: '', label: 'None', style: {} },
  { id: 'gold', label: 'Gold', style: { border: '3px solid #fbbf24', boxShadow: '0 0 15px #fbbf24, 0 0 30px #fbbf2455' } },
  { id: 'neon', label: 'Neon', style: { border: '3px solid #a855f7', boxShadow: '0 0 15px #a855f7, 0 0 40px #a855f744' } },
  { id: 'rainbow', label: 'Rainbow', style: { border: '3px solid transparent', backgroundClip: 'padding-box', boxShadow: '0 0 20px rgba(255,255,255,0.1)' } },
  { id: 'crystal', label: 'Crystal', style: { border: '3px solid rgba(255,255,255,0.3)', boxShadow: '0 0 15px rgba(255,255,255,0.1), inset 0 0 20px rgba(255,255,255,0.05)', backdropFilter: 'blur(4px)' } },
  { id: 'fire', label: 'Fire', style: { border: '3px solid #ef4444', boxShadow: '0 0 15px #ef4444, 0 0 35px #ef444455' } },
  { id: 'dark', label: 'Dark Matter', style: { border: '3px solid #6b21a8', boxShadow: '0 0 20px #6b21a8, 0 0 40px #6b21a833' } },
]

export const ACCESSORIES = [
  { id: '', label: 'None', svg: null },
  { id: 'crown', label: 'Crown', svg: '<svg viewBox="0 0 40 24" fill="none"><path d="M4 20L12 4l8 12 8-12 8 16H4z" fill="#fbbf24" stroke="#d97706" stroke-width="1.5"/><circle cx="12" cy="4" r="2" fill="#f59e0b"/><circle cx="28" cy="4" r="2" fill="#f59e0b"/><circle cx="20" cy="10" r="2.5" fill="#ef4444"/></svg>' },
  { id: 'headset', label: 'Headset', svg: '<svg viewBox="0 0 40 28" fill="none"><path d="M4 14a16 16 0 0132 0v4a4 4 0 01-4 4h-3a2 2 0 01-2-2v-6a2 2 0 012-2h3a12 12 0 00-24 0h3a2 2 0 012 2v6a2 2 0 01-2 2H8a4 4 0 01-4-4v-4z" fill="#8b5cf6" stroke="#7c3aed" stroke-width="1.2"/><rect x="6" y="14" width="4" height="10" rx="2" fill="#7c3aed"/><rect x="30" y="14" width="4" height="10" rx="2" fill="#7c3aed"/></svg>' },
  { id: 'glasses', label: 'VR Glasses', svg: '<svg viewBox="0 0 40 20" fill="none"><rect x="2" y="4" width="14" height="12" rx="3" fill="none" stroke="#a78bfa" stroke-width="1.5"/><rect x="24" y="4" width="14" height="12" rx="3" fill="none" stroke="#a78bfa" stroke-width="1.5"/><path d="M16 10h8" stroke="#a78bfa" stroke-width="1.5"/><path d="M4 14l2 3h4l2-3" stroke="#a78bfa" stroke-width="1"/><path d="M36 14l-2 3h-4l-2-3" stroke="#a78bfa" stroke-width="1"/></svg>' },
  { id: 'halo', label: 'Halo', svg: '<svg viewBox="0 0 40 20" fill="none"><ellipse cx="20" cy="2" rx="14" ry="5" fill="none" stroke="#fde047" stroke-width="2" opacity="0.8"/><circle cx="20" cy="2" r="1.5" fill="#fde047"/><circle cx="12" cy="0" r="1" fill="#fde047" opacity="0.5"/><circle cx="28" cy="0" r="1" fill="#fde047" opacity="0.5"/></svg>' },
  { id: 'wings', label: 'Angel Wings', svg: '<svg viewBox="0 0 40 32" fill="none"><path d="M2 26c0-8 6-18 18-14-4 4-6 10-4 14h-4c-4 0-10-4-10 0z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/><path d="M38 26c0-8-6-18-18-14 4 4 6 10 4 14h4c4 0 10-4 10 0z" fill="rgba(255,255,255,0.2)" stroke="rgba(255,255,255,0.3)" stroke-width="1"/></svg>' },
]

export default function AvatarView({ profile, size = 'w-24 h-24', className = '', showInitials = true }) {
  const frame = FRAMES.find(f => f.id === (profile?.avatar_frame || '')) || FRAMES[0]
  const accessory = ACCESSORIES.find(a => a.id === (profile?.avatar_accessory || '')) || ACCESSORIES[0]
  const initials = profile?.full_name
    ? profile.full_name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    : '?'

  const isRainbow = frame.id === 'rainbow'

  return (
    <div className={`relative flex-shrink-0 ${className}`} style={{ width: '', height: '' }}>
      {accessory.svg && (
        <div className="absolute -top-2 left-1/2 -translate-x-1/2 z-10 w-10 h-8 pointer-events-none"
          dangerouslySetInnerHTML={{ __html: accessory.svg }} />
      )}
      <div className={`${size} rounded-2xl overflow-hidden ${frame.id ? '' : 'ring-2 ring-purple-500/30'}`}
        style={frame.id && frame.id !== 'rainbow' ? {
          ...frame.style,
          borderRadius: '1rem',
          overflow: 'hidden',
        } : frame.id === 'rainbow' ? {
          borderRadius: '1rem',
          overflow: 'hidden',
          padding: '3px',
          background: 'linear-gradient(90deg, #ef4444, #f59e0b, #22c55e, #3b82f6, #a855f7, #ef4444)',
          backgroundSize: '200% 100%',
          animation: 'rainbowBorder 2s linear infinite',
        } : {}}>
        <div className={`w-full h-full ${frame.id === 'rainbow' ? 'rounded-[13px] overflow-hidden' : ''}`}>
          {profile?.avatar_url ? (
            <img src={profile.avatar_url} className="w-full h-full object-cover" alt="avatar" />
          ) : (
            <div className={`w-full h-full flex items-center justify-center bg-gradient-to-br from-purple-600 to-blue-600 text-lg font-black text-white ${showInitials ? '' : 'opacity-0'}`}>
              {showInitials ? initials : ''}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
