import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { getRequestDetail, updateRequestStatus, downloadPdf, uploadSignedDoc, sendEmail, getVoiceNotes, addVoiceNote, deleteVoiceNote, toggleHot } from '../../services/api'
import { STATUS_LABELS, STATUS_COLORS, ALL_STATUSES, formatDate } from '../../utils/status'

const DEPARTMENTS = [
  'Finance Committee',
  'Health Committee',
  'Development Committee',
  'Town Planning Committee',
  'Education & Sports Committee',
  'Welfare Committee',
  'Public Works Committee',
  'Taxation Committee',
  'Secretary',
  'Deputy Mayor',
  "Mayor's Office",
]

// Grouped statuses
const STATUS_GROUPS = [
  { label: 'Pending', options: ['SUBMITTED', 'UNDER_MAYOR_REVIEW'] },
  { label: 'In Process', options: ['APPROVED', 'SENT_TO_DEPARTMENT', 'FILE_NUMBER_GENERATED', 'IN_PROGRESS'] },
  { label: 'Closed', options: ['CLOSED', 'REJECTED'] },
]

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

  // Status modal
  const [showStatusModal, setShowStatusModal] = useState(false)
  const [statusForm, setStatusForm] = useState({ status: '', remarks: '', fileNumber: '', department: '' })
  const [updating, setUpdating] = useState(false)

  // Email modal
  const [showEmailModal, setShowEmailModal] = useState(false)
  const [emailForm, setEmailForm] = useState({ to: '', subject: '', body: '', attachPdf: true, voiceNoteIds: [] })
  const [sendingEmail, setSendingEmail] = useState(false)
  const [emailSent, setEmailSent] = useState(false)

  // Voice notes
  const [voiceNotes, setVoiceNotes] = useState([])
  const [isRecording, setIsRecording] = useState(false)
  const [recordingTime, setRecordingTime] = useState(0)
  const [uploadingVoice, setUploadingVoice] = useState(false)
  const [noteText, setNoteText] = useState('')
  const [voiceRecipient, setVoiceRecipient] = useState('')
  const mediaRecorderRef = useRef(null)
  const chunksRef = useRef([])
  const timerRef = useRef(null)

  const load = async () => {
    setLoading(true)
    try {
      const res = await getRequestDetail(decodedId)
      setRequest(res.data.data)
      setStatusForm(f => ({ ...f, status: res.data.data.status }))
      // Load voice notes
      try {
        const vnRes = await getVoiceNotes(decodedId)
        setVoiceNotes(vnRes.data.data || [])
      } catch (e) { console.error(e) }
      // Pre-fill email subject
      setEmailForm(f => ({
        ...f,
        subject: `Regarding Request ${decodedId} - ${res.data.data.subject}`
      }))
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load request')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [decodedId])

  const handleDownload = async () => {
    setDownloading(true)
    try { await downloadPdf(decodedId) }
    catch { alert('Download failed') }
    finally { setDownloading(false) }
  }

  const handleUploadSigned = async (e) => {
    const file = e.target.files[0]
    if (!file) return
    setUploading(true)
    try {
      await uploadSignedDoc(decodedId, file)
      await load()
    } catch { alert('Upload failed') }
    finally { setUploading(false) }
  }

  const handleUpdateStatus = async () => {
    if (!statusForm.status) return
    setUpdating(true)
    try {
      await updateRequestStatus(decodedId, statusForm)
      await load()
      setShowStatusModal(false)
    } catch (err) {
      alert(err.response?.data?.message || 'Update failed')
    } finally { setUpdating(false) }
  }

  const handleSendEmail = async () => {
    if (!emailForm.to || !emailForm.subject) {
      alert('Please fill in To and Subject fields')
      return
    }
    setSendingEmail(true)
    try {
      await sendEmail(decodedId, emailForm)
      setEmailSent(true)
      setTimeout(() => { setEmailSent(false); setShowEmailModal(false) }, 2000)
    } catch (err) {
      alert(err.response?.data?.message || 'Failed to send email')
    } finally { setSendingEmail(false) }
  }

  const MAX_RECORDING_SECS = 60 // 1 minute limit

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      chunksRef.current = []
      mediaRecorder.ondataavailable = (e) => chunksRef.current.push(e.data)
      mediaRecorder.start()
      setIsRecording(true)
      setRecordingTime(0)
      timerRef.current = setInterval(() => {
        setRecordingTime(t => {
          if (t + 1 >= MAX_RECORDING_SECS) {
            stopRecording()
            return MAX_RECORDING_SECS
          }
          return t + 1
        })
      }, 1000)
    } catch (e) { alert('Microphone access denied') }
  }

  const stopRecording = () => {
    if (!mediaRecorderRef.current) return
    mediaRecorderRef.current.onstop = async () => {
      const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
      const file = new File([blob], 'voice-note.webm', { type: 'audio/webm' })
      setUploadingVoice(true)
      try {
        await addVoiceNote(decodedId, file, noteText, recordingTime, voiceRecipient)
        setVoiceRecipient('')
        const vnRes = await getVoiceNotes(decodedId)
        setVoiceNotes(vnRes.data.data || [])
        setNoteText('')
      } catch (e) { alert('Failed to save voice note') }
      finally { setUploadingVoice(false) }
    }
    mediaRecorderRef.current.stop()
    mediaRecorderRef.current.stream.getTracks().forEach(t => t.stop())
    clearInterval(timerRef.current)
    setIsRecording(false)
  }

  const handleDeleteVoiceNote = async (id) => {
    if (!confirm('Delete this voice note?')) return
    await deleteVoiceNote(id)
    setVoiceNotes(v => v.filter(n => n.id !== id))
  }

  const formatTime = (secs) => {
    const m = Math.floor(secs / 60)
    const s = secs % 60
    return `${m}:${s.toString().padStart(2, '0')}`
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
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div className="flex items-center gap-3">
          <button onClick={() => navigate(-1)} className="text-gray-500 hover:text-gray-700 text-lg">←</button>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-bold text-blue-700">{r.requestId}</h2>
              {r.isHot && (
                <span className="bg-red-100 text-red-600 text-xs font-bold px-2 py-0.5 rounded-full animate-pulse">
                  🔥 HOT
                </span>
              )}
            </div>
            <p className="text-gray-500 text-sm">{formatDate(r.createdAt)}</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <button
            onClick={handleDownload} disabled={downloading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium"
            style={{ backgroundColor: '#0D47A1' }}
          >
            {downloading ? '⏳' : '⬇️'} {downloading ? 'Downloading...' : 'Download PDF'}
          </button>
          <button
            onClick={() => fileRef.current.click()} disabled={uploading}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border border-gray-200 hover:bg-gray-50"
          >
            {uploading ? '⏳' : '📎'} Upload Signed
          </button>
          <input ref={fileRef} type="file" accept=".pdf,.jpg,.png" onChange={handleUploadSigned} className="hidden" />
          <button
            onClick={async () => {
              await toggleHot(decodedId)
              await load()
            }}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium border ${r.isHot
                ? 'bg-red-50 border-red-300 text-red-600'
                : 'bg-white border-gray-200 text-gray-600'
              }`}
            title={r.isHot ? 'Unmark as Hot' : 'Mark as Hot Request'}
          >
            🔥 {r.isHot ? 'Hot' : 'Mark Hot'}
          </button>
          <button
            onClick={() => setShowEmailModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium bg-purple-600"
          >
            ✉️ Send Email
          </button>
          <button
            onClick={() => setShowStatusModal(true)}
            className="flex items-center gap-2 px-3 py-2 rounded-xl text-white text-sm font-medium bg-green-600"
          >
            ✏️ Update Status
          </button>
        </div>
      </div>

      {/* Voice Notes - Admin Section (Top) */}
      {/* Voice Notes */}
      <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-semibold text-gray-800">🎙️ Voice Notes</h3>
          <span className="text-xs text-gray-400">{voiceNotes.length} note(s)</span>
        </div>

        {/* Recorder */}
        <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-3">

          {/* Recipient selector */}
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Send To</label>
            <select
              value={voiceRecipient}
              onChange={(e) => setVoiceRecipient(e.target.value)}
              className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Select recipient...</option>
              <option value="councillor">👤 Councillor ({r.requesterName})</option>
              <optgroup label="── Committees ──">
                <option value="Finance Committee">Finance Committee</option>
                <option value="Health Committee">Health Committee</option>
                <option value="Development Committee">Development Committee</option>
                <option value="Town Planning Committee">Town Planning Committee</option>
                <option value="Education & Sports Committee">Education & Sports Committee</option>
                <option value="Welfare Committee">Welfare Committee</option>
                <option value="Public Works Committee">Public Works Committee</option>
                <option value="Taxation Committee">Taxation Committee</option>
              </optgroup>
              <optgroup label="── Others ──">
                <option value="Secretary">Secretary</option>
                <option value="Deputy Mayor">Deputy Mayor</option>
              </optgroup>
            </select>
          </div>

          <input
            type="text"
            placeholder="Add a note label (optional)"
            value={noteText}
            onChange={(e) => setNoteText(e.target.value)}
            className="w-full px-3 py-2 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          />

          <div className="flex items-center gap-3">
            {!isRecording ? (
              <button
                onClick={startRecording}
                disabled={uploadingVoice || !voiceRecipient}
                className={`flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium ${voiceRecipient ? 'bg-red-500 hover:bg-red-600' : 'bg-gray-300 cursor-not-allowed'
                  }`}
              >
                🎙️ Start Recording
              </button>
            ) : (
              <button
                onClick={stopRecording}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium bg-gray-700 animate-pulse"
              >
                ⏹️ Stop ({formatTime(recordingTime)} / 1:00)
              </button>
            )}
            {uploadingVoice && (
              <span className="text-sm text-gray-500">⏳ Saving & notifying...</span>
            )}
            {!voiceRecipient && !isRecording && (
              <span className="text-xs text-orange-500">Select recipient first</span>
            )}
          </div>
        </div>

        {/* Voice notes list */}
        {voiceNotes.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">No voice notes yet</p>
        ) : (
          <div className="space-y-3">
            {voiceNotes.map((note) => (
              <div key={note.id} className="flex items-start gap-3 p-3 bg-purple-50 rounded-xl">
                <span className="text-2xl">🎙️</span>
                <div className="flex-1 min-w-0">
                  {note.noteText && (
                    <p className="text-sm font-medium text-gray-800 mb-1">{note.noteText}</p>
                  )}
                  <audio controls src={note.audioUrl} className="w-full h-8" />
                  <div className="flex items-center gap-2 mt-1 flex-wrap">
                    <span className="text-xs text-gray-400">{note.addedBy}</span>
                    {note.recipientName && (
                      <span className="text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">
                        → {note.recipientName}
                      </span>
                    )}
                    {note.durationSecs && (
                      <span className="text-xs text-gray-400">• {formatTime(note.durationSecs)}</span>
                    )}
                    <span className="text-xs text-gray-400">
                      • {new Date(note.createdAt).toLocaleDateString('en-IN')}
                    </span>
                    {note.notified && (
                      <span className="text-xs text-green-600">✅ Notified</span>
                    )}
                  </div>
                </div>
                <button
                  onClick={() => handleDeleteVoiceNote(note.id)}
                  className="text-red-400 hover:text-red-600 text-xs flex-shrink-0"
                >
                  🗑️
                </button>
              </div>
            ))}
          </div>
        )}
      </div>


      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        {/* Left */}
        <div className="lg:col-span-2 space-y-4">

          {/* Status Card */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800">Current Status</h3>
              <span className={`text-sm px-3 py-1 rounded-full font-medium ${STATUS_COLORS[r.status]}`}>
                {STATUS_LABELS[r.status]}
              </span>
            </div>

            {/* Tracking info */}
            <div className="bg-blue-50 rounded-xl p-3 mb-3">
              <p className="text-sm font-medium text-blue-800">
                {getPendingWithDetailed(r)}
              </p>
            </div>

            {r.fileNumber && <p className="text-sm text-gray-600">📁 File No: <span className="font-semibold">{r.fileNumber}</span></p>}
            {r.department && <p className="text-sm text-gray-600 mt-1">🏢 Dept: <span className="font-semibold">{r.department}</span></p>}
            {r.remarks && (
              <div className="mt-3 bg-gray-50 rounded-lg p-3">
                <p className="text-xs text-gray-500 font-medium mb-1">Remarks</p>
                <p className="text-sm text-gray-700">{r.remarks}</p>
              </div>
            )}
          </div>


          {/* Request Details - Letterhead Format */}
          <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="bg-blue-700 px-5 py-3 flex items-center justify-between">
              <h3 className="font-semibold text-white text-sm">Official Request Letter</h3>
              <span className="text-blue-200 text-xs">{r.requestId}</span>
            </div>
            <div className="p-5">
              {/* Letter Header */}
              <div className="flex items-start justify-between mb-4 pb-4 border-b border-gray-200">
                {/* Left */}
                <div className="text-xs text-gray-700 space-y-0.5">
                  <p className="font-bold text-sm">{(r.wardName || 'WARD').toUpperCase()} WARD</p>
                  <p className="text-gray-500">COUNCILLOR</p>
                  <p className="text-gray-500">THIRUVANANTHAPURAM</p>
                  <p className="text-gray-500">MUNICIPAL CORPORATION</p>
                </div>
                {/* Center Logo */}
                <div className="w-14 h-14 rounded-full overflow-hidden border border-gray-200 flex-shrink-0">
                  <img src="https://pzjppyiqtwqzwnzxgarc.supabase.co/storage/v1/object/public/letterhead-assets/IMG-20260501-WA0006.jpg.jpeg"
                    alt="Logo" className="w-full h-full object-cover" />
                </div>
                {/* Right */}
                <div className="text-xs text-right text-gray-700 space-y-0.5">
                  <p className="font-bold text-sm">{r.requesterName}</p>
                  <p className="text-gray-500">COUNCILLOR</p>
                  {r.phoneNumber && <p className="text-gray-500">PH: {r.phoneNumber}</p>}
                  <p className="text-gray-400 mt-2">Date: {new Date(r.createdAt).toLocaleDateString('en-IN', { day: '2-digit', month: '2-digit', year: 'numeric' })}</p>
                </div>
              </div>

              {/* Letter Body */}
              <div className="space-y-3 text-sm text-gray-800">
                <p>ബഹുമാനപ്പെട്ട</p>
                <p className="font-semibold">മേയർ അവർകൾക്ക്,</p>
                <p>തിരുവനന്തപുരം കോർപ്പറേഷൻ,</p>
                <p className="mb-4">തിരുവനന്തപുരം.</p>

                {/* Subject */}
                <p>
                  <span className="font-bold">വിഷയം: </span>
                  <span className="underline">{r.subject}</span>
                </p>

                <p className="mt-3">മഹോദയ/മഹോദയേ,</p>

                <p className="leading-relaxed mt-2">{r.description}</p>

                {r.sections && (
                  <div className="mt-3">
                    <p className="text-xs text-gray-500 font-medium mb-1">Sections:</p>
                    <div className="flex flex-wrap gap-1">
                      {r.sections.split(',').map(s => (
                        <span key={s} className="text-xs bg-blue-50 text-blue-700 px-2 py-0.5 rounded-full">{s.trim()}</span>
                      ))}
                    </div>
                  </div>
                )}

                <div className="mt-6 pt-4">
                  <p>താങ്കളുടെ വിശ്വസ്തൻ/വിശ്വസ്ത,</p>
                  <p>വിശ്വസ്തതയോടെ,</p>
                </div>

                <div className="mt-6 text-right">
                  <p className="font-semibold">{r.requesterName}</p>
                  <p>വാർഡ് കൗൺസിലർ</p>
                  <p className="text-xs text-gray-500">വാർഡ് {r.wardNumber}{r.wardName ? ` - ${r.wardName}` : ''}</p>
                  <p className="text-xs text-gray-500">തിരുവനന്തപുരം കോർപ്പറേഷൻ</p>
                </div>
              </div>
            </div>
          </div>





        </div>

        {/* Right */}
        <div className="space-y-4">
          {/* Councillor Info */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Councillor Info</h3>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">👤</span>
                <span className="text-sm text-gray-700 font-medium">{r.requesterName}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-gray-400 text-sm">🏘️</span>
                <span className="text-sm text-gray-700">
                  Ward {r.wardNumber}{r.wardName ? ` - ${r.wardName}` : ''}
                </span>
              </div>
            </div>
          </div>

          {/* Process Tracking */}
          <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-4">Process Tracking</h3>
            <div className="space-y-2 text-sm">
              <TrackStep
                done={true}
                label="Submitted by Councillor"
                value={r.requesterName}
              />
              <TrackStep
                done={['UNDER_MAYOR_REVIEW', 'APPROVED', 'SENT_TO_DEPARTMENT', 'FILE_NUMBER_GENERATED', 'IN_PROGRESS', 'CLOSED'].includes(r.status)}
                label="Under Mayor Review"
                value={r.status === 'UNDER_MAYOR_REVIEW' ? '⏳ Pending' : null}
              />
              <TrackStep
                done={['APPROVED', 'SENT_TO_DEPARTMENT', 'FILE_NUMBER_GENERATED', 'IN_PROGRESS', 'CLOSED'].includes(r.status)}
                label="Approved"
                value={r.status === 'APPROVED' || r.status === 'SENT_TO_DEPARTMENT' ? 'Mayor' : null}
              />
              <TrackStep
                done={['SENT_TO_DEPARTMENT', 'FILE_NUMBER_GENERATED', 'IN_PROGRESS', 'CLOSED'].includes(r.status)}
                label="Sent to Department"
                value={r.department}
              />
              <TrackStep
                done={['FILE_NUMBER_GENERATED', 'IN_PROGRESS', 'CLOSED'].includes(r.status)}
                label="File Number Generated"
                value={r.fileNumber}
              />
              <TrackStep
                done={r.status === 'CLOSED'}
                label="Closed"
                value={r.status === 'REJECTED' ? '❌ Rejected' : r.status === 'CLOSED' ? '✅ Done' : null}
              />
            </div>
          </div>

          {/* Timeline */}
          {r.timeline && r.timeline.length > 0 && (
            <div className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100">
              <h3 className="font-semibold text-gray-800 mb-4">Activity Timeline</h3>
              <div className="space-y-3">
                {r.timeline.map((h, i) => (
                  <div key={i} className="flex gap-3">
                    <div className="flex flex-col items-center">
                      <div className="w-3 h-3 rounded-full bg-blue-500 mt-1 flex-shrink-0" />
                      {i < r.timeline.length - 1 && (
                        <div className="w-0.5 flex-1 bg-gray-200 mt-1" />
                      )}
                    </div>
                    <div className="pb-3">
                      <p className="text-xs font-semibold text-blue-700">
                        {STATUS_LABELS[h.newStatus] || h.newStatus}
                      </p>
                      {h.remarks && <p className="text-xs text-gray-500 mt-0.5">{h.remarks}</p>}
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

      {/* ── STATUS MODAL ─────────────────────────── */}
      {showStatusModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
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
                  {STATUS_GROUPS.map(group => (
                    <optgroup key={group.label} label={`── ${group.label} ──`}>
                      {group.options.map(s => (
                        <option key={s} value={s}>{STATUS_LABELS[s]}</option>
                      ))}
                    </optgroup>
                  ))}
                </select>
              </div>

              {/* File number for relevant statuses */}
              {['FILE_NUMBER_GENERATED', 'SENT_TO_DEPARTMENT', 'IN_PROGRESS', 'APPROVED', 'CLOSED'].includes(statusForm.status) && (
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

              {/* Department dropdown */}
              {statusForm.status === 'SENT_TO_DEPARTMENT' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department / Committee</label>
                  <select
                    value={statusForm.department}
                    onChange={(e) => setStatusForm({ ...statusForm, department: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select Department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d}>{d}</option>)}
                  </select>
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
              <button onClick={() => setShowStatusModal(false)}
                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
              <button onClick={handleUpdateStatus} disabled={updating}
                className="flex-1 py-2 rounded-xl text-white text-sm font-medium"
                style={{ backgroundColor: '#0D47A1' }}>
                {updating ? 'Updating...' : 'Update'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── EMAIL MODAL ──────────────────────────── */}
      {showEmailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl p-6 w-full max-w-lg shadow-2xl">
            <h3 className="text-lg font-semibold text-gray-800 mb-1">Send Email</h3>
            <p className="text-xs text-gray-400 mb-4">From: vvrajesh@vvrajesh.in</p>

            {emailSent ? (
              <div className="text-center py-8">
                <p className="text-4xl mb-3">✅</p>
                <p className="text-green-600 font-medium">Email sent successfully!</p>
              </div>
            ) : (
              <div className="space-y-3">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">To (comma separated)</label>
                  <input
                    type="text"
                    placeholder="email1@example.com, email2@example.com"
                    value={emailForm.to}
                    onChange={(e) => setEmailForm({ ...emailForm, to: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Subject</label>
                  <input
                    type="text"
                    value={emailForm.subject}
                    onChange={(e) => setEmailForm({ ...emailForm, subject: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Message</label>
                  <textarea
                    rows={4}
                    placeholder="Write your message here..."
                    value={emailForm.body}
                    onChange={(e) => setEmailForm({ ...emailForm, body: e.target.value })}
                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="attachPdf"
                    checked={emailForm.attachPdf}
                    onChange={(e) => setEmailForm({ ...emailForm, attachPdf: e.target.checked })}
                    className="rounded"
                  />
                  <label htmlFor="attachPdf" className="text-sm text-gray-600">
                    📄 Attach request PDF
                  </label>
                </div>

                {/* Voice notes selection */}
                {voiceNotes.length > 0 && (
                  <div>
                    <p className="text-sm font-medium text-gray-700 mb-2">🎙️ Include Voice Notes</p>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {voiceNotes.map((note) => (
                        <div key={note.id} className="flex items-center gap-2 p-2 bg-purple-50 rounded-lg">
                          <input
                            type="checkbox"
                            id={`vn-${note.id}`}
                            checked={emailForm.voiceNoteIds.includes(note.id)}
                            onChange={(e) => {
                              const ids = e.target.checked
                                ? [...emailForm.voiceNoteIds, note.id]
                                : emailForm.voiceNoteIds.filter(id => id !== note.id)
                              setEmailForm({ ...emailForm, voiceNoteIds: ids })
                            }}
                            className="rounded"
                          />
                          <label htmlFor={`vn-${note.id}`} className="text-sm text-gray-600 flex-1">
                            {note.noteText || 'Voice Note'}
                            {note.recipientName && <span className="text-xs text-purple-600 ml-1">→ {note.recipientName}</span>}
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {!emailSent && (
              <div className="flex gap-3 mt-5">
                <button onClick={() => setShowEmailModal(false)}
                  className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                <button onClick={handleSendEmail} disabled={sendingEmail}
                  className="flex-1 py-2 rounded-xl text-white text-sm font-medium bg-purple-600">
                  {sendingEmail ? 'Sending...' : '✉️ Send Email'}
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}

function TrackStep({ done, label, value }) {
  return (
    <div className={`flex items-start gap-2 py-1.5 px-2 rounded-lg ${done ? 'bg-green-50' : 'bg-gray-50'}`}>
      <span className={`text-sm flex-shrink-0 ${done ? 'text-green-500' : 'text-gray-300'}`}>
        {done ? '✅' : '⭕'}
      </span>
      <div>
        <p className={`text-xs font-medium ${done ? 'text-green-700' : 'text-gray-400'}`}>{label}</p>
        {value && <p className="text-xs text-gray-500">{value}</p>}
      </div>
    </div>
  )
}

function getPendingWithDetailed(req) {
  switch (req.status) {
    case 'SUBMITTED': return '⏳ Pending with Mayor\'s office for review'
    case 'UNDER_MAYOR_REVIEW': return '👁️ Currently under Mayor\'s review'
    case 'APPROVED': return '✅ Approved by Mayor — awaiting next step'
    case 'SENT_TO_DEPARTMENT': return `📤 Sent to ${req.department || 'Department'} — awaiting action`
    case 'FILE_NUMBER_GENERATED': return req.fileNumber ? `📁 File number: ${req.fileNumber}` : '📁 File number generated'
    case 'IN_PROGRESS': return '⚙️ Work in progress'
    case 'CLOSED': return '🔒 Request completed and closed'
    case 'REJECTED': return '❌ Request rejected'
    case 'DRAFT': return '📝 Draft — not yet submitted'
    default: return 'Status unknown'
  }
}