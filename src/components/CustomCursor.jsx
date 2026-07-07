import { useEffect, useRef } from 'react'

export default function CustomCursor() {
  const cursorRef = useRef(null)
  const dotRef = useRef(null)
  const trailRef = useRef(null)

  useEffect(() => {
    const isMobile = window.innerWidth <= 768
    if (isMobile) return

    let trailTimer = 0

    const move = (e) => {
      const { clientX, clientY } = e
      if (cursorRef.current) {
        cursorRef.current.style.left = clientX + 'px'
        cursorRef.current.style.top = clientY + 'px'
      }
      if (dotRef.current) {
        dotRef.current.style.left = clientX + 'px'
        dotRef.current.style.top = clientY + 'px'
      }
      if (trailRef.current) {
        clearTimeout(trailTimer)
        trailTimer = setTimeout(() => {
          const trail = document.createElement('div')
          trail.className = 'cursor-trail'
          trail.style.left = clientX + 'px'
          trail.style.top = clientY + 'px'
          document.body.appendChild(trail)
          setTimeout(() => trail.remove(), 600)
        }, 50)
      }
    }

    const addHover = () => cursorRef.current?.classList.add('hovering')
    const removeHover = () => cursorRef.current?.classList.remove('hovering')

    document.addEventListener('mousemove', move)
    document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach(el => {
      el.addEventListener('mouseenter', addHover)
      el.addEventListener('mouseleave', removeHover)
    })

    const observer = new MutationObserver(() => {
      document.querySelectorAll('a, button, input, select, textarea, [role="button"]').forEach(el => {
        el.removeEventListener('mouseenter', addHover)
        el.removeEventListener('mouseleave', removeHover)
        el.addEventListener('mouseenter', addHover)
        el.addEventListener('mouseleave', removeHover)
      })
    })
    observer.observe(document.body, { childList: true, subtree: true })

    return () => {
      document.removeEventListener('mousemove', move)
      observer.disconnect()
    }
  }, [])

  return (
    <>
      <div ref={cursorRef} className="custom-cursor" />
      <div ref={dotRef} className="custom-cursor-dot" />
    </>
  )
}
