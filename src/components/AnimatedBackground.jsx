import { useEffect, useRef } from 'react'

const COUNT = 120

export default function AnimatedBackground() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    const particles = []
    let mouseX = 0, mouseY = 0
    let running = true

    function resize() {
      const dpr = window.devicePixelRatio || 1
      canvas.style.width = window.innerWidth + 'px'
      canvas.style.height = window.innerHeight + 'px'
      canvas.width = window.innerWidth * dpr
      canvas.height = window.innerHeight * dpr
    }
    resize()
    window.addEventListener('resize', resize)
    window.addEventListener('mousemove', e => { mouseX = e.clientX; mouseY = e.clientY })

    for (let i = 0; i < COUNT; i++) {
      particles.push({
        x: Math.random() * window.innerWidth,
        y: Math.random() * window.innerHeight,
        vx: (Math.random() - 0.5) * 0.3,
        vy: (Math.random() - 0.5) * 0.3,
        size: Math.random() * 2 + 0.5,
        alpha: Math.random() * 0.5 + 0.2,
        hue: Math.random() * 60 + 240,
      })
    }

    function draw() {
      if (!running) return
      const dpr = window.devicePixelRatio || 1
      const w = canvas.width / dpr
      const h = canvas.height / dpr
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      ctx.clearRect(0, 0, w, h)

      for (const p of particles) {
        p.x += p.vx
        p.y += p.vy
        if (p.x < 0) p.x = w
        if (p.x > w) p.x = 0
        if (p.y < 0) p.y = h
        if (p.y > h) p.y = 0

        const dx = mouseX - p.x
        const dy = mouseY - p.y
        const dist = Math.sqrt(dx * dx + dy * dy)
        if (dist < 150) {
          p.vx -= dx / dist * 0.002
          p.vy -= dy / dist * 0.002
        }
        p.vx *= 0.999
        p.vy *= 0.999

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `hsla(${p.hue}, 80%, 70%, ${p.alpha})`
        ctx.shadowColor = `hsla(${p.hue}, 100%, 70%, ${p.alpha * 0.5})`
        ctx.shadowBlur = 6
        ctx.fill()
      }

      // Draw connections
      ctx.shadowBlur = 0
      for (let i = 0; i < particles.length; i++) {
        for (let j = i + 1; j < particles.length; j++) {
          const dx = particles[i].x - particles[j].x
          const dy = particles[i].y - particles[j].y
          const dist = Math.sqrt(dx * dx + dy * dy)
          if (dist < 120) {
            ctx.beginPath()
            ctx.moveTo(particles[i].x, particles[i].y)
            ctx.lineTo(particles[j].x, particles[j].y)
            ctx.strokeStyle = `hsla(260, 80%, 70%, ${(1 - dist / 120) * 0.15})`
            ctx.lineWidth = 0.5
            ctx.stroke()
          }
        }
      }

      requestAnimationFrame(draw)
    }

    requestAnimationFrame(draw)
    return () => { running = false; window.removeEventListener('resize', resize) }
  }, [])

  return (
    <canvas ref={canvasRef}
      style={{
        position: 'fixed', inset: 0, zIndex: -1,
        pointerEvents: 'none',
        background: 'radial-gradient(ellipse at 30% 50%, rgba(40,10,80,0.4) 0%, transparent 70%), radial-gradient(ellipse at 70% 30%, rgba(10,30,80,0.3) 0%, transparent 60%), #030303',
      }} />
  )
}
