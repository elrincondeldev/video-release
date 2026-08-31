const SLUG = import.meta.env.VITE_GITHUB_APP_SLUG
const INSTALL_URL = `https://github.com/apps/${SLUG}/installations/new`

export function GithubCard({ connected }: { connected: boolean }) {
  return (
    <section className="flex items-center justify-between gap-4 rounded-2xl border border-border bg-surface/40 p-5 backdrop-blur-xl">
      <div className="min-w-0">
        <h2 className="text-sm font-semibold tracking-tight">GitHub</h2>
        <p className="mt-0.5 text-sm text-muted">
          {connected
            ? 'Conectado. Grabaremos un vídeo en cada release que publiques.'
            : 'Conecta tu GitHub para grabar un vídeo automáticamente en cada release.'}
        </p>
      </div>
      {connected ? (
        <span className="shrink-0 rounded-md border border-brand/30 bg-brand/10 px-2.5 py-1 text-xs font-medium text-accent">
          Conectado
        </span>
      ) : (
        <a
          href={INSTALL_URL}
          className="shrink-0 rounded-lg bg-brand px-4 py-2 text-sm font-medium text-white transition-all hover:bg-brand/90 hover:shadow-lg hover:shadow-brand/25 active:scale-[0.98]"
        >
          Conectar GitHub
        </a>
      )}
    </section>
  )
}
