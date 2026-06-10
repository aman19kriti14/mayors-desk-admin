import { createContext, useContext, useState, useEffect, useCallback, useRef } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const inactivityTimer = useRef(null)
  const INACTIVITY_LIMIT = 30 * 60 * 1000 // 30 minutes

  useEffect(() => {
    const saved = localStorage.getItem('user')
    const token = localStorage.getItem('token')
    if (saved && token) {
      setUser(JSON.parse(saved))
    }
    setLoading(false)
  }, [])

  const login = async (emailOrPhone, password) => {
    const res = await apiLogin(emailOrPhone, password, 'WEB')
    const data = res.data.data
    localStorage.setItem('token', data.token)
    localStorage.setItem('user', JSON.stringify(data))
    setUser(data)
    return data
  }

  const logout = useCallback(() => {
    localStorage.clear()
    setUser(null)
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
  }, [])

  // Reset inactivity timer on user activity
  const resetTimer = useCallback(() => {
    if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    inactivityTimer.current = setTimeout(() => {
      logout()
      window.location.href = '/login'
    }, INACTIVITY_LIMIT)
  }, [logout])

  useEffect(() => {
    if (!user) return
    const events = ['mousedown', 'mousemove', 'keypress', 'scroll', 'touchstart', 'click']
    events.forEach(e => window.addEventListener(e, resetTimer))
    resetTimer()
    return () => {
      events.forEach(e => window.removeEventListener(e, resetTimer))
      if (inactivityTimer.current) clearTimeout(inactivityTimer.current)
    }
  }, [user, resetTimer])

  return (
    <AuthContext.Provider value={{ user, login, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)