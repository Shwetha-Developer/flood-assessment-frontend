import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../services/authService'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import api from '../services/api'

const PRIMARY = '#0f6e56'
const PRIMARY_DARK = '#085041'
const PRIMARY_LIGHT = '#E1F5EE'
const PRIMARY_BORDER = '#9FE1CB'

export default function SupervisorDashboard() {
  const navigate = useNavigate()
  const [user] = useState(getUser())
  const isOnline = useOnlineStatus()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [exporting, setExporting] = useState(false)
// Add this state and function at the top of component
const [photoUrls, setPhotoUrls] = useState({})

const loadPhoto = async (photoId) => {
  if (photoUrls[photoId]) return // already loaded
  
  try {
    const token = localStorage.getItem('token')
    const response = await fetch(`http://127.0.0.1:8000/api/photos/${photoId}`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'application/json'
      }
    })
    const data = await response.json()
    setPhotoUrls(prev => ({ ...prev, [photoId]: data.base64 }))
  } catch (error) {
    console.error('Photo load error:', error)
  }
}
  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    setLoading(true)
    try {
      const response = await api.get('/assessments')
      setAssessments(response.data.data)
    } catch (error) {
      console.error('Error loading:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleExportCSV = async () => {
  setExporting(true)
  try {
    const token = localStorage.getItem('token')
    
    // Use fetch instead of axios for file download
    const response = await fetch('http://127.0.0.1:8000/api/export/csv', {
      method: 'GET',
      headers: {
        'Authorization': `Bearer ${token}`,
        'Accept': 'text/csv',
      }
    })

    if (!response.ok) throw new Error('Export failed')

    const blob = await response.blob()
    const url = window.URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'flood-assessments.csv')
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)

  } catch (error) {
    console.error('Export error:', error)
    alert('Export failed. Please try again.')
  } finally {
    setExporting(false)
  }
}

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const filtered = assessments.filter(a => {
    if (filter === 'bad') return a.condition === 'bad'
    if (filter === 'moderate') return a.condition === 'moderate'
    if (filter === 'good') return a.condition === 'good'
    return true
  })

  const stats = {
    total: assessments.length,
    bad: assessments.filter(a => a.condition === 'bad').length,
    moderate: assessments.filter(a => a.condition === 'moderate').length,
    good: assessments.filter(a => a.condition === 'good').length,
    totalChickens: assessments.reduce((sum, a) => sum + (a.total_chickens || 0), 0)
  }

  const conditionStyle = (condition) => {
    if (condition === 'bad') return { bg: '#FEE2E2', text: '#991B1B' }
    if (condition === 'moderate') return { bg: '#FEF3C7', text: '#92400E' }
    return { bg: PRIMARY_LIGHT, text: PRIMARY_DARK }
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf6' }}>

      {/* Navbar */}
      <div style={{ background: PRIMARY, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
            Supervisor Dashboard
          </h1>
          <p style={{ color: '#9FE1CB', fontSize: 12, margin: 0 }}>
            Madison County, NC — All Assessments
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: isOnline ? '#4ade80' : '#fbbf24' }}></div>
            <span style={{ color: 'white', fontSize: 12 }}>{isOnline ? 'Online' : 'Offline'}</span>
          </div>
          <button onClick={handleLogout}
            style={{ background: 'rgba(255,255,255,0.15)', color: 'white', border: 'none', padding: '6px 12px', borderRadius: 8, fontSize: 12, cursor: 'pointer' }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 700, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div>
            <h2 style={{ fontSize: 20, fontWeight: 700, color: PRIMARY_DARK, margin: '0 0 4px' }}>
              Welcome, {user?.name}
            </h2>
            <p style={{ fontSize: 13, color: PRIMARY, margin: 0 }}>
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button
            onClick={loadAssessments}
            style={{ background: PRIMARY_LIGHT, color: PRIMARY_DARK, border: `1px solid ${PRIMARY_BORDER}`, padding: '8px 14px', borderRadius: 10, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
            Refresh
          </button>
        </div>

        {/* Stats Grid */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(120px, 1fr))', gap: 10, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total Farms', value: stats.total, bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
            { label: 'Bad Condition', value: stats.bad, bg: '#FEE2E2', color: '#991B1B' },
            { label: 'Moderate', value: stats.moderate, bg: '#FEF3C7', color: '#92400E' },
            { label: 'Good', value: stats.good, bg: '#DCFCE7', color: '#166534' },
            { label: 'Total Chickens', value: stats.totalChickens.toLocaleString(), bg: '#EDE9FE', color: '#5B21B6' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: '12px 10px', textAlign: 'center' }}>
              <p style={{ fontSize: 20, fontWeight: 700, color: stat.color, margin: '0 0 2px' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: stat.color, margin: 0, opacity: 0.8 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Export Button */}
        <button
          onClick={handleExportCSV}
          disabled={exporting || !isOnline}
          style={{
            width: '100%',
            background: exporting || !isOnline ? '#9FE1CB' : PRIMARY,
            color: 'white', border: 'none',
            padding: '14px', borderRadius: 12,
            fontSize: 15, fontWeight: 700,
            cursor: exporting || !isOnline ? 'not-allowed' : 'pointer',
            marginBottom: '1.5rem',
            display: 'flex', alignItems: 'center',
            justifyContent: 'center', gap: 8
          }}>
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2">
            <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/>
            <polyline points="7 10 12 15 17 10"/>
            <line x1="12" y1="15" x2="12" y2="3"/>
          </svg>
          {exporting ? 'Exporting...' : 'Export All as CSV'}
        </button>

        {/* Filter Tabs */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: `All (${stats.total})` },
            { key: 'bad', label: `Bad (${stats.bad})` },
            { key: 'moderate', label: `Moderate (${stats.moderate})` },
            { key: 'good', label: `Good (${stats.good})` },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20,
                border: `1px solid ${filter === f.key ? PRIMARY : PRIMARY_BORDER}`,
                background: filter === f.key ? PRIMARY : 'white',
                color: filter === f.key ? 'white' : PRIMARY,
                fontSize: 13, fontWeight: 600,
                cursor: 'pointer', whiteSpace: 'nowrap'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* Assessment List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: PRIMARY }}>
            Loading assessments...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: PRIMARY, fontSize: 14, margin: 0 }}>No assessments found</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((a) => {
              const c = conditionStyle(a.condition)
              return (
                <div key={a.id} style={{ background: 'white', borderRadius: 14, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1rem 1.25rem' }}>

                  {/* Top Row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: PRIMARY_DARK, margin: '0 0 4px' }}>
                        {a.address}
                      </p>
                      <p style={{ fontSize: 12, color: PRIMARY, margin: 0 }}>
                        Assessor: {a.user?.name || 'Unknown'}
                      </p>
                    </div>
                    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, whiteSpace: 'nowrap', marginLeft: 8 }}>
                      {a.condition?.charAt(0).toUpperCase() + a.condition?.slice(1)}
                    </span>
                  </div>

                  {/* Details Grid */}
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 8, marginBottom: a.notes ? 10 : 0 }}>
                    <div style={{ background: '#f9fffe', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ fontSize: 10, color: PRIMARY, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Chickens</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: PRIMARY_DARK, margin: 0 }}>
                        {a.total_chickens?.toLocaleString()}
                      </p>
                    </div>
                    <div style={{ background: '#f9fffe', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ fontSize: 10, color: PRIMARY, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Latitude</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: PRIMARY_DARK, margin: 0 }}>
                        {parseFloat(a.latitude).toFixed(4)}
                      </p>
                    </div>
                    <div style={{ background: '#f9fffe', borderRadius: 8, padding: '8px 10px' }}>
                      <p style={{ fontSize: 10, color: PRIMARY, margin: '0 0 2px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Longitude</p>
                      <p style={{ fontSize: 14, fontWeight: 700, color: PRIMARY_DARK, margin: 0 }}>
                        {parseFloat(a.longitude).toFixed(4)}
                      </p>
                    </div>
                  </div>

                  {/* Notes */}
                  {a.notes && (
                    <div style={{ background: PRIMARY_LIGHT, borderRadius: 8, padding: '8px 12px', marginTop: 8 }}>
                      <p style={{ fontSize: 12, color: PRIMARY_DARK, margin: 0 }}>{a.notes}</p>
                    </div>
                  )}

                 {/* Photos */}
{a.photos && a.photos.length > 0 && (
  <div style={{ marginTop: 10 }}>
    <p style={{ 
      fontSize: 11, color: PRIMARY, 
      margin: '0 0 8px', fontWeight: 600,
      textTransform: 'uppercase', letterSpacing: '0.05em'
    }}>
      Photos ({a.photos.length})
    </p>
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 6 }}>
      {a.photos.map((photo) => (
        <PhotoThumb
          key={photo.id}
          photo={photo}
          photoUrls={photoUrls}
          loadPhoto={loadPhoto}
        />
      ))}
    </div>
  </div>
)}

                  {/* Synced date */}
                  <p style={{ fontSize: 11, color: '#888', margin: '8px 0 0' }}>
                    Synced: {a.synced_at ? new Date(a.synced_at).toLocaleString() : 'N/A'}
                  </p>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}

function PhotoThumb({ photo, photoUrls, loadPhoto }) {
  const [loaded, setLoaded] = useState(false)

  useEffect(() => {
    loadPhoto(photo.id)
  }, [photo.id])

  const src = photoUrls[photo.id]

  return (
    <div style={{
      aspectRatio: '1',
      borderRadius: 8,
      overflow: 'hidden',
      background: '#E1F5EE',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center'
    }}>
      {src ? (
        <img
          src={src}
          alt="farm"
          style={{ width: '100%', height: '100%', objectFit: 'cover' }}
        />
      ) : (
        <div style={{ fontSize: 11, color: '#0f6e56' }}>Loading...</div>
      )}
    </div>
  )
}