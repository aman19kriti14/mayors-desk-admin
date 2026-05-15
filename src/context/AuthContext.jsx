import { createContext, useContext, useState, useEffect } from 'react'
import { login as apiLogin } from '../services/api'

const AuthContext = createContext(null)

export const AuthProvider = ({ children }) => {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    useEffect(() => {
        const saved = localStorage.getItem('user')
        const token = localStorage.getItem('token')
        if (saved && token) {
            setUser(JSON.parse(saved))
        }
        setLoading(false)
    }, [])

    const login = async (emailOrPhone, password) => {
        const res = await apiLogin(emailOrPhone, password)
        const data = res.data.data
        localStorage.setItem('token', data.token)
        localStorage.setItem('user', JSON.stringify(data))
        setUser(data)
        return data
    }

    const logout = () => {
        localStorage.clear()
        setUser(null)
    }

    return (
        <AuthContext.Provider value={{ user, login, logout, loading }}>
            {children}
        </AuthContext.Provider>
    )
}

export const useAuth = () => useContext(AuthContext)