import { useState, useEffect } from 'react'  // ← add useEffect
import { useNavigate } from 'react-router-dom'
import { v4 as uuidv4 } from 'uuid'
import { useGeolocation } from '../hooks/useGeolocation'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { syncAll } from '../services/syncService'
import db from '../services/db'

const PRIMARY = '#0f6e56'
const PRIMARY_DARK = '#085041'
const PRIMARY_LIGHT = '#E1F5EE'
const PRIMARY_BORDER = '#9FE1CB'

export default function NewAssessmentPage() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const { location, loading: gpsLoading, error: gpsError, getLocation } = useGeolocation()

  const [form, setForm] = useState({
    latitude: '',
    longitude: '',
    address: '',
    condition: '',
    total_chickens: '',
    notes: ''
  })
  const [photos, setPhotos] = useState([])
  const [saving, setSaving] = useState(false)
  const [saved, setSaved] = useState(false)
  const [errors, setErrors] = useState({})

  // ← THIS is the fix - useEffect watches location changes
  useEffect(() => {
    if (location) {
      setForm(prev => ({
        ...prev,
        latitude: location.latitude.toFixed(6),
        longitude: location.longitude.toFixed(6)
      }))
    }
  }, [location])  // runs whenever location changes

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const handlePhoto = async (e) => {
    const files = Array.from(e.target.files)
    const newPhotos = []
    for (let file of files) {
      const base64 = await toBase64(file)
      newPhotos.push({
        local_id: uuidv4(),
        base64,
        preview: URL.createObjectURL(file)
      })
    }
    setPhotos(prev => [...prev, ...newPhotos])
  }
const compressImage = (file) => {
  return new Promise((resolve) => {
    const canvas = document.createElement('canvas')
    const ctx = canvas.getContext('2d')
    const img = new Image()
    const url = URL.createObjectURL(file)

    img.onload = () => {
      // Max 600px width — smaller!
      const maxWidth = 600
      const maxHeight = 600
      let width = img.width
      let height = img.height

      if (width > height) {
        if (width > maxWidth) {
          height = height * (maxWidth / width)
          width = maxWidth
        }
      } else {
        if (height > maxHeight) {
          width = width * (maxHeight / height)
          height = maxHeight
        }
      }

      canvas.width = width
      canvas.height = height

      ctx.drawImage(img, 0, 0, width, height)

      // Very aggressive compression — 40% quality
      const base64 = canvas.toDataURL('image/jpeg', 0.4)
      
      console.log('Compressed size:', 
        (base64.length / 1024).toFixed(0), 'KB')
      
      URL.revokeObjectURL(url)
      resolve(base64)
    }

    img.src = url
  })
}
  const toBase64 = (file) => {
    return new Promise((resolve) => {
      const reader = new FileReader()
      reader.onload = () => resolve(reader.result)
      reader.readAsDataURL(file)
    })
  }

  const removePhoto = (localId) => {
    setPhotos(prev => prev.filter(p => p.local_id !== localId))
  }

  const validate = () => {
  const newErrors = {}

  if (!form.latitude || form.latitude === '') {
    newErrors.latitude = 'Latitude is required — tap Get My Location'
  } else if (isNaN(parseFloat(form.latitude))) {
    newErrors.latitude = 'Latitude must be a valid number'
  } else if (parseFloat(form.latitude) < -90 || parseFloat(form.latitude) > 90) {
    newErrors.latitude = 'Latitude must be between -90 and 90'
  }

  if (!form.longitude || form.longitude === '') {
    newErrors.longitude = 'Longitude is required — tap Get My Location'
  } else if (isNaN(parseFloat(form.longitude))) {
    newErrors.longitude = 'Longitude must be a valid number'
  } else if (parseFloat(form.longitude) < -180 || parseFloat(form.longitude) > 180) {
    newErrors.longitude = 'Longitude must be between -180 and 180'
  }

  if (!form.address) newErrors.address = 'Address is required'
  if (!form.condition) newErrors.condition = 'Please select condition'
  if (!form.total_chickens) newErrors.total_chickens = 'Chicken count is required'
  if (parseInt(form.total_chickens) < 0) newErrors.total_chickens = 'Cannot be negative'

  setErrors(newErrors)
  return Object.keys(newErrors).length === 0
}

  const handleSave = async () => {
  if (!validate()) return
  setSaving(true)

  try {
    const localId = uuidv4()

    await db.assessments.add({
      local_id: localId,
      latitude: parseFloat(form.latitude),
      longitude: parseFloat(form.longitude),
      address: form.address,
      condition: form.condition,
      total_chickens: parseInt(form.total_chickens),
      notes: form.notes,
      assessed_at: new Date().toISOString(),
      synced: 0,
      created_at: new Date().toISOString()
    })

    if (photos.length > 0) {
      await db.photos.add({
        local_id: photos[0].local_id,
        assessmentLocalId: localId,
        base64: photos[0].base64,
        synced: 0
      })
    }

    setSaved(true)

    // Auto sync immediately if online
    if (isOnline) {
      console.log('Online — syncing immediately!')
      await syncAll()
      console.log('Immediate sync done!')
    } else {
      console.log('Offline — will sync when online')
    }

    setTimeout(() => navigate('/'), 1500)

  } catch (error) {
    console.error('Save error:', error)
    alert('Error saving: ' + error.message)
  } finally {
    setSaving(false)
  }
}

  if (saved) {
    return (
      <div style={{ minHeight: '100vh', background: '#f0faf6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div style={{ textAlign: 'center', padding: '2rem' }}>
          <div style={{ width: 72, height: 72, background: PRIMARY, borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 1rem' }}>
            <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2.5">
              <polyline points="20 6 9 17 4 12"/>
            </svg>
          </div>
          <h2 style={{ color: PRIMARY_DARK, fontSize: 22, fontWeight: 700, margin: '0 0 8px' }}>
            Assessment Saved!
          </h2>
          <p style={{ color: PRIMARY, fontSize: 14, margin: 0 }}>
            {isOnline ? 'Synced to server successfully.' : 'Saved offline. Will sync when online.'}
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf6' }}>

      {/* Navbar */}
      <div style={{ background: PRIMARY, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 20, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          ←
        </button>
        <div>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
            New Assessment
          </h1>
          <p style={{ color: '#9FE1CB', fontSize: 12, margin: 0 }}>
            {isOnline ? 'Online — will sync immediately' : 'Offline — will sync later'}
          </p>
        </div>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 600, margin: '0 auto' }}>

        {/* GPS */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <p style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, margin: '0 0 12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            GPS Location
          </p>

          <button onClick={getLocation} disabled={gpsLoading}
            style={{ width: '100%', background: gpsLoading ? '#9FE1CB' : PRIMARY, color: 'white', border: 'none', padding: '12px', borderRadius: 10, fontSize: 14, fontWeight: 600, cursor: gpsLoading ? 'not-allowed' : 'pointer', marginBottom: 12 }}>
            {gpsLoading ? 'Getting GPS...' : '📍 Get My Location'}
          </button>

          {gpsError && (
            <p style={{ color: '#DC2626', fontSize: 12, margin: '0 0 8px' }}>{gpsError}</p>
          )}

          {location && (
            <div style={{ background: PRIMARY_LIGHT, borderRadius: 8, padding: '8px 12px', marginBottom: 10, fontSize: 12, color: PRIMARY_DARK }}>
              ✅ Location detected — accuracy: {Math.round(location.accuracy)}m
            </div>
          )}

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Latitude
              </label>
              <input
                type="number"
                value={form.latitude}
                onChange={(e) => handleChange('latitude', e.target.value)}
                placeholder="35.9132"
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${errors.latitude ? '#FCA5A5' : PRIMARY_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', background: '#f9fffe' }}
              />
              {errors.latitude && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.latitude}</p>}
            </div>
            <div>
              <label style={{ fontSize: 11, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 4, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                Longitude
              </label>
              <input
                type="number"
                value={form.longitude}
                onChange={(e) => handleChange('longitude', e.target.value)}
                placeholder="-82.3141"
                style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${errors.longitude ? '#FCA5A5' : PRIMARY_BORDER}`, borderRadius: 10, padding: '10px 12px', fontSize: 14, outline: 'none', background: '#f9fffe' }}
              />
              {errors.longitude && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.longitude}</p>}
            </div>
          </div>
        </div>

        {/* Address */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Farm Address
          </label>
          <input
            type="text"
            value={form.address}
            onChange={(e) => handleChange('address', e.target.value)}
            placeholder="123 Farm Road, Madison County NC"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${errors.address ? '#FCA5A5' : PRIMARY_BORDER}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', background: '#f9fffe' }}
          />
          {errors.address && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.address}</p>}
        </div>

        {/* Condition */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Farm Condition
          </label>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 10 }}>
            {[
              { value: 'good', label: 'Good', bg: '#E1F5EE', activeBg: '#0f6e56', color: '#085041', activeColor: 'white', border: '#9FE1CB' },
              { value: 'moderate', label: 'Moderate', bg: '#FEF3C7', activeBg: '#D97706', color: '#92400E', activeColor: 'white', border: '#FCD34D' },
              { value: 'bad', label: 'Bad', bg: '#FEE2E2', activeBg: '#DC2626', color: '#991B1B', activeColor: 'white', border: '#FCA5A5' }
            ].map((opt) => (
              <button key={opt.value}
                onClick={() => handleChange('condition', opt.value)}
                style={{
                  padding: '14px 8px',
                  borderRadius: 10,
                  border: `2px solid ${form.condition === opt.value ? opt.activeBg : opt.border}`,
                  background: form.condition === opt.value ? opt.activeBg : opt.bg,
                  color: form.condition === opt.value ? opt.activeColor : opt.color,
                  fontSize: 14, fontWeight: 700, cursor: 'pointer'
                }}>
                {opt.label}
              </button>
            ))}
          </div>
          {errors.condition && <p style={{ color: '#DC2626', fontSize: 11, margin: '8px 0 0' }}>{errors.condition}</p>}
        </div>

        {/* Chickens */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Total Chickens
          </label>
          <input
            type="number"
            value={form.total_chickens}
            onChange={(e) => handleChange('total_chickens', e.target.value)}
            placeholder="5000"
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${errors.total_chickens ? '#FCA5A5' : PRIMARY_BORDER}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', background: '#f9fffe' }}
          />
          {errors.total_chickens && <p style={{ color: '#DC2626', fontSize: 11, margin: '4px 0 0' }}>{errors.total_chickens}</p>}
        </div>

        {/* Notes */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1rem' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 8, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Notes (Optional)
          </label>
          <textarea
            value={form.notes}
            onChange={(e) => handleChange('notes', e.target.value)}
            placeholder="Additional observations about the flood damage..."
            rows={3}
            style={{ width: '100%', boxSizing: 'border-box', border: `1px solid ${PRIMARY_BORDER}`, borderRadius: 10, padding: '12px 14px', fontSize: 14, outline: 'none', background: '#f9fffe', resize: 'vertical', fontFamily: 'inherit' }}
          />
        </div>

        {/* Photos */}
        <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1.25rem', marginBottom: '1.5rem' }}>
          <label style={{ fontSize: 12, fontWeight: 600, color: PRIMARY, display: 'block', marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Photos
          </label>

          <label style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: PRIMARY_LIGHT, border: `2px dashed ${PRIMARY_BORDER}`, borderRadius: 10, padding: '20px', textAlign: 'center', cursor: 'pointer' }}>
            <input type="file" accept="image/*" capture="environment" onChange={handlePhoto} style={{ display: 'none' }} />
            <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke={PRIMARY} strokeWidth="2" style={{ margin: '0 auto 8px', display: 'block' }}>
              <path d="M23 19a2 2 0 0 1-2 2H3a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h4l2-3h6l2 3h4a2 2 0 0 1 2 2z"/>
              <circle cx="12" cy="13" r="4"/>
            </svg>
            <p style={{ fontSize: 14, fontWeight: 600, color: PRIMARY, margin: '0 0 2px' }}>Take Photo or Upload</p>
            <p style={{ fontSize: 12, color: PRIMARY, margin: 0, opacity: 0.7 }}>Opens camera on phone</p>
          </label>

          {photos.length > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, marginTop: 12 }}>
              {photos.map((photo) => (
                <div key={photo.local_id} style={{ position: 'relative', aspectRatio: '1', borderRadius: 10, overflow: 'hidden' }}>
                  <img src={photo.preview} alt="farm" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                  <button onClick={() => removePhoto(photo.local_id)}
                    style={{ position: 'absolute', top: 4, right: 4, background: 'rgba(0,0,0,0.6)', color: 'white', border: 'none', borderRadius: '50%', width: 24, height: 24, cursor: 'pointer', fontSize: 14, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    ×
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Save Button */}
        <button
          onClick={handleSave}
          disabled={saving}
          style={{ width: '100%', background: saving ? '#9FE1CB' : PRIMARY, color: 'white', border: 'none', padding: '16px', borderRadius: 14, fontSize: 16, fontWeight: 700, cursor: saving ? 'not-allowed' : 'pointer', marginBottom: '2rem' }}>
          {saving ? 'Saving...' : 'Save Assessment'}
        </button>
      </div>
    </div>
  )
}