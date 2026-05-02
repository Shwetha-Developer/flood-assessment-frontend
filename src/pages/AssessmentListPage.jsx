import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import { syncAll } from '../services/syncService'
import db from '../services/db'

const PRIMARY = '#0f6e56'
const PRIMARY_DARK = '#085041'
const PRIMARY_LIGHT = '#E1F5EE'
const PRIMARY_BORDER = '#9FE1CB'

export default function AssessmentListPage() {
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()
  const [assessments, setAssessments] = useState([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')
  const [syncing, setSyncing] = useState(false)
  const [syncMsg, setSyncMsg] = useState('')

  useEffect(() => {
    loadAssessments()
  }, [])

  const loadAssessments = async () => {
    setLoading(true)
    const all = await db.assessments.orderBy('id').reverse().toArray()
    setAssessments(all)
    setLoading(false)
  }

  const handleSync = async () => {
    if (!isOnline) return
    setSyncing(true)
    setSyncMsg('Syncing...')
    await syncAll()
    await loadAssessments()
    setSyncing(false)
    setSyncMsg('Synced! ✅')
    setTimeout(() => setSyncMsg(''), 3000)
  }

  const filtered = assessments.filter(a => {
    if (filter === 'pending') return a.synced === 0
    if (filter === 'synced') return a.synced === 1
    if (filter === 'bad') return a.condition === 'bad'
    if (filter === 'moderate') return a.condition === 'moderate'
    if (filter === 'good') return a.condition === 'good'
    return true
  })

  const conditionStyle = (condition) => {
    if (condition === 'bad') return { bg: '#FEE2E2', text: '#991B1B' }
    if (condition === 'moderate') return { bg: '#FEF3C7', text: '#92400E' }
    return { bg: PRIMARY_LIGHT, text: PRIMARY_DARK }
  }

  const stats = {
    total: assessments.length,
    bad: assessments.filter(a => a.condition === 'bad').length,
    moderate: assessments.filter(a => a.condition === 'moderate').length,
    good: assessments.filter(a => a.condition === 'good').length,
    pending: assessments.filter(a => a.synced === 0).length,
  }

  return (
    <div style={{ minHeight: '100vh', background: '#f0faf6' }}>

      {/* Navbar */}
      <div style={{ background: PRIMARY, padding: '1rem 1.5rem', display: 'flex', alignItems: 'center', gap: 12 }}>
        <button onClick={() => navigate('/')}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', width: 36, height: 36, borderRadius: 8, cursor: 'pointer', fontSize: 20 }}>
          ←
        </button>
        <div style={{ flex: 1 }}>
          <h1 style={{ color: 'white', fontSize: 18, fontWeight: 700, margin: 0 }}>
            My Assessments
          </h1>
          <p style={{ color: '#9FE1CB', fontSize: 12, margin: 0 }}>
            {assessments.length} total records
          </p>
        </div>
        <button onClick={handleSync} disabled={!isOnline || syncing}
          style={{ background: 'rgba(255,255,255,0.15)', border: 'none', color: 'white', padding: '6px 14px', borderRadius: 8, fontSize: 13, fontWeight: 600, cursor: 'pointer' }}>
          {syncing ? 'Syncing...' : 'Sync'}
        </button>
      </div>

      <div style={{ padding: '1.5rem', maxWidth: 600, margin: '0 auto' }}>

        {/* Sync Message */}
        {syncMsg && (
          <div style={{ background: PRIMARY_LIGHT, borderRadius: 10, padding: '10px 14px', marginBottom: '1rem', fontSize: 13, color: PRIMARY_DARK, fontWeight: 600 }}>
            {syncMsg}
          </div>
        )}

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8, marginBottom: '1.5rem' }}>
          {[
            { label: 'Total', value: stats.total, bg: PRIMARY_LIGHT, color: PRIMARY_DARK },
            { label: 'Bad', value: stats.bad, bg: '#FEE2E2', color: '#991B1B' },
            { label: 'Moderate', value: stats.moderate, bg: '#FEF3C7', color: '#92400E' },
            { label: 'Good', value: stats.good, bg: '#DCFCE7', color: '#166534' },
          ].map((stat) => (
            <div key={stat.label} style={{ background: stat.bg, borderRadius: 12, padding: '12px 8px', textAlign: 'center' }}>
              <p style={{ fontSize: 22, fontWeight: 700, color: stat.color, margin: '0 0 2px' }}>
                {stat.value}
              </p>
              <p style={{ fontSize: 11, color: stat.color, margin: 0, opacity: 0.8 }}>
                {stat.label}
              </p>
            </div>
          ))}
        </div>

        {/* Filters */}
        <div style={{ display: 'flex', gap: 8, marginBottom: '1rem', overflowX: 'auto', paddingBottom: 4 }}>
          {[
            { key: 'all', label: 'All' },
            { key: 'pending', label: `Pending (${stats.pending})` },
            { key: 'synced', label: 'Synced' },
            { key: 'bad', label: 'Bad' },
            { key: 'moderate', label: 'Moderate' },
            { key: 'good', label: 'Good' },
          ].map((f) => (
            <button key={f.key} onClick={() => setFilter(f.key)}
              style={{
                padding: '6px 14px', borderRadius: 20, whiteSpace: 'nowrap',
                border: `1px solid ${filter === f.key ? PRIMARY : PRIMARY_BORDER}`,
                background: filter === f.key ? PRIMARY : 'white',
                color: filter === f.key ? 'white' : PRIMARY,
                fontSize: 13, fontWeight: 600, cursor: 'pointer'
              }}>
              {f.label}
            </button>
          ))}
        </div>

        {/* List */}
        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: PRIMARY }}>
            Loading...
          </div>
        ) : filtered.length === 0 ? (
          <div style={{ background: 'white', borderRadius: 16, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '3rem', textAlign: 'center' }}>
            <p style={{ color: PRIMARY, fontSize: 14, margin: '0 0 4px' }}>No assessments found</p>
            <p style={{ color: '#888', fontSize: 13, margin: 0 }}>Tap button below to add one</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {filtered.map((a) => {
              const c = conditionStyle(a.condition)
              return (
                <div key={a.id} style={{ background: 'white', borderRadius: 14, border: `0.5px solid ${PRIMARY_BORDER}`, padding: '1rem 1.25rem' }}>

                  {/* Top row */}
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                    <div style={{ flex: 1 }}>
                      <p style={{ fontSize: 15, fontWeight: 700, color: PRIMARY_DARK, margin: '0 0 4px' }}>
                        {a.address}
                      </p>
                      <p style={{ fontSize: 12, color: PRIMARY, margin: 0 }}>
                        {a.total_chickens?.toLocaleString()} chickens
                      </p>
                    </div>
                    <span style={{ background: c.bg, color: c.text, fontSize: 11, fontWeight: 700, padding: '4px 12px', borderRadius: 20, marginLeft: 8, whiteSpace: 'nowrap' }}>
                      {a.condition?.charAt(0).toUpperCase() + a.condition?.slice(1)}
                    </span>
                  </div>

                  {/* Coordinates */}
                  <div style={{ display: 'flex', gap: 16, marginBottom: 8 }}>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                      Lat: {parseFloat(a.latitude).toFixed(4)}
                    </p>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                      Lng: {parseFloat(a.longitude).toFixed(4)}
                    </p>
                  </div>

                  {/* Notes */}
                  {a.notes && (
                    <div style={{ background: PRIMARY_LIGHT, borderRadius: 8, padding: '8px 12px', marginBottom: 8 }}>
                      <p style={{ fontSize: 12, color: PRIMARY_DARK, margin: 0 }}>{a.notes}</p>
                    </div>
                  )}

                  {/* Photos preview from IndexedDB */}
                  <PhotosPreview assessmentLocalId={a.local_id} />

                  {/* Sync status */}
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: 8 }}>
                    <p style={{ fontSize: 11, color: '#888', margin: 0 }}>
                      {new Date(a.created_at).toLocaleString()}
                    </p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: 6, height: 6, borderRadius: '50%', background: a.synced === 1 ? '#1D9E75' : '#D97706' }}></div>
                      <span style={{ fontSize: 11, color: a.synced === 1 ? '#1D9E75' : '#D97706', fontWeight: 600 }}>
                        {a.synced === 1 ? 'Synced ✓' : 'Pending sync'}
                      </span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}

        {/* Add New Button */}
        <button onClick={() => navigate('/new-assessment')}
          style={{ width: '100%', background: PRIMARY, color: 'white', border: 'none', padding: '14px', borderRadius: 14, fontSize: 15, fontWeight: 700, cursor: 'pointer', marginTop: '1.5rem', marginBottom: '2rem' }}>
          + New Assessment
        </button>
      </div>
    </div>
  )
}

// Shows photos stored in IndexedDB (offline photos)
function PhotosPreview({ assessmentLocalId }) {
  const [photos, setPhotos] = useState([])

  useEffect(() => {
    loadPhotos()
  }, [assessmentLocalId])

  const loadPhotos = async () => {
    const db_photos = await import('../services/db').then(m => m.default)
    const found = await db_photos.photos
      .where('assessmentLocalId').equals(assessmentLocalId)
      .toArray()
    setPhotos(found)
  }

  if (photos.length === 0) return null

  return (
    <div style={{ marginBottom: 8 }}>
      <p style={{ fontSize: 11, color: PRIMARY, margin: '0 0 6px', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
        Photos ({photos.length})
      </p>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 6 }}>
        {photos.map((photo) => (
          <div key={photo.local_id} style={{ aspectRatio: '1', borderRadius: 8, overflow: 'hidden' }}>
            <img
              src={photo.base64}
              alt="farm"
              style={{ width: '100%', height: '100%', objectFit: 'cover' }}
            />
          </div>
        ))}
      </div>
    </div>
  )
}