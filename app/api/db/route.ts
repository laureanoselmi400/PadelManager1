import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Contacto, Cancha, Turno } from '@/lib/models'

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

  return NextResponse.json({ error: 'Invalid action' }, { status: 400 })
}
