import { useState } from 'react'

export const useGeolocation = () => {
  const [location, setLocation] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  const getLocation = () => {
    // Check if browser supports GPS
    if (!navigator.geolocation) {
      setError('Geolocation is not supported by your browser')
      return
    }

    setLoading(true)
    setError(null)

    navigator.geolocation.getCurrentPosition(
      (position) => {
        setLocation({
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
          accuracy: position.coords.accuracy
        })
        setLoading(false)
      },
      (error) => {
        setError('Unable to get location. Please enter manually.')
        setLoading(false)
      },
      {
        enableHighAccuracy: true,  // use GPS not WiFi
        timeout: 10000,            // wait 10 seconds
        maximumAge: 0              // don't use cached location
      }
    )
  }

  return { location, loading, error, getLocation }
}