import mongoose, { Schema, Document } from 'mongoose'

export type Categoria = '1era' | '2da' | '3era' | '4ta' | '5ta' | '6ta' | '7ma' | '8va'
export type Sexo = 'Masculino' | 'Femenino'
export type TipoCancha = 'Indoor' | 'Outdoor'
export type TipoSuelo = 'Alfombra' | 'Cemento'
export type TipoParedes = 'Blindex' | 'Cemento'

export interface IContacto extends Document {
  nombre: string
  apellido: string
  telefono: string
  fechaNacimiento: string
  mail: string
  categoria: Categoria
  sexo: Sexo
  createdAt: Date
}

export interface ICancha extends Document {
  numero: number
  tipo: TipoCancha
  suelo: TipoSuelo
  paredes: TipoParedes
  createdAt: Date
}

export interface ITurno extends Document {
  fecha: string
  horaInicio: string
  horaFin: string
  reservado: boolean
  contactoId?: string
  canchaId: string
  semanal?: boolean
  grupoSemanalId?: string
  createdAt: Date
}

export interface IUsuario extends Document {
  username: string
  dni: string
  password: string
  telefono: string
  email?: string
  rol: 'admin' | 'operador' | 'invitado' | 'UsuFinal'
  createdAt: Date
}

const ContactoSchema = new Schema<IContacto>({
  nombre: { type: String, required: true },
  apellido: { type: String, required: true },
  telefono: { type: String, required: true },
  fechaNacimiento: { type: String, required: false },
  mail: { type: String, required: false },
  categoria: { type: String, required: true },
  sexo: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const UsuarioSchema = new Schema<IUsuario>({
  username: { type: String, required: true },
  dni: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  telefono: { type: String, required: true },
  email: { type: String, required: false, default: null },
  rol: { type: String, required: true, enum: ['admin', 'operador', 'invitado', 'UsuFinal'] },
  createdAt: { type: Date, default: Date.now },
})

UsuarioSchema.index({ username: 1 }, { unique: true })
UsuarioSchema.index({ email: 1 }, { unique: true, sparse: true })

const CanchaSchema = new Schema<ICancha>({
  numero: { type: Number, required: true, unique: true },
  tipo: { type: String, required: true },
  suelo: { type: String, required: true },
  paredes: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

const TurnoSchema = new Schema<ITurno>({
  fecha: { type: String, required: true },
  horaInicio: { type: String, required: true },
  horaFin: { type: String, required: true },
  reservado: { type: Boolean, default: false },
  contactoId: { type: String },
  canchaId: { type: String, required: true },
  semanal: { type: Boolean, default: false },
  grupoSemanalId: { type: String },
  createdAt: { type: Date, default: Date.now },
})

export const Contacto = mongoose.models.Contacto || mongoose.model<IContacto>('Contacto', ContactoSchema)
export const Cancha = mongoose.models.Cancha || mongoose.model<ICancha>('Cancha', CanchaSchema)
export const Turno = mongoose.models.Turno || mongoose.model<ITurno>('Turno', TurnoSchema)
export const Usuario = mongoose.models.Usuario || mongoose.model<IUsuario>('Usuario', UsuarioSchema)
