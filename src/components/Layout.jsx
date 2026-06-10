import { useState, useEffect } from 'react'
import { NavLink, Outlet, useNavigate } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'

const navItems = [
  { path: '/', label: 'Dashboard', icon: '📊', exact: true },
  { path: '/requests', label: 'Requests', icon: '📋' },
  { path: '/users', label: 'Ward Members', icon: '👥' },
  { path: '/letterhead', label: 'Letterhead', icon: '📄' },
]

export default function Layout() {
  const { user, logout } = useAuth()
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const check = () => {
      setIsMobile(window.innerWidth < 768)
      setSidebarOpen(window.innerWidth >= 768)
    }
    check()
    window.addEventListener('resize', check)
    return () => window.removeEventListener('resize', check)
  }, [])

  const handleLogout = () => {
    logout()
    navigate('/login')
  }

  const closeSidebarOnMobile = () => {
    if (isMobile) setSidebarOpen(false)
  }

  return (
    <div className="flex h-screen overflow-hidden bg-gray-50">

      {/* Mobile overlay */}
      {isMobile && sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/50 z-20"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`
          ${isMobile ? 'fixed z-30 h-full' : 'relative'}
          ${sidebarOpen ? 'w-64' : isMobile ? '-translate-x-full w-64' : 'w-20'}
          transition-all duration-300 flex flex-col flex-shrink-0
        `}
        style={{ backgroundColor: '#0D47A1' }}
      >
        {/* Logo */}
        <div className="flex items-center gap-3 px-4 py-5 border-b border-blue-700">
          <span className="text-2xl flex-shrink-0">🏛️</span>
          {sidebarOpen && (
            <div className="overflow-hidden">
              <p className="text-white font-bold text-sm whitespace-nowrap">Mayor's Desk</p>
              <p className="text-blue-300 text-xs whitespace-nowrap">Admin Portal</p>
            </div>
          )}
        </div>

        {/* Nav */}
        <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
          {navItems.map((item) => (
            <NavLink
              key={item.path}
              to={item.path}
              end={item.exact}
              onClick={closeSidebarOnMobile}
              className={({ isActive }) =>
                `flex items-center gap-3 px-3 py-3 rounded-xl transition-all ${
                  isActive
                    ? 'bg-white/20 text-white font-semibold'
                    : 'text-blue-200 hover:bg-white/10 hover:text-white'
                }`
              }
            >
              <span className="text-xl flex-shrink-0">{item.icon}</span>
              {sidebarOpen && <span className="text-sm whitespace-nowrap">{item.label}</span>}
            </NavLink>
          ))}
        </nav>

        {/* User */}
        <div className="p-4 border-t border-blue-700">
          {sidebarOpen && (
            <div className="mb-3 overflow-hidden">
              <p className="text-white text-sm font-medium truncate">{user?.name}</p>
              <p className="text-blue-300 text-xs truncate">{user?.email}</p>
            </div>
          )}
          <button
            onClick={handleLogout}
            className="flex items-center gap-2 text-blue-200 hover:text-white transition-colors text-sm w-full"
          >
            <span className="flex-shrink-0">🚪</span>
            {sidebarOpen && 'Logout'}
          </button>
        </div>
      </aside>

      {/* Main */}
      <div className="flex-1 flex flex-col overflow-hidden min-w-0">
        {/* Topbar */}
        <header className="bg-white border-b border-gray-200 px-4 md:px-6 py-4 flex items-center gap-4 flex-shrink-0">
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            className="text-gray-500 hover:text-gray-700 text-xl flex-shrink-0"
          >
            ☰
          </button>
          <h1 className="text-gray-800 font-semibold text-sm md:text-base truncate">
            Thiruvananthapuram City Municipal Corporation
          </h1>
          <div className="ml-auto flex items-center gap-2 flex-shrink-0">
            <div className="w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-semibold"
              style={{ backgroundColor: '#0D47A1' }}>
              {user?.name?.charAt(0)}
            </div>
          </div>
        </header>

        {/* Content */}
        <main className="flex-1 overflow-auto p-4 md:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  )
}