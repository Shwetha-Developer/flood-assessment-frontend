import db from './db'
import api from './api'

export const syncAll = async () => {
  try {
    await syncAssessments()
    await syncPhotos()
    return { success: true }
  } catch (error) {
    console.error('Sync failed:', error)
    return { success: false, error }
  }
}

const syncAssessments = async () => {
  const pending = await db.assessments
    .where('synced').equals(0)
    .toArray()

  if (pending.length === 0) return

  // Filter out invalid records before syncing
  const valid = pending.filter(a => {
    const lat = parseFloat(a.latitude)
    const lng = parseFloat(a.longitude)
    return (
      !isNaN(lat) && lat >= -90 && lat <= 90 &&
      !isNaN(lng) && lng >= -180 && lng <= 180 &&
      a.address && a.condition && a.total_chickens
    )
  })

  // Mark invalid records so they don't keep failing
  const invalid = pending.filter(a => {
    const lat = parseFloat(a.latitude)
    const lng = parseFloat(a.longitude)
    return (
      isNaN(lat) || lat < -90 || lat > 90 ||
      isNaN(lng) || lng < -180 || lng > 180
    )
  })

  // Log invalid records
  if (invalid.length > 0) {
    console.warn('Skipping invalid records:', invalid.length)
    // Mark as synced with error so they don't block sync
    for (let a of invalid) {
      await db.assessments
        .where('local_id').equals(a.local_id)
        .modify({ synced: 2, syncError: 'Invalid coordinates' })
    }
  }

  if (valid.length === 0) return

  console.log('Syncing valid assessments:', valid.length)

  const response = await api.post('/assessments/batch-sync', {
    assessments: valid.map(a => ({
      local_id:       a.local_id,
      latitude:       parseFloat(a.latitude),
      longitude:      parseFloat(a.longitude),
      address:        a.address,
      condition:      a.condition,
      total_chickens: parseInt(a.total_chickens),
      notes:          a.notes || '',
      assessed_at:    a.assessed_at
    }))
  })

  console.log('Sync response:', response.data)

  for (let result of response.data.results) {
    await db.assessments
      .where('local_id').equals(result.local_id)
      .modify({
        synced:   1,
        serverId: result.server_id
      })
  }
}

const syncPhotos = async () => {
  const pending = await db.photos
    .where('synced').equals(0)
    .toArray()

  if (pending.length === 0) return

  console.log('Syncing photos one by one:', pending.length)

  for (let photo of pending) {
    try {
      // Find assessment server ID
      const assessment = await db.assessments
        .where('local_id').equals(photo.assessmentLocalId)
        .first()

      if (!assessment?.serverId) {
        console.warn('No server ID for assessment:', photo.assessmentLocalId)
        continue
      }

      console.log('Sending photo:', photo.local_id)
      console.log('Photo size:', (photo.base64?.length / 1024).toFixed(0), 'KB')

      // Send ONE photo at a time
      const response = await api.post(
        `/assessments/${assessment.serverId}/photos`,
        {
          photos: [{
            local_id: photo.local_id,
            base64: photo.base64
          }]
        }
      )

      console.log('Photo synced:', response.data)

      // Mark as synced
      await db.photos
        .where('local_id').equals(photo.local_id)
        .modify({ synced: 1 })

    } catch (error) {
      console.error('Photo sync error:', error.response?.data || error.message)
    }
  }

  console.log('All photos processed!')
}

export const getPendingCount = async () => {
  const count = await db.assessments
    .where('synced').equals(0)
    .count()
  return count
}