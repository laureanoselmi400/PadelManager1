'use client'
import { useState, useEffect } from 'react'
import { getUsuarios, saveUsuario, updateUsuario, deleteUsuario, Rol, Usuario } from '@/lib/usuarios'

const ROLES: { value: Rol; label: string }[] = [
  { value: 'admin', label: 'Administrador' },
  { value: 'operador', label: 'Operador' },
  { value: 'invitado', label: 'Usuario final' },
]

const ROL_COLORS: Record<string, string> = {
  'admin': 'badge-orange',
  'operador': 'badge-green',
  'invitado': 'badge-gray',
  'UsuFinal': 'badge-gray',
}

type FormData = { username: string; dni: string; password: string; telefono: string; email: string; rol: Rol }

const emptyForm: FormData = { username: '', dni: '', password: '', telefono: '', email: '', rol: 'invitado' }

export default function UsuariosPage() {
  const [usuarios, setUsuarios] = useState<Usuario[]>([])
  const [showModal, setShowModal] = useState(false)
  const [editing, setEditing] = useState<Usuario | null>(null)
  const [form, setForm] = useState<FormData>(emptyForm)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  const reload = async () => {
    const data = await getUsuarios()
    setUsuarios(data)
  }

  useEffect(() => { reload() }, [])

  const openNew = () => { setEditing(null); setForm(emptyForm); setError(''); setShowModal(true) }
  const openEdit = (u: Usuario) => {
    setEditing(u)
    setForm({ username: u.username, dni: u.dni, password: '', telefono: u.telefono || '', email: u.email || '', rol: u.rol })
    setError('')
    setShowModal(true)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')

    if (!form.username.trim()) return setError('El username es obligatorio')
    if (!form.dni.trim()) return setError('El DNI es obligatorio')
    if (!form.telefono.trim()) return setError('El teléfono es obligatorio')
    if (!form.password.trim() && !editing) return setError('La contraseña es obligatoria')
    if (!ROLES.some(r => r.value === form.rol)) return setError('El rol es obligatorio')

    setLoading(true)
    try {
      if (editing) {
        const updateData: any = { username: form.username, telefono: form.telefono, email: form.email, rol: form.rol }
        if (form.password) updateData.password = form.password
        const result = await updateUsuario(editing.id, updateData)
        if (result.error) {
          setError(result.error)
          setLoading(false)
          return
        }
      } else {
        const result = await saveUsuario(form)
        if ('error' in result) {
          setError(result.error)
          setLoading(false)
          return
        }
      }
      reload()
      setShowModal(false)
    } catch (err) {
      setError('Error al guardar usuario')
    }
    setLoading(false)
  }

  const handleDelete = async (u: Usuario) => {
    if (confirm(`Eliminar usuario ${u.username}?`)) {
      await deleteUsuario(u.id)
      reload()
    }
  }

  const getRolLabel = (rol: string) => {
    const r = ROLES.find(r => r.value === rol)
    return r ? r.label : rol
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1000px', margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '2rem' }}>
        <div>
          <h1 className="font-display" style={{ fontSize: '2.5rem', color: 'var(--text)', margin: 0, lineHeight: 1 }}>USUARIOS</h1>
          <p style={{ color: 'var(--text-dim)', margin: '0.25rem 0 0', fontSize: '0.875rem' }}>{usuarios.length} usuarios registrados</p>
        </div>
        <button className="btn-primary" onClick={openNew}>+ Nuevo usuario</button>
      </div>

      {usuarios.length === 0 ? (
        <div className="card" style={{ padding: '3rem', textAlign: 'center' }}>
          <div style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>👥</div>
          <p style={{ color: 'var(--text-dim)', margin: 0 }}>No hay usuarios registrados.</p>
        </div>
      ) : (
        <div className="card" style={{ overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid var(--border)' }}>
                {['Usuario', 'DNI', 'Teléfono', 'Email', 'Rol', ''].map(h => (
                  <th key={h} style={{ padding: '0.75rem 1rem', textAlign: 'left', fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '0.08em', fontWeight: 600 }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {usuarios.map((u, i) => (
                <tr
                  key={u.id}
                  style={{ borderBottom: i < usuarios.length - 1 ? '1px solid var(--border)' : 'none', transition: 'background 0.15s' }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'var(--surface2)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '0.75rem 1rem', fontWeight: 600 }}>{u.username}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)' }}>{u.dni}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)' }}>{u.telefono || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem', color: 'var(--text-dim)' }}>{u.email || '-'}</td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <span className={`badge ${ROL_COLORS[u.rol]}`}>{getRolLabel(u.rol)}</span>
                  </td>
                  <td style={{ padding: '0.75rem 1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'flex-end' }}>
                      <button className="btn-secondary" onClick={() => openEdit(u)}>Editar</button>
                      <button className="btn-danger" onClick={() => handleDelete(u)}>Eliminar</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className="modal">
            <h2 className="font-display" style={{ fontSize: '1.6rem', margin: '0 0 1.25rem', color: 'var(--text)' }}>
              {editing ? 'EDITAR USUARIO' : 'NUEVO USUARIO'}
            </h2>
            <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
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

              <div>
                <label className="form-label">Username *</label>
                <input className="input" required value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))} placeholder="Usuario" />
              </div>

              <div>
                <label className="form-label">DNI *</label>
                <input className="input" required value={form.dni} onChange={e => setForm(f => ({ ...f, dni: e.target.value }))} placeholder="12345678" disabled={!!editing} />
              </div>

              <div>
                <label className="form-label">Teléfono *</label>
                <input className="input" required value={form.telefono} onChange={e => setForm(f => ({ ...f, telefono: e.target.value }))} placeholder="+54 9 11 1234-5678" />
              </div>

              <div>
                <label className="form-label">Email (opcional)</label>
                <input className="input" type="email" value={form.email} onChange={e => setForm(f => ({ ...f, email: e.target.value }))} placeholder="email@ejemplo.com" />
              </div>

              <div>
                <label className="form-label">Contraseña {editing ? '(dejar vacío para mantener)' : '*'}</label>
                <input className="input" type="password" value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))} placeholder={editing ? '••••••••' : 'Contraseña'} />
              </div>

              <div>
                <label className="form-label">Rol *</label>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  {ROLES.map(r => (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => setForm(f => ({ ...f, rol: r.value }))}
                      style={{
                        flex: 1,
                        padding: '0.5rem',
                        borderRadius: '8px',
                        border: '1px solid',
                        fontSize: '0.75rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: 'var(--font-body)',
                        transition: 'all 0.15s',
                        background: form.rol === r.value ? 'rgba(34,197,94,0.15)' : 'var(--surface2)',
                        color: form.rol === r.value ? 'var(--green)' : 'var(--text-dim)',
                        borderColor: form.rol === r.value ? 'rgba(34,197,94,0.4)' : 'var(--border)',
                      }}
                    >
                      {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.25rem' }}>
                <button type="submit" className="btn-primary" style={{ flex: 1 }} disabled={loading}>
                  {editing ? 'Guardar cambios' : 'Crear usuario'}
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
