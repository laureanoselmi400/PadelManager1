import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Contacto, Cancha, Turno, Usuario } from '@/lib/models'

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const collection = searchParams.get('collection')
  const filter = searchParams.get('filter')

  await connectDB()

  if (collection === 'contactos') {
    const data = await Contacto.find().sort({ createdAt: -1 }).lean()
    return NextResponse.json(data.map(c => ({
      id: (c as any)._id.toString(),
      nombre: c.nombre,
      apellido: c.apellido,
      telefono: c.telefono,
      fechaNacimiento: c.fechaNacimiento,
      mail: c.mail,
      categoria: c.categoria,
      sexo: c.sexo,
      createdAt: c.createdAt.toISOString(),
    })))
  }

  if (collection === 'canchas') {
    const count = await Cancha.countDocuments()
    if (count === 0) {
      const defaults = [
        { numero: 1, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date() },
        { numero: 2, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date() },
        { numero: 3, tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex', createdAt: new Date() },
      ]
      await Cancha.insertMany(defaults)
    }
    const data = await Cancha.find().sort({ numero: 1 }).lean()
    return NextResponse.json(data.map(c => ({
      id: (c as any)._id.toString(),
      numero: c.numero,
      tipo: c.tipo,
      suelo: c.suelo,
      paredes: c.paredes,
      createdAt: c.createdAt.toISOString(),
    })))
  }

  if (collection === 'turnos') {
    const data = await Turno.find().lean()
    return NextResponse.json(data.map(t => ({
      id: (t as any)._id.toString(),
      fecha: t.fecha,
      horaInicio: t.horaInicio,
      horaFin: t.horaFin,
      reservado: t.reservado,
      contactoId: t.contactoId,
      canchaId: t.canchaId,
      createdAt: t.createdAt.toISOString(),
    })))
  }

  return NextResponse.json({ error: 'Invalid collection' }, { status: 400 })
}

export async function POST(request: Request) {
  let body
  try {
    body = await request.json()
  } catch {
    return NextResponse.json({ error: 'Invalid JSON' }, { status: 400 })
  }
  
  const { action, collection, data } = body
  
  try {
    await connectDB()
  } catch (err) {
    console.error('MongoDB connection error:', err)
    return NextResponse.json({ error: 'Database connection failed' }, { status: 500 })
  }

  if (collection === 'contactos') {
    if (action === 'create') {
      try {
        const nuevo = await Contacto.create({ ...data, createdAt: new Date() })
        return NextResponse.json({ id: nuevo._id.toString(), ...data })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'update') {
      try {
        await Contacto.findByIdAndUpdate(data.id, data.update)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'delete') {
      try {
        await Contacto.findByIdAndDelete(data.id)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
  }

  if (collection === 'canchas') {
    if (action === 'create') {
      try {
        const existente = await Cancha.findOne({ numero: data.numero })
        if (existente) {
          return NextResponse.json({ error: `Ya existe una cancha con el número ${data.numero}` }, { status: 400 })
        }
        const nuevo = await Cancha.create({ ...data, createdAt: new Date() })
        return NextResponse.json({ id: nuevo._id.toString(), ...data })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'update') {
      try {
        if (data.update.numero !== undefined) {
          const duplicada = await Cancha.findOne({ numero: data.update.numero, _id: { $ne: data.id } })
          if (duplicada) {
            return NextResponse.json({ error: `Ya existe una cancha con el número ${data.update.numero}` }, { status: 400 })
          }
        }
        await Cancha.findByIdAndUpdate(data.id, data.update)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'delete') {
      try {
        await Cancha.findByIdAndDelete(data.id)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
  }

  if (collection === 'turnos') {
    if (action === 'create') {
      try {
        await Turno.insertMany(data.turnos.map((t: any) => ({ ...t, createdAt: new Date() })))
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'replace') {
      try {
        await Turno.deleteMany({ canchaId: data.canchaId })
        const todos = await Turno.find().lean()
        const reservados = data.mantenerReservados 
          ? todos.filter(t => t.canchaId === data.canchaId && t.reservado)
          : []
        const nuevos = data.turnos.map((t: any) => ({ ...t, createdAt: new Date() }))
        if (reservados.length > 0) {
          await Turno.insertMany([...reservados, ...nuevos])
        } else {
          await Turno.insertMany(nuevos)
        }
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'update') {
      try {
        await Turno.findByIdAndUpdate(data.id, data.update)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'delete') {
      try {
        await Turno.deleteMany({ _id: { $in: data.ids } })
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
  }

  if (collection === 'usuarios') {
    if (action === 'getAll') {
      try {
        const usuarios = await Usuario.find().select('-password').sort({ createdAt: -1 }).lean()
        return NextResponse.json(usuarios.map(u => ({
          id: (u as any)._id.toString(),
          username: u.username,
          dni: u.dni,
          rol: u.rol,
          createdAt: u.createdAt ? u.createdAt.toISOString() : new Date().toISOString(),
        })))
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'reset') {
      try {
        await Usuario.deleteMany({})
        const nuevo = await Usuario.create({
          username: 'Administrador',
          dni: '00000000',
          password: 'Admin123',
          rol: 'admin',
          createdAt: new Date()
        })
        return NextResponse.json({ 
          success: true, 
          id: nuevo._id.toString(), 
          username: nuevo.username, 
          rol: nuevo.rol 
        })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'create') {
      try {
        const existente = await Usuario.findOne({ dni: data.dni })
        if (existente) {
          return NextResponse.json({ error: 'Ya existe un usuario con ese DNI', existe: true, username: existente.username }, { status: 400 })
        }
        const nuevo = await Usuario.create({ ...data, createdAt: new Date() })
        return NextResponse.json({ id: nuevo._id.toString(), username: nuevo.username, rol: nuevo.rol })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'update') {
      try {
        if (data.update.dni) {
          const existente = await Usuario.findOne({ dni: data.update.dni, _id: { $ne: data.id } })
          if (existente) {
            return NextResponse.json({ error: 'Ya existe un usuario con ese DNI' }, { status: 400 })
          }
        }
        await Usuario.findByIdAndUpdate(data.id, data.update)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'delete') {
      try {
        await Usuario.findByIdAndDelete(data.id)
        return NextResponse.json({ success: true })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'login') {
      try {
        const usuario = await Usuario.findOne({ username: data.username, password: data.password })
        if (!usuario) {
          return NextResponse.json({ error: 'Usuario o contraseña incorrectos' }, { status: 401 })
        }
        return NextResponse.json({
          id: usuario._id.toString(),
          username: usuario.username,
          dni: usuario.dni,
          rol: usuario.rol,
        })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
    if (action === 'buscarPorDni') {
      try {
        const usuario = await Usuario.findOne({ dni: data.dni }).select('username')
        if (usuario) {
          return NextResponse.json({ existe: true, username: usuario.username })
        }
        return NextResponse.json({ existe: false })
      } catch (err: any) {
        return NextResponse.json({ error: err.message }, { status: 500 })
      }
    }
  }

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
