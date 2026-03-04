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
  semanal?: boolean
  grupoSemanalId?: string
  createdAt: string
}
