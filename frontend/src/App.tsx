import { lazy, Suspense, useEffect, useState } from 'react'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import Login from './components/Login'

// Split the authenticated dashboard out of the login bundle.
const Projects = lazy(() => import('./components/Projects'))

type Status = 'loading' | 'signedOut' | 'signedIn'

export default function App() {
  const [status, setStatus] = useState<Status>('loading')

  const refresh = async () => {
    try {
      await getCurrentUser()
      setStatus('signedIn')
    } catch {
      setStatus('signedOut')
    }
  }

  useEffect(() => {
    void refresh()
  }, [])

  const handleSignOut = async () => {
    await signOut()
    setStatus('signedOut')
  }

  if (status === 'loading') {
    return <div className="grid min-h-screen place-items-center text-muted">Cargando…</div>
  }

  if (status === 'signedOut') {
    return <Login onSignedIn={refresh} />
  }

  return (
    <div className="mx-auto max-w-2xl px-4">
      <header className="flex items-center justify-between border-b border-border py-3">
        <strong className="font-semibold">Release Demo Recorder</strong>
        <button onClick={handleSignOut} className="text-sm text-accent hover:underline">
          Cerrar sesión
        </button>
      </header>
      <main className="py-6">
        <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
          <Projects />
        </Suspense>
      </main>
    </div>
  )
}
