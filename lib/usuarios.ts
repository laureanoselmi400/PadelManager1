export type Rol = 'admin' | 'operador' | 'invitado' | 'UsuFinal'

export interface Usuario {
  id: string
  username: string
  dni: string
  telefono: string
  email?: string
  rol: Rol
  createdAt: string
}

const API_URL = '/api/db'

async function fetchAPI(collection: string, action?: string, data?: any) {
  try {
    const res = await fetch(`${API_URL}?collection=${collection}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ action, collection, data }),
    })
    
    const text = await res.text()
    if (!text) return { error: 'Empty response' }
    try {
      return JSON.parse(text)
    } catch {
      return { error: 'Invalid JSON' }
    }
  } catch {
    return { error: 'Network error' }
  }
}

export async function getUsuarios(): Promise<Usuario[]> {
  const result = await fetchAPI('usuarios', 'getAll')
  return result || []
}

export async function saveUsuario(data: { username: string; dni: string; password: string; telefono: string; email?: string; rol: Rol }): Promise<Usuario | { error: string; existe?: boolean; username?: string }> {
  return await fetchAPI('usuarios', 'create', data)
}

export async function updateUsuario(id: string, data: Partial<Omit<Usuario, 'id' | 'createdAt'> & { password?: string }>): Promise<{ error?: string }> {
  return await fetchAPI('usuarios', 'update', { id, update: data })
}

export async function deleteUsuario(id: string): Promise<{ error?: string }> {
  return await fetchAPI('usuarios', 'delete', { id })
}

export async function loginUsuario(username: string, password: string): Promise<Usuario | { error: string }> {
  return await fetchAPI('usuarios', 'login', { username, password })
}

export async function buscarUsuarioPorDni(dni: string): Promise<{ existe: boolean; username?: string }> {
  return await fetchAPI('usuarios', 'buscarPorDni', { dni })
}
