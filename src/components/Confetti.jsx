import { useEffect, useState } from 'react'
import { createPortal } from 'react-dom'

const COLORS = ['#a855f7', '#ec4899', '#f59e0b', '#3b82f6', '#22c55e', '#ef4444', '#06b6d4']

export default function Confetti({ active = false, count = 60 }) {
  const [pieces, setPieces] = useState([])

  useEffect(() => {
    if (!active) { setPieces([]); return }
    const newPieces = Array.from({ length: count }, (_, i) => ({
      id: Date.now() + i,
      x: Math.random() * 100,
      color: COLORS[i % COLORS.length],
      size: 6 + Math.random() * 8,
      dur: 1.5 + Math.random() * 2,
      delay: Math.random() * 0.5,
      shape: Math.random() > 0.5 ? '50%' : '2px',
    }))
    setPieces(newPieces)
    const timer = setTimeout(() => setPieces([]), 4000)
    return () => clearTimeout(timer)
  }, [active, count])

  if (pieces.length === 0) return null

  return createPortal(
    <div className="fixed inset-0 pointer-events-none z-[99999] overflow-hidden">
      {pieces.map(p => (
        <div key={p.id} className="confetti-piece"
          style={{
            left: `${p.x}%`,
            top: '-10px',
            width: p.size,
            height: p.size,
            background: p.color,
            borderRadius: p.shape,
            '--dur': `${p.dur}s`,
            animationDelay: `${p.delay}s`,
          }} />
      ))}
    </div>,
    document.body
  )
}
