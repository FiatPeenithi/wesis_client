const PENDING_ROUTE_KEY = 'wesis_pending_route'

/** Keep an internal deep link while consent and onboarding are completed. */
export function savePendingRoute(path: string) {
  if (!path.startsWith('/') || path.startsWith('//') || path.includes('\\')) return
  if (path === '/policy' || path === '/login') return

  try {
    sessionStorage.setItem(PENDING_ROUTE_KEY, path)
  } catch {
    // Continue the consent flow even when session storage is unavailable.
  }
}

export function consumePendingRoute(): string | null {
  try {
    const path = sessionStorage.getItem(PENDING_ROUTE_KEY)
    sessionStorage.removeItem(PENDING_ROUTE_KEY)
    if (path?.startsWith('/') && !path.startsWith('//') && !path.includes('\\')) return path
  } catch {
    // The ordinary dashboard redirect remains available without session storage.
  }
  return null
}
