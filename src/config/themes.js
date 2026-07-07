export const THEMES = [
  { id: 'default', label: 'Default', desc: 'Standard dark layout', preview: 'from-zinc-900 to-zinc-950' },
  { id: 'minimal', label: 'Minimal', desc: 'Clean, less borders, more whitespace', preview: 'from-zinc-950 to-black' },
  { id: 'gaming', label: 'Gaming', desc: 'Neon edges, vibrant accent blocks', preview: 'from-purple-950 via-zinc-900 to-blue-950' },
  { id: 'neon', label: 'Neon', desc: 'Glowing borders and bright colors', preview: 'from-pink-950 via-zinc-900 to-cyan-950' },
  { id: 'royal', label: 'Royal', desc: 'Dark purple and gold accents', preview: 'from-amber-950 via-zinc-900 to-purple-950' },
  { id: 'matrix', label: 'Matrix', desc: 'Green-on-black retro terminal', preview: 'from-green-950 to-black' },
  { id: 'midnight', label: 'Midnight', desc: 'Deep blue, calm and premium', preview: 'from-blue-950 via-zinc-900 to-indigo-950' },
]

export function themeClasses(themeId) {
  switch (themeId) {
    case 'minimal':
      return {
        container: 'bg-gradient-to-b from-zinc-950 to-black',
        card: 'bg-white/[0.02] border border-white/[0.03] rounded-2xl',
        hero: 'bg-white/[0.01] border-b border-white/[0.03]',
        stat: 'bg-white/[0.02] border border-white/[0.03]',
        text: 'text-gray-300',
        accent: 'text-gray-100',
        muted: 'text-gray-600',
      }
    case 'gaming':
      return {
        container: 'bg-gradient-to-br from-purple-950 via-zinc-900 to-blue-950',
        card: 'bg-zinc-900/60 border border-purple-500/20 rounded-3xl shadow-[0_0_15px_rgba(168,85,247,0.1)]',
        hero: 'bg-gradient-to-r from-purple-900/40 via-transparent to-blue-900/40 border-b border-purple-500/20',
        stat: 'bg-zinc-900/60 border border-purple-500/15 rounded-2xl',
        text: 'text-gray-200',
        accent: 'text-purple-300',
        muted: 'text-gray-500',
      }
    case 'neon':
      return {
        container: 'bg-gradient-to-br from-pink-950 via-zinc-900 to-cyan-950',
        card: 'bg-zinc-900/60 border border-pink-500/20 rounded-3xl shadow-[0_0_15px_rgba(236,72,153,0.1)]',
        hero: 'bg-gradient-to-r from-pink-900/40 via-transparent to-cyan-900/40 border-b border-pink-500/20',
        stat: 'bg-zinc-900/60 border border-pink-500/15 rounded-2xl',
        text: 'text-gray-200',
        accent: 'text-pink-300',
        muted: 'text-gray-500',
      }
    case 'royal':
      return {
        container: 'bg-gradient-to-br from-amber-950 via-zinc-900 to-purple-950',
        card: 'bg-zinc-900/60 border border-amber-500/20 rounded-3xl shadow-[0_0_15px_rgba(245,158,11,0.08)]',
        hero: 'bg-gradient-to-r from-amber-900/30 via-transparent to-purple-900/30 border-b border-amber-500/20',
        stat: 'bg-zinc-900/60 border border-amber-500/15 rounded-2xl',
        text: 'text-gray-200',
        accent: 'text-amber-300',
        muted: 'text-gray-500',
      }
    case 'matrix':
      return {
        container: 'bg-gradient-to-b from-green-950 to-black',
        card: 'bg-black/60 border border-green-500/15 rounded-none',
        hero: 'bg-black/40 border-b border-green-500/20',
        stat: 'bg-black/60 border border-green-500/10 rounded-none',
        text: 'text-green-300',
        accent: 'text-green-400',
        muted: 'text-green-700',
      }
    case 'midnight':
      return {
        container: 'bg-gradient-to-br from-blue-950 via-zinc-900 to-indigo-950',
        card: 'bg-blue-900/30 border border-blue-500/15 rounded-3xl',
        hero: 'bg-gradient-to-r from-blue-900/40 via-transparent to-indigo-900/40 border-b border-blue-500/20',
        stat: 'bg-blue-900/30 border border-blue-500/10 rounded-2xl',
        text: 'text-gray-200',
        accent: 'text-blue-300',
        muted: 'text-gray-500',
      }
    default:
      return {
        container: 'bg-[#030303]',
        card: 'bg-zinc-900/40 border border-white/[0.04] rounded-3xl',
        hero: '',
        stat: 'bg-zinc-900/40 border border-white/[0.04] rounded-2xl',
        text: 'text-gray-300',
        accent: 'text-white',
        muted: 'text-gray-500',
      }
  }
}
