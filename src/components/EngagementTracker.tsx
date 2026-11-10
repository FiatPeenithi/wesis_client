import { useEffect, useRef } from 'react'
import api from '../lib/api'
import { useAuthStore } from '../store/useAuthStore'

function getAccessChannel(): 'WEB' | 'PWA' {
  const iosStandalone = (window.navigator as Navigator & { standalone?: boolean }).standalone === true
  const displayStandalone = window.matchMedia?.('(display-mode: standalone)').matches === true
  return iosStandalone || displayStandalone ? 'PWA' : 'WEB'
}

/**
 * Sends one best-effort access signal whenever an authenticated app starts.
 * The API preserves only the account's first signal, so route changes and
 * refreshes never create additional usage records.
 */
export function EngagementTracker() {
  const userId = useAuthStore((state) => state.user?.id)
  const sentForUser = useRef<string | null>(null)

  useEffect(() => {
    if (!userId || sentForUser.current === userId) return
    sentForUser.current = userId

    void api.post('/engagement/access', { userId, channel: getAccessChannel() }).catch(() => {
      // Usage tracking must never affect access to the client application.
    })
  }, [userId])

  return null
}
