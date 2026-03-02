'use client'
import { useState, useEffect } from 'react'
import { Contacto, getContactos, saveContacto, updateContacto, deleteContacto, Categoria, Sexo } from '@/lib/store'

const CATEGORIAS: Categoria[] = ['1era', '2da', '3era', '4ta', '5ta', '6ta', '7ma', '8va']
const SEXOS: Sexo[] = ['Masculino', 'Femenino']

const CATEGORIA_COLORS: Record<Categoria, string> = {
  '1era': 'badge-orange',
  '2da': 'badge-orange',
  '3era': 'badge-green',
  '4ta': 'badge-green',
  '5ta': 'badge-gray',
  '6ta': 'badge-gray',
  '7ma': 'badge-gray',
  '8va': 'badge-gray',
}

const empty = {
  nombre: '',
  apellido: '',
  telefono: '',
  fechaNacimiento: '',
  mail: '',
  categoria: '1era' as Categoria,
  sexo: 'Masculino' as Sexo,
}

export default function ContactosPage() {
  const [contactos, setContactos] = useState<Contacto[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Contacto | null>(null)
  const [form, setForm] = useState(empty)
  const [search, setSearch] = useState('')
  const [filterCat, setFilterCat] = useState<string>('Todas')
  const [filterSexo, setFilterSexo] = useState<string>('Todos')

  useEffect(() => { setContactos(getContactos()) }, [])

  const reload = () => setContactos(getContactos())

  const openNew = () => { setEditing(null); setForm(empty); setShowModal(true) }
  const openEdit = (c: Contacto) => {
    setEditing(c)
    setForm({
      nombre: c.nombre,
      apellido: c.apellido,
      telefono: c.telefono,
      fechaNacimiento: c.fechaNacimiento,
      mail: c.mail,
      categoria: c.categoria,
      sexo: c.sexo ?? 'Masculino',
    })
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (editing) {
      updateContacto(editing.id, form)
    } else {
      saveContacto(form)
    }
    reload()
    setShowModal(false)
  }

  const handleDelete = (id: string) => {
    if (confirm('Eliminar este contacto?')) {
      deleteContacto(id)
      reload()
    }
  }

  const filtered = contactos
    .filter(c => filterCat === 'Todas' || c.categoria === filterCat)
    .filter(c => filterSexo === 'Todos' || c.sexo === filterSexo)
    .filter(c => {
      const q = search.toLowerCase()
      return !q || `${c.nombre} ${c.apellido} ${c.mail} ${c.telefono}`.toLowerCase().includes(q)
    })

  return (
    <div style={{ padding: '2rem', maxWidth: '1200px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.5rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>CONTACTOS</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{contactos.length} jugadores registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo contacto</button>
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
        <input
          className="input"
          style={{ width: '240px' }}
          placeholder="Buscar jugador..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />

        {/* Filtro sexo */}
        <div style={{ display: 'flex', gap: '0.4rem' }}>
          {['Todos', ...SEXOS].map(s => (
            <button
              key={s}
              onClick={() => setFilterSexo(s)}
              style={{
                padding: '0.35rem 0.75rem',
                borderRadius: '999px',
                border: '1px solid',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: filterSexo === s ? 'var(--green)' : 'transparent',
                color: filterSexo === s ? '#0a0f0a' : 'var(--text-dim)',
                borderColor: filterSexo === s ? 'var(--green)' : 'var(--border)',
              }}
            >
              {s === 'Masculino' ? '♂ Masc.' : s === 'Femenino' ? '♀ Fem.' : s}
            </button>
          ))}
        </div>

        {/* Filtro categoría */}
        <div style={{ display: 'flex', gap: '0.4rem', flexWrap: 'wrap' }}>
          {['Todas', ...CATEGORIAS].map(cat => (
            <button
              key={cat}
              onClick={() => setFilterCat(cat)}
              style={{
                padding: '0.35rem 0.65rem',
                borderRadius: '999px',
                border: '1px solid',
                fontSize: '0.75rem',
                fontWeight: 500,
                cursor: 'pointer',
                transition: 'all 0.15s',
                background: filterCat === cat ? 'var(--green)' : 'transparent',
                color: filterCat === cat ? '#0a0f0a' : 'var(--text-dim)',
                borderColor: filterCat === cat ? 'var(--green)' : 'var(--border)',
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Table */}
      {filtered.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🏸</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>No hay contactos todavia. Agrega el primero!</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Jugador', 'Sexo', 'Telefono', 'Mail', 'Nacimiento', 'Categoria', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {filtered.map((c, i) => (
                <tr
                  key={c.id}
                  style={{ borderBottom: i < filtered.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ fontWeight: 600, fontSize: '0.875rem' }}>{c.nombre} {c.apellido}</div>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.8rem' }}>
                    <span style={{ color: (c.sexo ?? 'Masculino') === 'Masculino' ? '#60a5fa' : '#f472b6' }}>
                      {(c.sexo ?? 'Masculino') === 'Masculino' ? '♂' : '♀'} {c.sexo ?? 'Masculino'}
                    </span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>{c.telefono}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>{c.mail}</td>
                  <td style={{ padding: '0.75rem 1rem', fontSize: '0.875rem', color: 'var(--text-dim)' }}>
                    {c.fechaNacimiento ? new Date(c.fechaNacimiento + 'T00:00:00').toLocaleDateString('es-AR') : '-'}
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${CATEGORIA_COLORS[c.categoria]}`}>{c.categoria}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => openEdit(c)}>Editar</button>
                      <button className="btn-danger" onClick={() => handleDelete(c.id)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="font-display" style={{ fontSize: '1.6rem', margin: '0 0 1.25rem', color: 'var(--text)' }}>
              {editing ? 'EDITAR CONTACTO' : 'NUEVO CONTACTO'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Nombre</label>
                  <input className="input" required value={form.nombre} onChange={e => setForm(f => ({ ...f, nombre: e.target.value }))} placeholder="Juan" />
                </div>
                <div>
                  <label className="form-label">Apellido</label>
                  <input className="input" required value={form.apellido} onChange={e => setForm(f => ({ ...f, apellido: e.target.value }))} placeholder="Perez" />
                </div>
              </div>
              <div>
                <label className="form-label">Telefono</label>
                <input className="input" required value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+54 9 11 1234-5678" />
              </div>
              <div>
                <label className="form-label">Email</label>
                <input className="input" type="email" value={form.mail} onChange={e => setForm(f => ({ ...f, mail: e.target.value }))} placeholder="juan@email.com" />
              </div>
              <div>
                <label className="form-label">Fecha de nacimiento</label>
                <input className="input" type="date" value={form.fechaNacimiento} onChange={e => setForm(f => ({ ...f, fechaNacimiento: e.target.value }))} />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                <div>
                  <label className="form-label">Categoria</label>
                  <select className="input" value={form.categoria} onChange={e => setForm(f => ({ ...f, categoria: e.target.value as Categoria }))}>
                    {CATEGORIAS.map(cat => <option key={cat} value={cat}>{cat}</option>)}
                  </select>
                </div>
                <div>
                  <label className="form-label">Sexo</label>
                  <div style={{ display: 'flex', gap: '0.5rem', height: '36px' }}>
                    {SEXOS.map(s => (
                      <button
                        key={s}
                        type="button"
                        onClick={() => setForm(f => ({ ...f, sexo: s }))}
                        style={{
                          flex: 1,
                          borderRadius: '8px',
                          border: '1px solid',
                          fontSize: '0.8rem',
                          fontWeight: 600,
                          cursor: 'pointer',
                          transition: 'all 0.15s',
                          fontFamily: 'var(--font-body)',
                          background: form.sexo === s
                            ? (s === 'Masculino' ? 'rgba(96,165,250,0.2)' : 'rgba(244,114,182,0.2)')
                            : 'var(--surface2)',
                          color: form.sexo === s
                            ? (s === 'Masculino' ? '#60a5fa' : '#f472b6')
                            : 'var(--text-dim)',
                          borderColor: form.sexo === s
                            ? (s === 'Masculino' ? 'rgba(96,165,250,0.5)' : 'rgba(244,114,182,0.5)')
                            : 'var(--border)',
                        }}
                      >
                        {s === 'Masculino' ? '♂' : '♀'} {s}
                      </button>
                    ))}
                  </div>
                </div>
              </div>
              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editing ? 'Guardar cambios' : 'Crear contacto'}
                </button>
                <button type="button" className="btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
