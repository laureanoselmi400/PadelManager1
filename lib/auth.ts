export type Rol = 'admin' | 'invitado'

export interface Usuario {
  id: string
  username: string
  rol: Rol
  nombre: string
}

export interface Sesion {
  usuario: Usuario
  timestamp: number
}

const SESSION_KEY = 'padel_session'

// Usuarios del sistema (hardcoded)
const USUARIOS: Array<Usuario & { password: string }> = [
  {
    id: '1',
    username: 'Admin',
    password: 'Admin',
    rol: 'admin',
    nombre: 'Administrador',
  },
]

export function login(username: string, password: string): Usuario | null {
  const user = USUARIOS.find(
    u => u.username === username && u.password === password
  )
  if (!user) return null
  const sesion: Sesion = {
    usuario: { id: user.id, username: user.username, rol: user.rol, nombre: user.nombre },
    timestamp: Date.now(),
  }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
  return sesion.usuario
}

export function loginInvitado(): Usuario {
  const usuario: Usuario = {
    id: 'invitado',
    username: 'invitado',
    rol: 'invitado',
    nombre: 'Invitado',
  }
  const sesion: Sesion = { usuario, timestamp: Date.now() }
  localStorage.setItem(SESSION_KEY, JSON.stringify(sesion))
  return usuario
}

export function getSesion(): Usuario | null {
  if (typeof window === 'undefined') return null
  const data = localStorage.getItem(SESSION_KEY)
  if (!data) return null
  try {
    const sesion: Sesion = JSON.parse(data)
    return sesion.usuario
  } catch {
    return null
  }
}

export function logout(): void {
  if (typeof window !== 'undefined') {
    localStorage.removeItem(SESSION_KEY)
  }
}

export function isAdmin(usuario: Usuario | null): boolean {
  return usuario?.rol === 'admin'
}
