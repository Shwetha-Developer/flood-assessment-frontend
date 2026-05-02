import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getUser, logout } from '../services/authService'
import { getPendingCount, syncAll } from '../services/syncService'
import { useOnlineStatus } from '../hooks/useOnlineStatus'
import db from '../services/db'

const PRIMARY = '#0f6e56'
const PRIMARY_DARK = '#085041'
const PRIMARY_LIGHT = '#E1F5EE'
const PRIMARY_BORDER = '#9FE1CB'

export default function DashboardPage() {
  const [user] = useState(getUser())
  const [pendingCount, setPendingCount] = useState(0)
  const [recentAssessments, setRecentAssessments] = useState([])
  const [syncing, setSyncing] = useState(false)
  const [syncMessage, setSyncMessage] = useState('')
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    const count = await getPendingCount()
    setPendingCount(count)
    const recent = await db.assessments
      .orderBy('id').reverse().limit(5).toArray()
    setRecentAssessments(recent)
  }

  const handleSync = async () => {
    if (!isOnline) return
    setSyncing(true)
    setSyncMessage('Syncing...')
    const result = await syncAll()
    if (result.success) {
      setSyncMessage('All synced! ✅')
      await loadData()
    } else {
      setSyncMessage('Sync failed. Try again.')
    }
    setSyncing(false)
    setTimeout(() => setSyncMessage(''), 3000)
  }

  const handleLogout = async () => {
    await logout()
    navigate('/login')
  }

  const conditionColor = (condition) => {
    if (condition === 'bad') return { bg: '#FEE2E2', text: '#991B1B', label: 'Bad' }
    if (condition === 'moderate') return { bg: '#FEF3C7', text: '#92400E', label: 'Moderate' }
    return { bg: PRIMARY_LIGHT, text: PRIMARY_DARK, label: 'Good' }
  }

  return (
    <div style={{ minHeight: '100vh', minHeight: '100dvh', background: '#f0faf6' }}>

      {/* Navbar */}
      <div style={{
        background: PRIMARY,
        padding: '0.875rem 1rem',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        position: 'sticky',
        top: 0,
        zIndex: 100
      }}>
        <div>
          <h1 style={{ color: 'white', fontSize: 17, fontWeight: 700, margin: 0 }}>
            Flood Assessment
          </h1>
          <p style={{ color: '#9FE1CB', fontSize: 11, margin: 0 }}>
            Madison County, NC
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
            <div style={{
              width: 8, height: 8, borderRadius: '50%',
              background: isOnline ? '#4ade80' : '#fbbf24'
            }}></div>
            <span style={{ color: 'white', fontSize: 12 }}>
              {isOnline ? 'Online' : 'Offline'}
            </span>
          </div>
          <button onClick={handleLogout}
            style={{
              background: 'rgba(255,255,255,0.15)',
              color: 'white', border: 'none',
              padding: '6px 12px', borderRadius: 8,
              fontSize: 13, cursor: 'pointer',
              fontWeight: 600
            }}>
            Logout
          </button>
        </div>
      </div>

      <div style={{ padding: '1rem', maxWidth: 500, margin: '0 auto' }}>

        {/* Welcome */}
        <div style={{ marginBottom: '1rem' }}>
          <h2 style={{ fontSize: 22, fontWeight: 700, color: PRIMARY_DARK, margin: '0 0 2px' }}>
            Welcome, {user?.name?.split(' ')[0]} 👋
          </h2>
          <p style={{ fontSize: 13, color: PRIMARY, margin: 0 }}>
            {new Date().toLocaleDateString('en-US', {
              weekday: 'long', month: 'long', day: 'numeric'
            })}
          </p>
        </div>

        {/* Sync Card */}
        <div style={{
          background: 'white',
          borderRadius: 16,
          border: `0.5px solid ${PRIMARY_BORDER}`,
          padding: '1rem',
          marginBottom: '1rem'
        }}>
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            marginBottom: 10
          }}>
            <div>
              <p style={{
                fontSize: 11, color: PRIMARY, margin: '0 0 2px',
                fontWeight: 600, textTransform: 'uppercase',
                letterSpacing: '0.05em'
              }}>
                Sync Status
              </p>
              <p style={{ fontSize: 26, fontWeight: 700, color: PRIMARY_DARK, margin: 0 }}>
                {pendingCount} pending
              </p>
            </div>
            <div style={{
              width: 48, height: 48,
              background: pendingCount > 0 ? '#FEF3C7' : PRIMARY_LIGHT,
              borderRadius: 12,
              display: 'flex', alignItems: 'center', justifyContent: 'center'
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none"
                stroke={pendingCount > 0 ? '#92400E' : PRIMARY} strokeWidth="2">
                <polyline points="23 4 23 10 17 10"/>
                <polyline points="1 20 1 14 7 14"/>
                <path d="M3.51 9a9 9 0 0 1 14.85-3.36L23 10M1 14l4.64 4.36A9 9 0 0 0 20.49 15"/>
              </svg>
            </div>
          </div>

          {syncMessage && (
            <div style={{
              background: PRIMARY_LIGHT, borderRadius: 8,
              padding: '8px 12px', marginBottom: 10,
              fontSize: 13, color: PRIMARY_DARK, fontWeight: 500
            }}>
              {syncMessage}
            </div>
          )}

          <button
            onClick={handleSync}
            disabled={!isOnline || syncing}
            style={{
              width: '100%',
              background: !isOnline || syncing ? '#9FE1CB' : PRIMARY,
              color: 'white', border: 'none',
              padding: '14px', borderRadius: 10,
              fontSize: 15, fontWeight: 700,
              cursor: !isOnline || syncing ? 'not-allowed' : 'pointer'
            }}>
            {syncing ? 'Syncing...' : isOnline ? '↑ Sync Now' : 'Offline — Cannot Sync'}
          </button>
        </div>

        {/* Quick Actions */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: '1fr 1fr',
          gap: 10, marginBottom: '1.25rem'
        }}>
          <button
            onClick={() => navigate('/new-assessment')}
            style={{
              background: PRIMARY, color: 'white',
              border: 'none', borderRadius: 14,
              padding: '1.25rem 1rem',
              cursor: 'pointer', textAlign: 'left',
              minHeight: 100
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2"
              style={{ marginBottom: 8, display: 'block' }}>
              <circle cx="12" cy="12" r="10"/>
              <line x1="12" y1="8" x2="12" y2="16"/>
              <line x1="8" y1="12" x2="16" y2="12"/>
            </svg>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px', color: 'white' }}>
              New Assessment
            </p>
            <p style={{ fontSize: 12, opacity: 0.8, margin: 0, color: 'white' }}>
              Record farm damage
            </p>
          </button>

          <button
            onClick={() => navigate('/assessments')}
            style={{
              background: 'white', color: PRIMARY_DARK,
              border: `0.5px solid ${PRIMARY_BORDER}`,
              borderRadius: 14, padding: '1.25rem 1rem',
              cursor: 'pointer', textAlign: 'left',
              minHeight: 100
            }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none"
              stroke={PRIMARY} strokeWidth="2"
              style={{ marginBottom: 8, display: 'block' }}>
              <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z"/>
              <polyline points="14 2 14 8 20 8"/>
              <line x1="16" y1="13" x2="8" y2="13"/>
              <line x1="16" y1="17" x2="8" y2="17"/>
            </svg>
            <p style={{ fontSize: 15, fontWeight: 700, margin: '0 0 2px', color: PRIMARY_DARK }}>
              My Records
            </p>
            <p style={{ fontSize: 12, margin: 0, color: PRIMARY }}>
              View all assessments
            </p>
          </button>
        </div>

        {/* Recent */}
        <div>
          <h3 style={{
            fontSize: 15, fontWeight: 700,
            color: PRIMARY_DARK, margin: '0 0 10px'
          }}>
            Recent Assessments
          </h3>

          {recentAssessments.length === 0 ? (
            <div style={{
              background: 'white', borderRadius: 14,
              border: `0.5px solid ${PRIMARY_BORDER}`,
              padding: '2rem', textAlign: 'center'
            }}>
              <p style={{ color: PRIMARY, fontSize: 14, margin: '0 0 4px' }}>
                No assessments yet
              </p>
              <p style={{ color: '#888', fontSize: 13, margin: 0 }}>
                Tap "New Assessment" to start
              </p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {recentAssessments.map((a) => {
                const c = conditionColor(a.condition)
                return (
                  <div key={a.id} style={{
                    background: 'white', borderRadius: 12,
                    border: `0.5px solid ${PRIMARY_BORDER}`,
                    padding: '0.875rem 1rem',
                    display: 'flex', alignItems: 'center',
                    justifyContent: 'space-between'
                  }}>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{
                        fontSize: 14, fontWeight: 600,
                        color: PRIMARY_DARK, margin: '0 0 2px',
                        overflow: 'hidden', textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap'
                      }}>
                        {a.address}
                      </p>
                      <p style={{ fontSize: 12, color: PRIMARY, margin: 0 }}>
                        {a.total_chickens?.toLocaleString()} chickens
                      </p>
                    </div>
                    <div style={{
                      display: 'flex', flexDirection: 'column',
                      alignItems: 'flex-end', gap: 4, flexShrink: 0, marginLeft: 8
                    }}>
                      <span style={{
                        background: c.bg, color: c.text,
                        fontSize: 11, fontWeight: 600,
                        padding: '3px 8px', borderRadius: 20
                      }}>
                        {c.label}
                      </span>
                      <span style={{
                        fontSize: 10,
                        color: a.synced === 1 ? '#1D9E75' : '#D97706'
                      }}>
                        {a.synced === 1 ? '✓ Synced' : '⏳ Pending'}
                      </span>
                    </div>
                  </div>
                )
              })}
            </div>
          )}
        </div>

        {/* Bottom padding for mobile */}
        <div style={{ height: '2rem' }} />
      </div>
    </div>
  )
}