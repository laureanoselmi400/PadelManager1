'use client'
import { useState, useEffect } from 'react'
import { Cancha, getCanchas, saveCancha, updateCancha, deleteCancha, getTurnosByCancha, TipoCancha, TipoSuelo, TipoParedes } from '@/lib/store'

const TIPOS_CANCHA: TipoCancha[] = ['Indoor', 'Outdoor']
const TIPOS_SUELO: TipoSuelo[] = ['Alfombra', 'Cemento']
const TIPOS_PAREDES: TipoParedes[] = ['Blindex', 'Cemento']

type FormData = { numero: string; tipo: TipoCancha; suelo: TipoSuelo; paredes: TipoParedes }
const emptyForm: FormData = { numero: '', tipo: 'Indoor', suelo: 'Alfombra', paredes: 'Blindex' }

const iconCancha = (tipo: TipoCancha) => tipo === 'Indoor' ? '🏠' : '☀️'

export default function CanchasPage() {
  const [canchas, setCanchas] = useState<Cancha[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Cancha | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState('')
  const [turnosCounts, setTurnosCounts] = useState<Record<string, { total: number; reservados: number }>>({})

  const reload = () => {
    const cs = getCanchas()
    setCanchas(cs)
    const counts: Record<string, { total: number; reservados: number }> = {}
    cs.forEach(c => {
      const ts = getTurnosByCancha(c.id)
      counts[c.id] = { total: ts.length, reservados: ts.filter(t => t.reservado).length }
    })
    setTurnosCounts(counts)
  }

  useEffect(() => { reload() }, [])

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true) }
  const openEdit = (c: Cancha) => {
    setEditing(c)
    setForm({ numero: String(c.numero), tipo: c.tipo, suelo: c.suelo, paredes: c.paredes })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    const numero = parseInt(form.numero)
    if (isNaN(numero) || numero < 1) { setError('El número de cancha debe ser un entero positivo'); return }
    if (editing) {
      const result = updateCancha(editing.id, { numero, tipo: form.tipo, suelo: form.suelo, paredes: form.paredes })
      if (result.error) { setError(result.error); return }
    } else {
      const result = saveCancha({ numero, tipo: form.tipo, suelo: form.suelo, paredes: form.paredes })
      if ('error' in result) { setError(result.error); return }
    }
    reload()
    setShowModal(false)
  }

  const handleDelete = (c: Cancha) => {
    const count = turnosCounts[c.id]
    const msg = count?.total > 0
      ? `La cancha ${c.numero} tiene ${count.total} turnos (${count.reservados} reservados). Al eliminarla se borrarán todos sus turnos. Confirmar?`
      : `Eliminar cancha ${c.numero}?`
    if (confirm(msg)) {
      deleteCancha(c.id)
      reload()
    }
  }

  const ToggleGroup = ({ label, options, value, onChange }: { label: string; options: string[]; value: string; onChange: (v: string) => void }) => (
    <div>
      <label className="form-label">{label}</label>
      <div style={{ display: 'flex', gap: '0.5rem' }}>
        {options.map(o => (
          <button
            key={o}
            type="button"
            onClick={() => onChange(o)}
            style={{
              flex: 1,
              padding: '0.5rem',
              borderRadius: '8px',
              border: '1px solid',
              fontSize: '0.8rem',
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: 'var(--font-body)',
              transition: 'all 0.15s',
              background: value === o ? 'rgba(34,197,94,0.15)' : 'var(--surface2)',
              color: value === o ? 'var(--green)' : 'var(--text-dim)',
              borderColor: value === o ? 'rgba(34,197,94,0.4)' : 'var(--border)',
            }}
          >
            {o}
          </button>
        ))}
      </div>
    </div>
  )

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.5rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>CANCHAS</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{canchas.length} canchas registradas</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nueva cancha</button>
      </div>

      {/* Grid de canchas */}
      {canchas.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>🎾</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>No hay canchas registradas.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
          {canchas.map(c => {
            const counts = turnosCounts[c.id] ?? { total: 0, reservados: 0 }
            return (
              <div key={c.id} className="card card-hover" style={{ padding: '1.25rem' }}>
                {/* Header cancha */}
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                    <div style={{
                      width: '48px', height: '48px', borderRadius: '12px',
                      background: 'rgba(34,197,94,0.1)',
                      border: '1px solid rgba(34,197,94,0.25)',
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: '1.4rem',
                    }}>
                      {iconCancha(c.tipo)}
                    </div>
                    <div>
                      <div className="font-display" style={{ fontSize: '1.6rem', color: 'var(--green)', lineHeight: 1 }}>
                        Cancha {c.numero}
                      </div>
                      <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                        {c.tipo}
                      </div>
                    </div>
                  </div>
                </div>

                {/* Specs */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem', marginBottom: '1rem' }}>
                  {[
                    { label: 'Suelo', value: c.suelo },
                    { label: 'Paredes', value: c.paredes },
                  ].map(({ label, value }) => (
                    <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>{label}</span>
                      <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text)' }}>{value}</span>
                    </div>
                  ))}
                </div>

                {/* Stats turnos */}
                <div style={{
                  background: 'var(--surface2)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.75rem',
                  display: 'flex',
                  gap: '1rem',
                  marginBottom: '1rem',
                }}>
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--text)' }}>{counts.total}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Turnos</div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--orange)' }}>{counts.reservados}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Reservados</div>
                  </div>
                  <div style={{ width: '1px', background: 'var(--border)' }} />
                  <div style={{ textAlign: 'center', flex: 1 }}>
                    <div style={{ fontSize: '1.2rem', fontWeight: 700, color: 'var(--green)' }}>{counts.total - counts.reservados}</div>
                    <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Libres</div>
                  </div>
                </div>

                {/* Actions */}
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button className="btn-secondary" style={{ flex: 1 }} onClick={() => openEdit(c)}>Editar</button>
                  <button className="btn-danger" onClick={() => handleDelete(c)}>Eliminar</button>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="font-display" style={{ fontSize: '1.6rem', margin: '0 0 1.25rem', color: 'var(--text)' }}>
              {editing ? `EDITAR CANCHA ${editing.numero}` : 'NUEVA CANCHA'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <div>
                <label className="form-label">Numero de cancha *</label>
                <input
                  className="input"
                  type="number"
                  min="1"
                  required
                  value={form.numero}
                  onChange={e => { setForm(f => ({ ...f, numero: e.target.value })); setError('') }}
                  placeholder="Ej: 4"
                />
              </div>

              <ToggleGroup
                label="Tipo de cancha"
                options={TIPOS_CANCHA}
                value={form.tipo}
                onChange={v => setForm(f => ({ ...f, tipo: v as TipoCancha }))}
              />
              <ToggleGroup
                label="Tipo de suelo"
                options={TIPOS_SUELO}
                value={form.suelo}
                onChange={v => setForm(f => ({ ...f, suelo: v as TipoSuelo }))}
              />
              <ToggleGroup
                label="Tipo de paredes"
                options={TIPOS_PAREDES}
                value={form.paredes}
                onChange={v => setForm(f => ({ ...f, paredes: v as TipoParedes }))}
              />

              {error && (
                <div style={{
                  background: 'rgba(248,113,113,0.1)',
                  border: '1px solid rgba(248,113,113,0.3)',
                  borderRadius: '8px',
                  padding: '0.6rem 0.875rem',
                  fontSize: '0.8rem',
                  color: '#f87171',
                }}>
                  ⚠️ {error}
                </div>
              )}

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }}>
                  {editing ? 'Guardar cambios' : 'Crear cancha'}
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
