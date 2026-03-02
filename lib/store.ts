export type Categoria = '1era' | '2da' | '3era' | '4ta' | '5ta' | '6ta' | '7ma' | '8va'
export type Sexo = 'Masculino' | 'Femenino'
export type TipoCancha = 'Indoor' | 'Outdoor'
export type TipoSuelo = 'Alfombra' | 'Cemento'
export type TipoParedes = 'Blindex' | 'Cemento'

export interface Contacto {
  id: string
  nombre: string
  apellido: string
  telefono: string
  fechaNacimiento: string
  mail: string
  categoria: Categoria
  sexo: Sexo
  createdAt: string
}

export interface Cancha {
  id: string
  numero: number
  tipo: TipoCancha
  suelo: TipoSuelo
  paredes: TipoParedes
  createdAt: string
}

export interface Turno {
  id: string
  fecha: string
  horaInicio: string
  horaFin: string
  reservado: boolean
  contactoId?: string
  canchaId: string
  createdAt: string
}

const CONTACTOS_KEY = 'padel_contactos'
const TURNOS_KEY = 'padel_turnos'
const CANCHAS_KEY = 'padel_canchas'

// ─── Contactos ──────────────────────────────────────────────
export function getContactos(): Contacto[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(CONTACTOS_KEY)
  return data ? JSON.parse(data) : []
}

export function saveContacto(c: Omit<Contacto, 'id' | 'createdAt'>): Contacto {
  const contactos = getContactos()
  const nuevo: Contacto = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  contactos.push(nuevo)
  localStorage.setItem(CONTACTOS_KEY, JSON.stringify(contactos))
  return nuevo
}

export function updateContacto(id: string, data: Partial<Contacto>): void {
  const contactos = getContactos()
  const idx = contactos.findIndex(c => c.id === id)
  if (idx !== -1) {
    contactos[idx] = { ...contactos[idx], ...data }
    localStorage.setItem(CONTACTOS_KEY, JSON.stringify(contactos))
  }
}

export function deleteContacto(id: string): void {
  const contactos = getContactos().filter(c => c.id !== id)
  localStorage.setItem(CONTACTOS_KEY, JSON.stringify(contactos))
}

// ─── Canchas ────────────────────────────────────────────────
const CANCHAS_DEFAULT: Cancha[] = [
  { id: 'cancha-1', numero: 1, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date().toISOString() },
  { id: 'cancha-2', numero: 2, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date().toISOString() },
  { id: 'cancha-3', numero: 3, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date().toISOString() },
]

export function getCanchas(): Cancha[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(CANCHAS_KEY)
  if (!data) {
    localStorage.setItem(CANCHAS_KEY, JSON.stringify(CANCHAS_DEFAULT))
    return CANCHAS_DEFAULT
  }
  return JSON.parse(data)
}

export function saveCancha(c: Omit<Cancha, 'id' | 'createdAt'>): Cancha | { error: string } {
  const canchas = getCanchas()
  if (canchas.some(x => x.numero === c.numero)) {
    return { error: `Ya existe una cancha con el número ${c.numero}` }
  }
  const nueva: Cancha = { ...c, id: crypto.randomUUID(), createdAt: new Date().toISOString() }
  canchas.push(nueva)
  canchas.sort((a, b) => a.numero - b.numero)
  localStorage.setItem(CANCHAS_KEY, JSON.stringify(canchas))
  return nueva
}

export function updateCancha(id: string, data: Partial<Omit<Cancha, 'id' | 'createdAt'>>): { error?: string } {
  const canchas = getCanchas()
  const idx = canchas.findIndex(c => c.id === id)
  if (idx === -1) return { error: 'Cancha no encontrada' }
  if (data.numero !== undefined && canchas.some(x => x.numero === data.numero && x.id !== id)) {
    return { error: `Ya existe una cancha con el número ${data.numero}` }
  }
  canchas[idx] = { ...canchas[idx], ...data }
  canchas.sort((a, b) => a.numero - b.numero)
  localStorage.setItem(CANCHAS_KEY, JSON.stringify(canchas))
  return {}
}

export function deleteCancha(id: string): void {
  const canchas = getCanchas().filter(c => c.id !== id)
  localStorage.setItem(CANCHAS_KEY, JSON.stringify(canchas))
}

// ─── Turnos ─────────────────────────────────────────────────
export function getTurnos(): Turno[] {
  if (typeof window === 'undefined') return []
  const data = localStorage.getItem(TURNOS_KEY)
  return data ? JSON.parse(data) : []
}

export function getTurnosByCancha(canchaId: string): Turno[] {
  return getTurnos().filter(t => t.canchaId === canchaId)
}

export function saveTurnos(turnos: Turno[]): void {
  const existentes = getTurnos()
  const nuevos = [...existentes, ...turnos]
  localStorage.setItem(TURNOS_KEY, JSON.stringify(nuevos))
}

export function replaceTurnosCancha(canchaId: string, nuevosTurnos: Turno[], mantenerReservados: boolean): void {
  const todos = getTurnos()
  const reservados = mantenerReservados ? todos.filter(t => t.canchaId === canchaId && t.reservado) : []
  const otros = todos.filter(t => t.canchaId !== canchaId)
  localStorage.setItem(TURNOS_KEY, JSON.stringify([...otros, ...reservados, ...nuevosTurnos]))
}

export function updateTurno(id: string, data: Partial<Turno>): void {
  const turnos = getTurnos()
  const idx = turnos.findIndex(t => t.id === id)
  if (idx !== -1) {
    turnos[idx] = { ...turnos[idx], ...data }
    localStorage.setItem(TURNOS_KEY, JSON.stringify(turnos))
  }
}

export function deleteTurnos(ids: string[]): void {
  const turnos = getTurnos().filter(t => !ids.includes(t.id))
  localStorage.setItem(TURNOS_KEY, JSON.stringify(turnos))
}

export function generateTurnos(
  canchaId: string,
  fechaInicio: string,
  fechaFin: string,
  horaInicio: string,
  horaFin: string,
  duracionMinutos: number
): Turno[] {
  const turnos: Turno[] = []
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
        id: crypto.randomUUID(),
        fecha,
        horaInicio: inicio,
        horaFin: fin,
        reservado: false,
        canchaId,
        createdAt: new Date().toISOString(),
      })
      mm += duracionMinutos
      hh += Math.floor(mm / 60)
      mm = mm % 60
    }
  }
  return turnos
}
