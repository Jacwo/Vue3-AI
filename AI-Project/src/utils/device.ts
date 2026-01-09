// @/utils/device.ts
export const isMobile = (): boolean => {
  if (typeof window === 'undefined') return false
  
  // 通过用户代理和屏幕宽度判断
  const userAgent = navigator.userAgent.toLowerCase()
  const isMobileUserAgent = /mobile|android|iphone|ipad|ipod/.test(userAgent)
  const isSmallScreen = window.innerWidth <= 768
  
  return isMobileUserAgent || isSmallScreen
}

export const isIOS = (): boolean => {
  if (typeof window === 'undefined') return false
  return /iPad|iPhone|iPod/.test(navigator.userAgent) && !(window as any).MSStream
}

export const isAndroid = (): boolean => {
  if (typeof window === 'undefined') return false
  return /android/.test(navigator.userAgent.toLowerCase())
}

export const getOS = (): 'ios' | 'android' | 'other' => {
  if (isIOS()) return 'ios'
  if (isAndroid()) return 'android'
  return 'other'
}