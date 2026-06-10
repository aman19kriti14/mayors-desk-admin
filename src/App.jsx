import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { Suspense, lazy } from 'react'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'

// Lazy load pages for faster initial load
const Login = lazy(() => import('./pages/auth/Login'))
const Dashboard = lazy(() => import('./pages/dashboard/Dashboard'))
const Requests = lazy(() => import('./pages/requests/Requests'))
const RequestDetail = lazy(() => import('./pages/requests/RequestDetail'))
const Users = lazy(() => import('./pages/users/Users'))
const Letterhead = lazy(() => import('./pages/letterhead/Letterhead'))

const LoadingSpinner = () => (
  <div className="flex items-center justify-center h-64">
    <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
  </div>
)

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return <LoadingSpinner />
  if (!user) return <Navigate to="/login" replace />
  const WEB_ROLES = ['ADMIN','MAYOR_OFFICE','DEPUTY_MAYOR','SECRETARY','COMMITTEE_FINANCE',
    'COMMITTEE_HEALTH','COMMITTEE_DEVELOPMENT','COMMITTEE_TOWN_PLANNING',
    'COMMITTEE_EDUCATION_SPORTS','COMMITTEE_WELFARE','COMMITTEE_PUBLIC_WORKS','COMMITTEE_TAXATION']
  if (!WEB_ROLES.includes(user.role)) return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
        <Suspense fallback={<LoadingSpinner />}>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route path="/" element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="requests" element={<Requests />} />
              <Route path="requests/:requestId" element={<RequestDetail />} />
              <Route path="users" element={<Users />} />
              <Route path="letterhead" element={<Letterhead />} />
            </Route>
          </Routes>
        </Suspense>
      </AuthProvider>
    </BrowserRouter>
  )
}