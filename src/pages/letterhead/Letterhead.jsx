import { useState, useEffect } from 'react'
import { getLetterhead, saveLetterhead } from '../../services/api'

export default function Letterhead() {
    const [form, setForm] = useState({
        orgName: '',
        orgAddress: '',
        wardOfficeName: '',
        signatoryName: '',
        signatoryDesignation: '',
        footerText: '',
    })
    const [logoFile, setLogoFile] = useState(null)
    const [logoPreview, setLogoPreview] = useState(null)
    const [loading, setLoading] = useState(true)
    const [saving, setSaving] = useState(false)
    const [success, setSuccess] = useState(false)

    useEffect(() => {
        const load = async () => {
            try {
                const res = await getLetterhead()
                const d = res.data.data
                setForm({
                    orgName: d.orgName || '',
                    orgAddress: d.orgAddress || '',
                    wardOfficeName: d.wardOfficeName || '',
                    signatoryName: d.signatoryName || '',
                    signatoryDesignation: d.signatoryDesignation || '',
                    footerText: d.footerText || '',
                })
                if (d.logoUrl) setLogoPreview(d.logoUrl)
            } catch {
                // No config yet — use empty form
            } finally {
                setLoading(false)
            }
        }
        load()
    }, [])

    const handleLogoChange = (e) => {
        const file = e.target.files[0]
        if (!file) return
        setLogoFile(file)
        setLogoPreview(URL.createObjectURL(file))
    }

    const handleSave = async (e) => {
        e.preventDefault()
        setSaving(true)
        setSuccess(false)
        try {
            await saveLetterhead(form, logoFile)
            setSuccess(true)
            setTimeout(() => setSuccess(false), 3000)
        } catch (err) {
            alert(err.response?.data?.message || 'Failed to save letterhead')
        } finally {
            setSaving(false)
        }
    }

    if (loading) return (
        <div className="flex items-center justify-center h-64">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600" />
        </div>
    )

    return (
        <div className="space-y-5 fade-in max-w-4xl">
            <div>
                <h2 className="text-2xl font-bold text-gray-800">Letterhead Configuration</h2>
                <p className="text-gray-500 text-sm mt-1">
                    Configure the official letterhead used in all request PDFs
                </p>
            </div>

            <div className="grid grid-cols-2 gap-6">
                {/* Form */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Settings</h3>
                    <form onSubmit={handleSave} className="space-y-4">

                        {/* Logo Upload */}
                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-2">Logo</label>
                            <div className="flex items-center gap-4">
                                {logoPreview ? (
                                    <img src={logoPreview} alt="Logo"
                                        className="w-16 h-16 object-contain border border-gray-200 rounded-lg" />
                                ) : (
                                    <div className="w-16 h-16 border-2 border-dashed border-gray-200 rounded-lg flex items-center justify-center text-gray-400">
                                        🖼️
                                    </div>
                                )}
                                <label className="cursor-pointer px-4 py-2 border border-gray-200 rounded-xl text-sm text-gray-600 hover:bg-gray-50">
                                    {logoPreview ? 'Change Logo' : 'Upload Logo'}
                                    <input type="file" accept="image/*" onChange={handleLogoChange} className="hidden" />
                                </label>
                            </div>
                        </div>

                        {[
                            { key: 'orgName', label: 'Organisation Name', placeholder: 'Trivandrum City Municipal Corporation' },
                            { key: 'wardOfficeName', label: 'Ward Office Name', placeholder: "Mayor's Office" },
                            { key: 'signatoryName', label: 'Signatory Name', placeholder: 'Mayor' },
                            { key: 'signatoryDesignation', label: 'Signatory Designation', placeholder: 'Mayor, Trivandrum City Municipal Corporation' },
                        ].map(({ key, label, placeholder }) => (
                            <div key={key}>
                                <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                                <input
                                    type="text"
                                    placeholder={placeholder}
                                    value={form[key]}
                                    onChange={(e) => setForm({ ...form, [key]: e.target.value })}
                                    className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                                />
                            </div>
                        ))}

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Organisation Address</label>
                            <textarea
                                rows={2}
                                placeholder="Corporation Office, Palayam, Thiruvananthapuram, Kerala - 695034"
                                value={form.orgAddress}
                                onChange={(e) => setForm({ ...form, orgAddress: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Footer Text</label>
                            <input
                                type="text"
                                placeholder="This is a computer generated document."
                                value={form.footerText}
                                onChange={(e) => setForm({ ...form, footerText: e.target.value })}
                                className="w-full px-3 py-2 border border-gray-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            />
                        </div>

                        {success && (
                            <div className="bg-green-50 border border-green-200 text-green-700 rounded-xl px-4 py-3 text-sm">
                                ✅ Letterhead saved successfully!
                            </div>
                        )}

                        <button
                            type="submit"
                            disabled={saving}
                            className="w-full py-3 rounded-xl text-white font-semibold"
                            style={{ backgroundColor: saving ? '#90A4AE' : '#0D47A1' }}
                        >
                            {saving ? 'Saving...' : 'Save Letterhead'}
                        </button>
                    </form>
                </div>

                {/* Preview */}
                <div className="bg-white rounded-2xl p-6 shadow-sm border border-gray-100">
                    <h3 className="font-semibold text-gray-800 mb-4">Preview</h3>
                    <div className="border border-gray-200 rounded-xl overflow-hidden">
                        {/* Header */}
                        <div className="p-4" style={{ backgroundColor: '#0D47A1' }}>
                            <div className="flex items-center gap-3">
                                {logoPreview && (
                                    <img src={logoPreview} alt="Logo"
                                        className="w-12 h-12 object-contain bg-white rounded" />
                                )}
                                <div>
                                    <p className="text-white font-bold text-sm">
                                        {form.orgName || 'Organisation Name'}
                                    </p>
                                    {form.wardOfficeName && (
                                        <p className="text-blue-200 text-xs">{form.wardOfficeName}</p>
                                    )}
                                    <p className="text-blue-300 text-xs">
                                        {form.orgAddress || 'Address'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Divider */}
                        <div className="h-0.5 bg-blue-800" />
                        {/* Body */}
                        <div className="p-4 text-xs text-gray-600 space-y-2">
                            <div className="flex justify-between">
                                <span className="font-semibold text-blue-700">MD/TVM/045/26/00001</span>
                                <span>{new Date().toLocaleDateString('en-IN')}</span>
                            </div>
                            <p className="text-gray-400 italic">Subject: Sample request subject...</p>
                            <p className="text-gray-400 italic leading-relaxed">
                                Description of the request will appear here...
                            </p>
                            <div className="pt-8 text-right">
                                <div className="inline-block text-center">
                                    <p className="border-t border-gray-400 pt-1 px-4">
                                        {form.signatoryName || 'Signatory Name'}
                                    </p>
                                    <p className="text-gray-400 text-xs">
                                        {form.signatoryDesignation || 'Designation'}
                                    </p>
                                </div>
                            </div>
                        </div>
                        {/* Footer */}
                        <div className="bg-gray-50 px-4 py-2 text-center">
                            <p className="text-xs text-gray-400">
                                {form.footerText || 'Footer text will appear here'}
                            </p>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    )
}