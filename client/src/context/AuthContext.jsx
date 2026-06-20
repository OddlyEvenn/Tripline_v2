import { createContext, useContext, useEffect, useState } from 'react'
import { authApi } from '../api/axios'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
    const [user, setUser] = useState(null)
    const [loading, setLoading] = useState(true)

    // On mount, try to fetch the current user from the cookie
    useEffect(() => {
        authApi.getMe()
            .then(res => setUser(res.data))
            .catch(() => setUser(null))
            .finally(() => setLoading(false))
    }, [])

    const login = async (credentials) => {
        const res = await authApi.login(credentials)
        setUser(res.data)
        return res.data
    }

    const register = async (data) => {
        const res = await authApi.register(data)
        // Don't set user yet; verification required
        return res.data
    }

    const verifyEmail = async (data) => {
        const res = await authApi.verifyEmail(data)
        setUser(res.data)
        return res.data
    }

    const logout = async () => {
        await authApi.logout()
        setUser(null)
    }

    const updateProfile = async (data) => {
        const res = await authApi.updateProfile(data)
        setUser(res.data)
        return res.data
    }

    const isAdmin = user?.role === 'ADMIN'
    const isAuthenticated = !!user

    return (
        <AuthContext.Provider value={{ user, loading, isAuthenticated, isAdmin, login, register, verifyEmail, logout, updateProfile }}>
            {children}
        </AuthContext.Provider>
    )
}

export function useAuth() {
    const ctx = useContext(AuthContext)
    if (!ctx) throw new Error('useAuth must be used inside AuthProvider')
    return ctx
}
