import { Categoria, Sexo, TipoCancha, TipoSuelo, TipoParedes, Contacto, Cancha, Turno } from './types'

const API_URL = '/api/db'

async function fetchAPI(collection: string, filter?: Record<string, string>) {
  const params = new URLSearchParams({ collection })
  if (filter) {
    Object.entries(filter).forEach(([k, v]) => params.append(k, v))
  }
  const res = await fetch(`${API_URL}?${params}`)
  if (!res.ok) {
    const text = await res.text()
    throw new Error(`API error: ${res.status} - ${text}`)
  }
  const text = await res.text()
  if (!text) return []
  try {
    return JSON.parse(text)
  } catch {
    return []
  }
}

async function postAPI(action: string, collection: string, data: any) {
  const res = await fetch(API_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ action, collection, data }),
  })
  const text = await res.text()
  if (!text) throw new Error('Empty response from server')
  let json
  try {
    json = JSON.parse(text)
  } catch {
    throw new Error(`Invalid JSON: ${text.substring(0, 100)}`)
  }
  if (!res.ok) throw new Error(json.error || `API error: ${res.status}`)
  return json
}

function generateId() {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15)
}

// ─── Contactos ──────────────────────────────────────────────
export async function getContactos(): Promise<Contacto[]> {
  if (typeof window === 'undefined') return []
  try {
    return await fetchAPI('contactos')
  } catch {
    return []
  }
}

export async function saveContacto(c: Omit<Contacto, 'id' | 'createdAt'>): Promise<Contacto> {
  const result = await postAPI('create', 'contactos', c)
  return { ...c, id: result.id, createdAt: new Date().toISOString() }
}

export async function updateContacto(id: string, data: Partial<Contacto>): Promise<void> {
  await postAPI('update', 'contactos', { id, update: data })
}

export async function deleteContacto(id: string): Promise<void> {
  await postAPI('delete', 'contactos', { id })
}

// ─── Canchas ────────────────────────────────────────────────
export async function getCanchas(): Promise<Cancha[]> {
  if (typeof window === 'undefined') return []
  try {
    return await fetchAPI('canchas')
  } catch {
    return []
  }
}

export async function saveCancha(c: Omit<Cancha, 'id' | 'createdAt'>): Promise<Cancha | { error: string }> {
  try {
    const result = await postAPI('create', 'canchas', c)
    return { ...c, id: result.id, createdAt: new Date().toISOString() }
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function updateCancha(id: string, data: Partial<Omit<Cancha, 'id' | 'createdAt'>>): Promise<{ error?: string }> {
  try {
    await postAPI('update', 'canchas', { id, update: data })
    return {}
  } catch (e: any) {
    return { error: e.message }
  }
}

export async function deleteCancha(id: string): Promise<void> {
  await postAPI('delete', 'canchas', { id })
}

// ─── Turnos ─────────────────────────────────────────────────
export async function getTurnos(): Promise<Turno[]> {
  if (typeof window === 'undefined') return []
  try {
    return await fetchAPI('turnos')
  } catch {
    return []
  }
}

export async function getTurnosByCancha(canchaId: string): Promise<Turno[]> {
  const turnos = await getTurnos()
  return turnos.filter(t => t.canchaId === canchaId)
}

export async function saveTurnos(turnos: Omit<Turno, 'id' | 'createdAt'>[]): Promise<void> {
  await postAPI('create', 'turnos', { turnos })
}

export async function replaceTurnosCancha(canchaId: string, nuevosTurnos: Omit<Turno, 'id' | 'createdAt'>[], mantenerReservados: boolean): Promise<void> {
  await postAPI('replace', 'turnos', { turnos: nuevosTurnos, canchaId, mantenerReservados })
}

export async function updateTurno(id: string, data: Partial<Turno>): Promise<void> {
  await postAPI('update', 'turnos', { id, update: data })
}

export async function deleteTurnos(ids: string[]): Promise<void> {
  await postAPI('delete', 'turnos', { ids })
}

export async function generateTurnos(
  canchaId: string,
  fechaInicio: string,
  fechaFin: string,
  horaInicio: string,
  horaFin: string,
  duracionMinutos: number
): Promise<Omit<Turno, 'id' | 'createdAt'>[]> {
  const turnos: Omit<Turno, 'id' | 'createdAt'>[] = []
  const start = new Date(fechaInicio + 'T00:00:00')
  const end = new Date(fechaFin + 'T00:00:00')

  for (let d = new Date(start); d <= end; d.setDate(d.getDate() + 1)) {
    const fecha = d.toISOString().split('T')[0]
    let [hh, mm] = horaInicio.split(':').map(Number)
    const [endHH, endMM] = horaFin.split(':').map(Number)
    const endTotal = endHH * 60 + endMM

    while (hh * 60 + mm + duracionMinutos <= endTotal) {
      const inicio = `${String(hh).padStart(2, '0')}:${String(mm).padStart(2, '0')}`
      const totalFin = hh * 60 + mm + duracionMinutos
      const fin = `${String(Math.floor(totalFin / 60)).padStart(2, '0')}:${String(totalFin % 60).padStart(2, '0')}`
      turnos.push({
        fecha,
        horaInicio: inicio,
        horaFin: fin,
        reservado: false,
        canchaId,
      })
      mm += duracionMinutos
      hh += Math.floor(mm / 60)
      mm = mm % 60
    }
  }
  return turnos
}
