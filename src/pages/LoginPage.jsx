import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { login } from '../services/authService'
import { useOnlineStatus } from '../hooks/useOnlineStatus'

const PRIMARY = '#0f6e56'
const PRIMARY_DARK = '#085041'
const PRIMARY_LIGHT = '#E1F5EE'
const PRIMARY_BORDER = '#9FE1CB'

export default function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const navigate = useNavigate()
  const isOnline = useOnlineStatus()

  const handleLogin = async (e) => {
    e.preventDefault()
    setError('')
    if (!isOnline) {
      setError('Internet connection required to login.')
      return
    }
    setLoading(true)
    try {
      await login(email, password)
      navigate('/')
    } catch (err) {
      const errors = err.response?.data?.errors
      if (errors) {
        setError(Object.values(errors)[0][0])
      } else {
        setError('Invalid email or password')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh',
      minHeight: '100dvh', // dynamic viewport height for mobile
      background: '#f0faf6',
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '1rem',
      overflowY: 'auto'
    }}>
      <div style={{ width: '100%', maxWidth: 420 }}>

        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{
            width: 64, height: 64,
            background: PRIMARY,
            borderRadius: 16,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            margin: '0 auto 1rem'
          }}>
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none"
              stroke="white" strokeWidth="2" strokeLinecap="round">
              <path d="M12 2C8 2 4 5.5 4 10c0 6 8 12 8 12s8-6 8-12c0-4.5-4-8-8-8z"/>
              <circle cx="12" cy="10" r="3"/>
            </svg>
          </div>
          <h1 style={{ fontSize: 24, fontWeight: 700, color: PRIMARY_DARK, margin: '0 0 4px' }}>
            Flood Assessment
          </h1>
          <p style={{ fontSize: 14, color: PRIMARY, margin: 0 }}>
            Madison County, NC · Ceres
          </p>
        </div>

        {/* Card */}
        <div style={{
          background: 'white',
          borderRadius: 20,
          border: `0.5px solid ${PRIMARY_BORDER}`,
          padding: '1.5rem'
        }}>

          {/* Status */}
          <div style={{
            background: isOnline ? PRIMARY_LIGHT : '#FEF3C7',
            borderRadius: 10,
            padding: '10px 14px',
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            marginBottom: '1.25rem'
          }}>
            <div style={{
              width: 8, height: 8,
              borderRadius: '50%',
              background: isOnline ? '#1D9E75' : '#D97706',
              flexShrink: 0
            }}></div>
            <span style={{
              fontSize: 13,
              color: isOnline ? PRIMARY_DARK : '#92400E',
              fontWeight: 500
            }}>
              {isOnline ? 'Online — Connected to server' : 'Offline — Internet required to login'}
            </span>
          </div>

          {/* Error */}
          {error && (
            <div style={{
              background: '#FEE2E2',
              border: '0.5px solid #FCA5A5',
              color: '#991B1B',
              borderRadius: 10,
              padding: '10px 14px',
              fontSize: 14,
              marginBottom: '1rem'
            }}>
              {error}
            </div>
          )}

          {/* Email */}
          <div style={{ marginBottom: '1rem' }}>
            <label style={{
              fontSize: 12, fontWeight: 600, color: PRIMARY,
              display: 'block', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Email address
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="assessor@ceres.com"
              autoComplete="email"
              style={{
                width: '100%',
                border: `1.5px solid ${PRIMARY_BORDER}`,
                borderRadius: 10,
                padding: '14px',
                fontSize: 16,
                outline: 'none',
                background: '#f9fffe',
                color: '#111'
              }}
            />
          </div>

          {/* Password */}
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{
              fontSize: 12, fontWeight: 600, color: PRIMARY,
              display: 'block', marginBottom: 6,
              textTransform: 'uppercase', letterSpacing: '0.05em'
            }}>
              Password
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter your password"
              autoComplete="current-password"
              style={{
                width: '100%',
                border: `1.5px solid ${PRIMARY_BORDER}`,
                borderRadius: 10,
                padding: '14px',
                fontSize: 16,
                outline: 'none',
                background: '#f9fffe',
                color: '#111'
              }}
            />
          </div>

          {/* Button */}
          <button
            onClick={handleLogin}
            disabled={loading || !isOnline}
            style={{
              width: '100%',
              background: loading || !isOnline ? '#9FE1CB' : PRIMARY,
              color: 'white',
              border: 'none',
              padding: '16px',
              borderRadius: 10,
              fontSize: 16,
              fontWeight: 700,
              cursor: loading || !isOnline ? 'not-allowed' : 'pointer',
              transition: 'background 0.2s'
            }}
          >
            {loading ? 'Signing in...' : 'Sign in to field portal'}
          </button>

          {/* Info Cards */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr 1fr',
            gap: 8, marginTop: '1.25rem'
          }}>
            {[
              { label: 'Mode', value: 'Offline-first' },
              { label: 'Region', value: 'Madison Co.' },
              { label: 'Version', value: '1.0.0' }
            ].map((item) => (
              <div key={item.label} style={{
                background: PRIMARY_LIGHT,
                borderRadius: 10, padding: '10px 6px',
                textAlign: 'center'
              }}>
                <div style={{ fontSize: 10, color: PRIMARY, marginBottom: 2 }}>
                  {item.label}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, color: PRIMARY_DARK }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>
        </div>

        <p style={{
          textAlign: 'center', fontSize: 12,
          color: PRIMARY, marginTop: '1rem', padding: '0 1rem'
        }}>
          Internet required for login · Works fully offline after sign-in
        </p>
      </div>
    </div>
  )
}