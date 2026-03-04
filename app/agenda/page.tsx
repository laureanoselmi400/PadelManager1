'use client'
import { useState, useEffect, useMemo } from 'react'
import { useAuth } from '@/components/AuthProvider'
import {
  getTurnos, saveTurnos, replaceTurnosCancha, updateTurno, deleteTurnos, generateTurnos,
  getContactos, saveContacto, getCanchas,
} from '@/lib/store'
import { Turno, Contacto, Cancha, Categoria, Sexo } from '@/lib/types'

const CATEGORIAS: Categoria[] = ['1era', '2da', '3era', '4ta', '5ta', '6ta', '7ma', '8va']
type View = 'lista' | 'generar'

export default function AgendaPage() {
  const { usuario } = useAuth()
  const isAdmin = usuario?.rol === 'admin'
  const isUsuFinal = usuario?.rol === 'UsuFinal'

  const [view, setView] = useState<View>('lista')
  const [turnos, setTurnos] = useState<Turno[]>([])
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [selectedCanchaId, setSelectedCanchaId] = useState<string>('')
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0])

  // Reserva modal
  const [turnoModal, setTurnoModal] = useState<Turno | null>(null)
  const [showReservaModal, setShowReservaModal] = useState(false)
  const [reservaMode, setReservaMode] = useState<'existente' | 'nuevo'>('existente')
  const [searchContacto, setSearchContacto] = useState('')
  const [selectedContactoId, setSelectedContactoId] = useState('')
  const [nuevoContacto, setNuevoContacto] = useState({
    nombre: '', apellido: '', telefono: '', mail: '',
    fechaNacimiento: '', categoria: '1era' as Categoria, sexo: 'Masculino' as Sexo
  })
  const [esSemanal, setEsSemanal] = useState(false)

  // Generar form
  const [genForm, setGenForm] = useState({
    canchaId: '', fechaInicio: '', fechaFin: '',
    horaInicio: '08:00', horaFin: '22:00', duracion: 60
  })
  // Dialog reemplazo
  const [showReemplazoModal, setShowReemplazoModal] = useState(false)
  const [pendingGen, setPendingGen] = useState<{ nuevos: Omit<Turno, 'id' | 'createdAt'>[]; reservadosCount: number } | null>(null)

  const reload = async () => {
    setTurnos(await getTurnos())
    setContactos(await getContactos())
    const cs = await getCanchas()
    setCanchas(cs)
    if (!selectedCanchaId && cs.length > 0) setSelectedCanchaId(cs[0].id)
  }

  useEffect(() => { reload() }, [])
  // Set default cancha once loaded
  useEffect(() => {
    if (!selectedCanchaId && canchas.length > 0) setSelectedCanchaId(canchas[0].id)
  }, [canchas])
  useEffect(() => {
    if (!genForm.canchaId && canchas.length > 0) setGenForm(f => ({ ...f, canchaId: canchas[0].id }))
  }, [canchas])

  // ─── Computed ───────────────────────────────────────────────
  const turnosCancha = useMemo(() =>
    turnos.filter(t => t.canchaId === selectedCanchaId),
    [turnos, selectedCanchaId]
  )

  const fechasConTurnos = useMemo(() => new Set(turnosCancha.map(t => t.fecha)), [turnosCancha])

  const turnosDia = useMemo(() =>
    turnosCancha
      .filter(t => t.fecha === selectedDate)
      .sort((a, b) => a.horaInicio.localeCompare(b.horaInicio)),
    [turnosCancha, selectedDate]
  )

  const canchaSeleccionada = canchas.find(c => c.id === selectedCanchaId)

  const getContacto = (id?: string) => contactos.find(c => c.id === id)

  const filteredContactos = contactos.filter(c => {
    const q = searchContacto.toLowerCase()
    return !q || `${c.nombre} ${c.apellido} ${c.telefono}`.toLowerCase().includes(q)
  })

  // ─── WhatsApp ────────────────────────────────────────────────
  const enviarWhatsApp = (telefono: string, mensaje: string) => {
    const num = telefono.replace(/[^0-9]/g, '')
    window.open(`https://wa.me/${num}?text=${encodeURIComponent(mensaje)}`, '_blank')
  }

  const formatFechaCorta = (f: string) => {
    if (!f) return ''
    return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
  }

  const formatFecha = (f: string) => {
    if (!f) return ''
    return new Date(f + 'T00:00:00').toLocaleDateString('es-AR', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  }

  // Fecha de hoy en formato YYYY-MM-DD (sin hora para comparar solo fecha)
  const hoy = new Date().toISOString().split('T')[0]
  const esFechaPasada = (fecha: string) => fecha < hoy

  // Para UsuFinal, solo mostrar días de hoy en adelante
  useEffect(() => {
    if (isUsuFinal && esFechaPasada(selectedDate)) {
      setSelectedDate(hoy)
    }
  }, [selectedDate, isUsuFinal])

  // ─── Reserva ────────────────────────────────────────────────
  const openReserva = (turno: Turno) => {
    if (esFechaPasada(turno.fecha)) {
      alert(`No se pueden modificar turnos de fechas pasadas (${formatFechaCorta(turno.fecha)}).`)
      return
    }
    if (turno.reservado) {
      alert('Este turno ya está reservado.')
      return
    }
    setTurnoModal(turno)
    setEsSemanal(false)
    setReservaMode('existente')
    setSearchContacto('')
    setSelectedContactoId('')
    setNuevoContacto({ nombre: '', apellido: '', telefono: '', mail: '', fechaNacimiento: '', categoria: '1era', sexo: 'Masculino' })
    setShowReservaModal(true)
  }

  const generarIdSemanal = () => {
    return 'sw_' + Math.random().toString(36).substring(2, 15) + Date.now().toString(36)
  }

  const handleReservar = async () => {
    if (!turnoModal) return
    let telefono = ''
    let contactoId = ''
    
    if (reservaMode === 'existente') {
      if (!selectedContactoId) return alert('Selecciona un contacto')
      contactoId = selectedContactoId
      telefono = contactos.find(x => x.id === selectedContactoId)?.telefono ?? ''
    } else {
      if (!nuevoContacto.nombre || !nuevoContacto.apellido || !nuevoContacto.telefono)
        return alert('Completa nombre, apellido y telefono')
      const nuevo = await saveContacto(nuevoContacto)
      contactoId = nuevo.id
      telefono = nuevoContacto.telefono
    }

    const grupoSemanalId = esSemanal ? generarIdSemanal() : undefined
    const semanas = esSemanal ? 12 : 1
    const fechaBase = new Date(turnoModal.fecha)

    for (let i = 0; i < semanas; i++) {
      const fechaStr = fechaBase.toISOString().split('T')[0]
      const turnoExistente = turnos.find(t => t.fecha === fechaStr && t.horaInicio === turnoModal.horaInicio && t.canchaId === turnoModal.canchaId)
      
      if (turnoExistente) {
        await updateTurno(turnoExistente.id, { 
          reservado: true, 
          contactoId, 
          semanal: esSemanal,
          grupoSemanalId
        })
      }
      
      fechaBase.setDate(fechaBase.getDate() + 7)
    }

    reload()
    setShowReservaModal(false)
    if (telefono) {
      const cancha = canchas.find(c => c.id === turnoModal.canchaId)
      const msg = esSemanal
        ? `Se han reservado los turnos semanales para el ${formatFechaCorta(turnoModal.fecha)} de ${turnoModal.horaInicio} a ${turnoModal.horaFin} hs${cancha ? ` (Cancha ${cancha.numero})` : ''}.`
        : `Se ha reservado el turno para el ${formatFechaCorta(turnoModal.fecha)} de ${turnoModal.horaInicio} a ${turnoModal.horaFin} hs${cancha ? ` (Cancha ${cancha.numero})` : ''}.`
      enviarWhatsApp(telefono, msg)
    }
  }

  const handleLiberarTurno = async (turno: Turno) => {
    const esParteSemanal = turno.semanal || turno.grupoSemanalId
    
    if (esParteSemanal && turno.grupoSemanalId) {
      const respuesta = confirm('Este turno forma parte de una serie semanal. ¿Querés liberar solo este turno o todos los turnos de la serie?')
      if (!respuesta) return
      
      const opcion = confirm('Aceptar = Liberar solo este turno\nCancelar = Liberar todos los turnos de la serie')
      
      if (!opcion) {
        const turnosSemanal = turnos.filter(t => t.grupoSemanalId === turno.grupoSemanalId)
        for (const t of turnosSemanal) {
          await updateTurno(t.id, { reservado: false, contactoId: undefined, semanal: false, grupoSemanalId: undefined })
        }
        reload()
        setShowReservaModal(false)
        return
      }
    }

    if (confirm('Liberar este turno?')) {
      const contacto = getContacto(turno.contactoId)
      const telefono = contacto?.telefono ?? ''
      await updateTurno(turno.id, { reservado: false, contactoId: undefined, semanal: false, grupoSemanalId: undefined })
      reload()
      setShowReservaModal(false)
      if (telefono) {
        const cancha = canchas.find(c => c.id === turno.canchaId)
        const msg = `Se ha liberado el turno para el ${formatFechaCorta(turno.fecha)} de ${turno.horaInicio} a ${turno.horaFin} hs${cancha ? ` (Cancha ${cancha.numero})` : ''}.`
        enviarWhatsApp(telefono, msg)
      }
    }
  }

  // ─── Generar agenda ─────────────────────────────────────────
  const handleGenerarAgenda = async (e: React.FormEvent) => {
    e.preventDefault()
    const { canchaId, fechaInicio, fechaFin, horaInicio, horaFin, duracion } = genForm
    if (!canchaId) return alert('Selecciona una cancha')
    if (!fechaInicio || !fechaFin) return alert('Completa las fechas')
    if (fechaInicio < hoy) return alert('La fecha de inicio no puede ser anterior a hoy.')
    if (fechaInicio > fechaFin) return alert('La fecha inicio debe ser anterior a la de fin')

    const nuevos = await generateTurnos(canchaId, fechaInicio, fechaFin, horaInicio, horaFin, duracion)
    if (nuevos.length === 0) return alert('No se pudieron generar turnos con esos parametros')

    // Verificar si ya existe agenda para esta cancha en ese rango
    const turnosExistentes = turnos.filter(t => t.canchaId === canchaId && t.fecha >= fechaInicio && t.fecha <= fechaFin)
    if (turnosExistentes.length > 0) {
      const reservados = turnosExistentes.filter(t => t.reservado).length
      setPendingGen({ nuevos, reservadosCount: reservados })
      setShowReemplazoModal(true)
      return
    }

    await saveTurnos(nuevos)
    reload()
    setView('lista')
    setSelectedCanchaId(canchaId)
    setSelectedDate(fechaInicio)
    alert(`Se generaron ${nuevos.length} turnos correctamente`)
  }

  const confirmarReemplazo = async (mantenerReservados: boolean) => {
    if (!pendingGen || !genForm.canchaId) return
    await replaceTurnosCancha(genForm.canchaId, pendingGen.nuevos, mantenerReservados)
    setShowReemplazoModal(false)
    setPendingGen(null)
    reload()
    setView('lista')
    setSelectedCanchaId(genForm.canchaId)
    setSelectedDate(genForm.fechaInicio)
    alert(`Agenda reemplazada con ${pendingGen.nuevos.length} turnos nuevos${mantenerReservados ? ', conservando reservas existentes' : ''}.`)
  }

  const handleEliminarDia = async () => {
    const ids = turnosDia.filter(t => !t.reservado).map(t => t.id)
    if (ids.length === 0) return alert('No hay turnos libres para eliminar')
    if (confirm(`Eliminar ${ids.length} turnos libres del ${formatFecha(selectedDate)}?`)) {
      await deleteTurnos(ids)
      reload()
    }
  }

  // ─── Semana ──────────────────────────────────────────────────
  const weekDays = useMemo(() => {
    const days = []
    const ref = new Date(selectedDate + 'T00:00:00')
    const dayOfWeek = ref.getDay()
    const mondayOffset = dayOfWeek === 0 ? -6 : 1 - dayOfWeek
    for (let i = 0; i < 7; i++) {
      const d = new Date(ref)
      d.setDate(ref.getDate() + mondayOffset + i)
      days.push(d.toISOString().split('T')[0])
    }
    return days
  }, [selectedDate])

  const statsHoy = {
    total: turnosDia.length,
    reservados: turnosDia.filter(t => t.reservado).length,
    libres: turnosDia.filter(t => !t.reservado).length,
  }

  // ─── Render ──────────────────────────────────────────────────
  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.5rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>AGENDA</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>Gestion de turnos y reservas</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem' }}>
          <button className={view === 'lista' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('lista')}>Turnos</button>
          {isAdmin && (
            <button className={view === 'generar' ? 'btn-primary' : 'btn-secondary'} onClick={() => setView('generar')}>
              + Generar agenda
            </button>
          )}
        </div>
      </div>

      {/* Selector de cancha (siempre visible en lista) */}
      {view === 'lista' && canchas.length > 0 && (
        <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
          {canchas.map(c => (
            <button
              key={c.id}
              onClick={() => setSelectedCanchaId(c.id)}
              style={{
                padding: '0.5rem 1rem',
                borderRadius: '10px',
                border: '1px solid',
                cursor: 'pointer',
                fontFamily: 'var(--font-body)',
                fontWeight: 600,
                fontSize: '0.85rem',
                transition: 'all 0.15s',
                background: selectedCanchaId === c.id ? 'var(--green)' : 'var(--surface)',
                color: selectedCanchaId === c.id ? '#0a0f0a' : 'var(--text-dim)',
                borderColor: selectedCanchaId === c.id ? 'var(--green)' : 'var(--border)',
              }}
            >
              🎾 Cancha {c.numero}
              <span style={{ marginLeft: '0.4rem', fontSize: '0.7rem', opacity: 0.7 }}>
                {c.tipo} · {c.suelo}
              </span>
            </button>
          ))}
        </div>
      )}

      {view === 'lista' && canchas.length === 0 && (
        <div className="card" style={{ padding: '2.5rem', textAlign: 'center', marginBottom: '1.5rem' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎾</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>No hay canchas registradas. Ve a <strong style={{ color: 'var(--green)' }}>Canchas</strong> para agregar una.</p>
        </div>
      )}

      {/* ── GENERAR AGENDA ── */}
      {view === 'generar' && isAdmin && (
        <div className="card" style={{ padding: '2rem', maxWidth: '560px' }}>
          <h2 className="font-display" style={{ fontSize: '1.6rem', margin: '0 0 1.5rem', color: 'var(--text)' }}>GENERAR AGENDA</h2>
          {canchas.length === 0 ? (
            <p style={{ color: 'var(--text-dim)' }}>Primero debes registrar canchas en el menu de Canchas.</p>
          ) : (
            <form onSubmit={handleGenerarAgenda} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {/* Selector de cancha */}
              <div>
                <label className="form-label">Cancha *</label>
                <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
                  {canchas.map(c => {
                    const tieneTurnos = turnos.some(t => t.canchaId === c.id)
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => setGenForm(f => ({ ...f, canchaId: c.id }))}
                        style={{
                          padding: '0.5rem 0.875rem',
                          borderRadius: '8px',
                          border: '1px solid',
                          cursor: 'pointer',
                          fontFamily: 'var(--font-body)',
                          fontWeight: 600,
                          fontSize: '0.8rem',
                          transition: 'all 0.15s',
                          position: 'relative',
                          background: genForm.canchaId === c.id ? 'rgba(34,197,94,0.15)' : 'var(--surface2)',
                          color: genForm.canchaId === c.id ? 'var(--green)' : 'var(--text-dim)',
                          borderColor: genForm.canchaId === c.id ? 'rgba(34,197,94,0.4)' : tieneTurnos ? 'rgba(249,115,22,0.3)' : 'var(--border)',
                        }}
                      >
                        Cancha {c.numero}
                        {tieneTurnos && (
                          <span style={{ marginLeft: '0.35rem', fontSize: '0.65rem', color: 'var(--orange)' }}>● con agenda</span>
                        )}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Fecha inicio</label>
                  <input className="input" type="date" required min={hoy} value={genForm.fechaInicio} onChange={e => setGenForm(f => ({ ...f, fechaInicio: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Fecha fin</label>
                  <input className="input" type="date" required min={hoy} value={genForm.fechaFin} onChange={e => setGenForm(f => ({ ...f, fechaFin: e.target.value }))} />
                </div>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Hora inicio</label>
                  <input className="input" type="time" required value={genForm.horaInicio} onChange={e => setGenForm(f => ({ ...f, horaInicio: e.target.value }))} />
                </div>
                <div>
                  <label className="form-label">Hora fin</label>
                  <input className="input" type="time" required value={genForm.horaFin} onChange={e => setGenForm(f => ({ ...f, horaFin: e.target.value }))} />
                </div>
              </div>
              <div>
                <label className="form-label">Duracion de cada turno (minutos)</label>
                <select className="input" value={genForm.duracion} onChange={e => setGenForm(f => ({ ...f, duracion: Number(e.target.value) }))}>
                  {[30, 45, 60, 90, 120].map(d => <option key={d} value={d}>{d} min</option>)}
                </select>
              </div>
              <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '8px', padding: '0.75rem', fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                💡 Se generaran turnos de {genForm.duracion} min entre las {genForm.horaInicio} y {genForm.horaFin} para cada dia del rango.
                {genForm.canchaId && turnos.some(t => t.canchaId === genForm.canchaId) && (
                  <span style={{ color: 'var(--orange)', display: 'block', marginTop: '0.35rem' }}>
                    ⚠️ Esta cancha ya tiene una agenda. Se te preguntara si deseas reemplazarla.
                  </span>
                )}
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>Generar turnos</button>
                <button type="button" className="btn-secondary" onClick={() => setView('lista')}>Cancelar</button>
              </div>
            </form>
          )}
        </div>
      )}

      {/* ── LISTA TURNOS ── */}
      {view === 'lista' && selectedCanchaId && (
        <>
          {/* Info cancha seleccionada */}
          {canchaSeleccionada && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem' }}>
              <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
                Cancha {canchaSeleccionada.numero} · {canchaSeleccionada.tipo} · Suelo {canchaSeleccionada.suelo} · Paredes {canchaSeleccionada.paredes}
              </span>
            </div>
          )}

          {/* Week navigator */}
          <div className="card" style={{ padding: '1rem 1.25rem', marginBottom: '1.5rem' }}>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', overflowX: 'auto' }}>
              <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }} onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() - 7); setSelectedDate(d.toISOString().split('T')[0])
              }}>‹</button>
              {weekDays.map(d => {
                const dd = new Date(d + 'T00:00:00')
                const isSelected = d === selectedDate
                const hasTurnos = fechasConTurnos.has(d)
                return (
                  <button key={d} onClick={() => setSelectedDate(d)} style={{
                    flex: 1, minWidth: '56px', padding: '0.6rem 0.4rem',
                    borderRadius: '8px', border: '1px solid', cursor: 'pointer', textAlign: 'center',
                    transition: 'all 0.15s', fontFamily: 'var(--font-body)',
                    background: isSelected ? 'var(--green)' : 'transparent',
                    color: isSelected ? '#0a0f0a' : 'var(--text-dim)',
                    borderColor: isSelected ? 'var(--green)' : hasTurnos ? 'rgba(34,197,94,0.25)' : 'var(--border)',
                  }}>
                    <div style={{ fontSize: '0.65rem', textTransform: 'uppercase', letterSpacing: '0.05em', fontWeight: 600 }}>
                      {dd.toLocaleDateString('es-AR', { weekday: 'short' })}
                    </div>
                    <div style={{ fontSize: '1.1rem', fontWeight: 700, lineHeight: 1.2 }}>{dd.getDate()}</div>
                    {hasTurnos && !isSelected && <div style={{ width: '4px', height: '4px', borderRadius: '50%', background: 'var(--green)', margin: '2px auto 0' }} />}
                  </button>
                )
              })}
              <button className="btn-secondary" style={{ padding: '0.4rem 0.6rem', flexShrink: 0 }} onClick={() => {
                const d = new Date(selectedDate + 'T00:00:00'); d.setDate(d.getDate() + 7); setSelectedDate(d.toISOString().split('T')[0])
              }}>›</button>
            </div>
          </div>

          {/* Day header + stats */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
            <div>
              <h2 style={{ fontSize: '1rem', fontWeight: 600, margin: 0, textTransform: 'capitalize' }}>
                {formatFecha(selectedDate)}
              </h2>
              {statsHoy.total > 0 && (
                <div style={{ display: 'flex', gap: '1rem', marginTop: '0.25rem' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{statsHoy.total} turnos</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--orange)' }}>● {statsHoy.reservados} reservados</span>
                  <span style={{ fontSize: '0.75rem', color: 'var(--green)' }}>● {statsHoy.libres} libres</span>
                </div>
              )}
            </div>
            {turnosDia.some(t => !t.reservado) && isAdmin && (
              <button className="btn-danger" onClick={handleEliminarDia}>Eliminar turnos libres</button>
            )}
          </div>

          {turnosDia.length === 0 ? (
            <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>📅</div>
              <p style={{ color: 'var(--text-dim)', margin: 0 }}>No hay turnos disponibles para este dia.</p>
              {isAdmin && <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', margin: '0.25rem 0 0' }}>
                Usa <strong style={{ color: 'var(--green)' }}>+ Generar agenda</strong> para crear turnos.
              </p>}
            </div>
          ) : (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))', gap: '0.75rem' }}>
              {turnosDia
                .filter(t => !isUsuFinal || !t.reservado)
                .map(turno => {
                const contacto = getContacto(turno.contactoId)
                const pasado = esFechaPasada(turno.fecha)
                return (
                  <div
                    key={turno.id}
                    className={`turno-slot ${turno.reservado ? 'reservado' : 'libre'}`}
                    onClick={() => !isUsuFinal && openReserva(turno)}
                    style={{
                      cursor: (pasado || isUsuFinal && turno.reservado) ? 'default' : 'pointer',
                      opacity: pasado ? 0.45 : 1,
                      filter: pasado ? 'grayscale(60%)' : 'none',
                    }}
                  >
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                      <span style={{ fontWeight: 700, fontSize: '0.9rem', fontVariantNumeric: 'tabular-nums' }}>
                        {turno.horaInicio}–{turno.horaFin}
                      </span>
                      {!isUsuFinal && (
                        <span className={`badge ${turno.reservado ? 'badge-orange' : 'badge-green'}`}>
                          {turno.reservado ? 'Reservado' : 'Libre'}
                        </span>
                      )}
                      {isUsuFinal && (
                        <span className="badge badge-green">Disponible</span>
                      )}
                    </div>
                    {contacto && !isUsuFinal && (
                      <>
                        <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>
                          {contacto.nombre} {contacto.apellido}
                        </div>
                        <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '0.1rem' }}>
                          📱 {contacto.telefono}
                        </div>
                      </>
                    )}
                    {!turno.reservado && (
                      <div style={{ fontSize: '0.75rem', color: 'var(--green)', marginTop: '0.25rem' }}>
                        Tap para reservar →
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </>
      )}

      {/* ── MODAL RESERVA ── */}
      {showReservaModal && turnoModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowReservaModal(false)}>
          <div className="modal" style={{ maxWidth: '520px' }}>
            {/* Info turno */}
            <div style={{ background: 'rgba(34,197,94,0.07)', border: '1px solid rgba(34,197,94,0.2)', borderRadius: '10px', padding: '0.75rem 1rem', marginBottom: '1.25rem' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div>
                  <div className="font-display" style={{ fontSize: '1.4rem', color: 'var(--green)' }}>
                    {turnoModal.horaInicio} – {turnoModal.horaFin}
                  </div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'capitalize' }}>
                    {formatFecha(turnoModal.fecha)}
                  </div>
                </div>
                {(() => {
                  const c = canchas.find(x => x.id === turnoModal.canchaId)
                  return c ? (
                    <span className="badge badge-green">Cancha {c.numero}</span>
                  ) : null
                })()}
              </div>
            </div>

            {turnoModal.reservado ? (
              <>
                <h2 className="font-display" style={{ fontSize: '1.4rem', margin: '0 0 1rem', color: 'var(--text)' }}>TURNO RESERVADO</h2>
                {(() => {
                  const c = getContacto(turnoModal.contactoId)
                  return c ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem', marginBottom: '1.25rem' }}>
                      {[
                        { label: 'Jugador', value: `${c.nombre} ${c.apellido}` },
                        { label: 'Telefono', value: c.telefono, link: `tel:${c.telefono}` },
                        { label: 'Email', value: c.mail || '-' },
                        { label: 'Categoria', value: c.categoria },
                        { label: 'Sexo', value: c.sexo ?? 'N/A' },
                      ].map(({ label, value, link }) => (
                        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', padding: '0.6rem 0', borderBottom: '1px solid var(--border)' }}>
                          <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>{label}</span>
                          {link
                            ? <a href={link} style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--green)', textDecoration: 'none' }}>📱 {value}</a>
                            : <span style={{ fontSize: '0.875rem', fontWeight: 600 }}>{value}</span>
                          }
                        </div>
                      ))}
                    </div>
                  ) : <p style={{ color: 'var(--text-dim)' }}>Contacto no encontrado</p>
                })()}
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <button className="btn-danger" onClick={() => handleLiberarTurno(turnoModal)} style={{ flex: 1 }}>
                    Liberar turno
                  </button>
                  <button className="btn-secondary" onClick={() => setShowReservaModal(false)}>Cerrar</button>
                </div>
              </>
            ) : (
              <>
                <h2 className="font-display" style={{ fontSize: '1.4rem', margin: '0 0 1rem', color: 'var(--text)' }}>RESERVAR TURNO</h2>
                
                {isUsuFinal ? (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem', margin: 0 }}>
                      Ingresá tus datos para reservar el turno:
                    </p>
                    <div>
                      <label className="form-label">Nombre *</label>
                      <input 
                        className="input" 
                        value={nuevoContacto.nombre} 
                        onChange={e => setNuevoContacto(f => ({ ...f, nombre: e.target.value }))} 
                        placeholder="Tu nombre" 
                      />
                    </div>
                    <div>
                      <label className="form-label">Apellido *</label>
                      <input 
                        className="input" 
                        value={nuevoContacto.apellido} 
                        onChange={e => setNuevoContacto(f => ({ ...f, apellido: e.target.value }))} 
                        placeholder="Tu apellido" 
                      />
                    </div>
                    <div>
                      <label className="form-label">Teléfono *</label>
                      <input 
                        className="input" 
                        value={nuevoContacto.telefono} 
                        onChange={e => setNuevoContacto(f => ({ ...f, telefono: e.target.value }))} 
                        placeholder="+54 9 11 1234-5678" 
                      />
                    </div>
                    <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.5rem' }}>
                      <button 
                        className="btn-primary" 
                        style={{ flex: 1 }} 
                        onClick={async () => {
                          if (!nuevoContacto.nombre || !nuevoContacto.apellido || !nuevoContacto.telefono) {
                            alert('Completá nombre, apellido y teléfono')
                            return
                          }
                          const nuevo = await saveContacto(nuevoContacto)
                          await updateTurno(turnoModal.id, { reservado: true, contactoId: nuevo.id })
                          reload()
                          setShowReservaModal(false)
                          alert('Turno reservado correctamente!')
                        }}
                      >
                        Confirmar reserva
                      </button>
                      <button className="btn-secondary" onClick={() => setShowReservaModal(false)}>Cancelar</button>
                    </div>
                  </div>
                ) : (
                  <>
                {/* Tabs */}
                <div style={{ display: 'flex', marginBottom: '1.25rem', borderRadius: '8px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                  {(['existente', 'nuevo'] as const).map(mode => (
                    <button key={mode} onClick={() => setReservaMode(mode)} style={{
                      flex: 1, padding: '0.6rem', border: 'none', cursor: 'pointer',
                      fontFamily: 'var(--font-body)', fontWeight: 600, fontSize: '0.8rem', transition: 'all 0.15s',
                      background: reservaMode === mode ? 'var(--green)' : 'var(--surface2)',
                      color: reservaMode === mode ? '#0a0f0a' : 'var(--text-dim)',
                    }}>
                      {mode === 'existente' ? '👤 Contacto existente' : '➕ Nuevo contacto'}
                    </button>
                  ))}
                </div>

                {reservaMode === 'existente' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <input className="input" placeholder="Buscar por nombre o telefono..." value={searchContacto} onChange={e => setSearchContacto(e.target.value)} />
                    <div style={{ maxHeight: '220px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
                      {filteredContactos.length === 0
                        ? <p style={{ color: 'var(--text-dim)', fontSize: '0.8rem', textAlign: 'center', margin: '1rem 0' }}>No se encontraron contactos</p>
                        : filteredContactos.map(c => (
                          <div key={c.id} onClick={() => setSelectedContactoId(c.id)} style={{
                            padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid', cursor: 'pointer', transition: 'all 0.15s',
                            borderColor: selectedContactoId === c.id ? 'var(--green)' : 'var(--border)',
                            background: selectedContactoId === c.id ? 'rgba(34,197,94,0.08)' : 'var(--surface2)',
                          }}>
                            <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.nombre} {c.apellido}</div>
                            <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>📱 {c.telefono} · {c.categoria} · {c.sexo ?? ''}</div>
                          </div>
                        ))
                      }
                    </div>
                  </div>
                )}

                {reservaMode === 'nuevo' && (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label">Nombre *</label>
                        <input className="input" value={nuevoContacto.nombre} onChange={e => setNuevoContacto(f => ({ ...f, nombre: e.target.value }))} placeholder="Juan" />
                      </div>
                      <div>
                        <label className="form-label">Apellido *</label>
                        <input className="input" value={nuevoContacto.apellido} onChange={e => setNuevoContacto(f => ({ ...f, apellido: e.target.value }))} placeholder="Perez" />
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Telefono *</label>
                      <input className="input" value={nuevoContacto.telefono} onChange={e => setNuevoContacto(f => ({ ...f, telefono: e.target.value }))} placeholder="+54 9 11 1234-5678" />
                    </div>
                    <div>
                      <label className="form-label">Email</label>
                      <input className="input" type="email" value={nuevoContacto.mail} onChange={e => setNuevoContacto(f => ({ ...f, mail: e.target.value }))} placeholder="juan@email.com" />
                    </div>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <label className="form-label">Nacimiento</label>
                        <input className="input" type="date" value={nuevoContacto.fechaNacimiento} onChange={e => setNuevoContacto(f => ({ ...f, fechaNacimiento: e.target.value }))} />
                      </div>
                      <div>
                        <label className="form-label">Categoria</label>
                        <select className="input" value={nuevoContacto.categoria} onChange={e => setNuevoContacto(f => ({ ...f, categoria: e.target.value as Categoria }))}>
                          {CATEGORIAS.map(c => <option key={c} value={c}>{c}</option>)}
                        </select>
                      </div>
                    </div>
                    <div>
                      <label className="form-label">Sexo</label>
                      <div style={{ display: 'flex', gap: '0.5rem' }}>
                        {(['Masculino', 'Femenino'] as const).map(s => (
                          <button key={s} type="button" onClick={() => setNuevoContacto(f => ({ ...f, sexo: s }))} style={{
                            flex: 1, padding: '0.45rem', borderRadius: '8px', border: '1px solid',
                            fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)', transition: 'all 0.15s',
                            background: nuevoContacto.sexo === s ? (s === 'Masculino' ? 'rgba(96,165,250,0.2)' : 'rgba(244,114,182,0.2)') : 'var(--surface2)',
                            color: nuevoContacto.sexo === s ? (s === 'Masculino' ? '#60a5fa' : '#f472b6') : 'var(--text-dim)',
                            borderColor: nuevoContacto.sexo === s ? (s === 'Masculino' ? 'rgba(96,165,250,0.5)' : 'rgba(244,114,182,0.5)') : 'var(--border)',
                          }}>
                            {s === 'Masculino' ? '♂' : '♀'} {s}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  {(isAdmin || usuario?.rol === 'operador') && (
                    <label style={{ 
                      display: 'flex', 
                      alignItems: 'center', 
                      gap: '0.5rem', 
                      cursor: 'pointer',
                      padding: '0.5rem 0.75rem',
                      background: esSemanal ? 'rgba(34,197,94,0.1)' : 'var(--surface2)',
                      border: `1px solid ${esSemanal ? 'var(--green)' : 'var(--border)'}`,
                      borderRadius: '8px',
                      fontSize: '0.85rem',
                      color: esSemanal ? 'var(--green)' : 'var(--text-dim)',
                    }}>
                      <input 
                        type="checkbox" 
                        checked={esSemanal} 
                        onChange={e => setEsSemanal(e.target.checked)}
                        style={{ width: '16px', height: '16px' }}
                      />
                      🔄 Turno semanal (próximas 12 semanas)
                    </label>
                  )}
                </div>

                <div style={{ display: 'flex', gap: '0.75rem', marginTop: '1rem' }}>
                  <button className="btn-primary" style={{ flex: 1 }} onClick={handleReservar}>Confirmar reserva</button>
                  <button className="btn-secondary" onClick={() => setShowReservaModal(false)}>Cancelar</button>
                </div>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      )}

      {/* ── MODAL REEMPLAZO ── */}
      {showReemplazoModal && pendingGen && (
        <div className="modal-overlay">
          <div className="modal" style={{ maxWidth: '460px' }}>
            <div style={{ textAlign: 'center', marginBottom: '1.5rem' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '0.5rem' }}>⚠️</div>
              <h2 className="font-display" style={{ fontSize: '1.6rem', margin: '0 0 0.5rem', color: 'var(--text)' }}>AGENDA EXISTENTE</h2>
              <p style={{ color: 'var(--text-dim)', fontSize: '0.875rem', margin: 0 }}>
                Esta cancha ya tiene una agenda creada en ese rango de fechas.
              </p>
            </div>

            {pendingGen.reservadosCount > 0 && (
              <div style={{ background: 'rgba(249,115,22,0.08)', border: '1px solid rgba(249,115,22,0.25)', borderRadius: '10px', padding: '0.875rem 1rem', marginBottom: '1.25rem', fontSize: '0.875rem', color: 'var(--text)' }}>
                <strong style={{ color: 'var(--orange)' }}>Atencion:</strong> hay{' '}
                <strong>{pendingGen.reservadosCount} turno{pendingGen.reservadosCount !== 1 ? 's' : ''} reservado{pendingGen.reservadosCount !== 1 ? 's' : ''}</strong>{' '}
                en esa cancha. Podes elegir si conservarlos o eliminarlos.
              </div>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {pendingGen.reservadosCount > 0 && (
                <button
                  className="btn-primary"
                  style={{ width: '100%', padding: '0.75rem' }}
                  onClick={() => confirmarReemplazo(true)}
                >
                  Reemplazar y conservar reservas ({pendingGen.reservadosCount})
                </button>
              )}
              <button
                style={{
                  width: '100%', padding: '0.75rem', borderRadius: '8px',
                  border: '1px solid rgba(248,113,113,0.4)', background: 'rgba(248,113,113,0.08)',
                  color: '#f87171', fontWeight: 600, cursor: 'pointer', fontFamily: 'var(--font-body)',
                  fontSize: '0.875rem',
                }}
                onClick={() => confirmarReemplazo(false)}
              >
                Reemplazar todo (eliminar reservas existentes)
              </button>
              <button
                className="btn-secondary"
                style={{ width: '100%' }}
                onClick={() => { setShowReemplazoModal(false); setPendingGen(null) }}
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
