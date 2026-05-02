import { useState, useEffect } from 'react'
import { syncAll } from '../services/syncService'
import { isAuthenticated } from '../services/authService'

export const useOnlineStatus = () => {
  const [isOnline, setIsOnline] = useState(navigator.onLine)

  useEffect(() => {
    const handleOnline = async () => {
      setIsOnline(true)
      console.log('Back online! Starting sync...')
      // Auto sync when internet comes back
      if (isAuthenticated()) {
        await syncAll()
      }
    }

    const handleOffline = () => {
      setIsOnline(false)
      console.log('Gone offline!')
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