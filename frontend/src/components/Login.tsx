import { useState, type ReactNode } from 'react'
import { confirmSignUp, signIn, signUp } from 'aws-amplify/auth'
import { AnimatePresence, motion } from 'motion/react'

type Mode = 'signIn' | 'signUp' | 'confirm'

const inputCls =
  'w-full rounded-lg border border-border bg-black/20 px-3 py-2.5 text-sm outline-none transition focus:border-accent'

function PrimaryButton({
  busy,
  onClick,
  children,
}: {
  busy: boolean
  onClick: () => void
  children: ReactNode
}) {
  return (
    <button
      disabled={busy}
      onClick={onClick}
      className="rounded-lg bg-accent px-4 py-2.5 text-sm font-medium text-white transition hover:brightness-110 disabled:opacity-60"
    >
      {busy ? '…' : children}
    </button>
  )
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

  return (
    <div className="grid min-h-screen place-items-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
        className="w-full max-w-sm rounded-2xl border border-border bg-card p-6 shadow-xl"
      >
        <h1 className="mb-5 text-lg font-semibold">Release Demo Recorder</h1>

        <AnimatePresence mode="wait">
          <motion.div
            key={mode}
            initial={{ opacity: 0, x: 8 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -8 }}
            transition={{ duration: 0.2 }}
            className="flex flex-col gap-3"
          >
            {mode === 'confirm' ? (
              <>
                <p className="text-sm text-muted">
                  Introduce el código que te hemos enviado por email.
                </p>
                <input
                  className={inputCls}
                  placeholder="Código de verificación"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                />
                <PrimaryButton busy={busy} onClick={doConfirm}>
                  Confirmar
                </PrimaryButton>
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
                    <PrimaryButton busy={busy} onClick={doSignIn}>
                      Entrar
                    </PrimaryButton>
                    <p className="text-sm text-muted">
                      ¿No tienes cuenta?{' '}
                      <button className="text-accent hover:underline" onClick={() => setMode('signUp')}>
                        Regístrate
                      </button>
                    </p>
                  </>
                ) : (
                  <>
                    <PrimaryButton busy={busy} onClick={doSignUp}>
                      Crear cuenta
                    </PrimaryButton>
                    <p className="text-sm text-muted">
                      ¿Ya tienes cuenta?{' '}
                      <button className="text-accent hover:underline" onClick={() => setMode('signIn')}>
                        Inicia sesión
                      </button>
                    </p>
                  </>
                )}
              </>
            )}
          </motion.div>
        </AnimatePresence>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}
      </motion.div>
    </div>
  )
}
