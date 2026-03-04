'use client'
import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { loginUsuario, saveUsuario, buscarUsuarioPorDni } from '@/lib/usuarios'
import { useAuth } from '@/components/AuthProvider'
import { setSesion } from '@/lib/auth'

export default function LoginPage() {
  const router = useRouter()
  const { setUsuario } = useAuth()
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  
  const [showRegistro, setShowRegistro] = useState(false)
  const [regForm, setRegForm] = useState({ username: '', dni: '', password: '', telefono: '', email: '', rol: 'UsuFinal' as any })
  const [regError, setRegError] = useState('')
  const [regLoading, setRegLoading] = useState(false)

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setLoading(true)
    await new Promise(r => setTimeout(r, 400))
    const usuario = await loginUsuario(username, password)
    setLoading(false)
    if ('error' in usuario) { 
      setError(usuario.error); 
      return 
    }
    setSesion({ id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.username })
    setUsuario({ id: usuario.id, username: usuario.username, rol: usuario.rol, nombre: usuario.username })
    router.push('/contactos')
  }

  const handleInvitado = async () => {
    setShowRegistro(true)
  }

  const handleRegistro = async (e: React.FormEvent) => {
    e.preventDefault()
    setRegError('')
    
    if (!regForm.username.trim()) return setRegError('El username es obligatorio')
    if (!regForm.dni.trim()) return setRegError('El DNI es obligatorio')
    if (!regForm.password.trim()) return setRegError('La contraseña es obligatoria')
    if (!regForm.telefono.trim()) return setRegError('El teléfono es obligatorio')

    setRegLoading(true)
    
    const buscar = await buscarUsuarioPorDni(regForm.dni)
    if (buscar.existe) {
      setRegError(`Ya tenés usuario registrado. Tu nombre de usuario es: ${buscar.username}`)
      setRegLoading(false)
      return
    }

    const result = await saveUsuario({ ...regForm, rol: 'UsuFinal' as any })
    setRegLoading(false)
    
    if ('error' in result) {
      setRegError(result.error)
      return
    }

    setSesion({ id: result.id, username: result.username, rol: result.rol, nombre: result.username })
    setUsuario({ id: result.id, username: result.username, rol: result.rol, nombre: result.username })
    router.push('/agenda')
  }

  return (
    <div style={{
      minHeight: '100vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      background: '#080c09',
    }}>
      {!showRegistro ? (
        <div style={{
          background: '#0a1209',
          border: '1px solid #1a2e1c',
          borderRadius: '24px',
          padding: '2.5rem 2.25rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Image
              src="/LogoPadel.png"
              alt="Gestión de Padel"
              width={240}
              height={240}
              style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem', margin: '0 0 1.75rem' }}>
            Ingresá a tu cuenta para continuar
          </p>

          <form onSubmit={handleLogin} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Usuario</label>
              <input
                className="input"
                placeholder="Admin"
                value={username}
                onChange={e => { setUsername(e.target.value); setError('') }}
                autoComplete="username"
                autoFocus
              />
            </div>
            <div>
              <label className="form-label">Contraseña</label>
              <input
                className="input"
                type="password"
                placeholder="••••••••"
                value={password}
                onChange={e => { setPassword(e.target.value); setError('') }}
                autoComplete="current-password"
              />
            </div>

            {error && (
              <div style={{
                background: 'rgba(127,29,29,0.2)',
                border: '1px solid rgba(248,113,113,0.3)',
                borderRadius: '8px',
                padding: '0.6rem 0.875rem',
                fontSize: '0.8rem',
                color: '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>⚠️</span> {error}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={loading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem', marginTop: '0.25rem', opacity: loading ? 0.7 : 1 }}
            >
              {loading ? (
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" style={{ animation: 'spin 0.8s linear infinite' }}>
                    <path d="M21 12a9 9 0 1 1-6.219-8.56"/>
                  </svg>
                  Ingresando...
                </span>
              ) : 'Ingresar'}
            </button>
          </form>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0' }}>
            <div style={{ flex: 1, height: '1px', background: '#1a2e1c' }} />
            <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em' }}>o</span>
            <div style={{ flex: 1, height: '1px', background: '#1a2e1c' }} />
          </div>

          <button
            onClick={handleInvitado}
            disabled={loading}
            style={{
              width: '100%',
              padding: '0.7rem',
              borderRadius: '8px',
              border: '1px solid #1a2e1c',
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: '0.875rem',
              fontWeight: 500,
              cursor: loading ? 'wait' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              fontFamily: 'var(--font-body)',
              opacity: loading ? 0.7 : 1,
            }}
            onMouseEnter={e => {
              e.currentTarget.style.borderColor = 'rgba(34,197,94,0.4)'
              e.currentTarget.style.color = 'var(--text)'
              e.currentTarget.style.background = 'rgba(34,197,94,0.07)'
            }}
            onMouseLeave={e => {
              e.currentTarget.style.borderColor = '#1a2e1c'
              e.currentTarget.style.color = 'var(--text-dim)'
              e.currentTarget.style.background = 'transparent'
            }}
          >
            <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 3h4a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2h-4"/>
              <polyline points="10 17 15 12 10 7"/>
              <line x1="15" y1="12" x2="3" y2="12"/>
            </svg>
            Crear usuario
          </button>

          <p style={{ textAlign: 'center', fontSize: '0.7rem', color: 'var(--text-dim)', marginTop: '1.5rem', opacity: 0.5 }}>
            El modo invitado solo permite ver y reservar turnos
          </p>
        </div>
      ) : (
        <div style={{
          background: '#0a1209',
          border: '1px solid #1a2e1c',
          borderRadius: '24px',
          padding: '2.5rem 2.25rem',
          width: '100%',
          maxWidth: '400px',
          margin: '1rem',
          boxShadow: '0 30px 80px rgba(0,0,0,0.6)',
        }}>
          <div style={{ textAlign: 'center', marginBottom: '1.75rem' }}>
            <Image
              src="/LogoPadel.png"
              alt="Gestión de Padel"
              width={200}
              height={200}
              style={{ objectFit: 'contain', maxWidth: '100%', height: 'auto' }}
              priority
            />
          </div>

          <p style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.875rem', margin: '0 0 1.75rem' }}>
            Creá tu usuario para continuar
          </p>

          <form onSubmit={handleRegistro} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
            <div>
              <label className="form-label">Username *</label>
              <input
                className="input"
                placeholder="Tu nombre de usuario"
                value={regForm.username}
                onChange={e => { setRegForm(f => ({ ...f, username: e.target.value })); setRegError('') }}
                autoFocus
              />
            </div>

            <div>
              <label className="form-label">DNI *</label>
              <input
                className="input"
                placeholder="Tu DNI"
                value={regForm.dni}
                onChange={e => { setRegForm(f => ({ ...f, dni: e.target.value })); setRegError('') }}
              />
            </div>

            <div>
              <label className="form-label">Teléfono *</label>
              <input
                className="input"
                placeholder="+54 9 11 1234-5678"
                value={regForm.telefono}
                onChange={e => { setRegForm(f => ({ ...f, telefono: e.target.value })); setRegError('') }}
              />
            </div>

            <div>
              <label className="form-label">Email (opcional)</label>
              <input
                className="input"
                type="email"
                placeholder="tu@email.com"
                value={regForm.email}
                onChange={e => { setRegForm(f => ({ ...f, email: e.target.value })); setRegError('') }}
              />
            </div>

            <div>
              <label className="form-label">Contraseña *</label>
              <input
                className="input"
                type="password"
                placeholder="Tu contraseña"
                value={regForm.password}
                onChange={e => { setRegForm(f => ({ ...f, password: e.target.value })); setRegError('') }}
              />
            </div>

            {regError && (
              <div style={{
                background: regError.includes('ya tenés usuario') ? 'rgba(34,197,94,0.1)' : 'rgba(127,29,29,0.2)',
                border: `1px solid ${regError.includes('ya tenés usuario') ? 'rgba(34,197,94,0.3)' : 'rgba(248,113,113,0.3)'}`,
                borderRadius: '8px',
                padding: '0.6rem 0.875rem',
                fontSize: '0.8rem',
                color: regError.includes('ya tenés usuario') ? 'var(--green)' : '#f87171',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}>
                <span>{regError.includes('ya tenés usuario') ? '✓' : '⚠️'}</span> {regError}
              </div>
            )}

            <button
              type="submit"
              className="btn-primary"
              disabled={regLoading}
              style={{ width: '100%', padding: '0.7rem', fontSize: '0.9rem', marginTop: '0.25rem', opacity: regLoading ? 0.7 : 1 }}
            >
              {regLoading ? 'Creando...' : 'Crear usuario'}
            </button>
          </form>

          <button
            onClick={() => setShowRegistro(false)}
            style={{
              width: '100%',
              marginTop: '1rem',
              padding: '0.5rem',
              border: 'none',
              background: 'transparent',
              color: 'var(--text-dim)',
              fontSize: '0.8rem',
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
            }}
          >
            ← Volver al login
          </button>
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  )
}
