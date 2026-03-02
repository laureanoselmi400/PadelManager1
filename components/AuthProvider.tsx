'use client'
import { createContext, useContext, useState, useEffect, ReactNode } from 'react'
import { Usuario, getSesion, logout as doLogout } from '@/lib/auth'

interface AuthContextType {
  usuario: Usuario | null
  setUsuario: (u: Usuario | null) => void
  logout: () => void
  loading: boolean
}

const AuthContext = createContext<AuthContextType>({
  usuario: null,
  setUsuario: () => {},
  logout: () => {},
  loading: true,
})

export function AuthProvider({ children }: { children: ReactNode }) {
  const [usuario, setUsuario] = useState<Usuario | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const u = getSesion()
    setUsuario(u)
    setLoading(false)
  }, [])

  const logout = () => {
    doLogout()
    setUsuario(null)
  }

  return (
    <AuthContext.Provider value={{ usuario, setUsuario, logout, loading }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  return useContext(AuthContext)
}
