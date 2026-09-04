import { useState } from 'react'
import { startAuthentication } from '@simplewebauthn/browser'

const API_BASE = import.meta.env.VITE_API_BASE || 'http://127.0.0.1:5555/api'

function AuthModal({ isOpen, onClose, onLogin, onSignup, onAuthSuccess }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isPasskeyLoading, setIsPasskeyLoading] = useState(false)

  if (!isOpen) return null

  function handleChange(e) {
    const { name, value } = e.target
    setForm((prev) => ({ ...prev, [name]: value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()

    if (mode === 'signup') {
      if (!form.name || !form.email || !form.password) {
        setError('Please fill in all fields.')
        return
      }
    } else {
      if (!form.email || !form.password) {
        setError('Please enter your email and password.')
        return
      }
    }

    setIsSubmitting(true)
    const result = mode === 'signup' ? await onSignup(form) : await onLogin(form)
    setIsSubmitting(false)

    if (!result.success) {
      setError(result.message)
      return
    }

    setForm({ name: '', email: '', password: '' })
    onClose()
  }

  async function handlePasskeyLogin() {
    setIsPasskeyLoading(true)
    setError('')

    try {
      // Step 1: ask the backend for a challenge (usernameless — the browser's
      // passkey picker shows whichever passkeys it has for this site)
      const beginRes = await fetch(`${API_BASE}/auth/passkey/login/begin`, {
        method: 'POST',
      })
      const beginData = await beginRes.json()
      if (!beginRes.ok) throw new Error(beginData.error || 'Could not start passkey sign-in')

      // Step 2: prompt the browser's passkey UI
      const credential = await startAuthentication(beginData.options)

      // Step 3: verify with the backend and get a real session token back
      const completeRes = await fetch(`${API_BASE}/auth/passkey/login/complete`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ credential, token: beginData.token }),
      })
      const completeData = await completeRes.json()
      if (!completeRes.ok) throw new Error(completeData.error || 'Passkey sign-in failed')

      onAuthSuccess(completeData)
      setForm({ name: '', email: '', password: '' })
      onClose()
    } catch (err) {
      // Browser throws this if the user cancels the prompt — not a real error
      if (err.name !== 'NotAllowedError') {
        setError(err.message || 'Passkey sign-in failed')
      }
    } finally {
      setIsPasskeyLoading(false)
    }
  }

  return (
    <div
      className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-charcoal rounded-xl p-6 w-full max-w-sm"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="font-display text-3xl tracking-wide text-chalk mb-1">
          {mode === 'login' ? 'LOG IN' : 'SIGN UP'}
        </h2>
        <p className="text-steel text-xs mb-4">
          Your account is now stored on the server, not just this device.
        </p>

        <button
          type="button"
          onClick={handlePasskeyLogin}
          disabled={isPasskeyLoading}
          className="w-full bg-charcoal-light hover:bg-char text-chalk py-2 rounded-lg font-semibold transition-colors disabled:opacity-60 flex items-center justify-center gap-2 mb-4"
        >
          <span>🔑</span>
          {isPasskeyLoading ? 'Waiting for passkey...' : 'Sign in with a Passkey'}
        </button>

        <div className="flex items-center gap-3 mb-4">
          <div className="flex-1 h-px bg-charcoal-light"></div>
          <span className="text-steel text-xs">or</span>
          <div className="flex-1 h-px bg-charcoal-light"></div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {mode === 'signup' && (
            <input
              type="text"
              name="name"
              value={form.name}
              onChange={handleChange}
              placeholder="Name"
              className="w-full bg-char text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
            />
          )}
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="Email"
            className="w-full bg-char text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
          />
          <input
            type="password"
            name="password"
            value={form.password}
            onChange={handleChange}
            placeholder="Password"
            className="w-full bg-char text-chalk px-3 py-2 rounded-lg focus:outline-none focus:ring-1 focus:ring-ember"
          />

          {error && <p className="text-ember text-sm">{error}</p>}

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full bg-ember hover:bg-ember-dark text-chalk py-2 rounded-lg font-semibold transition-colors disabled:opacity-60"
          >
            {isSubmitting ? 'Please wait...' : mode === 'login' ? 'Log In' : 'Create Account'}
          </button>
        </form>

        <p className="text-steel text-sm mt-4 text-center">
          {mode === 'login' ? "Don't have an account? " : 'Already have an account? '}
          <button
            onClick={() => {
              setMode(mode === 'login' ? 'signup' : 'login')
              setError('')
            }}
            className="text-ember hover:underline"
          >
            {mode === 'login' ? 'Sign up' : 'Log in'}
          </button>
        </p>

        <button
          onClick={onClose}
          className="text-steel hover:text-chalk text-sm mt-4 block mx-auto"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}

export default AuthModal
