import { useState, useEffect } from 'react'
import { syncAll } from '../services/syncService'
import { isAuthenticated } from '../services/authService'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = async () => {
      console.log('Internet detected! Auto syncing...')
      setIsOnline(true)

      // Auto sync when internet comes back
      if (isAuthenticated()) {
        try {
          await syncAll()
          console.log('Auto sync complete!')
          // Reload page data after sync
          window.dispatchEvent(new Event('syncComplete'))
        } catch (error) {
          console.error('Auto sync failed:', error)
        }
      }
    }

    const handleOffline = () => {
      console.log('Gone offline!')
      setIsOnline(false)
    }

    window.addEventListener('online', handleOnline)
    window.addEventListener('offline', handleOffline)

    return () => {
      window.removeEventListener('online', handleOnline)
      window.removeEventListener('offline', handleOffline)
    }
  }, [])

  return isOnline
}