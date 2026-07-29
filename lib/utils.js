export const formatRupiah = (num) =>
  new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    minimumFractionDigits: 0,
  }).format(num)

export function getWeeklyISO() {
  const target = new Date()
  const dayNr = (target.getDay() + 6) % 7
  target.setDate(target.getDate() - dayNr + 3)
  const firstThursday = target.valueOf()
  target.setMonth(0, 1)
  if (target.getDay() !== 4) {
    target.setMonth(0, 1 + ((4 - target.getDay()) + 7) % 7)
  }
  const weekNumber = 1 + Math.ceil((firstThursday - target) / 604800000)
  return `GV-${target.getFullYear()}-W${weekNumber}`
}

export function getAvatarUrl(name, size = 64) {
  const encoded = encodeURIComponent(name || 'Hunter')
  return `https://ui-avatars.com/api/?name=${encoded}&background=6D28D9&color=fff&size=${size}`
}

export const EFFECT_CONFIG = {
  fire: { glow: '#ff4500', shadow: 'rgba(255,69,0,0.6)', textClass: 'from-orange-500 via-red-500 to-yellow-500', bgClass: 'from-orange-900/40 via-red-900/20 to-yellow-900/40' },
  lightning: { glow: '#00d4ff', shadow: 'rgba(0,212,255,0.6)', textClass: 'from-cyan-400 via-white to-blue-500', bgClass: 'from-cyan-900/40 via-blue-900/20 to-purple-900/40' },
  water: { glow: '#00b4db', shadow: 'rgba(0,180,219,0.6)', textClass: 'from-blue-400 via-cyan-300 to-teal-400', bgClass: 'from-blue-900/40 via-cyan-900/20 to-teal-900/40' },
  ice: { glow: '#4dd0e1', shadow: 'rgba(77,208,225,0.6)', textClass: 'from-cyan-200 via-white to-blue-300', bgClass: 'from-cyan-900/30 via-blue-900/20 to-indigo-900/30' },
  neon: { glow: '#a855f7', shadow: 'rgba(168,85,247,0.6)', textClass: 'from-purple-400 via-pink-500 to-indigo-400', bgClass: 'from-purple-900/40 via-pink-900/20 to-indigo-900/40' },
  rainbow: { glow: '#ff0000', shadow: 'rgba(255,0,0,0.6)', textClass: 'from-red-500 via-yellow-500 via-green-500 to-blue-500', bgClass: 'from-red-900/30 via-yellow-900/20 via-green-900/20 to-blue-900/30' },
  galaxy: { glow: '#8b5cf6', shadow: 'rgba(139,92,246,0.6)', textClass: 'from-indigo-400 via-purple-500 to-pink-400', bgClass: 'from-indigo-900/40 via-purple-900/20 to-pink-900/40' },
  lava: { glow: '#8b0000', shadow: 'rgba(139,0,0,0.6)', textClass: 'from-red-700 via-orange-500 to-yellow-400', bgClass: 'from-red-900/40 via-orange-900/20 to-yellow-900/30' },
  ocean: { glow: '#0077be', shadow: 'rgba(0,119,190,0.6)', textClass: 'from-blue-900 via-blue-500 to-cyan-400', bgClass: 'from-blue-950/40 via-blue-900/20 to-cyan-900/30' },
}

export function parseMusicUrl(url) {
  if (!url || typeof url !== 'string') return null

  const trimmed = url.trim()

  // YouTube — handles watch?v=, embed/, shorts/, youtu.be/, plus extra params
  let match = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/|shorts\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/)
  if (match) return { type: 'youtube', id: match[1], url: trimmed }

  // YouTube Music
  match = trimmed.match(/music\.youtube\.com\/watch\?v=([a-zA-Z0-9_-]{11})/)
  if (match) return { type: 'youtube', id: match[1], url: trimmed }

  // SoundCloud — handles soundcloud.com/user/track and soundcloud.com/user/sets/playlist
  match = trimmed.match(/soundcloud\.com\/([a-zA-Z0-9_-]+(?:\/[a-zA-Z0-9_-]+)+)/)
  if (match) return { type: 'soundcloud', id: match[1], url: trimmed }

  return { type: 'unknown', id: trimmed, url: trimmed }
}

export async function getCurrentWeeklyPass(supabase) {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'manual_weekly_pass')
    .maybeSingle()
  return (data?.value && data.value.trim() !== '') ? data.value.trim() : getWeeklyISO()
}
