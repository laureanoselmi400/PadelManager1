'use client'
import { useEffect } from 'react'
import { useRouter, usePathname } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'
import Navigation from '@/components/Navigation'

export default function AppShell({ children }: { children: React.ReactNode }) {
  const { usuario, loading } = useAuth()
  const router = useRouter()
  const pathname = usePathname()

  useEffect(() => {
    if (loading) return
    // No logueado → login
    if (!usuario) {
      router.replace('/login')
      return
    }
    // Invitado solo puede ver /agenda
    if (usuario.rol === 'invitado' && !pathname.startsWith('/agenda')) {
      router.replace('/agenda')
    }
  }, [usuario, loading, pathname, router])

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'var(--bg)' }}>
        <div style={{ textAlign: 'center' }}>
          <div className="font-display" style={{ fontSize: '1.5rem', color: 'var(--green)', marginBottom: '0.5rem' }}>CARGANDO...</div>
          <div style={{ width: '40px', height: '2px', background: 'var(--green)', margin: '0 auto', borderRadius: '1px', animation: 'pulse 1s infinite' }} />
        </div>
        <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.3} }`}</style>
      </div>
    )
  }

  if (!usuario) return null

  return (
    <div className="court-bg min-h-screen flex">
      <Navigation />
      <main className="flex-1 min-h-screen">
        {children}
      </main>
    </div>
  )
}
