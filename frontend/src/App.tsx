import { lazy, Suspense, useEffect, useState } from 'react'
import { getCurrentUser, signOut } from 'aws-amplify/auth'
import Login from './components/Login'
import { Button, Logo } from './components/ui'

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
    return <div className="grid min-h-screen place-items-center text-sm text-muted">Cargando…</div>
  }

  if (status === 'signedOut') {
    return <Login onSignedIn={refresh} />
  }

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-10 border-b border-border bg-bg/70 backdrop-blur-xl">
        <div className="mx-auto flex max-w-3xl items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2.5">
            <Logo size={22} />
            <span className="text-sm font-medium tracking-tight">Release Demo Recorder</span>
          </div>
          <Button variant="ghost" onClick={handleSignOut}>
            Cerrar sesión
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-3xl px-4 py-8">
        <Suspense fallback={<p className="text-sm text-muted">Cargando…</p>}>
          <Projects />
        </Suspense>
      </main>
    </div>
  )
}
