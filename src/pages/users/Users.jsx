import { useState, useEffect } from 'react'
import { getUsers, createUser, toggleUserStatus, resetPassword } from '../../services/api'

export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [form, setForm] = useState({
        name: '', email: '', phoneNumber: '', wardNumber: '', wardName: '', password: ''
    })
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

    const load = async () => {
        setLoading(true)
        try {
            const res = await getUsers()
            setUsers(res.data.data)
        } catch (err) {
            console.error(err)
        } finally {
            setLoading(false)
        }
    }

    useEffect(() => { load() }, [])

    const handleCreate = async (e) => {
        e.preventDefault()
        setCreating(true)
        setError('')
        try {
            await createUser(form)
            await load()
            setShowModal(false)
            setForm({ name: '', email: '', phoneNumber: '', wardNumber: '', wardName: '', password: '' })
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    const handleToggle = async (id) => {
        try {
            await toggleUserStatus(id)
            await load()
        } catch (err) {
            alert('Failed to update status')
        }
    }

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            alert('Password must be at least 6 characters')
            return
        }
        try {
            await resetPassword(selectedUser.id, newPassword)
            setShowResetModal(false)
            setNewPassword('')
            alert('Password reset successfully!')
        } catch (err) {
            alert('Failed to reset password')
        }
    }

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Ward Members</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage councillor accounts</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                    style={{ backgroundColor: '#0D47A1' }}
                >
                    + Add Ward Member
                </button>
            </div>

            <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
                {loading ? (
                    <div className="flex items-center justify-center h-48">
                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600" />
                    </div>
                ) : (
                    <table className="w-full">
                        <thead>
                            <tr className="bg-gray-50 border-b border-gray-100">
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Name</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Email</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Phone</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ward</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ward Name</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {users.map((u) => (
                                <tr key={u.id} className="hover:bg-gray-50">
                                    <td className="px-6 py-4">
                                        <div className="flex items-center gap-3">
                                            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
                                                style={{ backgroundColor: '#0D47A1' }}>
                                                {u.name?.charAt(0)}
                                            </div>
                                            <span className="text-sm font-medium text-gray-800">{u.name}</span>
                                        </div>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.email}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.phoneNumber || '-'}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">Ward {u.wardNumber}</td>
                                    <td className="px-6 py-4 text-sm text-gray-600">{u.wardName || '-'}</td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                                            }`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button
                                                onClick={() => handleToggle(u.id)}
                                                className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50"
                                            >
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button
                                                onClick={() => { setSelectedUser(u); setShowResetModal(true) }}
                                                className="text-xs px-3 py-1 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50"
                                            >
                                                Reset Password
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Create User Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add Ward Member</h3>
                        <form onSubmit={handleCreate} className="space-y-3">
                            {[
                                { key: 'name', label: 'Full Name', type: 'text', placeholder: 'John D\'Souza' },
                                { key: 'email', label: 'Email', type: 'email', placeholder: 'john@ward.in' },
                                { key: 'phoneNumber', label: 'Phone Number', type: 'tel', placeholder: '9876543210' },
                                { key: 'wardNumber', label: 'Ward Number', type: 'text', placeholder: '45' },
                                { key: 'wardName', label: 'Ward Name', type: 'text', placeholder: 'Kadakampally Ward' },
                                { key: 'password', label: 'Password', type: 'password', placeholder: 'Min 6 characters' },
                            ].map(({ key, label, type, placeholder }) => (
                                <div key={key}>
                                    <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                    <input
                                        type={type}
                                        placeholder={placeholder}
                                        value={form[key]}
                                        onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                        required
                                        className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                    />
                                </div>
                            ))}
                            {error && <p className="text-red-500 text-sm">{error}</p>}
                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">
                                    Cancel
                                </button>
                                <button type="submit" disabled={creating}
                                    className="flex-1 py-2 rounded-xl text-white text-sm font-medium"
                                    style={{ backgroundColor: '#0D47A1' }}>
                                    {creating ? 'Creating...' : 'Create'}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Reset Password Modal */}
            {showResetModal && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h3>
                        <p className="text-sm text-gray-500 mb-4">For: {selectedUser?.name}</p>
                        <input
                            type="password"
                            placeholder="New password (min 6 chars)"
                            value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4"
                        />
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">
                                Cancel
                            </button>
                            <button onClick={handleResetPassword}
                                className="flex-1 py-2 rounded-xl text-white text-sm font-medium bg-orange-500">
                                Reset
                            </button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}