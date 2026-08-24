import { useState } from 'react'
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth'
import { AnimatePresence, motion } from 'motion/react'
import { Button, Logo, inputCls } from './ui'

type Mode = 'signIn' | 'signUp' | 'confirm'

const copy: Record<Mode, { title: string; subtitle: string }> = {
  signIn: { title: 'Bienvenido de nuevo', subtitle: 'Inicia sesión para gestionar tus proyectos.' },
  signUp: { title: 'Crea tu cuenta', subtitle: 'Empieza a grabar demos automáticamente.' },
  confirm: { title: 'Verifica tu email', subtitle: 'Introduce el código que te hemos enviado.' },
}

export default function Login({ onSignedIn }: { onSignedIn: () => void }) {
  const [mode, setMode] = useState<Mode>('signIn')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [code, setCode] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const run = async (fn: () => Promise<void>) => {
    setError(null)
    setBusy(true)
    try {
      await fn()
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Ha ocurrido un error')
    } finally {
      setBusy(false)
    }
  }

  const doSignIn = () =>
    run(async () => {
      const { isSignedIn, nextStep } = await signIn({ username: email, password })
      if (isSignedIn) return onSignedIn()
      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') setMode('confirm')
    })

  const doSignUp = () =>
    run(async () => {
      await signUp({ username: email, password, options: { userAttributes: { email } } })
      setMode('confirm')
    })

  const doConfirm = () =>
    run(async () => {
      await confirmSignUp({ username: email, confirmationCode: code })
      const { isSignedIn } = await signIn({ username: email, password })
      if (isSignedIn) onSignedIn()
      else setMode('signIn')
    })

  const { title, subtitle } = copy[mode]

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 14, scale: 0.98 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        transition={{ duration: 0.4, ease: [0.16, 1, 0.3, 1] }}
        className="w-full max-w-sm rounded-2xl border border-border bg-surface/40 p-7 shadow-2xl shadow-black/50 backdrop-blur-xl"
      >
        <div className="mb-6 flex items-center gap-2.5">
          <Logo />
          <span className="text-sm font-medium tracking-tight text-fg-muted">Release Demo Recorder</span>
        </div>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 10 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -10 }}
            transition={{ duration: 0.22, ease: 'easeOut' }}
          >
            <h1 className="text-xl font-semibold tracking-tight text-fg">{title}</h1>
            <p className="mt-1 mb-5 text-sm text-muted">{subtitle}</p>

            <div className="flex flex-col gap-3">
              {mode === 'confirm' ? (
                <>
                  <input
                    className={inputCls}
                    placeholder="Código de verificación"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    autoFocus
                  />
                  <Button onClick={doConfirm} disabled={busy}>
                    {busy ? 'Verificando…' : 'Confirmar'}
                  </Button>
                </>
              ) : (
                <>
                  <input
                    className={inputCls}
                    type="email"
                    placeholder="Email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                  />
                  <input
                    className={inputCls}
                    type="password"
                    placeholder="Contraseña"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                  {mode === 'signIn' ? (
                    <>
                      <Button onClick={doSignIn} disabled={busy}>
                        {busy ? 'Entrando…' : 'Entrar'}
                      </Button>
                      <p className="text-center text-sm text-muted">
                        ¿No tienes cuenta?{' '}
                        <button className="font-medium text-accent hover:underline" onClick={() => setMode('signUp')}>
                          Regístrate
                        </button>
                      </p>
                    </>
                  ) : (
                    <>
                      <Button onClick={doSignUp} disabled={busy}>
                        {busy ? 'Creando…' : 'Crear cuenta'}
                      </Button>
                      <p className="text-center text-sm text-muted">
                        ¿Ya tienes cuenta?{' '}
                        <button className="font-medium text-accent hover:underline" onClick={() => setMode('signIn')}>
                          Inicia sesión
                        </button>
                      </p>
                    </>
                  )}
                </>
              )}
            </div>
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="mt-4 rounded-lg border border-danger/30 bg-danger/10 px-3 py-2 text-sm text-danger"
          >
            {error}
          </motion.p>
        )}
      </motion.div>
    </div>
  )
}
