import { useEffect, useState, type ChangeEvent, type FormEvent } from 'react'
import { AnimatePresence, motion } from 'motion/react'
import { api } from '../api'
import type { Project, ProjectInput } from '../types'
import { Button, Logo, inputCls } from './ui'

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
    window.scrollTo({ top: 0, behavior: 'smooth' })
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
    <div className="flex flex-col gap-6">
      <section className="rounded-2xl border border-border bg-surface/40 p-6 backdrop-blur-xl">
        <h2 className="mb-4 text-base font-semibold tracking-tight">
          {editingId ? 'Editar proyecto' : 'Nuevo proyecto'}
        </h2>
        <form onSubmit={submit} className="flex flex-col gap-3">
          <input className={inputCls} placeholder="Nombre *" value={form.name} onChange={set('name')} required />
          <input className={inputCls} placeholder="Descripción" value={form.description} onChange={set('description')} />
          <div className="grid gap-3 sm:grid-cols-2">
            <input className={inputCls} placeholder="URL del repo (https://github.com/…)" value={form.repo_url} onChange={set('repo_url')} />
            <input className={inputCls} placeholder="Repo (owner/repo)" value={form.repo_full_name} onChange={set('repo_full_name')} />
          </div>
          <input className={inputCls} placeholder="URL desplegada (https://…)" value={form.deploy_url} onChange={set('deploy_url')} />
          <div className="mt-1 flex items-center gap-2">
            <Button type="submit">{editingId ? 'Guardar cambios' : 'Crear proyecto'}</Button>
            {editingId && (
              <Button type="button" variant="ghost" onClick={reset}>
                Cancelar
              </Button>
            )}
          </div>
        </form>
      </section>

      {error && (
        <p className="rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger">{error}</p>
      )}

      <section>
        <div className="mb-3 flex items-baseline justify-between">
          <h2 className="text-base font-semibold tracking-tight">Tus proyectos</h2>
          {!loading && projects.length > 0 && (
            <span className="text-xs text-muted">
              {projects.length} {projects.length === 1 ? 'proyecto' : 'proyectos'}
            </span>
          )}
        </div>

        {loading ? (
          <p className="text-sm text-muted">Cargando…</p>
        ) : projects.length === 0 ? (
          <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border py-14 text-center">
            <div className="opacity-40">
              <Logo size={30} />
            </div>
            <p className="text-sm text-muted">Aún no tienes proyectos.</p>
            <p className="text-xs text-muted">Crea el primero con el formulario de arriba.</p>
          </div>
        ) : (
          <ul className="flex flex-col gap-2">
            <AnimatePresence initial={false}>
              {projects.map((p) => (
                <motion.li
                  key={p.id}
                  layout
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, height: 0, marginTop: 0 }}
                  transition={{ duration: 0.2, ease: 'easeOut' }}
                  className="group flex items-start justify-between gap-4 rounded-xl border border-border bg-surface/30 p-4 transition-colors hover:border-white/15 hover:bg-surface/50"
                >
                  <div className="min-w-0">
                    <strong className="font-medium tracking-tight">{p.name}</strong>
                    {p.description && <p className="mt-0.5 text-sm text-muted">{p.description}</p>}
                    {p.deploy_url && (
                      <p className="mt-1 truncate text-xs text-muted/80">{p.deploy_url}</p>
                    )}
                  </div>
                  <div className="flex shrink-0 gap-1 opacity-60 transition-opacity group-hover:opacity-100">
                    <button
                      onClick={() => edit(p)}
                      className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-white/5 hover:text-fg"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => remove(p.id)}
                      className="rounded-md px-2 py-1 text-xs text-muted transition-colors hover:bg-danger/10 hover:text-danger"
                    >
                      Eliminar
                    </button>
                  </div>
                </motion.li>
              ))}
            </AnimatePresence>
          </ul>
        )}
      </section>
    </div>
  )
}
