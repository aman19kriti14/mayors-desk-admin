import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom'
import { AuthProvider, useAuth } from './context/AuthContext'
import Layout from './components/Layout'
import Login from './pages/auth/Login'
import Dashboard from './pages/dashboard/Dashboard'
import Requests from './pages/requests/Requests'
import RequestDetail from './pages/requests/RequestDetail'
import Users from './pages/users/Users'
import Letterhead from './pages/letterhead/Letterhead'

const ProtectedRoute = ({ children }) => {
  const { user, loading } = useAuth()
  if (loading) return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )
  if (!user) return <Navigate to="/login" replace />
  if (user.role !== 'ADMIN') return <Navigate to="/login" replace />
  return children
}

export default function App() {
  return (
    <BrowserRouter>
      <AuthProvider>
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
      </AuthProvider>
    </BrowserRouter>
  )
}