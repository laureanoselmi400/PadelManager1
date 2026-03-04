'use client'
import Image from 'next/image'
import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { useAuth } from '@/components/AuthProvider'

export default function Navigation() {
  const pathname = usePathname()
  const { usuario, logout } = useAuth()
  const router = useRouter()

  const isAdmin = usuario?.rol === 'admin'
  const isInvitado = usuario?.rol === 'invitado'
  const isUsuFinal = usuario?.rol === 'UsuFinal'

  const handleLogout = () => {
    logout()
    router.push('/login')
  }

  return (
    <nav style={{
      background: '#0a1209',
      borderRight: '1px solid #1a2e1c',
      width: '220px',
      minHeight: '100vh',
      padding: '1.25rem 1rem',
      display: 'flex',
      flexDirection: 'column',
      gap: '0.25rem',
      flexShrink: 0,
    }}>
      {/* Logo */}
      <div style={{
        marginBottom: '1.25rem',
        paddingBottom: '1.25rem',
        borderBottom: '1px solid #1a2e1c',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
      }}>
        <Image
          src="/LogoPadel.png"
          alt="Gestión de Padel"
          width={180}
          height={180}
          style={{ objectFit: 'contain', width: '100%', height: 'auto' }}
          priority
        />
      </div>

      {/* Usuario actual */}
      <div style={{
        background: '#111e13',
        border: '1px solid #1a2e1c',
        borderRadius: '10px',
        padding: '0.6rem 0.75rem',
        marginBottom: '1rem',
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
      }}>
        <div style={{
          width: '28px', height: '28px', borderRadius: '50%',
          background: isInvitado ? 'rgba(138,171,138,0.15)' : 'rgba(34,197,94,0.12)',
          border: `1px solid ${isInvitado ? '#1a2e1c' : 'rgba(34,197,94,0.3)'}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          fontSize: '0.75rem', flexShrink: 0,
        }}>
          {isInvitado ? '👤' : '⚡'}
        </div>
        <div style={{ overflow: 'hidden' }}>
          <div style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {usuario?.nombre}
          </div>
          <div style={{ fontSize: '0.65rem', color: isInvitado ? 'var(--text-dim)' : 'var(--green)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            {usuario?.rol === 'admin' ? 'Administrador' : usuario?.rol === 'operador' ? 'Operador' : usuario?.rol === 'UsuFinal' ? 'Usuario' : 'Invitado'}
          </div>
        </div>
      </div>

      <p style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '0.25rem', paddingLeft: '0.5rem', opacity: 0.7 }}>Menú</p>

      {/* Contactos — solo admin y operador */}
      {(isAdmin || usuario?.rol === 'operador') && (
        <Link href="/contactos" className={`nav-link ${pathname.startsWith('/contactos') ? 'active' : ''}`}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <path d="M23 21v-2a4 4 0 0 0-3-3.87"/>
            <path d="M16 3.13a4 4 0 0 1 0 7.75"/>
          </svg>
          Contactos
        </Link>
      )}

      {/* Canchas — admin y operador */}
      {(isAdmin || usuario?.rol === 'operador') && (
        <Link href="/canchas" className={`nav-link ${pathname.startsWith('/canchas') ? 'active' : ''}`}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <rect x="2" y="5" width="20" height="14" rx="2"/>
            <line x1="12" y1="5" x2="12" y2="19"/>
            <line x1="2" y1="12" x2="22" y2="12"/>
            <circle cx="12" cy="12" r="3"/>
          </svg>
          Canchas
        </Link>
      )}

      {/* Usuarios — solo admin */}
      {isAdmin && (
        <Link href="/usuarios" className={`nav-link ${pathname.startsWith('/usuarios') ? 'active' : ''}`}>
          <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/>
            <circle cx="9" cy="7" r="4"/>
            <line x1="19" y1="8" x2="19" y2="14"/>
            <line x1="22" y1="11" x2="16" y2="11"/>
          </svg>
          Usuarios
        </Link>
      )}

      {/* Agenda — todos */}
      <Link href="/agenda" className={`nav-link ${pathname.startsWith('/agenda') ? 'active' : ''}`}>
        <svg width="16" height="16" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
          <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
          <line x1="16" y1="2" x2="16" y2="6"/>
          <line x1="8" y1="2" x2="8" y2="6"/>
          <line x1="3" y1="10" x2="21" y2="10"/>
        </svg>
        Agenda
        {isInvitado || isUsuFinal ? (
          <span style={{ marginLeft: 'auto', fontSize: '0.6rem', background: 'rgba(34,197,94,0.12)', color: 'var(--green)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
            reservas
          </span>
        ) : null}
      </Link>

      {/* Footer con logout */}
      <div style={{ marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid #1a2e1c', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', paddingLeft: '0.25rem', marginBottom: '0.25rem' }}>
          <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: 'var(--green)', boxShadow: '0 0 8px var(--green)' }} />
          <span style={{ fontSize: '0.7rem', color: 'var(--text-dim)' }}>Sistema activo</span>
        </div>
        <button
          onClick={handleLogout}
          style={{
            display: 'flex', alignItems: 'center', gap: '0.5rem',
            padding: '0.55rem 0.75rem', borderRadius: '8px',
            border: '1px solid #1a2e1c', background: 'transparent',
            color: 'var(--text-dim)', fontSize: '0.8rem', fontWeight: 500,
            cursor: 'pointer', width: '100%', fontFamily: 'var(--font-body)',
            transition: 'all 0.2s',
          }}
          onMouseEnter={e => {
            e.currentTarget.style.borderColor = 'rgba(248,113,113,0.4)'
            e.currentTarget.style.color = '#f87171'
            e.currentTarget.style.background = 'rgba(127,29,29,0.2)'
          }}
          onMouseLeave={e => {
            e.currentTarget.style.borderColor = '#1a2e1c'
            e.currentTarget.style.color = 'var(--text-dim)'
            e.currentTarget.style.background = 'transparent'
          }}
        >
          <svg width="14" height="14" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/>
            <line x1="21" y1="12" x2="9" y2="12"/>
          </svg>
          Cerrar sesión
        </button>
      </div>
    </nav>
  )
}
