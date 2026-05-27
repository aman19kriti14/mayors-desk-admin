import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequestDetail, updateRequestStatus, downloadPdf, uploadSignedDoc } from '../../services/api'
import { STATUS_LABELS, STATUS_COLORS, ALL_STATUSES, formatDate } from '../../utils/status'

export default function RequestDetail() {
  const { requestId } = useParams()
  const decodedId = decodeURIComponent(requestId)
  const navigate = useNavigate()
  const fileRef = useRef()

  const [request, setRequest] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [downloading, setDownloading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({
    status: '', remarks: '', fileNumber: '', department: ''
  })
  //test
  const [updating, setUpdating] = useState(false)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getRequestDetail(decodedId)
      setRequest(res.data.data)
      setStatusForm(f => ({ ...f, status: res.data.data.status }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [decodedId])

  const handleDownload = async () => {
    setDownloading(true)
    try {
      await downloadPdf(decodedId)
    } catch (err) {
      alert('Download failed')
    } finally {
      setDownloading(false)
    }
  }

  const handleUploadSigned = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadSignedDoc(decodedId, file)
      await load()
      alert('Signed document uploaded!')
    } catch (err) {
      alert('Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleUpdateStatus = async () => {
    if (!statusForm.status) return
    setUpdating(true)
    try {
      await updateRequestStatus(decodedId, {
        status: statusForm.status,
        remarks: statusForm.remarks,
        fileNumber: statusForm.fileNumber,
        department: statusForm.department,
      })
      await load()
      setShowStatusModal(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally {
      setUpdating(false)
    }
  }

  if (loading) return (
    <div className="flex items-center justify-center h-64">
      <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
    </div>
  )

  if (error) return (
    <div className="text-center py-16">
      <p className="text-red-500">{error}</p>
      <button onClick={() => navigate(-1)} className="mt-4 text-blue-600">← Back</button>
    </div>
  )

  const r = request

  return (
    <div className="space-y-5 fade-in">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)}
            className="text-gray-500 hover:text-gray-700 text-lg">←</button>
          <div>
            <h2 className="text-xl font-bold text-blue-700">{r.requestId}</h2>
            <p className="text-gray-500 text-sm">{formatDate(r.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleDownload}
            disabled={downloading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: '#0D47A1' }}
          >
            {downloading ? '⏳' : '⬇️'} {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={() => fileRef.current.click()}
            disabled={uploading}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            {uploading ? '⏳' : '📎'} {uploading ? 'Uploading...' : 'Upload Signed'}
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.png"
            onChange={handleUploadSigned} className="hidden" />
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-green-600"
          >
            ✏️ Update Status
          </button>
        </div>
      </div>

      <div className="grid grid-cols-3 gap-5">
        {/* Left Column */}
        <div className="col-span-2 space-y-4">
          {/* Status */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Current Status</h3>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>
            {r.fileNumber && (
              <p className="text-sm text-gray-600">📁 File No: <span className="font-semibold">{r.fileNumber}</span></p>
            )}
            {r.department && (
              <p className="text-sm text-gray-600 mt-1">🏢 Department: <span className="font-semibold">{r.department}</span></p>
            )}
            {r.remarks && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Remarks</p>
                <p className="text-sm text-gray-700">{r.remarks}</p>
              </div>
            )}
          </div>

          {/* Request Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Request Details</h3>
            <div className="space-y-3">
              <div>
                <p className="text-xs text-gray-500 font-medium">Subject</p>
                <p className="text-sm text-gray-800 font-semibold mt-0.5">{r.subject}</p>
              </div>
              <div>
                <p className="text-xs text-gray-500 font-medium">Description</p>
                <p className="text-sm text-gray-700 mt-0.5 leading-relaxed">{r.description}</p>
              </div>
              {r.sections && (
                <div>
                  <p className="text-xs text-gray-500 font-medium mb-1">Sections</p>
                  <div className="flex flex-wrap gap-2">
                    {r.sections.split(',').map(s => (
                      <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-1 rounded-full">
                        {s.trim()}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Documents */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Documents</h3>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-3 bg-blue-50 rounded-xl">
                <div className="flex items-center gap-3">
                  <span className="text-2xl">📄</span>
                  <div>
                    <p className="text-sm font-medium text-gray-800">Official Request Letter</p>
                    <p className="text-xs text-gray-500">Generated PDF with letterhead</p>
                  </div>
                </div>
                <button onClick={handleDownload}
                  className="text-sm text-blue-700 font-medium hover:text-blue-900">
                  Download
                </button>
              </div>

              {r.signedDocumentUrl && (
                <div className="flex items-center justify-between p-3 bg-green-50 rounded-xl">
                  <div className="flex items-center gap-3">
                    <span className="text-2xl">✅</span>
                    <div>
                      <p className="text-sm font-medium text-gray-800">Signed Document</p>
                      <p className="text-xs text-gray-500">Uploaded by admin</p>
                    </div>
                  </div>
                  <a href={r.signedDocumentUrl} target="_blank" rel="noreferrer"
                    className="text-sm text-green-700 font-medium hover:text-green-900">
                    View
                  </a>
                </div>
              )}

              {r.attachmentUrls && r.attachmentUrls.length > 0 && (
                <div>
                  <p className="text-xs font-semibold text-gray-500 mb-2">
                    📎 Attachments ({r.attachmentUrls.length})
                  </p>
                  {r.attachmentUrls.map((url, i) => {
                    const filename = url.split('/').pop() || `Attachment ${i + 1}`
                    const isImage = /\.(jpg|jpeg|png|gif)$/i.test(filename)
                    const isPdf = /\.pdf$/i.test(filename)
                    return (
                      <div key={i} className="flex items-center justify-between p-3 bg-orange-50 rounded-xl mb-2">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{isPdf ? '📄' : isImage ? '🖼️' : '📎'}</span>
                          <div>
                            <p className="text-sm font-medium text-gray-800 max-w-xs truncate">
                              {decodeURIComponent(filename)}
                            </p>
                            <p className="text-xs text-gray-500">Uploaded by councillor</p>
                          </div>
                        </div>
                        <a href={url} target="_blank" rel="noreferrer"
                          className="text-sm text-orange-700 font-medium hover:text-orange-900">
                          {isImage ? 'View' : 'Download'}
                        </a>
                      </div>
                    )
                  })}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Right Column */}
        <div className="space-y-4">
          {/* Councillor Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Councillor Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">👤</span>
                <span className="text-sm text-gray-700">{r.requesterName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">🏘️</span>
                <span className="text-sm text-gray-700">Ward {r.wardNumber}</span>
              </div>
            </div>
          </div>

          {/* Timeline */}
          {r.timeline && r.timeline.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Timeline</h3>
              <div className="space-y-3">
                {r.timeline.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1" />
                      {i < r.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-semibold text-blue-700">
                        {STATUS_LABELS[h.newStatus]}
                      </p>
                      {h.remarks && (
                        <p className="text-xs text-gray-500 mt-0.5">{h.remarks}</p>
                      )}
                      <p className="text-xs text-gray-400 mt-0.5">
                        {h.changedBy} • {formatDate(h.changedAt)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Status Update Modal */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Update Status</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
                <select
                  value={statusForm.status}
                  onChange={(e) => setStatusForm({ ...statusForm, status: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {ALL_STATUSES.map(s => (
                    <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                  ))}
                </select>
              </div>
              {statusForm.status === 'FILE_NUMBER_GENERATED' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">File Number</label>
                  <input
                    type="text"
                    placeholder="e.g. MC/2025/05/1001"
                    value={statusForm.fileNumber}
                    onChange={(e) => setStatusForm({ ...statusForm, fileNumber: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              {statusForm.status === 'SENT_TO_DEPARTMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                  <input
                    type="text"
                    placeholder="e.g. Engineering Department"
                    value={statusForm.department}
                    onChange={(e) => setStatusForm({ ...statusForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
              )}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Remarks</label>
                <textarea
                  rows={3}
                  placeholder="Add remarks (optional)"
                  value={statusForm.remarks}
                  onChange={(e) => setStatusForm({ ...statusForm, remarks: e.target.value })}
                  className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>
            <div className="flex gap-3 mt-5">
              <button
                onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleUpdateStatus}
                disabled={updating}
                className="flex-1 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: '#0D47A1' }}
              >
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}