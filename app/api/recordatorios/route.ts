import { NextResponse } from 'next/server'
import { connectDB } from '@/lib/mongodb'
import { Turno, Contacto, Cancha } from '@/lib/models'

export async function GET() {
  try {
    await connectDB()
    
    const manana = new Date()
    manana.setDate(manana.getDate() + 1)
    const mananaStr = manana.toISOString().split('T')[0]
    
    const turnosManana = await Turno.find({ 
      fecha: mananaStr, 
      reservado: true 
    }).lean()
    
    if (turnosManana.length === 0) {
      return NextResponse.json({ 
        success: true, 
        mensaje: 'No hay turnos reservados para mañana',
        turnos: [] 
      })
    }
    
    const resultados: Array<{
      turno: { fecha: string; horaInicio: string; horaFin: string }
      contacto: { nombre: string; telefono: string }
      mensaje: string
      whatsAppUrl: string
    }> = []
    
    for (const turno of turnosManana) {
      const contacto = turno.contactoId 
        ? await Contacto.findById(turno.contactoId).lean()
        : null
      
      const cancha = await Cancha.findById(turno.canchaId).lean()
      
      if (contacto) {
        const fechaFormateada = new Date(turno.fecha + 'T00:00:00').toLocaleDateString('es-AR', {
          weekday: 'long',
          day: 'numeric',
          month: 'long'
        })
        
        const mensaje = `Hola ${contacto.nombre}! Confirma turno para el día ${fechaFormateada}, hora ${turno.horaInicio} a ${turno.horaFin}? Saludos!`
        
        const num = contacto.telefono.replace(/[^0-9]/g, '')
        const whatsAppUrl = `https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`
        
        resultados.push({
          turno: {
            fecha: turno.fecha,
            horaInicio: turno.horaInicio,
            horaFin: turno.horaFin
          },
          contacto: {
            nombre: `${contacto.nombre} ${contacto.apellido}`,
            telefono: contacto.telefono
          },
          mensaje,
          whatsAppUrl
        })
      }
    }
    
    return NextResponse.json({
      success: true,
      fechaManana: mananaStr,
      cantidadTurnos: turnosManana.length,
      turnos: resultados
    })
    
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
