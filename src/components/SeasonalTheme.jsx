import { useEffect } from 'react'

export default function SeasonalTheme() {
  useEffect(() => {
    const now = new Date()
    const month = now.getMonth()
    const day = now.getDate()

    document.body.classList.remove('christmas-theme', 'eid-theme', 'newyear-theme')

    // Christmas: Dec 15 - Jan 5
    if ((month === 11 && day >= 15) || (month === 0 && day <= 5)) {
      document.body.classList.add('christmas-theme')
    }

    // New Year: Dec 28 - Jan 3
    if ((month === 11 && day >= 28) || (month === 0 && day <= 3)) {
      document.body.classList.add('newyear-theme')
    }

    // Eid: approximate based on fixed dates for 2026
    // Eid al-Fitr 2026 ~ March 20
    if ((month === 2 && day >= 18) || (month === 2 && day <= 22)) {
      document.body.classList.add('eid-theme')
    }
  }, [])

  return null
}
