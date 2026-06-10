import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { getAllRequests } from '../../services/api'
import { STATUS_LABELS, STATUS_COLORS, STATUS_DOT, ALL_STATUSES, formatDate } from '../../utils/status'

export default function Requests() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [keyword, setKeyword] = useState('')
  const [status, setStatus] = useState('')
  const [wardNumber, setWardNumber] = useState('')
  const [page, setPage] = useState(0)
  const [totalPages, setTotalPages] = useState(0)
  const [totalElements, setTotalElements] = useState(0)
  const navigate = useNavigate()

  const load = useCallback(async () => {
    setLoading(true)
    try {
      const res = await getAllRequests({
        keyword: keyword || undefined,
        status: status || undefined,
        wardNumber: wardNumber || undefined,
        page,
        size: 15,
      })
      setRequests(res.data.data.content)
      setTotalPages(res.data.data.totalPages)
      setTotalElements(res.data.data.totalElements)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }, [keyword, status, wardNumber, page])

  useEffect(() => { load() }, [load])

  // Group statuses for cleaner dropdown
  const STATUS_GROUPS = [
    { label: '── Pending ──', options: ['SUBMITTED', 'UNDER_MAYOR_REVIEW'] },
    { label: '── In Process ──', options: ['APPROVED', 'SENT_TO_DEPARTMENT', 'FILE_NUMBER_GENERATED', 'IN_PROGRESS'] },
    { label: '── Closed ──', options: ['CLOSED', 'REJECTED'] },
    { label: '── Draft ──', options: ['DRAFT'] },
  ]

  return (
    <div className="space-y-4 fade-in">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">All Requests</h2>
          <p className="text-gray-500 text-sm mt-1">
            {totalElements > 0 ? `${totalElements} total requests` : 'Manage and track ward member requests'}
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-4">
        <div className="flex flex-col sm:flex-row gap-3 flex-wrap">
          <input
            type="text"
            placeholder="Search by ID or subject..."
            value={keyword}
            onChange={(e) => setKeyword(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="flex-1 min-w-48 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Ward Number Filter */}
          <input
            type="text"
            placeholder="Ward No. (e.g. 045)"
            value={wardNumber}
            onChange={(e) => setWardNumber(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && load()}
            className="w-40 px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          {/* Grouped Status Dropdown */}
          <select
            value={status}
            onChange={(e) => { setStatus(e.target.value); setPage(0) }}
            className="px-4 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Statuses</option>
            {STATUS_GROUPS.map(group => (
              <optgroup key={group.label} label={group.label}>
                {group.options.map(s => (
                  <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                ))}
              </optgroup>
            ))}
          </select>

          <div className="flex gap-2">
            <button
              onClick={() => { setPage(0); load() }}
              className="px-5 py-2 rounded-xl text-white text-sm font-medium"
              style={{ backgroundColor: '#0D47A1' }}
            >
              Search
            </button>
            <button
              onClick={() => { setKeyword(''); setStatus(''); setWardNumber(''); setPage(0) }}
              className="px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {loading ? (
          <div className="flex items-center justify-center h-48">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
          </div>
        ) : requests.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
            <p className="text-4xl mb-3">📭</p>
            <p className="font-medium">No requests found</p>
          </div>
        ) : (
          <>
            {/* Desktop Table */}
            <div className="hidden md:block overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-100">
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Request ID</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Subject</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Councillor</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ward</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Pending With</th>
                    <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Date</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-50">
                  {requests.map((req) => (
                    <tr
                      key={req.requestId}
                      onClick={() => navigate(`/requests/${encodeURIComponent(req.requestId)}`)}
                      className="hover:bg-blue-50 cursor-pointer transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-2">
                          <div className={`w-2 h-2 rounded-full flex-shrink-0 ${STATUS_DOT[req.status]}`} />
                          <span className="text-sm font-semibold text-blue-700">{req.requestId}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <p className="text-sm text-gray-800 max-w-xs truncate">{req.subject}</p>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-600">{req.requesterName}</td>
                      <td className="px-6 py-4 text-sm text-gray-600">
                        <span className="bg-blue-50 text-blue-700 px-2 py-1 rounded-lg text-xs font-medium">
                          Ward {req.wardNumber}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                          {STATUS_LABELS[req.status]}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">
                        {getPendingWith(req)}
                      </td>
                      <td className="px-6 py-4 text-sm text-gray-500">{formatDate(req.createdAt)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Mobile Cards */}
            <div className="md:hidden divide-y divide-gray-100">
              {requests.map((req) => (
                <div
                  key={req.requestId}
                  onClick={() => navigate(`/requests/${encodeURIComponent(req.requestId)}`)}
                  className="p-4 hover:bg-gray-50 cursor-pointer"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-1 ${STATUS_DOT[req.status]}`} />
                      <span className="text-sm font-bold text-blue-700">{req.requestId}</span>
                      {req.isHot && <span title="Hot Request">🔥</span>}
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[req.status]}`}>
                      {STATUS_LABELS[req.status]}
                    </span>
                  </div>
                  <p className="text-sm text-gray-800 font-medium ml-4">{req.subject}</p>
                  <div className="flex items-center gap-3 mt-2 ml-4 text-xs text-gray-400 flex-wrap">
                    <span>{req.requesterName}</span>
                    <span>•</span>
                    <span className="bg-blue-50 text-blue-600 px-1.5 py-0.5 rounded">Ward {req.wardNumber}</span>
                    <span>•</span>
                    <span>{formatDate(req.createdAt)}</span>
                  </div>
                  <div className="ml-4 mt-1 text-xs text-orange-600">
                    {getPendingWith(req)}
                  </div>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between px-4 md:px-6 py-4 border-t border-gray-100">
            <p className="text-sm text-gray-500">Page {page + 1} of {totalPages}</p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage(p => Math.max(0, p - 1))}
                disabled={page === 0}
                className="px-3 md:px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                ← Prev
              </button>
              <button
                onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="px-3 md:px-4 py-2 text-sm border border-gray-200 rounded-lg disabled:opacity-40 hover:bg-gray-50"
              >
                Next →
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function getPendingWith(req) {
  switch (req.status) {
    case 'SUBMITTED': return '⏳ Pending with Mayor'
    case 'UNDER_MAYOR_REVIEW': return '👁️ Under Mayor Review'
    case 'APPROVED': return '✅ Approved by Mayor'
    case 'SENT_TO_DEPARTMENT': return `📤 Sent to: ${req.department || 'Department'}`
    case 'FILE_NUMBER_GENERATED': return req.fileNumber ? `📁 File: ${req.fileNumber}` : '📁 File No. Generated'
    case 'IN_PROGRESS': return '⚙️ In Progress'
    case 'CLOSED': return '🔒 Closed'
    case 'REJECTED': return '❌ Rejected'
    case 'DRAFT': return '📝 Draft'
    default: return '-'
  }
}