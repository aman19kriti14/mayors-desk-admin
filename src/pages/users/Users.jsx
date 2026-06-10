import { useState, useEffect } from 'react'
import { getUsers, createUser, toggleUserStatus, resetPassword } from '../../services/api'

const ROLES = [
    { value: 'WARD_MEMBER', label: 'Ward Member', group: 'Mobile App' },
    { value: 'ADMIN', label: 'Admin', group: 'Web Portal' },
    { value: 'MAYOR_OFFICE', label: "Mayor's Office", group: 'Web Portal' },
    { value: 'DEPUTY_MAYOR', label: 'Deputy Mayor', group: 'Standing Committees' },
    { value: 'SECRETARY', label: 'Secretary', group: 'Standing Committees' },
    { value: 'COMMITTEE_FINANCE', label: 'Finance Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_HEALTH', label: 'Health Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_DEVELOPMENT', label: 'Development Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_TOWN_PLANNING', label: 'Town Planning Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_EDUCATION_SPORTS', label: 'Education & Sports Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_WELFARE', label: 'Welfare Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_PUBLIC_WORKS', label: 'Public Works Committee', group: 'Standing Committees' },
    { value: 'COMMITTEE_TAXATION', label: 'Taxation Committee', group: 'Standing Committees' },
]

const ROLE_GROUPS = ['Mobile App', 'Web Portal', 'Standing Committees']

const ROLE_COLORS = {
    WARD_MEMBER: 'bg-blue-100 text-blue-700',
    ADMIN: 'bg-red-100 text-red-700',
    MAYOR_OFFICE: 'bg-blue-100 text-blue-800',
    DEPUTY_MAYOR: 'bg-purple-100 text-purple-700',
    SECRETARY: 'bg-indigo-100 text-indigo-700',
    COMMITTEE_FINANCE: 'bg-green-100 text-green-700',
    COMMITTEE_HEALTH: 'bg-pink-100 text-pink-700',
    COMMITTEE_DEVELOPMENT: 'bg-orange-100 text-orange-700',
    COMMITTEE_TOWN_PLANNING: 'bg-cyan-100 text-cyan-700',
    COMMITTEE_EDUCATION_SPORTS: 'bg-yellow-100 text-yellow-700',
    COMMITTEE_WELFARE: 'bg-teal-100 text-teal-700',
    COMMITTEE_PUBLIC_WORKS: 'bg-amber-100 text-amber-700',
    COMMITTEE_TAXATION: 'bg-rose-100 text-rose-700',
}

const getRoleLabel = (role) => ROLES.find(r => r.value === role)?.label || role

export default function Users() {
    const [users, setUsers] = useState([])
    const [loading, setLoading] = useState(true)
    const [showModal, setShowModal] = useState(false)
    const [showResetModal, setShowResetModal] = useState(false)
    const [selectedUser, setSelectedUser] = useState(null)
    const [newPassword, setNewPassword] = useState('')
    const [filterRole, setFilterRole] = useState('')
    const [form, setForm] = useState({
        name: '', email: '', phoneNumber: '', wardNumber: '',
        wardName: '', password: '', role: 'WARD_MEMBER'
    })
    const [creating, setCreating] = useState(false)
    const [error, setError] = useState('')

    const isWardMember = form.role === 'WARD_MEMBER'

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
            setForm({ name: '', email: '', phoneNumber: '', wardNumber: '', wardName: '', password: '', role: 'WARD_MEMBER' })
        } catch (err) {
            setError(err.response?.data?.message || 'Failed to create user')
        } finally {
            setCreating(false)
        }
    }

    const handleToggle = async (id) => {
        try { await toggleUserStatus(id); await load() }
        catch { alert('Failed to update status') }
    }

    const handleResetPassword = async () => {
        if (!newPassword || newPassword.length < 6) { alert('Minimum 6 characters'); return }
        try {
            await resetPassword(selectedUser.id, newPassword)
            setShowResetModal(false)
            setNewPassword('')
            alert('Password reset successfully!')
        } catch { alert('Failed to reset password') }
    }

    const filteredUsers = filterRole
        ? users.filter(u => u.role === filterRole)
        : users

    return (
        <div className="space-y-5 fade-in">
            <div className="flex items-center justify-between flex-wrap gap-3">
                <div>
                    <h2 className="text-2xl font-bold text-gray-800">Users</h2>
                    <p className="text-gray-500 text-sm mt-1">Manage all users and roles</p>
                </div>
                <button
                    onClick={() => setShowModal(true)}
                    className="flex items-center gap-2 px-4 py-2 rounded-xl text-white text-sm font-medium"
                    style={{ backgroundColor: '#0D47A1' }}
                >
                    + Add User
                </button>
            </div>

            {/* Role filter */}
            <div className="flex gap-2 flex-wrap">
                <button
                    onClick={() => setFilterRole('')}
                    className={`px-3 py-1.5 rounded-full text-xs font-medium ${!filterRole ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                >
                    All ({users.length})
                </button>
                {ROLES.filter(r => users.some(u => u.role === r.value)).map(r => (
                    <button
                        key={r.value}
                        onClick={() => setFilterRole(r.value)}
                        className={`px-3 py-1.5 rounded-full text-xs font-medium ${filterRole === r.value ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-600'}`}
                    >
                        {r.label} ({users.filter(u => u.role === r.value).length})
                    </button>
                ))}
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
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Contact</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Ward</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Role</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Status</th>
                                <th className="text-left px-6 py-3 text-xs font-semibold text-gray-500 uppercase">Actions</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-gray-50">
                            {filteredUsers.map((u) => (
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
                                    <td className="px-6 py-4">
                                        <p className="text-sm text-gray-600">{u.email || '-'}</p>
                                        <p className="text-xs text-gray-400">{u.phoneNumber || '-'}</p>
                                    </td>
                                    <td className="px-6 py-4 text-sm text-gray-600">
                                        {u.wardNumber ? `Ward ${u.wardNumber}${u.wardName ? ` - ${u.wardName}` : ''}` : '-'}
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${ROLE_COLORS[u.role] || 'bg-gray-100 text-gray-600'}`}>
                                            {getRoleLabel(u.role)}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <span className={`text-xs px-2 py-1 rounded-full font-medium ${u.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                                            {u.isActive ? 'Active' : 'Inactive'}
                                        </span>
                                    </td>
                                    <td className="px-6 py-4">
                                        <div className="flex gap-2">
                                            <button onClick={() => handleToggle(u.id)}
                                                className="text-xs px-3 py-1 border border-gray-200 rounded-lg hover:bg-gray-50">
                                                {u.isActive ? 'Deactivate' : 'Activate'}
                                            </button>
                                            <button onClick={() => { setSelectedUser(u); setShowResetModal(true) }}
                                                className="text-xs px-3 py-1 border border-orange-200 text-orange-600 rounded-lg hover:bg-orange-50">
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-md shadow-2xl max-h-screen overflow-y-auto">
                        <h3 className="text-lg font-semibold text-gray-800 mb-4">Add User</h3>
                        <form onSubmit={handleCreate} className="space-y-3">

                            {/* Role selector */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                                <select
                                    value={form.role}
                                    onChange={(e) => setForm({ ...form, role: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                >
                                    {ROLE_GROUPS.map(group => (
                                        <optgroup key={group} label={`── ${group} ──`}>
                                            {ROLES.filter(r => r.group === group).map(r => (
                                                <option key={r.value} value={r.value}>{r.label}</option>
                                            ))}
                                        </optgroup>
                                    ))}
                                </select>
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                                <input type="text" placeholder="Full name" value={form.name}
                                    onChange={(e) => setForm({ ...form, name: e.target.value })} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            {/* Ward fields only for WARD_MEMBER */}
                            {isWardMember && (
                                <>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ward Name</label>
                                        <input type="text" placeholder="e.g. Kadakampally" value={form.wardName}
                                            onChange={(e) => setForm({ ...form, wardName: e.target.value })} required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-gray-700 mb-1">Ward Number</label>
                                        <input type="text" placeholder="e.g. 045" value={form.wardNumber}
                                            onChange={(e) => setForm({ ...form, wardNumber: e.target.value })} required
                                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                                    </div>
                                </>
                            )}

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Phone Number {!isWardMember && <span className="text-gray-400 text-xs">(optional)</span>}
                                </label>
                                <input type="tel" placeholder="9876543210" value={form.phoneNumber}
                                    onChange={(e) => setForm({ ...form, phoneNumber: e.target.value })}
                                    required={isWardMember}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Email <span className="text-gray-400 text-xs">(optional)</span>
                                </label>
                                <input type="email" placeholder="email@example.com" value={form.email}
                                    onChange={(e) => setForm({ ...form, email: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                                <input type="password" placeholder="Min 6 characters" value={form.password}
                                    onChange={(e) => setForm({ ...form, password: e.target.value })} required
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500" />
                            </div>

                            {error && <p className="text-red-500 text-sm">{error}</p>}

                            <div className="flex gap-3 mt-4">
                                <button type="button" onClick={() => setShowModal(false)}
                                    className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
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
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl p-6 w-full max-w-sm shadow-2xl">
                        <h3 className="text-lg font-semibold text-gray-800 mb-1">Reset Password</h3>
                        <p className="text-sm text-gray-500 mb-4">For: {selectedUser?.name}</p>
                        <input type="password" placeholder="New password (min 6 chars)" value={newPassword}
                            onChange={(e) => setNewPassword(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 mb-4" />
                        <div className="flex gap-3">
                            <button onClick={() => setShowResetModal(false)}
                                className="flex-1 py-2 border border-gray-200 rounded-xl text-sm text-gray-600">Cancel</button>
                            <button onClick={handleResetPassword}
                                className="flex-1 py-2 rounded-xl text-white text-sm font-medium bg-orange-500">Reset</button>
                        </div>
                    </div>
                </div>
            )}
        </div>
    )
}