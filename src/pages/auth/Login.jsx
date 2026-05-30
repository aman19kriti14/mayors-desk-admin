import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext'

const CORP_LOGO = 'https://pzjppyiqtwqzwnzxgarc.supabase.co/storage/v1/object/public/letterhead-assets/IMG-20260501-WA0006.jpg.jpeg'
const MAYOR_PHOTO = 'https://pzjppyiqtwqzwnzxgarc.supabase.co/storage/v1/object/public/letterhead-assets/IMG_1783.JPG'

export default function Login() {
  const [form, setForm] = useState({ emailOrPhone: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { login } = useAuth()
  const navigate = useNavigate()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    try {
      const user = await login(form.emailOrPhone, form.password)
      if (user.role !== 'ADMIN') {
        setError('Access denied. Admin only.')
        return
      }
      navigate('/')
    } catch (err) {
      setError(err.response?.data?.message || 'Login failed')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen flex" style={{
      background: 'linear-gradient(135deg, #0D47A1 0%, #1565C0 50%, #1976D2 100%)'
    }}>

      {/* ── LEFT PANEL ─────────────────────────── */}
      <div className="hidden lg:flex flex-1 flex-col items-center justify-center p-12 text-white">

        <div className="w-32 h-32 rounded-full overflow-hidden border-4 border-white shadow-2xl mb-6">
          <img src={CORP_LOGO} alt="Corporation Logo"
            className="w-full h-full object-cover" />
        </div>

        <h1 className="text-4xl font-bold text-center mb-2">Mayor's Desk</h1>
        <p className="text-blue-200 text-lg text-center mb-12">
          Trivandrum City Municipal Corporation
        </p>

        <div className="flex flex-col items-center">
          <div className="w-44 h-44 rounded-full overflow-hidden border-4 border-white/50 shadow-2xl mb-4">
            <img src={MAYOR_PHOTO} alt="Mayor"
              className="w-full h-full object-cover object-top" />
          </div>
          <p className="text-blue-200 text-sm">Honourable Mayor</p>
          <p className="text-white font-semibold text-center mt-1">
            Trivandrum City Municipal Corporation
          </p>
        </div>

        <div className="mt-12 text-blue-200 text-sm">
          ⚡ Powered by Gatistack Technologies
        </div>
      </div>

      {/* ── RIGHT PANEL ────────────────────────── */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 lg:p-12">

        {/* Mobile only */}
        <div className="lg:hidden flex flex-col items-center mb-8">
          <div className="flex items-center gap-4 mb-4">
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white shadow-lg">
              <img src={CORP_LOGO} alt="Logo" className="w-full h-full object-cover" />
            </div>
            <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-white/60 shadow-lg">
              <img src={MAYOR_PHOTO} alt="Mayor" className="w-full h-full object-cover object-top" />
            </div>
          </div>
          <h1 className="text-2xl font-bold text-white">Mayor's Desk</h1>
          <p className="text-blue-200 text-sm">Admin Portal</p>
        </div>

        {/* Login Card */}
        <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl p-8">
          <div className="mb-6">
            <h2 className="text-2xl font-bold text-gray-800">Welcome Back</h2>
            <p className="text-gray-500 text-sm mt-1">Sign in to Admin Portal</p>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email / Mobile
              </label>
              <input
                type="text"
                value={form.emailOrPhone}
                onChange={(e) => setForm({ ...form, emailOrPhone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="admin@mayorsdesk.in"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Password
              </label>
              <input
                type="password"
                value={form.password}
                onChange={(e) => setForm({ ...form, password: e.target.value })}
                className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="••••••••"
                required
              />
            </div>

            {error && (
              <div className="bg-red-50 border border-red-200 rounded-xl px-4 py-3 text-red-600 text-sm">
                ⚠️ {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 rounded-xl font-semibold text-white transition-all"
              style={{ backgroundColor: loading ? '#90A4AE' : '#0D47A1' }}
            >
              {loading ? 'Signing in...' : 'Sign In'}
            </button>
          </form>

          <div className="mt-6 pt-4 border-t border-gray-100 text-center space-y-1">
            <p className="text-xs text-gray-400">Trivandrum City Municipal Corporation</p>
            <p className="text-xs text-gray-300">⚡ Powered by Gatistack Technologies</p>
          </div>
        </div>
      </div>
    </div>
  )
}