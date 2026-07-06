import { useState } from 'react'
import { ArrowRight, LoaderCircle, LogIn, UserPlus } from 'lucide-react'
import { Banner, LogoBadge } from '../components/ui'
import { useAuth } from '../data/auth'

type Mode = 'signin' | 'signup'

export default function AuthScreen() {
  const { signIn, signUp, continueAsGuest } = useAuth()
  const [mode, setMode] = useState<Mode>('signin')
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (busy) return
    setError(null)
    setBusy(true)
    const result =
      mode === 'signup'
        ? await signUp(name, email, password)
        : await signIn(email, password)
    setBusy(false)
    if (!result.ok) setError(result.error ?? 'Something went wrong.')
    // On success the AuthProvider flips currentUser and this screen unmounts.
  }

  function switchMode(next: Mode) {
    setMode(next)
    setError(null)
  }

  return (
    <div className="screen-pad auth-screen">
      <div className="auth-brand">
        <span style={{ transform: 'scale(1.25)' }}>
          <LogoBadge />
        </span>
        <h2 className="section" style={{ marginTop: 14 }}>
          {mode === 'signin' ? 'Welcome back' : 'Create your account'}
        </h2>
        <p className="lead" style={{ marginBottom: 18 }}>
          {mode === 'signin'
            ? 'Sign in to pick up your programs, training maxes, and history.'
            : 'One account keeps your programs, training maxes, and logged sessions saved on this device.'}
        </p>
      </div>

      <div className="row" style={{ gap: 8, marginBottom: 16 }}>
        <button
          className={`chip tap ${mode === 'signin' ? 'active' : ''}`}
          onClick={() => switchMode('signin')}
          type="button"
        >
          <LogIn size={14} /> Sign in
        </button>
        <button
          className={`chip tap ${mode === 'signup' ? 'active' : ''}`}
          onClick={() => switchMode('signup')}
          type="button"
        >
          <UserPlus size={14} /> Sign up
        </button>
      </div>

      <form onSubmit={submit}>
        {mode === 'signup' && (
          <div className="field">
            <label htmlFor="auth-name">Name</label>
            <input
              id="auth-name"
              type="text"
              autoComplete="name"
              value={name}
              placeholder="Alex Lifter"
              onChange={(e) => setName(e.target.value)}
            />
          </div>
        )}
        <div className="field">
          <label htmlFor="auth-email">Email</label>
          <input
            id="auth-email"
            type="email"
            autoComplete="email"
            value={email}
            placeholder="you@example.com"
            onChange={(e) => setEmail(e.target.value)}
          />
        </div>
        <div className="field">
          <label htmlFor="auth-password">Password</label>
          <input
            id="auth-password"
            type="password"
            autoComplete={mode === 'signup' ? 'new-password' : 'current-password'}
            value={password}
            placeholder={mode === 'signup' ? 'At least 6 characters' : 'Your password'}
            onChange={(e) => setPassword(e.target.value)}
          />
        </div>

        {error && (
          <Banner kind="warn">{error}</Banner>
        )}

        <button className="btn primary full" type="submit" disabled={busy}>
          {busy ? (
            <>
              <LoaderCircle size={17} className="spin" />
              {mode === 'signin' ? 'Signing in…' : 'Creating account…'}
            </>
          ) : (
            <>
              {mode === 'signin' ? 'Sign in' : 'Create account'}
              <ArrowRight size={16} />
            </>
          )}
        </button>
      </form>

      <div className="auth-divider"><span>or</span></div>

      <button className="btn ghost full" type="button" onClick={continueAsGuest}>
        Continue as guest
      </button>
      <p className="tiny faint" style={{ textAlign: 'center', marginTop: 10, lineHeight: 1.5 }}>
        Guest mode lets you explore everything — but nothing is saved when you leave.
        Your account data is stored privately on this device.
      </p>
    </div>
  )
}
