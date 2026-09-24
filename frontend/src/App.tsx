import { useState } from 'react'
import Chat from './Chat'
import { getToken, login, register, setToken } from './api'

export default function App() {
  const [token, hold] = useState(getToken())

  const signOut = () => {
    setToken(null)
    hold(null)
  }
  const signIn = (value: string) => {
    setToken(value)
    hold(value)
  }

  return token ? <Chat onSignOut={signOut} /> : <SignIn onSignIn={signIn} />
}

function SignIn({ onSignIn }: { onSignIn: (token: string) => void }) {
  const [joining, setJoining] = useState(false)
  const [gmail, setGmail] = useState('')
  const [username, setUsername] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  async function submit(event: React.FormEvent) {
    event.preventDefault()
    setBusy(true)
    setError('')
    try {
      if (joining) await register(gmail, username, password)
      onSignIn(await login(username, password))
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Something went wrong')
      setBusy(false)
    }
  }

  return (
    <div className="font-sans text-ink flex min-h-dvh items-center justify-center p-5">
      <main className="w-full max-w-sm">
        <h1 className="font-display text-ink mb-1 text-2xl leading-tight">GROWPEDIA</h1>
        <p className="text-bark mb-6 text-sm">
          Ask the Growtopia wiki anything — recipes, drops, mechanics.
        </p>

        <form onSubmit={submit} className="bg-paper block-edge p-6">
          {joining && (
            <Field label="Email" value={gmail} onChange={setGmail} type="email" name="email" />
          )}
          <Field
            label="Username"
            value={username}
            onChange={setUsername}
            name="username"
            autoFocus
          />
          <Field
            label="Password"
            value={password}
            onChange={setPassword}
            type="password"
            name="password"
            hint={joining ? 'At least 8 characters.' : undefined}
          />

          {error && (
            <p className="bg-lava mb-4 px-3 py-2 text-sm font-bold text-white">{error}</p>
          )}

          <button
            type="submit"
            disabled={busy}
            className="bg-grass block-edge active:block-press w-full py-2.5 text-base font-extrabold text-white transition-transform disabled:opacity-60"
          >
            {busy ? 'One moment' : joining ? 'Create account' : 'Sign in'}
          </button>
        </form>

        <button
          onClick={() => {
            setJoining(!joining)
            setError('')
          }}
          className="text-bark mt-5 text-sm underline underline-offset-4"
        >
          {joining ? 'I already have an account' : 'Create an account'}
        </button>
      </main>
    </div>
  )
}

function Field({
  label,
  value,
  onChange,
  hint,
  ...rest
}: {
  label: string
  value: string
  onChange: (value: string) => void
  hint?: string
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'>) {
  return (
    <label className="mb-4 block">
      <span className="mb-1 block text-sm font-bold">{label}</span>
      <input
        {...rest}
        required
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="border-bark bg-loam w-full border-2 px-3 py-2"
      />
      {hint && <span className="text-muted mt-1 block text-xs">{hint}</span>}
    </label>
  )
}
