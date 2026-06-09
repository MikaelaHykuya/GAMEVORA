function detectOS() {
  if (typeof window === 'undefined') return 'desktop'
  const ua = window.navigator.userAgent.toLowerCase()
  if (/ipad|iphone|ipod/.test(ua) || (window.navigator.platform === 'MacIntel' && window.navigator.maxTouchPoints > 1)) {
    return 'ios'
  }
  if (/android/.test(ua)) {
    return 'android'
  }
  return 'desktop'
}

const initialOS = detectOS()
if (typeof document !== 'undefined') {
  document.documentElement.setAttribute('data-os', initialOS)
}

export function useDeviceOS() {
  return detectOS()
}
