import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../api'
import type { Project, ProjectInput } from '../types'

interface FormState {
  name: string
  description: string
  repo_url: string
  repo_full_name: string
  deploy_url: string
}

const EMPTY: FormState = {
  name: '',
  description: '',
  repo_url: '',
  repo_full_name: '',
  deploy_url: '',
}

const inputCls =
  'w-full rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm outline-none transition focus:border-accent'

function cleanPayload(form: FormState): ProjectInput {
  const out: Record<string, string> = {}
  for (const [key, value] of Object.entries(form)) {
    const trimmed = value.trim()
    if (trimmed) out[key] = trimmed
  }
  return out as unknown as ProjectInput
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [form, setForm] = useState<FormState>(EMPTY)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

  const load = async () => {
    setError(null)
    try {
      await api.me() // ensures the user profile exists on first login
      setProjects(await api.listProjects())
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Error')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load()
  }, [])

  const edit = (p: Project) => {
    setEditingId(p.id)
    setForm({
      name: p.name ?? '',
      description: p.description ?? '',
      repo_url: p.repo_url ?? '',
      repo_full_name: p.repo_full_name ?? '',
      deploy_url: p.deploy_url ?? '',
    })
  }

  const reset = () => {
    setEditingId(null)
    setForm(EMPTY)
  }

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    setError(null)
    try {
      const payload = cleanPayload(form)
      if (editingId) await api.updateProject(editingId, payload)
      else await api.createProject(payload)
      reset()
      setProjects(await api.listProjects())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const remove = async (id: string) => {
    if (!confirm('¿Eliminar este proyecto?')) return
    setError(null)
    try {
      await api.deleteProject(id)
      setProjects(await api.listProjects())
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Error')
    }
  }

  const set = (key: keyof FormState) => (e: ChangeEvent<HTMLInputElement>) =>
    setForm((prev) => ({ ...prev, [key]: e.target.value }))

  return (
    <div className="flex flex-col gap-4">
      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">
          {editingId ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className={inputCls} placeholder="Nombre *" value={form.name} onChange={set('name')} required />
          <input className={inputCls} placeholder="Descripción" value={form.description} onChange={set('description')} />
          <input className={inputCls} placeholder="URL del repo (https://github.com/…)" value={form.repo_url} onChange={set('repo_url')} />
          <input className={inputCls} placeholder="Repo (owner/repo)" value={form.repo_full_name} onChange={set('repo_full_name')} />
          <input className={inputCls} placeholder="URL desplegada (https://…)" value={form.deploy_url} onChange={set('deploy_url')} />
          <div className="flex items-center gap-3">
            <button
              type="submit"
              className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110"
            >
              {editingId ? 'Guardar' : 'Crear'}
            </button>
            {editingId && (
              <button type="button" onClick={reset} className="text-sm text-accent hover:underline">
                Cancelar
              </button>
            )}
          </div>
        </form>
      </div>

      {error && <p className="text-sm text-danger">{error}</p>}

      <div className="rounded-2xl border border-border bg-card p-5">
        <h2 className="mb-3 text-base font-semibold">Tus proyectos</h2>
        {loading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : projects.length === 0 ? (
          <p className="text-sm text-muted">Aún no tienes proyectos.</p>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {projects.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0 }}
                  transition={{ duration: 0.2 }}
                  className="flex items-start justify-between gap-4 rounded-xl border border-border p-3"
                >
                  <div>
                    <strong className="font-medium">{p.name}</strong>
                    {p.description && <div className="text-sm text-muted">{p.description}</div>}
                    {p.deploy_url && <div className="text-xs text-muted">{p.deploy_url}</div>}
                  </div>
                  <div className="flex shrink-0 gap-3">
                    <button onClick={() => edit(p)} className="text-sm text-accent hover:underline">
                      Editar
                    </button>
                    <button onClick={() => remove(p.id)} className="text-sm text-danger hover:underline">
                      Eliminar
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </div>
    </div>
  )
}
