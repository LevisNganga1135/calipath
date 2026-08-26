import { useState } from 'react'

function AuthModal({ isOpen, onClose, onLogin, onSignup }) {
  const [mode, setMode] = useState('login')
  const [form, setForm] = useState({ name: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

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
