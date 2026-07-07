import { useState, useEffect } from 'react'

export default function TypingText({ text, speed = 40, delay = 0, className = '' }) {
  const [displayed, setDisplayed] = useState('')
  const [started, setStarted] = useState(false)

  useEffect(() => {
    const timer = setTimeout(() => setStarted(true), delay)
    return () => clearTimeout(timer)
  }, [delay])

  useEffect(() => {
    if (!started || !text) return
    let i = 0
    const interval = setInterval(() => {
      i++
      setDisplayed(text.slice(0, i))
      if (i >= text.length) clearInterval(interval)
    }, speed)
    return () => clearInterval(interval)
  }, [started, text, speed])

  if (!text) return null

  return (
    <span className={className}>
      {displayed}
      {displayed.length < text.length && <span className="typing-cursor" />}
    </span>
  )
}
