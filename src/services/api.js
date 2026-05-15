import axios from 'axios'

const BASE_URL = 'https://mayors-desk-production.up.railway.app/api'

const api = axios.create({
    baseURL: BASE_URL,
    headers: { 'Content-Type': 'application/json' },
})

// Auto attach token
api.interceptors.request.use((config) => {
    const token = localStorage.getItem('token')
    if (token) config.headers.Authorization = `Bearer ${token}`
    return config
})

// Handle 401
api.interceptors.response.use(
    (res) => res,
    (err) => {
        if (err.response?.status === 401) {
            localStorage.clear()
            window.location.href = '/login'
        }
        return Promise.reject(err)
    }
)

// ── AUTH ────────────────────────────────────────
export const login = (emailOrPhone, password) =>
    api.post('/auth/login', { emailOrPhone, password })

// ── REQUESTS ─────────────────────────────────────
export const getAllRequests = (params) =>
    api.get('/requests/admin/all', { params })

export const getRequestDetail = (requestId) =>
    api.get('/requests/detail', { params: { requestId } })

export const updateRequestStatus = (requestId, data) =>
    api.patch('/requests/status', data, { params: { requestId } })

export const downloadPdf = async (requestId) => {
    const response = await api.get('/requests/download', {
        params: { requestId },
        responseType: 'blob',
    })
    const url = window.URL.createObjectURL(new Blob([response.data]))
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', `${requestId.replace(/\//g, '_')}.pdf`)
    document.body.appendChild(link)
    link.click()
    link.remove()
    window.URL.revokeObjectURL(url)
}

export const uploadSignedDoc = (requestId, file) => {
    const formData = new FormData()
    formData.append('file', file)
    return api.post(`/requests/${encodeURIComponent(requestId)}/signed`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export const getDashboardStats = () =>
    api.get('/requests/admin/stats')

// ── USERS ────────────────────────────────────────
export const getUsers = () =>
    api.get('/admin/users')

export const createUser = (data) =>
    api.post('/admin/users', data)

export const toggleUserStatus = (id) =>
    api.patch(`/admin/users/${id}/status`)

export const resetPassword = (id, password) =>
    api.patch(`/admin/users/${id}/reset-password`, { password })

// ── LETTERHEAD ───────────────────────────────────
export const getLetterhead = () =>
    api.get('/admin/letterhead')

export const saveLetterhead = (data, logoFile) => {
    const formData = new FormData()
    formData.append('config', new Blob([JSON.stringify(data)], {
        type: 'application/json'
    }))
    if (logoFile) formData.append('logo', logoFile)
    return api.post('/admin/letterhead', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
    })
}

export default api