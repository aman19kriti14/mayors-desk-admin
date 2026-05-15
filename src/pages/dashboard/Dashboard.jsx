import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { getDashboardStats, getAllRequests } from '../../services/api'
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT, formatDate } from '../../utils/status'

const StatCard = ({ label, value, icon, color }) => (
  <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
    <div className="flex items-center justify-between mb-4">
      <span className="text-2xl">{icon}</span>
      <span className={`text-xs font-medium px-2 py-1 rounded-full ${color}`}>
        {label}
      </span>
    </div>
    <p className="text-3xl font-bold text-gray-800">{value ?? 0}</p>
  </div>
)

export default function Dashboard() {
  const [stats, setStats] = useState({})
  const [recent, setRecent] = useState([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const load = async () => {
      try {
        const [statsRes, reqRes] = await Promise.all([
          getDashboardStats(),
          getAllRequests({ page: 0, size: 5 }),
        ])
        setStats(statsRes.data.data)
        setRecent(reqRes.data.data.content)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    load()
  }, [])

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  return (
    <div className="space-y-6 fade-in">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Dashboard</h2>
        <p className="text-gray-500 text-sm mt-1">Overview of all ward requests</p>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <StatCard label="Total" value={stats.total} icon="📋"
          color="bg-blue-100 text-blue-700" />
        <StatCard label="Submitted" value={stats.submitted} icon="📤"
          color="bg-orange-100 text-orange-700" />
        <StatCard label="Approved" value={stats.approved} icon="✅"
          color="bg-green-100 text-green-700" />
        <StatCard label="Rejected" value={stats.rejected} icon="❌"
          color="bg-red-100 text-red-700" />
      </div>

      <div className="grid grid-cols-3 gap-4">
        <StatCard label="Under Review" value={stats.underMayorReview} icon="👁️"
          color="bg-yellow-100 text-yellow-700" />
        <StatCard label="In Progress" value={stats.inProgress} icon="⚙️"
          color="bg-indigo-100 text-indigo-700" />
        <StatCard label="Closed" value={stats.closed} icon="🔒"
          color="bg-emerald-100 text-emerald-700" />
      </div>

      {/* Recent Requests */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100">
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <h3 className="font-semibold text-gray-800">Recent Requests</h3>
          <button
            onClick={() => navigate('/requests')}
            className="text-sm text-blue-600 hover:text-blue-800 font-medium"
          >
            View All →
          </button>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.map((req) => (
            <div
              key={req.requestId}
              onClick={() => navigate(`/requests/${encodeURIComponent(req.requestId)}`)}
              className="flex items-center justify-between px-6 py-4 hover:bg-gray-50 cursor-pointer transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className={`w-2 h-2 rounded-full ${STATUS_DOT[req.status]}`} />
                <div>
                  <p className="text-sm font-semibold text-blue-700">{req.requestId}</p>
                  <p className="text-sm text-gray-600 truncate max-w-xs">{req.subject}</p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                  {STATUS_LABELS[req.status]}
                </span>
                <span className="text-xs text-gray-400">{formatDate(req.createdAt)}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}