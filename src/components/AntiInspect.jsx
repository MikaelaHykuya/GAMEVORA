import { useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'

export default function AntiInspect() {
  const { isAdmin } = useAuth()

  useEffect(() => {
    if (isAdmin) return // Admin bebas inspeksi

    const handleContextMenu = (e) => {
      e.preventDefault()
    }

    const handleKeyDown = (e) => {
      // F12
      if (e.keyCode === 123) {
        e.preventDefault()
        return false
      }
      
      // Ctrl+Shift+I / Cmd+Option+I (Inspect)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 73) || (e.metaKey && e.altKey && e.keyCode === 73)) {
        e.preventDefault()
        return false
      }
      
      // Ctrl+Shift+J / Cmd+Option+J (Console)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 74) || (e.metaKey && e.altKey && e.keyCode === 74)) {
        e.preventDefault()
        return false
      }
      
      // Ctrl+U / Cmd+U (View Source)
      if ((e.ctrlKey && e.keyCode === 85) || (e.metaKey && e.keyCode === 85)) {
        e.preventDefault()
        return false
      }
      
      // Ctrl+Shift+C / Cmd+Option+C (Inspect Element)
      if ((e.ctrlKey && e.shiftKey && e.keyCode === 67) || (e.metaKey && e.altKey && e.keyCode === 67)) {
        e.preventDefault()
        return false
      }
    }

    // Attach listeners
    document.addEventListener('contextmenu', handleContextMenu)
    document.addEventListener('keydown', handleKeyDown)

    // Log a warning if they somehow open the console
    const clearInt = setInterval(() => {
      console.clear()
      console.log("%cSTOP! ✋", "color: red; font-family: sans-serif; font-size: 4.5em; font-weight: bolder; text-shadow: #000 1px 1px;")
      console.log("%cThis is a browser feature intended for developers. If someone told you to copy-paste something here to enable a feature or 'hack' someone's account, it is a scam and will give them access to your account.", "font-family: sans-serif; font-size: 1.5em;")
    }, 2000)

    return () => {
      document.removeEventListener('contextmenu', handleContextMenu)
      document.removeEventListener('keydown', handleKeyDown)
      clearInterval(clearInt)
    }
  }, [isAdmin])

  return null
}
