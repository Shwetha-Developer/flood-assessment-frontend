import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { getUser, isAuthenticated } from './services/authService'
import LoginPage from './pages/LoginPage'
import DashboardPage from './pages/DashboardPage'
import NewAssessmentPage from './pages/NewAssessmentPage'
import AssessmentListPage from './pages/AssessmentListPage'
import SupervisorDashboard from './pages/SupervisorDashboard'

// Redirect based on role
const ProtectedRoute = ({ children }) => {
  if (!isAuthenticated()) {
    return <Navigate to="/login" replace />
  }
  return children
}

// Auto redirect to correct dashboard based on role
const HomeRoute = () => {
  const user = getUser()
  if (user?.role === 'supervisor') {
    return <Navigate to="/supervisor" replace />
  }
  return <DashboardPage />
}

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public */}
        <Route path="/login" element={<LoginPage />} />

        {/* Auto redirect based on role */}
        <Route path="/" element={
          <ProtectedRoute>
            <HomeRoute />
          </ProtectedRoute>
        } />

        {/* Assessor routes */}
        <Route path="/new-assessment" element={
          <ProtectedRoute>
            <NewAssessmentPage />
          </ProtectedRoute>
        } />

        <Route path="/assessments" element={
          <ProtectedRoute>
            <AssessmentListPage />
          </ProtectedRoute>
        } />

        {/* Supervisor route */}
        <Route path="/supervisor" element={
          <ProtectedRoute>
            <SupervisorDashboard />
          </ProtectedRoute>
        } />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App